/**
 * Esquema de estado compartido — Shadow Room
 *
 * Esto define QUÉ datos se sincronizan automáticamente entre todos los clientes
 * conectados a la misma sala. Colyseus se encarga de mandar solo los cambios
 * (delta), no el estado completo en cada frame — así ahorramos ancho de banda.
 *
 * Fase 3: se añade CreatureState — el servidor es la autoridad total sobre
 * las criaturas (posición, vida, estado de IA). El cliente solo las dibuja.
 */

const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');

class PlayerState extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.rotationY = 0;
    this.name = 'Jugador';
    this.hp = 30;
    this.maxHp = 30;
    this.warMode = false;
    this.targetId = ''; // id de la criatura objetivo, vacío si no hay
  }
}
defineTypes(PlayerState, {
  x: 'number',
  y: 'number',
  z: 'number',
  rotationY: 'number',
  name: 'string',
  hp: 'number',
  maxHp: 'number',
  warMode: 'boolean',
  targetId: 'string',
});

class CreatureState extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.rotationY = 0;
    this.hp = 20;
    this.maxHp = 20;
    this.aiState = 'patrol'; // 'patrol' | 'combat' | 'returning' | 'dead'
    this.kind = 'wolf';
  }
}
defineTypes(CreatureState, {
  x: 'number',
  y: 'number',
  z: 'number',
  rotationY: 'number',
  hp: 'number',
  maxHp: 'number',
  aiState: 'string',
  kind: 'string',
});

class ShadowRoomState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.creatures = new MapSchema();
  }
}
defineTypes(ShadowRoomState, {
  players: { map: PlayerState },
  creatures: { map: CreatureState },
});

module.exports = { PlayerState, CreatureState, ShadowRoomState };
