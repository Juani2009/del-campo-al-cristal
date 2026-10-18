import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('La pantalla de entrada ofrece modo grupal e individual',()=>{
 const html=read('clarificador.html');
 assert.match(html,/id="mode-choice"/);
 assert.match(html,/href="clarificador\.html\?modo=grupal"/);
 assert.match(html,/href="clarificador\.html\?modo=individual"/);
});
test('El modo individual no genera toolbar técnico',()=>{
 const js=read('src/interactive/solo.js');
 assert.doesNotMatch(js,/document\.createElement\('aside'\)|solo-settings|LLTQuality/);
});
test('El QR Wi-Fi y el QR de votación están diferenciados',()=>{
 const html=read('clarificador.html'),js=read('src/interactive/voting.js');
 assert.match(html,/id="llt-wifi-qr"/);
 assert.match(html,/id="llt-qr"/);
 assert.match(js,/WIFI:T:/);
 assert.match(js,/QRCode\.toDataURL/);
});
test('El servidor usa un tiempo límite predeterminado de 60 segundos',()=>{
 assert.match(read('server/plugin.js'),/LLT_VOTE_TIMEOUT_MS\)\|\|60000/);
});
test('3D se carga solo después de elegir modalidad/iniciar, con resolución adaptativa',()=>{
 const js=read('src/main.js'),model=read('src/llt/clarificador.js');
 assert.match(js,/await import\('\.\/llt\/clarificador\.js'\)/);
 assert.match(js,/window\.LLTStartScene/);
 assert.match(model,/const PR_MAX=Math\.min\(devicePixelRatio\|\|1,2\)/);   // resolución adaptativa, hasta 2×
 assert.match(model,/function adaptar\(dt,ts\)/);
 assert.doesNotMatch(model,/window\.LLTQuality/);
});
