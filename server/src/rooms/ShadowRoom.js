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

const { Room } = require('colyseus');
const { ShadowRoomState, PlayerState } = require('../schema/ShadowRoomState');

const MAX_SPEED = 3.5;       // debe coincidir con PLAYER_SPEED del cliente (index.html)
const TICK_RATE_MS = 50;     // 20 actualizaciones/seg de simulación del servidor

class ShadowRoom extends Room {

  onCreate(options) {
    this.setState(new ShadowRoomState());
    this.maxClients = 50; // límite orientativo para esta fase de pruebas

    // Guardamos la última intención de movimiento por jugador.
    // El cliente manda esto muchas veces por segundo; el servidor
    // solo la aplica en su propio tick, para no depender de la frecuencia del cliente.
    this.inputs = new Map();

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

    // Bucle de simulación del servidor — aquí es donde el servidor
    // es la autoridad: aplica movimiento según su propio reloj, no el del cliente.
    this.setSimulationInterval(() => this.tick(), TICK_RATE_MS);

    console.log('[ShadowRoom] Sala creada:', this.roomId);
  }

  tick() {
    const dt = TICK_RATE_MS / 1000;

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
