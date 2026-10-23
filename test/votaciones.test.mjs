import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {makeEngine,REFERENCE_INDEX} from '../server/engine.js';
import {cardHTML} from '../src/components/cards.js';
const setup = n => {
  const saved=[];const e=makeEngine(null,s=>saved.push(structuredClone(s)));
  const ids=Array.from({length:n},()=>randomUUID());
  ids.forEach((id,i)=>assert.equal(e.join(id,'sock-'+i).ok,true));
  return {e,ids,saved};
};
const allVote=(e,ids,i,opts)=>ids.forEach((id,k)=>assert.equal(e.vote(id,i,opts[k%opts.length]).ok,true));

test('Sin grupos: con 6, 2 y 1 celular todos votan en cada estación',()=>{
  for(const n of [6,2,1]){
    const {e,ids}=setup(n);assert.equal(e.start().ok,true);
    assert.equal(e.publicState().registered,n);
    assert.deepEqual(e.publicState().groups,[n,n,n,n]);
    for(let i=0;i<4;i++){
      assert.equal(e.open(i).ok,true);
      assert.ok(ids.every(id=>e.member(id).station.index===i&&e.member(id).station.status==='open'));
      allVote(e,ids,i,[1]);
      assert.equal(e.publicState().stations[i].status,'closed');
      assert.equal(e.publicState().stations[i].voted,n);
    }
    assert.deepEqual(e.picks(),[1,1,1,1]);
    assert.ok(ids.every(id=>e.member(id).finished&&e.member(id).votedCount===4));
  }
});

test('Cada participante vota una vez por estación y se cierra al votar todos',()=>{
  const {e,ids}=setup(3);e.start();e.open(0);
  const [id1,id2,id3]=ids;
  assert.equal(e.vote(id1,1,1).ok,false);   // estación todavía no abierta
  assert.equal(e.vote(id1,0,100).ok,false);
  assert.equal(e.vote(id1,0,1).ok,true);
  assert.equal(e.vote(id1,0,2).ok,false);
  assert.equal(e.vote(id2,0,1).ok,true);
  assert.equal(e.publicState().stations[0].status,'open');
  assert.equal(e.vote(id3,0,0).ok,true);
  assert.equal(e.publicState().stations[0].winner,1);
  assert.equal(e.publicState().stations[0].status,'closed');
  assert.equal(e.vote(id1,0,1).ok,false);
  assert.equal(e.open(0).already,true);
  // Entre estaciones el celular muestra la que terminó; al abrir la siguiente, la nueva pregunta.
  assert.equal(e.member(id1).station.index,0);
  e.open(1);assert.equal(e.member(id1).station.index,1);assert.equal(e.member(id1).station.votedAlready,false);
});

test('Empate 2-2 favorece el valor de referencia (NO segunda ronda)',()=>{
  const {e,ids}=setup(4);e.start();e.open(0);
  allVote(e,ids,0,[1]);e.open(1);
  allVote(e,ids,1,[0,0,1,1]);
  const s=e.publicState().stations[1];
  assert.equal(s.winner,REFERENCE_INDEX[1]);assert.equal(s.resolution,'desempate_referencia');
});

test('Scroll libre, votaciones secuenciales: siguiente estación espera resultado previo sin frenar cámara',()=>{
  const {e,ids}=setup(4);e.start();
  assert.equal(e.open(2).ok,false);assert.equal(e.open(0).ok,true);
  assert.equal(e.open(1).ok,false);
  allVote(e,ids,0,[1]);
  assert.equal(e.open(1).ok,true);
  assert.equal(e.publicState().stations[1].status,'open');
});

test('Estación cerrada sin votos requiere decisión manual',()=>{
  const {e,ids}=setup(2);e.start();
  e.open(0);allVote(e,ids,0,[1]);
  e.open(1);allVote(e,ids,1,[1]);
  e.open(2);e.close(2);
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

test('Reingreso mismo identificador conserva el voto; invitados tardíos no se asignan',()=>{
  const {e,ids}=setup(4);e.start();e.open(0);
  const id=ids[0];e.vote(id,0,0);
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
  const g=ids[0];e.vote(g,0,2);
  const restored=makeEngine(structuredClone(saved.at(-1)),()=>{});
  assert.equal(restored.member(g).station.votedAlready,true);
  const old=restored.load().epoch;e.reset();
  assert.notEqual(e.load().epoch,old);assert.equal(e.publicState().stage,'lobby');
  assert.ok(e.publicState().stations.every(s=>s.status==='pending'));
  assert.equal(e.publicState().connected,4);
});

test('Tarjeta original acepta snapshot del servidor y muestra ganador real',()=>{
  const {e,ids}=setup(4);e.start();e.open(0);allVote(e,ids,0,[1]);
  const p=e.publicState(),S={gc:p.groups,st:p.stations.map(st=>({status:st.status,open:st.open,voted:st.voted,res:st.winner===null?null:{k:'winner',idx:st.winner},allowed:[0,1,2],rounds:[{}]}))};
  const h=cardHTML(S,0);assert.ok(h.includes('✓ 7,2'));assert.ok(h.includes('ESTACIÓN 1 / 4'));
});
