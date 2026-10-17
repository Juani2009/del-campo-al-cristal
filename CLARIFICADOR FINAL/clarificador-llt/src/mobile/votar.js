import { io } from 'socket.io-client';
import './common.css';
const $=id=>document.getElementById(id);
const isDemo=new URL(location.href).searchParams.has('demo');
const storage=isDemo?sessionStorage:localStorage;
function uuid(){
  const a=new Uint8Array(16);crypto.getRandomValues(a);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;
  const s=[...a].map(n=>n.toString(16).padStart(2,'0')).join('');
  return [s.slice(0,8),s.slice(8,12),s.slice(12,16),s.slice(16,20),s.slice(20)].join('-');
}
let id=storage.getItem('llt-participant-v2');if(!id){id=uuid();storage.setItem('llt-participant-v2',id);}
const socket=io({reconnection:true});
let member=null,state=null,picked=null, sending=false;
function htmlSafe(str){return String(str).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function setMessage(t){$('mobile-message').textContent=t;}
const labels=['pH','Temperatura','Floculante','Caudal'];
function render(){
  const panel=$('mobile-panel');
  if(!socket.connected){panel.innerHTML='<span class="label">RECONEXIÓN</span><h1>Esperando conexión local…</h1><p>Conectate al Wi-Fi del hotspot y mantené abierta esta página.</p>';return;}
  if(!member||!state){panel.innerHTML='<h1>Entrando a la sala de espera…</h1><p>No necesitás escribir tu nombre.</p>';return;}
  if(state.stage==='lobby'){
    panel.innerHTML='<span class="label">LLT · SALA DE ESPERA</span><h1>¡Ya estás participando!</h1><p>La presentadora está esperando a los demás. Cuando comience la experiencia, aparecerá tu grupo automáticamente.</p><div class="done-symbol">✓</div><p>No cierres esta página. No necesitás internet.</p>';
    return;
  }
  if(member.spectator||!member.assigned){panel.innerHTML='<span class="label">SESIÓN EN CURSO</span><h1>La experiencia ya comenzó</h1><p>Este dispositivo no estaba registrado cuando se formaron los grupos. Podrás ingresar en la próxima sesión.</p>';return;}
  const g=member.group,st=member.station;
  if(g===null||!st){panel.innerHTML='<h1>Esperando grupo…</h1>';return;}
  const pre=`<span class="label">GRUPO ${String(g+1).padStart(2,'0')} · ${labels[g]}</span><div class="group-circle">${String(g+1).padStart(2,'0')}</div>`;
  if(st.votedAlready){
    panel.innerHTML=pre+`<div class="done-symbol">✓</div><h1>¡Voto registrado!</h1><p>Tu elección se guardó correctamente. ${st.status==='open'?'Esperá a que tus compañeros terminen de votar.':'La estación ya terminó.'}</p>`;
    return;
  }
  if(st.status==='pending'){
    panel.innerHTML=pre+`<h1>Tu equipo decidirá ${labels[g].toLowerCase()}</h1><p>Esperá a que la presentadora llegue a esta estación del clarificador. La pregunta aparecerá automáticamente.</p>`;
    return;
  }
  if(st.status==='empty'||st.status==='closed'){
    panel.innerHTML=pre+`<h1>Esta estación terminó</h1><p>No se registró un voto de este dispositivo. La presentadora continuará con los resultados disponibles.</p>`;
    return;
  }
  panel.innerHTML=pre+`<h1>${htmlSafe(st.question)}</h1><p>Seleccioná una alternativa y confirmá tu voto. No podrás cambiarlo después.</p><div class="vote-options">${st.options.map((o,i)=>`<button type="button" class="vote-option ${picked===i?'selected':''}" data-choice="${i}" aria-pressed="${picked===i}">${htmlSafe(o)}<span>${picked===i?'✓':''}</span></button>`).join('')}</div><button id="vote-send" type="button" class="primary vote-submit" ${picked===null||sending?'disabled':''}>Confirmar mi voto</button>`;
  panel.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>{if(sending)return;picked=Number(btn.dataset.choice);render();});
  $('vote-send').onclick=()=>{
    if(picked===null||sending||!socket.connected)return;
    const opt=picked;sending=true;render();
    socket.timeout(8000).emit('llt:vote',{i:g,opt},(err,r)=>{
      sending=false;
      if(err){setMessage('No se recibió confirmación. Revisá tu conexión y volvé a intentar.');render();return;}
      if(!r?.ok){setMessage(r?.error||'No se pudo registrar el voto.');render();return;}
      setMessage('¡Tu voto fue confirmado por la computadora!');
      // Llegará el estado actualizado en tiempo real desde el servidor.
      if(member?.station){member.station.votedAlready=true;member.station.myChoice=opt;}
      render();
    });
  };
}
function enter(){socket.timeout(8000).emit('llt:join',{id},(err,r)=>{
  if(err){setMessage('Sin respuesta de la computadora. Se reintentará al reconectar.');return;}
  if(!r?.ok){setMessage(r?.error||'No fue posible entrar.');return;}
  member=r.state;render();
});}
socket.on('connect',()=>{$('connection').textContent='● Red local activa';$('connection').classList.add('ok');setMessage('');enter();});
socket.on('disconnect',()=>{$('connection').textContent='○ Reconectando';$('connection').classList.remove('ok');render();});
socket.on('connect_error',()=>{$('connection').textContent='○ Sin conexión';$('connection').classList.remove('ok');setMessage('Verificá que la computadora y este celular estén conectados al mismo hotspot.');render();});
socket.on('llt:state',s=>{
  if(state?.epoch!==s.epoch){picked=null;sending=false;}
  state=s;render();
});
socket.on('llt:member',m=>{if(member?.epoch!==m.epoch||member?.station?.status!==m.station?.status)picked=null;member=m;render();});
render();
