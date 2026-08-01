/**
 * CreatureAI — sistema de aggro con tabla de amenaza (estilo WoW simplificado)
 *
 * Estados:
 *   - "patrol":    camina entre puntos cercanos a su spawn, sin objetivo.
 *   - "combat":    tiene al menos un jugador en su tabla de aggro; persigue
 *                  al de mayor amenaza.
 *   - "returning": la tabla de aggro se vació (todos los jugadores se alejaron
 *                  demasiado, o se desconectaron); vuelve caminando a su spawn
 *                  exacto. No puede ser aggreada mientras vuelve (como el
 *                  "evade" de WoW). Al llegar, cura su vida y pasa a "patrol".
 *   - "dead":      hp <= 0. No simula movimiento ni aggro; tras RESPAWN_TIME
 *                  segundos, revive con vida completa en su punto de spawn.
 *
 * Tabla de aggro:
 *   Map<sessionId, threat> — cada jugador cercano entra con una amenaza inicial
 *   que aumenta cuanto más tiempo permanece cerca. El objetivo activo es
 *   siempre el de mayor amenaza. Cuando añadamos combate/daño real, infligir
 *   daño podrá sumar amenaza directamente vía addThreat().
 *
 * Reglas de entrada/salida (evitan el parpadeo del sistema anterior):
 *   - ENTRAR en la tabla: distancia jugador-criatura <= AGGRO_RADIUS.
 *     (Se compara contra la posición ACTUAL de la criatura, que se mueve.)
 *   - SALIR de la tabla: distancia jugador-SPAWN de la criatura > LEASH_RADIUS.
 *     (Se compara contra un punto FIJO, no contra la criatura.)
 *   Al usar puntos de referencia distintos y radios bien separados
 *   (AGGRO_RADIUS < LEASH_RADIUS con margen amplio), un jugador no puede
 *   cumplir ambas condiciones a la vez de forma inestable.
 *   Además, tras salir de la tabla, ese jugador entra en un enfriamiento
 *   (REAGGRO_COOLDOWN) antes de poder volver a aggrear a esta criatura,
 *   como red de seguridad extra ante casos límite.
 *
 * Esto vive enteramente en el servidor — es autoridad total. El cliente
 * solo lee CreatureState y dibuja la posición/rotación que el servidor decide.
 */

const AGGRO_RADIUS = 14;        // radio para ENTRAR en la tabla de aggro (desde la criatura)
const LEASH_RADIUS = 22;        // radio para SALIR de la tabla de aggro (desde el spawn) — bien separado de AGGRO_RADIUS
const REAGGRO_COOLDOWN = 1.5;   // segundos de gracia tras salir de la tabla, antes de poder volver a entrar
const PATROL_SPEED = 1.2;       // más lento que el jugador (3.5) — se puede huir caminando
const COMBAT_SPEED = 2.6;       // más rápido que patrulla, pero aún más lento que el jugador
const RETURN_SPEED = 3.2;       // vuelve a casa relativamente rápido (como el "evade" de WoW)
const PATROL_RADIUS = 5;        // qué tan lejos del spawn patrulla
const WAYPOINT_ARRIVAL_DIST = 0.5;
const RETURN_ARRIVAL_DIST = 0.3;
const THREAT_GAIN_PER_SEC = 1;  // cuánta amenaza acumula un jugador por segundo cerca (sin combate real todavía)
const RESPAWN_TIME = 15;        // segundos muerta antes de revivir en su spawn

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

    this.aggroTable = new Map();       // sessionId -> amenaza acumulada
    this.reaggroCooldowns = new Map(); // sessionId -> segundos restantes de enfriamiento
  }

  pickPatrolWaypoint() {
    const angle = this.rng() * Math.PI * 2;
    const dist = this.rng() * PATROL_RADIUS;
    return {
      x: this.spawnX + Math.cos(angle) * dist,
      z: this.spawnZ + Math.sin(angle) * dist,
    };
  }

  // Llamar cuando un jugador se desconecta, para no dejar referencias colgando.
  removePlayer(sessionId) {
    this.aggroTable.delete(sessionId);
    this.reaggroCooldowns.delete(sessionId);
  }

  // Gancho para cuando exista combate real: infligir daño sube la amenaza directamente.
  addThreat(sessionId, amount) {
    if (this.state.aiState !== 'combat' && this.state.aiState !== 'patrol') return;
    const current = this.aggroTable.get(sessionId) || 0;
    this.aggroTable.set(sessionId, current + amount);
    if (this.state.aiState === 'patrol') {
      this.state.aiState = 'combat';
    }
  }

  // players: array de { sessionId, x, z } (jugadores conectados actualmente)
  update(dt, players) {
    if (this.state.aiState === 'dead') {
      this.deadTimer = (this.deadTimer || 0) + dt;
      if (this.deadTimer >= RESPAWN_TIME) this.respawn();
      return;
    }

    this.tickCooldowns(dt);

    if (this.state.aiState === 'patrol') {
      this.tryEnterCombat(players);
      if (this.state.aiState === 'combat') return; // ya cambió de estado; el resto lo hará el siguiente tick
      this.tickPatrol(dt);
    } else if (this.state.aiState === 'combat') {
      this.updateAggroTable(dt, players);

      if (this.aggroTable.size === 0) {
        this.beginReturning();
        return;
      }
      const target = this.pickHighestThreatTarget(players);
      if (target) this.tickChase(dt, target);
    } else if (this.state.aiState === 'returning') {
      this.tickReturning(dt);
    }
  }

  tickCooldowns(dt) {
    for (const [sessionId, remaining] of this.reaggroCooldowns) {
      const next = remaining - dt;
      if (next <= 0) this.reaggroCooldowns.delete(sessionId);
      else this.reaggroCooldowns.set(sessionId, next);
    }
  }

  tryEnterCombat(players) {
    for (const p of players) {
      if (this.reaggroCooldowns.has(p.sessionId)) continue; // en enfriamiento, no puede volver a aggrear todavía
      const dist = Math.hypot(p.x - this.state.x, p.z - this.state.z);
      if (dist <= AGGRO_RADIUS) {
        this.aggroTable.set(p.sessionId, 1); // amenaza inicial
        this.state.aiState = 'combat';
        console.log(`[IA] ${this.id} entra en COMBATE con ${p.sessionId} (dist=${dist.toFixed(1)}, radio=${AGGRO_RADIUS})`);
      }
    }
  }

  // Añade nuevos jugadores cercanos a la tabla, sube amenaza de los que ya están,
  // y saca de la tabla (individualmente) a quien se aleje demasiado del spawn.
  updateAggroTable(dt, players) {
    const playersBySession = new Map(players.map(p => [p.sessionId, p]));

    // Añadir nuevos jugadores que entren en rango (varios enemigos pueden sumarse a la vez)
    for (const p of players) {
      if (this.aggroTable.has(p.sessionId)) continue;
      if (this.reaggroCooldowns.has(p.sessionId)) continue;
      const dist = Math.hypot(p.x - this.state.x, p.z - this.state.z);
      if (dist <= AGGRO_RADIUS) {
        this.aggroTable.set(p.sessionId, 1);
      }
    }

    // Evaluar salida individual (por jugador) según distancia AL SPAWN de la criatura
    for (const sessionId of [...this.aggroTable.keys()]) {
      const p = playersBySession.get(sessionId);
      if (!p) {
        // Se desconectó: fuera de la tabla, sin enfriamiento (ya no está, no puede oscilar)
        this.aggroTable.delete(sessionId);
        continue;
      }
      const distToSpawn = Math.hypot(p.x - this.spawnX, p.z - this.spawnZ);
      if (distToSpawn > LEASH_RADIUS) {
        this.aggroTable.delete(sessionId);
        this.reaggroCooldowns.set(sessionId, REAGGRO_COOLDOWN);
        console.log(`[IA] ${this.id} pierde de vista a ${sessionId} (correa superada: ${distToSpawn.toFixed(1)} > ${LEASH_RADIUS})`);
        continue;
      }
      // Sigue en rango: acumula amenaza con el tiempo (base para cuando haya daño real)
      const current = this.aggroTable.get(sessionId) || 0;
      this.aggroTable.set(sessionId, current + THREAT_GAIN_PER_SEC * dt);
    }
  }

  // Solo para diagnóstico/logs — no participa en la lógica de aggro en sí.
  findNearestPlayer(players) {
    let best = null;
    for (const p of players) {
      const dist = Math.hypot(p.x - this.state.x, p.z - this.state.z);
      if (!best || dist < best.dist) best = { sessionId: p.sessionId, dist };
    }
    return best;
  }

  pickHighestThreatTarget(players) {
    let bestSessionId = null;
    let bestThreat = -Infinity;
    for (const [sessionId, threat] of this.aggroTable) {
      if (threat > bestThreat) {
        bestThreat = threat;
        bestSessionId = sessionId;
      }
    }
    if (!bestSessionId) return null;
    return players.find(p => p.sessionId === bestSessionId) || null;
  }

  beginReturning() {
    this.state.aiState = 'returning';
    this.aggroTable.clear();
    console.log(`[IA] ${this.id} sin objetivos, vuelve a casa (${this.spawnX.toFixed(1)},${this.spawnZ.toFixed(1)})`);
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
    // Se detiene a una distancia "de combate cuerpo a cuerpo" visible (1.3), no
    // literalmente encima del jugador — si no, queda superpuesto con el modelo
    // del jugador y es casi imposible verlo a simple vista en pantalla pequeña.
    if (dist < 1.3) return;

    const nx = dx / dist;
    const nz = dz / dist;
    this.state.x += nx * COMBAT_SPEED * dt;
    this.state.z += nz * COMBAT_SPEED * dt;
    this.state.rotationY = Math.atan2(nx, nz);
  }

  tickReturning(dt) {
    const dx = this.spawnX - this.state.x;
    const dz = this.spawnZ - this.state.z;
    const dist = Math.hypot(dx, dz);

    if (dist < RETURN_ARRIVAL_DIST) {
      // Llegó a casa: cura y vuelve a patrullar (igual que el "evade" de WoW)
      this.state.x = this.spawnX;
      this.state.z = this.spawnZ;
      this.state.hp = this.state.maxHp;
      this.state.aiState = 'patrol';
      this.waypoint = this.pickPatrolWaypoint();
      console.log(`[IA] ${this.id} llegó a casa, curado y patrullando de nuevo`);
      return;
    }

    const nx = dx / dist;
    const nz = dz / dist;
    this.state.x += nx * RETURN_SPEED * dt;
    this.state.z += nz * RETURN_SPEED * dt;
    this.state.rotationY = Math.atan2(nx, nz);
  }

  takeDamage(amount, attackerSessionId) {
    if (this.state.aiState === 'dead') return;
    this.state.hp = Math.max(0, this.state.hp - amount);
    if (attackerSessionId) this.addThreat(attackerSessionId, amount);
    if (this.state.hp === 0) {
      this.state.aiState = 'dead';
      this.aggroTable.clear();
      this.deadTimer = 0;
    }
  }

  respawn() {
    this.state.x = this.spawnX;
    this.state.z = this.spawnZ;
    this.state.hp = this.state.maxHp;
    this.state.aiState = 'patrol';
    this.deadTimer = 0;
    this.aggroTable.clear();
    this.reaggroCooldowns.clear();
    this.waypoint = this.pickPatrolWaypoint();
  }
}

module.exports = { Creature, AGGRO_RADIUS, LEASH_RADIUS };
