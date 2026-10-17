import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {makeEngine,REFERENCE_INDEX} from '../server/engine.js';
import {cardHTML} from '../src/components/cards.js';
const setup = n => {
  const saved=[];const e=makeEngine(null,s=>saved.push(structuredClone(s)),()=>0);
  const ids=Array.from({length:n},()=>randomUUID());
  ids.forEach((id,i)=>assert.equal(e.join(id,'sock-'+i).ok,true));
  return {e,ids,saved};
};
const groupIds=(e,ids,g)=>ids.filter(id=>e.load().participants[id]?.group===g);

test('El reparto con 16, 15, 2 y 1 celular es equilibrado y sin nombres',()=>{
  for(const n of [16,15,2,1]){
    const {e,ids}=setup(n);assert.equal(e.start().ok,true);
    assert.equal(e.publicState().registered,n);
    const g=e.publicState().groups;assert.equal(g.reduce((a,b)=>a+b,0),n);
    assert.ok(Math.max(...g)-Math.min(...g)<=1);
    assert.ok(ids.every(id=>Number.isInteger(e.member(id).group)));
  }
});

test('Solo vota el grupo correcto, una vez, y cierra automáticamente al completar',()=>{
  const {e,ids}=setup(8);e.start();e.open(0);
  const [id1,id2]=groupIds(e,ids,0),other=groupIds(e,ids,1)[0];
  assert.equal(e.vote(other,0,1).ok,false);
  assert.equal(e.vote(id1,0,100).ok,false);
  assert.equal(e.vote(id1,0,1).ok,true);
  assert.equal(e.vote(id1,0,2).ok,false);
  assert.equal(e.publicState().stations[0].status,'open');
  assert.equal(e.vote(id2,0,1).ok,true);
  assert.equal(e.publicState().stations[0].winner,1);
  assert.equal(e.publicState().stations[0].status,'closed');
  assert.equal(e.vote(id1,0,1).ok,false);
  assert.equal(e.open(0).already,true);
});

test('Empate 2-2 favorece el valor de referencia (NO segunda ronda)',()=>{
  const {e,ids}=setup(16);e.start();e.open(0);
  groupIds(e,ids,0).forEach(id=>e.vote(id,0,1));e.open(1);
  const g=groupIds(e,ids,1);assert.equal(g.length,4);
  [0,0,1,1].forEach((o,k)=>e.vote(g[k],1,o));
  const s=e.publicState().stations[1];
  assert.equal(s.winner,REFERENCE_INDEX[1]);assert.equal(s.resolution,'desempate_referencia');
});

test('Scroll libre, votaciones secuenciales: siguiente estación espera resultado previo sin frenar cámara',()=>{
  const {e,ids}=setup(4);e.start();
  assert.equal(e.open(2).ok,false);assert.equal(e.open(0).ok,true);
  assert.equal(e.open(1).ok,false);
  e.vote(groupIds(e,ids,0)[0],0,1);
  assert.equal(e.open(1).ok,true);
  assert.equal(e.publicState().stations[1].status,'open');
});

test('Con dos alumnos dos grupos sin participantes; requieren decisión manual',()=>{
  const {e,ids}=setup(2);e.start();
  e.open(0);e.vote(groupIds(e,ids,0)[0],0,1);
  e.open(1);e.vote(groupIds(e,ids,1)[0],1,1);
  e.open(2);
  assert.equal(e.publicState().stations[2].status,'empty');
  assert.equal(e.publicState().stations[2].winner,null);
  assert.equal(e.resolveEmpty(2,1).ok,true);
  assert.equal(e.publicState().stations[2].resolution,'seleccion_manual_sin_votos');
  e.open(3);assert.equal(e.publicState().stations[3].winner,null);
  assert.equal(e.picks(),null);
});

test('Cierre con cero votos nunca inventa ganador',()=>{
  const {e}=setup(4);e.start();e.open(0);assert.equal(e.close(0).ok,true);
  assert.equal(e.publicState().stations[0].status,'empty');
  assert.equal(e.publicState().stations[0].winner,null);
});

test('Reingreso mismo identificador conserva grupo y voto; invitados tardíos no se asignan',()=>{
  const {e,ids}=setup(4);e.start();e.open(0);
  const id=groupIds(e,ids,0)[0];e.vote(id,0,0);
  e.leave(id,`sock-${ids.indexOf(id)}`);
  const again=e.join(id,'new-socket');
  assert.equal(again.ok,true);assert.equal(again.state.station.votedAlready,true);
  assert.equal(e.vote(id,0,1).ok,false);
  const late=randomUUID();const r=e.join(late,'late');
  assert.equal(r.spectator,true);assert.equal(e.publicState().registered,4);
  assert.equal(e.vote(late,0,0).ok,false);
});

test('Persistencia recupera elecciones y reset conserva solo conectados, no los votos',()=>{
  const {e,ids,saved}=setup(4);e.start();e.open(0);
  const g=groupIds(e,ids,0)[0];e.vote(g,0,2);
  const restored=makeEngine(structuredClone(saved.at(-1)),()=>{});
  assert.equal(restored.member(g).station.votedAlready,true);
  const old=restored.load().epoch;e.reset();
  assert.notEqual(e.load().epoch,old);assert.equal(e.publicState().stage,'lobby');
  assert.ok(e.publicState().stations.every(s=>s.status==='pending'));
  assert.equal(e.publicState().connected,4);
});

test('Tarjeta original acepta snapshot del servidor y muestra ganador real',()=>{
  const {e,ids}=setup(4);e.start();e.open(0);e.vote(groupIds(e,ids,0)[0],0,1);
  const p=e.publicState(),S={gc:p.groups,st:p.stations.map(st=>({status:st.status,open:st.open,voted:st.voted,res:st.winner===null?null:{k:'winner',idx:st.winner},allowed:[0,1,2],rounds:[{}]}))};
  const h=cardHTML(S,0);assert.ok(h.includes('✓ 7,2'));assert.ok(h.includes('ESTACIÓN 1 / 4'));
});
