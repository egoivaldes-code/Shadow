# Game Design Document (GDD) — Shadow

Índice completo del Game Design Document. Consulta primero [SHADOW_Contexto_Claude.md](../../SHADOW_Contexto_Claude.md) para contexto general.

## Documentación por secciones

| # | Documento | Estado | Descripción |
|---|-----------|--------|-------------|
| **01** | [Visión](01_Vision.md) | ⏳ En curso | Qué es Shadow, por qué existe, cómo es diferente |
| **02** | [Pilares de diseño](02_Pilares.md) | ⏳ En curso | Los 7 pilares que guían cada decisión |
| **03** | [Arquitectura](03_Arquitectura.md) | ⏳ En curso | Stack técnico, cliente/servidor, hosting |
| **04** | [Mundo](04_Mundo.md) | ⏳ Pendiente | Chunks, generación procedural, discovery |
| **05** | [Exploración](05_Exploracion.md) | ⏳ Pendiente | Qué hay que explorar, cómo descubrir |
| **06** | [Combate](06_Combate.md) | ⏳ Pendiente | Sistemas de combate en tiempo real |
| **07** | [Habilidades](07_Habilidades.md) | ⏳ Pendiente | Progresión por uso, especialización |
| **08** | [Profesiones](08_Profesiones.md) | ⏳ Pendiente | Minería, herrería, tala, pesca, etc. |
| **09** | [Crafting](09_Crafting.md) | ⏳ Pendiente | Sistemas de fabricación y recetas |
| **10** | [Economía](10_Economia.md) | ⏳ Pendiente | Oferta/demanda, sumideros, moneda |
| **11** | [Comercio](11_Comercio.md) | ⏳ Pendiente | Mercados, tiendas NPC, trading directo |
| **12** | [Viviendas](12_Viviendas.md) | ⏳ Pendiente | Casas, propiedad, talleres, asentamientos |
| **13** | [PvP](13_PvP.md) | ⏳ Pendiente | Criminalidad, reputación, caza de recompensas |
| **14** | [Criaturas](14_Criaturas.md) | ⏳ Pendiente | Enemigos, comportamiento, loot |
| **15** | [NPC](15_NPC.md) | ⏳ Pendiente | Vendedores, quest givers, rutinas |
| **16** | [Objetos](16_Objetos.md) | ⏳ Pendiente | Armas, armaduras, consumibles, especiales |
| **17** | [Arte](17_Arte.md) | ⏳ Pendiente | Dirección visual, estilo, pipeline 3D |
| **18** | [Pipeline IA](18_Pipeline_IA.md) | ⏳ Pendiente | Cómo generamos arte, audio, contenido |
| **19** | [Herramientas](19_Herramientas.md) | ⏳ Pendiente | Editores internos, generadores, scripts |
| **20** | [UI/UX](20_UI_UX.md) | ⏳ Pendiente | Interfaz, mobile-first, accesibilidad |
| **21** | [Audio](21_Audio.md) | ⏳ Pendiente | Música, SFX, voces, dirección sonora |
| **22** | [Roadmap](22_Roadmap.md) | ⏳ En curso | Fases, hitos, MVP, expansión |

## Cómo usar esta documentación

**Para desarrolladores:**
- Empieza por **Visión** (01) y **Pilares** (02) para entender la dirección
- Sigue por **Arquitectura** (03) para entender el stack técnico
- Consulta la sección específica de tu tarea (ej: **Combate** para gameplay de combate)

**Para diseñadores:**
- Lee **Visión**, **Pilares**, **Mundo**
- Profundiza en las secciones de sistemas: **Profesiones**, **Economía**, **PvP**, etc.

**Para artistas:**
- Consulta **Arte** (17), **Pipeline IA** (18), y **Objetos** (16)

**Para cualquiera:**
- Referencia general: [SHADOW_Contexto_Claude.md](../../SHADOW_Contexto_Claude.md)
- Contexto de colaboración: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Convenciones en este GDD

- Las decisiones finales se marcan con ✅
- Las cosas todavía en discusión se marcan con ⏳
- Los "pendientes" sin date se marcan con ❌
- Los links internos usan la ruta relativa dentro de `/docs/GDD/`

## Control de versiones

Este GDD debe mantenerse sincronizado con el código. Si algo cambia en el código, la documentación debe actualizarse **en el mismo commit o PR**.

---

**Última actualización:** Julio 2026  
**Fase actual:** 0 (Diseño y documentación)
