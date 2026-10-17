/* LLT · Puente entre el clarificador original y el servidor real de votaciones.
   No interviene en WebGL, geometría, reloj ni cámara. Scroll libre. */
import { io } from 'socket.io-client';
import QRCode from 'qrcode';
import { VARS, computeResults, animationParams } from './rules.js';
import { resultView } from './results.js';
import { cardHTML } from '../components/cards.js';
import './presentation.css';

const GATE = [.165,.195,.405,.545];
const EPS=.004, WIN_AFTER=.035;
const $=id=>document.getElementById(id);
const clamp=x=>Math.max(0,Math.min(1,x));
const emit=(n,d)=>window.dispatchEvent(new CustomEvent(n,{detail:d}));
const socket=io({reconnection:true});
let sceneRequested=false;
function launchScene(){if(sceneRequested)return;sceneRequested=true;const run=()=>window.LLTStartScene?.().catch(e=>{console.error('No se pudo cargar el 3D',e);info.textContent='Error al abrir el modelo 3D. Revisá la terminal.';});if(window.LLTStartScene)run();else window.addEventListener('llt:escena-disponible',run,{once:true});}
const vcard=$('vcard'),resEl=$('res'),root=$('lobby'),info=$('lobby-status');
let unlockAttempted=false;
let snapshot=null, admin=false, active=-1, resultKey=null, lastChoices=[], ipSelected='';
const requested=new Set(),retryAt=[0,0,0,0];
let progress=0;
const opts=VARS.map(v=>v.opts.map(o=>o.l));

function adaptState(){
  if(!snapshot)return null;
  return {gc:snapshot.groups,st:snapshot.stations.map(st=>({
    status:st.status,open:st.open,allowed:[0,1,2],voted:st.voted,total:st.total,resolution:st.resolution,
    res:st.winner===null?(st.status==='empty'?{k:'empty'}:null):{k:st.resolution==='seleccion_manual_sin_votos'?'ref':'winner',idx:st.winner},
    rounds:[{}]
  }))};
}
function repaintCard(){if(active>=0&&snapshot)vcard.innerHTML=cardHTML(adaptState(),active);}
function buildResults(){
  const choices=snapshot?.choices, key=choices?.join(',')||'';
  if(key===resultKey)return;resultKey=key;
  if(!choices){resEl.innerHTML='';return;}
  resEl.innerHTML=`<div class="in">${resultView(choices)}</div>`;
  const button=$('backResult');if(button){button.textContent='Nueva sesión grupal';button.onclick=()=>{
    if(!admin){alert('Reiniciá la experiencia desde el panel de presentadora.');return;}
    if(!confirm('¿Reiniciar todos los votos y grupos?'))return;
    socket.emit('llt:reset',{},r=>{if(!r?.ok)alert(r?.error||'No se pudo reiniciar');else scrollTo({top:0});});
  };}
  emit('llt:resultado',animationParams(computeResults(choices)));
}
function getViewURL(ip,port){return `http://${ip}:${port}/votar`;}
function renderAddresses(data){
  const selector=$('llt-ips');selector.innerHTML='';const ipList=data.ips||[];
  for(const ip of ipList){const op=document.createElement('option');op.value=ip;op.textContent=ip;selector.appendChild(op);}
  const pref=localStorage.getItem('llt-preferred-ip');
  ipSelected=ipList.includes(pref)?pref:(ipList.find(ip=>ip.startsWith('172.20.10.'))||ipList[0]||'');
  selector.value=ipSelected;
  const refresh=()=>{
    ipSelected=selector.value;localStorage.setItem('llt-preferred-ip',ipSelected);
    const u=ipSelected?getViewURL(ipSelected,data.port):'';
    $('llt-local-url').textContent=u||'Conectá la computadora al hotspot o router.';
    $('llt-qr').style.display=ipSelected?'block':'none';
    if(ipSelected)$('llt-qr').src=`/api/qr?ip=${encodeURIComponent(ipSelected)}&t=${Date.now()}`;
  };
  selector.onchange=refresh;refresh();
  $('llt-refresh-qr').onclick=async()=>{try{const d=await (await fetch('/api/info')).json();renderAddresses(d);}catch{info.textContent='No se pudo actualizar la red';}};
}
async function loadInfo(){try{const r=await fetch('/api/info');if(r.ok)renderAddresses(await r.json());}catch{info.textContent='Esperando servidor local…';}}
// QR estándar de Wi-Fi: solicitud de conexión, no enlace web ni conexión silenciosa.
// Los datos quedan solo en sessionStorage de ESTE navegador; jamás se envían al servidor.
const escWiFi=x=>String(x).replace(/([\\;,:"\\])/g,'\\$1');
async function updateWiFiQR(){
  const name=$('llt-wifi-name').value.trim(),pwd=$('llt-wifi-password').value;
  const security=$('llt-wifi-security').value;
  const img=$('llt-wifi-qr'),placeholder=$('llt-wifi-placeholder');
  if(!name || (security!=='nopass'&&!pwd)){
    img.hidden=true;img.removeAttribute('src');placeholder.hidden=false;return;
  }
  const content=`WIFI:T:${security};S:${escWiFi(name)};${security==='nopass'?'':`P:${escWiFi(pwd)};`}H:false;;`;
  try{img.src=await QRCode.toDataURL(content,{width:290,margin:2,errorCorrectionLevel:'M'});
    img.hidden=false;placeholder.hidden=true;
    sessionStorage.setItem('llt-wifi-config',JSON.stringify({name,pwd,security}));
  }catch(e){img.hidden=true;placeholder.hidden=false;placeholder.textContent='No se pudo generar el QR de Wi-Fi';console.error(e);}
}
$('llt-wifi-form').onsubmit=ev=>{ev.preventDefault();updateWiFiQR();$('llt-wifi-settings').open=false;};
$('llt-wifi-clear').onclick=()=>{
  $('llt-wifi-name').value='';$('llt-wifi-password').value='';
  sessionStorage.removeItem('llt-wifi-config');updateWiFiQR();
};
try{const saved=JSON.parse(sessionStorage.getItem('llt-wifi-config')||'null');if(saved){$('llt-wifi-name').value=saved.name||'';$('llt-wifi-password').value=saved.pwd||'';$('llt-wifi-security').value=saved.security||'WPA';updateWiFiQR();}}catch{}
// El QR del hotspot puede ser leído por cualquier persona que lo vea: no mostrar a desconocidos.
function setLogin(){
  const login=$('llt-admin-login'),start=$('llt-start'),label=$('llt-host-state');
  login.hidden=admin;$('llt-admin-advanced').hidden=admin;
  start.disabled=!admin||snapshot?.stage!=='lobby'||!snapshot?.connected;
  label.textContent=admin?'Presentadora conectada ✓':'En la Lenovo abrí la página desde localhost para habilitar el inicio. Si hace falta, desplegá Acceso de presentadora.';
}
function updateLobby(){
  const lobby=snapshot?.stage!=='running';
  root.hidden=!lobby;
  document.documentElement.classList.toggle('llt-lobby-locked',lobby);
  document.body.classList.toggle('llt-lobby-locked',lobby);
  $('llt-count').textContent=String(snapshot?.connected??0);
  $('llt-session-label').textContent=snapshot?.stage==='lobby'?'Sala de espera · sin nombres':'Conectando con el servidor…';
  setLogin();
}
async function login(ev){
  ev.preventDefault();const pin=$('llt-pin').value.trim();
  if(!pin){info.textContent='Escribí el PIN de la terminal';return;}
  try{const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});const d=await r.json();
    if(!d.ok){info.textContent=d.error||'PIN incorrecto';return;}
    $('llt-pin').value='';info.textContent='¡Presentadora conectada!';
    socket.disconnect().connect();
  }catch{info.textContent='No se pudo conectar con el servidor';}
}
function onState(s){
  const oldEpoch=snapshot?.epoch;
  snapshot=s;if(oldEpoch!==s.epoch){requested.clear();retryAt.fill(0);lastChoices=[];resultKey=null;scrollTo(0,0);}
  if(s.stage!=='lobby'){
    s.stations.forEach((st,i)=>{
      if(st.status!=='pending')requested.add(i);
      if(Number.isInteger(st.winner)&&lastChoices[i]!==st.winner){
        emit('llt:votacion-fin',{estacion:i,variable:VARS[i].name,idx:st.winner,valor:VARS[i].opts[st.winner].l,votos:st.voted});
      }
      lastChoices[i]=st.winner;
    });
  }
  updateLobby();if(s.stage==='running')launchScene();repaintCard();buildResults();
}
$('llt-admin-login').addEventListener('submit',login);
$('llt-start').addEventListener('click',()=>{
  if(!admin)return;
  socket.emit('llt:start',{},r=>{if(!r?.ok){info.textContent=r?.error||'No se pudo iniciar';return;}scrollTo(0,0);});
});
$('llt-open-control').onclick=()=>window.open('/control','_blank','noopener');
socket.on('connect',async()=>{
  info.textContent='Conexión local activa';loadInfo();
  // Si la presentación está abierta en localhost, autorizar la Lenovo sin PIN.
  if(['localhost','127.0.0.1'].includes(location.hostname)&&!admin&&!unlockAttempted){
    unlockAttempted=true;
    try{const r=await fetch('/api/local-unlock',{method:'POST'});if(r.ok){socket.disconnect().connect();return;}}catch{}
  }
});
socket.on('connect_error',()=>{info.textContent='Sin conexión con el servidor de votaciones';});
socket.on('disconnect',()=>{admin=false;info.textContent='Conexión perdida. Reintentando…';setLogin();});
socket.on('llt:state',onState);
socket.on('llt:admin',()=>{admin=true;setLogin();});

function tick(p){
  progress=p;
  if(snapshot?.stage==='running'&&admin&&socket.connected){
    for(let i=0;i<GATE.length;i++)if(p>=GATE[i]-EPS&&snapshot.stations[i].status==='pending'&&!requested.has(i)&&Date.now()>=retryAt[i]){
      requested.add(i);socket.emit('llt:open',{i},r=>{
        if(!r?.ok){requested.delete(i);retryAt[i]=Date.now()+1500;if(!String(r?.error).startsWith('Primero'))info.textContent=r?.error||'Error al abrir votación';}
        else emit('llt:votacion-inicio',{estacion:i,variable:VARS[i].name});
      });
    }
  }
  let a=-1;for(let i=0;i<4;i++)if(p>=GATE[i]-EPS)a=i;
  if(a!==active){active=a;repaintCard();}
  const alpha=a<0?0:clamp((p-(GATE[a]-EPS-.003))/.004)*clamp((GATE[a]+WIN_AFTER-p)/.012);
  vcard.style.opacity=alpha;vcard.style.visibility=alpha>.01?'visible':'hidden';
  document.body.classList.toggle('vote-on',alpha>.05);
  const ra=snapshot?.choices?clamp((p-.985)/.015):0;
  resEl.style.opacity=ra;resEl.classList.toggle('on',ra>.5);
  document.body.classList.toggle('res-on',ra>.05);
  const missing=$('llt-results-missing');missing.hidden=!(p>.985&&snapshot?.stage==='running'&&!snapshot?.choices);
}
$('tbtn').hidden=true;$('tpanel').hidden=true;
document.body.classList.add('clean');
loadInfo();updateLobby();
window.LLTLive={socket,estado:()=>snapshot};
export const Votes={tick,gateP:()=>null};
