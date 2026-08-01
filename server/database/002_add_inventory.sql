-- Shadow — añade inventario de objetos al personaje
--
-- Guarda el inventario como JSON: un array de objetos { itemType, name, rarity, quantity }.
-- Se serializa/deserializa en src/db/characters.js al guardar/cargar el personaje.
--
-- Nota: esta migración ya se aplicó directamente en el proyecto de Supabase.
-- Este archivo queda como documentación/historial, y para poder recrear la
-- base de datos desde cero si hiciera falta en el futuro.

alter table characters add column if not exists inventory jsonb not null default '[]'::jsonb;
