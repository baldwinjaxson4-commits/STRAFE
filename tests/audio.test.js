import test from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio} from '../src/audio.js';

class AudioParam {
  setValueAtTime(value){this.value=value;}
  setTargetAtTime(value){this.value=value;}
  exponentialRampToValueAtTime(value){this.value=value;}
}
class AudioNode {
  constructor(){this.connections=[];this.frequency=new AudioParam();this.gain=new AudioParam();this.Q=new AudioParam();}
  connect(node){this.connections.push(node);}
  disconnect(){this.connections=[];}
  start(){this.started=true;}
  stop(){}
}
class FakeAudioContext {
  constructor(){this.currentTime=1;this.sampleRate=8000;this.destination=new AudioNode();this.state='suspended';this.sources=[];}
  createGain(){return new AudioNode();}
  createOscillator(){const node=new AudioNode();this.sources.push(node);return node;}
  createBufferSource(){const node=new AudioNode();this.sources.push(node);return node;}
  createBiquadFilter(){return new AudioNode();}
  createBuffer(_channels,length){return {getChannelData:()=>new Float32Array(length)};}
  async resume(){this.state='running';}
  async suspend(){this.state='suspended';}
  async close(){this.state='closed';}
}

test('movement wind responds to speed and wall running without creating new looping nodes',async()=>{
  const previousAudioContext=globalThis.AudioContext;
  globalThis.AudioContext=FakeAudioContext;
  const audio=new GameAudio();
  try{
    audio.configure({sound:true,music:false,volume:.5});
    assert.equal(await audio.unlock(),true);
    const wind=audio.windSource;
    assert.ok(wind?.loop);
    for(let i=0;i<200;i++)audio.updateMovement(i%24,i%2===0);
    assert.equal(audio.windSource,wind);
    assert.equal(audio.nodes.size,1);
    audio.updateMovement(23,true);
    assert.ok(Math.abs(audio.windGain.gain.value-.07444)<1e-6);
    assert.equal(audio.windFilter.frequency.value,4300);
    assert.equal(audio.windFilter.Q.value,1.15);
    audio.updateMovement(0,false);
    assert.equal(audio.windGain.gain.value,.00001);
  }finally{
    audio.dispose();
    globalThis.AudioContext=previousAudioContext;
  }
});

test('landings are soft, intensity-scaled effects and mute still blocks playback',async()=>{
  const previousAudioContext=globalThis.AudioContext;
  globalThis.AudioContext=FakeAudioContext;
  const audio=new GameAudio();
  try{
    audio.configure({sound:true,music:false,volume:.5});
    await audio.unlock();
    const sourceCount=audio.context.sources.length;
    audio.play('land',1);
    assert.equal(audio.context.sources.length,sourceCount+2);
    assert.equal(audio.context.sources.at(-2).frequency.value,58);
    assert.equal(audio.context.sources.at(-1).frequency.value,125);
    audio.configure({sound:false,music:false,volume:.5});
    const mutedSourceCount=audio.context.sources.length;
    audio.play('land',1);
    assert.equal(audio.context.sources.length,mutedSourceCount);
    audio.dispose();
  }finally{
    globalThis.AudioContext=previousAudioContext;
  }
});

test('slide, wall-kick, knife-flip and hurt events each synthesize dedicated effects',async()=>{
  const previousAudioContext=globalThis.AudioContext;
  globalThis.AudioContext=FakeAudioContext;
  const audio=new GameAudio();
  try{
    audio.configure({sound:true,music:false,volume:.5});
    await audio.unlock();
    const before=audio.context.sources.length;
    for(const effect of ['slide','wallKick','flip','hurt'])audio.play(effect,.8);
    assert.equal(audio.context.sources.length,before+8);
    assert.ok(audio.context.sources.slice(before).every(source=>source.started));
    audio.configure({sound:false,music:false,volume:.5});
    const muted=audio.context.sources.length;
    audio.play('hurt');
    assert.equal(audio.context.sources.length,muted);
  }finally{
    audio.dispose();
    globalThis.AudioContext=previousAudioContext;
  }
});
test('powerup pickup has a bright synthesized cue',async()=>{
  const previousAudioContext=globalThis.AudioContext;
  globalThis.AudioContext=FakeAudioContext;
  const audio=new GameAudio();
  try{
    audio.configure({sound:true,music:false,volume:.5});await audio.unlock();
    const before=audio.context.sources.length;audio.play('powerup');
    assert.equal(audio.context.sources.length,before+2);
    assert.ok(audio.context.sources.slice(before).every(source=>source.started));
  }finally{audio.dispose();globalThis.AudioContext=previousAudioContext;}
});

test('run footsteps are speed-paced and jump, inspect, die, respawn and click have effects',async()=>{
  const previousAudioContext=globalThis.AudioContext;
  globalThis.AudioContext=FakeAudioContext;
  const audio=new GameAudio();
  try{
    audio.configure({sound:true,music:false,volume:.5});
    await audio.unlock();
    const before=audio.context.sources.length;
    audio.updateMovement(8,false,true);
    const firstStep=audio.context.sources.length;
    audio.context.currentTime+=.1;
    audio.updateMovement(8,false,true);
    assert.equal(audio.context.sources.length,firstStep);
    audio.context.currentTime+=.45;
    audio.updateMovement(8,false,true);
    assert.equal(audio.context.sources.length,firstStep+2);
    for(const effect of ['jump','inspect','die','respawn','click'])audio.play(effect);
    assert.equal(audio.context.sources.length,before+4+8);
    audio.configure({sound:false,music:false,volume:.5});
    const muted=audio.context.sources.length;
    audio.play('die');audio.play('respawn');audio.play('click');
    assert.equal(audio.context.sources.length,muted);
  }finally{
    audio.dispose();
    globalThis.AudioContext=previousAudioContext;
  }
});

test('unlock reports autoplay denial without starting the wind loop',async()=>{
  class LockedAudioContext extends FakeAudioContext {
    async resume(){const error=new Error('audio activation required');error.name='NotAllowedError';throw error;}
  }
  const previousAudioContext=globalThis.AudioContext;
  globalThis.AudioContext=LockedAudioContext;
  const audio=new GameAudio();
  try{
    assert.equal(await audio.unlock(),false);
    assert.equal(audio.windSource,null);
    assert.equal(audio.timer,null);
  }finally{
    audio.dispose();
    globalThis.AudioContext=previousAudioContext;
  }
});

test('music and effects buses have independent persisted volume levels',async()=>{
  const previousAudioContext=globalThis.AudioContext;
  globalThis.AudioContext=FakeAudioContext;
  const audio=new GameAudio();
  try{
    audio.configure({sound:true,music:true,volume:.5,musicVolume:.25,effectsVolume:.7});
    await audio.unlock();
    assert.equal(audio.musicBus.gain.value,.25);
    assert.equal(audio.effectsBus.gain.value,.7);
    audio.configure({sound:true,music:false,volume:.5,musicVolume:.25,effectsVolume:.4});
    assert.equal(audio.musicBus.gain.value,.00001);
    assert.equal(audio.effectsBus.gain.value,.4);
  }finally{
    audio.dispose();
    globalThis.AudioContext=previousAudioContext;
  }
});
