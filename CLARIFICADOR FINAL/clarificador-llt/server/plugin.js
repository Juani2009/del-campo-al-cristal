/* Adaptador de red local. Socket.IO viaja sobre el mismo puerto de Vite. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { Server } from 'socket.io';
import QRCode from 'qrcode';
import { makeEngine } from './engine.js';

function lanAddresses(){
  const ips=[];
  for(const group of Object.values(os.networkInterfaces()))for(const a of group??[])
    if(a.family==='IPv4'&&!a.internal&&!a.address.startsWith('169.254.')) ips.push(a.address);
  return [...new Set(ips)];
}
function readBody(req){return new Promise((resolve,reject)=>{
  let data='';req.on('data',chunk=>{data+=chunk;if(data.length>8192){reject(new Error('Solicitud demasiado grande'));req.destroy();}});
  req.on('end',()=>{try{resolve(JSON.parse(data||'{}'));}catch{reject(new Error('JSON inválido'));}});req.on('error',reject);
});}
function cookieValue(req,name){const cookie=req.headers.cookie||'';return cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';}
function safeEq(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function json(res,status,obj,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(obj));}
function originOK(req){const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===req.headers.host;}catch{return false;}}
export function lltPlugin(){
  let initialized=false;
  function mount(server){
    if(initialized)return;initialized=true;
    const root=process.cwd(), ident=crypto.createHash('sha256').update(root).digest('hex').slice(0,12);
    const dir=process.env.LLT_DATA_DIR||path.join(os.homedir(),'.clarificador-llt',ident);
    fs.mkdirSync(dir,{recursive:true,mode:0o700});
    const configPath=path.join(dir,'config.json'),statePath=path.join(dir,'state.json');
    let cfg;
    try{cfg=JSON.parse(fs.readFileSync(configPath,'utf8'));}catch{
      cfg={pin:crypto.randomInt(100000,1000000).toString(),token:crypto.randomBytes(32).toString('hex')};
      fs.writeFileSync(configPath,JSON.stringify(cfg),{mode:0o600});
    }
    const pin=process.env.LLT_ADMIN_PIN||cfg.pin;
    const pinFailures=new Map();
    let oldState;try{oldState=JSON.parse(fs.readFileSync(statePath,'utf8'));}catch{}
    const save=s=>{const tmp=statePath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(s));fs.renameSync(tmp,statePath);};
    const engine=makeEngine(oldState,save);
    const httpServer=server.httpServer;
    if(!httpServer)throw Error('No se encontró el servidor HTTP');
    const io=new Server(httpServer,{path:'/socket.io',cors:false,maxHttpBufferSize:30000,allowRequest:(request,callback)=>callback(null,originOK(request))});
    const isAdmin=req=>safeEq(cookieValue(req,'llt_host'),cfg.token);
    function notify(){
      const st=engine.publicState();io.emit('llt:state',st);
      io.sockets.sockets.forEach(sock=>{
        if(sock.data.pid)sock.emit('llt:member',engine.member(sock.data.pid));
        if(sock.data.admin)sock.emit('llt:admin',engine.publicState(true));
      });
    }
    const timeoutMs=Math.max(15000,Math.min(600000,Number(process.env.LLT_VOTE_TIMEOUT_MS)||60000));
    // Un temporizador del servidor, no del navegador; sobrevive a scroll y desconexiones.
    const expiryTimer=setInterval(()=>{if(engine.expireOpen(timeoutMs))notify();},1000);
    expiryTimer.unref?.();
    const respond=(ack,val)=>{if(typeof ack==='function')ack(val);};
    io.on('connection',sock=>{
      sock.data.admin=isAdmin(sock.request);
      sock.emit('llt:state',engine.publicState());
      if(sock.data.admin)sock.emit('llt:admin',engine.publicState(true));
      sock.on('llt:join',(payload,ack)=>{
        if(sock.data.pid&&sock.data.pid!==payload?.id){respond(ack,{ok:false,error:'Ya hay un participante en esta conexión'});return;}
        const r=engine.join(payload?.id,sock.id);
        if(r.ok){sock.data.pid=payload.id;notify();}respond(ack,r);
      });
      sock.on('llt:vote',(payload,ack)=>{
        if(!sock.data.pid){respond(ack,{ok:false,error:'Primero ingresá a la sala'});return;}
        const r=engine.vote(sock.data.pid,payload?.i,payload?.opt);respond(ack,r);if(r.ok)notify();
      });
      const adminAction=(event,handler)=>sock.on(event,(payload,ack)=>{
        if(!sock.data.admin||!isAdmin(sock.request)){respond(ack,{ok:false,error:'Ingresá como presentadora'});return;}
        const r=handler(payload||{});respond(ack,r);if(r.ok)notify();
      });
      adminAction('llt:start',()=>engine.start());
      adminAction('llt:open',p=>engine.open(p.i));
      adminAction('llt:close',p=>engine.close(p.i));
      adminAction('llt:resolve-empty',p=>engine.resolveEmpty(p.i,p.opt));
      adminAction('llt:reset',()=>engine.reset());
      sock.on('disconnect',()=>{if(sock.data.pid){engine.leave(sock.data.pid,sock.id);notify();}});
    });
    server.middlewares.use(async(req,res,next)=>{
      const u=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
      // Impide exponer secretos si una ruta interna se solicita directamente.
      if(u.pathname.startsWith('/.llt-')||u.pathname.startsWith('/server/')){json(res,403,{error:'Acceso prohibido'});return;}
      if(u.pathname==='/api/info'){
        const port=httpServer.address()?.port||5173;
        json(res,200,{ips:lanAddresses(),port,admin:isAdmin(req),stage:engine.publicState().stage});return;
      }
      // Solo la propia Lenovo puede adquirir la sesión de presentadora sin PIN.
      if(u.pathname==='/api/local-unlock'&&req.method==='POST'){
        const ip=req.socket.remoteAddress||'';
        const host=(req.headers.host||'').split(':')[0].toLowerCase();
        const loopback=ip==='127.0.0.1'||ip==='::1'||ip==='::ffff:127.0.0.1';
        if(!loopback||!['localhost','127.0.0.1','[::1]'].includes(host)||!originOK(req)){
          json(res,403,{ok:false,error:'Disponible solo en la computadora anfitriona usando localhost'});return;
        }
        json(res,200,{ok:true},{'Set-Cookie':`llt_host=${cfg.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`});return;
      }
      if(u.pathname==='/api/me'){json(res,200,{admin:isAdmin(req)});return;}
      if(u.pathname==='/api/qr'){
        const ip=u.searchParams.get('ip')||lanAddresses()[0];
        if(!lanAddresses().includes(ip)) {json(res,400,{error:'Elegí una dirección de red local válida'});return;}
        try{const url=`http://${ip}:${httpServer.address()?.port||5173}/votar`;
          const svg=await QRCode.toString(url,{type:'svg',margin:2,width:256,errorCorrectionLevel:'M'});
          res.writeHead(200,{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(svg);
        }catch(e){json(res,500,{error:'No se pudo generar el QR'});}return;
      }
      if(u.pathname==='/api/auth'&&req.method==='POST'){
        if(!originOK(req)){json(res,403,{error:'Origen no permitido'});return;}
        try{const clientIp=req.socket.remoteAddress||'local';const f=pinFailures.get(clientIp)||{n:0,until:0};
          if(f.n>=5&&Date.now()<f.until){json(res,429,{ok:false,error:'Demasiados intentos. Esperá 30 segundos.'});return;}
          const body=await readBody(req);
          if(!safeEq(body.pin,pin)){const n=(Date.now()>f.until?0:f.n)+1;pinFailures.set(clientIp,{n,until:Date.now()+30000});json(res,401,{ok:false,error:'PIN incorrecto'});return;}
          pinFailures.delete(clientIp);json(res,200,{ok:true},{'Set-Cookie':`llt_host=${cfg.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`});
        }catch(e){json(res,400,{error:e.message});}return;
      }
      if(u.pathname==='/api/logout'&&req.method==='POST'){
        if(!originOK(req)){json(res,403,{error:'Origen no permitido'});return;}
        cfg.token=crypto.randomBytes(32).toString('hex');fs.writeFileSync(configPath,JSON.stringify(cfg),{mode:0o600});
        json(res,200,{ok:true},{'Set-Cookie':'llt_host=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});return;
      }
      if(u.pathname==='/votar'||u.pathname==='/control'){
        req.url=u.pathname+'.html'+u.search;next();return;
      }
      next();
    });
    httpServer.on('listening',()=>{
      const port=httpServer.address()?.port||5173;
      console.log('\n  ╔══════════ LLT · VOTACIONES LOCALES ══════════╗');
      console.log(`  ║ PIN de presentadora: ${pin}`);
      console.log('  ║ Abrí /control para gestionar la experiencia');
      for(const ip of lanAddresses())console.log(`  ║ Alumnos: http://${ip}:${port}/votar`);
      console.log('  ╚═══════════════════════════════════════════════╝\n');
    });
    return ()=>{clearInterval(expiryTimer);io.close();};
  }
  return {name:'llt-votaciones-locales',configureServer:mount,configurePreviewServer:mount};
}
