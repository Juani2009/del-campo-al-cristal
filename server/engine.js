/* Motor de votaciones: lógica pura y persistencia administrada por el servidor.
   Todos los participantes registrados votan en cada una de las cuatro estaciones (no hay reparto en grupos).
   Los indicadores industriales no se calculan aquí: se reutiliza rules.js en la pantalla. */
import { randomUUID } from 'node:crypto';
import { VARS } from '../src/interactive/rules.js';

export const REFERENCE_INDEX = [1, 1, 1, 1]; // desempate pedagógico: 7,2 / 100°C / 3 ppm / 100%
const now = () => new Date().toISOString();
const station = () => ({ status:'pending', votes:{}, winner:null, resolution:null, tied:[], openedAt:null, closedAt:null });
const fresh = () => ({ epoch:randomUUID(), stage:'lobby', createdAt:now(), participants:{}, stations:Array.from({length:4},station) });
const validId = id => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export function makeEngine(initial, save=()=>{}) {
  let s = initial && typeof initial === 'object' && Array.isArray(initial.stations) && initial.stations.length === 4 && initial.participants ? initial : fresh();
  const online = new Map(); // pid -> Set(socketId), presencia volátil (NO se guarda en disco)
  const persist = () => save(s);
  const total = () => Object.keys(s.participants).length;
  const connectedCount = () => Object.keys(s.participants).filter(id=>online.get(id)?.size).length;
  const counts = () => Array.from({length:4},total);   // cada estación la votan todos
  const countVotes = st => Object.keys(st.votes).length;
  const picks = () => s.stations.every(st=>Number.isInteger(st.winner)) ? s.stations.map(st=>st.winner) : null;
  const resolve = (i) => {
    const st=s.stations[i], totals=[0,0,0]; Object.values(st.votes).forEach(v=>totals[v]++);
    const max=Math.max(...totals);
    st.status=max ? 'closed' : 'empty'; st.closedAt=now();
    if (!max) { st.winner=null; st.resolution='sin_votos'; return; }
    const tied=totals.flatMap((n,j)=>n===max?[j]:[]);
    st.tied=tied;
    if(tied.length===1){st.winner=tied[0];st.resolution='mayoria';return;}
    const r=REFERENCE_INDEX[i];
    st.winner=tied.slice().sort((a,b)=>Math.abs(a-r)-Math.abs(b-r)||a-b)[0];
    st.resolution='desempate_referencia';
  };
  const publicStation = (st,i,admin=false) => ({
    status:st.status, began:st.status!=='pending', open:st.status==='open',
    total:total(), voted:countVotes(st), winner:st.winner, resolution:st.resolution,
    tied:st.status==='closed'?st.tied:[],
    ...(admin?{counts:[0,1,2].map(k=>Object.values(st.votes).filter(v=>v===k).length)}:{})
  });
  const publicState = (admin=false) => ({
    epoch:s.epoch,stage:s.stage,registered:Object.keys(s.participants).length,
    connected:connectedCount(),
    groups:counts(),stations:s.stations.map((st,i)=>publicStation(st,i,admin)),choices:picks(),
    ...(admin?{onlineGroups:counts().map(()=>connectedCount())}:{})
  });
  function join(id,socketId) {
    if (!validId(id)) return {ok:false,error:'Identificador inválido'};
    if(s.stage==='lobby' && !s.participants[id]) {
      if(Object.keys(s.participants).length>=64)return {ok:false,error:'Sala llena; consultá a la presentadora'};
      s.participants[id]={joinedAt:now()};persist();}
    if(!online.has(id)) online.set(id,new Set()); online.get(id).add(socketId);
    return {ok:true,spectator:!s.participants[id], state:member(id)};
  }
  function leave(id,socketId) {
    const set=online.get(id); if(!set) return;set.delete(socketId);if(!set.size)online.delete(id);
    // En sala de espera, desconectados no ocupan lugar en el reparto.
    if(s.stage==='lobby'&&!online.has(id)&&s.participants[id]) {delete s.participants[id];persist();}
  }
  // Estación que ve cada celular: la abierta; si no hay, la última que terminó (o la primera si todavía no empezó ninguna).
  const currentIndex = () => {
    const open=s.stations.findIndex(st=>st.status==='open');if(open>=0)return open;
    const next=s.stations.findIndex(st=>st.status==='pending');
    return next<0?3:Math.max(0,next-1);
  };
  function member(id) {
    const p=s.participants[id], i=p&&s.stage!=='lobby'?currentIndex():null;
    const st=i===null?null:s.stations[i];
    return {epoch:s.epoch,stage:s.stage,assigned:!!p,spectator:s.stage!=='lobby'&&!p,
      votedCount:p?s.stations.filter(x=>Object.hasOwn(x.votes,id)).length:0,
      finished:s.stations.every(x=>x.status!=='pending'&&x.status!=='open'),
      station:st?{...publicStation(st,i),index:i,question:VARS[i].q,options:VARS[i].opts.map(o=>o.l),votedAlready:Object.hasOwn(st.votes,id),myChoice:st.votes[id]??null}:null};
  }
  function start() {
    if(s.stage!=='lobby')return {ok:false,error:'La experiencia ya comenzó'};
    // Los participantes deben tener una conexión activa en este instante.
    const ids=Object.keys(s.participants).filter(id=>online.get(id)?.size);
    if(!ids.length)return {ok:false,error:'Todavía no hay celulares conectados'};
    // Ya no se reparten grupos: quienes están conectados al iniciar votan en las cuatro estaciones.
    s.participants=Object.fromEntries(ids.map(id=>[id,s.participants[id]]));
    s.stage='running';persist();return {ok:true};
  }
  function open(i) {
    if(s.stage!=='running')return {ok:false,error:'Primero iniciá la experiencia'};
    if(!Number.isInteger(i)||i<0||i>3)return {ok:false,error:'Estación inválida'};
    const st=s.stations[i];if(st.status!=='pending')return {ok:true,already:true};
    if(s.stations.slice(0,i).some(prior=>!['closed','empty'].includes(prior.status)))return {ok:false,error:'Primero debe cerrarse la estación anterior'};
    st.status=total()?'open':'empty';st.openedAt=now();
    if(st.status==='empty'){st.resolution='sin_participantes';st.closedAt=now();}
    persist();return {ok:true};
  }
  function vote(id,i,opt) {
    if(s.stage!=='running')return {ok:false,error:'La sesión todavía no comenzó'};
    if(!s.participants[id])return {ok:false,error:'Este dispositivo no estaba registrado al comenzar'};
    if(!Number.isInteger(i)||i<0||i>3)return {ok:false,error:'Estación incorrecta'};
    if(!Number.isInteger(opt)||opt<0||opt>=VARS[i].opts.length)return {ok:false,error:'Opción incorrecta'};
    const st=s.stations[i];if(st.status!=='open')return {ok:false,error:'La votación no está abierta'};
    if(Object.hasOwn(st.votes,id))return {ok:false,error:'Tu voto ya fue registrado'};
    st.votes[id]=opt;
    if(countVotes(st)>=total())resolve(i);   // votaron todos → se cierra
    persist();return {ok:true,closed:st.status==='closed'};
  }
  function close(i){
    if(!Number.isInteger(i)||i<0||i>3)return {ok:false,error:'Estación incorrecta'};
    const st=s.stations[i];if(st.status!=='open')return {ok:false,error:'Esta estación no está abierta'};
    resolve(i);persist();return {ok:true};
  }
  function resolveEmpty(i,opt){
    if(!Number.isInteger(i)||i<0||i>3||!Number.isInteger(opt)||opt<0||opt>2)return {ok:false,error:'Opción inválida'};
    const st=s.stations[i];if(st.status!=='empty')return {ok:false,error:'La estación no está sin votos'};
    st.status='closed';st.winner=opt;st.resolution='seleccion_manual_sin_votos';st.closedAt=now();persist();return {ok:true};
  }
  function reset(){
    const connected=[...online.entries()].filter(([,sockets])=>sockets.size).map(([id])=>id);
    s=fresh();connected.forEach(id=>s.participants[id]={joinedAt:now()});
    persist();return {ok:true};
  }
  function expireOpen(timeoutMs=90000){
    let changed=false;
    for(let i=0;i<4;i++){
      const st=s.stations[i];
      if(st.status==='open' && st.openedAt && Date.now()-Date.parse(st.openedAt)>=timeoutMs){
        resolve(i);changed=true;
      }
    }
    if(changed)persist();
    return changed;
  }
  function load(){return s;}
  return {join,leave,member,start,open,vote,close,resolveEmpty,reset,expireOpen,publicState,load,picks};
}
