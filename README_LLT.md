# Clarificador LLT · Experiencia interactiva final

Proyecto Vite basado en la versión original del clarificador Crompion LLT. Conserva la máquina 3D, las tarjetas de decisión y los indicadores del modelo educativo, e incorpora una bienvenida con **modo individual y grupal**, **dos QR** y un **panel de seguimiento**.

## Primer uso en Windows (con internet una sola vez)

1. Extraé el ZIP en una **carpeta nueva**. Abrí en VS Code la subcarpeta `clarificador-llt` que contiene `package.json`, o abrí CMD directamente en esa carpeta.
2. Ejecutá `npm install`. Descarga localmente Vite, Three.js, Anime.js, Socket.IO y la generación de QR. `package-lock.json` se creará al instalar; conservá el archivo para reinstalaciones posteriores.
3. Ejecutá `npm test` y `npm run check` para revisar lógica e importaciones.
4. Ejecutá `npm run dev` y abrí `http://localhost:5173/` en la Lenovo.
5. Elegí **Grupal** o **Individual**. Si elegís grupal, se abre la sala con los QR. La Lenovo abierta en `localhost` adquiere automáticamente autorización para iniciar; en caso contrario, podés usar el PIN generado en la terminal mediante la opción avanzada de la sala.

## Nuevas funciones

- **Pantalla inicial**: opciones grandes «Experiencia grupal» y «Experiencia individual».
- **Individual**: cuatro decisiones locales y un resultado final propio, sin votar con el servidor. La página no muestra botón de gráficos ni una barra técnica.
- **Grupal**: código QR 1 para **solicitar** unirse al Wi-Fi y QR 2 para entrar a `votar`. El primer QR se configura en «Configurar QR de Wi-Fi»: ingresá **SSID** y contraseña exactos. Sus datos quedan **solo en sessionStorage del navegador presentador**, nunca en el código fuente ni en el servidor. Quien vea/escanee ese QR puede obtener acceso a la red; mostrárselo únicamente a participantes autorizados. **Unirse al Wi-Fi requiere confirmación del teléfono compatible**. Si no soporta QR Wi-Fi, conectarse manualmente.
- **Centro de seguimiento** `/control`: se ve sin PIN; muestra participantes, votos y decisiones. Administración/acciones extraordinarias en sección plegada protegida por PIN.
- **Tiempo de votación**: máximo 60 segundos a partir de la apertura; si todos votan antes se cierra de inmediato. Empates por referencia didáctica. Si ninguna persona vota, el sistema no inventa ganador; se resuelve explícitamente desde administración.
- **3D siempre liviano**: resolución limitada, objetivo 30 FPS en móvil / 45 FPS en computadora; la escena pesada **no se carga** durante la pantalla inicial ni la espera. Mantiene las geometrías, la trayectoria de cámara y el reloj de simulación independientes del scroll.
- **Sin internet**: tras instalar las dependencias, basta una red Wi-Fi local que permita comunicación entre dispositivos.

## Rutas de la aplicación

Desarrollo (`npm run dev`, puerto 5173):

- `http://localhost:5173/` — elección de modo.
- `http://localhost:5173/?modo=grupal` — sala, dos QR, iniciar exposición.
- `http://localhost:5173/?modo=individual` — recorrido personal.
- `http://localhost:5173/votar` — interfaz muy liviana para alumnos.
- `http://localhost:5173/control` — seguimiento y administración protegida.

Si querés probar en el colegio sin abrir VS Code, ejecutá **una vez** `npm run build`, y luego `npm run serve` para publicar las páginas por el puerto 4173. Hay instrucciones para crear un **acceso directo de Windows** sin ejecutar `.bat` bloqueados en `GUIA_DE_INICIO_FACIL.txt`.

## Preparar la sala grupal

1. Conectá la Lenovo al hotspot/router local. Si cambió la red, reiniciá el servidor y elegí la nueva IP en la sala.
2. Usá `localhost` en la propia Lenovo, abrí **Grupal** y expandí «Configurar QR de Wi-Fi». Ingresá nombre y contraseña de la red seleccionada, generá QR y colapsá la configuración.
3. Los alumnos escanean el QR de Wi-Fi y confirman (o se conectan manualmente). Después escanean el QR «Participar».
4. Cuando veas a los participantes conectados, presioná «Iniciar experiencia». Todos los celulares conectados votan en cada una de las cuatro estaciones (pensado para unas 6 personas), sin pedir nombres. El recorrido y el líquido siguen con scroll libre; el servidor abre cada estación cuando corresponde.
5. Tu compañero puede mirar `http://IP-DE-LENOVO:5173/control` sin PIN. No necesita cargar votos ni resultados. El sistema cierra al recibir todos los votos o tras 60 segundos. Si una estación queda sin votos, requiere una selección explícita de administración, identificada como manual.
6. Para repetir, abrí Administración desde `/control`, iniciá sesión y confirmá «Reiniciar toda la experiencia».

**Capacidad de dispositivos:** el motor permite más de 20 participantes, pero la capacidad real de conexiones del hotspot/router NO está garantizada; probá 18–20 equipos antes de exponer. Algunos extensores requieren un router principal. Si el celular no abre la URL, revisá que esté en la misma red, que no haya aislamiento de clientes y que Avast permita el acceso en tu red privada confiable. Nunca desactives todo el firewall.

## Arquitectura y límites de pruebas

- `src/llt/` — máquina, animaciones y recorrido originales.
- `src/interactive/solo.js` — selección individual.
- `src/interactive/voting.js` — integración de votaciones y QR Wi-Fi.
- `src/mobile/` — vista de votante y seguimiento.
- `server/engine.js` y `server/plugin.js` — estado, temporizador, Socket.IO, permisos y persistencia.
- `test/` — pruebas automáticas.

Los resultados industriales son **estimaciones didácticas**, no mediciones de planta. El usuario debe comprobar en su computadora las animaciones, el QR Wi-Fi, el inicio de sesión local, la compilación (`npm run build`) y las conexiones de red. Las pruebas de motor y sintaxis hechas durante la preparación del ZIP no sustituyen el ensayo con dispositivos reales.
