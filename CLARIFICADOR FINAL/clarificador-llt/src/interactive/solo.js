/* Experiencia individual totalmente local. Reutiliza la escena y el informe didáctico originales. */
import { VARS, computeResults, animationParams } from './rules.js';
import { resultView } from './results.js';
import { QS } from '../components/cards.js';
import './presentation.css';
const GATE=[.165,.195,.405,.545],EPS=.004,WIN_AFTER=.09;
const $=id=>document.getElementById(id);
const clamp=x=>Math.max(0,Math.min(1,x));
const choices=[null,null,null,null];
const vcard=$('vcard'), resEl=$('res');
document.body.classList.add('llt-solo','clean');
$('lobby').hidden=true;$('tbtn').hidden=true;$('tpanel').hidden=true;
$('llt-results-missing').hidden=true;
// El modo individual es local: solo tarjetas, escena y resultados.
// Sin botones de calidad, reinicio ni opciones técnicas durante el recorrido.
let active=-1,key='';
function choose(i,opt){if(choices[i]!==null)return;choices[i]=opt;draw(i);
 if(choices.every(Number.isInteger)){
   resEl.innerHTML=`<div class="in">${resultView(choices,true)}</div>`;
   $('backResult').onclick=()=>{choices.fill(null);key='';resEl.innerHTML='';resEl.classList.remove('on');scrollTo({top:0});draw(-1);};
   window.dispatchEvent(new CustomEvent('llt:resultado',{detail:animationParams(computeResults(choices))}));
 }
}
function draw(i){if(i<0)return;const v=VARS[i],picked=choices[i];vcard.innerHTML=`<div class="vk">ESTACIÓN ${i+1} / 4 · SIMULACIÓN INDIVIDUAL</div><h3>${QS[i][0]}</h3><p class="vq">${QS[i][1]}</p>${picked!==null?`<div class="vo">${v.opts.map((o,j)=>`<span class="val ${picked===j?'win':'off'}">${picked===j?'✓ ':''}${o.l}</span>`).join('')}</div><div class="vs ok">Elección guardada · continuá con el scroll</div>`:`<div class="solo-opts">${v.opts.map((o,j)=>`<button type="button" class="solo-pick" data-pick="${j}">${o.l}</button>`).join('')}</div><div class="vs">Elegí una alternativa para tu simulación.</div>`}`;
 vcard.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>choose(i,Number(b.dataset.pick)));
}
function tick(p){let i=-1;for(let j=0;j<4;j++)if(p>=GATE[j]-EPS)i=j;
 if(i!==active){active=i;draw(i);}
 if(i>=0){const alpha=clamp((p-GATE[i]+EPS+.003)/.01)*clamp((GATE[i]+WIN_AFTER-p)/.02);vcard.style.opacity=alpha;vcard.style.visibility=alpha>.01?'visible':'hidden';}
 else {vcard.style.opacity=0;vcard.style.visibility='hidden';}
 const done=choices.every(Number.isInteger), ra=done?clamp((p-.985)/.015):0;
 resEl.style.opacity=ra;resEl.classList.toggle('on',ra>.5);
 document.body.classList.toggle('res-on',ra>.05);
 const incomplete=p>.975&&!done;
 $('llt-results-missing').hidden=!incomplete;
 if(incomplete){const missing=choices.map((x,j)=>x===null?j+1:null).filter(Boolean);$('llt-results-missing').textContent=`Te faltan las estaciones ${missing.join(', ')} · Retrocedé con el scroll para elegirlas.`;}
}
export const Votes={tick,gateP:()=>null};
