# Del campo al cristal

Proyecto educativo de Química Industrial sobre la producción del azúcar de caña.

## Recorrido

1. **Portada** (`index.html`): portada oficial, sin cambios de diseño.
2. **Proceso industrial 2D** (sección `#proceso` de `index.html`): siete etapas con las máquinas animadas originales y una tarjeta giratoria de química industrial (qué entra y sale, fenómenos físicos y químicos, aditivos, condiciones de operación y fuentes). La distribución sigue el modelo `originales/recorrido_azucar_demo.html`.
3. **Clarificador LLT 3D** (`clarificador.html`): modo grupal (votación con celulares) o individual. Al terminar aparece «Seguir el jugo hacia el evaporador».
4. **Animación final** (`final.html`): empieza en la tubería de salida del LLT (sin la clarificadora 2D) y recorre evaporación, cristalización, centrifugación y secado.
5. **Informe**: azúcar clara, intermedia u oscura según las decisiones reales (en modo grupal, se leen del servidor de votaciones).

## Versión local (con votaciones grupales)

Requiere Node.js 20.19 o posterior.

```
npm install          # una sola vez, con internet
npm run build
npm run serve        # http://localhost:4173/  (celulares: http://IP-DE-LA-COMPUTADORA:4173/votar)
```

En Windows alcanza con hacer doble clic en **`INICIAR_PAGINA.bat`**: instala lo necesario la primera vez (con internet), prepara la página, inicia el servidor local y abre el navegador. Después funciona sin internet. Para desarrollo: `npm run dev` (puerto 5173). Más detalles de la sala, los QR y el panel `/control` en `README_LLT.md` y `GUIA_DE_INICIO_FACIL.txt`.

## Versión web (estática, sin servidor)

```
npm run build:web    # genera dist-web/
npm run preview:web  # prueba local en http://localhost:4174/
```

`dist-web/` usa rutas relativas. En GitHub Pages se publica automáticamente con `.github/workflows/pages.yml` cada vez que se actualiza `main` (antes hay que activar una vez Settings → Pages → Source: «GitHub Actions»). La dirección queda `https://<usuario>.github.io/del-campo-al-cristal/`. Incluye la portada, el recorrido 2D, el clarificador en modo individual y la animación final. La votación grupal solo existe en la versión local.

## Cómo se conecta el resultado

- Las decisiones (pH, temperatura, floculante, caudal) se convierten en indicadores con `computeResults` (`src/interactive/rules.js`), que no se modificó.
- `src/interactive/calidad.js` normaliza el índice de **color** entre el mínimo y el máximo posibles según la tabla del simulador (18–40). Así, la referencia da azúcar blanca y la peor combinación, azúcar oscura. Los colores replican exactamente los de la animación final, y la categoría (clara, intermedia u oscura) se decide por la luminosidad que realmente se dibuja. De este modo la animación, la transición y el informe muestran el mismo azúcar.
- En modo grupal, `final.html` se conecta al servidor y solo muestra lo registrado: la opción ganadora, cómo se resolvió (mayoría, empate o elección manual de la presentadora), cuántos integrantes votaron y el conteo por opción si la pantalla tiene acceso de presentadora. Si la sesión se reinició, no muestra resultados.

## Estructura

```
index.html, clarificador.html, final.html, votar.html, control.html
public/maquinas/      máquinas extraídas de originales/ (no editar a mano)
src/proceso/          recorrido 2D: etapas.js (contenido químico), proceso.js, proceso.css
src/final/            animación final + informe
src/interactive/      reglas, votación, modo individual, calidad.js, continuar.js
src/llt/              escena 3D original del clarificador
server/               motor de votaciones y servidor local (Socket.IO)
originales/           archivos originales intactos, como respaldo
scripts/              extracción y verificación de las máquinas, controles
test/                 pruebas automáticas (npm test)
```

`npm run maquinas` vuelve a extraer las máquinas desde `originales/`. `npm run check` verifica las importaciones, que no haya recursos de internet y que las máquinas coincidan con sus originales.

Los indicadores del simulador son estimaciones didácticas, no mediciones de planta. El contenido químico de las tarjetas distingue entre rangos industriales orientativos (con su fuente) y condiciones del simulador, y conviene que lo revise la docente antes de exponer.
