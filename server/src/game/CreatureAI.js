/**
 * CreatureAI — máquina de estados mínima para criaturas enemigas
 *
 * Estados:
 *   - "patrol": la criatura camina entre puntos cercanos a su posición de spawn.
 *   - "chase":  detectó a un jugador dentro de su radio de aggro y lo persigue.
 *   - "dead":   HP <= 0, deja de simular movimiento (Fase 4 añadirá respawn/loot).
 *
 * Esto vive enteramente en el servidor — es autoridad total. El cliente
 * solo lee CreatureState y dibuja la posición/rotación que el servidor decide.
 */

const AGGRO_RADIUS = 8;     // distancia a la que la criatura empieza a perseguir
const LEASH_RADIUS = 16;    // si el jugador se aleja más que esto del punto de spawn, vuelve a patrullar
const PATROL_SPEED = 1.2;   // más lento que el jugador (3.5) — se puede huir caminando
const CHASE_SPEED = 2.6;    // más rápido que patrulla, pero aún más lento que el jugador
const PATROL_RADIUS = 5;    // qué tan lejos del spawn patrulla
const WAYPOINT_ARRIVAL_DIST = 0.5;

class Creature {
  constructor(id, state, spawnX, spawnZ, rng) {
    this.id = id;
    this.state = state; // instancia de CreatureState (sincronizada)
    this.spawnX = spawnX;
    this.spawnZ = spawnZ;
    this.rng = rng;
    this.state.x = spawnX;
    this.state.z = spawnZ;
    this.waypoint = this.pickPatrolWaypoint();
    this.waitTimer = 0; // pausa entre waypoints, para que no parezca robótico
  }

  pickPatrolWaypoint() {
    const angle = this.rng() * Math.PI * 2;
    const dist = this.rng() * PATROL_RADIUS;
    return {
      x: this.spawnX + Math.cos(angle) * dist,
      z: this.spawnZ + Math.sin(angle) * dist,
    };
  }

  // players: iterable de { sessionId, x, z } (jugadores vivos actuales)
  update(dt, players) {
    if (this.state.aiState === 'dead') return;

    const nearest = this.findNearestPlayer(players);

    if (this.state.aiState === 'patrol') {
      if (nearest && nearest.dist <= AGGRO_RADIUS) {
        this.state.aiState = 'chase';
        this.targetSessionId = nearest.sessionId;
        return;
      }
      this.tickPatrol(dt);
    } else if (this.state.aiState === 'chase') {
      const target = players.find(p => p.sessionId === this.targetSessionId);
      const distToSpawn = target ? Math.hypot(this.state.x - this.spawnX, this.state.z - this.spawnZ) : Infinity;

      if (!target || distToSpawn > LEASH_RADIUS) {
        // El jugador se fue o nos alejamos demasiado del territorio: volver a patrullar
        this.state.aiState = 'patrol';
        this.targetSessionId = null;
        this.waypoint = this.pickPatrolWaypoint();
        return;
      }
      this.tickChase(dt, target);
    }
  }

  findNearestPlayer(players) {
    let best = null;
    for (const p of players) {
      const dist = Math.hypot(p.x - this.state.x, p.z - this.state.z);
      if (!best || dist < best.dist) best = { sessionId: p.sessionId, dist };
    }
    return best;
  }

  tickPatrol(dt) {
    const dx = this.waypoint.x - this.state.x;
    const dz = this.waypoint.z - this.state.z;
    const dist = Math.hypot(dx, dz);

    if (dist < WAYPOINT_ARRIVAL_DIST) {
      // Llegó al waypoint: espera un poco antes de elegir otro (se siente más natural)
      this.waitTimer += dt;
      if (this.waitTimer > 2) {
        this.waypoint = this.pickPatrolWaypoint();
        this.waitTimer = 0;
      }
      return;
    }

    const nx = dx / dist;
    const nz = dz / dist;
    this.state.x += nx * PATROL_SPEED * dt;
    this.state.z += nz * PATROL_SPEED * dt;
    this.state.rotationY = Math.atan2(nx, nz);
  }

  tickChase(dt, target) {
    const dx = target.x - this.state.x;
    const dz = target.z - this.state.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.6) return; // ya está "encima" del jugador, no hace falta seguir empujando

    const nx = dx / dist;
    const nz = dz / dist;
    this.state.x += nx * CHASE_SPEED * dt;
    this.state.z += nz * CHASE_SPEED * dt;
    this.state.rotationY = Math.atan2(nx, nz);
  }

  takeDamage(amount) {
    if (this.state.aiState === 'dead') return;
    this.state.hp = Math.max(0, this.state.hp - amount);
    if (this.state.hp === 0) {
      this.state.aiState = 'dead';
    }
  }
}

module.exports = { Creature, AGGRO_RADIUS };
