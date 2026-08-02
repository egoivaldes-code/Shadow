/**
 * Catálogo de objetos e inventario — definiciones compartidas por el servidor.
 *
 * De momento solo hay objetos de material (loot de criaturas), sin equipo ni
 * consumibles todavía (eso es la sección 16 del GDD, más adelante). Añadir un
 * objeto nuevo es tan simple como añadir una entrada aquí y, si aplica, una
 * línea en la tabla de drops de la criatura correspondiente.
 */

const MAX_INVENTORY_SLOTS = 20; // límite de TIPOS distintos de objeto, no de cantidad total

const ITEMS = {
  wolf_pelt: { name: 'Piel de lobo', rarity: 'common' },
  wolf_fang: { name: 'Colmillo de lobo', rarity: 'rare' },
  wood: { name: 'Madera', rarity: 'common' },
  axe: { name: 'Hacha', rarity: 'common' },
};

// Tabla de drops por tipo de criatura. Cada entrada tiene una probabilidad
// independiente de soltarse (no es una única tirada de "o esto o lo otro" —
// una criatura puede soltar varias cosas a la vez, o ninguna).
const DROP_TABLES = {
  wolf: [
    { itemType: 'wolf_pelt', chance: 0.6, min: 1, max: 1 },
    { itemType: 'wolf_fang', chance: 0.15, min: 1, max: 1 },
  ],
};

// Devuelve una lista de { itemType, amount } a partir de la tabla de drops
// de ese tipo de criatura (o [] si no hay tabla definida para ese kind).
function rollDrops(creatureKind) {
  const table = DROP_TABLES[creatureKind];
  if (!table) return [];

  const drops = [];
  for (const entry of table) {
    if (Math.random() < entry.chance) {
      const amount = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
      drops.push({ itemType: entry.itemType, amount });
    }
  }
  return drops;
}

function getItemDefinition(itemType) {
  return ITEMS[itemType] || { name: itemType, rarity: 'common' };
}

module.exports = { MAX_INVENTORY_SLOTS, ITEMS, rollDrops, getItemDefinition };
