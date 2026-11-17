const { app, BrowserWindow, session, net } = require('electron');
const http = require('http'), fs = require('fs'), path = require('path');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.ico': 'image/x-icon' };
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

let SITE = '';
try { SITE = String(require('./site.json').url || '').replace(/\/+$/, ''); } catch (e) {}
const ROOT = app.isPackaged ? path.join(process.resourcesPath, 'game') : path.join(__dirname, 'game');
const HEAVY = /^\/(assets|assets_lite|sounds|lib)\//;
const mime = f => MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';

function send(res, code, type, body) { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' }); res.end(body); }
function sendFile(res, f) { res.writeHead(200, { 'Content-Type': mime(f), 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' }); fs.createReadStream(f).pipe(res); }
const exists = f => { try { return fs.statSync(f).isFile(); } catch (e) { return false; } };

async function remote(p) {
  if (!SITE) throw new Error('no site');
  const r = await net.fetch(SITE + p, { cache: 'no-store' });
  if (!r.ok) throw new Error('http ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

/* local server (port 8000 so a phone controller can open http://<pc-ip>:8000/controller.html)
   - heavy files (assets, assets_lite, sounds, lib): from inside the app first, website only if missing
   - code files (index.html, race.js ...): website first (always newest), saved copy offline, bundled copy last */
function serve() {
  const cacheDir = path.join(app.getPath('userData'), 'codecache');
  const srv = http.createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    if (p.includes('..')) return send(res, 403, 'text/plain', '403');
    const local = path.join(ROOT, p), cached = path.join(cacheDir, p);
    try {
      if (HEAVY.test(p)) {
        if (exists(local)) return sendFile(res, local);
        return send(res, 200, mime(p), await remote(p));
      }
      try {
        const b = await remote(p);
        try { fs.mkdirSync(path.dirname(cached), { recursive: true }); fs.writeFileSync(cached, b); } catch (e) {}
        return send(res, 200, mime(p), b);
      } catch (e) {
        if (exists(cached)) return sendFile(res, cached);
        if (exists(local)) return sendFile(res, local);
        throw e;
      }
    } catch (e) { send(res, 404, 'text/plain', '404'); }
  });
  return new Promise(ok => {
    srv.once('error', () => srv.listen(0, '127.0.0.1', () => ok(srv.address().port)));
    srv.listen(8000, '0.0.0.0', () => ok(8000));
  });
}

app.on('web-contents-created', (e, wc) => {
  if (wc.getType() === 'webview') {
    wc.setUserAgent(UA);
    wc.setWindowOpenHandler(({ url }) => { wc.loadURL(url); return { action: 'deny' }; });
  }
});

app.whenReady().then(async () => {
  session.fromPartition('persist:tablet').setUserAgent(UA);
  const port = await serve();
  const win = new BrowserWindow({
    width: 1280, height: 720, backgroundColor: '#000000', autoHideMenuBar: true, title: 'Loco \u2019n\u2019 Drive 3D',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { webviewTag: true, backgroundThrottling: false, contextIsolation: true }
  });
  win.maximize();
  win.loadURL('http://localhost:' + port + '/index.html');
});
app.on('window-all-closed', () => app.quit());
