/**
 * worldGen.js — replica EXACTA de la generación de árboles del cliente
 * (ver Chunk class en client/index.html), para que el servidor sepa dónde
 * está cada árbol real de verdad y pueda llevar su propio estado (talado o
 * no), sincronizado a todos los jugadores.
 *
 * CRÍTICO: WORLD_SEED, CHUNK_SIZE, chunkSeed(), mulberry32(), y el orden EXACTO
 * de llamadas a rng() en el bucle de árboles deben coincidir al 100% con el
 * cliente. Si algo aquí diverge del cliente, el servidor y el cliente creerán
 * que los árboles están en sitios distintos, y tocar un árbol no encontrará
 * su nodo correspondiente. Cualquier cambio en la generación de árboles del
 * cliente DEBE reflejarse aquí también.
 *
 * Nota: el cliente genera árboles Y rocas con el mismo generador de números
 * (mulberry32), en ese orden — los árboles se generan primero, así que
 * replicar solo el bucle de árboles (sin tocar rocas) basta para que las
 * posiciones de los árboles coincidan exactamente.
 */

const WORLD_SEED = 1337; // debe coincidir con WORLD_SEED en client/index.html
const CHUNK_SIZE = 128;  // debe coincidir con CHUNK_SIZE en client/index.html
const TREES_PER_CHUNK = 40; // debe coincidir con el bucle "for (let i = 0; i < 40" del cliente

function chunkSeed(cx, cz) {
  return (WORLD_SEED ^ (cx * 374761393) ^ (cz * 668265263)) >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Devuelve la lista de árboles reales de un chunk: [{ index, x, z }, ...]
// en coordenadas de MUNDO (ya sumado el origen del chunk). `index` es la
// posición del bucle original (0-39), usada para construir un id estable
// `tree_{cx}_{cz}_{index}` — algunos índices pueden faltar en el array si
// cayeron en la zona de spawn despejada del chunk (0,0).
function getTreesForChunk(cx, cz) {
  const rng = mulberry32(chunkSeed(cx, cz));
  const originX = cx * CHUNK_SIZE;
  const originZ = cz * CHUNK_SIZE;
  const trees = [];

  for (let i = 0; i < TREES_PER_CHUNK; i++) {
    const x = (rng() - 0.5) * (CHUNK_SIZE - 10);
    const z = (rng() - 0.5) * (CHUNK_SIZE - 10);
    if (cx === 0 && cz === 0 && Math.hypot(x, z) < 6) continue; // zona de spawn despejada, sin consumir rng extra
    rng(); // scale (no lo necesitamos server-side, pero hay que consumirlo igual que el cliente)
    rng(); // rot (idem)
    trees.push({ index: i, x: originX + x, z: originZ + z });
  }

  return trees;
}

module.exports = { getTreesForChunk, CHUNK_SIZE, WORLD_SEED };
