/* Línea de tiempo global: TODO es función pura del progreso p ∈ [0,1]. Sin reloj, sin acumulación. */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };   // smootherstep
const ramp = (p, a, b) => ss((p - a) / (b - a));
const P = (r, deg, y) => { const a = deg * Math.PI / 180; return [r * Math.cos(a), y, -r * Math.sin(a)]; };
const ENTRY = P(3.25, 150, 2.52), CLEAR = P(3.0, 15, 2.0);

/* [p, objetivo (coords del modelo | 'trd'), azimut (null = frente a las caras del TRD), elevación, distancia (n | {f:k} = k × encuadre completo)] */
const KEYS = [
  [0,   [0, .4, 0],   .6,  .30, { f: 1 }],       // 1 exterior
  [.09, [0, .4, 0],  -.6,  .20, { f: .85 }],
  [.16, ENTRY,      -2.05, .16, 3.45],           // 2 entrada (tubería izquierda)
  [.20, ENTRY,      -2.05, .16, 3.45],
  [.26, [0, .3, 0],   .3,  .22, { f: 1 }],       // 3 vista general y corte
  [.33, [0, .2, 0],   .45, .20, { f: 1 }],
  [.40, 'trd',       null, .18, 1.1],            // 4 TRD
  [.58, 'trd',       null, .18, 1.1],
  [.66, [0, -.3, 0],  .48, .20, 9.6],            // 5 sedimentación
  [.78, [0, -.3, 0],  .70, .20, 9.0],
  [.84, [0, -1.5, 0], .40, .35, 5.0],            // 6 rastras
  [.90, [0, -3.18, 0], .63, .10, 3.35],          //   descarga de lodos
  [.92, [0, -3.18, 0], .63, .10, 3.35],
  [.96, CLEAR,        1.3, .16, 3.35],           // 7 salida del jugo claro
  [1,   [1.2, 1.4, -.4], 1.0, .20, 7.5],
];

/* env: { fit(open), open, trd:[x,y,z] mundo, mx (desplazamiento del modelo), trdAz } */
function cameraAt(p, env) {
  let az0 = 0; const ks = KEYS.map((k, i) => {
    let az = k[2] === null ? env.trdAz : k[2];
    if (i) az = az0 + Math.atan2(Math.sin(az - az0), Math.cos(az - az0)); az0 = az;   // camino angular más corto
    const t = k[1] === 'trd' ? env.trd : [k[1][0] + env.mx, k[1][1], k[1][2]];
    const d = typeof k[4] === 'number' ? k[4] : k[4].f * env.fit(env.open);
    return { p: k[0], t, az, el: k[3], d };
  });
  p = clamp(p); let i = 0; while (i < ks.length - 2 && p >= ks[i + 1].p) i++;
  const a = ks[i], b = ks[i + 1], u = ss((p - a.p) / (b.p - a.p)), L = (x, y) => x + (y - x) * u;
  return { t: [L(a.t[0], b.t[0]), L(a.t[1], b.t[1]), L(a.t[2], b.t[2])], az: L(a.az, b.az), el: L(a.el, b.el), d: Math.exp(L(Math.log(a.d), Math.log(b.d))) };
}

function stateAt(p) {
  const r = (a, b) => ramp(p, a, b);
  return {
    open: r(.26, .33),                                               // corte de la carcasa
    trd: { reveal: r(.42, .47) - r(.61, .65), walls: r(.45, .51) - r(.59, .63), ghost: r(.47, .52) - r(.60, .64), flow: r(.50, .55) - r(.58, .61) },
    entry: r(.11, .16) - r(.20, .25), mud: r(.85, .89) - r(.93, .96), clear: r(.94, .975),
    sp: r(.66, .80), cl: r(.94, .975), S: p * 120, rake: p * 14,
  };
}

const TEXTS = [
  [-.02, .10, 'LLT · Clarificador', 'Separa el jugo limpio de los sólidos en suspensión con muy poca turbulencia.'],
  [.11, .24, 'Entrada del jugo', 'El jugo mezclado ingresa por la tubería de alimentación hacia el canal de distribución.'],
  [.26, .36, 'Corte de la carcasa', 'Al abrir la sección frontal se ve el interior: tuberías, TRD, eje y rastras.'],
  [.38, .65, 'TRD', 'El chorro golpea la placa y sale repartido hacia los lados: pierde velocidad y turbulencia.'],
  [.67, .80, 'Sedimentación', 'Los flóculos descienden por gravedad y dejan arriba un jugo más claro.'],
  [.81, .92, 'Rastras y lodos', 'Las rastras giran lentamente y conducen el lodo al centro, hacia la descarga.'],
  [.94, 1.02, 'Jugo clarificado', 'El jugo claro llega a los canales colectores y sale por la tubería derecha hacia la evaporación.'],
];
function textAt(p) {
  for (let i = 0; i < TEXTS.length; i++) { const [a, b] = TEXTS[i], al = Math.min(clamp((p - a) / .02), clamp((b - p) / .02)); if (al > 0) return { i, al }; }
  return { i: -1, al: 0 };
}

export { clamp, ss, ramp, KEYS, cameraAt, stateAt, TEXTS, textAt };
