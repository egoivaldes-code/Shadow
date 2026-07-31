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
| **0** | Diseño, documentación, estructura | En progreso |
| **1** | Prototipo técnico local (Three.js, cámara, movimiento) | Pendiente |
| **2** | Sistema de chunks y streaming | Pendiente |
| **3** | Gameplay mínimo (combate, inventario, guardado) | Pendiente |
| **4** | Multijugador mínimo (sincronización de posiciones) | Pendiente |
| **5** | Vertical slice (región completa, economía, PvP limitado) | Pendiente |

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

## Estado actual (julio 2026)

- ✅ Contexto y visión definidos
- ✅ Arquitectura inicial documentada
- ✅ Stack de hosting elegido (GitHub Pages + Supabase + Render)
- ⏳ Estructura de carpetas creada
- ⏳ GDD en desarrollo
- ⏳ Prototipo Three.js pendiente

## Próximos pasos

1. Crear GDD inicial (secciones 1-5)
2. Crear prototipo Three.js con cámara isométrica, movimiento, terreno
3. Cargar en GitHub
4. Publicar en GitHub Pages
5. Validar rendimiento en móvil

---

**Última actualización:** Julio 2026  
**Codename:** Shadow  
**Inspiración principal:** Ultima Online
