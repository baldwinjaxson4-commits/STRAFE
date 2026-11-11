import test from 'node:test';import assert from 'node:assert/strict';
import {createPlayer,stepPlayer,respawnPlayer,FIXED_DT,PHYSICS} from '../src/physics.js';import {courses,makePlatforms,makeWalls,makeSlideObstacles} from '../src/courses.js';import {formatTime} from '../src/storage.js';
const flat=[{x:0,y:0,z:0,w:100,d:100,index:0}];
test('jump rises above each course step and returns to the platform',()=>{const p=createPlayer({x:0,y:0,z:0});let max=0;stepPlayer(p,{jump:true},0,flat);for(let i=0;i<140;i++){stepPlayer(p,{},0,flat);max=Math.max(max,p.y);}assert.ok(max>1.4&&max<1.6);assert.equal(p.y,0);assert.equal(p.grounded,true);});
test('holding jump chains hops without losing forward momentum',()=>{const p=createPlayer({x:0,y:0,z:0});for(let i=0;i<90;i++)stepPlayer(p,{forward:true},0,flat);const speed=Math.hypot(p.vx,p.vz);for(let i=0;i<200;i++)stepPlayer(p,{forward:true,jump:true},0,flat);assert.ok(p.jumps>=3);assert.ok(Math.hypot(p.vx,p.vz)>=speed-.1);});
test('air strafing responds quickly while preserving forward momentum',()=>{const p=createPlayer({x:0,y:2,z:0});p.grounded=false;p.vz=-8;for(let i=0;i<8;i++)stepPlayer(p,{right:true},0,[],FIXED_DT);assert.ok(p.vx>1.5);assert.equal(p.vz,-8);assert.ok(Math.hypot(p.vx,p.vz)>8);});
test('swept vertical collision catches a fast fall',()=>{const p=createPlayer({x:0,y:.1,z:0});p.grounded=false;p.vy=-100;stepPlayer(p,{},0,flat);assert.equal(p.y,0);assert.equal(p.grounded,true);});
test('a fast horizontal crossing still lands at the swept platform contact',()=>{const platform={x:0,y:0,z:0,w:.3,d:1,index:2},p=createPlayer({x:-.5,y:.05,z:0});p.grounded=false;p.vx=120;p.vy=-10;stepPlayer(p,{},0,[platform]);assert.equal(p.grounded,true);assert.equal(p.y,0);assert.equal(p.landed,2);assert.ok(Math.abs(p.x)<.43);});
test('slightly missed platform edges still count as landings',()=>{const platform={x:0,y:0,z:0,w:1,d:1,index:3},p=createPlayer({x:.85,y:.05,z:0});p.grounded=false;p.vy=-10;stepPlayer(p,{},0,[platform]);assert.equal(p.grounded,true);assert.equal(p.y,0);assert.equal(p.landed,3);});
test('a jump just after stepping off a platform gets coyote-time forgiveness',()=>{const platform={x:0,y:0,z:0,w:1,d:1,index:0},p=createPlayer({x:0,y:0,z:-.77});p.vz=-20;stepPlayer(p,{forward:true},0,[platform]);assert.equal(p.grounded,false);assert.ok(p.coyoteTime>0);stepPlayer(p,{jump:true},0,[platform]);assert.equal(p.jumps,1);assert.ok(p.vy>0);});
test('walking off an edge begins a fall',()=>{const p=createPlayer({x:0,y:0,z:0});const tiny=[{x:0,y:0,z:0,w:1,d:1,index:0}];for(let i=0;i<120;i++)stepPlayer(p,{forward:true},0,tiny);assert.ok(p.y<-1);assert.equal(p.grounded,false);});
test('manual hopping requires release before a second hop',()=>{const p=createPlayer({x:0,y:0,z:0});for(let i=0;i<200;i++)stepPlayer(p,{jump:true},0,flat,FIXED_DT,false);assert.equal(p.jumps,1);stepPlayer(p,{jump:false},0,flat,FIXED_DT,false);stepPlayer(p,{jump:true},0,flat,FIXED_DT,false);assert.equal(p.jumps,2);});
test('respawn clears motion and retains jump statistics',()=>{const p=createPlayer();p.jumps=12;p.vx=8;p.vy=-12;respawnPlayer(p,{x:4,y:1,z:-20});assert.equal(p.x,4);assert.equal(p.vx,0);assert.equal(p.vy,0);assert.equal(p.jumps,12);});
test('speed is capped and simulation remains finite',()=>{const p=createPlayer();p.vx=100;p.vz=100;stepPlayer(p,{forward:true,right:true,jump:true},.8,flat);assert.ok(Math.hypot(p.vx,p.vz)<=PHYSICS.maxSpeed+.0001);assert.ok(Number.isFinite(p.y));});
test('all 28 courses have finite geometry and wall routes for extended gaps',()=>{
 assert.equal(courses.length,28);assert.equal(new Set(courses.map(c=>c.id)).size,28);
 for(const c of courses){const p=makePlatforms(c),walls=makeWalls(c,p);assert.equal(p.length,c.count+1);assert.equal(p.at(-1).type,'finish');
  for(let i=1;i<p.length;i++){assert.ok(p[i].y-p[i-1].y<.8);assert.ok(p[i].w>=1.8);assert.ok([p[i].x,p[i].y,p[i].z].every(Number.isFinite));const gap=Math.hypot(p[i].x-p[i-1].x,p[i].z-p[i-1].z)-(p[i].d+p[i-1].d)/2;assert.ok(gap<PHYSICS.maxSpeed*PHYSICS.jump/PHYSICS.gravity*1.8);if(p[i].extended)assert.ok(walls.some(w=>w.index===i&&w.runnable));}
 }
});
test('frontflip is a visual-only airborne action with a cooldown',()=>{
 const grounded=createPlayer();stepPlayer(grounded,{frontflip:true},0,flat);assert.equal(grounded.frontflipTime,0);
 const player=createPlayer({x:0,y:2,z:0});player.grounded=false;
 stepPlayer(player,{frontflip:true},0,[]);assert.equal(player.frontflipTime,PHYSICS.frontflipDuration);assert.equal(player.frontflipCooldown,PHYSICS.frontflipCooldown);
 stepPlayer(player,{frontflip:true},0,[]);assert.ok(player.frontflipTime<PHYSICS.frontflipDuration);assert.equal(player.frontflipCooldown>0,true);
});
test('feather powerup grants exactly one extra jump while airborne',()=>{
 const player=createPlayer({x:0,y:3,z:0});player.grounded=false;player.vy=-2;player.extraJumpCharges=1;
 stepPlayer(player,{airJump:true},0,[]);
 assert.equal(player.extraJumpCharges,0);assert.equal(player.jumps,1);assert.ok(player.vy>6);
 stepPlayer(player,{airJump:true},0,[]);assert.equal(player.jumps,1);
});
test('surge briefly raises the speed cap but normal movement remains capped',()=>{
 const surged=createPlayer({x:0,y:3,z:0});surged.grounded=false;surged.vx=PHYSICS.maxSpeed+2;surged.boostTime=PHYSICS.surgeDuration+FIXED_DT;
 stepPlayer(surged,{},0,[]);assert.ok(Math.hypot(surged.vx,surged.vz)<=PHYSICS.maxSpeed+PHYSICS.surgeSpeedBonus+.001);
 const normal=createPlayer({x:0,y:3,z:0});normal.grounded=false;normal.vx=PHYSICS.maxSpeed+2;
 stepPlayer(normal,{},0,[]);assert.ok(Math.hypot(normal.vx,normal.vz)<=PHYSICS.maxSpeed+.001);
});
test('player is carried with a moving platform after landing',()=>{
 const platform={x:0,y:0,z:0,w:10,d:10,index:1},p=createPlayer({x:0,y:.05,z:0});p.grounded=false;p.vy=-10;
 stepPlayer(p,{},0,[platform]);assert.equal(p.grounded,true);assert.equal(p.supportIndex,1);
 platform.x=.5;stepPlayer(p,{},0,[platform]);assert.equal(p.x,.5);assert.equal(p.grounded,true);
});
test('landing on an alternate platform does not attach to its matching mainline platform',()=>{
 const mainline={x:10,y:0,z:0,w:10,d:10,index:1},alternate={x:0,y:0,z:0,w:10,d:10,index:1,type:'alternate'},p=createPlayer({x:0,y:.05,z:0});
 p.grounded=false;p.vy=-10;stepPlayer(p,{},0,[mainline,alternate]);
 assert.equal(p.grounded,true);assert.equal(p.supportIndex,null);
 mainline.x=11;stepPlayer(p,{},0,[mainline,alternate]);assert.equal(p.x,0);
});
test('timer formatting handles minutes and milliseconds',()=>{assert.equal(formatTime(65.432),'01:05.432');assert.equal(formatTime(0),'00:00.000');});

const runWall=[{x:.75,z:-30,w:.8,d:200,bottom:-20,top:15,runnable:true}];
test('Shift activates wall run only when airborne near a real wall',()=>{const p=createPlayer({x:0,y:3,z:0});p.grounded=false;p.vz=-8;stepPlayer(p,{forward:true,wallRun:true},0,[],FIXED_DT,true,runWall);assert.equal(p.wallRunning,true);assert.ok(p.wallTime>0);assert.ok(Math.abs(p.vz)>=10);const distant=createPlayer({x:-5,y:3,z:0});distant.grounded=false;distant.vz=-8;stepPlayer(distant,{forward:true,wallRun:true},0,[],FIXED_DT,true,runWall);assert.equal(distant.wallRunning,false);});
test('wall run cannot exceed three seconds before landing',()=>{const p=createPlayer({x:0,y:8,z:0});p.grounded=false;p.vz=-8;let active=0;for(let i=0;i<500;i++){stepPlayer(p,{forward:true,wallRun:true},0,[],FIXED_DT,true,runWall);if(p.wallRunning)active++;}assert.ok(active<=360);assert.equal(p.wallTime,3);assert.equal(p.wallRunning,false);});
test('releasing Shift does not refill wall stamina in the air',()=>{const p=createPlayer({x:0,y:5,z:0});p.grounded=false;p.vz=-8;for(let i=0;i<100;i++)stepPlayer(p,{wallRun:true},0,[],FIXED_DT,true,runWall);const spent=p.wallTime;stepPlayer(p,{},0,[],FIXED_DT,true,runWall);assert.equal(p.wallTime,spent);assert.equal(p.wallRunning,false);});
test('landing refills the wall-run ability',()=>{const p=createPlayer({x:0,y:.02,z:0});p.grounded=false;p.vy=-4;p.wallTime=2.9;stepPlayer(p,{},0,flat);assert.equal(p.wallTime,0);assert.equal(p.grounded,true);});
test('fresh Space while wall running kicks away from the wall',()=>{const p=createPlayer({x:0,y:3,z:0});p.grounded=false;p.vz=-8;stepPlayer(p,{wallRun:true,wallJump:true},0,[],FIXED_DT,true,runWall);assert.ok(p.vx<0);assert.ok(p.vy>6);assert.equal(p.wallRunning,false);assert.ok(p.wallCooldown>0);});
test('a fresh Space press after a wall run can kick toward and run on the next wall',()=>{
 const p=createPlayer({x:0,y:3,z:0});p.grounded=false;p.vz=-8;
 const walls=[...runWall,{x:-.75,z:0,w:.8,d:200,bottom:-20,top:20,runnable:true}];
 stepPlayer(p,{wallRun:true},0,[],FIXED_DT,true,walls);assert.equal(p.wallRunning,true);
 stepPlayer(p,{wallJump:true},0,[],FIXED_DT,true,walls);assert.ok(p.vx<0);assert.ok(p.vy>6);
 let caughtNextWall=false;
 for(let i=0;i<40;i++){stepPlayer(p,{wallRun:true},0,[],FIXED_DT,true,walls);if(p.wallRunning&&p.wallSide>0){caughtNextWall=true;break;}}
 assert.equal(caughtNextWall,true);
});
test('solid wall collision blocks crossing its face',()=>{const p=createPlayer({x:-1,y:1,z:0});p.grounded=false;p.vx=20;for(let i=0;i<20;i++)stepPlayer(p,{right:true},0,[],FIXED_DT,true,runWall);assert.ok(p.x<=.75-.4-PHYSICS.radius+.0001);});
test('holding C slides under a low obstacle and ends after the time limit',()=>{
 const floor=[{x:0,y:0,z:0,w:12,d:50,index:0}],gate={x:0,z:0,w:12,d:1.2,bottom:.82,top:1.3,kind:'slide'};
 const p=createPlayer({x:0,y:0,z:2});p.vz=-6;
 stepPlayer(p,{forward:true,slide:true},0,floor,FIXED_DT,true,[],[gate]);
 assert.equal(p.sliding,true);assert.ok(Math.hypot(p.vx,p.vz)>6);
 for(let i=0;i<140;i++)stepPlayer(p,{forward:true,slide:true},0,floor,FIXED_DT,true,[],[gate]);
 assert.ok(p.z<-.9);assert.equal(p.sliding,false);assert.equal(p.grounded,true);
 assert.equal(p.slideBlocked,true);
});
test('releasing C ends a slide immediately and a fresh hold can start another',()=>{
 const floor=[{x:0,y:0,z:0,w:12,d:50,index:0}],p=createPlayer({x:0,y:0,z:0});p.vz=-6;
 stepPlayer(p,{slide:true},0,floor);assert.equal(p.sliding,true);
 stepPlayer(p,{},0,floor);assert.equal(p.sliding,false);assert.equal(p.slideBlocked,false);
 p.vz=-6;stepPlayer(p,{slide:true},0,floor);assert.equal(p.sliding,true);
});
test('a midair slide queues through gate contact and starts on landing before auto-hop',()=>{
 const floor=[{x:0,y:0,z:0,w:12,d:50,index:0}],gate={x:0,z:0,w:12,d:1.2,bottom:.82,top:1.3,kind:'slide'};
 const p=createPlayer({x:0,y:1.5,z:2});p.grounded=false;p.vy=-5;p.vz=-8;
 stepPlayer(p,{slide:true},0,floor,FIXED_DT,true,[],[gate]);
 assert.equal(p.sliding,false);assert.equal(p.slideQueued,true);
 for(let i=0;i<100&&!p.grounded;i++)stepPlayer(p,{slide:true},0,floor,FIXED_DT,true,[],[gate]);
 assert.equal(p.grounded,true);assert.equal(p.sliding,true);assert.equal(p.slideQueued,false);
 assert.ok(p.vz< -PHYSICS.slideStartSpeed);assert.ok(p.z>=gate.d/2+PHYSICS.radius-.01);
 stepPlayer(p,{jump:true,slide:true},0,floor,FIXED_DT,true,[],[gate]);assert.equal(p.grounded,true);assert.equal(p.sliding,true);
 for(let i=0;i<30;i++)stepPlayer(p,{forward:true,slide:true},0,floor,FIXED_DT,true,[],[gate]);
 assert.ok(p.z< -gate.d/2-PHYSICS.radius);
});
test('slide input cannot start below the minimum speed and standing collision blocks the gate',()=>{
 const floor=[{x:0,y:0,z:0,w:12,d:50,index:0}],gate={x:0,z:0,w:12,d:1.2,bottom:.82,top:1.3,kind:'slide'};
 const stationary=createPlayer({x:0,y:0,z:2});stepPlayer(stationary,{slide:true},0,floor,FIXED_DT,true,[],[gate]);assert.equal(stationary.sliding,false);
 const runner=createPlayer({x:0,y:0,z:2});runner.vz=-6;
 for(let i=0;i<120;i++)stepPlayer(runner,{forward:true},0,floor,FIXED_DT,true,[],[gate]);
 assert.ok(runner.z>.8);
});
test('sliding still adds momentum but no longer causes an oversized speed spike',()=>{
 const p=createPlayer({x:0,y:0,z:0});p.vz=-20;
 stepPlayer(p,{slide:true},0,flat);
 const speed=Math.hypot(p.vx,p.vz);
 assert.ok(speed>20);
 assert.ok(speed<22);
 assert.equal(PHYSICS.slideBoost,1.08);
});
test('selected courses receive low-clearance obstacles at valid platform positions',()=>{
 const course=courses.find(c=>c.id==='wall-school'),platforms=makePlatforms(course),obstacles=makeSlideObstacles(course,platforms);
 assert.ok(obstacles.length>=3);assert.ok(obstacles.every(o=>o.kind==='slide'&&o.bottom>platforms[o.index].y&&o.top>o.bottom));
 for(const course of courses){
  const platforms=makePlatforms(course),obstacles=makeSlideObstacles(course,platforms);
  assert.ok(obstacles.length>=2,`${course.name} should offer multiple slide obstacles`);
  assert.ok(obstacles.every(o=>o.index<course.count&&o.bottom>platforms[o.index].y));
 }
});
test('course platforms add forward runway without shifting their approach edges',()=>{
 const course=courses.find(c=>c.id==='wall-school'),platforms=makePlatforms(course);
 for(let i=1;i<platforms.length-1;i++){
  const platform=platforms[i],checkpoint=platform.type==='checkpoint';
  const originalDepth=course.width+(checkpoint?1.4:0);
  assert.ok(Math.abs(platform.d-(originalDepth+1.2))<1e-9);
  assert.ok(Math.abs(platform.z+platform.d/2-(5-i*course.spacing+originalDepth/2))<1e-9);
 }
 for(const obstacle of makeSlideObstacles(course,platforms)){
  const platform=platforms[obstacle.index],originalDepth=course.width+(platform.type==='checkpoint'?1.4:0);
  const runwayAfterGate=obstacle.z-obstacle.d/2-(platform.z-platform.d/2);
  assert.ok(Math.abs(runwayAfterGate-(originalDepth/2+.6))<1e-9);
 }
});
