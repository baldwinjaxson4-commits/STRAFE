import test from 'node:test';import assert from 'node:assert/strict';
import {RunRecorder,sampleReplay,validReplay,loadReplay,loadLatestReplay,saveLatestReplay,MAX_REPLAY_SECONDS} from '../src/replay.js';
import {courses,courseLayoutVersion} from '../src/courses.js';
const course=courses[0];
function run(){const r=new RunRecorder();r.reset({x:0,y:0,z:7},0);for(let i=1;i<=20;i++)r.sample(i*.05,{x:0,y:1,z:7-i*.3},0);return r.finish(course,1,{x:0,y:1,z:1},0);}
test('records a compact replay that validates against its course',()=>{const r=run();assert.ok(validReplay(r,course));assert.ok(r.frames instanceof Float32Array);assert.equal(r.frames.length/5,21);});
test('interpolates a recorded run rather than a fabricated path',()=>{const pose=sampleReplay(new Float32Array([0,0,0,0,0,1,2,1,-3,1]),.5);assert.deepEqual(pose,{x:1,y:.5,z:-1.5,yaw:.5});});
test('yaw takes the short path across the angle wrap',()=>{const pose=sampleReplay(new Float32Array([0,0,0,0,3.1,1,0,0,0,-3.1]),.5);assert.ok(Math.abs(pose.yaw-Math.PI)<.01);});
test('respawns are teleports rather than long interpolated flights',()=>{const f=new Float32Array([0,0,-8,-20,0,1,0,0,7,0]);assert.equal(sampleReplay(f,.8).z,-20);assert.equal(sampleReplay(f,1).z,7);});
test('course geometry changes and corrupt replay frames invalidate ghosts',()=>{const r=run();assert.equal(validReplay({...r,layout:courseLayoutVersion({...course,width:course.width+1})},course),false);assert.equal(validReplay({...r,course:'other'},course),false);r.frames[6]=NaN;assert.equal(validReplay(r,course),false);});
test('latest-run persistence is separate from the personal-best store and preserves old best data',async()=>{
  const personalBest=run(),latest=run();latest.frames[1]=42;
  const stores=new Map([['best',new Map([[course.id,personalBest]])]]);
  const db={
    objectStoreNames:{contains:name=>stores.has(name)},
    createObjectStore(name){stores.set(name,new Map());return{};},
    transaction(name){const store=stores.get(name);if(!store)throw new Error('missing object store');const transaction={
      objectStore(){return{
        get(key){const request={};queueMicrotask(()=>{request.result=store.get(key);request.onsuccess?.();});return request;},
        put(value){queueMicrotask(()=>{store.set(value.course,value);transaction.oncomplete?.();});}
      };},
      oncomplete:null
    };return transaction;},
  };
  const previous=Object.getOwnPropertyDescriptor(globalThis,'indexedDB');
  Object.defineProperty(globalThis,'indexedDB',{configurable:true,value:{open(_name,version){const request={};queueMicrotask(()=>{request.result=db;request.onupgradeneeded?.();assert.equal(version,2);request.onsuccess?.();});return request;}}});
  try{
    assert.ok(await loadReplay(course));
    assert.equal(await saveLatestReplay(latest),true);
    assert.equal((await loadLatestReplay(course)).frames[1],42);
    assert.equal(await loadLatestReplay({...course,version:course.version+1}),null);
    assert.equal((await loadReplay(course)).frames[1],personalBest.frames[1]);
    assert.equal(stores.has('best'),true);
  }finally{
    if(previous)Object.defineProperty(globalThis,'indexedDB',previous);
    else delete globalThis.indexedDB;
  }
});
test('recording limits never silently save a partial ghost',()=>{const r=new RunRecorder();r.sample(MAX_REPLAY_SECONDS+1,{x:0,y:0,z:0},0);assert.equal(r.finish(course,MAX_REPLAY_SECONDS+1,{x:0,y:0,z:0},0),null);});
test('restarting clears all previous replay frames',()=>{const r=new RunRecorder();r.sample(.1,{x:2,y:1,z:-3},1);r.reset({x:0,y:0,z:7},0);assert.deepEqual(r.frames,[0,0,0,7,0]);});
