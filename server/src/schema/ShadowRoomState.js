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

// Un "slot" de inventario: agrupa todas las unidades del MISMO tipo de objeto
// en una sola entrada apilable (p.ej. "3x Piel de lobo" es un slot, no tres).
// El límite de MAX_INVENTORY_SLOTS (ver items.js) se aplica sobre el número
// de TIPOS distintos que llevas, no sobre la cantidad total de objetos.
class InventorySlotState extends Schema {
  constructor() {
    super();
    this.itemType = '';  // id interno, p.ej. 'wolf_pelt'
    this.name = '';      // nombre para mostrar, p.ej. 'Piel de lobo'
    this.rarity = 'common'; // 'common' | 'rare' (de momento)
    this.quantity = 0;
  }
}
defineTypes(InventorySlotState, {
  itemType: 'string',
  name: 'string',
  rarity: 'string',
  quantity: 'number',
});

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
    this.inventory = new MapSchema(); // itemType -> InventorySlotState
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
  inventory: { map: InventorySlotState },
});

// Un objeto individual dentro de una bolsa de loot. "gold" es un caso especial
// (se suma directo al oro del jugador); "item" representa un objeto real de
// inventario, identificado por itemType (ver items.js para el catálogo).
class LootItemState extends Schema {
  constructor() {
    super();
    this.itemId = '';    // id único dentro de la bolsa, para poder coger uno concreto
    this.kind = 'gold';  // 'gold' | 'item'
    this.itemType = '';  // solo si kind==='item', p.ej. 'wolf_pelt'
    this.name = '';      // nombre para mostrar en el panel de saqueo
    this.rarity = 'common';
    this.amount = 0;
  }
}
defineTypes(LootItemState, {
  itemId: 'string',
  kind: 'string',
  itemType: 'string',
  name: 'string',
  rarity: 'string',
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

// Un nodo de recolección (árbol talable, roca de mina, etc.) — a diferencia
// de los árboles decorativos del cliente (generados por semilla, puramente
// visuales), estos SÍ viven en el servidor: tienen estado real (agotado o no)
// y dan un recurso de verdad al recolectarlos.
class ResourceNodeState extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.z = 0;
    this.kind = 'tree'; // 'tree' | (futuro: 'ore_vein', 'fishing_spot', ...)
    this.depleted = false;
  }
}
defineTypes(ResourceNodeState, {
  x: 'number',
  z: 'number',
  kind: 'string',
  depleted: 'boolean',
});

class ShadowRoomState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.creatures = new MapSchema();
    this.lootBags = new MapSchema();
    this.resourceNodes = new MapSchema();
  }
}
defineTypes(ShadowRoomState, {
  players: { map: PlayerState },
  creatures: { map: CreatureState },
  lootBags: { map: LootBagState },
  resourceNodes: { map: ResourceNodeState },
});

module.exports = { PlayerState, InventorySlotState, CreatureState, LootItemState, LootBagState, ResourceNodeState, ShadowRoomState };
