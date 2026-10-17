import * as THREE from 'three';
import anime from 'animejs/lib/anime.es.js';
const T=THREE,PI=Math.PI,R=3,$=i=>document.getElementById(i),app=$('app');
const ren=new T.WebGLRenderer({canvas:$('cv'),antialias:!(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)),alpha:true});ren.setClearColor(0,0);
const scene=new T.Scene(),cam=new T.PerspectiveCamera(34,1,0.1,200);
scene.add(new T.HemisphereLight(0x8a93a3,0x15161a,0.75));
const dl=(c,i,x,y,z)=>{const l=new T.DirectionalLight(c,i);l.position.set(x,y,z);scene.add(l);};
dl(0xffffff,0.9,6,12,10);dl(0x4fd6ff,0.5,-10,6,-8);dl(0xffb866,0.3,10,2,6);dl(0xcfd8ff,0.35,-4,-12,6);
(()=>{const es=new T.Scene();es.background=new T.Color(0x0b0c0e);const sb=(w,h,x,y,z,c,i)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(i),side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m);};
sb(14,6,0,10,6,0xffffff,5);sb(4,16,-10,2,4,0xffffff,3);sb(3,12,10,0,-2,0xffe2b0,2.2);sb(10,3,0,2,-10,0x7fe0ff,2.5);sb(12,4,0,-9,4,0xffffff,2);
scene.environment=new T.PMREMGenerator(ren).fromScene(es,0.03).texture;})();
const GLS=(c,o)=>new T.MeshPhysicalMaterial(Object.assign({color:c,roughness:0.45,metalness:0.55,clearcoat:0.35,clearcoatRoughness:0.4,envMapIntensity:1.0,side:T.DoubleSide},o||{}));
const bodyM=GLS(0x1a1b1d),lidM=GLS(0x1f2023),inM=GLS(0x2c2e31,{roughness:0.55}),fl=GLS(0x303236,{roughness:0.5}),steel=GLS(0x6c7075,{roughness:0.45,metalness:0.9,clearcoat:0.2}),dk=GLS(0x101112),cutM=GLS(0x6b6f75,{roughness:0.4,metalness:0.85,clearcoat:0.2});
const EM=new T.LineBasicMaterial({color:0xc4c8cc,transparent:true,opacity:0.32});
/* Medidas tomadas de IMG_1204 (R=3 como unidad): cuerpo 1.9, aro 0.4, cubierta 1.0, cono 1.3, cuello r 0.8 */
const HB=2.8,LID0=HB+0.2,LIDH=1.0,CH=1.5,RN=0.8,NH=1.0;
const m=new T.Group();scene.add(m);
const mk=n=>{const g=new T.Group();g.name=n;g.back=new T.Group();g.front=new T.Group();g.back.name=n+'-trasera';g.front.name=n+'-frontal';g.add(g.back,g.front);m.add(g);return g;};
const body=mk('cuerpo-cilindrico'),lid=mk('cubierta-superior'),cone=mk('fondo-conico'),acc=mk('accesorios'),conn=new T.Group();conn.name='conexiones';m.add(conn);
const interior=new T.Group();interior.name='interior';m.add(interior);
function add(g,mat,x,y,z,p,ne){const me=new T.Mesh(g,mat);me.position.set(x||0,y||0,z||0);if(!ne)me.add(new T.LineSegments(new T.EdgesGeometry(g,35),EM));(p||m).add(me);return me;}
const ringG=(r,t)=>{const g=new T.TorusGeometry(r,t,10,72);g.rotateX(PI/2);return g;};
const cap=(pts,y,mat,p,z)=>{const s=new T.Shape();s.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(q=>s.lineTo(q[0],q[1]));s.closePath();add(new T.ShapeGeometry(s),mat,0,y,z,p);};
const mir=a=>a.map(q=>[-q[0],q[1]]);
[['back',PI/2,-0.01],['front',-PI/2,0.01]].forEach(([s,ts,z])=>{
const b=body[s],l=lid[s],c=cone[s];
/* cuerpo cilíndrico */
add(new T.CylinderGeometry(R,R,HB,72,1,true,ts,PI),bodyM,0,HB/2,0,b);add(new T.CylinderGeometry(R-0.12,R-0.12,HB,72,1,true,ts,PI),inM,0,HB/2,0,b);
[-1,1].forEach(x=>add(new T.BoxGeometry(0.12,HB,0.02),cutM,x*(R-0.06),HB/2,z,b));
const bd=new T.TorusGeometry(R+0.012,0.03,10,72,PI);bd.rotateX(-PI/2);if(s==='front')bd.rotateY(PI);add(bd,dk,0,1.4,0,b);
/* cubierta superior: aro de cierre + tapa cónica */
add(new T.CylinderGeometry(R+0.2,R+0.2,0.5,72,1,false,ts,PI),fl,0,HB+0.1,0,l);
const pr=(rad,dy)=>{const p=[];for(let i=0;i<=14;i++){const k=i/14;p.push(new T.Vector2(rad*(1-k),LID0+dy+LIDH*Math.pow(k,0.85)));}return p;};
add(new T.LatheGeometry(pr(R-0.05,0),72,ts,PI),lidM,0,0,0,l);add(new T.LatheGeometry(pr(R-0.17,-0.1),72,ts,PI),inM,0,0,0,l);
/* fondo cónico */
add(new T.CylinderGeometry(R,RN,CH,72,1,true,ts,PI),bodyM,0,-CH/2,0,c);add(new T.CylinderGeometry(R-0.12,RN-0.12,CH,72,1,true,ts,PI),inM,0,-CH/2,0,c);
const q=[[R,0],[R-0.12,0],[RN-0.12,-CH],[RN,-CH]];cap(q,0,cutM,c,z);cap(mir(q),0,cutM,c,z);
});
/* respiradero en el vértice de la tapa */
add(new T.CylinderGeometry(0.34,0.34,0.1,32),fl,0,LID0+LIDH+0.03,0,lid.back);
/* conexiones: cuello, collares y salida inferior */

[-CH,-CH-NH].forEach(y=>add(ringG(RN+0.02,0.06),fl,0,y,0,conn));
add(new T.CylinderGeometry(0.14,0.14,1.6,24),steel,0,-CH-NH-0.8,0,conn).name='tuberia-descarga-lodos';add(new T.CylinderGeometry(0.26,0.26,0.1,24),steel,0,-CH-NH-1.55,0,conn);
/* accesorios: cuatro trabas sobre el aro y asa lateral (poné HANDLE=false para quitarla) */
const HANDLE=true;
for(let i=0;i<4;i++){const a=i*PI/2+PI/4,side=Math.cos(a)>0?'front':'back';const t=add(new T.BoxGeometry(0.2,0.34,0.14),fl,(R+0.1)*Math.sin(a),HB+0.4,(R+0.1)*Math.cos(a),acc[side]);t.rotation.y=a;}
if(HANDLE){const hp=[[-R-0.2,HB+0.15,0],[-R-0.9,HB+0.15,0],[-R-0.9,HB-0.95,0],[-R-0.2,HB-0.95,0]].map(p=>new T.Vector3(...p));
add(new T.TubeGeometry(new T.CatmullRomCurve3(hp,false,'catmullrom',0.04),60,0.07,12),steel,0,0,0,acc.back);
[HB+0.15,HB-0.95].forEach(y=>add(new T.BoxGeometry(0.3,0.18,0.28),fl,-R-0.12,y,0,acc.back));}
/* corte: variable de apertura 0..1 (luego se vincula al scroll con LLT.setOpen) */
const OPEN_DIST=2*R+0.7;let openV=0;
function setOpen(v){openV=Math.max(0,Math.min(1,+v||0));[body,lid,cone,acc].forEach(g=>{g.front.position.x=openV*OPEN_DIST;});m.position.x=-openV*OPEN_DIST/2;const s=$('op');if(s&&+s.value!==openV)s.value=openV;}
window.LLT={groups:{cuerpo:body,cubierta:lid,fondo:cone,conexiones:conn,accesorios:acc},interior,setOpen,get open(){return openV;}};
const q0=new URLSearchParams(location.search).get('open');if(q0!==null)setOpen(q0);
$('op').addEventListener('input',e=>setOpen(e.target.value));
/* ===== INTERIOR LLT (fuentes: whitepaper Crompion figs. 2-3 + capturas del video; sin bandejas Prima-Sep) ===== */
const IM=(c,o)=>GLS(c,Object.assign({roughness:0.62,clearcoat:0,metalness:0.45,envMapIntensity:0.7},o||{}));
const warm=IM(0xb08a5a),warmD=IM(0x2a2118),stlI=IM(0x7d848b),cop=IM(0x9a5a38,{metalness:0.6}),trdM=IM(0xc0692c,{roughness:0.7}),clr=IM(0xaab0b6),cyan=IM(0x2fb7c9,{roughness:0.5}),shaftM=IM(0x30343a,{metalness:0.7}),scrM=IM(0x3a3e44,{metalness:0.7}),padM=IM(0x565b62),mudM=IM(0x1c1d1f);
const sub=(n,p)=>{const g=new T.Group();g.name=n;(p||interior).add(g);return g;};
const dist=sub('distribucion-superior'),trdG=sub('TRD'),take=sub('canales-recoleccion'),scr=sub('eje-y-raspadores'),mud=sub('zona-lodos');
const Pp=(r,a,y)=>[r*Math.cos(a),y,-r*Math.sin(a)],DG=PI/180;
const tube=(pts,r,mat,p)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(q=>new T.Vector3(...q)),false,'catmullrom',0.03),Math.max(12,pts.length*14),r,12),mat,0,0,0,p,1);
function sector(r0,r1,a0,a1,y0,y1,full){const s=new T.Shape();if(full){s.absarc(0,0,r1,0,2*PI,false);const h=new T.Path();h.absarc(0,0,r0,0,2*PI,true);s.holes.push(h);}else{s.absarc(0,0,r1,a0,a1,false);s.absarc(0,0,r0,a1,a0,true);s.closePath();}
const g=new T.ExtrudeGeometry(s,{depth:y1-y0,bevelEnabled:false,curveSegments:32});g.rotateX(-PI/2);g.translate(0,y0,0);return g;}
const flange=(r,a,y,mat,p)=>{const f=add(new T.CylinderGeometry(0.17,0.17,0.08,24),mat,...Pp(r,a,y),p,1);f.rotation.order='YZX';f.rotation.set(0,a,PI/2);};
/* distribución superior: canal de alimentación anular, entrada, floculante, tuberías hacia los TRD */
add(sector(2.04,2.4,0,0,2.35,2.7,true),warm,0,0,0,dist).name='canal-alimentacion-anillo';add(sector(2.1,2.34,0,0,2.69,2.71,true),warmD,0,0,0,dist,1);
for(let i=0;i<8;i++){const a=i*45*DG,p=Pp(2.46,a,2.85),b=add(new T.BoxGeometry(0.1,0.3,0.1),warm,p[0],p[1],p[2],dist);b.rotation.y=a;}
/* Entrada a la izquierda en la vista frontal: conexión al canal distribuidor */
tube([Pp(4.3,150*DG,2.52),Pp(2.1,150*DG,2.52)],0.12,stlI,dist).name='entrada-jugo-mezclado';flange(2.95,150*DG,2.52,cop,dist);
[50,130,230,310].forEach(a=>{const p=Pp(2.22,a*DG,0);tube([[p[0],3.55,p[2]],[p[0],2.72,p[2]]],0.035,stlI,dist);add(new T.CylinderGeometry(0.1,0.03,0.14,16),stlI,p[0],3.62,p[2],dist,1);});
/* 8 TRD al extremo de las tuberías de alimentación (radios alternados) */
for(let i=0;i<8;i++){const a=(22.5+45*i)*DG,r1=i%2?1.78:2.62,P=(r,y)=>Pp(r,a,y);
tube([P(2.22,2.36),P(2.22,2.0),P(r1,1.66),P(r1,1.36)],0.1,stlI,dist);
[[2.22,2.3],[r1,1.4]].forEach(q=>add(new T.CylinderGeometry(0.135,0.135,0.07,20),cop,...P(q[0],q[1]),dist,1));
const g=sub('TRD-'+(i+1),trdG),p=P(r1,1.2);g.position.set(p[0],p[1],p[2]);g.rotation.y=a;
add(new T.BoxGeometry(0.46,0.26,0.46),trdM,0,0.02,0,g).name='cuerpo';add(new T.BoxGeometry(0.4,0.04,0.4),trdM,0,-0.2,0,g).name='placa';
[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(c=>add(new T.BoxGeometry(0.04,0.1,0.04),trdM,c[0]*0.17,-0.15,c[1]*0.17,g,1));}
/* canales de recolección independientes (6, distribuidos uniformemente), colector anular y salida de jugo claro */
for(let i=0;i<6;i++){const a=(i*60+30)*DG;add(sector(1.05,1.4,a-0.2,a+0.2,2.45,2.72),clr,0,0,0,take).name='takeoff-launder-'+(i+1);add(sector(1.05,1.09,a-0.2,a+0.2,2.72,2.75),cyan,0,0,0,take,1);tube([Pp(1.22,a,2.45),Pp(1.22,a,2.0)],0.075,clr,take);}
const mf=new T.TorusGeometry(1.22,0.075,10,72);mf.rotateX(PI/2);add(mf,clr,0,2.0,0,take,1).name='colector-anular';
/* Salida a la derecha en la vista frontal: conexión al colector de jugo claro */
tube([Pp(1.22,15*DG,2.0),Pp(4.3,15*DG,2.0)],0.11,clr,take).name='salida-jugo-claro';flange(2.95,15*DG,2.0,cyan,take);
/* eje y brazos raspadores (cerchas con paletas sobre el fondo inclinado) */
add(new T.CylinderGeometry(0.12,0.12,6.4,24),shaftM,0,0.95,0,scr).name='eje';add(new T.CylinderGeometry(0.2,0.2,0.12,24),shaftM,0,4.2,0,scr,1);
const arms=sub('raspadores',scr),yb=r=>-CH+(r-(RN-0.12))/(R-RN)*CH+0.22;
function bar(g,a,b,w){const dx=b[0]-a[0],dy=b[1]-a[1],m2=add(new T.BoxGeometry(Math.hypot(dx,dy),w,w),scrM,(a[0]+b[0])/2,(a[1]+b[1])/2,0,g,1);m2.rotation.z=Math.atan2(dy,dx);}
add(new T.CylinderGeometry(0.28,0.28,0.35,24),scrM,0,-1.2,0,arms,1);
for(let k=0;k<4;k++){const g=sub('brazo-raspador-'+(k+1),arms);g.rotation.y=k*PI/2+PI/4;
const B=[0.75,1.65,2.4,2.75].map(r=>[r,yb(r)]),Tt=[1.2,1.95,2.5].map(r=>[r,yb(r)+0.38]);
bar(g,B[0],B[3],0.07);bar(g,Tt[0],Tt[2],0.06);bar(g,[0.28,-1.2],B[0],0.08);
[[B[0],Tt[0]],[Tt[0],B[1]],[B[1],Tt[1]],[Tt[1],B[2]],[B[2],Tt[2]],[Tt[2],B[3]]].forEach(s=>bar(g,s[0],s[1],0.045));
[1.2,1.55,1.9,2.25,2.6].forEach(r=>{const p=add(new T.BoxGeometry(0.3,0.2,0.03),padM,r,yb(r)-0.12,0,g);p.rotation.z=0.6;p.rotation.y=0.5;});}
/* zona de lodos: cuello dividido en mitades + compartimiento oscuro */
[['back',PI/2],['front',-PI/2]].forEach(([s,ts])=>{add(new T.CylinderGeometry(0.72,0.72,NH,40,1,true,ts,PI),lidM,0,-CH-NH/2,0,cone[s]);add(new T.CylinderGeometry(0.6,0.6,NH,40,1,true,ts,PI),inM,0,-CH-NH/2,0,cone[s]);});
add(new T.CylinderGeometry(0.58,0.58,0.95,32,1,true,PI/2,PI),mudM,0,-1.975,0,mud).name='compartimiento-lodos';add(new T.CylinderGeometry(0.58,0.16,0.12,32,1,false,PI/2,PI),mudM,0,-2.44,0,mud,1);
const il=new T.PointLight(0xffe2b8,0.9,16,1.6);il.position.set(0,2.4,0);interior.add(il);const il2=new T.PointLight(0xffe2b8,0.5,10,1.6);il2.position.set(0,-0.6,0);interior.add(il2);
Object.assign(window.LLT.groups,{interior:{distribucion:dist,trd:trdG,recoleccion:take,ejeRaspadores:scr,raspadores:arms,lodos:mud}});window.LLT.setShell=v=>[body,lid,cone].forEach(g=>{g.visible=!!v;});

/* ==========================================================
   PRUEBA DIDÁCTICA: líquido, partículas y trazadores visibles
   La geometría de Claude sigue intacta; agregamos un sistema
   independiente dentro del grupo `interior`.
   No es una simulación CFD ni representa datos de planta.
   ========================================================== */
const fluidGroup = sub('prueba-jugo', interior);
fluidGroup.renderOrder = 4;
const sim = {phase:0, playing:false, liquidVisible:true, t:0, last:0, phaseClock:0};
const descriptions = [
  ['01 / ENTRADA DEL JUGO','El jugo acondicionado entra por la tubería izquierda (marca cobre), llega al canal superior y comienza a distribuirse. Los puntos luminosos indican la dirección de circulación.'],
  ['02 / DISTRIBUCIÓN Y TRD','El jugo se reparte por los conductos hacia los dispositivos TRD naranjas. Las ondas suaves ilustran la reducción del impulso del chorro, no una medición real de turbulencia.'],
  ['03 / FLOCULACIÓN Y SEDIMENTACIÓN','Los flóculos formados durante el acondicionamiento previo y la alimentación del clarificador se separan lentamente por gravedad. La zona inferior se vuelve más cargada de lodos.'],
  ['04 / DESCARGA DE LODOS','Las rastras inferiores acercan el lodo al fondo. La corriente oscura desciende por la tubería inferior hacia su tratamiento.'],
  ['05 / SALIDA DEL JUGO CLARIFICADO','El jugo con menos impurezas suspendidas llega a los canales colectores superiores y sale por la tubería derecha.']
];
function setPhase(n){sim.phase=n;sim.phaseClock=0;
  document.querySelectorAll('[data-phase]').forEach(b=>{const ok=Number(b.dataset.phase)===n;b.classList.toggle('active',ok);b.setAttribute('aria-pressed',String(ok));});
  $('info-title').textContent=descriptions[n][0];$('info-body').textContent=descriptions[n][1];
  window.dispatchEvent(new CustomEvent('llt:phasechange',{detail:{phase:n}}));
}
function fluidMat(col,opacity,roughness=.72){return new T.MeshPhysicalMaterial({color:col,metalness:0,roughness,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,clearcoat:0.04});}
function newFluid(geo,ma,x,y,z){const mesh=new T.Mesh(geo,ma);mesh.position.set(x,y,z);mesh.renderOrder=5;fluidGroup.add(mesh);return mesh;}
/* Lámina interior: volumen ámbar, franja superior aclarada y fondo cargado. */
const juiceMainMat=fluidMat(0xc88735,.12),juiceClearMat=fluidMat(0xdcc07b,.15),juiceConeMat=fluidMat(0x8e572c,.18);
const mainJuice=newFluid(new T.CylinderGeometry(2.83,2.83,1.62,96,1,false),juiceMainMat,0,.78,0);
const topJuice=newFluid(new T.CylinderGeometry(2.83,2.83,.49,96,1,false),juiceClearMat,0,1.835,0);
const coneJuice=newFluid(new T.CylinderGeometry(2.83,.76,1.42,96,1,false),juiceConeMat,0,-.71,0);
const surfaceMat=fluidMat(0xe6bf74,.27,.28);
const surface=newFluid(new T.CircleGeometry(2.83,96),surfaceMat,0,2.075,0);surface.rotation.x=-PI/2;
const surfaceRings=[];
for(let i=0;i<3;i++){const mm=new T.MeshBasicMaterial({color:0xffd49b,transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide});const rr=new T.Mesh(new T.TorusGeometry(1,.012,5,96),mm);rr.rotation.x=PI/2;rr.position.y=2.088;rr.renderOrder=6;fluidGroup.add(rr);surfaceRings.push(rr);}
/* Lodo: fina capa siguiendo la forma del cono, no un disco que lo atraviesa. */
const sludgeMat=fluidMat(0x57341f,.48,.95);
const sludge=newFluid(new T.CylinderGeometry(1.62,.78,.58,96,1,true),sludgeMat,0,-1.17,0);
const sludgeBottom=newFluid(new T.CylinderGeometry(.78,.74,.08,48),fluidMat(0x4b2a1b,.58),0,-1.46,0);
const rand=(()=>{let seed=347521;return()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296})();
const spriteCanvas=document.createElement('canvas');spriteCanvas.width=spriteCanvas.height=64;
const ctx=spriteCanvas.getContext('2d');const grd=ctx.createRadialGradient(32,32,2,32,32,31);
grd.addColorStop(0,'rgba(255,255,255,1)');grd.addColorStop(.35,'rgba(255,255,255,.94)');grd.addColorStop(.8,'rgba(255,255,255,.28)');grd.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grd;ctx.fillRect(0,0,64,64);
const sprite=new T.CanvasTexture(spriteCanvas);
const particleSystems=[];
function floorY(r){return -1.5+Math.max(0,r-.8)/2.2*1.5;}
function makeParticleSystem(num,size,color,floc){const ps=[];const a=new Float32Array(num*3);
  for(let i=0;i<num;i++){const r=Math.sqrt(rand())*2.68,th=rand()*PI*2,y=(rand()*2.77)-.6;ps.push({r,th,y,base:y,seed:rand()*100,fall:.012+rand()*.026});a.set([r*Math.cos(th),y,r*Math.sin(th)],i*3);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(a,3).setUsage(T.DynamicDrawUsage));
  const mat=new T.PointsMaterial({map:sprite,color,size,transparent:true,opacity:floc?.78:.48,depthWrite:false,alphaTest:.045,sizeAttenuation:true});
  const mesh=new T.Points(geo,mat);mesh.renderOrder=9;fluidGroup.add(mesh);particleSystems.push({mesh,ps,a,floc});return mesh;
}
makeParticleSystem(410,.065,0x5c3b24,false);
makeParticleSystem(115,.15,0xdbb77e,true);
/* Recorridos luminosos dentro de las tuberías YA MODELADAS. */
const paths=[];
function trace(points,col,n,speed,tag,width=.09,closed=false){let curve=null;
 if(Array.isArray(points)){curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)),closed,'catmullrom',.03);}
 const xyz=new Float32Array(n*3),geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(xyz,3).setUsage(T.DynamicDrawUsage));
 const mat=new T.PointsMaterial({map:sprite,color:col,size:width,opacity:.93,transparent:true,depthWrite:false,alphaTest:.04,sizeAttenuation:true});
 const obj=new T.Points(geo,mat);obj.renderOrder=12;fluidGroup.add(obj);paths.push({curve,xyz,geo,obj,n,speed,tag,closed,offset:rand()});
}
const lhs=(r,y)=>Pp(r,150*DG,y),rhs=(r,y)=>Pp(r,15*DG,y);
trace([lhs(4.24,2.52),lhs(3.0,2.52),lhs(2.18,2.52)],0xefb05a,21,.22,'entry',.16);
const ringPts=[];for(let k=0;k<=64;k++){const a=2*PI*k/64;ringPts.push(Pp(2.22,a,2.52));}
trace(ringPts,0xf3aa51,48,.095,'ring',.10,true);
for(let i=0;i<8;i++){const a=(22.5+45*i)*DG,r=i%2?1.78:2.62;trace([Pp(2.22,a,2.36),Pp(2.22,a,2),Pp(r,a,1.66),Pp(r,a,1.36)],0xffbc6d,12,.18,'trd',.125);}
trace([rhs(1.22,2.0),rhs(2.95,2.0),rhs(4.24,2.0)],0x7cdde7,25,.2,'out',.14);
trace([[0,-1.28,0],[0,-2.0,0],[0,-3.15,0]],0x9b653c,16,.16,'mud',.115);
for(let i=0;i<6;i++){let a=(i*60+30)*DG;trace([Pp(1.22,a,2.65),Pp(1.22,a,2.43),Pp(1.22,a,2.06)],0x9cdee2,8,.09,'collect',.09);}
/* Ondas de TRD: simbolizan disipación de la energía del flujo. */
const trdRings=[];
for(let i=0;i<8;i++){const a=(22.5+45*i)*DG,r=i%2?1.78:2.62,pp=Pp(r,a,1.13);
  const material=new T.MeshBasicMaterial({color:0xe3ae77,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});
  const mesh=new T.Mesh(new T.TorusGeometry(.3,.012,4,48),material);mesh.rotation.x=PI/2;mesh.position.set(...pp);mesh.renderOrder=13;fluidGroup.add(mesh);trdRings.push({mesh,i});}
/* Líquido y partículas: el movimiento propio corre solo (reloj real); el scroll solo decide cuándo empieza la sedimentación (sp). */
const SD={S:0,sp:0,cl:0,dt:0},cl01=x=>Math.max(0,Math.min(1,x));
function tickLiquid(){
 const S=SD.S,sp=SD.sp,dt=SD.dt,k=cl01(sp*4);fluidGroup.visible=true;
 juiceMainMat.opacity=.095;juiceClearMat.opacity=.15+.11*sp;juiceConeMat.opacity=.13+.12*sp;sludgeMat.opacity=.32+.4*sp;
 surface.position.y=2.075+Math.sin(S*.85)*.012;
 surfaceRings.forEach((r,i)=>{const w=(S*.1+i/3)%1;r.scale.setScalar(.42+w*1.95);r.material.opacity=(1-w)*.13;});
 paths.forEach(p=>p.obj.visible=false);trdRings.forEach(r=>r.mesh.visible=false);
 particleSystems.forEach(({mesh,ps,a,floc})=>{mesh.material.opacity=floc?.55+.25*sp-.3*SD.cl:.5-.09*sp-.2*SD.cl;
  ps.forEach((p,i)=>{p.th+=dt*.014*Math.sin(p.seed+p.y*.3);
   if(k>0){p.y-=dt*p.fall*(floc?5.5:2)*k;if(p.y<floorY(p.r)+.08)p.y=1.0+rand()*.6;}   // caen solos; reaparecen bajo la zona clara
   if(k<1){p.y+=Math.sin(S*.45+p.seed)*dt*.016*(1-k);p.y=Math.max(-.55,Math.min(2.06,p.y));}
   a[3*i]=p.r*Math.cos(p.th);a[3*i+1]=p.y;a[3*i+2]=p.r*Math.sin(p.th);});mesh.geometry.attributes.position.needsUpdate=true;});
}
window.LLT.liquid={group:fluidGroup,setPhase,simulation:sim};
document.querySelectorAll('[data-phase]').forEach(b=>b.addEventListener('click',()=>{sim.playing=false;$('play-liquid').textContent='▶ Recorrer proceso';$('play-liquid').setAttribute('aria-pressed','false');setPhase(Number(b.dataset.phase));}));
$('play-liquid').addEventListener('click',()=>{sim.playing=!sim.playing;sim.phaseClock=0;$('play-liquid').textContent=sim.playing?'Ⅱ Pausar recorrido':'▶ Recorrer proceso';$('play-liquid').setAttribute('aria-pressed',String(sim.playing));});
$('toggle-liquid').addEventListener('click',()=>{sim.liquidVisible=!sim.liquidVisible;$('toggle-liquid').textContent=sim.liquidVisible?'◉ Mostrar jugo':'◯ Mostrar jugo';$('toggle-liquid').setAttribute('aria-pressed',String(sim.liquidVisible));});

/* cámara libre: órbita, paneo y zoom hacia el cursor; modo inspección con carcasa translúcida */
const V={az:0.6,el:0.3,zoom:1,tx:0,ty:0,tz:0};let W=1,Hh=1,tv=0.3,auto=false,drag=false;const pt=new Map(),rc=new T.Raycaster();let pd=0,pm=null;
const fitD=()=>Math.max(4.1/tv,(4.0+3.45*openV)/(tv*cam.aspect))*1.06,curD=()=>Math.max(0.25,fitD()*V.zoom);
// Perfil de rendimiento siempre ligero, sin controles visibles.
// En pantalla pequeña/alta densidad renderiza a menor resolución para mantener el movimiento fluido.
const IS_MOBILE=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || matchMedia('(max-width:680px)').matches;
const PIXEL_CAP=IS_MOBILE?0.9:1.15;
const FRAME_INTERVAL=1000/(IS_MOBILE?30:45);
function resize(){W=app.clientWidth;Hh=app.clientHeight;const por=W/Hh<0.9;cam.fov=por?44:34;cam.aspect=W/Hh;cam.near=0.03;cam.updateProjectionMatrix();ren.setPixelRatio(Math.min(devicePixelRatio,PIXEL_CAP));ren.setSize(W,Hh,false);tv=Math.tan(cam.fov*PI/360);}
function pan(dx,dy){const k=2*curD()*tv/Hh,r=new T.Vector3().setFromMatrixColumn(cam.matrixWorld,0),u=new T.Vector3().setFromMatrixColumn(cam.matrixWorld,1);V.tx+=(-r.x*dx+u.x*dy)*k;V.ty+=(-r.y*dx+u.y*dy)*k;V.tz+=(-r.z*dx+u.z*dy)*k;}
function zoomAt(cx,cy,f){const oz=V.zoom,nz=Math.max(0.03,Math.min(2.5,oz*f));rc.setFromCamera(new T.Vector2(cx/W*2-1,-(cy/Hh)*2+1),cam);
const n=cam.getWorldDirection(new T.Vector3()),tg=new T.Vector3(V.tx,V.ty,V.tz),o=rc.ray.origin,dr=rc.ray.direction,tt=tg.clone().sub(o).dot(n)/dr.dot(n),pp=o.clone().addScaledVector(dr,tt);
tg.add(pp.sub(tg).multiplyScalar(1-nz/oz));V.tx=tg.x;V.ty=tg.y;V.tz=tg.z;V.zoom=nz;}
app.addEventListener('contextmenu',e=>e.preventDefault());
app.addEventListener('pointerdown',e=>{return;if(e.target.closest('#seg,#lab,#info,#op'))return;pt.set(e.pointerId,{x:e.clientX,y:e.clientY});drag=true;auto=false;pd=0;pm=null;app.style.cursor='grabbing';});
addEventListener('pointermove',e=>{const p=pt.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
if(pt.size===1){if(e.buttons&6||e.shiftKey||e.ctrlKey||e.metaKey)pan(dx,dy);else{V.az+=dx*0.008;V.el=Math.max(-1.5,Math.min(1.5,V.el+dy*0.006));}}
else if(pt.size===2){const a=[...pt.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;if(pd){zoomAt(mx,my,pd/d);if(pm)pan(mx-pm.x,my-pm.y);}pd=d;pm={x:mx,y:my};}});
const up=e=>{pt.delete(e.pointerId);if(pt.size<2){pd=0;pm=null;}if(!pt.size){drag=false;app.style.cursor='grab';}};addEventListener('pointerup',up);addEventListener('pointercancel',up);
app.addEventListener('wheel',e=>{if(e.target.closest('#seg,#lab,#info'))return;},{passive:false});
/* modo inspección */
const FADE=[bodyM,lidM,inM,fl,dk,cutM],IO={o:1};let insp=false;
function applyFade(){const tr=IO.o<0.999;FADE.forEach(mt=>{if(mt.transparent!==tr){mt.transparent=tr;mt.depthWrite=!tr;mt.needsUpdate=true;}mt.opacity=IO.o;});}
function goView(el,op,zm,ty,ld){if(insp){op=0;ld=1;}lid.visible=!!ld;const Q={o:openV};const cfg={duration:1100,easing:'easeInOutCubic'};
anime(Object.assign({targets:V,el:el,zoom:zm,tx:0,ty:ty,tz:0},cfg));if(!insp)anime(Object.assign({targets:Q,o:op,update:()=>setOpen(Q.o)},cfg));}
function setInspect(on){insp=on;auto=false;$('bi').classList.toggle('on',on);$('bi').setAttribute('aria-pressed',on);$('op').disabled=on;
if(on){setOpen(0);lid.visible=true;}[body,lid,cone,acc].forEach(g=>{g.front.visible=!on;});
anime({targets:IO,o:on?0.14:1,duration:700,easing:'easeInOutQuad',update:applyFade});if(on)goView(0.29,0,0.78,0.55,1);}
window.LLT.setInspect=setInspect;window.LLT.goView=goView;
document.querySelectorAll('#seg button[data-v]').forEach(b=>b.onclick=()=>{document.querySelectorAll('#seg button[data-v]').forEach(x=>x.classList.toggle('on',x===b));const [el,op,zm,ty,ld]=b.dataset.v.split(',').map(Number);goView(el,op,zm,ty,ld);});
$('bi').onclick=()=>setInspect(!insp);
addEventListener('resize',resize);resize();setPhase(0);
/* ===== API de integración (único añadido al código original) ===== */
const app3d={T,scene,cam,ren,V,fitD,curD,model:m,dist,take,conn,interior,trdG,arms,scr,sim,paths,trdRings,mats:{trdM,stlI,cop,dk},get open(){return openV},setOpen,SD,fitFor:o=>Math.max(4.1/tv,(4.0+3.45*o)/(tv*cam.aspect))*1.06,setAuto(v){auto=v},hooks:[],_l:0,
 tick(){const n=performance.now(),dt=this._l?Math.min(.06,(n-this._l)*.001):0;this._l=n;for(const h of this.hooks)h(dt,n)}};
(function(){let renderedAt=0;function loop(ts){requestAnimationFrame(loop);if(document.hidden || ts-renderedAt<FRAME_INTERVAL)return;renderedAt=ts;app3d.tick();const d=curD(),ce=Math.cos(V.el);
cam.position.set(V.tx+d*ce*Math.sin(V.az),V.ty+d*Math.sin(V.el),V.tz+d*ce*Math.cos(V.az));cam.lookAt(V.tx,V.ty,V.tz);tickLiquid(performance.now());ren.render(scene,cam);}requestAnimationFrame(loop);})();

export { app3d };
