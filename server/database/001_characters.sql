-- Shadow — tabla de personajes persistentes
--
-- Guarda la posición, oro y vida de cada jugador entre sesiones. Se identifica
-- por "player_id", un identificador generado por el propio navegador (guardado
-- en localStorage) — todavía no hay sistema de login/auth real (eso es una
-- fase posterior). Esto es suficiente para no perder progreso al recargar la
-- página en el mismo dispositivo/navegador.
--
-- Cómo aplicarlo: copia y pega esto en Supabase → SQL Editor → Run.

create table if not exists characters (
  player_id  text primary key,
  name       text not null default 'Jugador',
  x          double precision not null default 0,
  y          double precision not null default 0,
  z          double precision not null default 0,
  gold       integer not null default 0,
  hp         integer not null default 30,
  max_hp     integer not null default 30,
  inventory  jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice para poder limpiar/auditar personajes inactivos en el futuro
create index if not exists characters_updated_at_idx on characters (updated_at);

-- Nota de seguridad: esta tabla se accede SOLO desde el servidor de juego
-- (Render), usando la clave sb_secret_ (equivalente a service_role), que
-- ignora Row Level Security. No hace falta política RLS para que esto
-- funcione, pero como buena práctica dejamos RLS activado y sin políticas
-- de acceso público, para que nadie pueda leer/escribir esta tabla
-- directamente desde el cliente con la clave pública (sb_publishable_).
alter table characters enable row level security;
