/* Contenido del recorrido 2D: máquina original + ficha de química industrial de cada etapa.
   Procedencia de cada cifra (campo `origen`):
     'industrial' → rango orientativo de bibliografía; varía según la planta, la caña y el esquema.
     'simulador'  → condición del simulador LLT (rules.js): estimación didáctica, no medición de planta.
     'cualitativo'→ se explica la tendencia sin dar una cifra universal.
   Revisión docente pendiente antes de presentar. */

export const FUENTES = {
  R: 'Rein, P. (2007). Cane Sugar Engineering. Berlín: Verlag Dr. Albert Bartens. (2.ª ed., 2017).',
  H: 'Hugot, E. (1986). Handbook of Cane Sugar Engineering (3.ª ed., trad. G. H. Jenkins). Ámsterdam: Elsevier, Sugar Series 7. ISBN 0-444-42438-5.',
  C: 'Chen, J. C. P. y Chou, C. C. (1993). Cane Sugar Handbook: A Manual for Cane Sugar Manufacturers and Their Chemists (12.ª ed.). Nueva York: Wiley. ISBN 0-471-53037-6.',
  Ho: 'Honig, P. (ed.) (1953–1963). Principles of Sugar Technology, vols. I–III. Ámsterdam: Elsevier.',
  I: 'ICUMSA. Método GS2/3-9 (2005; reeditado como GS2-9, 2024): color de soluciones de azúcar blanco, absorbancia a 420 nm y pH 7,0.',
  E: 'EEAOC – Estación Experimental Agroindustrial Obispo Colombres (Tucumán). Publicaciones técnicas sobre caña de azúcar e industria azucarera del NOA (revista Avance Agroindustrial).',
};

export const ETAPAS = [
  {
    id: 'cosecha', titulo: 'Cosecha', rotulo: 'Cosechadora integral descargando caña troceada en el remolque',
    maquina: { archivo: '01-cosecha.js', global: 'CosechaAnimada', w: 1662, h: 946, recorte: { debajo: 560, w: 1042 } },
    descripcion: 'La cosechadora corta los tallos al ras del suelo, los trocea y los descarga en el remolque que los lleva al ingenio. Desde ese momento empieza una carrera contra el tiempo: la caña cortada se deteriora.',
    facts: ['Entra: caña en pie', 'Sale: caña troceada', 'Impurezas: tierra y hojas'],
    quimica: {
      titulo: 'Una materia prima que se deteriora',
      intro: 'El tallo es un depósito de sacarosa disuelta en agua, protegida por fibra. Al cortarlo, enzimas y bacterias comienzan a consumir o a transformar esa sacarosa.',
      particulas: ['agua', 'sacarosa', 'fibra', 'agua', 'sacarosa', 'imp', 'agua', 'sacarosa', 'fibra', 'agua'],
      entra: ['Caña en pie (tallos, hojas y cogollo)'],
      sale: ['Trozos de caña hacia el ingenio', 'Hojas y cogollo que quedan en el campo (o llegan como impureza)', 'Tierra adherida (impureza mineral)'],
      composicion: { texto: 'Composición orientativa del tallo', valor: 'aprox. 65–75 % agua · 11–16 % sacarosa · 10–16 % fibra · pequeñas cantidades de glucosa, fructosa, sales minerales, ácidos orgánicos y proteínas', origen: 'industrial', fuentes: ['C', 'R'] },
      ocurre: [
        { tipo: 'fisico', titulo: 'Corte y troceado', texto: 'Las cuchillas cortan y trocean el tallo. No cambia la composición química: es una operación mecánica que facilita el transporte y la molienda.' },
        { tipo: 'quimico', titulo: 'Inversión de la sacarosa', texto: 'La invertasa (enzima de la propia caña) y los microorganismos rompen la sacarosa en glucosa y fructosa. Esos azúcares ya no cristalizan como sacarosa y además forman color en las etapas calientes.', ecuacion: 'C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ (glucosa) + C₆H₁₂O₆ (fructosa)' },
        { tipo: 'biologico', titulo: 'Formación de dextranas', texto: 'La bacteria Leuconostoc mesenteroides entra por los cortes y transforma sacarosa en dextrana, un polisacárido viscoso que dificulta la clarificación, la filtración y la cristalización.' },
      ],
      aditivos: { ninguno: 'En esta etapa no se agregan aditivos. La principal herramienta es logística: cortar, transportar y moler lo antes posible, y reducir la tierra y las hojas que llegan al ingenio.' },
      condiciones: [
        { variable: 'Tiempo entre corte y molienda', valor: 'lo más corto posible', origen: 'cualitativo', porque: 'Cuanto más tiempo pasa, mayor es la inversión y la formación de dextranas: se pierde sacarosa recuperable. El plazo aceptable depende del clima, del tipo de cosecha y del estado de la caña.' },
        { variable: 'Temperatura ambiente', valor: 'cuanto más calor, más rápido el deterioro', origen: 'cualitativo', porque: 'Las reacciones enzimáticas y la actividad bacteriana se aceleran con la temperatura.' },
        { variable: 'pH del jugo de la caña', valor: 'aprox. 5,0–5,6 (ácido)', origen: 'industrial', porque: 'Por los ácidos orgánicos naturales. Ese medio ácido es el que después hay que neutralizar en la clarificación.', fuentes: ['C'] },
      ],
      conexion: 'Una caña que llega deteriorada trae más glucosa, fructosa y dextranas: el jugo será más difícil de clarificar y dará un azúcar más oscuro, aunque las decisiones del LLT sean buenas.',
      fuentes: ['C', 'R', 'E'],
    },
  },
  {
    id: 'molienda', titulo: 'Molienda', rotulo: 'Tándem de molinos: las mazas exprimen la caña preparada',
    maquina: { archivo: '02-molino.js', global: 'MolinoAnimado', w: 1448, h: 1086 },
    descripcion: 'La caña, ya desmenuzada por picadoras o desfibradoras, pasa entre mazas (rodillos) que la comprimen. Se separa el jugo, que contiene la sacarosa, del bagazo, la fibra que queda.',
    facts: ['Entra: caña preparada + agua', 'Sale: jugo mixto', 'Subproducto: bagazo'],
    quimica: {
      titulo: 'Extracción por presión y lavado',
      intro: 'La molienda es una separación física: se rompen las células del tallo y se exprime el líquido. Para sacar la sacarosa que queda en la fibra se la lava con agua caliente entre molino y molino (imbibición).',
      particulas: ['agua', 'sacarosa', 'fibra', 'agua', 'fibra', 'sacarosa', 'imp', 'agua', 'sacarosa', 'fibra'],
      entra: ['Caña preparada (desfibrada)', 'Agua de imbibición caliente'],
      sale: ['Jugo mixto: turbio, ácido, con sacarosa, azúcares reductores, sales, proteínas, ceras y bagacillo en suspensión', 'Bagazo: fibra húmeda que se quema en las calderas y genera el vapor de la fábrica'],
      composicion: { texto: 'Jugo mixto', valor: 'aprox. 12–16 °Brix · pH aprox. 5,0–5,6 · bagazo con aprox. 50 % de humedad', origen: 'industrial', fuentes: ['R', 'H'] },
      ocurre: [
        { tipo: 'fisico', titulo: 'Compresión', texto: 'Las mazas, cargadas con cilindros hidráulicos, aplastan la fibra y expulsan el jugo de las células rotas. La presión de trabajo depende del diseño y del tamaño de cada molino; no hay un valor único.' },
        { tipo: 'fisico', titulo: 'Imbibición (lixiviación)', texto: 'El agua o el jugo diluido que se agrega al bagazo disuelve la sacarosa que quedó atrapada; el molino siguiente vuelve a exprimirlo. En la imbibición compuesta, el jugo de un molino se usa para lavar el bagazo del anterior.' },
        { tipo: 'biologico', titulo: 'Riesgo microbiano', texto: 'El jugo tibio y azucarado de los molinos es un medio ideal para bacterias que invierten o consumen sacarosa. Por eso se mantiene limpio el equipo.' },
      ],
      aditivos: { lista: [
        { nombre: 'Biocidas', para: 'Frenar el desarrollo de bacterias en los molinos y canaletas.', como: 'Inhiben a los microorganismos que producen inversión y dextranas.', limite: 'Se dosifican según la indicación del fabricante; no reemplazan la limpieza con vapor y agua caliente.' },
      ] },
      condiciones: [
        { variable: 'Temperatura del agua de imbibición', valor: 'aprox. 60–85 °C', origen: 'industrial', porque: 'El agua caliente mejora la extracción. Demasiado calor disuelve ceras y gomas que después ensucian el jugo.', fuentes: ['H', 'R'] },
        { variable: 'Cantidad de agua de imbibición', valor: 'compromiso', origen: 'cualitativo', porque: 'Más agua extrae más sacarosa, pero diluye el jugo: después hay que gastar más vapor para evaporarla.' },
        { variable: 'Extracción de sacarosa', valor: 'del orden del 95 % o más', origen: 'industrial', porque: 'Lo que no se extrae se pierde con el bagazo en las calderas.', fuentes: ['R'] },
      ],
      conexion: 'El jugo mixto sale ácido y turbio: lleva los coloides, proteínas y bagacillo que la clarificación (y tus decisiones en el LLT) deberán eliminar.',
      fuentes: ['H', 'R', 'C'],
    },
  },
  {
    id: 'clarificacion', titulo: 'Clarificación', rotulo: 'Clarificador: el jugo encalado y calentado deja sedimentar los flóculos',
    maquina: { archivo: '03-clarificador.js', global: 'ClarificadorAnimado', w: 1254, h: 1254 },
    descripcion: 'El jugo se encala, se calienta y recibe floculante. Las impurezas forman flóculos que sedimentan en el clarificador: arriba sale jugo limpio y abajo se retira el lodo (cachaza). Es la etapa que después vas a controlar en el LLT 3D.',
    facts: ['Control de pH con cal', 'Calentamiento', 'Floculante y sedimentación'],
    quimica: {
      titulo: 'Neutralización, precipitación y floculación',
      intro: 'Es la etapa con más química del proceso. La cal neutraliza la acidez y, junto con los fosfatos del jugo, forma un precipitado que atrapa impurezas; el calor coagula proteínas y el floculante une todo en flóculos que se hunden.',
      particulas: ['agua', 'sacarosa', 'ca', 'imp', 'floc', 'agua', 'sacarosa', 'ca', 'imp', 'floc'],
      entra: ['Jugo mixto (ácido y turbio)', 'Lechada de cal: Ca(OH)₂ en agua', 'Vapor para calentar', 'Floculante (polímero)'],
      sale: ['Jugo clarificado: brillante, casi neutro', 'Cachaza (lodo): se filtra al vacío para recuperar sacarosa y después se usa como enmienda del suelo'],
      composicion: { texto: 'Jugo clarificado', valor: 'pH aprox. 6,8–7,2 · conserva aprox. el mismo °Brix del jugo mixto', origen: 'industrial', fuentes: ['R', 'C'] },
      ocurre: [
        { tipo: 'quimico', titulo: 'Neutralización', texto: 'El hidróxido de calcio reacciona con los ácidos orgánicos del jugo y sube el pH. Así se frena la inversión de la sacarosa, que es más rápida en medio ácido y caliente.', ecuacion: 'Ca(OH)₂ + 2 H⁺ → Ca²⁺ + 2 H₂O' },
        { tipo: 'quimico', titulo: 'Precipitación del fosfato de calcio', texto: 'Los iones calcio se combinan con los fosfatos naturales del jugo y forman un sólido insoluble. Al formarse, adsorbe y arrastra coloides, bagacillo y parte de los colorantes. Si el jugo tiene poco fosfato, se puede agregar ácido fosfórico.', ecuacion: '3 Ca²⁺ + 2 PO₄³⁻ → Ca₃(PO₄)₂ ↓' },
        { tipo: 'quimico', titulo: 'Desnaturalización de proteínas', texto: 'El calentamiento coagula las proteínas, que se suman a los flóculos.' },
        { tipo: 'fisico', titulo: 'Flash, floculación y sedimentación', texto: 'Al calentarse por encima de 100 °C y pasar a un tanque a presión atmosférica, el jugo hierve un instante (flash) y libera el aire disuelto que haría flotar los flóculos. El polímero tiende puentes entre partículas finas, que forman flóculos grandes y sedimentan por gravedad.' },
      ],
      aditivos: { lista: [
        { nombre: 'Cal (lechada de Ca(OH)₂)', para: 'Neutralizar la acidez y aportar Ca²⁺ para el precipitado de fosfato de calcio.', como: 'Sube el pH y genera el sólido que atrapa impurezas.', limite: 'Con poca cal queda jugo ácido y turbio (inversión). Con exceso, aumentan el color (degradación alcalina de glucosa y fructosa) y las sales de calcio que incrustan los evaporadores.' },
        { nombre: 'Floculante (poliacrilamida aniónica)', para: 'Agrupar las partículas finas en flóculos grandes.', como: 'Sus cadenas largas se adsorben sobre varias partículas a la vez y las unen.', limite: 'Se usa en dosis muy bajas, del orden de pocos mg por kg de jugo (ppm). Si falta, quedan finos en suspensión; si sobra, aumenta el costo sin mejorar la separación.' },
        { nombre: 'Ácido fosfórico (opcional)', para: 'Completar el fosfato cuando el jugo trae poco.', como: 'Aporta PO₄³⁻ para que se forme suficiente precipitado.', limite: 'Solo se agrega si el análisis del jugo lo indica.' },
        { nombre: 'Dióxido de azufre, SO₂ (variante)', para: 'En la sulfitación, usada para producir azúcar blanco directo en el ingenio, ayuda a decolorar.', como: 'Reduce compuestos coloreados y forma sulfito de calcio que también precipita.', limite: 'No todos los ingenios la usan; depende del tipo de azúcar que producen.' },
      ] },
      condiciones: [
        { variable: 'Temperatura de calentamiento', valor: 'aprox. 102–105 °C', origen: 'industrial', porque: 'Por encima del punto de ebullición, para coagular proteínas y permitir el flash. Con menos temperatura, la coagulación es incompleta y el jugo sale turbio.', fuentes: ['R', 'H'] },
        { variable: 'pH de encalado', valor: 'depende del esquema (encalado en frío, en caliente o fraccionado)', origen: 'cualitativo', porque: 'Se ajusta para que el jugo clarificado quede cerca de la neutralidad: ni tan ácido que invierta sacarosa, ni tan alcalino que forme color e incrustaciones.' },
        { variable: 'Dosis de floculante', valor: 'del orden de pocos ppm', origen: 'industrial', porque: 'Pequeñas cantidades bastan para formar flóculos estables.', fuentes: ['R'] },
        { variable: 'Caudal y tiempo de residencia', valor: 'según el diseño del clarificador', origen: 'cualitativo', porque: 'Si entra demasiado jugo, el tiempo de permanencia baja y los sólidos no alcanzan a sedimentar: son arrastrados con el jugo claro.' },
      ],
      simulador: true,
      conexion: 'Lo que no se elimina acá sigue de largo: los colorantes y la turbidez del jugo clarificado terminan en la meladura, en la masa cocida y en el color del azúcar. Por eso tus decisiones en el LLT definen el azúcar final.',
      fuentes: ['R', 'H', 'C', 'Ho'],
    },
  },
  {
    id: 'evaporacion', titulo: 'Evaporación', rotulo: 'Evaporador: el jugo hierve y se concentra en meladura',
    maquina: { archivo: '04-evaporador.js', global: 'EvaporadorAnimado', w: 1254, h: 1254 },
    descripcion: 'El jugo clarificado es casi todo agua. En un tren de evaporadores de múltiple efecto se elimina la mayor parte de esa agua como vapor y se obtiene un jarabe espeso: la meladura.',
    facts: ['Entra: jugo clarificado', 'Sale: vapor de agua', 'Producto: meladura'],
    quimica: {
      titulo: 'Concentrar sin dañar la sacarosa',
      intro: 'Es principalmente un cambio físico: el agua pasa a vapor y la sacarosa queda más concentrada. El desafío es hacerlo gastando poco vapor y con el menor tiempo y temperatura posibles, para no generar color ni invertir sacarosa.',
      particulas: ['agua', 'vapor', 'sacarosa', 'agua', 'vapor', 'sacarosa', 'sacarosa', 'vapor', 'agua', 'sacarosa'],
      entra: ['Jugo clarificado', 'Vapor de escape (de turbinas y calderas) para el primer efecto'],
      sale: ['Meladura (jarabe concentrado)', 'Vapor vegetal: el vapor que sale del jugo y calienta el efecto siguiente u otros equipos', 'Condensados: agua caliente reutilizada en calderas e imbibición'],
      composicion: { texto: 'Concentración', valor: 'de aprox. 13–16 °Brix a aprox. 60–70 °Brix', origen: 'industrial', fuentes: ['R', 'H'] },
      ocurre: [
        { tipo: 'fisico', titulo: 'Evaporación en múltiple efecto', texto: 'El vapor que hierve el jugo en un cuerpo calienta el cuerpo siguiente, que trabaja a menor presión. En el último efecto hay vacío y el jugo hierve muy por debajo de 100 °C. Así, con un kilo de vapor se evapora varias veces su masa de agua.' },
        { tipo: 'fisico', titulo: 'Incrustación', texto: 'Al concentrarse, sales de calcio y sílice superan su solubilidad y se depositan en los tubos. La capa aísla y reduce la transferencia de calor; hay que limpiar periódicamente.' },
        { tipo: 'quimico', titulo: 'Reacciones indeseadas: color e inversión', texto: 'Con calor, los azúcares reductores reaccionan con aminoácidos (reacción de Maillard) y se caramelizan, formando colorantes. Si el pH baja, aumenta la inversión.' },
      ],
      aditivos: { lista: [
        { nombre: 'Antiincrustantes (opcional)', para: 'Reducir los depósitos en los tubos.', como: 'Mantienen dispersas las sales que tienden a precipitar.', limite: 'Complementan, no reemplazan, la limpieza química o mecánica de los evaporadores.' },
      ] },
      condiciones: [
        { variable: 'Presión', valor: 'disminuye de efecto en efecto; vacío en el último', origen: 'cualitativo', porque: 'A menor presión, menor temperatura de ebullición: se aprovecha el mismo vapor varias veces y se reduce el daño térmico.' },
        { variable: 'Temperatura del último efecto', valor: 'aprox. 55–65 °C', origen: 'industrial', porque: 'El jarabe más concentrado hierve a baja temperatura gracias al vacío, lo que limita la formación de color.', fuentes: ['R', 'H'] },
        { variable: 'Tiempo de residencia', valor: 'lo más corto posible', origen: 'cualitativo', porque: 'Cuanto más tiempo caliente, más color y más inversión.' },
      ],
      conexion: 'Un jugo mal clarificado (más calcio y más color) incrusta más los tubos y llega como una meladura más oscura.',
      fuentes: ['R', 'H', 'C'],
    },
  },
  {
    id: 'cristalizacion', titulo: 'Cristalización', rotulo: 'Tacho de cocimiento al vacío: crecen los cristales de sacarosa',
    maquina: { archivo: '05-cristalizador.js', global: 'CristalizadorAnimado', w: 1151, h: 1366 },
    descripcion: 'La meladura se sigue concentrando en tachos al vacío hasta que la sacarosa ya no cabe disuelta. Se siembran cristales muy finos que crecen hasta formar la masa cocida: cristales suspendidos en miel.',
    facts: ['Sobresaturación', 'Siembra de cristales', 'Masa cocida'],
    quimica: {
      titulo: 'Crecimiento cristalino',
      intro: 'La sacarosa no cambia químicamente: pasa de estar disuelta a ordenarse como sólido cristalino. Para eso la solución debe estar sobresaturada, con más sacarosa disuelta de la que admite en equilibrio.',
      particulas: ['sacarosa', 'cristal', 'agua', 'sacarosa', 'cristal', 'miel', 'sacarosa', 'cristal', 'vapor', 'sacarosa'],
      entra: ['Meladura (y mieles de templas anteriores)', 'Semilla: cristales de azúcar muy finos', 'Vapor para calentar'],
      sale: ['Masa cocida: cristales + miel madre', 'Vapor de agua, que se condensa en el sistema de vacío'],
      composicion: { texto: 'Masa cocida', valor: 'aprox. 90–93 °Brix', origen: 'industrial', fuentes: ['R', 'H'] },
      ocurre: [
        { tipo: 'fisico', titulo: 'Sobresaturación controlada', texto: 'Se evapora agua bajo vacío hasta entrar en la zona metaestable: allí los cristales existentes crecen, pero casi no nacen cristales nuevos. Si se pasa de esa zona aparecen cristales finos indeseados (“falso grano”).' },
        { tipo: 'fisico', titulo: 'Siembra y crecimiento', texto: 'Se agregan núcleos de tamaño controlado y la sacarosa disuelta se deposita sobre sus caras, capa por capa. El operador alimenta meladura para mantener la sobresaturación mientras crecen.' },
        { tipo: 'fisico', titulo: 'Agotamiento en varias templas', texto: 'La miel que queda se vuelve a cocinar en templas sucesivas (sistema de tres masas A, B y C) para recuperar más sacarosa.' },
      ],
      aditivos: { ninguno: 'No se agregan reactivos: la semilla es el mismo azúcar finamente molido. En algunos ingenios se usan auxiliares de cocimiento (tensioactivos) para bajar la viscosidad, según indicación del fabricante.' },
      condiciones: [
        { variable: 'Temperatura de cocimiento', valor: 'aprox. 65–75 °C', origen: 'industrial', porque: 'Gracias al vacío se hierve a baja temperatura: menos color y menos inversión.', fuentes: ['R', 'H'] },
        { variable: 'Presión', valor: 'vacío', origen: 'cualitativo', porque: 'Baja el punto de ebullición de una solución muy concentrada.' },
        { variable: 'Sobresaturación', valor: 'apenas por encima de 1 (zona metaestable)', origen: 'cualitativo', porque: 'Es la fuerza impulsora del crecimiento; demasiada genera falso grano.' },
      ],
      conexion: 'Los colorantes quedan sobre todo en la miel, pero una parte queda atrapada en el cristal. Cuanto más oscuro es el jarabe, más oscuro sale el azúcar.',
      fuentes: ['R', 'H', 'Ho'],
    },
  },
  {
    id: 'centrifugacion', titulo: 'Centrifugación', rotulo: 'Centrífuga: la canasta gira y separa cristales y miel',
    maquina: { archivo: '06-centrifuga.js', global: 'CentrifugaAnimada', w: 1448, h: 1086 },
    descripcion: 'La masa cocida entra en una canasta perforada que gira a gran velocidad. La miel atraviesa la tela y los cristales quedan retenidos; un lavado con agua y vapor los deja más limpios.',
    facts: ['Separación mecánica', 'Cristales', 'Miel'],
    quimica: {
      titulo: 'Separación de fases',
      intro: 'No hay reacción química: la fuerza centrífuga separa el sólido (cristales) del líquido (miel madre), que tiene casi todos los colorantes.',
      particulas: ['cristal', 'miel', 'cristal', 'agua', 'miel', 'cristal', 'cristal', 'miel', 'cristal', 'agua'],
      entra: ['Masa cocida', 'Agua caliente y vapor de lavado'],
      sale: ['Azúcar húmeda: cristales con una película fina de miel', 'Miel: vuelve a los tachos o, agotada, sale como melaza (materia prima para alcohol y levaduras)'],
      ocurre: [
        { tipo: 'fisico', titulo: 'Fuerza centrífuga', texto: 'Al girar, la masa se apoya contra la pared de la canasta. La miel, líquida, pasa por la tela perforada; los cristales, más grandes que los orificios, quedan adentro.' },
        { tipo: 'fisico', titulo: 'Lavado', texto: 'Un rocío de agua caliente y vapor desplaza la película de miel que rodea a cada cristal. Más lavado da un azúcar más blanco, pero redisuelve parte del azúcar, que vuelve con la miel.' },
      ],
      aditivos: { ninguno: 'No se agregan reactivos. Solo agua caliente y vapor de lavado.' },
      condiciones: [
        { variable: 'Velocidad de giro', valor: 'del orden de 1000 rpm o más, según el equipo', origen: 'industrial', porque: 'A mayor velocidad, mayor fuerza para expulsar la miel. Las centrífugas continuas para mieles agotadas trabajan distinto que las de templa.', fuentes: ['R', 'H'] },
        { variable: 'Cantidad de agua de lavado', valor: 'compromiso', origen: 'cualitativo', porque: 'Equilibra blancura con pérdida de azúcar redisuelta.' },
      ],
      conexion: 'Si el jugo traía muchos colorantes, la miel es más oscura y la película que queda sobre el cristal también: el lavado ayuda, pero no corrige todo.',
      fuentes: ['R', 'H', 'C'],
    },
  },
  {
    id: 'secado', titulo: 'Secado', rotulo: 'Secador rotatorio: aire caliente retira la humedad de los cristales',
    maquina: { archivo: '07-secador.js', global: 'SecadorAnimado', w: 1254, h: 1254 },
    descripcion: 'El azúcar húmeda recorre un tambor rotatorio donde el aire caliente evapora el agua superficial. Después se enfría, se clasifica por tamaño y se envasa.',
    facts: ['Aire caliente', 'Menor humedad', 'Azúcar final'],
    quimica: {
      titulo: 'Eliminar humedad para conservar',
      intro: 'Los cristales ya están formados: solo se evapora el agua adherida a su superficie. Un azúcar húmedo o caliente se apelmaza y se deteriora durante el almacenamiento.',
      particulas: ['cristal', 'agua', 'aire', 'cristal', 'vapor', 'cristal', 'aire', 'cristal', 'agua', 'cristal'],
      entra: ['Azúcar húmeda de las centrífugas', 'Aire caliente (y luego aire frío para enfriar)'],
      sale: ['Azúcar seca y fría, lista para clasificar y envasar', 'Aire húmedo con polvo de azúcar, que se recupera en ciclones o lavadores'],
      ocurre: [
        { tipo: 'fisico', titulo: 'Transferencia de calor y de masa', texto: 'El aire caliente entrega calor a los cristales y se lleva el vapor de agua. El giro del tambor y sus paletas exponen todos los cristales al aire.' },
        { tipo: 'fisico', titulo: 'Enfriado', texto: 'Si el azúcar se guarda tibio, la humedad migra y la película de jarabe recristaliza entre los granos: se forman terrones (apelmazamiento).' },
      ],
      aditivos: { ninguno: 'No se agregan aditivos.' },
      condiciones: [
        { variable: 'Humedad final', valor: 'del orden de centésimas de %', origen: 'industrial', porque: 'Con tan poca agua, el azúcar se conserva sin apelmazarse ni favorecer microorganismos.', fuentes: ['R', 'C'] },
        { variable: 'Temperatura del aire', valor: 'moderada', origen: 'cualitativo', porque: 'Debe secar sin calentar demasiado el producto, para no formar color ni favorecer el apelmazamiento.' },
        { variable: 'Temperatura del azúcar al envasar', valor: 'enfriado antes de almacenar', origen: 'cualitativo', porque: 'Evita la migración de humedad dentro de las bolsas o silos.' },
      ],
      conexion: 'El color ya quedó definido en las etapas anteriores: el secado conserva el azúcar que se obtuvo. Su color se mide, por ejemplo, con el método ICUMSA (absorbancia a 420 nm).',
      fuentes: ['R', 'C', 'I'],
    },
  },
];
