# Instalación

1. Crea un repositorio público con exactamente el mismo nombre que tu usuario de GitHub.
2. Copia el contenido de este ZIP en la raíz del repositorio.
3. En `README.md`, reemplaza todas las apariciones de `TU_USUARIO` por tu usuario real.
4. Haz commit y push a `main`.
5. En GitHub abre **Actions** > **Update Neon Profile Stats** > **Run workflow**.
6. El workflow regenerará automáticamente los SVG cada 6 horas.

## Archivos dinámicos

- `assets/commits-ring.svg`
- `assets/pull-requests-ring.svg`
- `assets/reviews-ring.svg`
- `assets/activity-clock.svg`

Los SVG usan animaciones nativas, glow/bloom y fondo transparente.

## Nota sobre las métricas

El reloj usa los eventos públicos recientes expuestos por la API pública de GitHub.
Los contadores consultan las APIs de búsqueda de GitHub. La visibilidad y los límites de
GitHub pueden hacer que ciertas cifras no representen actividad privada.

No necesitas crear un PAT para la configuración básica: GitHub Actions proporciona
`GITHUB_TOKEN` automáticamente.
