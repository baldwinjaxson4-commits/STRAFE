import test from 'node:test';import assert from 'node:assert/strict';
import {BPM,STEP_SECONDS,LOOP_STEPS,SONGS,scoreStep,midiFrequency,songAtStep,stepDuration} from '../src/music.js';
test('every original 32-bar arrangement contains drums, bass, melody and harmony',()=>{for(let songIndex=0;songIndex<SONGS.length;songIndex++){const voices=new Set(),start=songIndex*LOOP_STEPS;for(let step=0;step<LOOP_STEPS;step++)for(const e of scoreStep(start+step)){voices.add(e.voice);assert.ok(e.duration>0&&e.gain>0&&e.gain<.2);for(const n of e.notes||[])assert.ok(midiFrequency(n)>20&&midiFrequency(n)<10000);}assert.deepEqual([...voices].sort(),['bass','hat','kick','lead','pad','snare']);}assert.equal(BPM,112);assert.ok(STEP_SECONDS>.1);});
test('original songs cycle in order at loop boundaries with distinct tempos and arrangements',()=>{assert.equal(SONGS.length,4);for(let i=0;i<SONGS.length;i++){const start=i*LOOP_STEPS;assert.equal(songAtStep(start),SONGS[i]);assert.equal(songAtStep(start+LOOP_STEPS-1),SONGS[i]);assert.equal(songAtStep(start+LOOP_STEPS),SONGS[(i+1)%SONGS.length]);assert.deepEqual(scoreStep(start+128),scoreStep(start+128+LOOP_STEPS*SONGS.length));assert.equal(stepDuration(start),60/SONGS[i].bpm/4);}assert.notDeepEqual(scoreStep(128),scoreStep(LOOP_STEPS+128));});
test('each arrangement develops after its intro',()=>{for(let i=0;i<SONGS.length;i++){const start=i*LOOP_STEPS;assert.equal(scoreStep(start).some(e=>e.voice==='lead'),false);assert.equal(scoreStep(start+64).some(e=>e.voice==='lead'),true);}});
test('drum transients stay quiet to avoid repetitive popping',()=>{
 const kicks=Array.from({length:LOOP_STEPS*SONGS.length},(_,step)=>scoreStep(step).find(event=>event.voice==='kick')).filter(Boolean);
 assert.ok(kicks.length>0);
 assert.ok(kicks.every(event=>event.gain<=.045&&event.duration>=.2));
});
