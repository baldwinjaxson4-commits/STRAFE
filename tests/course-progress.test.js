import test from 'node:test';
import assert from 'node:assert/strict';
import {courses,makePlatforms} from '../src/courses.js';
import {checkpointSpawn,crossedFinishLine} from '../src/course-progress.js';
import {createPlayer,respawnPlayer,stepPlayer,FIXED_DT,PHYSICS} from '../src/physics.js';
const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));

function canLandWithJump(previous,next){
  const radius=PHYSICS.radius;
  const dy=next.y-previous.y,discriminant=PHYSICS.jump**2-2*PHYSICS.gravity*dy;
  if(discriminant<0)return false;
  const airtime=(PHYSICS.jump+Math.sqrt(discriminant))/PHYSICS.gravity;
  const startX=clamp(next.x,previous.x-previous.w/2+radius,previous.x+previous.w/2-radius);
  const startZ=previous.z-previous.d/2+radius+.02;
  const targetX=clamp(startX,next.x-next.w/2+radius+.02,next.x+next.w/2-radius-.02);
  const targetZ=clamp(startZ,next.z-next.d/2+radius+.02,next.z+next.d/2-radius-.02);
  const dx=targetX-startX,dz=targetZ-startZ,distance=Math.hypot(dx,dz);
  const connectedOnGround=Math.abs(dy)<.015
    &&Math.abs(next.x-previous.x)<=(previous.w+next.w)/2+radius*2
    &&Math.abs(next.z-previous.z)<=(previous.d+next.d)/2+radius*2;
  if(connectedOnGround)return true;
  const speed=distance/airtime;
  if(speed>PHYSICS.maxSpeed)return false;
  const player=createPlayer({x:startX,y:previous.y,z:startZ});
  player.vx=distance?dx/distance*speed:0;player.vz=distance?dz/distance*speed:0;
  for(let i=0;i<180;i++){
    stepPlayer(player,{jump:i===0},0,[previous,next],FIXED_DT,true);
    if(player.landed===next.index)return true;
    if(player.y<previous.y-3)return false;
  }
  return false;
}

test('every course has a continuous jump-reachable mainline from start through finish',()=>{
  for(const course of courses){
    const platforms=makePlatforms(course);
    assert.equal(platforms[0].type,'start');
    assert.equal(platforms.at(-1).type,'finish');
    for(let i=1;i<platforms.length;i++){
      const previous=platforms[i-1],next=platforms[i],rise=next.y-previous.y;
      const discriminant=PHYSICS.jump**2-2*PHYSICS.gravity*rise;
      assert.ok(discriminant>=0,`${course.name} jump ${i} has achievable vertical rise`);
      const airtime=(PHYSICS.jump+Math.sqrt(discriminant))/PHYSICS.gravity;
      const movement=Math.hypot(
        Math.max(0,Math.abs(next.x-previous.x)-(previous.w+next.w)/2-PHYSICS.radius*2-next.moveAmplitude),
        Math.max(0,Math.abs(next.z-previous.z)-(previous.d+next.d)/2-PHYSICS.radius*2),
      );
      assert.ok(movement<=PHYSICS.maxSpeed*airtime,`${course.name} jump ${i} is within reachable air distance`);
      assert.ok(canLandWithJump(previous,next),`${course.name} transition ${i} is reachable in the fixed-step physics`);
    }
  }
});
test('Terminal course opening jump remains reachable after widening the first pads',()=>{
 const platforms=makePlatforms(courses.find(course=>course.id==='terminal'));
 assert.ok(platforms[0].d>15);
 assert.ok(platforms[0].w>8);
 assert.ok(platforms[1].d>3.5);
 assert.ok(platforms[1].w>2.15);
 assert.ok(canLandWithJump(platforms[0],platforms[1]));
});

test('every course has reachable checkpoint spawn data for each checkpoint platform',()=>{
  for(const course of courses){
    const platforms=makePlatforms(course),checkpoints=platforms.filter(platform=>platform.type==='checkpoint');
    assert.ok(checkpoints.length>0,`${course.name} has checkpoints`);
    for(const platform of checkpoints){
      assert.deepEqual(checkpointSpawn(platforms,platform.index),{x:platform.x,y:platform.y,z:platform.z});
      const player=createPlayer({x:platform.x,y:platform.y+.05,z:platform.z});
      player.grounded=false;player.vy=-10;
      stepPlayer(player,{},0,platforms);
      assert.equal(player.landed,platform.index,`${course.name} checkpoint ${platform.index} can be landed on`);
      respawnPlayer(player,checkpointSpawn(platforms,platform.index));
      assert.deepEqual({x:player.x,y:player.y,z:player.z},{x:platform.x,y:platform.y,z:platform.z});
    }
    assert.equal(checkpointSpawn(platforms,-1),null);
  }
});
test('finish triggers catch a swept crossing through the marked finish arch',()=>{
  for(const course of courses){
    const finish=makePlatforms(course).at(-1),line=finish.z+finish.d/2;
    assert.equal(crossedFinishLine(
      {x:finish.x,y:finish.y+1,z:line+.2},
      {x:finish.x,y:finish.y+1,z:line-.2},
      finish,
    ),true,`${course.name} finish is detected`);
    assert.equal(crossedFinishLine({x:finish.x,y:finish.y+6,z:line+.2},{x:finish.x,y:finish.y+6,z:line-.2},finish),false);
    assert.equal(crossedFinishLine({x:finish.x+finish.w,y:finish.y+1,z:line+.2},{x:finish.x+finish.w,y:finish.y+1,z:line-.2},finish),false);
    assert.equal(crossedFinishLine({x:finish.x,y:finish.y+1,z:line-.2},{x:finish.x,y:finish.y+1,z:line+.2},finish),false);
  }
});
