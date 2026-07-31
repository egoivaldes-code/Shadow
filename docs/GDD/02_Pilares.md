# 02. Pilares de diseño

Los siguientes 7 pilares son la brújula del proyecto. Toda mecánica, sistema y contenido debe responder afirmativamente a al menos 3 de ellos. Si no puede, debe replantearse o descartarse.

---

## 1. Libertad del jugador ✅

**El jugador debe poder escoger su forma de jugar sin una ruta única obligatoria.**

Shadow no tiene "árbol de progresión" lineal. Un mismo personaje puede:
- Combatir monstruos un día
- Minar minerales otro
- Comerciar en el mercado
- Construir una casa
- Explorar cuevas
- Pescar en un lago
- Buscar recompensas de criminales
- Asociarse con un clan

No hay clases cerradas. Las habilidades se entrenan por uso, no por selección al crear el personaje.

**Implicaciones:**
- No hay "meta" obligatorio
- No hay actividades inútiles (todas las profesiones son viables)
- El equipamiento no dicta el playstyle
- PvP y PvE son opcionales, no forzados

**Cómo medirlo:**
- ¿Un jugador puede jugar solo con una habilidad?
- ¿Hay múltiples caminos para progresar?
- ¿Las decisiones tempranas no cierran puertas irrevocablemente?

---

## 2. Mundo persistente ✅

**El mundo continúa existiendo cuando el jugador se desconecta.**

El servidor mantiene:
- Estados de personajes (nivel, habilidades, inventario)
- Inventarios guardados
- Economía y precios
- Casas y propiedad
- Cambios del mundo (árboles talados, caminos construidos)
- Recursos (minería, pesca respawnean)
- Información de clanes
- Eventos persistentes

Cuando desconectas, tu personaje sigue ahí (vulnerables en PvP). El mundo sigue evolucionando.

**Implicaciones:**
- Necesitamos base de datos persistente (Supabase)
- Servidor siempre activo (Render)
- Cambios no son reversibles al "resetear"
- Las decisiones tienen peso

**Cómo medirlo:**
- ¿El personaje mantiene su estado días después?
- ¿Los cambios del mundo persisten?
- ¿La economía evoluciona sin intervención?

---

## 3. Mundo vivo ✅

**El mundo no debe sentirse como un decorado estático.**

Progressivamente debe incluir:
- Ciclo día/noche
- Clima (lluvia, niebla)
- Respawn y movimiento de recursos
- Criaturas con comportamiento IA (patrullas, rutinas)
- Eventos dinámicos (ataque de monstruos, caravanas)
- NPC con rutinas (vendedores abren/cierran tiendas, buscan los campos)
- Cambios provocados por jugadores (construcciones, deforestación)
- Economía afectada por oferta y demanda
- Zonas que evolucionan (nueva vegetación, ruinas)

**Implicaciones:**
- Necesitamos IA de servidor para criaturas y NPC
- Lógica de eventos procedurales
- Simulación de clima y ciclos
- Sistema de respawn que no es "magia"

**Cómo medirlo:**
- ¿El mundo se ve diferente a distintas horas?
- ¿Las criaturas hacen cosas además de estar ahí?
- ¿Los jugadores pueden provocar cambios visibles?

---

## 4. Economía de jugadores ✅

**Los jugadores deben producir, intercambiar y consumir la mayoría de los objetos.**

La economía se apoya en:
- Recolección (minería, tala, pesca)
- Profesiones (herrería, carpintería, costura)
- Crafting (recetas, ingredientes)
- Comercio directo entre jugadores
- Mercados (NPCs o jugadores vendiendo)
- Desgaste/destrucción de objetos (sumideros)
- Especialización (riesgo de decidir qué habilidades entrenar)
- Riesgo y recompensa (lugares peligrosos dan mejor loot)

No hay "infinito de objetos". Los recursos no spawnean mágicamente; alguien tuvo que recolectarlos.

**Implicaciones:**
- Profesiones deben ser útiles
- Debe existir demanda continua
- Los objetos se desgastan o se pierden
- El dinero no aparece de la nada

**Cómo medirlo:**
- ¿Un jugador puede vivir solo fabricando?
- ¿El mercado responde a cambios de oferta?
- ¿Los objetos tienen ciclo de vida?

---

## 5. Exploración valiosa ✅

**Explorar debe ser una actividad valiosa.**

El jugador descubre:
- Caminos y rutas eficientes
- Ruinas y lugares secretos
- Cuevas y dungeons
- Recursos raros en lugares lejanos
- Eventos ocultos
- Pueblos y ciudades nuevas
- Biomas variados
- Lugares de interés narrativo
- Zonas que se añaden después (sorpresa)

No hay markers en el mapa. La exploración requiere curiosidad y riesgo.

**Implicaciones:**
- Mundo grande pero navegable
- Recompensas por aventurarse lejos
- Peligro aumenta con distancia/secreto
- Mapas "completos" descubribles pero no obligatorios

**Cómo medirlo:**
- ¿Un jugador explora sin misiones que lo dirijan?
- ¿Encuentra cosas valiosas en lugares lejanos?
- ¿Quiere volver después a un lugar descubierto?

---

## 6. Comunidad ✅

**El diseño debe favorecer la interacción entre jugadores.**

Mecánicas que los acercan:
- Conversación (chat es herramienta importante)
- Comercio (vender y comprar)
- Cooperación (dungeons, eventos)
- Conflicto (PvP, criminalidad, reputación)
- Reputación (ser conocido por algo)
- Clanes (asociarse con otros)
- Viviendas (espacios comunes, tiendas)
- Mercados (lugares de encuentro)
- Historias entre jugadores (legendarias)

No hay "juego solitario total". El mejor gameplay requiere otros jugadores.

**Implicaciones:**
- Chat y comunicación son vitales
- Sistemas de reputación
- Espacios comunes (pueblos, mercados)
- Conflicto controlado

**Cómo medirlo:**
- ¿Los jugadores hablan entre sí?
- ¿La colaboración da mejores resultados?
- ¿Existen "puntos de encuentro"?

---

## 7. Expansión modular ✅

**El mundo y los sistemas deben poder crecer sin rehacer desde cero.**

Cada nueva región, criatura, profesión o sistema puede añadirse de forma modular:
- Nuevos chunks sin alterar los antiguos
- Nuevas profesiones sin rebalancear las viejas
- Nuevas criaturas con la misma IA
- Nuevas habilidades dentro del mismo sistema de progresión
- Nuevo arte con el mismo pipeline
- Nueva narrativa sin contradecir la existente

**Implicaciones:**
- Arquitectura escalable desde el inicio
- Estándares de datos claros (formatos, esquemas)
- Documentación de cómo añadir X (profesión, región, etc.)
- Código reutilizable

**Cómo medirlo:**
- ¿Se puede añadir una región en una PR?
- ¿Una nueva profesión no requiere cambiar código base?
- ¿Un nuevo jefe se añade sin refactorizar combate?

---

## Filtro de decisión

Antes de aprobar cualquier mecánica:

```
¿Cumple al menos 3 pilares?
├─ SÍ → Evalúa si es mantenible
│       └─ SÍ → Implementa
│       └─ NO → Redesign o descarta
└─ NO → Descarta o redesign
```

**Ejemplos:**

**Tienda de items premium:** ❌
- Libertad? No (rompe balance)
- Persistencia? N/A
- Vivo? No
- Economía? No (dinero real != oro de juego)
- Exploración? No
- Comunidad? No
- Modular? Sí
→ Solo cumple 1. Descarta.

**Sistema de profesiones:** ✅
- Libertad? Sí (elige qué profesión)
- Persistencia? Sí (se guarda)
- Vivo? Sí (criaturas creadas)
- Economía? Sí (objetos producidos)
- Exploración? Parcial
- Comunidad? Sí (comercio)
- Modular? Sí (añadir profesión es fácil)
→ Cumple 6+. Implementa.

---

**Última actualización:** Julio 2026  
**Estado:** 02_Pilares completo ✅
