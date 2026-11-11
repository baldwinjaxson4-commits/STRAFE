import test from 'node:test';
import assert from 'node:assert/strict';
import {courses,makePlatforms,makeWalls,makeAlternatePlatforms,makePowerups,makeSlideObstacles,updateMovingPlatforms} from '../src/courses.js';

test('course picker is arranged from the training route through progressively harder tiers',()=>{
 const tier={INTRO:0,FLOW:1,TECH:2,EXPERT:3,MASTER:4};
 assert.equal(courses[0].id,'movement-lab');
 for(let i=1;i<courses.length;i++)assert.ok(tier[courses[i-1].difficulty]<=tier[courses[i].difficulty],`${courses[i].name} should not precede an easier difficulty tier`);
 assert.equal(new Set(courses.map(course=>course.id)).size,courses.length);
});
test('Movement Lab teaches strafe and wall-run stages in a short beginner route',()=>{
 const course=courses.find(item=>item.id==='movement-lab');
 const platforms=makePlatforms(course),walls=makeWalls(course,platforms);
 assert.ok(course.training);
 assert.equal(course.count,12);
 assert.ok(platforms.slice(1,5).some(p=>p.x>1));
 assert.ok(platforms.slice(1,5).some(p=>p.x< -1));
 assert.ok(walls.some(w=>w.runnable&&w.index===4));
});
test('moving platforms follow a repeatable horizontal motion path',()=>{
 const course=courses.find(item=>item.id==='overpass'),platforms=makePlatforms(course);
 const pad=platforms.find(p=>p.moving);
 assert.ok(pad);
 updateMovingPlatforms(platforms,0);const start=pad.x;
 updateMovingPlatforms(platforms,pad.movePeriod/4);
 assert.ok(Math.abs(pad.x-start)>pad.moveAmplitude*.5);
 updateMovingPlatforms(platforms,pad.movePeriod);
 assert.ok(Math.abs(pad.x-start)<1e-8);
});
test('indoor and tunnel courses receive solid overhead and side geometry',()=>{
 const tunnel=courses.find(item=>item.id==='aqueduct'),indoor=courses.find(item=>item.id==='overpass');
 for(const course of [tunnel,indoor]){
  const platforms=makePlatforms(course),walls=makeWalls(course,platforms);
  assert.ok(walls.some(w=>w.kind==='roof'));
  assert.ok(walls.some(w=>w.kind==='architecture'));
  assert.ok(walls.every(w=>w.kind!=='roof'||!w.runnable));
 }
});
test('switchback levels offer a physical alternate route that reconnects at the same progress indices',()=>{
 const course=courses.find(item=>item.id==='switchback'),platforms=makePlatforms(course),alternate=makeAlternatePlatforms(course,platforms);
 assert.equal(alternate.length,2);
 assert.deepEqual(alternate.map(p=>p.index),[8,9]);
 assert.ok(alternate.every(p=>p.type==='alternate'&&p.w>=2.4));
});
test('new courses provide lava and neon environments with distinct palettes',()=>{
 const lava=courses.find(item=>item.id==='magma-run'),neon=courses.find(item=>item.id==='signal-garden');
 assert.equal(lava.environment,'volcanic');assert.equal(neon.environment,'neon');
 assert.notEqual(lava.color,neon.color);assert.match(lava.description,/lava/i);assert.match(neon.description,/neon/i);
 assert.ok(makePlatforms(lava).length>20);assert.ok(makePlatforms(neon).length>20);
});
test('the four new courses have distinct themed environments and maintain difficulty order',()=>{
 const expected=[['glacier-run','FLOW','arctic'],['foundry','TECH','industrial'],['canopy','EXPERT','canopy'],['orbit-breaker','MASTER','orbital']];
 for(const [id,difficulty,environment] of expected){const course=courses.find(item=>item.id===id);assert.ok(course);assert.equal(course.difficulty,difficulty);assert.equal(course.environment,environment);assert.ok(course.description.length>20);}
});
test('powerup placements alternate types and avoid slide gates and moving pads',()=>{
 for(const course of courses){
  const platforms=makePlatforms(course),powerups=makePowerups(course,platforms),gates=makeSlideObstacles(course,platforms);
  assert.ok(powerups.length>0,`${course.name} includes pickups`);
  assert.deepEqual(new Set(powerups.map(pickup=>pickup.type)),new Set(['surge','feather']),`${course.name} includes both pickup types`);
  assert.ok(powerups.every(pickup=>['surge','feather'].includes(pickup.type)&&!platforms[pickup.index].moving));
  assert.ok(powerups.every(pickup=>gates.every(gate=>gate.index!==pickup.index)));
  assert.ok(powerups.every(pickup=>Number.isFinite(pickup.x)&&Number.isFinite(pickup.y)&&Number.isFinite(pickup.z)));
 }
});
