# Arquitectura inicial — Shadow

Documento de referencia para la arquitectura técnica de Shadow. Consulta [../GDD/03_Arquitectura.md](../GDD/03_Arquitectura.md) para más detalles de diseño.

## Stack elegido

| Capa | Tecnología | Hosting | Costo |
|------|-----------|---------|-------|
| **Cliente** | HTML, CSS, JS/TS, Three.js | GitHub Pages | 0€ |
| **Autenticación** | Supabase Auth | Supabase | 0€ (free tier) |
| **Base de datos** | PostgreSQL | Supabase | 0€ (free tier) |
| **Servidor de juego** | Node.js + Colyseus | Render | 0€ (free tier) |
| **Storage de assets** | Supabase Storage o CDN | Supabase / R2 | 0€ (free tier) |

## Responsabilidades por capa

### Cliente (GitHub Pages)

**Qué hace:**
- Renderiza el mundo con Three.js
- Maneja entrada (teclado, táctil, ratón)
- Dibuja UI
- Carga assets (modelos GLB, texturas)
- Maneja cámara isométrica
- Efectos visuales y animaciones
- Predicción visual local (suavizado)

**Qué NO hace:**
- ❌ Calcular daño
- ❌ Validar movimiento (el servidor lo valida)
- ❌ Modificar inventario directo
- ❌ Resolver economía
- ❌ Decidir loot

**Comunicación:**
- WebSocket con servidor de juego
- REST API con Supabase (auth, inventario guardado)

### Servidor de juego (Render + Colyseus)

**Qué hace:**
- Autoridad final en estado del mundo
- Valida movimiento de personajes
- Simula criaturas y IA
- Resuelve combate
- Sincroniza posiciones entre jugadores
- Gestiona persistencia de cambios a BD
- Filtra entidades por proximidad
- Detecta y previene trampas
- Administra eventos del mundo

**Estructura:**
```
server/
├── game/
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Creature.ts
│   │   ├── NPC.ts
│   │   └── ItemDrop.ts
│   ├── systems/
│   │   ├── MovementSystem.ts
│   │   ├── CombatSystem.ts
│   │   ├── AISystem.ts
│   │   └── EconomySystem.ts
│   └── world/
│       ├── Chunk.ts
│       ├── ChunkManager.ts
│       └── WorldState.ts
├── api/
│   ├── auth/
│   ├── inventory/
│   └── character/
├── db/
│   └── migrations/
└── index.ts (Colyseus server)
```

### Base de datos (Supabase/PostgreSQL)

**Qué se persiste:**
- Personajes (stats, experiencia, habilidades)
- Inventarios
- Dinero
- Posición última conocida
- Casas y propiedad
- Clanes
- Reputación/karma
- Cambios del mundo (árbol talado, cofre abierto, construcción colocada)
- Leaderboards

**Qué NO se persiste en BD (vive en memoria del servidor):**
- Posición actual (sincroniza vía WebSocket)
- Criaturas spawneadas (regeneran en chunk load)
- Efectos visuales en progreso
- Estado temporal de combate

### Cliente + Servidor: Flujo de sincronización

**Movimiento:**
```
Cliente: Jugador presiona "ir arriba"
└─> Envía comando: { action: "move", direction: "north" }
    └─> Servidor: Valida colisiones, terreno, zona
        └─> Si válido: Actualiza posición, notifica a otros
            └─> Broadcast a clientes: { playerId, position, animation }
                └─> Clientes: Interpolan movimiento suavemente
```

**Inventario:**
```
Cliente: Jugador toma un objeto
└─> Envía: { action: "pickup", itemId }
    └─> Servidor: Valida proximidad, peso, espacio
        └─> Si válido: Actualiza inventario en BD
            └─> Notifica al cliente: { inventory }
                └─> Cliente: Actualiza UI
```

**Combate:**
```
Cliente: Jugador clickea en enemigo + presiona ataque
└─> Envía: { action: "attack", targetId }
    └─> Servidor: Valida distancia, cooldown, recursos
        └─> Calcula daño (servidor = autoridad)
            └─> Aplica a enemigo, actualiza HP
                └─> Broadcast a clientes: { targetId, health, animation }
```

## Mundo en chunks

El mundo se divide en **chunks** de 128x128 metros.

**Sistema de carga:**

```
Cliente: Personaje se mueve
└─> Calcula qué chunks debe cargar
    └─> Envía lista al servidor
        └─> Servidor responde con entidades en esos chunks
            └─> Cliente: Carga modelos GLB
                └─> Renderiza terreno + entidades
```

**Anillos de calidad:**

```
0–150m:   Máxima calidad, simulación completa
150–400m: Detalle medio, IA simplificada
400–1km:  Siluetas y terreno basic
>1km:     No cargado
```

**LOD (Level of Detail):**

Usar InstancedMesh y LOD automático:
- Árboles: alta polys cerca, baja polys lejos
- Edificios: detalles completos cerca, caja simple lejos
- Terreno: mayor resolución malla cerca
- Personajes: modelo completo cerca, silueta lejos

**Floating origin:**

Para evitar problemas de precisión en mundos enormes:
- Mantener render siempre cerca del origen (0,0,0)
- Guardar coordenadas "mundiales" en servidor
- Recentrar la escena local cuando el jugador se aleja

## Supabase free tier — limitaciones a vigilar

| Límite | Valor | Impacto |
|--------|-------|--------|
| Storage BD | 500 MB | Suficiente para ~1000 personajes + cambios de mundo |
| Egress | 5 GB/mes | Suficiente para uso normal |
| Auth | 50.000 MAUs | Más que suficiente para inicio |
| Proyectos | 2 activos | OK (dev + prod, si acaso) |
| **Pausa** | 7 días inactividad | ⚠️ Reactivar a mano si duerme |

Monitorear crecimiento de BD. Si se acerca a 400 MB, considerar:
- Comprimir datos históricos
- Archivar cambios de mundo antiguos
- Limpieza de inventarios de cuentas borradas

## Render free tier — limitaciones a vigilar

| Límite | Valor | Impacto |
|--------|-------|--------|
| Compute | Shared CPU, 512 MB RAM | Suficiente para ~20-30 jugadores simultáneos |
| Ejecución | Siempre activo (con cold start) | ⚠️ Espera de ~5s si dormía |
| Concurrencia | Limitada por memoria | Monitorear en Fase 4+ |

**Cold start en Render:** Si nadie juega 30 minutos, el servidor se duerme. El primer jugador espera ~5 segundos. Aceptable en prototipo, revisable en fase de muchos jugadores.

## Expansión futura

**Si necesitamos más capacidad:**

- **Cliente:** Seguirá en GitHub Pages (escalable sin cambios)
- **BD:** Supabase Pro (~$25/mes) o migrar a PlanetScale/Turso
- **Servidor:** Render Pro (compute más fuerte, ~$7-20/mes) o Fly.io
- **Assets:** CDN dedicado (Cloudflare R2, Supabase Storage)

## Principios clave

✅ **Servidor autoritativo:** El cliente nunca es fuente de verdad.  
✅ **Stateless siempre que sea posible:** Facilita scaling.  
✅ **Persistencia en BD:** No confiar en memoria del servidor como única fuente.  
✅ **Validación doble:** Cliente (UX), servidor (seguridad).  
✅ **Modularidad:** Cada sistema es reemplazable (ej: cambiar Colyseus por Socket.io).

---

**Última actualización:** Julio 2026  
**Estado:** Arquitectura inicial documentada ✅
