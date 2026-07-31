# 01. Visión

## Qué es Shadow

Shadow es un MMORPG 3D isométrico en tiempo real para navegador y móvil. Se inspira en la filosofía de Ultima Online — no en su contenido específico, sino en su enfoque a la libertad, mundo persistente, economía viva y emergencia de historias.

## Por qué existe

La mayoría de MMORPGs modernos son abrumadoramente amplios y requieren grandes equipos. Shadow rechaza esa carrera de armamentos.

Queremos demostrar que un equipo pequeño (potencialmente solo con ayuda de IA) puede crear un mundo vivo, coherente y profundo que no compita por cantidad de contenido, sino por:

- **Libertad:** No hay una ruta única obligatoria. Un jugador puede ser combatiente, mercader, artesano, explorador, criminal o cualquier combinación.
- **Coherencia:** Todo sistema debe tener sentido narrativo y mecánico. Nada debe sentirse pegado o arbitrario.
- **Profundidad sistémica:** Los sistemas generan decisiones interesantes a largo plazo, no solo al principio.
- **Mundo vivo:** El mundo continúa cuando desconectas. Las criaturas se mueven, los precios cambian, los jugadores dejan sus marcas.
- **Comunidad:** La interacción entre jugadores es una mecánica, no un efecto secundario.
- **Evolución:** El proyecto debe poder crecer años sin rehacer la arquitectura.

## Inspiración: Ultima Online

Ultima Online (1997) fue revolucionario porque:
1. Era persistente — el mundo existía aunque no estuvieras jugando
2. Era libre — no había una ruta obligatoria de misiones
3. Tenía economía emergente — los jugadores producían la mayoría de bienes
4. Permitía conflicto real — el PvP, la criminalidad y la reputación eran vitales
5. Generaba historias — los jugadores creaban leyendas

Shadow quiere recapturar esa sensación, pero modernizada:
- Con tecnología web actual (Three.js, WebSockets, Supabase)
- Para móvil y navegador (no solo escritorio)
- Con herramientas IA (arte generado, audio, contenido procedural)
- Con arquitectura sostenible por un equipo pequeño

## Lo que NO es Shadow

Shadow no es:
- Una copia de Ultima Online
- Un juego competitivo para esports
- Una carrera de contenido contra juegos AAA
- Un proyecto que requiera 100 personas y años de desarrollo
- Un "simulador idle" o juego sin acción

## Dirección general

Shadow será:
- **Accesible en móvil** — interfaz clara, controles táctiles, rendimiento moderado
- **Modular** — nuevo contenido se añade sin rehacer nada
- **Seguro** — el servidor es autoritativo, no se confía en el cliente
- **Vivo** — ciclos día/noche, clima, respawn de recursos, criaturas con comportamiento
- **Económico** — los jugadores crean, comercian, consumen y destruyen (desgaste)
- **Justo** — no hay tienda de ítems premium que rompan el balance
- **Expansible** — arquitectura pensada para crecer indefinidamente

## Pilares de diseño

Toda decisión importante será evaluada según estos 7 pilares:

1. **Libertad del jugador** — ¿El jugador puede escoger su camino?
2. **Mundo persistente** — ¿El mundo existe sin los jugadores?
3. **Mundo vivo** — ¿El mundo se siente dinámico?
4. **Economía de jugadores** — ¿Los jugadores producen y consumen?
5. **Exploración valiosa** — ¿Explorar es una actividad con recompensa?
6. **Comunidad** — ¿Los sistemas favorecen la interacción?
7. **Expansión modular** — ¿Se puede añadir contenido sin refactorizar?

Si una mecánica no cumple al menos 3 de estos, debería replantearse.

Ver [02_Pilares.md](02_Pilares.md) para detalles.

## Escala de ambición

**Fase actual (MVP):**
- Una región pequeña (5x5 chunks)
- Una ciudad
- Un bosque
- Una mazmorra
- Profesión 1 (minería + herrería)
- Combate básico
- Economía básica
- PvE sin PvP

**Fase media (año 1):**
- 3-4 regiones diferentes
- 3-4 profesiones
- Sistema de viviendas
- PvP limitado
- Eventos dinámicos

**Expansión (años 2+):**
- Mundo infinito
- 10+ profesiones
- Navegación (barcos)
- Magia
- Clanes y territorios
- Contenido impulsado por la comunidad

No necesitamos tenerlo todo para empezar. Solo validar que el prototipo técnico y el loop de gameplay funcionan.

## Éxito

Shadow habrá triunfado cuando:
- ✅ Un jugador pueda pasar 1 hora explorando sin aburrirse
- ✅ Dos jugadores puedan comerciar objetos significativos
- ✅ Una profesión (ej: minería) sustente un estilo de juego completo
- ✅ El servidor mantenga el mundo consistente con ~50 jugadores simultáneos
- ✅ El rendimiento sea aceptable en móvil de gama media
- ✅ La comunidad quiera participar en el desarrollo

---

**Última actualización:** Julio 2026  
**Estado:** 01_Vision completa ✅
