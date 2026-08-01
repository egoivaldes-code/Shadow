/**
 * ShadowRoom — sala de juego mínima
 *
 * Responsabilidad de esta sala (según docs/technical/Arquitectura_Inicial.md):
 *   - Es la AUTORIDAD sobre la posición de cada jugador.
 *   - El cliente ENVÍA una intención de movimiento ("quiero ir en esta dirección").
 *   - El servidor VALIDA (por ahora solo clamp de velocidad) y actualiza el estado.
 *   - Colyseus sincroniza automáticamente ese estado a todos los clientes conectados.
 *
 * Lo que esta sala NO hace todavía (vendrá en fases posteriores):
 *   - No valida colisiones contra árboles/rocas del mundo (eso vive solo en cliente por ahora).
 *   - No persiste nada en base de datos (Supabase vendrá en Fase 3).
 *   - No hay chunks en el servidor todavía — todo el mundo es "una sala" única.
 */

/**
 * ShadowRoom — sala de juego mínima
 *
 * Responsabilidad de esta sala (según docs/technical/Arquitectura_Inicial.md):
 *   - Es la AUTORIDAD sobre la posición de cada jugador y de cada criatura.
 *   - El cliente ENVÍA una intención de movimiento ("quiero ir en esta dirección").
 *   - El servidor VALIDA (por ahora solo clamp de velocidad) y actualiza el estado.
 *   - Colyseus sincroniza automáticamente ese estado a todos los clientes conectados.
 *
 * Fase 3: se añaden criaturas con IA de patrulla/persecución (ver game/CreatureAI.js).
 *
 * Lo que esta sala NO hace todavía (vendrá en fases posteriores):
 *   - No valida colisiones contra árboles/rocas del mundo (eso vive solo en cliente por ahora).
 *   - No persiste nada en base de datos (Supabase vendrá más adelante).
 *   - No hay chunks en el servidor todavía — todo el mundo es "una sala" única.
 *   - No hay combate del jugador contra la criatura todavía — eso es el siguiente paso de la Fase 3.
 */

const { Room } = require('colyseus');
const { ShadowRoomState, PlayerState, CreatureState } = require('../schema/ShadowRoomState');
const { Creature } = require('../game/CreatureAI');

const MAX_SPEED = 3.5;       // debe coincidir con PLAYER_SPEED del cliente (index.html)
const TICK_RATE_MS = 50;     // 20 actualizaciones/seg de simulación del servidor
const MELEE_RANGE = 2.2;     // distancia máxima para golpear (algo más que los 1.3 a los que la criatura se detiene)
const ATTACK_DAMAGE = 5;     // daño por golpe (un lobo de 20 hp muere en 4 golpes)
const ATTACK_COOLDOWN = 1.2; // segundos entre golpes automáticos

// Puntos de spawn de criaturas de referencia, repartidos alrededor del origen
// (mismo chunk 0,0 que ya genera el cliente). En una fase posterior esto vendrá
// de datos de chunk en vez de estar escrito a mano.
const CREATURE_SPAWNS = [
  { x: 15, z: 8, kind: 'wolf' },
  { x: -18, z: 12, kind: 'wolf' },
  { x: 10, z: -20, kind: 'wolf' },
  { x: -12, z: -15, kind: 'wolf' },
];

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class ShadowRoom extends Room {

  onCreate(options) {
    this.setState(new ShadowRoomState());
    this.maxClients = 50; // límite orientativo para esta fase de pruebas

    // Por defecto, Colyseus destruye la sala si nadie completa la conexión
    // en 15 segundos desde que se crea (this.seatReservationTime). En el plan
    // gratuito de Render, el servidor puede tardar en "despertar" de estar
    // dormido (cold start) más que eso, y la sala se autodestruía antes de que
    // el jugador llegara a conectar de verdad. Lo ampliamos a un margen generoso.
    this.seatReservationTime = 40;

    // Guardamos la última intención de movimiento por jugador.
    // El cliente manda esto muchas veces por segundo; el servidor
    // solo la aplica en su propio tick, para no depender de la frecuencia del cliente.
    this.inputs = new Map();

    // Cooldown de ataque por jugador (segundos restantes hasta poder golpear de nuevo).
    // Vive solo en el servidor, no se sincroniza — el cliente no necesita saberlo.
    this.attackCooldowns = new Map();

    // Instancias de Creature (lógica de IA), indexadas igual que this.state.creatures
    this.creatures = new Map();
    this.spawnCreatures();

    this.onMessage('move', (client, message) => {
      // message esperado: { dx: number, dz: number } normalizado entre -1 y 1
      const dx = clamp(Number(message?.dx) || 0, -1, 1);
      const dz = clamp(Number(message?.dz) || 0, -1, 1);
      this.inputs.set(client.sessionId, { dx, dz });
    });

    this.onMessage('setName', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && typeof message?.name === 'string') {
        player.name = message.name.slice(0, 20); // evitar nombres absurdamente largos
      }
    });

    // "Modo guerra": el jugador activa esto con un botón. Mientras esté activo,
    // si tiene un objetivo válido y está a rango, ataca automáticamente (con cooldown).
    this.onMessage('setWarMode', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.warMode = !!message?.active;
      if (!player.warMode) player.targetId = ''; // salir de modo guerra suelta el objetivo
    });

    // El cliente manda esto al tocar una criatura en pantalla (solo tiene efecto
    // real si el jugador está en modo guerra; el servidor no confía en el cliente
    // para decidir si el objetivo es válido o está en rango, eso se revisa en tick()).
    this.onMessage('setTarget', (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.warMode) return;
      const targetId = typeof message?.targetId === 'string' ? message.targetId : '';
      if (targetId && !this.state.creatures.has(targetId)) return; // objetivo inexistente, ignorar
      player.targetId = targetId;
    });

    // Bucle de simulación del servidor — aquí es donde el servidor
    // es la autoridad: aplica movimiento según su propio reloj, no el del cliente.
    this.setSimulationInterval(() => this.tick(), TICK_RATE_MS);

    console.log('[ShadowRoom] Sala creada:', this.roomId);
  }

  spawnCreatures() {
    // Semilla fija por sala: reproducible mientras la sala viva, distinta entre salas.
    const rng = mulberry32(Date.now() & 0xffffffff);

    CREATURE_SPAWNS.forEach((spawn, i) => {
      const id = `creature_${i}`;
      const state = new CreatureState();
      state.kind = spawn.kind;
      this.state.creatures.set(id, state);

      const creature = new Creature(id, state, spawn.x, spawn.z, rng);
      this.creatures.set(id, creature);
    });

    console.log(`[ShadowRoom] ${this.creatures.size} criaturas generadas`);
  }

  tick() {
    const dt = TICK_RATE_MS / 1000;

    // --- Movimiento de jugadores ---
    for (const [sessionId, input] of this.inputs) {
      const player = this.state.players.get(sessionId);
      if (!player) continue;

      const len = Math.hypot(input.dx, input.dz);
      if (len < 0.001) continue;

      const nx = input.dx / Math.max(len, 1);
      const nz = input.dz / Math.max(len, 1);
      const speedFactor = Math.min(len, 1);

      player.x += nx * MAX_SPEED * dt * speedFactor;
      player.z += nz * MAX_SPEED * dt * speedFactor;
      player.rotationY = Math.atan2(nx, nz);
    }

    // --- IA de criaturas ---
    // Lista plana de jugadores vivos, para que cada criatura busque al más cercano.
    const playerList = [];
    for (const [sessionId, p] of this.state.players) {
      playerList.push({ sessionId, x: p.x, z: p.z });
    }
    for (const creature of this.creatures.values()) {
      creature.update(dt, playerList);
    }

    // --- Combate: ataque automático en modo guerra ---
    // Reglas validadas por el servidor (nunca se confía en lo que "dice" el cliente):
    // el jugador debe tener warMode activo, un targetId que apunte a una criatura
    // viva, estar a MELEE_RANGE de distancia, y no estar en cooldown.
    for (const [sessionId, remaining] of this.attackCooldowns) {
      const next = remaining - dt;
      if (next <= 0) this.attackCooldowns.delete(sessionId);
      else this.attackCooldowns.set(sessionId, next);
    }

    for (const [sessionId, player] of this.state.players) {
      if (!player.warMode || !player.targetId) continue;
      const creature = this.creatures.get(player.targetId);
      if (!creature || creature.state.aiState === 'dead') {
        player.targetId = ''; // objetivo ya no válido (murió o no existe), soltar
        continue;
      }
      if (this.attackCooldowns.has(sessionId)) continue; // aún recargando

      const dist = Math.hypot(player.x - creature.state.x, player.z - creature.state.z);
      if (dist > MELEE_RANGE) continue; // fuera de alcance, no golpea todavía

      creature.takeDamage(ATTACK_DAMAGE, sessionId);
      this.attackCooldowns.set(sessionId, ATTACK_COOLDOWN);
    }

    // Diagnóstico periódico (cada ~5s, no en cada tick): útil para confirmar en los
    // logs de Render que el servidor está calculando distancias reales de aggro.
    this._debugTimer = (this._debugTimer || 0) + dt;
    if (this._debugTimer >= 5 && playerList.length > 0) {
      this._debugTimer = 0;
      for (const creature of this.creatures.values()) {
        if (creature.state.aiState === 'dead') continue;
        const nearest = creature.findNearestPlayer ? creature.findNearestPlayer(playerList) : null;
        const distTxt = nearest ? nearest.dist.toFixed(1) : 'n/a';
        console.log(`[Diag] ${creature.id} aiState=${creature.state.aiState} pos=(${creature.state.x.toFixed(1)},${creature.state.z.toFixed(1)}) jugador_mas_cercano_dist=${distTxt}`);
      }
    }
  }

  onJoin(client, options) {
    const player = new PlayerState();
    player.name = (options?.name || 'Jugador').slice(0, 20);
    // Spawn simple: todos entran cerca del origen por ahora.
    player.x = 0;
    player.y = 0;
    player.z = 0;
    this.state.players.set(client.sessionId, player);

    console.log(`[ShadowRoom] ${client.sessionId} se unió (${this.state.players.size} jugadores)`);
  }

  onLeave(client, consented) {
    this.state.players.delete(client.sessionId);
    this.inputs.delete(client.sessionId);
    this.attackCooldowns.delete(client.sessionId);
    for (const creature of this.creatures.values()) {
      creature.removePlayer(client.sessionId);
    }
    console.log(`[ShadowRoom] ${client.sessionId} salió (${this.state.players.size} jugadores)`);
  }

  onDispose() {
    console.log('[ShadowRoom] Sala destruida:', this.roomId);
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

module.exports = { ShadowRoom };
