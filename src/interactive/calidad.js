/* Calidad visual del azúcar a partir de los indicadores REALES de computeResults (rules.js).
   No es una evaluación nueva: solo normaliza el índice «color» a su rango posible según la tabla VARS
   (referencia = color mínimo → azúcar blanca; peor combinación = color máximo → azúcar oscura).
   Los colores replican exactamente toneRGB() y palette() de la animación final (08), para que el
   informe, la transición y la animación muestren el mismo azúcar para las mismas decisiones. */
import { VARS, REF, clamp } from './rules.js';

const COLOR = 1;   // posición del Δ color en VARS[i].opts[j].d
export const COLOR_MIN = clamp(REF.color + VARS.reduce((s, v) => s + Math.min(...v.opts.map(o => o.d[COLOR])), 0));
export const COLOR_MAX = clamp(REF.color + VARS.reduce((s, v) => s + Math.max(...v.opts.map(o => o.d[COLOR])), 0));

/** r: resultado de computeResults → q ∈ [0,1] (1 = blanca, 0 = oscura). */
export function calidadDesdeResultados(r) {
  if (!r || typeof r.color !== 'number') return null;
  return Math.min(1, Math.max(0, 1 - (r.color - COLOR_MIN) / (COLOR_MAX - COLOR_MIN)));
}

/* La categoría se decide por lo que realmente se VE: la luminosidad del azúcar que dibuja la 08
   (0 = el más oscuro posible, 1 = el más claro), dividida en tercios. Así el rótulo nunca contradice la imagen. */
const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
export function claridadVisual(q) {
  const L0 = lum(azucarMonton(0)), L1 = lum(azucarMonton(1));
  return Math.min(1, Math.max(0, (lum(azucarMonton(q)) - L0) / (L1 - L0)));
}
export function categoria(q) {
  if (q === null || q === undefined) return null;
  const v = claridadVisual(q);
  if (v >= 2 / 3) return { id: 'clara', nombre: 'Azúcar clara', texto: 'Jugo bien clarificado: pocos colorantes llegaron a los cristales.' };
  if (v >= 1 / 3) return { id: 'intermedia', nombre: 'Azúcar intermedia', texto: 'Parte de los colorantes y de la turbidez pasó a las etapas siguientes.' };
  return { id: 'oscura', nombre: 'Azúcar oscura', texto: 'Muchos colorantes y sólidos siguieron con el jugo y quedaron en el producto.' };
}

/* ---- copia exacta de las funciones de color de AzucarFinal (originales/08_Animacion_Final.html) ---- */
const mix = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const pal3 = (q, d, m, g) => q < 0.5 ? lerp3(d, m, q * 2) : lerp3(m, g, (q - 0.5) * 2);
export function toneRGB(q, r, g, b) {
  const s = (q - 0.5) * 2;
  if (r - b < 4) return [r, g, b];
  if (s < 0) { const k = -s; r *= 1 - 0.24 * k; g *= 1 - 0.38 * k; b *= 1 - 0.56 * k; }
  else if (s > 0) { r += (255 - r) * 0.10 * s; g += (255 - g) * 0.22 * s; b += (255 - b) * 0.12 * s; }
  return [r, g, b];
}
export function paletaAzucar(q) {
  return {
    azucar: toneRGB(q, 252, 249, 240),   // granos de la bolsa (sugarCol)
    jugo: pal3(q, [84, 50, 20], [222, 172, 64], [247, 228, 140]),
    jarabe: pal3(q, [70, 38, 10], [230, 160, 40], [246, 192, 74]),
    cristales: pal3(q, [176, 134, 84], [226, 204, 160], [251, 244, 224]),
  };
}
/* El montículo de la bolsa (makeSugarTile) asigna rgb(shade3(azúcar, k)) con el parche de tono activo,
   que vuelve a aplicar toneRGB: este es el color que se ve realmente en la bolsa. */
export function azucarMonton(q, k = 0.97) {
  const s = sombra(toneRGB(q, 252, 249, 240), k).map(Math.round);
  return toneRGB(q, ...s);
}
export const css = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
export const sombra = (c, k) => c.map(x => Math.min(255, Math.max(0, x * k)));
