import * as THREE from 'three';
import {sampleReplay} from './replay.js';
export class RaceGhost {
  constructor(scene){
    this.group=new THREE.Group();scene.add(this.group);this.group.visible=false;this.replay=null;
    const body=new THREE.MeshStandardMaterial({color:0x9effdc,emissive:0x52c7b4,emissiveIntensity:.4,transparent:true,opacity:.42,depthWrite:false,roughness:.35,metalness:.1});
    const detail=new THREE.MeshStandardMaterial({color:0xdffff5,emissive:0x9effdc,emissiveIntensity:.6,transparent:true,opacity:.65,depthWrite:false});
    const add=(geo,material,x,y,z,parent=this.group)=>{const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
    add(new THREE.CapsuleGeometry(.21,.4,4,8),body,0,1.04,0);
    add(new THREE.SphereGeometry(.17,12,8),body,0,1.57,0);
    add(new THREE.BoxGeometry(.24,.045,.12),detail,0,1.59,-.125);
    add(new THREE.BoxGeometry(.25,.23,.12),detail,0,1.13,.16);
    this.limbs=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*.31,1.28,0);this.group.add(arm);add(new THREE.CapsuleGeometry(.07,.43,3,6),body,0,-.23,0,arm);this.limbs.push(arm);
      const leg=new THREE.Group();leg.position.set(side*.12,.77,0);this.group.add(leg);add(new THREE.CapsuleGeometry(.09,.47,3,6),body,0,-.30,0,leg);add(new THREE.BoxGeometry(.17,.11,.29),detail,0,-.66,-.06,leg);this.limbs.push(leg);
    }
    const ring=add(new THREE.TorusGeometry(.36,.014,4,32),detail,0,.025,0);ring.rotation.x=-Math.PI/2;
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;const ctx=canvas.getContext('2d');ctx.font='bold 23px monospace';ctx.textAlign='center';ctx.fillStyle='#a6ffdd';ctx.fillText('YOUR BEST / GHOST',256,40);
    const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,opacity:.8,depthWrite:false}));label.position.y=2.07;label.scale.set(2,.25,1);this.group.add(label);
  }
  set(replay){this.replay=replay;this.group.visible=false;}
  update(time,active,enabled,player){
    const pose=this.replay?sampleReplay(this.replay.frames,time):null;
    this.group.visible=!!(active&&enabled&&pose&&Math.hypot(pose.x-player.x,pose.y-player.y,pose.z-player.z)>.65);
    if(!this.group.visible)return;
    this.group.position.set(pose.x,pose.y,pose.z);this.group.rotation.y=pose.yaw;
    const stride=time>=this.replay.duration?0:Math.sin(time*12)*.65;
    this.limbs.forEach((limb,i)=>limb.rotation.x=stride*(i===0||i===3?1:-1));
  }
}
