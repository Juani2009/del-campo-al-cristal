import { VARS, decided, groupCounts, votesIn } from '../interactive/rules.js';

/* Tarjeta compacta de la estación activa (arriba a la izquierda en la pantalla). */
export const QS = [['Control de pH', '¿Con qué pH ingresa el jugo?'], ['Control de temperatura', '¿A qué temperatura se calienta el jugo?'], ['Control de floculante', '¿Qué dosis de floculante se agrega?'], ['Control de caudal', '¿Con qué caudal se alimenta el LLT?']];

export function cardHTML(S, act) {
  if(act<0)return '';
  const v=VARS[act],st=S.st[act],res=st.res,done=decided(st);
  const n=S.gc?.[act]??groupCounts(S)[act], nv=st.voted??votesIn(st);
  const win=done?res.idx:-1;
  const status=done?(res.k==='ref'?'Selección manual · sin votos':st.status==='closed'&&st.resolution==='desempate_referencia'?'✓ Empate resuelto por referencia didáctica':'Opción elegida por mayoría')
    :st.status==='empty'?(n?'Sin votos · espera decisión de presentadora':'Sin participantes · espera decisión de presentadora')
    :st.status==='pending'?'La votación se habilitará al llegar a esta estación'
    :`Esperando los votos de todos · ${nv}/${n}`;
  return `<div class="vk">ESTACIÓN ${act+1} / 4 · VOTAN TODOS</div><h3>${QS[act][0]}</h3><p class="vq">${QS[act][1]}</p>
    <div class="vo">${v.opts.map((o,j)=>`<span class="val ${win===j?'win':done?'off':''}">${win===j?'✓ ':''}${o.l}</span>`).join('')}</div><div class="vs ${done?'ok':''}">${status}</div>`;
}
