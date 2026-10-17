/* Si algo falla al iniciar, se muestra el motivo en pantalla (igual que en el HTML original). */
const show = msg => { const p = document.createElement('aside'); p.style.cssText = 'position:fixed;z-index:200;top:20px;left:20px;right:20px;color:#fff;background:#371b1b;padding:20px;border-radius:12px;font:14px system-ui'; p.textContent = 'No se pudo iniciar el LLT. Error: ' + msg; document.body.appendChild(p); };
addEventListener('error', e => { console.error('Error al iniciar el LLT:', e.error || e.message); show((e.error && e.error.message) || e.message); });
addEventListener('unhandledrejection', e => show(String(e.reason && e.reason.message || e.reason)));
