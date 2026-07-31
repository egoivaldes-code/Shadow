# Shadow — Servidor de juego

Servidor autoritativo mínimo, construido con [Colyseus](https://colyseus.io/). En esta fase (Fase 2 del roadmap) solo sincroniza **posición y rotación** de los jugadores conectados. No hay chunks, combate, ni base de datos todavía — eso se añade en fases posteriores.

Ver [`docs/technical/Arquitectura_Inicial.md`](../docs/technical/Arquitectura_Inicial.md) del repo principal para el contexto completo de arquitectura.

## Qué hace este servidor

- El cliente se conecta por WebSocket y se une a la sala `shadow_room`
- El cliente envía su intención de movimiento: `room.send('move', { dx, dz })`
- El servidor es la autoridad: aplica el movimiento en su propio bucle de simulación (20 veces/seg), no confía en la posición que el cliente calcule
- Colyseus sincroniza automáticamente el estado (`ShadowRoomState`) a todos los clientes conectados

## Estructura

```
server/
├── package.json
├── src/
│   ├── index.js              # Punto de entrada, servidor HTTP + WebSocket
│   ├── rooms/
│   │   └── ShadowRoom.js     # Lógica de la sala: join/leave/movimiento
│   └── schema/
│       └── ShadowRoomState.js # Estado sincronizado (qué se manda a los clientes)
```

## Cómo correrlo en local

```bash
cd server
npm install
npm start
```

El servidor escucha en el puerto `2567` por defecto (o el que indique la variable de entorno `PORT`).

Comprobar que está vivo:
```bash
curl http://localhost:2567/health
```

## Desplegar en Render (free tier)

1. Crear cuenta en [render.com](https://render.com) (sin tarjeta de crédito)
2. New → Web Service → conectar este repositorio de GitHub
3. Configurar:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Plan:** Free
4. Render asignará una URL tipo `https://shadow-server.onrender.com`

**Importante:** en el plan free, el servidor se duerme tras un rato de inactividad y tarda unos segundos en despertar en la primera conexión ("cold start"). Es aceptable en esta fase de pruebas — ver sección 7.3.1 del contexto del proyecto.

## Conectar el cliente

Desde el cliente Three.js, hay que:
1. Añadir el SDK `colyseus.js` (vía CDN o npm)
2. Conectar a la URL del servidor desplegado (o `ws://localhost:2567` en local)
3. Unirse a la sala `shadow_room`
4. Enviar `move` con la dirección normalizada en vez de mover al jugador directamente
5. Leer el estado sincronizado (`room.state.players`) para dibujar a los demás jugadores

Esto se conecta en el siguiente paso del roadmap (unir cliente Fase 1-2 con este servidor).

## Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `PORT` | Puerto donde escucha el servidor | `2567` |

## Próximos pasos (fuera de esta fase)

- Validar colisiones contra el mundo (árboles/rocas) también en servidor, no solo en cliente
- Persistir personajes en Supabase
- Sistema de chunks también en el servidor (filtrar entidades por proximidad)
- Anti-cheat básico (límites de velocidad más estrictos, validación de posición)
