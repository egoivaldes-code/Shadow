# MVP (Minimum Viable Product)

## Qué es el MVP

Es la versión más pequeña e integrada del juego que demuestra que el concepto funciona.

**No es:** El juego completo, todas las profesiones, todas las regiones.  
**Es:** Un loop jugable de extremo a extremo que valida tecnología + gameplay.

## MVP recomendado — Fase 0-3 (3-4 meses)

### Requisitos técnicos

✅ Funcional en navegador (desktop y móvil)  
✅ Rendimiento > 30 FPS en móvil de gama media  
✅ Cámara isométrica controlar con teclado/táctil  
✅ Mundo de 1-2 chunks cargable  
✅ Modelos 3D (GLB) renderizados correctamente  
✅ Datos persistidos en Supabase  
✅ Servidor sincroniza posiciones  

### Contenido mínimo

**Mundo:**
- 1 chunk (128x128m) con terreno procedural
- 2-3 árboles/rocas destructibles
- 1 hogar NPC o casa jugador
- 1 zona peligrosa (dungeon mínimo)

**Gameplay:**
- 1 personaje (creación básica: nombre, aspecto)
- 1 criatura enemiga (ej: lobo, esqueleto)
- Combate básico (click para atacar, HP, muerte)
- Loot mínimo (drop de monedas)
- Inventario básico (abrir/cerrar, ver items)
- Guardado de progreso

**Profesión MVP:**
- Minería: encontrar piedra, minar con herramienta, llenar inventario
- O: Tala: cortar árboles, llevar madera, algo sencillo

**Economía mínima:**
- Moneda básica (oro)
- 1 NPC vendedor (compra y vende items básicos)
- Precio fijo (sin oferta/demanda todavía)

**UI:**
- Barra de HP
- Inventario visual
- Chat de prueba (al menos local)
- Estadísticas básicas

### Exclusions deliberadas (para después)

❌ PvP  
❌ Clanes  
❌ Casas jugador construibles  
❌ Magia  
❌ Múltiples regiones  
❌ Eventos dinámicos  
❌ Ciclo día/noche  
❌ IA compleja de criaturas  
❌ Crafting avanzado  
❌ Mercado de jugadores  

Todas estas cosas son para **Fase 4+**, no para MVP.

## Validación del MVP

### Criterios de éxito técnico

- [ ] El servidor valida un movimiento de cliente
- [ ] Dos clientes ven la misma posición de un personaje
- [ ] Inventario persiste tras cerrar navegador
- [ ] Combate inflige daño consistente
- [ ] FPS estable en móvil durante 30 minutos
- [ ] Sin memory leaks visibles
- [ ] Carga de chunk < 2 segundos

### Criterios de éxito gameplay

- [ ] Un jugador puede minar durante 20 minutos sin aburrise
- [ ] El mismo jugador puede vender lo minado a NPC
- [ ] Enemigo al menos persigue y ataca
- [ ] Muerte y respawn funcionan
- [ ] Otro jugador puede unirse y ver al primero

### Criterios de éxito UX

- [ ] Botones son tapeables en móvil (>48px)
- [ ] No hay pantallas de carga largas
- [ ] Texto legible en pantalla pequeña
- [ ] Controles son intuitivos (primer usuario entiende qué hacer)

## Fases de desarrollo detalladas

### Fase 0: Diseño & Setup (1-2 semanas)

**Tareas:**
- [x] Crear repositorio
- [x] Documentar arquitectura
- [x] Documentar visión y pilares
- [x] Elegir stack (GitHub Pages + Supabase + Render)
- [x] Crear estructura de carpetas
- [x] Crear GDD básico
- [ ] Setup de Supabase (tablas, auth)
- [ ] Setup de Render (deploy Node)
- [ ] Setup de GitHub Pages (deploy cliente)

**Entregable:** Documentación, repositorio, infraestructura lista.

### Fase 1: Prototipo técnico local (2-3 semanas)

**Tareas:**
- [ ] Escena Three.js con cámara isométrica
- [ ] Controles de movimiento (WASD + táctil)
- [ ] Terreno proceduralizado (1 chunk)
- [ ] Objetos del mundo (árboles, rocas, modelos GLB)
- [ ] Carga de modelos 3D desde archivo
- [ ] Primeros tests en móvil
- [ ] Optimización (LOD, instancing)

**Entregable:** Prototipo navegable, sin servidor, solo cliente.  
**Publicar:** En GitHub Pages como demo.

### Fase 2: Sistema de chunks & streaming (1-2 semanas)

**Tareas:**
- [ ] Sistema de chunking en servidor
- [ ] Protocolo cliente-servidor (WebSocket, Colyseus)
- [ ] Cliente pide chunks al servidor
- [ ] Servidor envía entidades por proximidad
- [ ] Carga/descarga fluida de chunks
- [ ] Floating origin en cliente
- [ ] Tests de rendimiento con 3-5 chunks

**Entregable:** Mundo pequeño navegable, sincronizado.

### Fase 3: Gameplay mínimo (2-3 semanas)

**Tareas:**
- [ ] Crear personaje (BD + cliente)
- [ ] Spawning del personaje en mundo
- [ ] 1 criatura enemiga con AI básica (patrullas)
- [ ] Sistema de combate (click, daño, HP, muerte)
- [ ] Loot al matar
- [ ] Inventario (guardar, cargar, UI)
- [ ] Guardado en Supabase (posición, inventario, HP)
- [ ] Tests de persistencia

**Entregable:** Puedes jugar solo, matar enemigos, tener inventario.

### Fase 4: Multijugador mínimo (2-3 semanas)

**Tareas:**
- [ ] Sincronizar posiciones entre 2 jugadores
- [ ] Validar movimiento en servidor (anti-cheat básico)
- [ ] Chat simple
- [ ] Ver otros jugadores en pantalla
- [ ] Comercio de items (drop, pickup, intercambio básico)
- [ ] Tests con 2-5 jugadores simultáneos
- [ ] Monitorear memoria en Render

**Entregable:** Juego para 2+ jugadores, muy minimalista pero funcional.

### Fase 5: Vertical slice (3-4 semanas)

**Tareas:**
- [ ] Profesión 1 (minería + herrería, ej)
- [ ] NPC vendedor que compra/vende
- [ ] Economía básica (precios, dinero persistente)
- [ ] Región con variedad (bosque, mina, pueblo)
- [ ] Dungeon con múltiples enemigos
- [ ] PvE completo
- [ ] Pulir gameplay de MVP
- [ ] Tests con 10-20 jugadores

**Entregable:** Slice vertical pequeño, completamente jugable. Dura 1-2 horas de juego sin repetir.

## Timeline esperado

| Fase | Duración | Fecha aprox |
|------|----------|-------------|
| 0 | 1-2 sem | Julio 2026 ✅ |
| 1 | 2-3 sem | Agosto 2026 |
| 2 | 1-2 sem | Agosto 2026 |
| 3 | 2-3 sem | Septiembre 2026 |
| 4 | 2-3 sem | Septiembre 2026 |
| 5 | 3-4 sem | Octubre 2026 |
| **MVP total** | ~3-4 meses | **Octubre 2026** |

*Esto asume trabajo de medio tiempo con apoyo de IA. Ajustar si la carga es distinta.*

## Stack para MVP

**Cliente:**
```
HTML5 + CSS + TypeScript
Three.js 4.x
Colyseus client
Supabase client
```

**Servidor:**
```
Node.js 20+
Express (para REST API)
Colyseus (WebSocket, state sync)
Supabase SDK
PostgreSQL (BD)
```

**Assets:**
```
Modelos: Generados con Meshy/Tripo (imagen → 3D)
Texturas: Procedurales + IA
Audio: Generado con Suno (música ambiental)
```

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|------------|
| Cold start de Render en Fase 4+ | Media | Medio | Pagar upgrade o cambiar a Fly.io |
| Supabase BD se llena | Baja (500MB) | Medio | Limpiar logs, archivar datos |
| Performance en móvil baja | Media | Alto | Tests frecuentes, optimizar LOD |
| WebSocket latency alto | Baja | Medio | Predicción local, tolerancia en validación |
| IA tarda mucho en generar assets | Baja | Bajo | Stock de assets pre-hechos |

## Próximas acciones inmediatas (después de Fase 0)

1. Setup de Supabase (auth table, characters, inventory)
2. Setup de Render (Node server skeleton)
3. Comenzar Fase 1: Three.js scene básica
4. Generar primeros modelos 3D (árbol, casa, personaje)
5. Publicar primer prototipo en GitHub Pages

---

**Última actualización:** Julio 2026  
**Estado:** MVP documentado, timeline definido ✅
