# Shadow

**MMORPG 3D isométrico en tiempo real, inspirado en la filosofía de Ultima Online.**

## Descripción rápida

Shadow es un proyecto de MMORPG moderno para navegador y móvil, construido con Three.js en el cliente y tecnología web estándar. El mundo es persistente, divisible en chunks infinitos, y está diseñado para favorecer la libertad del jugador, la emergencia de historias, y una economía viva entre jugadores.

No es una copia de Ultima Online. Es un homenaje a su filosofía modernizada con tecnología web actual.

## Stack

- **Cliente:** HTML, CSS, JavaScript/TypeScript, Three.js → GitHub Pages
- **Autenticación & persistencia:** Supabase (free tier)
- **Servidor de juego:** Node.js + Colyseus → Render (free tier)
- **Assets:** Generados con IA (Meshy, Tripo, Suno, ElevenLabs)

## Fases de desarrollo

| Fase | Objetivo | Estado |
|------|----------|--------|
| **0** | Diseño, documentación, estructura | ✅ Completa |
| **1** | Prototipo técnico local (Three.js, cámara, movimiento) | ✅ Completa |
| **2** | Sistema de chunks + servidor multijugador | ✅ Completa |
| **3** | Gameplay (criaturas, combate, loot, inventario, persistencia) | ✅ Completa |
| **4** | Profesiones, economía, NPCs vendedores | Pendiente |
| **5** | Vertical slice (región completa, PvP limitado) | Pendiente |

## Documentación

Empieza aquí:
- **[GDD](/docs/GDD/00_Indice.md)** — Game Design Document completo
- **[Arquitectura técnica](/docs/technical/)** — Decisiones de arquitectura
- **[Roadmap](/docs/roadmap/)** — Planificación y hitos

## Colaboración

El proyecto está documentado en Markdown para que nuevos colaboradores (humanos e IA) puedan contribuir sin explicaciones constantes.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para el flujo de trabajo.

## Inspiración

Shadow se inspira en **Ultima Online** — no por su contenido específico, sino por su filosofía:
- Mundo persistente y vivo.
- Libertad real del jugador.
- Economía entre jugadores.
- Profesiones útiles.
- Historias emergentes.
- Comunidad como mecánica.

## Herramientas IA utilizadas

- Claude (programación, arquitectura, herramientas)
- ChatGPT (diseño, narrativa, sistemas, GDD)
- Meshy / Tripo (imagen a 3D)
- Suno (música)
- ElevenLabs (voces)

## Estado actual (agosto 2026)

- ✅ Contexto y visión definidos
- ✅ Arquitectura inicial documentada
- ✅ Stack de hosting elegido y desplegado (GitHub Pages + Supabase + Render)
- ✅ Prototipo Three.js: cámara isométrica, movimiento (teclado + joystick táctil)
- ✅ Sistema de chunks (carga/descarga dinámica alrededor del jugador)
- ✅ Servidor multijugador (Colyseus) con reconexión automática tras cortes de red
- ✅ Criaturas enemigas con IA de aggro (tabla de amenaza estilo WoW): patrulla, combate, vuelta a casa, respawn
- ✅ Combate: modo guerra, targeting por toque, ataque automático en rango
- ✅ Loot: bolsas con derecho exclusivo temporal, oro y objetos
- ✅ Inventario (20 slots) con persistencia en Supabase
- ✅ Persistencia de personaje: posición, vida, oro e inventario sobreviven a cerrar/recargar

## Próximos pasos

1. Profesión básica (minería o tala)
2. NPC vendedor y economía básica
3. Más variedad de criaturas/zonas
4. Sistema de chunks también en el servidor (de momento el mundo es "una sala" única)

---

**Última actualización:** Julio 2026  
**Codename:** Shadow  
**Inspiración principal:** Ultima Online
