import test from 'node:test';
import assert from 'node:assert/strict';
import {FIXED_DT} from '../src/physics.js';
import {clampFrameDelta,frameGapInvalidatesRun,MAX_FRAME_DELTA} from '../src/frame-timing.js';

function simulateRenderRate(fps,seconds){
  let accumulator=0,steps=0;
  for(let frame=0;frame<fps*seconds;frame++){
    accumulator+=clampFrameDelta(1/fps);
    while(accumulator+1e-10>=FIXED_DT){accumulator-=FIXED_DT;steps++;}
  }
  return steps*FIXED_DT;
}
test('fixed simulation time is consistent from low through high render rates',()=>{
  const times=[30,60,144].map(fps=>simulateRenderRate(fps,10));
  assert.ok(times.every(time=>Math.abs(time-10)<FIXED_DT));
});
test('long stalls are clamped and invalidate record eligibility',()=>{
  assert.equal(clampFrameDelta(.2),MAX_FRAME_DELTA);
  assert.equal(frameGapInvalidatesRun(.2),true);
  assert.equal(frameGapInvalidatesRun(.06),true);
  assert.equal(frameGapInvalidatesRun(1/30),false);
  assert.equal(frameGapInvalidatesRun(Number.NaN),false);
});
