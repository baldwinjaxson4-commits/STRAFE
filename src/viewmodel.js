import * as THREE from 'three';
export const knives=[
 {name:'Tanto',detail:'EDGE ROLL',glyph:'╱'}, {name:'Karambit',detail:'FINGER ORBIT',glyph:'◜'},
 {name:'Butterfly',detail:'LATCH / FLIP',glyph:'⋏'}, {name:'Bowie',detail:'BALANCE CHECK',glyph:'⌁'},
 {name:'Stiletto',detail:'TWIRL / CATCH',glyph:'†'}, {name:'Kukri',detail:'HOOK / DRAW',glyph:'⌒'},
 {name:'Twin Fang',detail:'DOUBLE FEINT',glyph:'⋈'}, {name:'Ion Edge',detail:'ARC / SPARK',glyph:'ϟ'},
 {name:'Waveform',detail:'TIDAL SWEEP',glyph:'≈'}, {name:'Prism',detail:'SPLIT LIGHT',glyph:'◇'},
 {name:'Rift Twin',detail:'CROSS / CATCH',glyph:'⋈'}, {name:'Comet',detail:'TAILSPIN',glyph:'☄'},
];
export const finishes=[
 {name:'Glacier',colors:[0x69e9ec,0xe9fcff],pattern:'fade'},
 {name:'Ember',colors:[0xf3834f,0xf8d17d],pattern:'fade'},
 {name:'Ultraviolet',colors:[0xa572ed,0xe7c3f9],pattern:'fade'},
 {name:'Obsidian',colors:[0x334354,0x8c9eac],pattern:'carbon'},
 {name:'Tigerline',colors:[0xffac3e,0x382b22],pattern:'tiger'},
 {name:'Toxic Current',colors:[0x95ff54,0x174e45],pattern:'wave'},
 {name:'Rose Quartz',colors:[0xff92c6,0xffe4ed],pattern:'marble'},
 {name:'Solar Flare',colors:[0xffce43,0xf14b37],pattern:'wave'},
 {name:'Deep Space',colors:[0x543b8c,0x73c7f2],pattern:'stars'},
 {name:'Porcelain',colors:[0xf8f4db,0x256ab3],pattern:'marble'},
 {name:'Signal',colors:[0xf9e95d,0x172c32],pattern:'stripe'},
 {name:'Oil Slick',colors:[0x28d9af,0xac4cc7],pattern:'wave'},
 {name:'Crimson Web',colors:[0x991c3e,0x241d2a],pattern:'web'},
 {name:'Aurora',colors:[0x4bd9e5,0xd2fa93],pattern:'fade'},
 {name:'Frostbite',colors:[0xf3ffff,0x437aa6],pattern:'shard'},
 {name:'Copperhead',colors:[0xb76c43,0x49352b],pattern:'scale'},
 {name:'Magma Glass',colors:[0xff602e,0x341e2b],pattern:'lava'},
 {name:'Circuit Bloom',colors:[0x57f7d8,0x4738a9],pattern:'circuit'},
 {name:'Glacier Veil',colors:[0xb9f6ff,0x315e9d],pattern:'shard'},
 {name:'Foundry Brass',colors:[0xe7a94b,0x473326],pattern:'carbon'},
 {name:'Canopy Pulse',colors:[0xc4ff75,0x176449],pattern:'scale'},
 {name:'Event Horizon',colors:[0x271e54,0x70e2ff],pattern:'stars'},
 {name:'Prismatic',colors:[0xf6a7ff,0x69f5e1],pattern:'circuit'},
 {name:'Whiteout',colors:[0xffffff,0x8db6ce],pattern:'marble'},
].map(f=>({...f,css:`linear-gradient(125deg,#${f.colors[0].toString(16).padStart(6,'0')},#${f.colors[1].toString(16).padStart(6,'0')})`}));
export const gloves=[
 {name:'Carbon',detail:'TACTICAL',color:0x263640,accent:0x8bf4c5,pattern:'carbon'},
 {name:'Sandstorm',detail:'UTILITY',color:0x85775e,accent:0xf3d299,pattern:'shard'},
 {name:'Arctic',detail:'SPORT',color:0xa9c0c8,accent:0x74dce5,pattern:'stripe'},
 {name:'Viper',detail:'REPTILE',color:0x174942,accent:0xa6eb62,pattern:'scale'},
 {name:'Hotline',detail:'SPORT',color:0x5b2951,accent:0xff8fbd,pattern:'stripe'},
 {name:'Raceway',detail:'RACING',color:0x273548,accent:0xfec65d,pattern:'hex'},
 {name:'Frost',detail:'WINTER',color:0xcedee0,accent:0x6483d8,pattern:'shard'},
 {name:'Ember',detail:'TACTICAL',color:0x602c29,accent:0xf79246,pattern:'tiger'},
 {name:'Spectre',detail:'STEALTH',color:0x272331,accent:0xb69af5,pattern:'carbon'},
 {name:'Oceanic',detail:'MARINE',color:0x214553,accent:0x63d7e5,pattern:'wave'},
 {name:'Hazard',detail:'INDUSTRIAL',color:0x34352a,accent:0xf7d866,pattern:'stripe'},
 {name:'Ceramic',detail:'TACTICAL',color:0xddd3c1,accent:0x6d8675,pattern:'marble'},
 {name:'Glacier',detail:'ICE RUNNER',color:0x9bc7d7,accent:0x6df1ff,pattern:'shard'},
 {name:'Foundry',detail:'HEATPROOF',color:0x4c3730,accent:0xf5a445,pattern:'tiger'},
 {name:'Canopy',detail:'FIELD KIT',color:0x24463b,accent:0xa9ef70,pattern:'scale'},
];
function skinTexture(colors,pattern){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 const hex=n=>'#'+n.toString(16).padStart(6,'0');const g=ctx.createLinearGradient(0,256,256,0);g.addColorStop(0,hex(colors[0]));g.addColorStop(1,hex(colors[1]));ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
 ctx.strokeStyle=hex(colors[1]);ctx.fillStyle=hex(colors[1]);ctx.lineWidth=3;
 let seed=91;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 if(pattern==='stripe'||pattern==='tiger')for(let i=-256;i<512;i+=pattern==='tiger'?37:28){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+82+(pattern==='tiger'?rnd()*60:0),256);ctx.lineTo(i+100,256);ctx.lineTo(i+12,0);ctx.closePath();ctx.globalAlpha=.6;ctx.fill();}
 if(pattern==='carbon')for(let x=0;x<256;x+=12)for(let y=0;y<256;y+=12){ctx.globalAlpha=.25;ctx.fillStyle=(x+y)%24?'#050b12':'#b4c6cf';ctx.fillRect(x,y,10,6);}
 if(['wave','marble','web'].includes(pattern))for(let j=0;j<20;j++){ctx.globalAlpha=pattern==='web'?.5:.3;ctx.lineWidth=pattern==='wave'?6:2;ctx.beginPath();for(let x=0;x<=256;x+=4){const y=j*18+Math.sin(x*.035+j)*18; x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
 if(pattern==='stars')for(let i=0;i<110;i++){ctx.globalAlpha=.2+rnd()*.7;ctx.fillStyle='#e5faff';ctx.fillRect(rnd()*256,rnd()*256,1+rnd()*2,1+rnd()*2);}
 if(pattern==='shard')for(let i=0;i<28;i++){const x=rnd()*256,y=rnd()*256;ctx.globalAlpha=.15+rnd()*.25;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+30,y-50);ctx.lineTo(x+75,y+50);ctx.closePath();ctx.fill();}
 if(pattern==='scale')for(let y=0;y<280;y+=19)for(let x=-20;x<280;x+=26){ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(x+(y%38?13:0),y,15,0,Math.PI);ctx.stroke();}
 if(pattern==='hex')for(let y=-12;y<280;y+=22)for(let x=-12;x<280;x+=26){ctx.globalAlpha=.36;ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3,px=x+13+Math.cos(a)*11,py=y+11+Math.sin(a)*11;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.stroke();}
 if(pattern==='circuit')for(let i=0;i<22;i++){const x=rnd()*256,y=rnd()*256,dx=(rnd()-.5)*95,dy=(rnd()-.5)*95;ctx.globalAlpha=.45;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y);ctx.lineTo(x+dx,y+dy);ctx.stroke();ctx.beginPath();ctx.arc(x+dx,y+dy,3,0,Math.PI*2);ctx.fill();}
 if(pattern==='lava')for(let i=0;i<30;i++){const x=rnd()*256,y=rnd()*256;ctx.globalAlpha=.25+rnd()*.4;ctx.strokeStyle='#ff9a42';ctx.lineWidth=1+rnd()*3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(rnd()-.5)*18,y+20+rnd()*45);ctx.lineTo(x+(rnd()-.5)*24,y+55+rnd()*55);ctx.stroke();}
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;return texture;
}
// Multi-stage inspect tracks: draw, presentation, flourish, catch and settle.
const inspectTracks=[
 [[0,0,0,0,0,0,0,0],[.18,-.11,.10,0,-.1,.3,-.5,0],[.42,-.17,.16,.03,-.3,1.8,-.3,0],[.67,-.14,.13,.02,.3,-.4,.25,0],[.85,-.06,.04,0,0,0,-.12,0],[1,0,0,0,0,0,0,0]],
 [[0,0,0,0,0,0,0,0],[.18,-.10,.13,0,.2,.3,-.3,0],[.42,-.15,.16,0,-.2,.2,-6.58,0],[.65,-.13,.13,.03,.2,1,-12.86,0],[.82,-.06,.07,0,0,.3,-12.56,0],[1,0,0,0,0,0,-12.56637,0]],
 [[0,0,0,0,0,0,0,0],[.15,-.12,.14,0,.1,.3,-.4,-2.8],[.32,-.17,.18,.04,.3,-.3,-3.4,2.9],[.48,-.15,.16,.01,-.2,.5,-6.7,-2.8],[.65,-.11,.14,.02,.2,.1,-9.7,2.9],[.82,-.06,.08,0,0,0,-12.56,0],[1,0,0,0,0,0,-12.56637,0]],
 [[0,0,0,0,0,0,0,0],[.2,-.16,.15,.05,-.2,.7,-.6,0],[.45,-.21,.19,.04,.2,1.4,-.4,0],[.67,-.12,.12,.02,-.2,-.2,.4,0],[.83,-.05,.04,0,0,.2,-.1,0],[1,0,0,0,0,0,0,0]],
 [[0,0,0,0,0,0,0,0],[.17,-.1,.13,0,0,.4,-.3,0],[.38,-.12,.20,.03,.3,.3,-6.6,0],[.60,-.16,.14,.01,-.2,1.4,-6.6,0],[.8,-.07,.07,0,.1,-.2,-6.28,0],[1,0,0,0,0,0,-6.283185,0]],
];
function trackPose(track,t){let i=0;while(i<track.length-2&&track[i+1][0]<t)i++;const a=track[i],b=track[i+1];let u=THREE.MathUtils.clamp((t-a[0])/(b[0]-a[0]),0,1);u=u*u*(3-2*u);return a.slice(1).map((n,j)=>THREE.MathUtils.lerp(n,b[j+1],u));}
function mesh(geo,mat,group,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;group.add(m);return m;}
function bladeGeometry(points,depth=.055){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.012,bevelThickness:.009,bevelSegments:1,steps:1});geo.computeVertexNormals();return geo;}
export class ViewModel{
 constructor(camera,settings){this.root=new THREE.Group();camera.add(this.root);this.settings=settings;this.inspectTime=-1;this.elapsed=0;this.slideBlend=0;this.inspectCount=0;this.inspectVariation=false;this.build();}
 build(){for(const child of [...this.root.children]){this.root.remove(child);child.traverse(o=>{o.geometry?.dispose();if(o.material?.map)o.material.map.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});}
 this.flipHandle=null;this.flipHandleB=null;const glove=gloves[this.settings.glove],finish=finishes[this.settings.finish];this.gloveMap=skinTexture([glove.color,glove.accent],glove.pattern);this.bladeMap=skinTexture(finish.colors,finish.pattern);
 const cloth=new THREE.MeshStandardMaterial({color:0xffffff,map:this.gloveMap,roughness:.92,flatShading:true});const panel=new THREE.MeshStandardMaterial({color:new THREE.Color(glove.color).multiplyScalar(.62),roughness:.8});const accent=new THREE.MeshStandardMaterial({color:glove.accent,roughness:.5,metalness:.2});const sleeve=new THREE.MeshStandardMaterial({color:0x6c858b,roughness:1});
 this.arm=new THREE.Group();this.root.add(this.arm);this.arm.position.set(.53,-.48,-.83);this.arm.rotation.set(-.1,-.16,-.32);
 const forearm=mesh(new THREE.CylinderGeometry(.12,.15,.56,8),sleeve,this.arm,.12,-.28,.12);forearm.rotation.set(-.65,0,-.25);
 const cuff=mesh(new THREE.CylinderGeometry(.137,.13,.15,8),panel,this.arm,.065,-.065,.02);cuff.rotation.x=-.65;
 mesh(new THREE.BoxGeometry(.23,.24,.18),cloth,this.arm,0,.075,-.035);
 const knuckle=mesh(new THREE.BoxGeometry(.22,.075,.05),panel,this.arm,0,.16,.07);knuckle.rotation.z=.06;
 for(let i=0;i<4;i++){const finger=mesh(new THREE.CapsuleGeometry(.035,.075,2,5),cloth,this.arm,-.085+i*.054,.055,-.12);finger.rotation.x=1.05;mesh(new THREE.BoxGeometry(.036,.04,.027),panel,this.arm,-.085+i*.054,.14,-.12);}
 const thumb=mesh(new THREE.CapsuleGeometry(.042,.09,2,5),cloth,this.arm,-.12,.02,-.005);thumb.rotation.z=-.75;
 for(let i=0;i<2;i++){const stripe=mesh(new THREE.BoxGeometry(.026,.085,.008),accent,this.arm,-.05+i*.049,.055,.06);stripe.rotation.z=-.4;}
 this.weapon=new THREE.Group();this.arm.add(this.weapon);this.weapon.position.set(-.03,.11,-.14);this.weapon.rotation.z=1.48;
 const steel=new THREE.MeshStandardMaterial({color:0xffffff,map:this.bladeMap,metalness:.85,roughness:.26});const coated=new THREE.MeshStandardMaterial({color:finish.colors[0],metalness:.6,roughness:.3});const grip=new THREE.MeshStandardMaterial({color:0x152830,roughness:.8});
 const type=this.settings.knife;
 if(type===0){mesh(new THREE.BoxGeometry(.095,.28,.075),grip,this.weapon,0,-.075,0);mesh(new THREE.BoxGeometry(.22,.035,.10),steel,this.weapon,0,.07,0);const points=[[-.075,.08],[-.07,.50],[.04,.69],[.085,.54],[.065,.08]];mesh(bladeGeometry(points),steel,this.weapon,0,0,-.025);mesh(bladeGeometry([[-.076,.11],[-.072,.49],[-.035,.54],[-.03,.11]],.003),coated,this.weapon,0,0,.034);for(let i=0;i<5;i++)mesh(new THREE.BoxGeometry(.10,.011,.078),coated,this.weapon,0,-.17+i*.041,0);
 }else if(type===1){mesh(new THREE.BoxGeometry(.10,.29,.08),grip,this.weapon,0,-.065,0);const ring=mesh(new THREE.TorusGeometry(.078,.021,6,22),steel,this.weapon,0,-.26,0);ring.rotation.y=.1;mesh(bladeGeometry([[-.045,.075],[-.12,.22],[-.23,.35],[-.29,.39],[-.23,.20],[-.13,.10],[.05,.06]]),coated,this.weapon,0,0,-.02);mesh(new THREE.BoxGeometry(.15,.032,.10),steel,this.weapon,0,.06,0);
 }else if(type===2){this.flipHandle=new THREE.Group();this.flipHandleB=new THREE.Group();this.weapon.add(this.flipHandle,this.flipHandleB);this.flipHandle.position.set(.045,.07,0);this.flipHandleB.position.set(-.045,.07,0);for(const [handle,material,side] of [[this.flipHandle,coated,1],[this.flipHandleB,grip,-1]]){mesh(new THREE.BoxGeometry(.055,.32,.075),material,handle,0,-.15,0);for(let i=0;i<4;i++)mesh(new THREE.BoxGeometry(.026,.028,.081),i%2?grip:coated,handle,0,-.05-i*.065,0);mesh(new THREE.CylinderGeometry(.014,.014,.012,8),steel,handle,0,-.03,.044).rotation.x=Math.PI/2;}mesh(bladeGeometry([[-.045,.07],[-.045,.46],[0,.64],[.052,.46],[.052,.07]]),steel,this.weapon,0,0,-.025);mesh(new THREE.CylinderGeometry(.037,.037,.10,10),steel,this.weapon,.015,.07,0).rotation.x=Math.PI/2;mesh(new THREE.BoxGeometry(.05,.08,.04),coated,this.weapon,0,-.015,.01);}
 else if(type===3){mesh(new THREE.BoxGeometry(.11,.29,.085),grip,this.weapon,0,-.07,0);mesh(new THREE.BoxGeometry(.26,.04,.11),steel,this.weapon,0,.075,0);mesh(bladeGeometry([[-.09,.09],[-.10,.46],[-.04,.65],[.09,.51],[.12,.33],[.10,.09]]),steel,this.weapon,0,0,-.025);}
 else if(type===4){mesh(new THREE.CylinderGeometry(.05,.055,.30,8),grip,this.weapon,0,-.08,0);mesh(new THREE.BoxGeometry(.20,.035,.09),coated,this.weapon,0,.07,0);mesh(bladeGeometry([[-.033,.09],[-.033,.57],[0,.78],[.035,.57],[.035,.09]]),steel,this.weapon,0,0,-.02);}
 else if(type===5){mesh(new THREE.BoxGeometry(.11,.29,.085),grip,this.weapon,0,-.08,0);mesh(new THREE.BoxGeometry(.25,.045,.12),steel,this.weapon,0,.075,0);mesh(bladeGeometry([[-.08,.08],[-.11,.26],[-.19,.40],[-.25,.48],[-.22,.31],[-.13,.14],[.04,.08]]),steel,this.weapon,0,0,-.025);mesh(bladeGeometry([[-.045,.1],[-.11,.27],[-.17,.37],[-.13,.23],[-.07,.12]],.004),coated,this.weapon,0,0,.033);for(let i=0;i<5;i++)mesh(new THREE.BoxGeometry(.12,.012,.09),coated,this.weapon,0,-.19+i*.045,0);}
 else if(type===6){mesh(new THREE.BoxGeometry(.10,.29,.08),grip,this.weapon,0,-.08,0);mesh(new THREE.BoxGeometry(.24,.04,.10),steel,this.weapon,0,.07,0);mesh(bladeGeometry([[-.075,.07],[-.07,.39],[0,.55],[.07,.39],[.075,.07]]),steel,this.weapon,0,0,-.025);mesh(bladeGeometry([[-.16,-.02],[-.19,.16],[-.13,.25],[-.04,.07],[-.035,-.03]]),coated,this.weapon,0,0,.005);mesh(bladeGeometry([[.04,.07],[.13,.25],[.19,.16],[.16,-.02],[.035,-.03]]),coated,this.weapon,0,0,.005);mesh(new THREE.BoxGeometry(.09,.035,.08),coated,this.weapon,0,-.2,0);}
 else if(type===8){mesh(new THREE.BoxGeometry(.105,.29,.085),grip,this.weapon,0,-.08,0);mesh(new THREE.BoxGeometry(.24,.04,.1),steel,this.weapon,0,.07,0);mesh(bladeGeometry([[-.09,.07],[-.13,.23],[-.09,.37],[-.15,.49],[-.08,.67],[.08,.57],[.11,.42],[.045,.3],[.08,.14],[.07,.07]]),steel,this.weapon,0,0,-.025);mesh(bladeGeometry([[-.04,.13],[-.09,.39],[-.015,.54],[.035,.43],[.02,.16]],.004),coated,this.weapon,0,0,.035);}
 else if(type===9){mesh(new THREE.BoxGeometry(.10,.3,.08),grip,this.weapon,0,-.08,0);mesh(new THREE.BoxGeometry(.24,.04,.1),coated,this.weapon,0,.07,0);mesh(bladeGeometry([[-.09,.07],[-.055,.38],[0,.75],[.055,.38],[.09,.07]],.075),steel,this.weapon,0,0,-.045);mesh(bladeGeometry([[-.018,.15],[-.012,.45],[0,.65],[.018,.45],[.022,.15]],.004),coated,this.weapon,0,0,.035);}
 else if(type===10){mesh(new THREE.BoxGeometry(.10,.29,.08),grip,this.weapon,0,-.08,0);for(const side of [-1,1]){const blade=new THREE.Group();this.weapon.add(blade);blade.position.x=side*.095;mesh(new THREE.BoxGeometry(.045,.035,.075),coated,blade,0,.055,0);mesh(bladeGeometry([[-.025,.07],[-.025,.33],[0,.48],[.03,.31],[.03,.07]],.035),steel,blade,0,0,0);}}
 else if(type===11){mesh(new THREE.CylinderGeometry(.05,.06,.3,8),grip,this.weapon,0,-.08,0);mesh(new THREE.BoxGeometry(.24,.04,.1),coated,this.weapon,0,.07,0);mesh(bladeGeometry([[-.075,.07],[-.06,.37],[-.015,.54],[.02,.7],[.055,.54],[.1,.38],[.08,.07]],.065),steel,this.weapon,0,0,-.04);mesh(new THREE.BoxGeometry(.035,.22,.025),coated,this.weapon,.09,.38,.04).rotation.z=-.42;}
 else{const energy=new THREE.MeshStandardMaterial({color:0x9ffff4,emissive:0x28ddff,emissiveIntensity:1.6,metalness:.5,roughness:.2});mesh(new THREE.BoxGeometry(.10,.3,.085),grip,this.weapon,0,-.08,0);mesh(new THREE.BoxGeometry(.24,.045,.12),energy,this.weapon,0,.075,0);mesh(bladeGeometry([[-.075,.07],[-.055,.43],[0,.72],[.06,.43],[.075,.07]]),steel,this.weapon,0,0,-.025);mesh(bladeGeometry([[-.018,.12],[-.012,.48],[0,.64],[.016,.46],[.022,.12]],.006),energy,this.weapon,0,0,.04);for(let i=0;i<3;i++)mesh(new THREE.BoxGeometry(.14,.018,.09),energy,this.weapon,0,-.18+i*.06,0);}
 if(type!==1&&type!==2)for(const y of [-.16,-.04]){const rivet=mesh(new THREE.CylinderGeometry(.015,.015,.014,8),steel,this.weapon,.058,y,.044);rivet.rotation.x=Math.PI/2;}
 this.support=new THREE.Group();this.root.add(this.support);mesh(new THREE.BoxGeometry(.20,.23,.16),cloth,this.support);for(let i=0;i<4;i++){const f=mesh(new THREE.CapsuleGeometry(.025,.09,2,5),cloth,this.support,-.07+i*.046,.13,-.025);f.rotation.x=.3;}this.support.visible=false;
 this.inspectTime=-1;
 }
 inspect(){if(this.inspectTime>=0)return;this.gloveInspect=false;this.inspectVariation=this.inspectCount++%9===4;this.inspectTime=0;}
 inspectGloves(){if(this.inspectTime>=0)return;this.inspectTime=0;this.gloveInspect=true;this.inspectVariation=false;}
 update(dt,speed,time,menu=false,sliding=false){
   this.slideBlend+=(Number(sliding)-this.slideBlend)*Math.min(dt*12,1);
   this.elapsed+=dt;let pose=[0,0,0,0,0,0,0];let envelope=0;let inspectT=0;
   if(this.inspectTime>=0){
     this.inspectTime+=dt;const duration=this.gloveInspect?2.5:this.settings.knife===2?3.15:2.65;
     const t=Math.min(this.inspectTime/duration,1);inspectT=t;envelope=Math.sin(t*Math.PI);
     pose=trackPose(inspectTracks[this.settings.knife%inspectTracks.length],t);
     if(this.gloveInspect){pose=[-.12*envelope,.17*envelope,.03*envelope,.2*envelope,Math.sin(t*Math.PI*3)*envelope,.15*envelope,0];}
     else if(this.inspectVariation){const flourish=Math.sin(Math.PI*Math.max(0,Math.min(1,(t-.38)/.3)));pose[0]+=.008*flourish;pose[4]+=.035*flourish;}
     if(t>=1){this.inspectTime=-1;this.gloveInspect=false;this.inspectVariation=false;pose=[0,0,0,0,0,0,0];envelope=0;}
   }
   const [x,y,z,rx,ry,rz,handle]=pose;
   const bob=Math.min(speed/10,1)*.012;
   this.root.position.set(x,y+Math.sin(time*10)*bob-this.slideBlend*.18,z+this.slideBlend*.08);this.root.rotation.set(rx*.12+this.slideBlend*.1,ry*.10,envelope*.03);
   this.weapon.rotation.set(rx,ry,1.48+rz+this.slideBlend*.08);this.weapon.position.y=.11+envelope*.015;
   if(this.flipHandle){let angle=handle;if(this.settings.knife===2&&!this.gloveInspect&&this.inspectTime>=0){const spin=THREE.MathUtils.clamp((inspectT-.12)/.6,0,1),eased=spin*spin*(3-2*spin),catchTime=Math.max(0,inspectT-.72);angle=-Math.PI*10*eased+Math.sin(catchTime*28)*Math.exp(-catchTime*13)*.12;}this.flipHandle.rotation.z=angle;if(this.flipHandleB)this.flipHandleB.rotation.z=-angle*.88;}
   const wrist= envelope;
   this.arm.position.set(.53+.008*Math.sin(inspectT*Math.PI*2)*wrist,-.48+.006*Math.sin(inspectT*Math.PI*3)*wrist,-.83);
   this.arm.rotation.set(-.1+Math.sin(time*2)*.015+rx*.2+this.slideBlend*.18+Math.sin(inspectT*Math.PI*2.5)*.045*wrist,
     -.16+ry*.12+Math.sin(inspectT*Math.PI*2)*.035*wrist,
     -.32+Math.sin(inspectT*Math.PI*3)*.035*wrist);
   this.support.visible=envelope>.12&&(this.gloveInspect||[0,3].includes(this.settings.knife));
   this.support.position.set(-.18+envelope*.18,-.42+envelope*.19,-.84);this.support.rotation.set(.3*envelope,.5*envelope,-.3);
   this.root.scale.setScalar(menu?1.18:1);this.root.position.x+=menu?-.02:0;
 }
}
