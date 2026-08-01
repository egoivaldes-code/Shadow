/**
 * Repositorio de personajes — carga y guarda el progreso del jugador en la
 * tabla `characters` de Supabase. Si Supabase no está configurado (ver
 * db/supabase.js), estas funciones no hacen nada y el juego sigue funcionando
 * sin persistencia — así el prototipo no se rompe si aún no has configurado
 * las variables de entorno en Render.
 */

const { supabase } = require('./supabase');

// Devuelve el personaje guardado para este playerId, o null si no existe
// (jugador nuevo) o si Supabase no está configurado.
async function loadCharacter(playerId) {
  if (!supabase || !playerId) return null;

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error cargando personaje:', error.message);
    return null;
  }
  return data;
}

// Crea o actualiza (upsert) el personaje. Se llama periódicamente mientras
// el jugador está conectado, y una vez más al desconectarse.
async function saveCharacter(playerId, state) {
  if (!supabase || !playerId) return;

  // El inventario vive como MapSchema en el estado sincronizado; para guardarlo
  // en una columna JSONB lo convertimos a un array plano simple.
  const inventory = [];
  for (const slot of state.inventory.values()) {
    inventory.push({ itemType: slot.itemType, name: slot.name, rarity: slot.rarity, quantity: slot.quantity });
  }

  const { error } = await supabase
    .from('characters')
    .upsert({
      player_id: playerId,
      name: state.name,
      x: state.x,
      y: state.y,
      z: state.z,
      gold: state.gold,
      hp: state.hp,
      max_hp: state.maxHp,
      inventory,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Supabase] Error guardando personaje:', error.message);
  } else {
    console.log(`[Supabase] Personaje ${playerId} guardado (oro=${state.gold}, objetos=${inventory.length})`);
  }
}

module.exports = { loadCharacter, saveCharacter };
