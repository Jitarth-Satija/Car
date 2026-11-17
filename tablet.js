/* JitarthBro tablet: a small tablet on the dashboard next to the steering wheel. Click it (or press T) while the car is stopped to open it full screen.
   Inside is the "JitarthBro" browser: type an address or search. In the desktop app (Electron) pages open inside the tablet; in a normal browser they open in a new tab. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const isEl=/Electron/i.test(navigator.userAgent);
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const st=document.createElement('style');st.textContent=`
#tmini{position:fixed;left:calc(50% + 15.5vw);bottom:3.6vh;width:clamp(150px,13vw,250px);aspect-ratio:5/3;z-index:8;display:none;cursor:pointer;border-radius:14px;padding:6px;background:linear-gradient(145deg,#2b3038,#0d0f12);box-shadow:0 8px 22px #000c,inset 0 0 0 1px #ffffff22;transform:perspective(600px) rotateY(-14deg) rotateX(5deg);transition:transform .15s,box-shadow .15s;user-select:none}
#tmini:hover{transform:perspective(600px) rotateY(-8deg) rotateX(3deg) scale(1.06);box-shadow:0 10px 28px #000,0 0 22px #2dd4ff88,inset 0 0 0 1px #2dd4ffaa}
#tmini .sc{width:100%;height:100%;border-radius:9px;overflow:hidden;background:radial-gradient(circle at 30% 20%,#1d4c7a,#0b1424 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3%;color:#fff;font-family:system-ui,sans-serif}
#tmini .tm{font-weight:300;font-size:clamp(20px,2.4vw,40px);letter-spacing:.04em;line-height:1}
#tmini .tn{font-weight:800;font-size:clamp(9px,.95vw,15px);letter-spacing:.08em;opacity:.9}#tmini .tn b{color:#2dd4ff}
#tmini .tp{width:70%;height:14%;border-radius:99px;background:#ffffff22;font-size:clamp(7px,.7vw,11px);display:flex;align-items:center;justify-content:center;opacity:.85}
#tmini .tk{position:absolute;right:9px;bottom:7px;font:700 11px system-ui;background:#0009;color:#fff;border-radius:5px;padding:1px 6px}
#tab{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:55;background:#000c;display:flex;align-items:center;justify-content:center;transform:translateX(-250vw);pointer-events:none}
#tab.on{transform:none;pointer-events:auto}
#tab .tabf{width:min(95vw,1240px);height:min(92vh,760px);background:#05080c;border:11px solid #1a1f26;border-radius:28px;box-shadow:0 0 0 2px #46505e,0 24px 80px #000;display:flex;flex-direction:column;overflow:hidden;font-family:system-ui,sans-serif}
#tab .bar{display:flex;gap:7px;align-items:center;padding:8px 10px;background:linear-gradient(#1f262e,#171c22)}
#tab .bar .lg{font-weight:800;color:#fff;letter-spacing:.03em;margin-right:4px;white-space:nowrap}#tab .bar .lg b{color:#2dd4ff}
#tab .bar button{border:0;border-radius:10px;background:#2b333d;color:#fff;font:700 16px system-ui;padding:7px 11px;cursor:pointer}
#tab .bar button:hover{background:#3d4957}#tab .bar .x{background:#c0392b}#tab .bar .x:hover{background:#e04b3a}
#tab .pill{flex:1;min-width:60px;display:flex;align-items:center;background:#0b0f14;border-radius:99px;padding:0 14px;outline:2px solid transparent}
#tab .pill:focus-within{outline-color:#2dd4ff}
#turl{flex:1;border:0;background:transparent;color:#fff;font:15px system-ui;padding:9px 6px;outline:none;min-width:0}
#tab .vol{display:flex;align-items:center;gap:6px;background:#0b0f14;border-radius:99px;padding:2px 12px 2px 4px}
#tab .vol button{background:transparent;padding:5px 8px}
#tab .vol input{width:96px;accent-color:#2dd4ff;cursor:pointer}
#tbody{flex:1;position:relative;background:#111}
#tbody webview{position:absolute;inset:0;width:100%;height:100%}
#thome{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#17406b 0%,#0a1220 55%,#05080c 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;color:#fff;padding:20px;text-align:center}
#thome h1{margin:0;font:800 clamp(38px,6vw,72px) system-ui;letter-spacing:.02em}#thome h1 b{color:#2dd4ff}
#thome .sb{width:min(640px,86%);display:flex;background:#fff;border-radius:99px;overflow:hidden;box-shadow:0 6px 30px #0008}
#thome .sb input{flex:1;border:0;padding:16px 22px;font:18px system-ui;outline:none;color:#111;min-width:0}
#thome .sb button{border:0;background:#2dd4ff;color:#04202b;font:800 17px system-ui;padding:0 26px;cursor:pointer}
#thome .tl{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
#thome .tl button{width:112px;border:0;border-radius:18px;background:#ffffff14;color:#fff;font:600 14px system-ui;padding:16px 6px;cursor:pointer;backdrop-filter:blur(4px)}
#thome .tl button:hover{background:#ffffff30}#thome .tl i{display:block;font-style:normal;font-size:32px;margin-bottom:6px}
#thome small{opacity:.55}
#tkb{display:none;flex-direction:column;gap:5px;padding:8px;background:#161a20}#tkb .kr{display:flex;gap:5px;justify-content:center}
#tkb button{flex:1;max-width:84px;min-height:46px;border:0;border-radius:8px;background:#2b333d;color:#fff;font:600 19px system-ui;touch-action:manipulation}
#tkb button:active{background:#46566a}#tkb .sp{flex:6;max-width:none}#tkb .wd{flex:1.6;max-width:120px}#tkb .go{background:#2dd4ff;color:#04202b;font-weight:800;flex:1.6;max-width:120px}
`;document.head.appendChild(st);
const mini=document.createElement('div');mini.id='tmini';mini.title='Tablet (T)';
mini.innerHTML='<div class="sc"><div class="tm" id="tmc">12:00</div><div class="tn">Jitarth<b>Bro</b></div><div class="tp">🔎 Search…</div></div><span class="tk">T</span>';document.body.appendChild(mini);
const tab=document.createElement('div');tab.id='tab';
tab.innerHTML=`<div class="tabf"><div class="bar"><span class="lg">Jitarth<b>Bro</b></span><button id="thm" title="Home">🏠</button><button id="tbk">◀</button><button id="tfw">▶</button><button id="trl">⟳</button><div class="pill">🔎<input id="turl" spellcheck="false" placeholder="Search or type a web address"></div><div class="vol" id="tvw" title="Volume"><button id="tmu">🔊</button><input type="range" id="tvl" min="0" max="100" value="80"></div><button class="x" id="tcl" title="Close (Esc)">✕</button></div>
<div id="tbody"><div id="thome"><h1>Jitarth<b>Bro</b></h1><div class="sb"><input id="tsq" spellcheck="false" placeholder="Search the web or type a web address"><button id="tsg">Search</button></div><div class="tl"><button data-u="https://music.youtube.com"><i>🎵</i>YT Music</button><button data-u="https://www.youtube.com"><i>▶️</i>YouTube</button><button data-u="https://www.google.com"><i>🔍</i>Google</button><button data-u="https://www.wikipedia.org"><i>📚</i>Wikipedia</button></div><small>${isEl?'Pages open inside the tablet':'Pages open in a new browser tab (desktop app: inside the tablet)'}</small></div></div></div>`;
document.body.appendChild(tab);
let wv=null,cssKey=null,open=false,ready=false,vol=80,muted=false,dead=false;
try{const sv=localStorage.getItem('jb_vol');if(sv!==null)vol=Math.max(0,Math.min(100,+sv||0))}catch(e){}
function applyVol(){if(!wv||!ready)return;try{wv.setAudioMuted(muted||vol==0||dead)}catch(e){}
 try{wv.executeJavaScript('(function(v){document.querySelectorAll("video,audio").forEach(function(m){try{m.volume=v}catch(e){}})})('+(vol/100)+')')}catch(e){}}
function stopMusic(){dead=true;if(!wv||!ready)return;try{wv.executeJavaScript('document.querySelectorAll("video,audio").forEach(function(m){try{m.pause()}catch(e){}})')}catch(e){}try{wv.setAudioMuted(true)}catch(e){}}
function volUI(){$('tvl').value=vol;$('tmu').textContent=(muted||vol==0)?'🔇':vol<40?'🔈':'🔊'}
const toastM=m=>{try{toast(m,2.4)}catch(e){}};
const norm=s=>{s=(s||'').trim();if(!s)return'';if(/^https?:\/\//i.test(s))return s;if(/^[^\s]+\.[a-z]{2,}([\/?#].*)?$/i.test(s))return'https://'+s;return'https://www.google.com/search?q='+encodeURIComponent(s)};
function showHome(on){$('thome').style.display=on?'flex':'none'}
function mkView(u){if(wv||!isEl)return;const b=$('tbody');wv=document.createElement('webview');wv.setAttribute('partition','persist:tablet');wv.setAttribute('useragent',UA);wv.setAttribute('src',u||'about:blank');b.insertBefore(wv,$('thome'));
 wv.addEventListener('dom-ready',()=>{ready=true;applyVol()});
 const upd=()=>{try{if(document.activeElement!==$('turl')){const u=wv.getURL();$('turl').value=u=='about:blank'?'':u}}catch(e){}};
 wv.addEventListener('did-navigate',upd);wv.addEventListener('did-navigate-in-page',upd);wv.addEventListener('did-stop-loading',upd);
 wv.addEventListener('did-start-navigation',()=>{cssKey=null});wv.addEventListener('did-finish-load',()=>{cssKey=null;applyVol();if(!open)hideVideo(true)})}
function hideVideo(on){if(!wv||!ready)return;try{if(on&&!cssKey){wv.insertCSS('video{visibility:hidden!important}').then(k=>{cssKey=k;if(open&&cssKey){wv.removeInsertedCSS(cssKey);cssKey=null}}).catch(()=>{})}else if(!on&&cssKey){wv.removeInsertedCSS(cssKey);cssKey=null}}catch(e){}}
function go(raw){const u=norm(raw);if(!u)return;
 if(isEl){const fresh=!wv;mkView(u);showHome(false);if(!fresh){try{if(ready)wv.loadURL(u);else wv.src=u}catch(e){try{wv.src=u}catch(e2){}}}$('turl').value=u}
 else{try{window.open(u,'_blank','noopener')}catch(e){}toastM('Opened in a new browser tab')}}
const stopped=()=>{try{return typeof v!='number'||Math.abs(v)<.3||(Lv&&Lv.tm)}catch(e){return true}};
function openT(){if(open)return;if(!stopped()){toastM('Stop the car completely to use the tablet');return}
 open=true;tab.classList.add('on');hideVideo(false);try{for(const k of['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'])K[k]=0}catch(e){}
 setTimeout(()=>{if(!open)return;const f=$('thome').style.display=='none'?$('turl'):$('tsq');try{f.focus()}catch(e){}},60)}
function closeT(){if(!open)return;kbHide();open=false;tab.classList.remove('on');setTimeout(()=>hideVideo(true),300);try{document.activeElement&&document.activeElement.blur()}catch(e){}}
mini.onclick=()=>open?closeT():openT();
$('tvw').style.display=isEl?'flex':'none';volUI();
$('tvl').oninput=()=>{vol=+$('tvl').value;muted=false;try{localStorage.setItem('jb_vol',vol)}catch(e){}volUI();applyVol()};
$('tmu').onclick=()=>{muted=!muted;volUI();applyVol()};
$('tcl').onclick=closeT;$('thm').onclick=()=>{showHome(true);$('tsq').focus()};
$('tbk').onclick=()=>{try{wv&&wv.canGoBack()?wv.goBack():showHome(true)}catch(e){}};$('tfw').onclick=()=>{try{wv&&wv.canGoForward()&&(showHome(false),wv.goForward())}catch(e){}};$('trl').onclick=()=>{try{wv&&wv.reload()}catch(e){}};
$('turl').onkeydown=e=>{if(e.key=='Enter'){go($('turl').value);$('turl').blur()}};$('turl').onfocus=()=>$('turl').select();
$('tsq').onkeydown=e=>{if(e.key=='Enter'){go($('tsq').value);$('tsq').value=''}};$('tsg').onclick=()=>{go($('tsq').value);$('tsq').value=''};
tab.querySelectorAll('#thome .tl button').forEach(b=>b.onclick=()=>go(b.dataset.u));

/* ---------- on-screen keyboard (touch mode) ---------- */
const kb=document.createElement('div');kb.id='tkb';tab.querySelector('.tabf').appendChild(kb);
const ROWS=[['1','2','3','4','5','6','7','8','9','0'],['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['\u21e7','z','x','c','v','b','n','m','\u232b'],['.com','/',':','-','_','SPACE','.','Go']];
let shiftK=false,kbT=null;
const isTouch=()=>document.body.classList.contains('touch');
function kbBuild(){kb.innerHTML=ROWS.map(r=>'<div class="kr">'+r.map(k=>'<button data-k="'+k+'" class="'+(k=='SPACE'?'sp':k=='Go'?'go':(k.length>1?'wd':''))+'">'+(k=='SPACE'?'space':(shiftK&&/^[a-z]$/.test(k)?k.toUpperCase():k))+'</button>').join('')+'</div>').join('')}
function kbHide(){kb.style.display='none';kbT=null}
function kbPress(k){const el=kbT;if(!el)return;if(k=='\u21e7'){shiftK=!shiftK;kbBuild();return}
 if(k=='Go'){el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));kbHide();return}
 let s=el.selectionStart==null?el.value.length:el.selectionStart,e2=el.selectionEnd==null?s:el.selectionEnd;
 if(k=='\u232b'){if(s==e2&&s>0)s--;el.value=el.value.slice(0,s)+el.value.slice(e2);try{el.setSelectionRange(s,s)}catch(x){}return}
 const t=k=='SPACE'?' ':(shiftK&&/^[a-z]$/.test(k)?k.toUpperCase():k);el.value=el.value.slice(0,s)+t+el.value.slice(e2);try{el.setSelectionRange(s+t.length,s+t.length)}catch(x){}
 if(shiftK&&/^[a-z]$/.test(k)){shiftK=false;kbBuild()}}
kbBuild();kb.addEventListener('pointerdown',e=>{e.preventDefault();const b=e.target.closest('button');if(b)kbPress(b.dataset.k)});
['turl','tsq'].forEach(id=>{const e=$(id);e.addEventListener('focus',()=>{if(isTouch()){e.setAttribute('inputmode','none');kbT=e;kb.style.display='flex'}});e.addEventListener('blur',()=>setTimeout(()=>{const a=document.activeElement;if(a!==$('turl')&&a!==$('tsq'))kbHide()},90))});

/* typing in the tablet must never reach the game's key handler (I = engine, B = seatbelt ...) */
tab.addEventListener('keydown',e=>{e.stopPropagation();if(e.key=='Escape')closeT()},false);tab.addEventListener('keyup',e=>e.stopPropagation(),false);
/* T key (and the phone-controller Tablet button) */
addEventListener('keydown',e=>{if(e.key.toLowerCase()=='t'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!open&&typeof run!='undefined'&&run)openT()});
/* mini tablet is shown only while driving in the cockpit view; the big tablet shuts if the car moves */
let tc=0;const clock=()=>{let hh=null,mm=0;try{if(typeof GT=='number'){hh=Math.floor(GT)%24;mm=Math.floor((GT-Math.floor(GT))*60)}}catch(e){}if(hh==null){const d=new Date();hh=d.getHours();mm=d.getMinutes()}$('tmc').textContent=String(hh%12||12)+':'+String(mm).padStart(2,'0')+(hh<12?' AM':' PM')};clock();setInterval(clock,1000);
setInterval(()=>{let show=false;try{const ck=$('ck');show=!!run&&!paused&&getComputedStyle(ck).display!='none'&&$('ov').classList.contains('h')}catch(e){}
 mini.style.display=show&&!open?'block':'none';
 if(open&&!stopped()){closeT();toastM('Tablet closed: the car is moving')}
 /* crash, engine blast, eliminated or game over: the music stops */
 let over=false;try{over=!run||(typeof boomT=='number'&&boomT>0)||!!(window.RACE&&RACE.out&&RACE.out())}catch(e){}
 if(over&&!dead){stopMusic();if(open)closeT()}
 else if(!over&&dead){dead=false;applyVol()}
 tc=(tc+1)%8;if(tc==0&&!dead)applyVol()},250);
})();
