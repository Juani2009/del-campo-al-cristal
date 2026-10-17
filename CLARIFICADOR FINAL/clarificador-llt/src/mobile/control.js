import { io } from 'socket.io-client';
import './common.css';
const $=id=>document.getElementById(id), socket=io({reconnection:true});
const names=['Control de pH','Temperatura','Floculante','Caudal'];
const options=[['6,8','7,2','7,8'],['95 °C','100 °C','105 °C'],['1 ppm','3 ppm','6 ppm'],['70 %','100 %','130 %']];
const refs=[1,1,1,1];
let admin=false,state=null;
const message=t=>{$('admin-message').textContent=t;};
function action(name,params={},after=()=>{}){
  if(!admin||!socket.connected){message('No hay acceso de presentadora conectado.');return;}
  socket.timeout(7000).emit('llt:'+name,params,(err,r)=>{
    if(err){message('La computadora no respondió. Revisá la red.');return;}
    if(!r?.ok){message(r?.error||'No se pudo ejecutar la acción.');return;}
    message('Acción aplicada correctamente.');after();
  });
}
function render(){
  $('admin-login').hidden=admin;
  $('admin-content').hidden=false;
  $('admin-actions').hidden=!admin;
  if(!state){message('Esperando el estado del servidor…');return;}
  $('admin-connected').textContent=state.connected;
  $('admin-assigned').textContent=state.stage==='running'?state.registered:'—';
  $('admin-stage').textContent=state.stage==='lobby'?'Sala de espera':'En marcha';
  $('admin-start').disabled=state.stage!=='lobby'||!state.connected;
  $('admin-groups').innerHTML=state.stations.map((st,i)=>{
    const done=st.status==='closed',pending=st.status==='pending',empty=st.status==='empty';
    const words={pending:'Pendiente',open:'Votación abierta',closed:'Finalizada',empty:'Sin votos / sin participantes'};
    let extra='';
    if(done)extra=`<p>Ganadora: <b>${options[i][st.winner]}</b> · ${st.resolution==='desempate_referencia'?'Desempate por referencia didáctica':st.resolution==='seleccion_manual_sin_votos'?'Selección manual sin votos':'Mayoría de votos'}</p>`;
    if(empty&&admin)extra=`<p>Esta estación no tiene votos. Elegí una alternativa para continuar. El sistema indicará que fue una selección manual.</p><select id="ref-${i}">${options[i].map((o,k)=>`<option value="${k}" ${k===refs[i]?'selected':''}>${o}</option>`).join('')}</select> <button data-resolve="${i}">Confirmar selección manual</button>`;
    if(done&&st.resolution==='desempate_referencia')extra+='<p>Empate resuelto con valor didáctico predefinido.</p>';
    return `<article class="group-panel"><div class="group-status">ESTACIÓN 0${i+1} · ${words[st.status]}</div><h2>${names[i]}</h2><p>Grupo 0${i+1} · ${st.total} asignados · ${state.onlineGroups?.[i]??0} conectados</p><div class="group-stat">Votos confirmados: <b>${st.voted} / ${st.total}</b></div>${extra}<div class="group-buttons">${admin&&pending&&state.stage==='running'?`<button data-open="${i}">Abrir estación</button>`:''}${admin&&st.status==='open'?`<button data-close="${i}">Cerrar con votos recibidos</button>`:''}</div></article>`;
  }).join('');
  $('admin-groups').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>action('open',{i:Number(b.dataset.open)}));
  $('admin-groups').querySelectorAll('[data-close]').forEach(b=>{
    b.onclick=()=>{const i=Number(b.dataset.close);if(confirm(`¿Cerrar la estación ${i+1} con los votos registrados?`))action('close',{i});};
  });
  $('admin-groups').querySelectorAll('[data-resolve]').forEach(b=>{
    b.onclick=()=>{const i=Number(b.dataset.resolve),opt=Number($('ref-'+i).value);
      if(confirm('No hay votos. ¿Registrar esta opción como selección manual (no como votación)?'))action('resolve-empty',{i,opt});};
  });
  $('admin-results').textContent=state.choices?`Resultados completos: ${state.choices.map((n,i)=>`${names[i]} = ${options[i][n]}`).join(' · ')}. Valores simulados didácticos, no mediciones de fábrica.`:'El informe final estará disponible cuando las cuatro estaciones tengan un resultado.';
}
$('admin-login').onsubmit=async ev=>{
  ev.preventDefault();const pin=$('pin').value.trim();
  try{const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});const d=await r.json();
    if(!d.ok){message(d.error||'No se pudo ingresar');return;}
    $('pin').value='';message('Acceso concedido.');socket.disconnect().connect();
  }catch{message('No se pudo contactar al servidor');}
};
$('admin-start').onclick=()=>action('start');
$('admin-reset').onclick=()=>{if(confirm('¿Reiniciar toda la experiencia? Se eliminarán todos los votos y grupos anteriores.'))action('reset');};
$('admin-logout').onclick=async()=>{await fetch('/api/logout',{method:'POST'});admin=false;socket.disconnect().connect();render();message('Sesión de presentadora cerrada.');};
socket.on('connect',()=>{$('connection').textContent='● Red local activa';$('connection').classList.add('ok');fetch('/api/me').then(r=>r.json()).then(d=>{admin=!!d.admin;render();});});
socket.on('disconnect',()=>{$('connection').textContent='○ Reconectando';$('connection').classList.remove('ok');});
socket.on('connect_error',()=>{$('connection').textContent='○ Sin conexión';$('connection').classList.remove('ok');message('Comprobá que Vite esté iniciado en la Lenovo.');});
socket.on('llt:admin',s=>{admin=true;state=s;render();});
socket.on('llt:state',s=>{if(!admin){state=s;render();}});
render();
