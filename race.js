/* ===== RACING MODE v2: the race runs INSIDE the real world (same cities, same Ring Road, same car, cockpit, HUD, minimap, rules) ===== */
(function(){
'use strict';
const R=window.RACE={};
const LANES=6,LW=3.75,BW=LANES*LW;
const LENS=[10,15,20,25,30,40,50];
const CITYN=['AONLA','BUDAUN','BAREILLY','HOWRAH','SEALDAH','MUMBAI CSMT','CHENNAI CENTRAL','LUCKNOW','DELHI JN','NEW DELHI','AHMEDABAD','KHARAGPUR'];
const PCT={1:[100],2:[100,0],3:[75,25,0],4:[50,30,20,0],5:[40,30,20,10,0],6:[30,25,20,15,10,0]};
const r100=n=>Math.round(n/100)*100;
const prizes=(m,pool)=>PCT[Math.max(1,Math.min(6,m))].map(p=>r100(pool*p/100));
R.prizes=prizes;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(a,lo,hi)=>Math.max(lo,Math.min(hi,a));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const fmtT=tt=>tt==null?'DNF':(Math.floor(tt/60)+':'+(tt%60).toFixed(2).padStart(5,'0'));
const nameGet=()=>STO.g('rr3name')||'';
const cname=k=>MODELS[k]?MODELS[k].n:k;
const topOf=k=>(CARSHOP[k]||{top:215}).top;
const rid=()=>[...Array(6)].map(()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
const lx=lane=>(lane-2.5)*LW;
const wrapD=(d,L)=>{d=((d%L)+L)%L;return d>L/2?d-L:d};

/* ---------- styles / dom (same look as the main game HUD) ---------- */
{const st=document.createElement('style');st.textContent=`
.rin{display:block;width:100%;box-sizing:border-box;margin:4px 0 8px;padding:10px 12px;border-radius:10px;border:2px solid #2d3b4a;background:#0f171f;color:#fff;font:600 16px system-ui}
.rlb{font-size:13px;color:#93a1ae;margin-top:4px;display:block}
.chk{height:26px;border-radius:6px;background:conic-gradient(#000 25%,#fff 0 50%,#000 0 75%,#fff 0) 0 0/26px 26px}
.rrow{display:flex;gap:10px;align-items:center;background:#0f171f;border:2px solid #2d3b4a;border-radius:12px;padding:8px 12px;margin:6px 0}
.rrow.me{border-color:#2dd4ff;background:#14323f}.rrow b.pos{font-size:22px;width:44px}.rrow span{flex:1}.rrow small{display:block;color:#93a1ae}
.rrow .btn{margin:0;padding:6px 10px}
#rpn{position:fixed;right:14px;top:132px;z-index:6;pointer-events:none;display:none;background:#000a;border-radius:12px;padding:6px 14px;text-align:right;text-shadow:0 1px 4px #000}
#rpn b{font-size:26px}#rpn div{font:700 18px "Courier New",monospace;color:#ffd34d}#rpn small{display:block;color:#b8c4d0;font-size:12px}
#rnit{position:fixed;left:22px;bottom:124px;width:210px;z-index:6;pointer-events:none;display:none;background:#000a;border-radius:12px;padding:6px 10px;font:700 13px system-ui;text-shadow:0 1px 3px #000}
#rnit small{color:#93a1ae;font-weight:400;float:right}
#rnit .nb{height:12px;border-radius:6px;background:#fff2;overflow:hidden;margin-top:4px}#rnit .nb i{display:block;height:100%;width:0;background:linear-gradient(90deg,#19a8ff,#7df)}
#rnit.on{box-shadow:0 0 18px #2dd4ff}#rnit.on .nb i{background:linear-gradient(90deg,#ff7a1a,#ffd34d)}
#rbig{position:fixed;inset:0;z-index:7;pointer-events:none;display:none;place-items:center;font:900 150px system-ui;text-shadow:0 4px 24px #000;color:#fff}
#rout{position:fixed;top:118px;left:50%;transform:translateX(-50%);z-index:12;display:none;background:#240a0ecc;border:2px solid #ff5a4d;border-radius:14px;padding:10px 18px;text-align:center;max-width:92vw}
#rout h2{margin:0 0 4px;color:#ff8a7e}#rout p{margin:2px 0}
#rfxl{position:fixed;inset:0;z-index:4;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,#0000 38%,#2dd4ff66 100%),repeating-conic-gradient(from 0deg at 50% 50%,#fff0 0 7deg,#fff3 7deg 7.6deg)}
#rlb{position:fixed;left:14px;top:180px;z-index:6;pointer-events:none;display:none;background:#000a;border-radius:10px;padding:4px 10px;font:700 13px system-ui;min-width:128px;text-shadow:0 1px 3px #000}
#rlb div{display:flex;gap:6px;align-items:center;padding:1px 0;white-space:nowrap}#rlb b{width:18px;color:#ffd34d}#rlb .me{color:#2dd4ff}#rlb .out{color:#777;text-decoration:line-through}#rlb .up{animation:rlbu .9s}
@keyframes rlbu{0%{background:#2dd4ff66}100%{background:#0000}}
#rvc{position:fixed;left:14px;top:132px;z-index:6;display:none;font:700 13px system-ui;text-shadow:0 1px 3px #000}
#rvc button{background:#000a;color:#fff;border:1px solid #fff4;border-radius:10px;padding:4px 10px;font:700 13px system-ui;cursor:pointer;pointer-events:auto}
#rvc div{background:#000a;border-radius:8px;padding:2px 8px;margin-top:3px;color:#7dff9b;pointer-events:none}
#rfw{position:fixed;inset:0;z-index:60;pointer-events:none;display:none}
#rscan{position:fixed;inset:0;z-index:70;background:#000e;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#fff}
#rscan video{width:min(480px,92vw);border-radius:14px;background:#000}
#rchat{height:120px;overflow:auto;background:#0f171f;border:2px solid #2d3b4a;border-radius:10px;padding:6px 10px;font-size:14px}
#rchat p{margin:2px 0;color:#dfe7ee}#rchat b{color:#2dd4ff}
`;document.head.appendChild(st);
const mk=(tag,id,html)=>{const e=document.createElement(tag);e.id=id;if(html)e.innerHTML=html;document.body.appendChild(e);return e};
mk('canvas','rfw');mk('div','rlb');mk('div','rfxl');mk('div','rbig');mk('div','rout');mk('div','rvc');
mk('div','rpn','<b id="rpos"></b><div id="rtm">0:00.00</div><small id="rkm"></small>');
mk('div','rnit','<b>🔥 NITRO <span id="rnv">0%</span></b><small>hold Shift / N</small><div class="nb"><i id="rnb"></i></div>');
mk('div','rscan','<video id="rsv" playsinline muted></video><div id="rsm">Point the camera at the room QR code</div><button class="btn s" id="rsc">Cancel</button>');
}

/* ---------- state ---------- */
const S=R.S={active:false,mode:'',phase:'',cars:[],me:null,fee:0,TL:10000,raceT:0,tt:0,cd:0,cfg:null,S0:0,si:0,pk:[],fx:[],dt:.016,paid:false,done:false,spec:false,fins:{},firstFinAt:null,sendT:0,afterT:0,seed:1,cityS:[],lastCity:-1,hostDone:false,rdy:{},waitT:0,pendGo:false};
let RT=null,TL=10000;
const NI={fuel:30,on:0,cap:0,t:0,sfx:0,flame:null,flameT:0};
R.out=()=>!!(S.active&&S.spec);
R.net=()=>S.active&&S.mode=='net';
R.nitroFuel=()=>Math.round(NI.fuel);R.nitroOn=()=>!!NI.on;
R.hold=()=>!S.active||S.phase!='race'||!S.me||!!S.me.out;
R.brake=()=>S.active&&(S.phase=='fin'||S.phase=='done');

/* ---------- ring road maths (the SAME Ring Road as the main world: RING polyline) ---------- */
const Q={x:0,z:0,tx:0,tz:1},Q2={x:0,z:0,tx:0,tz:1},LC={s:0,lat:0,tx:0,tz:1,d:0};let LH=0;
function ringInit(){if(RT&&RT.P===RING)return;const P=RING,n=P.length,cum=new Float64Array(n+1);for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];cum[i+1]=cum[i]+Math.hypot(b.x-a.x,b.z-a.z)}RT={P,n,cum,PL:cum[n]};LH=0}
function rposW(sw,lat,o){const P=RT.P,n=RT.n,cum=RT.cum,PL=RT.PL;sw=((sw%PL)+PL)%PL;let lo=0,hi=n;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=sw)lo=m;else hi=m}
 const a=P[lo],b=P[(lo+1)%n],l=cum[lo+1]-cum[lo]||1,f=(sw-cum[lo])/l,tx=(b.x-a.x)/l,tz=(b.z-a.z)/l;
 o.tx=tx;o.tz=tz;o.x=a.x+(b.x-a.x)*f-tz*lat;o.z=a.z+(b.z-a.z)*f+tx*lat;return o}
const rpos=(prog,lat,o)=>rposW(S.S0+prog,lat,o);
/* nearest point on the ring: arc position s, lateral offset (right = +), tangent */
function ringLoc(px,pz,o){const P=RT.P,n=RT.n;let bi=LH,bd=1e18;const chk=i=>{i=((i%n)+n)%n;const d=(P[i].x-px)**2+(P[i].z-pz)**2;if(d<bd){bd=d;bi=i}};
 for(let k=-60;k<=60;k++)chk(LH+k);if(bd>150*150){for(let i=0;i<n;i+=8)chk(i);const c0=bi;for(let k=-10;k<=10;k++)chk(c0+k)}LH=bi;
 let best=null;for(const j0 of[bi-1,bi]){const j=(j0+n)%n,a=P[j],b=P[(j+1)%n],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz||1,f=clamp(((px-a.x)*dx+(pz-a.z)*dz)/l2,0,1),qx=a.x+dx*f,qz=a.z+dz*f,d2=(px-qx)**2+(pz-qz)**2;
  if(!best||d2<best.d2){const l=Math.sqrt(l2);best={d2,j,f,tx:dx/l,tz:dz/l,lat:(px-qx)*(-dz/l)+(pz-qz)*(dx/l)}}}
 o.s=RT.cum[best.j]+best.f*(RT.cum[best.j+1]-RT.cum[best.j]);o.lat=best.lat;o.tx=best.tx;o.tz=best.tz;o.d=Math.sqrt(best.d2);return o}
function nearIdx(px,pz){const P=RT.P,n=RT.n;let bi=0,bd=1e18;for(let i=0;i<n;i++){const d=(P[i].x-px)**2+(P[i].z-pz)**2;if(d<bd){bd=d;bi=i}}return bi}
let _sd=1;const rnd=()=>{_sd=(_sd*1664525+1013904223)>>>0;return _sd/4294967296};

/* ---------- small textures / sprites ---------- */
function tex(w,hh,draw,rx,ry){const c=document.createElement('canvas');c.width=w;c.height=hh;draw(c.getContext('2d'),w,hh);const tt=new THREE.CanvasTexture(c);tt.wrapS=tt.wrapT=THREE.RepeatWrapping;if(rx)tt.repeat.set(rx,ry||1);tt.anisotropy=4;return tt}
const checker=(g,w,hh,s)=>{for(let y=0;y<hh/s;y++)for(let xx=0;xx<w/s;xx++){g.fillStyle=(xx+y)%2?'#fff':'#111';g.fillRect(xx*s,y*s,s,s)}};
function tagSprite(name){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.fillStyle='#000a';g.beginPath();g.roundRect?g.roundRect(4,8,248,48,14):g.rect(4,8,248,48);g.fill();g.fillStyle='#fff';g.font='bold 30px sans-serif';g.textAlign='center';g.fillText(name,128,43);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));sp.scale.set(5,1.25,1);sp.renderOrder=9;return sp}

/* ---------- the race world: runs from setupLevel() in index.html ---------- */
R.setupWorld=function(){
 const T=THREE,cfg=S.cfg;ringInit();TL=S.TL;
 /* start: 400 m before the ring road point nearest to the chosen start city (cities and the Ring Road are the real map) */
 const C0=CITIES[(cfg.city||0)%CITIES.length],ni=nearIdx(C0.cx,C0.cz);let si=cfg.si!=null?cfg.si:((ni-200)%RT.n+RT.n)%RT.n;S.si=si;S.S0=RT.cum[si];
 S.cityS=CITIES.map(c=>RT.cum[nearIdx(c.cx,c.cz)]);S.lastCity=-1;
 const my=cfg.entries.find(e=>e.id==cfg.myId),lane=my&&my.lane!=null?my.lane:2;
 rposW(S.S0-6,lx(lane),Q);x=Q.x;z=Q.z;h=Math.atan2(Q.tx,Q.tz);gy=0;cityTick(x,z,1);
 for(const o of ai){const lp=CT.toL(x,z),p=posAI(o);if(Math.hypot(p.x-lp.x,p.z-lp.z)<60)o.p=(o.p+210)%(N*BS)}
 /* route: the ring from the start to the finish (drawn as the blue line + on the minimap, like every level) */
 rp=[];for(let q=-6;q<TL;q+=40){rposW(S.S0+q,0,Q);rp.push({x:Q.x,z:Q.z})}rposW(S.S0+TL,0,Q);rp.push({x:Q.x,z:Q.z});
 {const pos=[],ix=[],n=rp.length;for(let i=0;i<n;i++){const a=rp[i],b=rp[Math.min(n-1,i+1)],c=rp[Math.max(0,i-1)];let tx=b.x-c.x,tz=b.z-c.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;pos.push(a.x-tz*.55,.09,a.z+tx*.55,a.x+tz*.55,.09,a.z-tx*.55);if(i<n-1){const o=i*2;ix.push(o,o+2,o+1,o+1,o+2,o+3,o,o+1,o+2,o+1,o+3,o+2)}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ix);const m=new T.Mesh(g,new T.MeshBasicMaterial({color:0x2dd4ff,transparent:true,opacity:.8,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));m.frustumCulled=false;sc.add(m)}
 const e=rp[rp.length-1],fl=new T.Mesh(new T.CylinderGeometry(4,4,60,16,1,true),new T.MeshBasicMaterial({color:0xffd34d,transparent:true,opacity:.35,side:T.DoubleSide}));fl.position.set(e.x,30,e.z);sc.add(fl);BCN=fl;
 bay={x:1e6,z:1e6,dx:1,dz:0,lx:0,lz:1,dir:0};blk=[];
 buildProps();
};
function place(o,prog,lat,y){rpos(prog,lat,Q);o.position.set(Q.x,y||0,Q.z);o.rotation.y=Math.atan2(Q.tx,Q.tz);sc.add(o);return o}
function buildProps(){
 const T=THREE;
 const gantry=(prog,mat)=>{const g=new T.Group(),pm=new T.MeshLambertMaterial({color:0xb8bec6});for(const sx of[-1,1]){const p=new T.Mesh(new T.CylinderGeometry(.2,.2,9.5,10),pm);p.position.set(sx*(BW/2+2.8),4.75,0);g.add(p)}
  const bar=new T.Mesh(new T.CylinderGeometry(.14,.14,BW+5.6,8),pm);bar.rotation.z=Math.PI/2;bar.position.set(0,9.2,0);g.add(bar);const bn=new T.Mesh(new T.PlaneGeometry(BW+5.2,3.4),mat);bn.position.set(0,7.4,0);g.add(bn);place(g,prog,0)};
 gantry(S.TL,new T.MeshBasicMaterial({map:tex(512,64,(g,w,hh)=>checker(g,w,hh,32),1,1),side:T.DoubleSide}));
 gantry(0,new T.MeshBasicMaterial({map:tex(512,64,(g,w,hh)=>{g.fillStyle='#c4161c';g.fillRect(0,0,w,hh);g.fillStyle='#fff';g.font='bold 46px sans-serif';g.textAlign='center';g.fillText('START',w/2,50)},1,1),side:T.DoubleSide}));
 {const ln=(prog,mat)=>{const m=new T.Mesh(new T.PlaneGeometry(BW,3),mat);m.rotation.x=-Math.PI/2;const g=new T.Group();m.position.y=.11;g.add(m);place(g,prog,0)};
  ln(S.TL,new T.MeshBasicMaterial({map:tex(Math.round(BW*10),30,(g,w,hh)=>checker(g,w,hh,15),1,1),polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}));
  ln(0,new T.MeshBasicMaterial({color:0xffffff,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}))}
 /* distance boards before the finish */
 for(const rem of[5000,2000,1000,500,100]){if(rem>=S.TL)continue;const t2=tex(256,128,(g,w,hh)=>{g.fillStyle='#fff';g.fillRect(0,0,w,hh);g.fillStyle='#d11';g.fillRect(0,0,w,18);g.fillStyle='#111';g.textAlign='center';g.font='bold '+(rem>=1000?54:62)+'px sans-serif';g.fillText(rem>=1000?(rem/1000)+' km':rem+' m',w/2,92)},1,1),g=new T.Group();
  for(const sx of[-1,1]){const bd=new T.Mesh(new T.PlaneGeometry(3,1.5),new T.MeshBasicMaterial({map:t2,side:T.DoubleSide}));bd.position.set(sx*(BW/2+5.5),2.2,0);bd.rotation.y=sx>0?-Math.PI/2:Math.PI/2;g.add(bd);const pl=new T.Mesh(new T.CylinderGeometry(.08,.08,2.2,6),new T.MeshLambertMaterial({color:0x888888}));pl.position.set(sx*(BW/2+5.5),1.1,0);g.add(pl)}place(g,S.TL-rem,0)}
 /* nitro pickups along the road (same positions for everybody in a room) */
 _sd=(S.seed>>>0)||7;S.pk=[];const bodyG=new T.CylinderGeometry(.34,.34,1.1,14),capG=new T.CylinderGeometry(.18,.34,.25,14),ringG=new T.TorusGeometry(.95,.08,8,24),beamG=new T.CylinderGeometry(.55,.55,16,12,1,true);
 const bodyM=new T.MeshBasicMaterial({color:0x2dd4ff}),capM=new T.MeshBasicMaterial({color:0xffffff}),ringM=new T.MeshBasicMaterial({color:0x7df0ff}),beamM=new T.MeshBasicMaterial({color:0x2dd4ff,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false});
 let p=500+rnd()*300;while(p<S.TL-300){const lane=Math.floor(rnd()*6),g=new T.Group(),b=new T.Mesh(bodyG,bodyM);b.position.y=1.1;const cp=new T.Mesh(capG,capM);cp.position.y=1.8;const rg=new T.Mesh(ringG,ringM);rg.position.y=1.3;rg.rotation.x=Math.PI/2;const bm=new T.Mesh(beamG,beamM);bm.position.y=8;g.add(b,cp,rg,bm);
  rpos(p,lx(lane),Q);g.position.set(Q.x,0,Q.z);g.visible=false;sc.add(g);S.pk.push({prog:p,lane,got:0,g,ring:rg,x:Q.x,z:Q.z});p+=520+rnd()*620}
}

/* ---------- racers ---------- */
const FLAME_G=()=>{const T=THREE,g=new T.Group(),m1=new T.MeshBasicMaterial({color:0xff7a1a,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}),m2=new T.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false});
 for(const sx of[-1,1]){const c1=new T.Mesh(new T.ConeGeometry(.2,1.8,8),m1),c2=new T.Mesh(new T.ConeGeometry(.1,1.1,8),m2);for(const c of[c1,c2]){c.rotation.x=-Math.PI/2;c.position.set(sx*.4,.5,0)}c1.position.z=-.9;c2.position.z=-.55;g.add(c1,c2)}g.visible=false;return g};
function addFlames(mesh,l){const f=FLAME_G();f.position.z=-l/2-.1;mesh.add(f);return f}
function makeRacer(en){
 const me=en.id==S.cfg.myId,key=CARSHOP[en.car]?en.car:'oldcar',sk=en.sk||1,top=topOf(key),dm=dimsOf(CARS[key]);
 const c={id:en.id,name:en.name,car:key,ai:!!en.ai,me,remote:!en.ai&&!me,lane:en.lane,prog:-6,lat:lx(en.lane),v:0,dl:0,yaw:0,fin:null,out:0,dim:dm,top,
  vmax:top*sk/3.6,amax:(3.8+top/160)*sk,tprog:-6,tlat:lx(en.lane),tv:0,tdl:0,tyaw:0,latT:lx(en.lane),latV:0,cool:0,nit:0,nT:[],ph:Math.random()*6,wt:0,fl:0,hornT:0,pv:0,snd:null};
 if(c.ai){let tt=25+Math.random()*35;for(let k=0;k<12;k++){c.nT.push(tt);tt+=30+Math.random()*40}}
 if(me){c.mesh=car;c.flame=addFlames(car,dm.l)}
 else{const m=mkCar(CARS[key],1),hh=(PR[key]&&PR[key].userData.h)||1.5;c.mesh=m;c.tag=tagSprite(en.name);c.tag.position.set(0,hh+1.1,0);m.add(c.tag);c.flame=addFlames(m,dm.l);sc.add(m)}
 return c}
function spawnRacers(){for(const c of S.cars)if(c.mesh&&!c.me)sc.remove(c.mesh);S.cars=[];S.me=null;
 for(const en of S.cfg.entries){const c=makeRacer(en);S.cars.push(c);if(c.me)S.me=c}}
function placeCar(c,dt){if(c.me||!c.mesh||c.out)return;rpos(c.prog,c.lat,Q);c.mesh.position.set(Q.x,0,Q.z);c.mesh.rotation.y=Math.atan2(Q.tx,Q.tz)+c.yaw;
 if(c.mesh.wh)for(const w of c.mesh.wh){w.spin.rotation.x+=c.v*dt/w.r;if(w.front)w.steer.rotation.y=c.dl}
 if(c.flame){c.flame.visible=!!c.nit;if(c.nit){const s=.8+Math.random()*.5;c.flame.scale.set(1,1,s)}}
 const u=c.mesh.u;if(u){const f=c.fl||0,ph=Math.floor(S.tt/.35)%2,am=on=>on?0xffaa00:0x553300,lo=((f&1)||(f&4))&&ph,ro=((f&2)||(f&4))&&ph;u.fl.color.setHex(am(lo));u.rl.color.setHex(am(lo));u.fr.color.setHex(am(ro));u.rr.color.setHex(am(ro));u.br.color.setHex((f&32)?0xff2a20:((f&8)?0x990000:0x550000));u.hl.color.setHex((f&8)?0xfffbd0:0x777766)}}

/* ---------- AI drivers ---------- */
function aiStep(c,dt,T,live){
 if(c.out||c.fin!=null&&!live){return}
 c.wt+=dt;let boost=0;for(const t0 of c.nT){if(T>=t0&&T<t0+5){boost=1;break}}c.nit=boost;
 const vm=Math.min(c.vmax*(boost?1.1:1),c.top/3.6),acc=c.amax*(boost?1.5:1);
 if(c.fin!=null){c.v=Math.max(0,c.v-14*dt);c.prog+=c.v*dt;return}
 if(c.v<vm)c.v+=acc*(1-Math.pow(c.v/(vm*1.03),3))*dt;else c.v-=9*dt;
 c.cool-=dt;
 if(live&&c.cool<=0){let blk=null,bd=1e9;
  const look=(ahead,la,sp)=>{if(ahead>0&&ahead<34+c.v*.35&&Math.abs(la)<2.7&&ahead<bd){bd=ahead;blk={ahead,la,sp}}};
  for(const o of S.cars){if(o===c||o.out||o.fin!=null)continue;look(o.prog-c.prog,o.lat-c.lat,o.v)}
  if(CT){rpos(c.prog,c.lat,Q);for(const o of ai){if(o.dead)continue;const p=posAI(o),w=CT.toW(p.x,p.z),dx=w.x-Q.x,dz=w.z-Q.z;if(Math.abs(dx)+Math.abs(dz)>120)continue;look(dx*Q.tx+dz*Q.tz,-dx*Q.tz+dz*Q.tx,o.v)}}
  if(blk){const lim=6.9,dir=blk.la>=0?-1:1,t1=clamp(c.lat+dir*LW,-lim,lim),t2=clamp(c.lat-dir*LW,-lim,lim);c.latT=Math.abs(t1-c.lat)>.5?t1:t2;c.cool=1.1;if(blk.ahead<22)c.hornT=.45;if(blk.ahead<14&&blk.sp<c.v)c.v=Math.max(blk.sp,c.v-18*dt)}
  else if(Math.abs(c.latT-clamp(lx(c.lane),-6.9,6.9))>.1&&c.wt%5<dt)c.latT=clamp(lx(c.lane),-6.9,6.9)}
 const lv0=c.lat;const dd=clamp(c.latT-c.lat,-3.4*dt,3.4*dt);c.lat+=dd;c.latV=dd/Math.max(dt,1e-3);
 c.prog+=c.v*dt;c.yaw=-Math.atan(c.latV/Math.max(8,c.v))*.8;c.dl=clamp(-Math.atan(c.latV/Math.max(6,c.v))*2.2,-.45,.45);c.hornT=Math.max(0,c.hornT-dt);c.fl=(c.latV<-.5?1:0)|(c.latV>.5?2:0)|(Lv.night?8:0)|(c.hornT>0?16:0)|(c.v<c.pv-.02?32:0);c.pv=c.v;
 if(c.prog>=S.TL&&c.fin==null){c.fin=T-(c.prog-S.TL)/Math.max(8,c.v)}
}
function remoteStep(c,dt){c.tprog+=c.tv*dt;if(c.fin==null&&c.tprog>=S.TL)c.fin=S.raceT;c.prog+=(c.tprog-c.prog)*Math.min(1,dt*14);c.lat+=(c.tlat-c.lat)*Math.min(1,dt*14);c.v+=(c.tv-c.v)*Math.min(1,dt*8);c.dl+=(c.tdl-c.dl)*Math.min(1,dt*14);c.yaw+=(c.tyaw-c.yaw)*Math.min(1,dt*14)}

/* ---------- elimination ---------- */
function blast(px,pz,big){const T=THREE,m=new T.Mesh(new T.SphereGeometry(1,12,10),new T.MeshBasicMaterial({color:0xff7a1a,transparent:true,opacity:.9}));m.position.set(px,1.5,pz);sc.add(m);S.fx.push({m,t:0,big:big||7});try{tone(70,.9,'sawtooth',.2);nb(.5,900,.3,'lowpass',1)}catch(e){}}
function outCar(c,msg){if(c.out)return;c.out=1;
 if(c.me){S.myOutMsg=msg;if(!boomT)boom(msg);return}
 sndStop(c);if(c.mesh){const p=c.mesh.position;blast(p.x,p.z);c.mesh.visible=false}c.v=0;c.nit=0;if(c.flame)c.flame.visible=false;
 if(S.mode=='net'&&c.remote){const m={t:'out',id:c.id};meshSend(m);recFin(c.id,null,true)}}
R.crashAI=function(o,q){
 if(S.phase!='race'||!S.me||S.me.out||S.me.fin!=null){v*=.25;return}
 o.dead=1;if(o.g)o.g.visible=false;if(CT){const w=CT.toW(q.x,q.z);blast(w.x,w.z)}
 outCar(S.me,'You hit a city car and crashed. Eliminated!')};
function crashPair(a,b){outCar(b,'');outCar(a,'You crashed into '+esc(b.name)+'. Both of you are out of the race!')}


/* ---------- engine and horn sound of the other cars (3D positioned) ---------- */
function sndMake(c){if(!AC||c.snd)return;try{const o=AC.createOscillator(),o2=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain(),p=AC.createPanner(),g2=AC.createGain();o.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=700;f.Q.value=1.6;g.gain.value=0;g2.gain.value=.5;
 p.panningModel='equalpower';p.distanceModel='inverse';p.refDistance=9;p.maxDistance=600;p.rolloffFactor=1.4;o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);g.connect(p);p.connect(AC.destination);o.start();o2.start();c.snd={o,o2,f,g,p,h:null}}catch(e){}}
function sndPos(p,pos){if(p.positionX){p.positionX.value=pos.x;p.positionY.value=1;p.positionZ.value=pos.z}else p.setPosition(pos.x,1,pos.z)}
function sndUpdate(c){if(!AC||!c.mesh||c.out)return;const d=Math.hypot(c.mesh.position.x-cam.position.x,c.mesh.position.z-cam.position.z);
 if(d>450){if(c.snd){c.snd.g.gain.value=0;hornStop(c)}return}
 if(!c.snd)sndMake(c);const s=c.snd;if(!s)return;const sp=Math.abs(c.v)*3.6,base=42+sp*.62+(c.nit?18:0);
 s.o.frequency.value=base;s.o2.frequency.value=base*2.01;s.f.frequency.value=380+sp*6+(c.nit?500:0);s.g.gain.value=S.phase=='wait'?0:(S.phase=='count'?.06:.16+(c.nit?.1:0));sndPos(s.p,c.mesh.position);
 const on=!!((c.fl||0)&16);if(on&&!s.h)hornStart(c);else if(!on&&s.h)hornStop(c)}
function hornStart(c){const s=c.snd,t=AC.currentTime,lp=AC.createBiquadFilter(),g=AC.createGain();lp.type='lowpass';lp.frequency.value=3400;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.5,t+.035);lp.connect(g);g.connect(s.p);const os=[],b=(CARS[c.car]&&CARS[c.car].hn&&CARS[c.car].hn[0])||[420,520];
 if(typeof HORNBUF!='undefined'&&HORNBUF){const so=AC.createBufferSource();so.buffer=HORNBUF;so.loop=true;so.connect(lp);so.start();os.push(so)}else{const wt=(CARS[c.car]&&CARS[c.car].hn&&CARS[c.car].hn[1])||'square';for(const f of b){const o=AC.createOscillator(),q=AC.createGain();o.type=wt;o.frequency.value=f;q.gain.value=.14;o.connect(q);q.connect(lp);o.start();os.push(o)}}s.h={os,g}}
function hornStop(c){const h=c.snd&&c.snd.h;if(!h)return;h.os.forEach(o=>{try{o.stop()}catch(e){}});try{h.g.disconnect()}catch(e){}c.snd.h=null}
function sndStop(c){if(!c.snd)return;hornStop(c);for(const k of['o','o2'])try{c.snd[k].stop()}catch(e){}try{c.snd.g.disconnect();c.snd.p.disconnect()}catch(e){}c.snd=null}
function sndListener(){if(!AC||!AC.listener)return;const L=AC.listener,d=cam.getWorldDirection(new THREE.Vector3());if(L.positionX){L.positionX.value=cam.position.x;L.positionY.value=cam.position.y;L.positionZ.value=cam.position.z;L.forwardX.value=d.x;L.forwardY.value=d.y;L.forwardZ.value=d.z;L.upX.value=0;L.upY.value=1;L.upZ.value=0}}

/* ---------- nitro ---------- */
R.nitroCap=function(top){
 const now=performance.now(),dtn=Math.min(.05,(now-NI.t)/1000||0);NI.t=now;
 const me=S.me,want=S.active&&me&&!me.out&&S.phase=='race'&&(K.Shift||K.n)&&(K.ArrowUp||K.w)&&engOn&&G!='N'&&G!='R'&&NI.fuel>0;
 if(want){if(!NI.on){NI.on=1;try{nb(.6,1500,.1,'highpass',.8);tone(220,.5,'sawtooth',.05)}catch(e){}}NI.fuel=Math.max(0,NI.fuel-13*dtn);NI.cap=Math.max(NI.cap,Math.min(480,top+40+1.8*NI.fuel));NI.sfx-=dtn;if(NI.sfx<=0){NI.sfx=.14;try{nb(.16,1700,.05,'highpass',.7)}catch(e){}}}
 else{NI.on=0;if(NI.cap>top+1)NI.cap=Math.max(top,NI.cap-45*dtn)}
 return NI.cap>top+1?NI.cap:0};
R.nitroAcc=(kh0,cap)=>NI.on?15*(1-Math.pow(Math.min(1,kh0/cap),3)):0;

/* ---------- instruction text under the top banner ---------- */
R.ins=function(){const me=S.me;if(!me)return '';if(S.phase=='wait')return '⏳ Waiting for all players to be ready…';if(me.out)return '💥 Eliminated';if(S.phase=='count')return '🏁 Race starts in '+Math.ceil(S.cd)+' s · select gear 1';if(S.phase=='fin'||S.phase=='done')return '🏁 Finished!';
 const rem=Math.max(0,S.TL-me.prog);let nm='',bd=1e9;S.cityS.forEach((cs,k)=>{let d=((cs-(S.S0+me.prog))%RT.PL+RT.PL)%RT.PL;if(d>30&&d<bd){bd=d;nm=CITIES[k].name}});
 return '🏁 '+(rem>=1000?(rem/1000).toFixed(1)+' km':Math.round(rem)+' m')+' to the finish'+(nm?' · 🛣 next: '+nm+' '+(bd/1000).toFixed(1)+' km':'')};

/* ---------- begin a race (same set-up as start() for a driving level) ---------- */
R.begin=function(cfg){
 if(cfg.mode=='net'&&BAL<(cfg.fee||0)){alert('Not enough balance for the entry fee');R.exit();return}
 wReset();
 ensureAssets(()=>setTimeout(()=>{
  S.cfg=cfg;S.mode=cfg.mode;S.fee=cfg.fee||0;S.TL=TL=Math.max(10,cfg.len||10)*1000;S.seed=cfg.seed||Math.floor(Math.random()*1e9);S.sentOut=0;S.done=false;S.paid=false;S.fins={};S.firstFinAt=null;S.spec=false;S.hostDone=false;S.myOutMsg='';S.afterT=0;S.fx=[];S.cd=12;S.raceT=0;S.tt=0;S.phase='count';S.sendT=0;
  if(cfg.entries.some(e=>e.lane==null)){const ln=shuffle([0,1,2,3,4,5]);cfg.entries.forEach((e,i)=>{e.lane=ln[i]})}
  const mine=cfg.entries.find(e=>e.id==cfg.myId);S.myCar=mine.car;
  unWasted();lug=0;li=0;
  Lv={n:'Race',d:'',car:S.myCar,race:1,rail:1,sky:0x9fd3ff,fog:0xbfe0f5,sun:0,traffic:30,lim:999,hw:999,ci:0,night:false};
  initRenderer();GT=hourNow();Lv.night=dayF(GT)<.4;city();extras();setupLevel();timeInit();
  net=0;engOn=0;belt=0;beltT=0;hintT=0;v=0;dl=0;t=0;fines=0;log=[];cd={};cm=1;hRef=h;G='N';begun=0;boomT=0;bx=null;ovr=0;wipe=0;rainT=0;wasI=0;lb=0;pkT=0;trh=0;turning=0;sigL=sigR=hz=hl=0;sigClear=0;wrongT=overT=stopT=nightT=offT=0;lastPh=0;acc=0;thr=0;paused=0;run=1;
  ['fn','ins','sp','sg','cm','esc','mm','stt'].forEach(i=>$(i).hidden=false);hudMode(0);
  $('lv').textContent='Race · '+(S.TL/1000)+' km · '+CARS[Lv.car].n;hide();
  NI.fuel=30;NI.on=0;NI.cap=0;NI.t=performance.now();
  spawnRacers();LH=0;ringLoc(x,z,LC);S.sPrev=LC.s;S.me.prog=-6;
  if(S.mode=='net')setBal(BAL-S.fee);
  S.active=true;$('rfw').style.display='none';FW.on=false;$('rout').style.display='none';
  ['rpn','rnit','rlb'].forEach(i=>$(i).style.display='block');S.lbH='';S.lbT=0;S.lastRank=0;$('rvc').style.display=S.mode=='net'?'block':'none';$('rbig').style.display='grid';$('rbig').textContent='';vcUI();
  toast('Fasten the seatbelt (B), start the engine (I), lights (L) at night, select gear 1. Hold Shift / N for nitro',7);
  cam.position.set(x,4,z);aud();try{loadHorn()}catch(e){}S.cdN=99;S.waitT=0;if(S.mode=='net'){S.phase='wait';S.cd=12;if(NW.host)S.rdy.host=1;else if(NW.conn&&NW.conn.open)try{NW.conn.send({t:'rdy'})}catch(e){};if(S.pendGo){S.pendGo=false;S.phase='count'}}},40))};
function go(){S.phase='race';S.raceT=0;try{nb(.45,2600,.9,'lowpass',1);tone(160,.3,'sine',.4)}catch(e){}$('rbig').textContent='GO!';setTimeout(()=>{if(S.phase=='race')$('rbig').textContent=''},900)}

/* ---------- per-frame race logic (called from the main loop after step()) ---------- */
R.tick=function(dt){
 if(!S.active)return;const me=S.me;if(!me)return;S.dt=dt;S.tt+=dt;
 if(S.phase=='wait'){S.waitT+=dt;if(NW.host){S.pgT=(S.pgT||0)-dt;if(S.pgT<=0){S.pgT=.4;bcast({t:'png',ts:performance.now()})}hostGoCheck()}else if(S.waitT>30){S.phase='count';S.cd=12;S.cdN=99}}else if(S.phase=='count'){S.cd-=dt;const n=Math.ceil(S.cd);if(S.cd<=3&&n!=S.cdN&&n>0){S.cdN=n;$('rbig').textContent=n;try{tone(520,.18,'square',.14)}catch(e){}}if(S.cd<=0)go()}
 else if(S.phase=='race')S.raceT+=dt;
 const live=S.phase=='race';sndListener();
 /* my progress along the ring */
 if(!me.out){ringLoc(x,z,LC);me.prog+=wrapD(LC.s-S.sPrev,RT.PL);S.sPrev=LC.s;me.lat=LC.lat;me.v=v;me.dl=dl;me.yaw=wrapD(h-Math.atan2(LC.tx,LC.tz),Math.PI*2);me.nit=NI.on}
 /* others */
 for(const c of S.cars){if(c.me)continue;if(c.out){continue}
  if(c.ai){if(live||c.fin!=null)aiStep(c,dt,S.raceT,true)}else if(c.remote)remoteStep(c,dt);
  placeCar(c,dt);sndUpdate(c);
  if(c.fin==null&&c.prog>=S.TL&&c.remote===false&&c.ai){}}
 if(me.flame){me.flame.visible=!!me.nit&&!me.out;if(me.nit)me.flame.scale.set(1,1,.8+Math.random()*.5)}
 /* collisions with other racers: both are out */
 if(live&&!me.out&&me.fin==null){for(const o of S.cars){if(o.me||o.out||o.fin!=null||!o.mesh)continue;if(Math.abs(o.prog-me.prog)>9||Math.abs(o.lat-me.lat)>7)continue;
   const b={x:o.mesh.position.x,z:o.mesh.position.z,a:o.mesh.rotation.y,w:o.dim.w,l:o.dim.l};if(parkHit(b,x,z,h)){crashPair(me,o);break}}}
 /* nitro pickups */
 if(!me.out)for(const k of S.pk){const dp=k.prog-me.prog,vis=dp>-30&&dp<650&&!k.got;k.g.visible=vis;if(!vis)continue;k.ring.rotation.z+=dt*2.4;k.g.position.y=Math.sin(S.tt*2+k.prog)*.15;
  if(live&&Math.abs(dp)<5&&Math.hypot(x-k.x,z-k.z)<3){k.got=1;k.g.visible=false;NI.fuel=Math.min(100,NI.fuel+30);toast('🔥 Nitro +30  ('+Math.round(NI.fuel)+'%)',1.8);try{tone(900,.12,'triangle',.08);tone(1400,.15,'triangle',.06)}catch(e){}}}
 /* which city am I in (name on screen) */
 if(CT&&!me.out&&Math.hypot(x-CT.cx,z-CT.cz)<420&&S.lastCity!==CT.k){S.lastCity=CT.k;toast('🏙 '+CT.name,2)}
 /* finish line */
 if(me.fin==null&&!me.out&&me.prog>=S.TL&&live){me.fin=S.raceT-(me.prog-S.TL)/Math.max(8,v);S.phase='fin';S.afterT=0;try{tone(880,.25,'triangle',.14)}catch(e){}winnerBoom(me);onMeFin()}
 if(S.phase=='fin'&&S.mode=='ai'){S.afterT+=dt;if(S.afterT>3)finishAI()}
 /* AI-only: when I am out, let the rest race on until the results are asked for (see R.onEnd) */
 if(S.mode=='net'&&me.out&&!S.sentOut){S.sentOut=1;netFin(null,true)}
 if(S.mode=='net'){S.sendT+=dt;if(S.sendT>.033&&!me.out&&S.phase!='wait'){S.sendT=0;const fl=(sigL?1:0)|(sigR?2:0)|(hz?4:0)|(hl?8:0)|((typeof hn!='undefined'&&hn.length)?16:0)|(((K.ArrowDown||K.s)&&v>.3)?32:0);const m={t:'st',id:NW.myId,p:+me.prog.toFixed(2),l:+me.lat.toFixed(2),v:+me.v.toFixed(1),d:+me.dl.toFixed(3),y:+me.yaw.toFixed(3),n:NI.on?1:0,f:fl};netSend(m)}finCheck()}
 hudTick();
};
function netSend(m){meshSend(m)}
function rankOf(){const o=S.cars.slice().sort((a,b)=>{if(!!a.out!=!!b.out)return a.out?1:-1;if(a.fin!=null&&b.fin!=null)return a.fin-b.fin;if(a.fin!=null)return -1;if(b.fin!=null)return 1;return b.prog-a.prog});return o}
function hudTick(){const me=S.me,o=rankOf();
 {const nw=performance.now();if(nw-(S.lbT||0)>180){S.lbT=nw;const rk=o.indexOf(me)+1,html=o.map((c,i)=>'<div class="'+(c.me?'me':'')+(c.out?' out':'')+((c.me&&S.lastRank&&rk<S.lastRank)?' up':'')+'"><b>'+(i+1)+'</b>'+esc(c.name)+(c.fin!=null?' &#127937;':'')+'</div>').join('');if(html!==S.lbH){S.lbH=html;$('rlb').innerHTML=html}S.lastRank=rk}}
 $('rpos').textContent='P'+(o.indexOf(me)+1)+' / '+S.cars.length;
 $('rtm').textContent=fmtT(Math.max(0,S.phase=='fin'||S.phase=='done'?(me.fin??S.raceT):S.raceT));
 const rem=Math.max(0,S.TL-me.prog);$('rkm').textContent=(rem>=1000?(rem/1000).toFixed(1)+' km':Math.round(rem)+' m')+' to go';
 $('rnv').textContent=Math.round(NI.fuel)+'%';$('rnb').style.width=NI.fuel+'%';$('rnit').classList.toggle('on',!!NI.on);
 if(me.out)$('ins').textContent='💥 Eliminated · watching the race'}
/* effects each frame: wider view + speed lines with nitro, spectator camera */
R.fx=function(dt){
 if(S.active&&S.me){const kmh=Math.abs(v)*3.6,tf=68+clamp(kmh/400,0,1)*6+(NI.on?12:0);if(Math.abs(cam.fov-tf)>.05){cam.fov+=(tf-cam.fov)*Math.min(1,dt*4);cam.updateProjectionMatrix()}
  const lf=$('rfxl'),to=NI.on?.85:clamp((kmh-250)/400,0,.3);lf.style.opacity=(+lf.style.opacity||0)+(to-(+lf.style.opacity||0))*Math.min(1,dt*5);lf.style.display='block'}
 for(let i=S.fx.length-1;i>=0;i--){const f=S.fx[i];f.t+=dt;f.m.scale.setScalar(1+f.t*f.big);f.m.material.opacity=Math.max(0,.9-f.t*.75);if(f.t>1.3){sc.remove(f.m);S.fx.splice(i,1)}}};
R.specCam=function(dt){const al=S.cars.filter(c=>!c.out&&c.mesh);let tgt=null;for(const c of al){if(c.me)continue;if(!tgt||c.prog>tgt.prog)tgt=c}
 const p=tgt?tgt.mesh.position:{x,y:0,z},ry=tgt?tgt.mesh.rotation.y:h,f0=Math.sin(ry),f1=Math.cos(ry);
 cam.position.lerp(new THREE.Vector3(p.x-f0*11,5.5,p.z-f1*11),Math.min(1,dt*3));cam.up.set(0,1,0);cam.lookAt(p.x+f0*8,1.5,p.z+f1*8);
 const e=$('rout');if(e.style.display!='none'&&tgt){const w=$('rwt');if(w)w.textContent='Watching: '+tgt.name}};
R.dots=function(q,X,Y){if(!S.active){wDots(q,X,Y);return}q.lineWidth=1.5;q.strokeStyle='#000';
 if(S.me)for(const k of S.pk){if(k.got||Math.abs(k.prog-S.me.prog)>2000)continue;q.fillStyle='#2dd4ff';q.fillRect(X(k.x)-3,Y(k.z)-3,6,6)}
 for(const c of S.cars){if(c.me||c.out||!c.mesh)continue;const p=c.mesh.position;q.fillStyle=c.ai?'#ff9d2e':'#3dff7a';q.beginPath();q.arc(X(p.x),Y(p.z),5.5,0,7);q.fill();q.stroke()}};

/* ---------- finish / elimination / results ---------- */
const FW={on:false};
function winnerBoom(c){if(c&&c.me&&rankOf().indexOf(c)>0)return;FW.on=true;const cv=$('rfw');cv.style.display='block';cv.width=innerWidth;cv.height=innerHeight;const g=cv.getContext('2d');let P=[],T0=0;
 const burst=()=>{const bx0=innerWidth*(.15+Math.random()*.7),by0=innerHeight*(.12+Math.random()*.4),hu=Math.random()*360;for(let i=0;i<54;i++){const a=Math.random()*6.283,s=2+Math.random()*5;P.push({x:bx0,y:by0,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:70+Math.random()*30,h:hu})}};
 (function f(){if(!FW.on){g.clearRect(0,0,cv.width,cv.height);cv.style.display='none';return}requestAnimationFrame(f);g.clearRect(0,0,cv.width,cv.height);T0++;if(T0%24==1)burst();
  P=P.filter(p=>p.l>0);for(const p of P){p.x+=p.vx;p.y+=p.vy;p.vy+=.06;p.vx*=.99;p.l--;g.globalAlpha=Math.min(1,p.l/40);g.fillStyle='hsl('+p.h+',100%,60%)';g.beginPath();g.arc(p.x,p.y,2.6,0,6.283);g.fill()}g.globalAlpha=1})()}
function onMeFin(){const me=S.me;$('rout').style.display='block';$('rout').style.borderColor='#7dff9b';$('rout').style.background='#0a2414cc';
 $('rout').innerHTML='<h2 style="color:#7dff9b">🏁 Finished! '+fmtT(me.fin)+'</h2><p>'+(S.mode=='net'?'Waiting for the other racers…':'Results in a moment…')+'</p>';
 if(S.mode=='net')netFin(me.fin,false)}
function netFin(time,dnf){recFin(NW.myId,time,dnf);meshSend({t:'fin',id:NW.myId,time,dnf:dnf?1:0})}
/* called from end(): engine blast, crash explosion finished, balance 0 */
R.onEnd=function(ok,msg){const me=S.me;if(!S.active||!me||S.spec)return;me.out=1;S.spec=true;car.visible=false;if(me.flame)me.flame.visible=false;
 const m=S.myOutMsg||msg||'You are out of the race';const e=$('rout');e.style.display='block';e.style.borderColor='#ff5a4d';e.style.background='#240a0ecc';
 e.innerHTML='<h2>💥 Eliminated</h2><p>'+esc(m)+'</p><p id="rwt" style="color:#93a1ae"></p>'+(S.mode=='ai'?'<button class="btn" id="rsk" style="pointer-events:auto">⏩ Show results</button>':'<p>Waiting for the race to end…</p>')+'<button class="btn s" id="rlv" style="pointer-events:auto">Leave race</button>';
 const sk=$('rsk');if(sk)sk.onclick=finishAI;$('rlv').onclick=R.leave};
function aiForward(){let g=0,T=S.raceT;while(S.cars.some(c=>c.ai&&!c.out&&c.fin==null)&&g++<6000){T+=.1;for(const c of S.cars)if(c.ai&&!c.out&&c.fin==null)aiStep(c,.1,T,false)}}
function finishAI(){if(S.done)return;S.done=true;aiForward();const rs=S.cars.map(c=>({id:c.id,name:c.name,car:c.car,time:c.fin,me:c.me,dist:c.prog,out:!!c.out}));
 rs.sort((a,b)=>(a.time==null)-(b.time==null)||(a.time-b.time)||(a.out-b.out)||b.dist-a.dist);rs.forEach((r,i)=>r.rank=i+1);showResults(rs)}
function showResults(rows){for(const c of S.cars)sndStop(c);S.phase='done';run=0;FW.on=false;$('rout').style.display='none';['rpn','rnit','rlb','rvc','rbig','rfxl'].forEach(i=>$(i).style.display='none');
 const net=S.mode=='net',mine=rows.find(r=>r.me);
 if(net&&mine&&!S.paid){S.paid=true;if(mine.prize)setBal(BAL+mine.prize)}
 if(rows[0]&&rows[0].time!=null&&rows[0].me)winnerBoom(S.me);
 const sub=net?'Room race · '+(S.TL/1000)+' km · entry '+inr(S.fee)+' · '+rows.length+' players':'Race with AI · '+(S.TL/1000)+' km · '+rows.length+' players';
 BACKF=null;
 ov(`<div class="box" style="text-align:center"><div class="chk"></div><h1 style="margin:10px 0 4px">${rows[0].me&&rows[0].time!=null?'🏆 You won!':'🏁 Race finished'}</h1><p style="margin:0 0 8px;color:#93a1ae">${sub}</p>`+
 rows.map((r,i)=>`<div class="rrow${r.me?' me':''}"><b class="pos">${['🥇','🥈','🥉'][i]||'#'+r.rank}</b><span style="text-align:left"><strong>${esc(r.name)}</strong><small>${esc(cname(r.car))}</small></span><span style="text-align:right;flex:0 0 auto"><b style="font-family:monospace;color:#ffd34d">${r.time==null?(r.out?'OUT 💥':'DNF'):fmtT(r.time)}</b>${net?`<small style="color:${r.prize?'#7dff9b':'#889'}">${r.prize?'+'+inr(r.prize):'₹0'}</small>`:''}</span></div>`).join('')+
 `<p>Fines this race: <b style="color:#ff7a6e">${inr(fines)}</b> · 💰 Balance: <b style="color:#7dff9b">${inr(BAL)}</b></p>`+
 `<div class="chk" style="margin-top:8px"></div><button class="btn" id="rag">${net?'Back to menu':'🔁 Race again'}</button>${net?'':'<button class="btn s" id="rmn">Back to menu</button>'}</div>`);
 const ag=$('rag');ag.onclick=()=>{FW.on=false;if(net)R.exit();else R.begin(S.cfg)};const mn=$('rmn');if(mn)mn.onclick=()=>R.exit()}
const net0=()=>typeof window.__net=='number'?window.__net:netVal();
function netVal(){try{return net}catch(e){return 0}}
R.leave=function(){if(S.mode=='net'&&S.phase!='done'){netFin(null,true)}R.exit()};
R.exit=function(){for(const c of S.cars)sndStop(c);S.active=false;S.phase='';FW.on=false;run=0;try{eg.gain.value=0}catch(e){}['rpn','rnit','rlb','rvc','rbig','rfxl','rout','rfw'].forEach(i=>$(i).style.display='none');cam.fov=68;cam.updateProjectionMatrix();vcStop();netReset();menu('race')};

/* ---------- menus ---------- */
R.homeHTML=()=>`<p>Race on the real 6-lane Ring Road, through the real cities. Pick how you want to race:</p><button class="lv" id="rai"><b>🤖</b><span><strong>With AI</strong><small>2 to 6 racers · free entry · same map, cockpit and rules</small></span></button><button class="lv" id="rfr"><b>👥</b><span><strong>With Friends</strong><small>Create or join a room · entry fee · voice chat · winners take the pool</small></span></button>`;
R.bindHome=()=>{$('rai').onclick=R.aiSetup;$('rfr').onclick=R.friends};
const scr=(html,back)=>{BACKF=back||null;ov(html)};
const carOpts=sel=>OWNC.filter(k=>CARSHOP[k]).map(k=>`<option value="${k}"${k==sel?' selected':''}>${esc(cname(k))} · ${topOf(k)} km/h</option>`).join('');
const cityOpts=()=>CITYN.map((n,i)=>`<option value="${i}">${n}</option>`).join('');
const lenSel=`<label class="rlb">Race length</label><select class="rin" id="rlen">${LENS.map(k=>`<option value="${k}">${k} km</option>`).join('')}</select><label class="rlb">Start from city</label><select class="rin" id="rcity">${cityOpts()}</select>`;
function bindCar(id){const s=$(id);const show=()=>{try{pvShow(mkCar(MODELS[s.value],false))}catch(e){}};s.onchange=show;$('pvh').appendChild(pvInit().c);show()}
const nameVal=()=>{const vv=($('rnm').value||'').trim().slice(0,14)||nameGet()||'Player';STO.s('rr3name',vv);return vv};
R.aiSetup=function(){ensureAssets(()=>{
 scr(`<div class="box"><h2>🤖 Race with AI <small style="color:#7dff9b;float:right">free entry</small></h2><label class="rlb">Username</label><input class="rin" id="rnm" maxlength="14" placeholder="Your username" value="${esc(nameGet())}"><label class="rlb">Your car (owned)</label><div id="pvh"></div><select class="rin" id="rcar">${carOpts(SELC)}</select><label class="rlb">Players (you + AI)</label><select class="rin" id="rnp">${[2,3,4,5,6].map(n=>`<option${n==4?' selected':''}>${n}</option>`).join('')}</select>${lenSel}<p><small>Same world, cockpit and rules as driving school: seatbelt, engine and lights are needed, fines are charged. Crash into any car (city car or racer) and both are out. Pick up blue nitro cans, hold <b>Shift</b> or <b>N</b> to burn them. You can drive anywhere, the Ring Road is just the race route.</small></p><button class="btn" id="rgo">🏁 Start race</button></div>`,()=>menu('race'));
 bindCar('rcar');
 $('rgo').onclick=()=>{aud();const name=nameVal(),car=$('rcar').value,n=+$('rnp').value;const order=Object.keys(CARSHOP).sort((a,b)=>topOf(a)-topOf(b)),mi=order.indexOf(car);
  const AIN=shuffle(['Rohan','Aman','Vikram','Neha','Kabir','Ishaan','Zoya','Arjun','Dev','Meera','Karan','Sara']);
  const near=order.filter(k=>k!=car&&topOf(k)>=topOf(car)-30&&topOf(k)<=topOf(car)+110),rest=order.filter(k=>k!=car&&!near.includes(k)).sort((a,b)=>Math.abs(topOf(a)-topOf(car))-Math.abs(topOf(b)-topOf(car))),pool=shuffle(near).concat(rest);
  const ents=[{id:'me',name,car}];for(let i=0;i<n-1;i++){const ac=pool[i%pool.length]||car;ents.push({id:'ai'+i,name:AIN[i],car:ac,ai:1,sk:.86+Math.random()*.11})}
  R.begin({mode:'ai',entries:ents,myId:'me',len:+$('rlen').value,city:+$('rcity').value})}})};

/* ---------- friends: network ---------- */
const NW={mesh:{},peer:null,conns:{},players:[],host:false,fee:0,pw:'',id:'',conn:null,myId:'',seq:0,chat:[],len:10,city:0,locked:false};
R.N=NW;
function netReset(){try{Object.values(NW.mesh||{}).forEach(c=>{try{c.close()}catch(e){}})}catch(e){}NW.mesh={};try{if(NW.peer)NW.peer.destroy()}catch(e){}clearInterval(NW.oti);NW.open=false;NW.cd=0;NW.cdOn=0;NW.peer=null;NW.conns={};NW.players=[];NW.conn=null;NW.host=false;NW.myId='';NW.seq=0;NW.chat=[];NW.locked=false}
const needPeer=(ok,bad)=>{if(window.Peer)return ok();loadScript('lib/peerjs.min.js',ok,()=>loadScript('https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',ok,bad))};
const uniq=n=>{let b=n,k=2;while(NW.players.some(p=>p.name==n))n=b+' '+k++;return n};
const say=hh=>{const e=$('rmsg');if(e)e.innerHTML=hh};
const myPid=()=>NW.host?(NW.peer&&NW.open?NW.peer.id:'rr3race-'+NW.id):(NW.peer&&NW.peer.id)||'';
const VP=()=>NW.peer||WD.peer,VPL=()=>NW.peer?NW.players:wNear(),VME=()=>NW.peer?myPid():((WD.peer&&WD.peer.id)||'');
R.friends=function(){scr(`<div class="box"><h2>👥 Race with Friends</h2><button class="lv" id="rcr"><b>➕</b><span><strong>Create room</strong><small>You are the admin. Choose the entry fee</small></span></button><button class="lv" id="rjn"><b>🔑</b><span><strong>Join room</strong><small>Scan the QR or enter the room ID</small></span></button><button class="lv" id="rop"><b>🌍</b><span><strong>Open races</strong><small>Join anyone, no ID or password · entry ₹500 · starts automatically</small></span></button><p><small>Prize pool = all entry fees. Players who crash get nothing. Everyone can talk with voice chat. Your balance: <b>${inr(BAL)}</b></small></p>${BAL<500?'<p style="color:#ff8a7e"><b>Balance below ₹500: you cannot create or join paid races.</b></p>':''}</div>`,()=>menu('race'));$('rcr').onclick=createScreen;$('rjn').onclick=()=>joinScreen();$('rop').onclick=R.openRaces;if(BAL<500)['rcr','rjn','rop'].forEach(i=>{const b=$(i);b.disabled=true;b.style.opacity='.4'})};
function createScreen(){ensureAssets(()=>{
 const fees=[];for(let f=500;f<=5000;f+=500)fees.push(f);const ok=BAL>=500;
 scr(`<div class="box"><h2>➕ Create room</h2><label class="rlb">Username</label><input class="rin" id="rnm" maxlength="14" placeholder="Your username" value="${esc(nameGet())}"><label class="rlb">Your car (owned)</label><div id="pvh"></div><select class="rin" id="rcar">${carOpts(SELC)}</select><label class="rlb">Entry fee per player (balance ${inr(BAL)})</label><select class="rin" id="rfee">${fees.map(f=>`<option value="${f}"${f>BAL?' disabled':''}>${inr(f)}${f>BAL?' (not enough balance)':''}</option>`).join('')}</select>${lenSel}<p id="rmsg" style="color:#ffd34d">${ok?'':'⚠ You need at least ₹500 balance.'}</p><button class="btn" id="rmk" ${ok?'':'disabled'}>Create room</button></div>`,()=>R.friends());
 bindCar('rcar');
 $('rmk').onclick=()=>{aud();const name=nameVal(),car=$('rcar').value,fee=+$('rfee').value;const ln=+$('rlen').value,ct=+$('rcity').value;if(BAL<fee){say('Not enough balance');return}say('Creating room…');createRoom(name,car,fee,ln,ct)}})}
function createRoom(name,car,fee,ln,ct){
 if(BAL<500||BAL<fee){say('Not enough balance');return}
 netReset();NW.len=ln;NW.city=ct;NW.host=true;NW.fee=fee;NW.pw=String(1000+Math.floor(Math.random()*9000));NW.myId='host';
 needPeer(()=>{const go=()=>{NW.id=rid();const p=new Peer('rr3race-'+NW.id);NW.peer=p;p.on('open',()=>{NW.players=[{id:'host',name,car,host:1,pid:'rr3race-'+NW.id}];vcHook();lobby()});p.on('connection',hostConn);p.on('disconnected',()=>{try{p.reconnect()}catch(e){}});
  p.on('error',e=>{if(e.type=='unavailable-id'){try{p.destroy()}catch(x){}go()}else say('⚠ Connection problem: '+e.type+'. Both devices need internet.')})};go()},()=>say('⚠ Could not load the connection library'))}
const listMsg=()=>({t:'list',fee:NW.fee,players:NW.players});

/* ---------- race mesh: every player talks directly to every other player, so nobody depends on the room creator ---------- */
function meshSend(m){for(const c of Object.values(NW.mesh||{}))if(c&&c.open)try{c.send(m)}catch(e){}}
function meshData(from,d){if(!from||!d||typeof d!='object')return;
 if(d.t=='st'){const o=S.cars.find(x=>x.id==from);if(o&&!o.me&&!o.out){o.tprog=+d.p||0;o.tlat=+d.l||0;o.tv=+d.v||0;o.tdl=+d.d||0;o.tyaw=+d.y||0;o.nit=d.n?1:0;o.fl=d.f|0}}
 else if(d.t=='out'){if(S.fins[d.id]===undefined){applyOut(d.id);recFin(d.id,null,true)}}
 else if(d.t=='fin')recFin(from,d.time==null?null:+d.time,!!d.dnf)}
function meshGone(id,c){if(NW.mesh&&NW.mesh[id]===c)delete NW.mesh[id];if(S.active&&S.mode=='net'&&!S.done&&S.fins[id]===undefined){applyOut(id);recFin(id,null,true)}}
function meshIn(c){c.on('data',d=>{if(!d||typeof d!='object')return;if(d.t=='mesh'){c.mid=String(d.id);NW.mesh[c.mid]=c;return}if(c.mid)meshData(c.mid,d)});c.on('close',()=>{if(c.mid)meshGone(c.mid,c)})}
function meshOut(pl,tries){const p=NW.peer;if(!p||!pl.pid)return;tries=tries||0;let ok=false;const c=p.connect(pl.pid,{reliable:true});
 c.on('open',()=>{ok=true;c.mid=pl.id;NW.mesh[pl.id]=c;try{c.send({t:'mesh',id:NW.myId})}catch(e){}});
 c.on('data',d=>meshData(pl.id,d));c.on('close',()=>meshGone(pl.id,c));
 setTimeout(()=>{if(!ok&&tries<4&&NW.peer===p&&!S.done){try{c.close()}catch(e){}meshOut(pl,tries+1)}},5000)}
function meshUp(entries){NW.mesh={};if(!NW.peer)return;const ids=entries.map(e=>e.id),mi=ids.indexOf(NW.myId);
 entries.forEach((e,i)=>{if(i>mi){const pl=NW.players.find(p=>p.id==e.id);if(pl&&pl.pid)meshOut(pl)}})}
function bcast(m){Object.values(NW.conns).forEach(c=>{try{c.send(m)}catch(e){}})}
function hostConn(c){let joined=false;
 c.on('data',d=>{if(!d||typeof d!='object')return;
  if(d.t=='join'&&!joined){const no=m=>{try{c.send({t:'no',m})}catch(e){}setTimeout(()=>c.close(),400)};
   if(!NW.open&&d.pw!==NW.pw)return no('Wrong password');if(S.active||NW.locked)return no('The race has already started');if(NW.players.length>=6)return no('Room is full (6 players)');
   if((+d.bal||0)<NW.fee)return no('Not eligible: you need at least '+inr(NW.fee)+' balance');
   const id='p'+(++NW.seq);c.pid=id;NW.conns[id]=c;joined=true;NW.players.push({id,name:uniq(String(d.name||'Player').slice(0,14)),car:CARSHOP[d.car]?d.car:'oldcar',pid:String(d.pid||'')});c.send({t:'ok',id,fee:NW.fee});bcast(listMsg());updLobby();vcSync()}
  else if(d.t=='info'&&NW.open){try{c.send({t:'oinfo',name:NW.oname,state:NW.locked?'racing':'waiting',n:NW.players.length,cd:NW.cd||0,len:NW.len,city:CITYN[NW.city],fee:NW.fee})}catch(e){}}
  else if(!joined)return;
  else if(d.t=='st'){const o=S.cars.find(x=>x.id==c.pid);if(o&&!o.out){o.tprog=+d.p||0;o.tlat=+d.l||0;o.tv=+d.v||0;o.tdl=+d.d||0;o.tyaw=+d.y||0;o.nit=d.n?1:0;o.fl=d.f|0}Object.entries(NW.conns).forEach(([k,o2])=>{if(k!=c.pid)try{o2.send({t:'st',id:c.pid,p:d.p,l:d.l,v:d.v,d:d.d,y:d.y,n:d.n,f:d.f})}catch(e){}})}
  else if(d.t=='rdy'){S.rdy[c.pid]=1}
  else if(d.t=='pog'){const r=performance.now()-(+d.ts||0);if(r>=0&&r<5000)c.rtt=c.rtt==null?r:Math.min(c.rtt,r)}
  else if(d.t=='out'){}
  else if(d.t=='chat'){const m={t:'chat',name:(NW.players.find(p=>p.id==c.pid)||{}).name||'?',text:String(d.text||'').slice(0,120)};chatAdd(m.name,m.text);bcast(m)}
  else if(d.t=='fin'){}});
 c.on('close',()=>{if(!c.pid)return;const id=c.pid;delete NW.conns[id];if(S.active&&!S.done){if(S.fins[id]===undefined)applyOut(id);recFin(id,null,true)}else{NW.players=NW.players.filter(p=>p.id!=id);bcast(listMsg());updLobby()}})}
function applyOut(id){const o=S.cars.find(x=>x.id==id);if(!o)return;if(o.me)outCar(o,'You were hit by another racer. Both of you are out of the race!');else outCar(o,'')}
function recFin(id,time,dnf){if(S.fins[id]!==undefined)return;S.fins[id]=dnf?null:time;if(S.firstFinAt==null&&time!=null)S.firstFinAt=performance.now();finCheck()}
function hostFin(a,b,c){recFin(a,b,c)}
function finCheck(){if(S.mode!='net'||S.hostDone||!S.active||!S.cfg||!S.cfg.entries)return;const ps=S.cfg.entries,all=ps.every(p=>S.fins[p.id]!==undefined),to=S.firstFinAt!=null&&performance.now()-S.firstFinAt>150000;if(!(all||to))return;
 S.hostDone=true;S.done=true;const n=ps.length,rows=ps.map(p=>{const c=S.cars.find(x=>x.id==p.id);const tt=S.fins[p.id];return{id:p.id,name:p.name,car:p.car,time:tt==null?null:tt,dist:c?c.prog:0,out:!!(c&&c.out)}});
 rows.sort((a,b)=>(a.time==null)-(b.time==null)||(a.time-b.time)||(a.out-b.out)||b.dist-a.dist);const m=rows.filter(r=>r.time!=null).length,pz=m?prizes(m,S.fee*n):[];
 rows.forEach((r,i)=>{r.rank=i+1;r.prize=m?(r.time==null?0:pz[i]):S.fee});showResults(rows.map(r=>({...r,me:r.id==NW.myId})))}
function hostGoCheck(){if(S.phase!='wait')return;if(S.cfg.entries.every(e=>S.rdy[e.id])||S.waitT>25){S.phase='count';S.cd=12;S.cdN=99;Object.values(NW.conns).forEach(c=>{const L=c.rtt!=null?Math.min(1.5,c.rtt/2000):0;try{c.send({t:'go',cd:12-L})}catch(e){}})}}
function startRace(){if(BAL<NW.fee){NW.cdOn=0;NW.cd=0;try{bcast({t:'ocd',cd:0})}catch(e){}say('Not enough balance for the entry fee');return}NW.locked=true;S.rdy={};S.pendGo=false;const lanes=shuffle([0,1,2,3,4,5]),seed=Math.floor(Math.random()*1e9);const entries=NW.players.map((p,i)=>({id:p.id,name:p.name,car:p.car,lane:lanes[i]}));S.firstFinAt=null;bcast({t:'start',fee:NW.fee,len:NW.len,city:NW.city,seed,entries});meshUp(entries);R.begin({mode:'net',entries,myId:'host',fee:NW.fee,len:NW.len,city:NW.city,seed})}
const plistHTML=()=>NW.players.map(p=>`<div class="rrow${p.id==NW.myId?' me':''}"><b class="pos">${p.host?'👑':'🏎'}</b><span><strong>${esc(p.name)}</strong><small>${esc(cname(p.car))} · ${topOf(p.car)} km/h${p.host?' · admin':''}</small></span>${NW.host&&!NW.open&&!p.host?`<button class="btn s" data-k="${p.id}">Remove</button>`:''}</div>`).join('');
function updLobby(){const l=$('plist');if(!l)return;l.innerHTML=plistHTML();const cnt=$('pcnt');if(cnt)cnt.textContent=NW.players.length+'/6';const s=$('rst');if(s)s.disabled=NW.players.length<2;
 l.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const id=b.dataset.k,c=NW.conns[id];NW.players=NW.players.filter(p=>p.id!=id);if(c){try{c.send({t:'kick'})}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},300);delete NW.conns[id]}bcast(listMsg());updLobby()})}
const roomURL=()=>location.href.split('#')[0]+'#race:'+NW.id+':'+NW.pw;
function drawQR(){const box=$('rqr');if(!box)return;const d=()=>{try{const q=qrcode(0,'M');q.addData(roomURL());q.make();box.innerHTML=q.createSvgTag({cellSize:4,margin:2,scalable:true});const sv=box.querySelector('svg');if(sv){sv.style.width='100%';sv.style.height='100%'}}catch(e){box.textContent='QR error'}};if(window.qrcode)d();else loadScript('lib/qrcode.js',d,()=>{box.textContent='QR lib missing'})}
const chatBox=`<h3>💬 Chat &amp; voice</h3><button class="btn s" id="rmic" style="margin:0 0 6px">🎤 Turn on mic</button><span id="rvs" style="color:#93a1ae;font-size:13px"></span><div id="rchat"></div><div style="display:flex;gap:6px"><input class="rin" id="rct" maxlength="120" placeholder="Type a message" style="margin:6px 0"><button class="btn" id="rcs" style="margin:6px 0">Send</button></div>`;
function chatAdd(name,text){NW.chat.push([name,text]);if(NW.chat.length>60)NW.chat.shift();const b=$('rchat');if(b){b.innerHTML=NW.chat.map(m=>`<p><b>${esc(m[0])}:</b> ${esc(m[1])}</p>`).join('');b.scrollTop=1e9}if(S.active&&S.phase!='done')toast('💬 '+name+': '+text,3)}
function bindChat(){const b=$('rchat');if(b){chatAdd0()}$('rmic').onclick=()=>{micToggle()};const send=()=>{const i=$('rct'),tx=i.value.trim();if(!tx)return;i.value='';const me=(NW.players.find(p=>p.id==NW.myId)||{}).name||'Me';if(NW.host){chatAdd(me,tx);bcast({t:'chat',name:me,text:tx})}else if(NW.conn&&NW.conn.open){NW.conn.send({t:'chat',text:tx});chatAdd(me,tx)}};$('rcs').onclick=send;$('rct').onkeydown=e=>{e.stopPropagation();if(e.key=='Enter')send()};vcUI()}
function chatAdd0(){const b=$('rchat');b.innerHTML=NW.chat.map(m=>`<p><b>${esc(m[0])}:</b> ${esc(m[1])}</p>`).join('');b.scrollTop=1e9}
function lobby(){
 scr(`<div class="box"><h2>👑 Your room <small style="float:right;color:#ffd34d">Entry ${inr(NW.fee)} · ${NW.len} km · ${CITYN[NW.city]}</small></h2><div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center"><div id="rqr" style="background:#fff;border-radius:10px;padding:6px;width:150px;height:150px"></div><div style="flex:1;min-width:200px"><div style="background:#0f171f;border-radius:12px;padding:8px 12px;margin-bottom:8px"><small>ROOM ID</small><div style="font:700 30px 'Courier New',monospace;letter-spacing:.1em;color:#ffd34d">${NW.id}</div></div><div style="background:#0f171f;border-radius:12px;padding:8px 12px"><small>PASSWORD</small><div style="font:700 30px 'Courier New',monospace;letter-spacing:.15em;color:#2dd4ff">${NW.pw}</div></div></div></div><h3>Players <span id="pcnt"></span></h3><div id="plist"></div>${chatBox}<p id="rmsg" style="color:#93a1ae"><small>Friends join with the QR or ROOM ID + PASSWORD. Start with 2 or more players.</small></p><button class="btn" id="rst" disabled>▶ Start game</button></div>`,()=>{vcStop();netReset();R.friends()});
 drawQR();updLobby();bindChat();$('rst').onclick=()=>{aud();if(NW.players.length>=2)startRace()}}
function joinScreen(pre){ensureAssets(()=>{
 const ok=BAL>=500;
 scr(`<div class="box"><h2>🔑 Join room</h2><button class="btn s" id="rsq" style="width:100%;margin:0 0 8px">📷 Scan QR</button><label class="rlb">Room ID</label><input class="rin" id="rid" maxlength="6" autocapitalize="characters" placeholder="ROOM ID" value="${esc(pre?pre.id:'')}"><label class="rlb">Password</label><input class="rin" id="rpw" maxlength="4" inputmode="numeric" placeholder="4 digits" value="${esc(pre?pre.pw:'')}"><label class="rlb">Username</label><input class="rin" id="rnm" maxlength="14" placeholder="Your username" value="${esc(nameGet())}"><label class="rlb">Your car (owned)</label><div id="pvh"></div><select class="rin" id="rcar">${carOpts(SELC)}</select><p id="rmsg" style="color:#ffd34d">${ok?'':'⚠ You need at least ₹500 balance.'}</p><button class="btn" id="rjg" ${ok?'':'disabled'}>Join room</button></div>`,()=>R.friends());
 bindCar('rcar');
 $('rsq').onclick=()=>scanQR(tx=>{const m=/race:([A-Za-z0-9]{6}):(\d{4})/.exec(tx);if(m){$('rid').value=m[1].toUpperCase();$('rpw').value=m[2];say('QR scanned ✔ now press Join')}else say('That QR is not a race room')});
 $('rjg').onclick=()=>{aud();const id=$('rid').value.trim().toUpperCase(),pw=$('rpw').value.trim();if(id.length!=6){say('Room ID is 6 characters');return}if(!/^\d{4}$/.test(pw)){say('Password is 4 digits');return}say('Connecting…');joinRoom(id,pw,nameVal(),$('rcar').value)}})}
function scanQR(cb){const box=$('rscan'),vd=$('rsv');let stream=null,live=true;
 const stop=()=>{live=false;box.style.display='none';try{stream&&stream.getTracks().forEach(tk=>tk.stop())}catch(e){}};$('rsc').onclick=stop;box.style.display='flex';$('rsm').textContent='Point the camera at the room QR code';
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){$('rsm').textContent='Camera not available here. Enter the room ID manually.';return}
 navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>{stream=s;vd.srcObject=s;vd.play();const det=window.BarcodeDetector?new BarcodeDetector({formats:['qr_code']}):null,cv=document.createElement('canvas'),g=cv.getContext('2d',{willReadFrequently:true});
  const useJ=()=>window.jsQR?Promise.resolve():new Promise(r=>loadScript('lib/jsQR.js',r,r));
  const tick=async()=>{if(!live)return;try{if(vd.videoWidth){let txt=null;if(det){const r=await det.detect(vd);if(r[0])txt=r[0].rawValue}else{await useJ();cv.width=vd.videoWidth;cv.height=vd.videoHeight;g.drawImage(vd,0,0);const im=g.getImageData(0,0,cv.width,cv.height),q=window.jsQR&&jsQR(im.data,im.width,im.height);if(q)txt=q.data}
   if(txt){stop();cb(txt);return}}}catch(e){}setTimeout(tick,200)};tick()}).catch(()=>{$('rsm').textContent='Camera permission denied. Enter the room ID manually.'})}
function joinRoom(id,pw,name,car){
 netReset();needPeer(()=>{const p=new Peer();NW.peer=p;p.on('connection',meshIn);let fin=false;
  const bad=m=>{if(fin)return;fin=true;say('⚠ '+m);try{p.destroy()}catch(e){}NW.peer=null;NW.conn=null};
  p.on('open',()=>{vcHook();const c=p.connect(String(id).indexOf('rr3open-')==0?id:'rr3race-'+id,{reliable:true});NW.conn=c;const to=setTimeout(()=>{if(!c.open)bad('Room not found. Check the room ID.')},12000);
   c.on('open',()=>{clearTimeout(to);c.send({t:'join',name,car,bal:BAL,pw,pid:p.id})});
   c.on('data',d=>clientData(d,bad));
   c.on('close',()=>{if(S.active&&S.mode=='net'){if(!S.done&&S.fins['host']===undefined){applyOut('host');recFin('host',null,true)}}else if(!S.active&&NW.conn===c&&$('plist')){NW.conn=null;scr(`<div class="box"><h2>Disconnected</h2><p>The room was closed.</p><button class="btn" id="rbk">OK</button></div>`);$('rbk').onclick=()=>R.friends()}})});
  p.on('error',e=>{if(e.type=='peer-unavailable')bad('Room not found. Check the room ID.');else bad('Connection problem: '+e.type)})},()=>say('⚠ Could not load the connection library'))}
function clientData(d,bad){if(!d||typeof d!='object')return;
 if(d.t=='no')bad(d.m||'Cannot join');
 else if(d.t=='ok'){NW.myId=d.id;NW.fee=d.fee;scr(`<div class="box"><h2>🏎 Room joined <small style="float:right;color:#ffd34d">Entry ${inr(NW.fee)}</small></h2><h3>Players <span id="pcnt"></span></h3><div id="plist"></div>${chatBox}<p id="ocd" style="color:#ffd34d;font-weight:700"></p><p style="color:#93a1ae">⏳ Waiting for the race to start…</p><button class="btn s" id="rlv2">Leave room</button></div>`,leaveRoom);$('rlv2').onclick=leaveRoom;updLobby();updCd();bindChat();if(NW.open)setTimeout(()=>{if(!VC.stream)micOn()},400)}
 else if(d.t=='list'){NW.players=d.players||[];NW.fee=d.fee;updLobby();updCd();vcSync()}
 else if(d.t=='kick'){const c=NW.conn;NW.conn=null;try{c&&c.close()}catch(e){}vcStop();netReset();scr(`<div class="box"><h2>Removed</h2><p>The admin removed you from the room.</p><button class="btn" id="rbk">OK</button></div>`);$('rbk').onclick=()=>R.friends()}
 else if(d.t=='start'){if(BAL<d.fee){alert('Not enough balance for the entry fee ('+inr(d.fee)+')');leaveRoom();return}S.firstFinAt=null;meshUp(d.entries);R.begin({mode:'net',entries:d.entries,myId:NW.myId,fee:d.fee,len:d.len,city:d.city,seed:d.seed})}
 else if(d.t=='st'){const o=S.cars.find(x=>x.id==d.id);if(o&&!o.me&&!o.out){o.tprog=+d.p||0;o.tlat=+d.l||0;o.tv=+d.v||0;o.tdl=+d.d||0;o.tyaw=+d.y||0;o.nit=d.n?1:0;o.fl=d.f|0}}
 else if(d.t=='out')applyOut(d.id);
 else if(d.t=='png'){try{NW.conn.send({t:'pog',ts:d.ts})}catch(e){}}
 else if(d.t=='go'){if(S.active&&S.phase=='wait'){S.phase='count';S.cd=d.cd>0?d.cd:12;S.cdN=99}else S.pendGo=true}
 else if(d.t=='ocd'){NW.cd=d.cd;updCd()}
 else if(d.t=='chat')chatAdd(d.name,d.text);
 else if(d.t=='res'&&!S.done){S.done=true;showResults((d.rows||[]).map(r=>({...r,me:r.id==NW.myId})))}}
function leaveRoom(){const c=NW.conn;NW.conn=null;try{c&&c.close()}catch(e){}vcStop();netReset();R.friends()}


/* ---------- open races: always one is waiting; it starts by itself 30 s after the 2nd player joins; entry always Rs 500 ---------- */
const OPENN=['Falcon','Thunder','Comet','Cheetah','Stallion','Phoenix','Viper','Tornado','Eagle','Panther','Lightning','Rocket','Cobra','Mirage','Jaguar','Blaze'];
const OSLOTS=8,OS={sess:0,scan:null};
function updCd(){const e=$('ocd');if(!e)return;e.textContent=NW.cd>0?('Race starts in '+NW.cd+' s'):(NW.open?(NW.players.length<2?'Waiting for one more player...':''):'')}
R.openRaces=function(){ensureAssets(()=>{
 scr(`<div class="box"><h2>🌍 Open races</h2><label class="rlb">Username</label><input class="rin" id="rnm" maxlength="14" placeholder="Your username" value="${esc(nameGet())}"><label class="rlb">Your car (owned)</label><div id="pvh"></div><select class="rin" id="rcar">${carOpts(SELC)}</select><p id="rmsg" style="color:#ffd34d">Entry ${inr(500)} for every open race. Looking for open races...</p><div id="olist"></div><button class="btn s" id="orf">Refresh</button></div>`,()=>{stopScan();R.friends()});
 bindCar('rcar');$('orf').onclick=()=>scanOpen();scanOpen()})};
function stopScan(){OS.sess++;try{OS.scan&&OS.scan.destroy()}catch(e){}OS.scan=null}
function scanOpen(){stopScan();const sess=OS.sess;say('Looking for open races...');const ol0=$('olist');if(ol0)ol0.innerHTML='';
 needPeer(()=>{if(sess!=OS.sess)return;const p=new Peer();OS.scan=p;const found=[],done={};let left=OSLOTS;
  const render=()=>{if(sess!=OS.sess)return;try{p.destroy()}catch(e){}OS.scan=null;const w=found.filter(f=>f.state=='waiting').sort((a,b)=>a.k-b.k),ol=$('olist');if(!ol)return;
   if(!w.length){say('No open race is waiting. Creating one for you...');setTimeout(()=>{if(sess==OS.sess&&$('olist'))openCreate()},300);return}
   say('Pick a race. It starts 30 seconds after the 2nd player joins.');
   ol.innerHTML=w.map(f=>`<div class="rrow"><b class="pos">🏁</b><span><strong>${esc(f.name)}</strong><small>${f.n}/6 players · ${f.len} km · ${esc(f.city)} · ${inr(f.fee)}${f.cd>0?' · starts in '+f.cd+' s':''}</small></span><button class="btn s" data-k="${f.k}">Join</button></div>`).join('')+'<button class="btn s" id="onw" style="width:100%">Create another open race</button>';
   ol.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{if(BAL<500){say('You need at least ₹500 balance');return}aud();NW.open=true;say('Connecting...');joinRoom('rr3open-'+b.dataset.k,'',nameVal(),$('rcar').value)});const nw=$('onw');if(nw)nw.onclick=()=>openCreate()};
  const fin=k=>{if(sess!=OS.sess||done[k])return;done[k]=1;if(--left==0)render()};
  p.on('open',()=>{for(let k=1;k<=OSLOTS;k++){const c=p.connect('rr3open-'+k,{reliable:true}),to=setTimeout(()=>{try{c.close()}catch(e){}fin(k)},5000);c.on('open',()=>c.send({t:'info'}));c.on('data',d=>{if(d&&d.t=='oinfo')found.push(Object.assign({k},d));clearTimeout(to);try{c.close()}catch(e){}fin(k)})}});
  p.on('error',e=>{const m=/rr3open-(\d+)/.exec((e&&e.message)||'');if(m)fin(+m[1])});
  setTimeout(()=>{if(sess==OS.sess&&left>0)for(let k=1;k<=OSLOTS;k++)fin(k)},7500)},()=>say('Could not load the connection library'))}
function openCreate(){if(BAL<500){say('You need at least ₹500 balance');return}stopScan();aud();const name=nameVal(),car=$('rcar').value;say('Creating an open race...');netReset();
 needPeer(()=>{let k=0;const next=()=>{k++;if(k>OSLOTS){say('All open races are busy. Try again in a moment.');return}const p=new Peer('rr3open-'+k);NW.peer=p;
  p.on('open',()=>{NW.host=true;NW.open=true;NW.fee=500;NW.pw='';NW.myId='host';NW.len=[10,15,20][Math.floor(Math.random()*3)];NW.city=Math.floor(Math.random()*CITYN.length);NW.oname=OPENN[Math.floor(Math.random()*OPENN.length)];NW.cd=0;NW.cdOn=0;
   NW.players=[{id:'host',name,car,host:1,pid:p.id}];vcHook();p.on('connection',hostConn);p.on('disconnected',()=>{try{p.reconnect()}catch(e){}});NW.oti=setInterval(openTick,1000);lobbyOpen()});
  p.on('error',e=>{if(e.type=='unavailable-id'){try{p.destroy()}catch(x){}next()}else say('Connection problem: '+e.type)})};next()},()=>say('Could not load the connection library'))}
function openTick(){if(!NW.open||!NW.host||NW.locked)return;if(NW.players.length>=2){if(!NW.cdOn){NW.cdOn=1;NW.cd=30}else NW.cd--;bcast({t:'ocd',cd:NW.cd});updCd();if(NW.cd<=0){NW.cdOn=0;startRace()}}else if(NW.cdOn){NW.cdOn=0;NW.cd=0;bcast({t:'ocd',cd:0});updCd()}}
function leaveOpen(){vcStop();netReset();R.friends()}
function lobbyOpen(){scr(`<div class="box"><h2>🌍 ${esc(NW.oname)} <small style="float:right;color:#ffd34d">Entry ${inr(NW.fee)} · ${NW.len} km · ${CITYN[NW.city]}</small></h2><h3>Players <span id="pcnt"></span></h3><div id="plist"></div><p id="ocd" style="color:#ffd34d;font-weight:700"></p>${chatBox}<p style="color:#93a1ae"><small>This open race starts automatically 30 seconds after the 2nd player joins. Anyone can join.</small></p><button class="btn s" id="olv">Leave race</button></div>`,leaveOpen);
 updLobby();updCd();bindChat();$('olv').onclick=leaveOpen;setTimeout(()=>{if(!VC.stream)micOn()},400)}


/* ---------- ONLINE OPEN WORLD (car driving): ONE world for everybody, no rooms and no player limit.
   Whatever car level a player is in (Level 1, free tour, anything), all of them see each other: names over cars, horn, indicators,
   lights, engine sound. Voice is proximity based (people near you). Goes online by itself when the internet is there. Races stay isolated. ---------- */
const WD={on:false,busy:false,intro:null,claiming:0,claimAt:0,peer:null,mesh:{},players:[],remote:{},pos:{},id:'',seq:0,sendT:0,t:0,sess:0,k:0,name:'',retryAt:0};
const WSLOTS=3,FAR=2500,NEARV=450;
function wName(){let n=nameGet();if(!n){n='Driver'+Math.floor(1000+Math.random()*9000);try{STO.s('rr3name',n)}catch(e){}}return n}
function wDrop(id){const o=WD.remote[id];if(!o)return;try{sndStop(o)}catch(e){}try{if(o.mesh)sc.remove(o.mesh)}catch(e){}delete WD.remote[id]}
function wReset(){const had=WD.on||WD.busy||WD.peer;WD.sess++;WD.newc=0;WD.on=false;WD.busy=false;WD.claiming=0;for(const c of Object.values(WD.mesh))try{c.close()}catch(e){}try{WD.intro&&WD.intro!==WD.peer&&WD.intro.destroy()}catch(e){}try{WD.peer&&WD.peer.destroy()}catch(e){}
 WD.peer=null;WD.intro=null;WD.mesh={};WD.players=[];WD.pos={};for(const id of Object.keys(WD.remote))wDrop(id);WD.remote={};if(had&&!NW.peer)vcStop()}
function wJoined(){vcHook();vcSync();try{toast('🌐 Online: other drivers can see you',2.5)}catch(e){}setTimeout(()=>{if(WD.on&&!VC.stream)micOn()},600)}
const g_car=()=>{try{return Lv.car}catch(e){return 'oldcar'}};
const wRid=()=>'w'+Math.random().toString(36).slice(2,9);
const wClean=p=>({id:String(p.id).slice(0,16),name:String(p.name||'Driver').slice(0,14),car:CARSHOP[p.car]?p.car:'oldcar',pid:String(p.pid||'')});
function wAddP(pl){if(pl&&pl.id!=WD.id&&!WD.players.some(p=>p.id==pl.id))WD.players.push(pl)}
/* mesh: every driver is connected straight to every other driver. The "room creator" only introduces newcomers; if it leaves, the others keep playing and one of them takes over the introducing. */
function wLink(pl){if(!WD.peer||!pl.pid||pl.id==WD.id||WD.mesh[pl.id])return;const sess=WD.sess,c=WD.peer.connect(pl.pid,{reliable:true});c.mid=pl.id;
 c.on('open',()=>{if(sess!=WD.sess){try{c.close()}catch(e){}return}WD.mesh[pl.id]=c;try{c.send({t:'wm',p:{id:WD.id,name:WD.name,car:g_car(),pid:WD.peer.id}})}catch(e){}vcSync()});
 c.on('data',d=>{if(d&&d.t=='ws'){d.id=pl.id;WD.pos[d.id]={x:+d.x,z:+d.z};wApply(d)}});c.on('close',()=>wGone(pl.id,c));c.on('error',()=>{})}
function wGone(id,c){if(WD.mesh[id]&&WD.mesh[id]!==c)return;delete WD.mesh[id];delete WD.pos[id];WD.players=WD.players.filter(p=>p.id!=id);wDrop(id);try{vcSync()}catch(e){}}
function wIn(c){c.on('data',d=>{if(!d||typeof d!='object')return;
  if(d.t=='hello'){if(c.hel)return;c.hel=1;const pl=wClean({id:wRid(),name:d.name,car:d.car,pid:d.pid});try{c.send({t:'wok',id:pl.id,players:[{id:WD.id,name:WD.name,car:g_car(),pid:WD.peer.id}].concat(WD.players)})}catch(e){}wAddP(pl)}
  else if(d.t=='wm'&&d.p){const pl=wClean(d.p);c.mid=pl.id;WD.mesh[pl.id]=c;wAddP(pl);vcSync()}
  else if(c.mid&&d.t=='ws'){d.id=c.mid;WD.pos[d.id]={x:+d.x,z:+d.z};wApply(d)}});
 c.on('close',()=>{if(c.mid)wGone(c.mid,c)});c.on('error',()=>{})}
function wClaim(){if(!WD.on||WD.intro||WD.claiming)return;WD.claiming=1;const sess=WD.sess,p=new Peer('rr3world-'+WD.k);
 p.on('open',()=>{WD.claiming=0;if(sess!=WD.sess||!WD.on){try{p.destroy()}catch(e){}return}WD.intro=p;p.on('connection',wIn);p.on('disconnected',()=>{try{p.reconnect()}catch(e){}})});
 p.on('error',e=>{if(WD.intro===p)return;WD.claiming=0;try{p.destroy()}catch(x){}WD.claimAt=Date.now()+3000+Math.random()*3000})}
function wEnter(){if(WD.busy||WD.on)return;WD.busy=true;const sess=++WD.sess;WD.name=wName();
 const fail=ms=>{if(sess!=WD.sess)return;wReset();WD.retryAt=Date.now()+(ms||8000)};
 const tryK=k=>{if(sess!=WD.sess)return;if(k>WSLOTS){fail();return}
  const p=new Peer('rr3world-'+k);
  p.on('open',()=>{if(sess!=WD.sess){try{p.destroy()}catch(e){}return}WD.peer=p;WD.intro=p;WD.on=true;WD.busy=false;WD.k=k;WD.id=wRid();WD.players=[];WD.newc=0;WD.joinT=Date.now();WD.mesh={};p.on('connection',wIn);p.on('disconnected',()=>{try{p.reconnect()}catch(e){}});wJoined()});
  p.on('error',e=>{if(sess!=WD.sess)return;WD.err=e.type;if(e.type=='unavailable-id'){try{p.destroy()}catch(x){}joinK(k)}else if(!WD.on){try{p.destroy()}catch(x){}fail()}})};
 const joinK=k=>{if(sess!=WD.sess)return;const q=new Peer();let done=false;const nxt=()=>{if(done)return;done=true;try{q.destroy()}catch(e){}if(k>=WSLOTS)fail(1500);else tryK(k+1)};
  q.on('open',()=>{const c=q.connect('rr3world-'+k,{reliable:true}),to=setTimeout(nxt,7000);
   c.on('open',()=>c.send({t:'hello',name:WD.name,car:g_car(),pid:q.id}));
   c.on('data',d=>{if(!d||typeof d!='object')return;
    if(d.t=='wok'){clearTimeout(to);if(done)return;done=true;if(sess!=WD.sess){try{q.destroy()}catch(e){}return}WD.peer=q;WD.intro=null;WD.on=true;WD.busy=false;WD.k=k;WD.id=d.id;WD.mesh={};WD.players=(d.players||[]).map(wClean);WD.newc=WD.players.length>0;WD.joinT=Date.now();q.on('connection',wIn);WD.claimAt=Date.now()+3000+Math.random()*3000;WD.players.forEach(wLink);setTimeout(()=>{try{c.close()}catch(e){}},500);wJoined()}})});
  q.on('error',e=>{WD.err=e.type;if(e.type=='peer-unavailable')nxt();else if(!WD.on&&!done)fail()})};
 needPeer(()=>{if(sess!=WD.sess)return;tryK(1)},()=>{WD.busy=false;WD.err='no-lib';WD.retryAt=Date.now()+15000})}
function wSendNear(m,except,px,pz){const big=WD.players.length>16;for(const k of Object.keys(WD.mesh)){if(k==except)continue;if(big){const p=WD.pos[k];if(p&&Math.hypot(p.x-px,p.z-pz)>FAR)continue}try{WD.mesh[k].send(m)}catch(e){}}}
function wMake(pl){const key=CARSHOP[pl.car]?pl.car:'oldcar',o={id:pl.id,name:pl.name,car:key,out:0,v:0,dl:0,nit:0,fl:0,x:0,z:0,h:0,tx:0,tz:0,th:0,tv:0,tdl:0,snd:null};
 try{o.mesh=mkCar(CARS[key],1);const hh=(PR[key]&&PR[key].userData.h)||1.5;try{o.tag=tagSprite(pl.name);o.tag.position.set(0,hh+1.1,0);o.mesh.add(o.tag)}catch(e){}sc.add(o.mesh)}catch(e){o.mesh=null}return o}
function wApply(d){if(!d||d.id==WD.id)return;const pl=WD.players.find(p=>p.id==d.id);if(!pl)return;let o=WD.remote[d.id];if(!o){if(Math.hypot(+d.x-x,+d.z-z)>FAR)return;o=wMake(pl);if(!o.mesh)return;WD.remote[d.id]=o;o.x=o.tx=+d.x;o.z=o.tz=+d.z;o.h=o.th=+d.h}
 o.tx=+d.x;o.tz=+d.z;o.th=+d.h;o.tv=+d.v||0;o.tdl=+d.d||0;o.fl=d.f|0;o.seen=WD.t}
function wStep(o,dt){const k=Math.min(1,dt*10);o.tx+=Math.sin(o.th)*o.tv*dt;o.tz+=Math.cos(o.th)*o.tv*dt;o.x+=(o.tx-o.x)*k;o.z+=(o.tz-o.z)*k;let dh=o.th-o.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));o.h+=dh*k;o.v+=(o.tv-o.v)*Math.min(1,dt*6);o.dl+=(o.tdl-o.dl)*k;
 const m=o.mesh;if(!m)return;m.position.set(o.x,0,o.z);m.rotation.y=o.h;
 const dist=Math.hypot(o.x-cam.position.x,o.z-cam.position.z);m.visible=dist<900;if(o.tag)o.tag.visible=dist<160;
 if(m.wh)for(const w of m.wh){w.spin.rotation.x+=o.v*dt/w.r;if(w.front)w.steer.rotation.y=o.dl}
 const u=m.u;if(u){const f=o.fl,ph=Math.floor(WD.t/.35)%2,am=on=>on?0xffaa00:0x553300,lo=((f&1)||(f&4))&&ph,ro=((f&2)||(f&4))&&ph;u.fl.color.setHex(am(lo));u.rl.color.setHex(am(lo));u.fr.color.setHex(am(ro));u.rr.color.setHex(am(ro));u.br.color.setHex((f&32)?0xff2a20:((f&8)?0x990000:0x550000));u.hl.color.setHex((f&8)?0xfffbd0:0x777766)}
 try{sndUpdate(o)}catch(e){}}
R.wtick=function(dt){if(!WD.on)return;try{if(Lv.tm||Lv.race)return}catch(e){return}WD.t+=dt;WD.sendT+=dt;
 if(WD.sendT>.1){WD.sendT=0;const f=(sigL?1:0)|(sigR?2:0)|(hz?4:0)|(hl?8:0)|((typeof hn!='undefined'&&hn.length)?16:0)|(((K.ArrowDown||K.s)&&v>.3)?32:0),
  m={t:'ws',id:WD.id,x:+x.toFixed(2),z:+z.toFixed(2),h:+h.toFixed(3),v:+v.toFixed(1),d:+dl.toFixed(3),f};
  wSendNear(m,null,x,z)}
 for(const id of Object.keys(WD.remote)){const o=WD.remote[id];if(Math.hypot(o.x-x,o.z-z)>FAR*1.4||WD.t-(o.seen||0)>8){wDrop(id);continue}wStep(o,dt)}try{sndListener()}catch(e){}};
function wDots(q,X,Y){if(!WD.on)return;q.save();q.font='20px sans-serif';q.textAlign='center';q.textBaseline='middle';for(const id of Object.keys(WD.remote)){const o=WD.remote[id];q.fillText('🌐',X(o.x),Y(o.z))}q.restore()}
/* voice only with the drivers who are near you */
function wNear(){return WD.players.filter(p=>{if(p.id==WD.id)return true;const o=WD.remote[p.id];return o&&Math.hypot(o.x-cam.position.x,o.z-cam.position.z)<NEARV})}
function wVoicePrune(){/* open world: you hear a driver only while he is within 100 m of you */for(const pid of Object.keys(VC.aud)){const p=WD.players.find(q=>q.pid==pid),q=p&&(WD.pos[p.id]||WD.remote[p.id]),a=VC.aud[pid];if(!a)continue;const dd=q?Math.hypot(q.x-x,q.z-z):1e9,near=dd<=100;if(dd>720&&VC.calls[pid]){try{VC.calls[pid].close()}catch(e){}delete VC.calls[pid]}if(a.muted!==!near)a.muted=!near}}
setInterval(()=>{if(WD.on)try{wVoicePrune()}catch(e){}},250);
/* decide once a second: online while ANY car level is being driven (not train, not race, not in menus) and the internet is there */
/* free tour: at the start, go to the CITY where most drivers are, but to a different spot on its road (so cars never overlap) */
function wCityOf(p){let bk=null,bd=1e18;for(const c of CITIES){const d=Math.hypot(p.x-c.cx,p.z-c.cz);if(d<bd){bd=d;bk=c}}return bk}
function wSpawn(){try{if(!WD.on||!run||!Lv||!Lv.free||Lv.tm||Lv.race||S.active)return;
 if(WD.spLv!==Lv){WD.spLv=Lv;WD.spT=Date.now();WD.spDone=0}
 if(WD.spDone)return;
 if(!WD.newc){WD.spDone=1;return} /* I was here first: I stay where I am, the newcomer comes to me */
 const t0=Math.max(WD.spT,WD.joinT||0);
 if(Date.now()-t0>25000||Math.abs(v)>.5){WD.spDone=1;return}
 if(Date.now()-t0<3000)return;
 const ids=Object.keys(WD.pos);if(!ids.length)return;
 let best=null,bc=-1,bd=1e12;
 for(const a of ids){const pa=WD.pos[a];let c=0;for(const b of ids){if(b==a)continue;const pb=WD.pos[b];if(Math.hypot(pa.x-pb.x,pa.z-pb.z)<NEARV)c++}
  const d=Math.hypot(pa.x-x,pa.z-z);if(c>bc||(c==bc&&d<bd)){best=a;bc=c;bd=d}}
 WD.spDone=1;const tc=wCityOf(WD.pos[best]);if(!tc)return;
 let spot=null;for(let t=0;t<12&&!spot;t++){const jj=2+Math.floor(Math.random()*Math.max(1,tc.N-5)),a=tc.toW(4*BS+3,jj*BS+12);if(!ids.some(id=>Math.hypot(WD.pos[id].x-a.x,WD.pos[id].z-a.z)<30))spot=a}
 if(!spot)spot=tc.toW(4*BS+3,2*BS+12);
 try{setCity(tc)}catch(e){}
 x=spot.x;z=spot.z;h=tc.th;v=0;gy=0;try{hRef=h}catch(e){}try{cam.position.set(x,4,z)}catch(e){}
 try{toast('Moved to '+tc.name+' where other drivers are',3)}catch(e){}}catch(e){}}
R.wpoll=function(){let want=false;try{want=!!run&&!!Lv&&!Lv.tm&&!Lv.race&&!S.active&&navigator.onLine!==false&&!NW.peer}catch(e){}
 if(want&&!WD.on&&!WD.busy&&Date.now()>=WD.retryAt)wEnter();else if(!want&&(WD.on||WD.busy))wReset();
 if(WD.on){try{vcSync();wVoicePrune()}catch(e){}wSpawn();if(!WD.intro&&Date.now()>=WD.claimAt)wClaim()}
 try{const e=$('lv');if(e){const base=e.textContent.split(' · 🌐')[0];const txt=WD.on?base+' · 🌐 Online ('+WD.players.length+')':(want?base+' · 🌐 '+(WD.busy?'connecting…':'offline'+(WD.err?' ('+WD.err+')':'')):base);if(e.textContent!==txt)e.textContent=txt}}catch(e){}};
setInterval(R.wpoll,1000);
addEventListener('offline',()=>{if(WD.on||WD.busy)wReset()});addEventListener('online',()=>{WD.retryAt=0});
R._WD=WD;

/* ---------- voice chat (PeerJS media calls, everybody talks to everybody) ---------- */
const VC={stream:null,calls:{},aud:{},ctx:null,speak:{},timer:0,muted:true,hooked:null,an:{}};
const vcCtx=()=>{if(!VC.ctx)VC.ctx=new(window.AudioContext||window.webkitAudioContext)();if(VC.ctx.state=='suspended')VC.ctx.resume();return VC.ctx};
const silent=()=>vcCtx().createMediaStreamDestination().stream;
function vcWatch(stream,name){try{const c=vcCtx(),src=c.createMediaStreamSource(stream),an=c.createAnalyser();an.fftSize=256;src.connect(an);VC.an[name]=an}catch(e){}if(!VC.timer)VC.timer=setInterval(()=>{const buf=new Uint8Array(128);for(const k in VC.an){VC.an[k].getByteTimeDomainData(buf);let m=0;for(const b of buf)m=Math.max(m,Math.abs(b-128));VC.speak[k]=m>9}vcUI()},250)}
function vcAttach(call){const pid=call.peer;VC.calls[pid]=call;call.on('stream',st=>{let a=VC.aud[pid];if(!a){a=document.createElement('audio');a.autoplay=true;document.body.appendChild(a);VC.aud[pid]=a}a.srcObject=st;a.play().catch(()=>{});const pl=VPL().find(p=>p.pid==pid);vcWatch(st,pl?pl.name:pid)});call.on('close',()=>{delete VC.calls[pid];if(VC.aud[pid]){VC.aud[pid].remove();delete VC.aud[pid]}});call.on('error',()=>{})}
function vcHook(){const pr=VP();if(!pr||VC.hooked===pr)return;VC.hooked=pr;pr.on('call',call=>{call.answer(VC.stream||silent());vcAttach(call)})}
function vcSync(){const pr=VP();if(!pr)return;vcHook();const me=VME();for(const p of VPL()){if(!p.pid||p.pid==me||VC.calls[p.pid])continue;if(me<p.pid){try{vcAttach(pr.call(p.pid,VC.stream||silent()))}catch(e){}}}}
async function micOn(){try{const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});VC.stream=s;VC.muted=false;const tk=s.getAudioTracks()[0];
 for(const c of Object.values(VC.calls)){try{const sn=c.peerConnection.getSenders().find(q=>!q.track||q.track.kind=='audio');if(sn)sn.replaceTrack(tk)}catch(e){}}
 const me=(VPL().find(p=>p.id==(NW.peer?NW.myId:WD.id))||{}).name||'me';vcWatch(s,me);vcSync();vcUI();return true}catch(e){const m=$('rvs');if(m)m.textContent='Microphone blocked or missing (you can still listen).';return false}}
function micToggle(){if(!VC.stream){micOn();return}VC.muted=!VC.muted;VC.stream.getAudioTracks().forEach(tk=>tk.enabled=!VC.muted);vcUI()}
R.micToggle=micToggle;
function vcStop(){try{VC.stream&&VC.stream.getTracks().forEach(tk=>tk.stop())}catch(e){}VC.stream=null;VC.muted=true;for(const c of Object.values(VC.calls)){try{c.close()}catch(e){}}VC.calls={};for(const a of Object.values(VC.aud))a.remove();VC.aud={};VC.an={};VC.speak={};VC.hooked=null;clearInterval(VC.timer);VC.timer=0}
function vcUI(){const lab=!VC.stream?'🎤 Turn on mic (V)':VC.muted?'🔇 Mic muted (V)':'🎤 Mic ON (V)';const b=$('rmic');if(b)b.textContent=lab;
 const e=$('rvc');if(e&&S.mode=='net'){const sp=Object.keys(VC.speak).filter(k=>VC.speak[k]);e.innerHTML='<button id="rvb">'+lab+'</button>'+sp.map(n=>'<div>🔊 '+esc(n)+'</div>').join('');const bb=$('rvb');if(bb)bb.onclick=micToggle}
 {let w=$('wmic');if(WD.on&&!(S.active&&S.mode=='net')){if(!w){w=document.createElement('div');w.id='wmic';w.style.cssText='position:fixed;left:22px;top:192px;z-index:9999;touch-action:manipulation;font:600 14px system-ui,sans-serif;color:#fff';document.body.appendChild(w)}const sp=Object.keys(VC.speak).filter(k=>VC.speak[k]);w.innerHTML='<button id="wmb" style="padding:8px 12px;border:0;border-radius:10px;background:#1c2530;color:#fff;font:inherit;cursor:pointer">'+lab+'</button>'+sp.map(n=>'<div style="margin-top:4px;background:#0008;padding:2px 8px;border-radius:8px">\u{1F50A} '+esc(n)+'</div>').join('');const wb=$('wmb');if(wb){wb.onpointerdown=ev=>{ev.preventDefault();ev.stopPropagation();micToggle()};wb.onclick=ev=>ev.stopPropagation()}}else if(w)w.remove()}
 const s=$('rvs');if(s&&VC.stream)s.textContent=Object.keys(VC.calls).length?'Voice connected with '+Object.keys(VC.calls).length+' player(s)':'Voice ready'}
addEventListener('keydown',e=>{if(e.key.toLowerCase()!='v'||e.repeat)return;const t=e.target&&e.target.tagName;if(t=='INPUT'||t=='TEXTAREA')return;if((S.active&&S.mode=='net'&&S.phase!='done')||(WD.on&&!(S.active&&S.mode=='net')))micToggle()});

/* ---------- deep link (#race:ID:PW from the QR) ---------- */
{const m=/^#race:([A-Za-z0-9]{6}):(\d{4})$/.exec(location.hash||'');if(m)window.RACE_JOIN={id:m[1].toUpperCase(),pw:m[2]}}
R.deepJoin=function(){const j=window.RACE_JOIN;window.RACE_JOIN=null;try{history.replaceState(null,'',location.href.split('#')[0])}catch(e){}
 const go=()=>joinScreen(j);
 if(BAL===null){scr(`<div class="box" style="text-align:center"><h1>🎁 Welcome bonus</h1><h1 style="color:#7dff9b">₹10,000</h1><p>Here is your starting money.</p><button class="btn" id="wb2">Collect ₹10,000</button></div>`);$('wb2').onclick=()=>{setBal(10000);go()}}else go()};
})();
