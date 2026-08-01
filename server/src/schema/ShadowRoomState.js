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
    this.gold = 0;
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
  gold: 'number',
});

// Un objeto individual dentro de una bolsa de loot. De momento solo existe
// el tipo "gold"; está preparado para añadir tipos de item/material después
// (sección 16 del GDD) sin tener que rehacer el esquema.
class LootItemState extends Schema {
  constructor() {
    super();
    this.itemId = '';   // id único dentro de la bolsa, para poder coger uno concreto
    this.kind = 'gold'; // 'gold' | (futuro: 'item', 'material', ...)
    this.amount = 0;
  }
}
defineTypes(LootItemState, {
  itemId: 'string',
  kind: 'string',
  amount: 'number',
});

class LootBagState extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.z = 0;
    this.ownerSessionId = '';   // quién tiene derecho exclusivo mientras dure el temporizador
    this.exclusiveUntil = 0;    // Date.now() (ms) hasta el que el loot es exclusivo del owner
    this.items = new MapSchema();
  }
}
defineTypes(LootBagState, {
  x: 'number',
  z: 'number',
  ownerSessionId: 'string',
  exclusiveUntil: 'number',
  items: { map: LootItemState },
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
    this.lootBags = new MapSchema();
  }
}
defineTypes(ShadowRoomState, {
  players: { map: PlayerState },
  creatures: { map: CreatureState },
  lootBags: { map: LootBagState },
});

module.exports = { PlayerState, CreatureState, LootItemState, LootBagState, ShadowRoomState };
