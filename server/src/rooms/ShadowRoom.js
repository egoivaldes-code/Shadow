/**
 * ShadowRoom — sala de juego mínima
 *
 * Responsabilidad de esta sala (según docs/technical/Arquitectura_Inicial.md):
 *   - Es la AUTORIDAD sobre la posición de cada jugador y de cada criatura.
 *   - El cliente ENVÍA una intención de movimiento ("quiero ir en esta dirección").
 *   - El servidor VALIDA (por ahora solo clamp de velocidad) y actualiza el estado.
 *   - Colyseus sincroniza automáticamente ese estado a todos los clientes conectados.
 *
 * Fase 3: criaturas con IA de aggro (game/CreatureAI.js), combate, loot, y
 * persistencia de personaje en Supabase (db/characters.js) — se carga al
 * unirse, se guarda periódicamente y al desconectar.
 *
 * Lo que esta sala NO hace todavía (vendrá en fases posteriores):
 *   - No valida colisiones contra árboles/rocas del mundo (eso vive solo en cliente por ahora).
 *   - No hay chunks en el servidor todavía — todo el mundo es "una sala" única.
 */

const { Room } = require('colyseus');
const { ShadowRoomState, PlayerState, InventorySlotState, CreatureState, LootItemState, LootBagState } = require('../schema/ShadowRoomState');
const { Creature } = require('../game/CreatureAI');
const { loadCharacter, saveCharacter } = require('../db/characters');
const { MAX_INVENTORY_SLOTS, rollDrops, getItemDefinition } = require('../game/items');

const MAX_SPEED = 3.5;       // debe coincidir con PLAYER_SPEED del cliente (index.html)
const TICK_RATE_MS = 50;     // 20 actualizaciones/seg de simulación del servidor
const SAVE_INTERVAL_MS = 15000; // guardar el progreso de cada jugador cada 15s
const RECONNECTION_GRACE_SECONDS = 25; // margen para recuperar la MISMA sesión tras un corte breve (red móvil, etc.)
const MELEE_RANGE = 2.2;     // distancia máxima para golpear (algo más que los 1.3 a los que la criatura se detiene)
const ATTACK_DAMAGE = 5;     // daño por golpe (un lobo de 20 hp muere en 4 golpes)
const ATTACK_COOLDOWN = 1.2; // segundos entre golpes automáticos
const LOOT_EXCLUSIVE_MS = 2 * 60 * 1000; // 2 minutos de derecho exclusivo para quien más daño hizo
const LOOT_PICKUP_RANGE = 2.5; // hay que estar cerca de la bolsa para poder saquearla
const GOLD_MIN = 3, GOLD_MAX = 10; // oro que suelta un lobo al morir

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

// Transformación isométrica: DEBE ser idéntica a isoForward/isoRight del
// cliente (index.html). El cliente mueve tu personaje EN PANTALLA usando esta
// rotación de 45°, pero durante mucho tiempo el servidor aplicaba el
// input crudo del joystick como si fuera dirección de mundo directa —
// resultado: tu posición visual y tu posición real (la que cuenta para el
// aggro de las criaturas) divergían desde el primer paso que dabas. Este es
// el motivo real por el que "acercarse" a un lobo nunca funcionaba bien.
const ISO_FORWARD = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
const ISO_RIGHT = { x: Math.SQRT1_2, z: -Math.SQRT1_2 };

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

    // sessionId (cambia cada conexión) -> playerId (estable entre sesiones,
    // generado por el navegador y guardado en localStorage). Necesario para
    // saber a quién pertenece cada guardado en Supabase.
    this.playerIds = new Map();

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

    // Saqueo: el cliente pide coger un item concreto de una bolsa. El servidor
    // valida todo (proximidad, derecho exclusivo) — nunca confía en lo que pida el cliente.
    this._nextLootBagId = 1;
    this.onMessage('takeLootItem', (client, message) => {
      this.handleTakeLootItem(client, message);
    });

    // Bucle de simulación del servidor — aquí es donde el servidor
    // es la autoridad: aplica movimiento según su propio reloj, no el del cliente.
    this.setSimulationInterval(() => this.tick(), TICK_RATE_MS);

    // Guardado periódico del progreso de cada jugador conectado (best-effort:
    // si el servidor se reinicia entre guardados, se pierde como mucho lo que
    // pasó en los últimos SAVE_INTERVAL_MS segundos).
    this.clock.setInterval(() => this.saveAllPlayers(), SAVE_INTERVAL_MS);

    console.log('[ShadowRoom] Sala creada:', this.roomId);
  }

  async saveAllPlayers() {
    for (const [sessionId, player] of this.state.players) {
      const playerId = this.playerIds.get(sessionId);
      if (playerId) await saveCharacter(playerId, player);
    }
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

  // Crea una bolsa de loot en la posición de una criatura recién muerta.
  // Dueño exclusivo: quien más amenaza (daño) acumuló, durante LOOT_EXCLUSIVE_MS.
  createLootBag(creature) {
    const bagId = `loot_${this._nextLootBagId++}`;
    const bag = new LootBagState();
    bag.x = creature.state.x;
    bag.z = creature.state.z;
    bag.ownerSessionId = creature.lastKillerSessionId || '';
    bag.exclusiveUntil = Date.now() + LOOT_EXCLUSIVE_MS;

    const goldAmount = GOLD_MIN + Math.floor(Math.random() * (GOLD_MAX - GOLD_MIN + 1));
    const goldItem = new LootItemState();
    goldItem.itemId = `${bagId}_gold`;
    goldItem.kind = 'gold';
    goldItem.amount = goldAmount;
    bag.items.set(goldItem.itemId, goldItem);

    // Objetos según la tabla de drops del tipo de criatura (piel, colmillo, etc.)
    const drops = rollDrops(creature.state.kind);
    drops.forEach((drop, i) => {
      const def = getItemDefinition(drop.itemType);
      const item = new LootItemState();
      item.itemId = `${bagId}_item_${i}`;
      item.kind = 'item';
      item.itemType = drop.itemType;
      item.name = def.name;
      item.rarity = def.rarity;
      item.amount = drop.amount;
      bag.items.set(item.itemId, item);
    });

    this.state.lootBags.set(bagId, bag);
    console.log(`[Loot] Bolsa ${bagId} creada en (${bag.x.toFixed(1)},${bag.z.toFixed(1)}) — dueño: ${bag.ownerSessionId || 'nadie'}, oro=${goldAmount}, objetos=${drops.map(d => d.itemType).join(',') || 'ninguno'}`);
  }

  handleTakeLootItem(client, message) {
    const sessionId = client.sessionId;
    const player = this.state.players.get(sessionId);
    if (!player) return;

    const bagId = message?.bagId;
    const itemId = message?.itemId;
    const bag = this.state.lootBags.get(bagId);
    if (!bag) return; // la bolsa ya no existe (alguien se la llevó entera, o nunca existió)

    // Derecho exclusivo: solo el dueño puede saquear mientras no haya pasado el tiempo
    const now = Date.now();
    if (now < bag.exclusiveUntil && bag.ownerSessionId && bag.ownerSessionId !== sessionId) {
      return; // no es tu bolsa todavía, ignorar en silencio
    }

    // Proximidad: hay que estar físicamente cerca para saquear
    const dist = Math.hypot(player.x - bag.x, player.z - bag.z);
    if (dist > LOOT_PICKUP_RANGE) return;

    const item = bag.items.get(itemId);
    if (!item) return;

    if (item.kind === 'gold') {
      player.gold += item.amount;
    } else if (item.kind === 'item') {
      const existing = player.inventory.get(item.itemType);
      if (existing) {
        // Ya tienes ese tipo de objeto: se apila, no ocupa slot nuevo.
        existing.quantity += item.amount;
      } else if (player.inventory.size < MAX_INVENTORY_SLOTS) {
        const slot = new InventorySlotState();
        slot.itemType = item.itemType;
        slot.name = item.name;
        slot.rarity = item.rarity;
        slot.quantity = item.amount;
        player.inventory.set(item.itemType, slot);
      } else {
        // Inventario lleno (20 tipos distintos): avisamos al cliente y no
        // quitamos el objeto de la bolsa, para que pueda volver a por él luego.
        client.send('inventoryFull', { itemName: item.name });
        return;
      }
    }

    bag.items.delete(itemId);
    if (bag.items.size === 0) {
      this.state.lootBags.delete(bagId);
      console.log(`[Loot] Bolsa ${bagId} vaciada y eliminada`);
    }
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

      // Mismo cálculo que el cliente: convierte el input crudo del joystick/
      // teclado en dirección de mundo real, rotada 45° para la cámara isométrica.
      const moveX = ISO_FORWARD.x * (-nz) + ISO_RIGHT.x * nx;
      const moveZ = ISO_FORWARD.z * (-nz) + ISO_RIGHT.z * nx;

      player.x += moveX * MAX_SPEED * dt * speedFactor;
      player.z += moveZ * MAX_SPEED * dt * speedFactor;
      player.rotationY = Math.atan2(moveX, moveZ);
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

      if (creature.state.aiState === 'dead') {
        this.createLootBag(creature);
      }
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

  async onJoin(client, options) {
    // playerId: identificador estable generado por el navegador (localStorage),
    // distinto del sessionId de Colyseus (que cambia cada conexión). Si el
    // cliente no manda uno (versión vieja, o Supabase aún sin configurar),
    // simplemente no habrá persistencia para esta sesión.
    const playerId = typeof options?.playerId === 'string' ? options.playerId.slice(0, 64) : null;
    if (playerId) this.playerIds.set(client.sessionId, playerId);

    const player = new PlayerState();
    player.name = (options?.name || 'Jugador').slice(0, 20);
    player.x = 0;
    player.y = 0;
    player.z = 0;

    const saved = playerId ? await loadCharacter(playerId) : null;
    if (saved) {
      player.x = saved.x;
      player.y = saved.y;
      player.z = saved.z;
      player.gold = saved.gold;
      player.hp = saved.hp;
      player.maxHp = saved.max_hp;
      if (saved.name) player.name = saved.name;

      if (Array.isArray(saved.inventory)) {
        for (const slotData of saved.inventory) {
          const slot = new InventorySlotState();
          slot.itemType = slotData.itemType;
          slot.name = slotData.name;
          slot.rarity = slotData.rarity;
          slot.quantity = slotData.quantity;
          player.inventory.set(slotData.itemType, slot);
        }
      }

      console.log(`[ShadowRoom] Personaje restaurado para ${playerId}: oro=${saved.gold}, objetos=${(saved.inventory || []).length}, pos=(${saved.x.toFixed(1)},${saved.z.toFixed(1)})`);
    }

    this.state.players.set(client.sessionId, player);
    console.log(`[ShadowRoom] ${client.sessionId} se unió (${this.state.players.size} jugadores)`);
  }

  async onLeave(client, consented) {
    // Si el jugador cerró sesión voluntariamente (consented=true), no tiene
    // sentido esperar a que "vuelva" — limpiamos ya. Pero si la conexión se
    // cortó de golpe (red móvil, cambio de wifi a datos, etc.), le damos un
    // margen para recuperar la MISMA sesión antes de darle de baja del todo.
    // Esto evita "fantasmas": jugadores que las criaturas siguen persiguiendo,
    // o compañeros que dejan de verse el uno al otro tras un corte breve.
    if (!consented) {
      try {
        await this.allowReconnection(client, RECONNECTION_GRACE_SECONDS);
        console.log(`[ShadowRoom] ${client.sessionId} se reconectó a tiempo, sigue en la partida`);
        return; // reconectó: NO limpiamos su estado, sigue siendo el mismo jugador
      } catch (e) {
        // No volvió a tiempo: continuamos con la limpieza normal más abajo.
        console.log(`[ShadowRoom] ${client.sessionId} no se reconectó a tiempo, se da de baja`);
      }
    }

    const playerId = this.playerIds.get(client.sessionId);
    const player = this.state.players.get(client.sessionId);
    if (playerId && player) {
      await saveCharacter(playerId, player);
    }

    this.state.players.delete(client.sessionId);
    this.inputs.delete(client.sessionId);
    this.attackCooldowns.delete(client.sessionId);
    this.playerIds.delete(client.sessionId);
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
