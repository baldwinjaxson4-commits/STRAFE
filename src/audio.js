import {scoreStep,midiFrequency,stepDuration} from './music.js';
export class GameAudio {
  constructor(){this.enabled=true;this.musicEnabled=true;this.volume=.55;this.musicVolume=.8;this.effectsVolume=.8;this.context=null;this.timer=null;this.step=0;this.nextTime=0;this.nodes=new Set();this.windSource=null;this.windFilter=null;this.windGain=null;this.movementSpeed=0;this.wallRunning=false;this.running=false;this.lastFootstep=0;}
  initialize(context){
    this.context=context;
    this.master=context.createGain();this.master.connect(context.destination);
    this.musicBus=context.createGain();this.effectsBus=context.createGain();this.musicBus.connect(this.master);this.effectsBus.connect(this.master);
    const length=context.sampleRate;this.noise=context.createBuffer(1,length,context.sampleRate);const channel=this.noise.getChannelData(0);let seed=17;
    for(let i=0;i<length;i++){seed=(seed*16807)%2147483647;channel[i]=(seed/2147483647)*2-1;}
    this.nextTime=context.currentTime+.07;this.apply();
  }
  async unlock(){
    if(!this.context){
      const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!AudioContextClass)return false;
      this.initialize(new AudioContextClass());
    }
    try{await this.context.resume();}catch(error){
      if(error?.name==='NotAllowedError'||error?.name==='InvalidStateError')return false;
      throw error;
    }
    if(this.context.state!=='running')return false;
    this.apply();this.startWind();
    if(!this.timer){this.schedule();this.timer=setInterval(()=>this.schedule(),80);}
    return true;
  }
  configure(settings){this.enabled=settings.sound;this.musicEnabled=settings.music;this.volume=settings.volume;this.musicVolume=settings.musicVolume??.8;this.effectsVolume=settings.effectsVolume??.8;this.apply();}
  apply(){if(!this.context)return;const t=this.context.currentTime;this.master.gain.setTargetAtTime(this.enabled?Math.max(0,Math.min(1,this.volume)):.00001,t,.03);this.musicBus.gain.setTargetAtTime(this.musicEnabled?Math.max(0,Math.min(1,this.musicVolume)):.00001,t,.06);this.effectsBus.gain.setTargetAtTime(Math.max(0,Math.min(1,this.effectsVolume)),t,.03);}
  updateMovement(speed,wallRunning=false,running=false){
    this.movementSpeed=Number.isFinite(speed)?Math.max(0,speed):0;
    this.wallRunning=!!wallRunning;
    this.running=!!running&&this.movementSpeed>2.2;
    if(this.running&&this.context?.state==='running'){
      const time=this.context.currentTime,interval=Math.max(.22,Math.min(.48,4.2/this.movementSpeed));
      if(time-this.lastFootstep>=interval){this.play('run',Math.min(1,this.movementSpeed/15));this.lastFootstep=time;}
    }
    this.applyMovement();
  }
  startWind(){
    if(this.windSource||!this.context||this.context.state!=='running')return;
    const source=this.track(this.context.createBufferSource());
    this.windFilter=this.context.createBiquadFilter();this.windFilter.type='lowpass';this.windFilter.Q.value=.7;
    this.windGain=this.context.createGain();
    source.buffer=this.noise;source.loop=true;source.connect(this.windFilter);this.windFilter.connect(this.windGain);this.windGain.connect(this.effectsBus);
    this.windSource=source;
    source.onended=()=>{this.nodes.delete(source);source.disconnect();this.windFilter?.disconnect();this.windGain?.disconnect();this.windSource=null;this.windFilter=null;this.windGain=null;};
    source.start();
    this.applyMovement();
  }
  applyMovement(){
    if(!this.windGain||!this.windFilter)return;
    const t=this.context.currentTime,ratio=Math.max(0,Math.min(1,(this.movementSpeed-1)/22));
    const intensity=ratio*ratio*(this.wallRunning?1.18:1);
    this.windGain.gain.setTargetAtTime(intensity?Math.min(.075,.006+intensity*.058):.00001,t,.12);
    this.windFilter.frequency.setTargetAtTime(Math.min(5000,650+ratio*3200+(this.wallRunning?450:0)),t,.16);
    this.windFilter.Q.setTargetAtTime(this.wallRunning?1.15:.7,t,.16);
  }
  schedule(){
    if(!this.context||this.context.state!=='running')return;
    // Discard missed time after a background tab, rather than scheduling a burst.
    if(this.nextTime<this.context.currentTime-.1)this.nextTime=this.context.currentTime+.04;
    while(this.nextTime<this.context.currentTime+.2){if(this.enabled&&this.musicEnabled)for(const note of scoreStep(this.step))this.note(note,this.nextTime);this.nextTime+=stepDuration(this.step);this.step++;}
  }
  track(node){this.nodes.add(node);node.onended=()=>{this.nodes.delete(node);node.disconnect();};return node;}
  tone(frequency,time,duration,gain,type='sine',bus=this.musicBus){
    const o=this.track(this.context.createOscillator()),g=this.context.createGain();o.type=type;o.frequency.setValueAtTime(frequency,time);o.connect(g);g.connect(bus);g.gain.setValueAtTime(.00001,time);g.gain.exponentialRampToValueAtTime(Math.max(gain,.00002),time+.012);g.gain.exponentialRampToValueAtTime(.00001,time+duration);o.start(time);o.stop(time+duration+.02);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};return o;
  }
  noiseBurst(time,duration,gain,frequency,type='bandpass'){
    const source=this.track(this.context.createBufferSource()),filter=this.context.createBiquadFilter(),amp=this.context.createGain();
    source.buffer=this.noise;filter.type=type;filter.frequency.setValueAtTime(frequency,time);filter.Q.value=.8;
    source.connect(filter);filter.connect(amp);amp.connect(this.effectsBus);
    amp.gain.setValueAtTime(gain,time);amp.gain.exponentialRampToValueAtTime(.00001,time+duration);
    source.start(time);source.stop(time+duration);source.onended=()=>{this.nodes.delete(source);source.disconnect();filter.disconnect();amp.disconnect();};
  }
  note(event,time){
    if(event.voice==='pad'){for(const n of event.notes)this.tone(midiFrequency(n),time,event.duration,event.gain,'sine');return;}
    if(event.voice==='bass'){const o=this.tone(midiFrequency(event.notes[0]),time,event.duration,event.gain,'triangle');return o;}
    if(event.voice==='lead'){this.tone(midiFrequency(event.notes[0]),time,event.duration,event.gain,'triangle');this.tone(midiFrequency(event.notes[0]),time+.16,event.duration,event.gain*.24,'sine');return;}
    if(event.voice==='kick'){const o=this.tone(92,time,event.duration,event.gain,'triangle');o.frequency.exponentialRampToValueAtTime(48,time+.19);return;}
    const source=this.track(this.context.createBufferSource()),filter=this.context.createBiquadFilter(),gain=this.context.createGain();source.buffer=this.noise;filter.type=event.voice==='hat'?'highpass':'bandpass';filter.frequency.value=event.voice==='hat'?7000:1800;filter.Q.value=.8;source.connect(filter);filter.connect(gain);gain.connect(this.musicBus);gain.gain.setValueAtTime(.00001,time);gain.gain.exponentialRampToValueAtTime(Math.max(event.gain,.00002),time+.004);gain.gain.exponentialRampToValueAtTime(.00001,time+event.duration);source.start(time);source.stop(time+event.duration+.01);source.onended=()=>{this.nodes.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};
    if(event.voice==='snare')this.tone(180,time,.08,.012,'triangle');
  }
  play(kind,intensity=.45){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const time=this.context.currentTime;
    if(kind==='hurt'){
      const impact=Math.max(0,Math.min(1,Number.isFinite(intensity)?intensity:.65));
      const body=this.tone(155,time,.24,.018+impact*.015,'triangle',this.effectsBus);
      body.frequency.exponentialRampToValueAtTime(62,time+.24);
      this.noiseBurst(time,.16,.012+impact*.012,850,'lowpass');
      return;
    }
    if(kind==='die'){
      const force=Math.max(0,Math.min(1,Number.isFinite(intensity)?intensity:.65));
      const impact=this.tone(185,time,.36,.018+force*.012,'sawtooth',this.effectsBus);
      impact.frequency.exponentialRampToValueAtTime(48,time+.36);
      this.noiseBurst(time,.3,.012+force*.01,520,'lowpass');
      return;
    }
    if(kind==='respawn'){
      const start=time+.2;
      const rise=this.tone(175,start,.38,.015,'sine',this.effectsBus);
      rise.frequency.exponentialRampToValueAtTime(720,start+.34);
      const shimmer=this.tone(520,start+.08,.28,.009,'triangle',this.effectsBus);
      shimmer.frequency.exponentialRampToValueAtTime(1040,start+.34);
      return;
    }
    if(kind==='run'){
      const impact=Math.max(0,Math.min(1,Number.isFinite(intensity)?intensity:.5));
      this.noiseBurst(time,.075,.004+impact*.009,1000,'lowpass');
      const step=this.tone(92+impact*22,time,.075,.006+impact*.008,'triangle',this.effectsBus);
      step.frequency.exponentialRampToValueAtTime(55+impact*18,time+.075);
      return;
    }
    if(kind==='click'){
      const click=this.tone(920,time,.045,.009,'square',this.effectsBus);
      click.frequency.exponentialRampToValueAtTime(540,time+.045);
      return;
    }
    if(kind==='slide'){
      this.noiseBurst(time,.22,.009,1800,'bandpass');
      const scrape=this.tone(780,time,.11,.008,'triangle',this.effectsBus);
      scrape.frequency.exponentialRampToValueAtTime(260,time+.11);
      return;
    }
    if(kind==='wallKick'){
      this.noiseBurst(time,.11,.012,1100,'bandpass');
      const kick=this.tone(220,time,.16,.026,'triangle',this.effectsBus);
      kick.frequency.exponentialRampToValueAtTime(610,time+.16);
      return;
    }
    if(kind==='flip'){
      this.noiseBurst(time,.18,.006,2800,'highpass');
      const ring=this.tone(520,time,.13,.014,'triangle',this.effectsBus);
      ring.frequency.exponentialRampToValueAtTime(1180,time+.13);
      return;
    }
    if(kind==='powerup'){
      const lower=this.tone(420,time,.18,.018,'triangle',this.effectsBus);
      lower.frequency.exponentialRampToValueAtTime(840,time+.16);
      const upper=this.tone(630,time+.055,.2,.012,'sine',this.effectsBus);
      upper.frequency.exponentialRampToValueAtTime(1260,time+.22);
      return;
    }
    if(kind==='inspect'){
      this.noiseBurst(time,.09,.005,2400,'highpass');
      const draw=this.tone(420,time,.12,.012,'triangle',this.effectsBus);
      draw.frequency.exponentialRampToValueAtTime(940,time+.1);
      return;
    }
    if(kind==='land'){
      const impact=Number.isFinite(intensity)?Math.max(0,Math.min(1,intensity)):.45;
      const body=this.tone(105,time,.14,.009+impact*.014,'sine',this.effectsBus);
      body.frequency.exponentialRampToValueAtTime(58,time+.14);
      const detail=this.tone(185,time,.055,.003+impact*.006,'sine',this.effectsBus);
      detail.frequency.exponentialRampToValueAtTime(125,time+.055);
      return;
    }
    const notes={jump:[250,400,.07],checkpoint:[550,850,.22],finish:[660,1320,.4],wall:[320,440,.12]};
    if(!notes[kind])return this.play('land',intensity);
    const [a,b,len]=notes[kind],o=this.tone(a,time,len,.035,'triangle',this.effectsBus);
    o.frequency.exponentialRampToValueAtTime(b,time+len);
  }
  suspend(){if(this.context)this.context.suspend().catch(()=>{});}
  dispose(){clearInterval(this.timer);this.timer=null;for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();this.windFilter?.disconnect();this.windGain?.disconnect();this.windSource=null;this.windFilter=null;this.windGain=null;this.context?.close().catch(()=>{});}
}
