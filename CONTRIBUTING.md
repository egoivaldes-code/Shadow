# CONTRIBUTING

## Filosofía

Shadow es un proyecto colaborativo documentado para que cualquiera (humano o IA) pueda contribuir sin depender de explicaciones constantes.

Toda decisión importante debe:
1. Ser registrada en el GDD o documentación técnica
2. Respetar los pilares de diseño (sección 2 del contexto)
3. Poder mantenerse por un equipo pequeño

## Flujo de trabajo

### 1. Antes de empezar

- Lee el contexto actual: **SHADOW_Contexto_Claude.md**
- Lee el GDD relevante a tu tarea
- Revisa si existe un issue o task pendiente

### 2. Crear rama

```bash
git checkout -b feature/nombre-descriptivo
# Ejemplos:
# feature/threejs-camera
# docs/professions-system
# fix/chunk-loading-performance
```

### 3. Trabajar

- **Código:** mantén archivos modulares, documenta decisiones no obvias
- **Documentación:** actualiza el GDD si cambias un sistema
- **Tests:** valida en navegador (desktop y móvil) antes de PR

### 4. Commits claros

```bash
git commit -m "feat: añadir cámara isométrica Three.js"
git commit -m "docs: completar sección de economía en GDD"
git commit -m "fix: optimizar carga de chunks"
```

Commits pequeños y específicos > commits enormes

### 5. Pull Request

- Incluye qué cambió y por qué
- Referencia issues o tasks si aplica
- Testea en móvil si tocar UI
- Pide revisión

### 6. Revisión

Se revisará:
- ¿Sigue los pilares?
- ¿Está documentado?
- ¿Funciona en móvil?
- ¿Es mantenible?

### 7. Merge

Una vez aprobado, se fusiona y se actualiza la documentación si es necesario.

---

## Estructura para colaboradores nuevos

Si es tu primer PR al proyecto:

1. Empieza pequeño — no intentes rehacer toda la arquitectura
2. Consulta primero si tu idea es compatible con los pilares
3. Documenta tus decisiones en inline comments o en la sección técnica
4. Prueba en navegador y móvil antes de enviar

## Reglas importantes

✅ **Haz esto:**
- Cambios modulares y testados
- Documentación clara
- Respeta mobile-first
- Commits pequeños
- Actualiza el GDD si algo cambia

❌ **Evita esto:**
- Grandes refactors sin revisar primero
- Dependencias innecesarias
- Supuestos de diseño no documentados
- Código sin testing en móvil
- Cambios que requieran rehacer la arquitectura

## Herramientas

- **Repositorio:** GitHub (rama main protegida)
- **Documentación:** Markdown en /docs/
- **Issues:** GitHub Issues para tracking
- **Colaboradores IA:** Claude (código), ChatGPT (diseño/narrativa)

## Contacto

Si tienes una pregunta sobre el proyecto, consulta primero:
1. SHADOW_Contexto_Claude.md
2. GDD relevante
3. Issues y discussions
4. Pregunta al equipo

---

**Gracias por colaborar en Shadow.**
