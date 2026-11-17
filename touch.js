/* ===== TOUCH MODE (mobile): cockpit-style on-screen controls for the car and the train =====
   Every control just sends the same key events as the keyboard, so all game rules stay identical. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const clamp=(a,l,h)=>Math.max(l,Math.min(h,a));
const kd=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
const ku=k=>window.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));
const tapK=k=>{kd(k);ku(k)};
const isOn=()=>document.body.classList.contains('touch');
const g=(f,d)=>{try{return f()}catch(e){return d}};           // safe read of game globals
const ICO={
 cam:'<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.4"/>',
 wip:'<path d="M3 18Q12 3 21 18"/><path d="M12 18L18 8"/><circle cx="12" cy="18" r="1.2"/>',
 bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8V16h7.2v-2.2A6 6 0 0 0 12 3z"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
 tab:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M10 18h4"/>',
 pause:'<path d="M8 5v14M16 5v14" stroke-width="3.2"/>',
 horn:'<path d="M3 10v4h3.5L13 18V6L6.5 10z"/><path d="M16 9a4 4 0 0 1 0 6M18.6 6.4a8 8 0 0 1 0 11.2"/>',
 flame:'<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-9.5z"/>',
 door:'<rect x="6" y="3" width="12" height="18"/><circle cx="15" cy="12" r="1"/>',
 panto:'<path d="M4 20h16M7 20l5-9 5 9M12 11V5M8 5h8"/>',
 haz:'<path d="M12 3L22 20H2z"/><path d="M12 9v5"/><circle cx="12" cy="17" r=".6"/>',
 arL:'<path d="M15 5l-8 7 8 7"/>',arR:'<path d="M9 5l8 7-8 7"/>',
 key:'<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v4M21 12v3"/>'
};
const ic=(n,sw)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(sw||1.8)+'" stroke-linecap="round" stroke-linejoin="round">'+ICO[n]+'</svg>';
let U=4,barOn=false;const setU=()=>{U=clamp(Math.min(innerWidth,innerHeight)/100,3.2,5.4)*(barOn?.9:1);document.documentElement.style.setProperty('--u',U+'px')};
setU();addEventListener('resize',()=>{setU();beltPlace()});

/* ---------- styles ---------- */
const st=document.createElement('style');st.textContent=`
body.touch #sp,body.touch #sg,body.touch #mz,body.touch #esc,body.touch #cm,body.touch #clk,body.touch #ck #wh,body.touch #ck .hd,body.touch #ck .ca,body.touch #ck #sk,body.touch #ck #gb,body.touch #tmini,body.touch #rnit,body.touch #rvc{display:none!important}
body.touch #mm,body.touch #ins,body.touch #sgt,body.touch #fn,body.touch #stt{z-index:9}
body.tcabv #ins{top:calc(11% + 6px)}body.tcabv #sgt{top:calc(11% + 62px)}
body.touch #mm{top:10px;bottom:auto;right:10px;width:calc(var(--u)*34);height:calc(var(--u)*34);pointer-events:auto;cursor:pointer;z-index:7}
body.touch #rpn{left:50%;right:auto;transform:translateX(-50%);top:70px}
#tui{position:fixed;inset:0;z-index:7;pointer-events:none;display:none;user-select:none;-webkit-user-select:none;touch-action:none;font-family:system-ui,sans-serif}
#tui *{touch-action:none;-webkit-tap-highlight-color:transparent}
#tui .a{position:absolute;pointer-events:auto}
.tb{width:calc(var(--u)*11);height:calc(var(--u)*11);border-radius:50%;background:rgba(8,10,14,.62);border:1.5px solid rgba(255,255,255,.28);color:#e8eef5;display:grid;place-items:center;box-shadow:0 2px 8px #0008}
.tb svg{width:58%;height:58%}.tb.on{color:#ffb000;border-color:#ffb000;background:rgba(40,28,0,.7)}.tb.dn{transform:scale(.92);background:rgba(60,70,90,.8)}
.tb.big{width:calc(var(--u)*15);height:calc(var(--u)*15)}
.tb small{font:700 calc(var(--u)*2.6) system-ui;position:absolute;bottom:calc(var(--u)*-3.4);color:#fff;text-shadow:0 1px 3px #000;letter-spacing:.06em}
#tclu{position:absolute;top:calc(var(--u)*34 + 20px);right:10px;width:calc(var(--u)*34);display:grid;grid-template-columns:repeat(4,1fr);gap:calc(var(--u)*1);justify-items:center;pointer-events:none}
#tclu .tb{pointer-events:auto;position:relative;width:calc(var(--u)*7.6);height:calc(var(--u)*7.6)}
#tpause{left:14px;top:128px}
.tarrow{width:calc(var(--u)*17);height:calc(var(--u)*17);border-radius:50%;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.32);display:grid;place-items:center;color:rgba(255,255,255,.82);bottom:calc(var(--u)*3)}
.tarrow svg{width:55%;height:55%}.tarrow.dn{background:rgba(255,255,255,.3)}
#tsl{left:calc(var(--u)*2)}#tsr{left:calc(var(--u)*21)}
#tgear{left:calc(var(--u)*41);bottom:calc(var(--u)*3);width:calc(var(--u)*30);height:calc(var(--u)*28);background:#14161a;border:2px solid #3b4048;border-radius:calc(var(--u)*2);box-shadow:inset 0 0 14px #000}
#tgear svg{position:absolute;inset:0;width:100%;height:100%}
#tkn{position:absolute;width:calc(var(--u)*8);height:calc(var(--u)*8);margin:calc(var(--u)*-4) 0 0 calc(var(--u)*-4);border-radius:50%;background:radial-gradient(circle at 35% 30%,#e0e3e8,#6b7078 60%,#2a2d32);border:2px solid #111;box-shadow:0 3px 8px #000a;transition:left .08s,top .08s;pointer-events:none}
#tdial{left:50%;bottom:calc(var(--u)*2);width:calc(var(--u)*30);height:calc(var(--u)*30);transform:translateX(-50%);pointer-events:none}
#tdial svg{width:100%;height:100%;filter:drop-shadow(0 4px 8px #000a)}
#tlim{position:absolute;right:calc(var(--u)*-5);bottom:calc(var(--u)*1);width:calc(var(--u)*8);height:calc(var(--u)*8);border-radius:50%;background:#fff;border:calc(var(--u)*1.1) solid #d11;color:#111;font:800 calc(var(--u)*3) system-ui;display:grid;place-items:center}
#tlt{left:calc(50% - var(--u)*28);bottom:calc(var(--u)*9)}#trt{left:calc(50% + var(--u)*17);bottom:calc(var(--u)*9)}
#thz{left:calc(50% - var(--u)*12);bottom:calc(var(--u)*34)}
#tnit{left:calc(50% + var(--u)*1);bottom:calc(var(--u)*34)}
#tnit .fill{position:absolute;inset:0;border-radius:50%;background:conic-gradient(#2dd4ff var(--p,0%),#0000 0);opacity:.6;-webkit-mask:radial-gradient(circle,#0000 58%,#000 60%);mask:radial-gradient(circle,#0000 58%,#000 60%)}
#tkey svg{width:86%;height:86%;transition:transform .3s}#tkey.on svg{transform:rotate(55deg)}#tkey.on{border-color:#e8c14a}
#tbar{position:absolute;left:0;right:0;bottom:0;height:calc(var(--u)*37);background:linear-gradient(#1d2026,#0c0e11);border-top:3px solid #444b55;box-shadow:0 -8px 18px #000b;pointer-events:none;display:none}
#thb{right:calc(var(--u)*43);bottom:calc(var(--u)*2);width:calc(var(--u)*9);height:calc(var(--u)*27)}
#thb svg{width:100%;height:100%}#thb .l{transition:transform .25s;transform-origin:20px 110px}#thb.dn .l{transform:rotate(-38deg)}
#thorn{left:calc(75% - var(--u)*18.5);bottom:calc(var(--u)*9)}
.ped{bottom:calc(var(--u)*2)}
.ped svg{width:100%;height:100%;filter:drop-shadow(0 4px 6px #000a);transition:transform .08s}.ped.dn svg{transform:scale(.93) translateY(4%);filter:brightness(1.25)}
#tgas{right:calc(var(--u)*2);width:calc(var(--u)*15);height:calc(var(--u)*33)}
#tbrk{right:calc(var(--u)*19);width:calc(var(--u)*20);height:calc(var(--u)*17)}
#tbelt{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#tbelt .hit{pointer-events:auto;fill:#0000}
/* train */
#tcab{position:absolute;inset:0;pointer-events:none;display:none}
#tcab .top{position:absolute;left:0;right:0;top:0;height:11%;background:linear-gradient(#e6e8ea,#c5c9cd);box-shadow:0 4px 12px #0008;display:grid;place-items:center;font:800 calc(var(--u)*3.3) system-ui;color:#15181c;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
#tcab .pl,#tcab .pr{position:absolute;top:0;bottom:30%;width:11%;background:linear-gradient(90deg,#d9dcdf,#aeb3b8)}
#tcab .pl{left:0;clip-path:polygon(0 0,100% 0,62% 100%,0 100%)}#tcab .pr{right:0;transform:scaleX(-1);clip-path:polygon(0 0,100% 0,62% 100%,0 100%)}
#tcab .bar{position:absolute;top:11%;bottom:38%;width:calc(var(--u)*.9);background:#101215;box-shadow:0 0 6px #000}
#tcab .desk{position:absolute;left:-2%;right:-2%;bottom:-3%;height:41%;background:linear-gradient(#b9bec3,#7c828a 40%,#4d535a);clip-path:polygon(0 18%,16% 0,84% 0,100% 18%,100% 100%,0 100%);box-shadow:inset 0 8px 18px #fff4}
#tcab .panel{position:absolute;left:10%;right:10%;bottom:0;height:30%;background:linear-gradient(#171a1f,#0c0e11);border-radius:calc(var(--u)*2) calc(var(--u)*2) 0 0;box-shadow:inset 0 0 16px #000;display:flex;gap:calc(var(--u)*2);justify-content:center;align-items:flex-start;padding-top:calc(var(--u)*1.6)}
#tcab .lamp{width:calc(var(--u)*2.2);height:calc(var(--u)*2.2);border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e}
#tcab .lamp.o{background:#f59e0b;box-shadow:0 0 8px #f59e0b}#tcab .lamp.r{background:#ef4444;box-shadow:0 0 8px #ef4444}
#thL{left:calc(var(--u)*3);bottom:calc(var(--u)*5)}#thR{right:calc(var(--u)*3);bottom:calc(var(--u)*5)}
#tlgT{left:calc(var(--u)*20);bottom:calc(var(--u)*5)}
#tbl{left:calc(var(--u)*34);bottom:calc(var(--u)*2);width:calc(var(--u)*10);height:calc(var(--u)*31)}
#tbl svg{width:100%;height:100%}#tbl .l{transform-origin:20px 112px;transition:transform .28s}#tbl.dn .l{transform:rotate(-34deg);transition:transform 1.2s linear}
#tem{left:calc(var(--u)*48);bottom:calc(var(--u)*5)}
#tem .rb{position:absolute;inset:12%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8b84,#d4181a 55%,#7b0c0e);border:2px solid #400;box-shadow:0 3px 8px #000a;display:grid;place-items:center;color:#fff;font:800 calc(var(--u)*2.2) system-ui}
#tem .fill{position:absolute;inset:0;border-radius:50%;background:conic-gradient(#fff var(--p,0%),#0000 0);opacity:.7;-webkit-mask:radial-gradient(circle,#0000 62%,#000 64%);mask:radial-gradient(circle,#0000 62%,#000 64%)}
#tnotch{left:calc(50% + var(--u)*23);right:calc(var(--u)*21);bottom:calc(var(--u)*5);height:calc(var(--u)*15);background:rgba(8,10,14,.7);border:1.5px solid rgba(255,255,255,.28);border-radius:calc(var(--u)*2)}
#tnotch .tr{position:absolute;left:7%;right:7%;top:46%;height:calc(var(--u)*1.6);border-radius:9px;background:#000;box-shadow:inset 0 0 6px #000,0 0 0 2px #444}
#tnotch .tk{position:absolute;top:22%;color:#cfd6de;font:700 calc(var(--u)*2.8) system-ui;transform:translateX(-50%)}
#tnotch .tk::after{content:'';display:block;width:2px;height:calc(var(--u)*2);background:#8c95a1;margin:calc(var(--u)*.4) auto 0}
#tnotch .lb{position:absolute;left:8px;top:2px;font:800 calc(var(--u)*2.2) system-ui;color:#ffb000;letter-spacing:.1em}
#tnk{position:absolute;top:50%;width:calc(var(--u)*6);height:calc(var(--u)*9);margin:calc(var(--u)*-3.2) 0 0 calc(var(--u)*-3);border-radius:calc(var(--u)*1.2);background:linear-gradient(90deg,#8d9298,#e4e7ea 45%,#6c7279);border:2px solid #222;box-shadow:0 3px 8px #000a;pointer-events:none}
#tkm{font:700 38px "Courier New",monospace}
`;document.head.appendChild(st);

/* ---------- small builders ---------- */
const root=document.createElement('div');root.id='tui';document.body.appendChild(root);
const el=(html,cls,id,style)=>{const d=document.createElement('div');if(id)d.id=id;d.className=cls||'';d.innerHTML=html||'';if(style)d.style.cssText=style;return d};
function holdBtn(e,key,cls){const dn=ev=>{ev.preventDefault();try{e.setPointerCapture(ev.pointerId)}catch(x){}e.classList.add(cls||'dn');kd(key)},up=()=>{if(e.classList.contains(cls||'dn')){e.classList.remove(cls||'dn');ku(key)}};
 e.addEventListener('pointerdown',dn);e.addEventListener('pointerup',up);e.addEventListener('pointercancel',up);e.addEventListener('lostpointercapture',up)}
function tapBtn(e,fn){e.addEventListener('pointerdown',ev=>{ev.preventDefault();e.classList.add('dn');fn(ev)});const r=()=>e.classList.remove('dn');e.addEventListener('pointerup',r);e.addEventListener('pointercancel',r);e.addEventListener('pointerleave',r)}
const tb=(icon,id,key,extra,lab)=>{const b=el(ic(icon)+(lab?'<small>'+lab+'</small>':''),'tb '+(extra||''),id);tapBtn(b,()=>tapK(key));return b};
function dialHTML(max){const step=max<=160?20:max<=320?40:50;let s='<circle cx="100" cy="100" r="97" fill="#0d1117" stroke="#3b4350" stroke-width="4"/><circle cx="100" cy="100" r="89" fill="none" stroke="#1f2833" stroke-width="2"/>';
 for(let sp=0;sp<=max+.1;sp+=step/2){const maj=Math.abs(sp%step)<.01,th=(-135+270*sp/max)*Math.PI/180,r1=maj?72:80,r2=89;
  s+='<line x1="'+(100+r1*Math.sin(th)).toFixed(1)+'" y1="'+(100-r1*Math.cos(th)).toFixed(1)+'" x2="'+(100+r2*Math.sin(th)).toFixed(1)+'" y2="'+(100-r2*Math.cos(th)).toFixed(1)+'" stroke="'+(maj?'#fff':'#7b8593')+'" stroke-width="'+(maj?3:1.5)+'"/>';
  if(maj){const r3=58;s+='<text x="'+(100+r3*Math.sin(th)).toFixed(1)+'" y="'+(100-r3*Math.cos(th)+5).toFixed(1)+'" fill="#dfe7ee" font-size="'+(max>300?11:13)+'" text-anchor="middle" font-family="system-ui">'+Math.round(sp)+'</text>'}}
 return s+'<text id="tkm" x="100" y="132" fill="#7dffb0" text-anchor="middle" font-family="Courier New,monospace" font-size="34" font-weight="700">0</text><text x="100" y="146" fill="#8b95a3" text-anchor="middle" font-size="10" font-family="system-ui">km/h</text><text id="tgr" x="100" y="170" fill="#ffb000" text-anchor="middle" font-size="19" font-weight="700" font-family="system-ui">N</text><g id="tdn"><path d="M100 100L96.5 38L100 16L103.5 38Z" fill="#ff4a3d"/></g><circle cx="100" cy="100" r="8" fill="#222" stroke="#666" stroke-width="2"/>'}
let dialMax=0,dialKey='';
function mkDial(host,max,key){if(dialKey===key)return;dialKey=key;dialMax=max;const sv=host.querySelector('svg');sv.innerHTML=dialHTML(max)}

/* ---------- CAR UI ---------- */
const carUI=el('','a','tcar','inset:0;pointer-events:none');
{const mk=(h,c,i,s)=>{const e=el(h,'a '+(c||''),i,s);carUI.appendChild(e);return e};
 /* steering: two round translucent arrows (bottom left corner) */
 const sl=mk(ic('arL',2.4),'tarrow','tsl'),sr=mk(ic('arR',2.4),'tarrow','tsr');holdBtn(sl,'ArrowLeft');holdBtn(sr,'ArrowRight');
 /* gear stick gate with grooves; slide the knob */
 const gt=mk('<svg viewBox="0 0 160 150"><g stroke="#050607" stroke-width="11" stroke-linecap="round" fill="none"><path d="M24 22V128M64 22V128M104 22V128M144 22V75M24 75H144"/></g><g stroke="#2b2f36" stroke-width="1.5" fill="none"><path d="M24 22V128M64 22V128M104 22V128M144 22V75M24 75H144"/></g><g fill="#ffb000" font-family="monospace" font-size="11" font-weight="700" text-anchor="middle"><text x="24" y="12">1</text><text x="64" y="12">3</text><text x="104" y="12">5</text><text x="144" y="12">R</text><text x="24" y="148">2</text><text x="64" y="148">4</text><text x="104" y="148">6</text></g></svg><div id="tkn"></div>','','tgear');
 const kn=gt.querySelector('#tkn'),GX=[24,64,104,144],YT=22,YB=128,YN=75,SL={1:[24,YT],2:[24,YB],3:[64,YT],4:[64,YB],5:[104,YT],6:[104,YB],R:[144,YT]};
 let kx=64,ky=YN,cur='N',drag=false;
 const place=()=>{kn.style.left=(kx/160*100)+'%';kn.style.top=(ky/150*100)+'%'};
 const near=x=>GX.reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a);
 const decide=()=>{let gg=null;for(const k in SL){if(Math.hypot(kx-SL[k][0],ky-SL[k][1])<9)gg=k}if(gg&&gg!==cur){cur=gg;tapK(gg=='R'?'r':gg)}else if(!gg&&Math.abs(ky-YN)<4&&cur!='N'){cur='N';tapK('0')}};
 const move=(px,py)=>{const inCh=Math.abs(ky-YN)<=12;
  if(inCh){kx=clamp(px,24,144);const nc=near(kx);if(Math.abs(kx-nc)<=11){kx=nc;ky=clamp(py,YT,nc==144?YN:YB);if(Math.abs(ky-YN)<12)ky=YN}else ky=YN}
  else{const nc=near(kx);kx=nc;ky=clamp(py,YT,nc==144?YN:YB);if(Math.abs(ky-YN)<12)ky=YN}
  place();decide()};
 const pt=ev=>{const r=gt.getBoundingClientRect();return[(ev.clientX-r.left)/r.width*160,(ev.clientY-r.top)/r.height*150]};
 gt.addEventListener('pointerdown',ev=>{ev.preventDefault();drag=true;try{gt.setPointerCapture(ev.pointerId)}catch(x){}const[a,b]=pt(ev);move(a,b)});
 gt.addEventListener('pointermove',ev=>{if(drag){ev.preventDefault();const[a,b]=pt(ev);move(a,b)}});
 const end=()=>{if(!drag)return;drag=false;const nc=near(kx);if(ky<=48&&Math.abs(ky-YN)>=12){kx=nc;ky=YT}else if(ky>=102&&nc!=144){kx=nc;ky=YB}else ky=YN;place();decide()};
 gt.addEventListener('pointerup',end);gt.addEventListener('pointercancel',end);
 carUI.syncGear=()=>{if(drag)return;const gg=g(()=>G,'N');if(gg!==cur){cur=gg;if(SL[gg]){kx=SL[gg][0];ky=SL[gg][1]}else ky=YN;place()}};place();
 /* speedometer: analog + digital, key under it */

 /* indicators + hazard */
 tapBtn(mk(ic('arL',2.6),'tb','tlt'),()=>tapK('q'));tapBtn(mk(ic('arR',2.6),'tb','trt'),()=>tapK('e'));tapBtn(mk(ic('haz',1.8),'tb','thz'),()=>tapK('z'));
 /* nitro */
 const nt=mk(ic('flame',1.8)+'<span class="fill"></span>','tb big','tnit');nt.style.display='none';holdBtn(nt,'n');
 /* handbrake lever, horn, pedals */
 const hb=mk('<svg viewBox="0 0 40 120"><rect x="6" y="104" width="28" height="12" rx="4" fill="#2a2d32" stroke="#555"/><g class="l"><rect x="17" y="22" width="6" height="86" fill="#9aa0a8"/><rect x="11" y="6" width="18" height="24" rx="6" fill="#c62828" stroke="#600"/></g><circle cx="20" cy="110" r="5" fill="#444"/></svg>','','thb');holdBtn(hb,' ');
 const hn=mk(ic('horn',1.8),'tb big','thorn');holdBtn(hn,'h');
 const ped=(id,w,h,rows)=>{let d='';for(let r=0;r<rows[0];r++)for(let c=0;c<rows[1];c++)d+='<circle cx="'+(rows[2]+c*rows[3])+'" cy="'+(rows[4]+r*rows[5])+'" r="'+rows[6]+'" fill="#15171a"/>';
  return mk('<svg viewBox="0 0 '+w+' '+h+'"><defs><linearGradient id="'+id+'g" x1="0" x2="1"><stop offset="0" stop-color="#9fa4aa"/><stop offset=".5" stop-color="#eceef0"/><stop offset="1" stop-color="#8b9096"/></linearGradient></defs><rect x="4" y="4" width="'+(w-8)+'" height="'+(h-8)+'" rx="12" fill="url(#'+id+'g)" stroke="#2a2d32" stroke-width="3"/>'+d+'</svg>','ped',id)};
 const gas=ped('tgas',80,170,[7,3,20,20,26,20,5]),brk=ped('tbrk',110,90,[3,5,15,20,22,22,5.5]);
 holdBtn(gas,'ArrowUp');holdBtn(brk,'ArrowDown');
 /* cluster: camera, wipers, lights, mic, tablet (beside the map) */
}
const dial=el('<svg viewBox="0 0 200 200"></svg><div id="tlim">50</div>','a','tdial');root.appendChild(dial);
const cl=el('','','tclu');root.appendChild(cl);
const bKey=el('<svg viewBox="0 0 60 60" fill="none" stroke="#e8c14a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><g><circle cx="20" cy="30" r="10"/><circle cx="20" cy="30" r="3.5" fill="#e8c14a"/><path d="M30 30H52M44 30V40M51 30V37"/></g></svg>','tb','tkey');tapBtn(bKey,()=>tapK('i'));
const bCam=tb('cam','tcam','c','',''),bWip=tb('wip','twp','x'),bLt=tb('bulb','tlg','l'),bMic=tb('mic','tmic','v'),bTab=tb('tab','ttb','t'),bEng=tb('key','teng','e'),bPan=tb('panto','tpan','p'),bDor=tb('door','tdr','d');
bCam.addEventListener('pointerdown',()=>setTimeout(()=>{const n=g(()=>$('cm').textContent.replace(' (C)',''),'');if(n)g(()=>toast(n,1.6))},80));
[bKey,bEng,bPan,bDor,bWip,bLt,bMic,bCam,bTab].forEach(b=>cl.appendChild(b));
const pz=el(ic('pause'),'a tb','tpause');tapBtn(pz,()=>tapK('Escape'));root.appendChild(pz);
root.insertBefore(el('','','tbar'),root.firstChild);root.appendChild(carUI);
/* map: tap to open the full map */
document.getElementById('mm').addEventListener('pointerdown',ev=>{if(isOn()){ev.preventDefault();g(()=>toggleFull())}});

/* ---------- seatbelt: hangs at the left edge, tap to pull it across ---------- */
const NS='http://www.w3.org/2000/svg';
const bsvg=document.createElementNS(NS,'svg');bsvg.id='tbelt';
bsvg.innerHTML='<path id="tbs" fill="none" stroke="#15171a" stroke-linecap="butt"/><path id="tbs2" fill="none" stroke="#d8d8d8" stroke-dasharray="6 8" opacity=".55"/><g id="tbt"><rect x="-12" y="-4" width="24" height="42" rx="5" fill="#17191c" stroke="#3a3f46"/><rect x="-8" y="10" width="16" height="22" rx="3" fill="#c9ced4" stroke="#555"/><rect x="-5" y="14" width="10" height="5" rx="2" fill="#2a2d32"/></g><rect id="tbh" class="hit" x="0" y="0" width="10" height="10"/>';
root.appendChild(bsvg);
const bs={st:'idle',t:0,x:0,y:0,hideAt:0};
const bP=()=>{const W=innerWidth,H=innerHeight;return{ax:0,ay:H*.28,rx:U*7.5,ry:H*.28+U*26,ex:W/2,ey:H-U*13}};
function bdraw(p){const s=$('tbs'),s2=$('tbs2'),tg=$('tbt');if(!s)return;const sw=U*3.2,d='M'+p.ax+' '+p.ay+' Q'+(p.ax+(bs.x-p.ax)*.3)+' '+((p.ay+bs.y)/2+(bs.st=='idle'?0:U*6))+' '+bs.x+' '+(bs.y-U*2);
 s.setAttribute('d',d);s.setAttribute('stroke-width',sw);s2.setAttribute('d',d);s2.setAttribute('stroke-width',Math.max(1,sw*.12));
 tg.setAttribute('transform','translate('+bs.x+' '+bs.y+') scale('+(U/4.2)+')');const h=$('tbh');h.setAttribute('x',bs.x-U*5);h.setAttribute('y',bs.y-U*3);h.setAttribute('width',U*10);h.setAttribute('height',U*14)}
function beltPlace(){const p=bP();if(bs.st=='idle'){bs.x=p.rx;bs.y=p.ry}bdraw(p)}
$('tbh').addEventListener('pointerdown',ev=>{ev.preventDefault();if(bs.st=='idle'){bs.st='pull';bs.t=0;try{tone(900,.06,'square',.04)}catch(e){}}});
function beltTick(dt){const p=bP(),worn=!!g(()=>belt,false);
 if(bs.st=='idle'){beltPlace()}
 else if(bs.st=='pull'){bs.t+=dt;const f=clamp(bs.t/.85,0,1),e=1-Math.pow(1-f,3);bs.x=p.rx+(p.ex-p.rx)*e;bs.y=p.ry+(p.ey-p.ry)*e;bdraw(p);if(f>=1){bs.st='done';bs.hideAt=performance.now()+3000;if(!worn)tapK('b');try{tone(1200,.1,'square',.05)}catch(e2){}}}
 else if(bs.st=='done'){bdraw(p);if(performance.now()>bs.hideAt)bs.st='hidden'}
 if(worn&&bs.st=='idle')bs.st='hidden';
 if(!worn&&bs.st=='hidden'){bs.st='idle';beltPlace()}
 bsvg.style.display=(bs.st=='hidden')?'none':'block'}

/* ---------- TRAIN UI (cab) ---------- */
const tr=el('','','ttrain','position:absolute;inset:0;pointer-events:none;display:none');
{const cab=el('<div class="top" id="tctitle">TRAIN</div><div class="pl"></div><div class="pr"></div>'+[14,26,38,50,62,74,86].map(x=>'<div class="bar" style="left:'+x+'%"></div>').join('')+'<div class="desk"><div class="panel"><span class="lamp"></span><span class="lamp o"></span><span class="lamp r"></span><span class="lamp"></span><span class="lamp o"></span></div></div>','','tcab');
 root.insertBefore(cab,root.firstChild);
 const mk=(h,c,i)=>{const e=el(h,'a '+(c||''),i);tr.appendChild(e);return e};
 const hl=mk(ic('horn',1.8)+'<small>LOW</small>','tb big','thL'),hh=mk(ic('horn',2.3)+'<small>HIGH</small>','tb big','thR');holdBtn(hl,'h');holdBtn(hh,'g');
 const lg=mk(ic('bulb',1.8)+'<small>LIGHT</small>','tb','tlgT');tapBtn(lg,()=>tapK('l'));
 const bl=mk('<svg viewBox="0 0 40 120"><rect x="6" y="104" width="28" height="12" rx="4" fill="#2a2d32" stroke="#555"/><g class="l"><rect x="17" y="22" width="6" height="86" fill="#aab0b8"/><rect x="10" y="4" width="20" height="26" rx="7" fill="#1e5fd1" stroke="#0a2a66"/></g><circle cx="20" cy="112" r="5" fill="#444"/></svg>','','tbl');holdBtn(bl,' ');
 const em=mk('<span class="rb">EMERG</span><span class="fill"></span>','tb big','tem');em.style.background='none';em.style.border='0';em.style.boxShadow='none';
 let emT=0,emOn=false,emS=0;const emUp=()=>{clearInterval(emT);if(emOn){emOn=false;ku('x')}em.style.setProperty('--p','0%')};
 em.addEventListener('pointerdown',ev=>{ev.preventDefault();try{em.setPointerCapture(ev.pointerId)}catch(x){}emS=performance.now();emT=setInterval(()=>{const f=clamp((performance.now()-emS)/500,0,1);em.style.setProperty('--p',f*100+'%');if(f>=1&&!emOn){emOn=true;kd('x')}},40)});
 ['pointerup','pointercancel','lostpointercapture'].forEach(n=>em.addEventListener(n,emUp));
 /* notch lever: slide along a scale 0..8 */
 const nt=mk('<span class="lb">NOTCH</span><div class="tr"></div>'+[0,1,2,3,4,5,6,7,8].map(n=>'<span class="tk" style="left:'+(7+n/8*86)+'%">'+n+'</span>').join('')+'<div id="tnk"></div>','','tnotch');
 const nk=nt.querySelector('#tnk');let ndrag=false,nv=0;
 const setN=n=>{nv=n;nk.style.left=(7+n/8*86)+'%'};
 const fromEv=ev=>{const r=nt.getBoundingClientRect(),f=((ev.clientX-r.left)/r.width*100-7)/86;const n=clamp(Math.round(f*8),0,8);if(n!==nv){setN(n);g(()=>{PT.lever=n/8})}};
 nt.addEventListener('pointerdown',ev=>{ev.preventDefault();ndrag=true;try{nt.setPointerCapture(ev.pointerId)}catch(x){}fromEv(ev)});
 nt.addEventListener('pointermove',ev=>{if(ndrag){ev.preventDefault();fromEv(ev)}});
 const nend=()=>{ndrag=false};nt.addEventListener('pointerup',nend);nt.addEventListener('pointercancel',nend);
 tr.syncNotch=()=>{if(ndrag)return;const n=Math.round(g(()=>PT.lever,0)*8);if(n!==nv)setN(n)};setN(0);
}
root.appendChild(tr);

/* ---------- visibility, live values ---------- */
let last=performance.now(),ptSeen=null,carKey='',offKey='';
const onOff=(e,on)=>{if(e)e.classList.toggle('on',!!on)};
function frame(){requestAnimationFrame(frame);const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;
 const run_=g(()=>run,false),ovOpen=!$('ov').classList.contains('h'),tm=g(()=>!!Lv.tm,false),show=isOn()&&run_&&!ovOpen;
 root.style.display=show?'block':'none';document.body.classList.toggle('tcabv',!!(show&&tm&&g(()=>cm,0)==1));
 if(!show){if(offKey){offKey='';g(()=>cam.clearViewOffset())}if(barOn){barOn=false;setU()}return}
 {const bar=g(()=>cm,1)!==1;if(bar!==barOn){barOn=bar;setU();$('tbar').style.display=bar?'block':'none'}
  if(bar){const bh=$('tbar').offsetHeight||Math.round(U*37),k=innerWidth+'x'+innerHeight+'x'+bh;if(k!==offKey){offKey=k;g(()=>{cam.setViewOffset(innerWidth,innerHeight,0,Math.round(bh/2),innerWidth,innerHeight)})}}
  else if(offKey){offKey='';g(()=>cam.clearViewOffset())}}
 carUI.style.display=tm?'none':'block';tr.style.display=tm?'block':'none';
 const race=g(()=>!!Lv.race,false),net=g(()=>RACE.net(),false);
 $('tmic').style.display=net?'grid':'none';$('tnit').style.display=(!tm&&race)?'grid':'none';
 $('twp').style.display=tm?'none':'grid';$('teng').style.display=tm?'grid':'none';$('tpan').style.display=tm?'grid':'none';$('tdr').style.display=tm?'grid':'none';
 $('tkey').style.display=tm?'none':'grid';$('tbelt').style.display=tm?'none':'';
 const kmh=Math.abs(g(()=>v,0))*3.6;
 if(!tm){
  const top=g(()=>CARSHOP[Lv.car].top,200),mx=Math.ceil(Math.max(160,top*1.25)/20)*20,key='c'+mx;mkDial(dial,mx,key);$('tlim').style.display='grid';
  $('tkm').textContent=Math.round(kmh);$('tgr').textContent=g(()=>G,'N');
  $('tdn').setAttribute('transform','rotate('+(-135+270*clamp(kmh/dialMax,0,1))+' 100 100)');
  const lm=g(()=>lim,50);$('tlim').textContent=lm>=900?'\u221e':lm;
  onOff($('tlt'),g(()=>sigL,0));onOff($('trt'),g(()=>sigR,0));onOff($('thz'),g(()=>hz,0));onOff($('tlg'),g(()=>hl,0));onOff($('twp'),g(()=>wipe,0));
  $('tkey').classList.toggle('on',!!g(()=>engOn,0));carUI.syncGear();
  if(race){const f=g(()=>RACE.nitroFuel(),0);$('tnit').style.setProperty('--p',f+'%');$('tnit').classList.toggle('on',!!g(()=>RACE.nitroOn(),0))}
  beltTick(dt);
 }else{
  const P=g(()=>PT,null);if(!P)return;
  if(P!==ptSeen){ptSeen=P;g(()=>{cm=1})}                      /* start in the cab view */
  const kind=P.tr.kind,mx=Math.ceil(g(()=>LIMS[kind].max,160)/20)*20,key='t'+mx+kind;mkDial(dial,mx,key);$('tlim').style.display='grid';$('tlim').textContent=g(()=>Math.round(lim),'');
  $('tkm').textContent=Math.round(kmh);$('tgr').textContent=P.stopped&&!P.depart?'STOP':'N'+Math.round(P.lever*8);
  $('tdn').setAttribute('transform','rotate('+(-135+270*clamp(kmh/dialMax,0,1))+' 100 100)');
  const nm=g(()=>TRSHOP[SELT].n,P.tr.nm||'TRAIN'),mxs=g(()=>LIMS[kind].max,0);$('tctitle').textContent=nm+' \u00b7 MAX SPEED '+mxs+' KMPH';
  onOff($('teng'),P.eng);onOff($('tpan'),P.pan);onOff($('tdr'),P.doors);onOff($('tlgT'),P.lights);onOff($('tlg'),P.lights);
  $('tcab').style.display=g(()=>cm,0)==1?'block':'none';tr.syncNotch();
 }
}
requestAnimationFrame(frame);
window.TOUCHUI={tapK,kd,ku};
})();
