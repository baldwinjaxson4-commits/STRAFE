import * as THREE from 'three';
const themes={
 coastal:{density:.009,hemi:0xd4efff,ground:0x294c58,sun:0xfff5df,intensity:3.4,concrete:0xc3c9c8,dark:0x718a8e,roughness:.84,metal:.03,glow:.22},
 volcanic:{density:.012,hemi:0xffb789,ground:0x341e24,sun:0xffbd91,intensity:3.8,concrete:0x494447,dark:0x252328,roughness:.98,metal:.03,glow:.7},
 neon:{density:.007,hemi:0xbac8ff,ground:0x202542,sun:0xcac5ff,intensity:2.8,concrete:0x344055,dark:0x1d2541,roughness:.84,metal:.28,glow:1.1},
 arctic:{density:.007,hemi:0xe9fdff,ground:0x385d70,sun:0xd7f8ff,intensity:3.8,concrete:0x8db7c7,dark:0x355d73,roughness:.34,metal:.18,glow:.42},
 industrial:{density:.01,hemi:0xffd5a5,ground:0x47352c,sun:0xffc078,intensity:3.5,concrete:0x665d54,dark:0x302a27,roughness:.92,metal:.42,glow:.65},
 canopy:{density:.008,hemi:0xc9f5d2,ground:0x244b3a,sun:0xe0ffc0,intensity:3.2,concrete:0x48664e,dark:0x213b34,roughness:.9,metal:.05,glow:.45},
 orbital:{density:.004,hemi:0xc9d2ff,ground:0x171b3b,sun:0xc3c7ff,intensity:2.7,concrete:0x414766,dark:0x1d203b,roughness:.42,metal:.55,glow:.85},
};
function makeSurfaceMaps(){
 const size=128,height=new Float32Array(size*size),normalCanvas=document.createElement('canvas'),roughCanvas=document.createElement('canvas');
 normalCanvas.width=normalCanvas.height=roughCanvas.width=roughCanvas.height=size;
 const normalContext=normalCanvas.getContext('2d'),roughContext=roughCanvas.getContext('2d');
 const normalImage=normalContext.createImageData(size,size),roughImage=roughContext.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x;
  height[i]=Math.sin(x*.31+Math.sin(y*.13)*2)*.45+Math.sin(y*.47-x*.19)*.28+Math.sin(x*.91+y*.73)*.12;
  const variation=Math.round(190+Math.sin(x*.23)*8+Math.cos(y*.19)*7);
  roughImage.data.set([variation,variation,variation,255],i*4);
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,left=height[y*size+(x+size-1)%size],right=height[y*size+(x+1)%size];
  const up=height[((y+size-1)%size)*size+x],down=height[((y+1)%size)*size+x];
  const nx=(left-right)*1.8,ny=(up-down)*1.8,nz=1,length=Math.hypot(nx,ny,nz);
  normalImage.data.set([Math.round((nx/length*.5+.5)*255),Math.round((ny/length*.5+.5)*255),Math.round((nz/length*.5+.5)*255),255],i*4);
 }
 normalContext.putImageData(normalImage,0,0);roughContext.putImageData(roughImage,0,0);
 const normalMap=new THREE.CanvasTexture(normalCanvas),roughnessMap=new THREE.CanvasTexture(roughCanvas);
 for(const map of [normalMap,roughnessMap]){map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(1.2,1.2);map.anisotropy=4;}
 return{normalMap,roughnessMap};
}
export class World{
 constructor(renderer){this.renderer=renderer;this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2(0x91b6c4,.009);this.group=new THREE.Group();this.scene.add(this.group);this.texture=new THREE.TextureLoader().load('/art/concrete.jpg');this.texture.wrapS=this.texture.wrapT=THREE.RepeatWrapping;this.texture.colorSpace=THREE.SRGBColorSpace;this.texture.repeat.set(1.2,1.2);this.texture.anisotropy=4;this.surfaceMaps=makeSurfaceMaps();this.movingPlatformMeshes=new Map();this.powerupMeshes=[];
 this.hemisphere=new THREE.HemisphereLight(0xd4efff,0x294c58,2.4);this.scene.add(this.hemisphere);const sun=new THREE.DirectionalLight(0xfff5df,3.4);sun.position.set(-25,65,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=50;sun.shadow.camera.bottom=-70;sun.shadow.camera.far=150;sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;this.scene.add(sun);this.sun=sun;
 const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x5089ae)},bottom:{value:new THREE.Color(0xc5dde2)}},vertexShader:'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vPosition;uniform vec3 top;uniform vec3 bottom;void main(){float h=normalize(vPosition).y;gl_FragColor=vec4(mix(bottom,top,smoothstep(-.05,.7,h)),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});this.sky=new THREE.Mesh(new THREE.SphereGeometry(700,24,12),skyMat);this.scene.add(this.sky);
 this.waterMaterial=new THREE.ShaderMaterial({transparent:true,uniforms:{time:{value:0},color:{value:new THREE.Color(0x225b68)},fogColor:{value:new THREE.Color(0x91b6c4)}},vertexShader:'uniform float time;varying vec3 vWorld;void main(){vec3 p=position;p.z+=sin(p.x*.11+time*.7)*.22+cos(p.y*.14+time*.5)*.18;vec4 wp=modelMatrix*vec4(p,1.);vWorld=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}',fragmentShader:'uniform float time;uniform vec3 color;uniform vec3 fogColor;varying vec3 vWorld;void main(){vec2 p=vWorld.xz;float w=sin(p.x*1.6+sin(p.y*.8+time)*2.+time)*cos(p.y*1.3-time*.7);float fine=sin(p.x*6.+time*1.2)*cos(p.y*5.1+sin(p.x*1.2)+time);float foam=pow(max(0.,w),10.)*.23+pow(max(0.,fine),18.)*.08;vec3 c=color+vec3(foam*.65,foam*.85,foam);float dist=distance(cameraPosition,vWorld);float fog=1.-exp(-dist*.004);gl_FragColor=vec4(mix(c,fogColor,fog),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 this.lavaMaterial=new THREE.ShaderMaterial({uniforms:{time:{value:0},fogColor:{value:new THREE.Color(0x583744)}},vertexShader:'varying vec3 vWorld;void main(){vec4 wp=modelMatrix*vec4(position,1.);vWorld=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}',fragmentShader:'uniform float time;uniform vec3 fogColor;varying vec3 vWorld;void main(){vec2 p=vWorld.xz*.055;float flow=sin(p.x*3.+sin(p.y*2.+time*.22)*1.8+time*.35)*cos(p.y*2.7-time*.28);float crack=1.-smoothstep(.025,.11,abs(flow));float crust=smoothstep(-.2,.65,flow);vec3 c=mix(vec3(.13,.018,.025),vec3(.48,.055,.018),crust);c=mix(c,vec3(1.,.28,.025),crack*.9);c+=vec3(1.,.16,.025)*pow(max(0.,flow),8.)*.55;float fog=1.-exp(-distance(cameraPosition,vWorld)*.003);gl_FragColor=vec4(mix(c,fogColor,fog),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const water=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400,170,170),this.waterMaterial);water.rotation.x=-Math.PI/2;water.position.set(0,-4,-100);this.scene.add(water);
 }
 clear(){for(const child of [...this.group.children]){this.group.remove(child);child.traverse(o=>{o.geometry?.dispose();if(o.material?.map&&o.material.map!==this.texture&&o.material.map!==this.surfaceMaps.normalMap&&o.material.map!==this.surfaceMaps.roughnessMap)o.material.map.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});}this.movingPlatformMeshes.clear();this.powerupMeshes=[];}
 setShadowQuality(quality){
   const enabled=quality!=='off',mapSize=quality==='low'?1024:2048;
   this.renderer.shadowMap.enabled=enabled;
   this.sun.castShadow=enabled;
   if(this.sun.shadow.mapSize.x!==mapSize||this.sun.shadow.mapSize.y!==mapSize){
     this.sun.shadow.dispose();
     this.sun.shadow.mapSize.set(mapSize,mapSize);
   }
 }
 box(w,h,d,x,y,z,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;this.group.add(m);return m;}
 text(text,color='#d5fce9'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.font='600 50px monospace';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,256,80);const tex=new THREE.CanvasTexture(c);const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});const m=new THREE.Mesh(new THREE.PlaneGeometry(4,1),mat);this.group.add(m);return m;}
 load(course,platforms,walls=[],obstacles=[],powerups=[]){this.clear();this.course=course;const theme={...(themes[course.environment]??themes.coastal),concrete:course.surface??(themes[course.environment]??themes.coastal).concrete,dark:course.darkSurface??(themes[course.environment]??themes.coastal).dark,roughness:course.surfaceRoughness??(themes[course.environment]??themes.coastal).roughness,metal:course.surfaceMetalness??(themes[course.environment]??themes.coastal).metal};const seed=course.scenerySeed??0;this.scene.fog.color.set(course.sky);this.scene.fog.density=theme.density;this.hemisphere.color.set(theme.hemi);this.hemisphere.groundColor.set(theme.ground);this.sun.color.set(theme.sun);this.sun.intensity=theme.intensity;this.waterMaterial.uniforms.color.value.set(course.water);this.waterMaterial.uniforms.fogColor.value.set(course.sky);this.lavaMaterial.uniforms.fogColor.value.set(course.sky);this.waterMaterial.visible=course.environment!=='volcanic';this.lavaMaterial.visible=course.environment==='volcanic';this.lavaMaterial.uniforms.time.value=0;this.sky.material.uniforms.top.value.set(course.sky).multiplyScalar(.73);this.sky.material.uniforms.bottom.value.set(course.sky).lerp(new THREE.Color(0xe4edf0),.48);
 const volcanic=course.environment==='volcanic',neon=course.environment==='neon',canopy=course.environment==='canopy',orbital=course.environment==='orbital',surface={normalMap:this.surfaceMaps.normalMap,roughnessMap:this.surfaceMaps.roughnessMap,normalScale:new THREE.Vector2(.32,.32)};const concrete=new THREE.MeshStandardMaterial({color:theme.concrete,map:this.texture,...surface,roughness:theme.roughness,metalness:theme.metal});const dark=new THREE.MeshStandardMaterial({color:theme.dark,map:this.texture,...surface,roughness:theme.roughness,metalness:theme.metal});const trim=new THREE.MeshStandardMaterial({color:course.color,emissive:course.color,emissiveIntensity:theme.glow,roughness:(neon||orbital) ? 0.3 : 0.45,metalness:theme.metal});const white=new THREE.MeshStandardMaterial({color:0xe4e9e6,roughness:.9});
 if(volcanic){const floor=new THREE.Mesh(new THREE.PlaneGeometry(520,520),this.lavaMaterial);floor.rotation.x=-Math.PI/2;floor.position.set(0,-3.95,-82);this.group.add(floor);}
 if(volcanic||neon||canopy||course.environment==='industrial')for(let i=0;i<5;i++){const color=volcanic?0xff5424:neon?0x8e72ff:canopy?0x79ffad:0xffa43c,light=new THREE.PointLight(color,volcanic?9:5,volcanic?42:34,2);light.position.set(i%2?-8:8,volcanic?-.4:4,-18-i*36);this.group.add(light);}
 for(const p of platforms){const firstObject=this.group.children.length;this.box(p.w,2.5,p.d,p.x,p.y-1.25,p.z,p.type==='alternate'?dark:concrete);this.box(Math.max(.5,p.w-.2),.035,Math.max(.5,p.d-.2),p.x,p.y+.018,p.z,concrete);this.box(p.w,.055,.055,p.x,p.y+.045,p.z+p.d/2-.04,trim);this.box(.055,.055,p.d,p.x-p.w/2+.04,p.y+.045,p.z,trim);this.box(.055,.055,p.d,p.x+p.w/2-.04,p.y+.045,p.z,trim);if(p.moving){this.box(p.w+.35,.09,p.d+.35,p.x,p.y-2.56,p.z,trim);}
 if(p.type==='alternate'){const route=this.text('ALT ROUTE');route.scale.setScalar(.38);route.position.set(p.x,p.y+.08,p.z);}
 if(p.type==='checkpoint'){
 this.box(.14,3.6,.14,p.x-p.w/2,p.y+1.8,p.z,trim);this.box(.14,3.6,.14,p.x+p.w/2,p.y+1.8,p.z,trim);this.box(p.w,.14,.14,p.x,p.y+3.6,p.z,trim);const label=this.text('CHECKPOINT');label.position.set(p.x,p.y+4.1,p.z);
 }if(p.type==='finish'){this.box(.5,5,.6,p.x-3,p.y+2.5,p.z,white);this.box(.5,5,.6,p.x+3,p.y+2.5,p.z,white);this.box(6.5,.5,.6,p.x,p.y+5,p.z,white);const label=this.text('FINISH');label.position.set(p.x,p.y+4.2,p.z+.35);}
 if(p.index>0&&p.index%2===0){const label=this.text(String(p.index).padStart(2,'0'),'#ffffffb0');label.position.set(p.x,p.y-1.0,p.z+p.d/2+.013);label.scale.setScalar(.42);}
 if(p.moving)this.movingPlatformMeshes.set(p.index,this.group.children.slice(firstObject).map(object=>({object,offsetX:object.position.x-p.x,offsetZ:object.position.z-p.z})));
 }
 for(const powerup of powerups){
   const group=new THREE.Group(),color=powerup.type==='surge'?0xffd76a:0x8bf4c5;
   const core=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.8,metalness:.25,roughness:.25});
   const ringMat=new THREE.MeshStandardMaterial({color:0xeaffff,emissive:color,emissiveIntensity:1.2,metalness:.45,roughness:.22});
   const shape=powerup.type==='surge'?new THREE.OctahedronGeometry(.27,1):new THREE.IcosahedronGeometry(.25,0);
   const center=new THREE.Mesh(shape,core);group.add(center);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,6,24),ringMat);ring.rotation.x=Math.PI/2;group.add(ring);
   group.position.set(powerup.x,powerup.y,powerup.z);group.userData={baseY:powerup.y,phase:powerups.indexOf(powerup)};
   this.group.add(group);this.powerupMeshes.push({id:powerup.id,group});
 }
 // Solid, runnable walls share the exact dimensions used by collision.
 for(const wall of walls){
   if(wall.kind==='roof'){
     this.box(wall.w,wall.top-wall.bottom,wall.d,wall.x,(wall.top+wall.bottom)/2,wall.z,dark);
     this.box(wall.w,.07,.07,wall.x,wall.bottom,wall.z-wall.d/2+.05,trim);
     continue;
   }
   this.box(wall.w,wall.top-wall.bottom,wall.d,wall.x,(wall.top+wall.bottom)/2,wall.z,dark);
   const side=wall.side||1;
   this.box(.045,.075,wall.d-.15,wall.x-side*(wall.w/2+.025),Math.max(0,wall.bottom+2.5)+1.2,wall.z,trim);
   this.box(wall.w+.04,.07,wall.d,wall.x,wall.top+.04,wall.z,trim);
   if(wall.kind==='run'){
     const sign=this.text('SHIFT  /  WALL RUN');sign.scale.setScalar(.75);sign.position.set(wall.x-side*(wall.w/2+.03),wall.bottom+4.5,wall.z);sign.rotation.y=-side*Math.PI/2;
   }
 }
 for(const obstacle of obstacles){
   this.box(obstacle.w,obstacle.top-obstacle.bottom,obstacle.d,obstacle.x,(obstacle.top+obstacle.bottom)/2,obstacle.z,dark);
   this.box(obstacle.w+.08,.08,obstacle.d+.08,obstacle.x,obstacle.bottom+.05,obstacle.z,trim);
   const front=obstacle.z+obstacle.d/2+.045;
   const stripeCount=Math.max(3,Math.floor(obstacle.w/.55));
   for(let i=0;i<stripeCount;i++){
     const x=obstacle.x-obstacle.w/2+(i+.5)*obstacle.w/stripeCount;
     this.box(.16,.06,.035,x,obstacle.bottom+.25,front,white);
   }
   const sign=this.text('C  /  SLIDE UNDER');
   sign.scale.setScalar(.42);sign.position.set(obstacle.x,obstacle.bottom+.24,front+.02);
 }
 // Architectural scenery is kept beyond the playable route.
 for(let i=2;i<20;i++){const side=i%2?1:-1;const x=side*(17+Math.sin(i*2.5+seed)*6),z=8-i*15-(seed%1)*5;const h=10+((i*13+Math.floor(seed*11))%21);this.box(volcanic?3:2.2,h,3,x,h/2-4,z,dark);if(i%3===0){this.box(1.2,h+5,2,x+side*4,(h+5)/2-4,z-3,concrete);this.box(9,.7,2,x+side*3,h*.6,z,concrete);}}
 if(neon)for(let i=0;i<14;i++){const side=i%2?1:-1,x=side*(18+(i%3)*3),z=4-i*15,h=9+(i%4)*3;const tower=this.box(1.1,h,1.1,x,h/2-2,z,dark);tower.material=trim;this.box(1.35,.1,1.35,x,h-1.9,z,trim);}
 if(canopy)for(let i=0;i<18;i++){const side=i%2?1:-1,x=side*(14+(i%4)*2),z=2-i*12,h=8+(i%5)*2;this.box(.65,h,.65,x,h/2-3,z,dark);const crown=new THREE.Mesh(new THREE.ConeGeometry(2.2+(i%3)*.4,4,7),trim);crown.position.set(x,h-1,z);this.group.add(crown);}
 if(orbital)for(let i=0;i<7;i++){const planet=new THREE.Mesh(new THREE.SphereGeometry(3+(i%3),16,12),dark);planet.position.set((i%2?1:-1)*(20+i%3*3),8+(i%3)*4,-20-i*42);this.group.add(planet);const orbit=new THREE.Mesh(new THREE.TorusGeometry(5+(i%3),.12,6,40),trim);orbit.position.copy(planet.position);orbit.rotation.x=.45+i*.07;this.group.add(orbit);}
 const landmarkCount=3+Math.floor(seed%3);for(let i=0;i<landmarkCount;i++){const side=i%2?1:-1,x=side*(15+(i%3)*4+Math.sin(seed+i)*2),z=-13-i*31-(seed%1)*7,height=10+(i*3+Math.floor(seed*5))%7;this.box(1.2,height,2,x,2,z,concrete);this.box(1.2,height,2,x+side*9,2,z,concrete);this.box(10.2,1.2,2,x+side*4.5,height*.62,z,concrete);this.box(.12,4,.06,x+side*7.5,4.6,z+1.04,trim).rotation.z=-.4;}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(6+seed%5,1,4,48),concrete);ring.position.set(-29-seed%7,14,-92-seed%11);this.group.add(ring);
 const startLine=this.text('START  /  →');startLine.rotation.x=-Math.PI/2;startLine.position.set(0,.013,1.1);startLine.rotation.z=Math.PI;
 }
 collectPowerup(id){const pickup=this.powerupMeshes.find(item=>item.id===id);if(pickup)pickup.group.visible=false;}
 resetPowerups(){for(const pickup of this.powerupMeshes)pickup.group.visible=true;}
 updatePowerups(time){for(const {group} of this.powerupMeshes){group.position.y=group.userData.baseY+Math.sin(time*3+group.userData.phase)*.12;group.rotation.y=time*1.25;}}
 syncPlatforms(platforms){
   for(const p of platforms){
     if(!p.moving)continue;
     for(const {object,offsetX,offsetZ} of this.movingPlatformMeshes.get(p.index)??[]){
       object.position.x=p.x+offsetX;
       object.position.z=p.z+offsetZ;
     }
   }
 }
 update(time,camera){this.waterMaterial.uniforms.time.value=time;this.lavaMaterial.uniforms.time.value=time;this.sky.position.copy(camera.position);this.sun.position.z=camera.position.z+25;this.sun.target.position.set(0,0,camera.position.z-20);this.sun.target.updateMatrixWorld();this.updatePowerups(time);}
 dispose(){this.clear();this.texture.dispose();this.surfaceMaps.normalMap.dispose();this.surfaceMaps.roughnessMap.dispose();}
}
