import * as THREE from 'three';
import './style.css';
import {courses,makePlatforms,makeWalls,makeSlideObstacles,makeAlternatePlatforms,makePowerups,updateMovingPlatforms} from './courses.js';
import {createPlayer,stepPlayer,respawnPlayer,FIXED_DT,PHYSICS} from './physics.js';
import {readSave,save,defaults,formatTime,medalForTime,totalMedalPoints,cosmeticUnlocked,COSMETIC_UNLOCKS,isValidBindingCode} from './storage.js';
import {World} from './world.js';
import {ViewModel,knives,finishes,gloves} from './viewmodel.js';
import {GameAudio} from './audio.js';
import {SONGS} from './music.js';
import {checkpointSpawn,crossedFinishLine} from './course-progress.js';
import {clampFrameDelta,frameGapInvalidatesRun} from './frame-timing.js';
import {RaceGhost} from './ghost.js';
import {RunRecorder,loadReplay,saveReplay,loadLatestReplay,saveLatestReplay} from './replay.js';
import {collectPowerup} from './powerups.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const data=readSave(),settings=data.settings,audio=new GameAudio();audio.configure(settings);
const canvas=$('#game');let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(error){$('#error').textContent=`Graphics could not start (${error.message}). Enable WebGL 2 and hardware acceleration in a current desktop browser, then reload.`;$('#error').classList.remove('hidden');$('#enter').disabled=true;throw new Error('WebGL 2 unavailable',{cause:error});}
function resizeRenderer(){renderer.setPixelRatio(Math.min(devicePixelRatio*settings.resolutionScale,2));renderer.setSize(innerWidth,innerHeight);}
resizeRenderer();
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
const world=new World(renderer),camera=new THREE.PerspectiveCamera(settings.fov,innerWidth/innerHeight,.04,1200);
camera.rotation.order='YXZ';world.scene.add(camera);
const fill=new THREE.PointLight(0xc9f7ff,2,4);fill.position.set(.3,.2,-.3);camera.add(fill);
const viewmodel=new ViewModel(camera,settings),ghost=new RaceGhost(world.scene),recorder=new RunRecorder();
let selected=0,platforms=[],walls=[],obstacles=[],powerups=[],claimedPowerups=new Set(),player=createPlayer(),yaw=0,pitch=0,page='play',state='menu';
let locked=false,elapsed=0,courseTime=0,started=false,peak=0,falls=0,progress=0,checkpoint=0,practice=false,finished=false;
let accumulator=0,previous=performance.now(),clock=0,cameraHeight=PHYSICS.height,toastTimeout,loadedGhost=null,ghostLoadToken=0,raceGapValue=null,raceGapUpdated=0;
let freshJump=false,freshFrontflip=false,freeLook=false,difficultyFilter='ALL',pendingBinding=null,lastStorageError=null,graphicsLost=false;
const keys=new Set(),ghostCache=new Map();
function persist(){
  const result=save(data);
  if(!result.ok){if(lastStorageError!==result.error)toast(result.error);lastStorageError=result.error;return false;}
  lastStorageError=null;return true;
}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),3800);}
const number=n=>String(n).padStart(2,'0');
const knifeKeys=['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal'];
const bindingNames={forward:'Forward',back:'Back',left:'Strafe left',right:'Strafe right',jump:'Jump',wallRun:'Wall run',slide:'Slide',frontflip:'Frontflip',restart:'Restart',checkpoint:'Checkpoint return'};
function keyLabel(code){return code.replace(/^Key/,'').replace(/^Digit/,'').replace('Space','Space').replace('Arrow','').replace('ShiftLeft','Left Shift').replace('ShiftRight','Right Shift');}
function renderCourses(){
  const visible=courses.map((course,index)=>({course,index})).filter(({course})=>difficultyFilter==='ALL'||course.difficulty===difficultyFilter);
  $('#course-count').textContent=`${visible.length} / ${courses.length} COURSES`;
  const course=courses[selected];
  $('#course-description').textContent=`${course.description} MEDALS · Gold ${formatTime(course.medals.gold)} / Silver ${formatTime(course.medals.silver)} / Bronze ${formatTime(course.medals.bronze)}`;
  $('#courses').innerHTML=visible.map(({course:c,index:i})=>{const earned=medalForTime(c,data.records[c.id]);return `<button class="course-option ${i===selected?'selected':''}" data-course="${i}" aria-pressed="${i===selected}"><span class="number">${number(i+1)}</span><span class="course-title">${c.name}${data.records[c.id]?`<small>BEST ${formatTime(data.records[c.id])} · ${earned?.toUpperCase()??'NO MEDAL'}</small>`:`<small>GOLD ${formatTime(c.medals.gold)} · SILVER ${formatTime(c.medals.silver)} · BRONZE ${formatTime(c.medals.bronze)}</small>`}</span><span class="difficulty">${c.difficulty}</span><span class="arrow">↗</span></button>`;}).join('');
  $$('[data-course]').forEach(b=>b.onclick=()=>loadCourse(Number(b.dataset.course)));
  $('#ghost-target').value=settings.raceTarget;
}
function renderLocker(){
  const medalPoints=totalMedalPoints(courses,data.records);
  const lockNote=(kind,index)=>{const required=COSMETIC_UNLOCKS[kind]?.[index];return required&&!cosmeticUnlocked(kind,index,medalPoints,settings[kind])?`LOCKED · ${required} MEDAL PTS`:null;};
  $('#knives').innerHTML=knives.map((k,i)=>{const locked=lockNote('knife',i);return `<button class="choice ${settings.knife===i?'selected':''} ${locked?'locked':''}" data-knife="${i}" aria-pressed="${settings.knife===i}" ${locked?'disabled':''}><span class="choice-art">${k.glyph}</span><b>${k.name}</b><small>${locked??k.detail}</small></button>`;}).join('');
  $('#finishes').innerHTML=finishes.map((f,i)=>{const locked=lockNote('finish',i);return `<button class="swatch ${settings.finish===i?'selected':''} ${locked?'locked':''}" style="--swatch:${f.css}" data-finish="${i}" title="${locked??f.name}" aria-label="${locked??`${f.name} knife finish`}" aria-pressed="${settings.finish===i}" ${locked?'disabled':''}></button>`;}).join('');
  $('#gloves').innerHTML=gloves.map((g,i)=>{const locked=lockNote('glove',i);return `<button class="choice ${settings.glove===i?'selected':''} ${locked?'locked':''}" data-glove="${i}" aria-pressed="${settings.glove===i}" ${locked?'disabled':''}><b>${g.name}</b><small>${locked??g.detail}</small></button>`;}).join('');
  for(const kind of ['knife','finish','glove'])$$(`[data-${kind}]`).forEach(b=>b.onclick=()=>{
    if(b.disabled)return;
    settings[kind]=Number(b.dataset[kind]);viewmodel.build();
    if(kind==='glove')viewmodel.inspectGloves();else viewmodel.inspect();
    audio.play(kind==='knife'&&settings.knife===2?'flip':'inspect');persist();renderLocker();
  });
  $('#loadout-caption').textContent=`${knives[settings.knife].name} / ${finishes[settings.finish].name} · ${gloves[settings.glove].name} gloves · ${medalPoints} MEDAL POINTS`;
}
function renderSettings(){
  for(const [id,key,format] of [
    ['sensitivity','sensitivity',value=>`${value.toFixed(1)}×`],['fov','fov',value=>`${value}°`],
    ['volume','volume',value=>`${Math.round(value*100)}%`],['music-volume','musicVolume',value=>`${Math.round(value*100)}%`],
    ['effects-volume','effectsVolume',value=>`${Math.round(value*100)}%`],['resolution-scale','resolutionScale',value=>`${Math.round(value*100)}%`],
  ]){
    $('#'+id).value=settings[key];$('#'+id+'-value').textContent=format(settings[key]);
  }
  for(const [id,key] of [['autohop','autoHop'],['dynamicfov','dynamicFov'],['cameratilt','cameraTilt'],['reduced-motion','reducedMotion'],['ghost-toggle','ghost'],['music-toggle','music'],['sound-toggle','sound']])$('#'+id).checked=settings[key];
  $('#shadow-quality').value=settings.shadowQuality;
  for(const id of ['wallrun-hud-key','wallrun-footer-key'])$('#'+id).textContent=keyLabel(settings.bindings.wallRun).toUpperCase();
  $('#slide-footer-key').textContent=`HOLD ${keyLabel(settings.bindings.slide).toUpperCase()}`;
  for(const id of ['frontflip-key','frontflip-footer-key'])$('#'+id).textContent=keyLabel(settings.bindings.frontflip).toUpperCase();
  for(const button of $$('[data-bind]')){
    const action=button.dataset.bind;
    button.textContent=pendingBinding===action?'Press a key…':keyLabel(settings.bindings[action]);
    button.setAttribute('aria-label',`${bindingNames[action]}: ${pendingBinding===action?'press a key':keyLabel(settings.bindings[action])}`);
  }
  $('#sound-label').textContent=settings.sound?(settings.music?'MUSIC ON':'SFX ON'):'MUTED';
  $('#sound').setAttribute('aria-label',settings.sound?'Mute music and sound':'Enable music and sound');
  for(const [id,action] of [['forward-key','forward'],['jump-key','jump'],['left-key','left'],['right-key','right'],['wallrun-key','wallRun'],['restart-key','restart']])$('#'+id).textContent=keyLabel(settings.bindings[action]).toUpperCase();
  $('#sound').title=`Original soundtrack cycles through ${SONGS.map(song=>song.title).join(', ')} · M to mute`;audio.configure(settings);
  world.setShadowQuality(settings.shadowQuality);resizeRenderer();
  $$('[data-bind]').forEach(button=>button.onclick=()=>{
    pendingBinding=button.dataset.bind;renderSettings();toast(`Press a key to bind ${bindingNames[pendingBinding]} · Esc cancels`);
  });
}
function cancelBinding(){
  if(!pendingBinding)return;
  pendingBinding=null;renderSettings();
}
function setPage(next){
  if(next!=='settings')cancelBinding();
  page=next;document.body.className=next==='play'?'':next;
  $$('.panel').forEach(p=>p.classList.add('hidden'));$('#'+next+'-panel').classList.remove('hidden');
  $$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===next));
  if(next==='locker'){renderLocker();viewmodel.inspect();}
}
function resetRun(){
  keys.clear();freshJump=false;freshFrontflip=false;claimedPowerups.clear();world.resetPowerups();elapsed=0;courseTime=0;started=false;peak=0;falls=0;progress=0;checkpoint=0;practice=false;finished=false;yaw=0;pitch=0;
  updateMovingPlatforms(platforms,courseTime);world.syncPlatforms(platforms);
  player=createPlayer({x:0,y:0,z:7});recorder.reset(player,yaw);
  $('#enter').innerHTML='Enter course <span>↗</span>';$('#status').textContent='';$('#run-mode').textContent='CLEAN RUN';$('#checkpoint-label').textContent='START';updateHud();
}
function ghostCacheKey(courseId,mode){return `${courseId}:${mode}`;}
async function loadRaceGhost(course,mode){
  const cached=ghostCache.get(ghostCacheKey(course.id,mode));
  if(cached!==undefined)return cached;
  const replay=mode==='latest'?await loadLatestReplay(course):await loadReplay(course);
  ghostCache.set(ghostCacheKey(course.id,mode),replay);
  return replay;
}
async function setRaceTarget(mode){
  settings.raceTarget=mode==='latest'?'latest':'best';persist();
  const course=courses[selected],token=++ghostLoadToken;
  const replay=await loadRaceGhost(course,settings.raceTarget);
  if(token!==ghostLoadToken)return;
  loadedGhost=replay;ghost.set(replay);updateHud();
}
async function loadCourse(index){
  selected=index;const course=courses[index],primary=makePlatforms(course);
  platforms=[...primary,...makeAlternatePlatforms(course,primary)];walls=makeWalls(course,primary);obstacles=makeSlideObstacles(course,primary);powerups=makePowerups(course,primary);
  world.load(course,platforms,walls,obstacles,powerups);resetRun();state='menu';loadedGhost=null;ghost.set(null);
  $('#course-name').textContent=`${number(index+1)} / ${course.name.toUpperCase()}`;
  renderCourses();setPage('play');
  const token=++ghostLoadToken;
  const replay=await loadRaceGhost(course,settings.raceTarget);
  if(token!==ghostLoadToken)return;
  loadedGhost=replay;ghost.set(replay);updateHud();
}
function beginRun(useFreeLook=false){
  if(locked&&state==='playing')return;
  freeLook=useFreeLook;locked=true;keys.clear();freshJump=false;freshFrontflip=false;state='playing';document.body.className='playing';
  $$('.panel').forEach(p=>p.classList.add('hidden'));$('#active-course').classList.remove('hidden');document.activeElement?.blur();
  if(useFreeLook)toast('Mouse capture unavailable · move mouse to look · Esc to pause');
}
function pauseRun(){
  if(finished||state!=='playing')return;
  locked=false;keys.clear();freshJump=false;freshFrontflip=false;
  if(started&&!practice){practice=true;$('#run-mode').textContent='PRACTICE RUN';toast('Run paused or interrupted · this run cannot set a record. Restart for a clean run.');}
  state='paused';$('#active-course').classList.add('hidden');setPage('play');
  $('#enter').innerHTML='Resume course <span>↗</span>';$('#status').textContent='PAUSED · YOUR LINE IS WAITING';
}
async function start(){
  if(matchMedia('(pointer: coarse)').matches){toast('Use a desktop mouse and keyboard to play.');return;}
  audio.unlock();
  if(!canvas.requestPointerLock){beginRun(true);return;}
  try{await canvas.requestPointerLock();}catch{beginRun(true);}
}
function onLock(){if(document.pointerLockElement===canvas)beginRun(false);else if(!freeLook)pauseRun();}
function inspect(glovesOnly=false){glovesOnly?viewmodel.inspectGloves():viewmodel.inspect();audio.unlock();audio.play(!glovesOnly&&settings.knife===2?'flip':'inspect');}
function restart(){resetRun();toast('Fresh start. Your ghost starts with you.');if(!locked){state='menu';setPage('play');}}
function respawn(){
  if(checkpoint){const spawn=checkpointSpawn(platforms,checkpoint);if(spawn){respawnPlayer(player,spawn);practice=true;$('#run-mode').textContent='PRACTICE RUN';toast('Checkpoint restored · practice run');}else{checkpoint=0;respawnPlayer(player,{x:0,y:0,z:7});toast('Checkpoint unavailable · returned to start.');}}
  else{respawnPlayer(player,{x:0,y:0,z:7});toast('Back to start · timer continues');}
  audio.play('respawn');
  yaw=0;pitch=0;
}
function complete(){
  if(finished)return;
  const racedGhost=loadedGhost;
  finished=true;state='finished';locked=false;keys.clear();const course=courses[selected],old=data.records[course.id];
  const record=!practice&&(!old||elapsed<old);
  const recordSaved=record?(data.records[course.id]=elapsed,persist()):true;
  if(!practice){
    const replay=recorder.finish(course,elapsed,player,yaw);
    if(replay){
      ghostCache.set(ghostCacheKey(course.id,'latest'),replay);
      saveLatestReplay(replay).then(ok=>{if(!ok)toast('Last-run replay is available this session but could not be saved permanently.');});
      if(record){ghostCache.set(ghostCacheKey(course.id,'best'),replay);saveReplay(replay).then(ok=>{if(!ok)toast('Personal-best ghost is available this session but could not be saved permanently.');});}
      if(settings.raceTarget==='latest'||(record&&settings.raceTarget==='best')){loadedGhost=replay;ghost.set(replay);}
    }else toast('Run complete. Ghost recordings support runs up to 20 minutes.');
  }
  audio.play('finish');if(document.pointerLockElement)document.exitPointerLock();setPage('finish');$('#active-course').classList.add('hidden');
  $('#finish-time').textContent=formatTime(elapsed);
  const medal=practice?null:medalForTime(course,elapsed);
  const improvement=old?old-elapsed:null;
  const raceDelta=racedGhost?racedGhost.duration-elapsed:null;
  const medalLabel=medal?`${medal.toUpperCase()} MEDAL`:'NO MEDAL';
  $('#finish-note').textContent=practice?'PRACTICE RUN · Pausing, interruptions, or checkpoint returns mean this run cannot set records. Press R for a clean run.':record?recordSaved?'NEW PERSONAL BEST · Your clean run is saved.':'NEW PERSONAL BEST · Browser storage could not save this record.':`Clean run · Personal best ${formatTime(old)}.`;
  const comparison=improvement===null?'No previous personal best to compare.':improvement>=0?`Personal best improved by ${formatTime(improvement)}.`:`${formatTime(-improvement)} slower than your personal best.`;
  const raceComparison=raceDelta===null?'No selected ghost to compare.':raceDelta>=0?`${formatTime(raceDelta)} faster than ${settings.raceTarget==='latest'?'last run':'personal-best ghost'}.`:`${formatTime(-raceDelta)} behind ${settings.raceTarget==='latest'?'last run':'personal-best ghost'}.`;
  const points=totalMedalPoints(courses,data.records),nextReward=findNextReward(points);
  $('#finish-stats').innerHTML=`<p class="finish-stats"><b class="medal ${medal??'none'}">${medalLabel}</b> · <span>${comparison}</span><br><span>${raceComparison}</span><br>Peak <span>${Math.round(peak*32)} u/s</span> · <span>${player.jumps}</span> hops · <span>${falls}</span> falls${nextReward?`<br>${points} medal points · Next cosmetic: <span>${nextReward.name} at ${nextReward.points}</span>`:`<br>All cosmetic rewards unlocked · ${points} medal points`}</p>`;
  renderCourses();renderLocker();
}
function findNextReward(points){
  const catalogs={knife:knives,finish:finishes,glove:gloves};
  return Object.entries(COSMETIC_UNLOCKS).flatMap(([kind,items])=>Object.entries(items).map(([index,required])=>({kind,index:Number(index),points:required,name:catalogs[kind][Number(index)].name}))).filter(reward=>reward.points>points).sort((a,b)=>a.points-b.points)[0]??null;
}
function raceDifference(replay,current){
  if(!replay?.frames?.length||!started)return null;
  const frames=replay.frames;let bestDistance=Infinity,bestTime=0;
  for(let i=0;i<frames.length;i+=5){
    const dx=frames[i+1]-current.x,dy=frames[i+2]-current.y,dz=frames[i+3]-current.z;
    const distance=dx*dx+dy*dy*.6+dz*dz;
    if(distance<bestDistance){bestDistance=distance;bestTime=frames[i];}
  }
  return elapsed-bestTime;
}
function updateHud(){
  const speed=Math.hypot(player.vx,player.vz);$('#timer').textContent=formatTime(elapsed);$('#speed').textContent=Math.round(speed*32);
  const percent=Math.floor(progress/courses[selected].count*100);$('#progress').textContent=percent+'%';$('#progress-fill').style.width=percent+'%';
  const remaining=Math.max(0,PHYSICS.wallDuration-player.wallTime);
  $('#wall-time').textContent=remaining.toFixed(1)+'s';$('#wall-fill').style.width=remaining/PHYSICS.wallDuration*100+'%';
  $('#wall-label').textContent=player.wallRunning?'RUNNING':remaining<.01?'LAND TO RECHARGE':'WALL RUN';
  $('#powerup-status').textContent=player.boostTime>0?`SURGE ${player.boostTime.toFixed(1)}s`:player.extraJumpCharges>0?'FEATHER · AIR JUMP READY':`${keyLabel(settings.bindings.frontflip).toUpperCase()} · FRONTFLIP`;
  $('#ability-hud').classList.toggle('running',player.wallRunning);$('#ability-hud').classList.toggle('exhausted',remaining<.01);
  $('#ghost-status').textContent=!settings.ghost?'Ghost hidden · enable in Settings':loadedGhost?`GHOST ${formatTime(loadedGhost.duration)}${started&&elapsed>=loadedGhost.duration?' · FINISHED':''}`:'Finish a clean run to create your ghost';
  if(clock-raceGapUpdated>.12){raceGapValue=raceDifference(loadedGhost,player);raceGapUpdated=clock;}
  const raceDelta=$('#race-delta');
  if(!loadedGhost)raceDelta.textContent=settings.raceTarget==='latest'?'NO LAST RUN YET':'NO PERSONAL-BEST GHOST YET';
  else if(raceGapValue===null)raceDelta.textContent=`RACING ${settings.raceTarget==='latest'?'LAST RUN':'PERSONAL BEST'}`;
  else if(Math.abs(raceGapValue)<.025)raceDelta.textContent='EVEN';
  else raceDelta.textContent=`${raceGapValue>0?'BEHIND':'AHEAD'} ${Math.abs(raceGapValue).toFixed(2)}s · ${settings.raceTarget==='latest'?'LAST RUN':'PERSONAL BEST'}`;
  const course=courses[selected],hint=$('#training-hint');
  hint.classList.toggle('hidden',!course.training);
  if(course.training)hint.textContent=progress<1?`1 / STRAFE · Build speed, jump, then turn and hold ${keyLabel(settings.bindings.left)} or ${keyLabel(settings.bindings.right)}.`:progress<4?'2 / LAND · Aim for the side pads and preserve your air speed.':progress<8?`3 / WALL KICK · Hold ${keyLabel(settings.bindings.wallRun)} by a mint wall, then tap ${keyLabel(settings.bindings.jump)}.`:`4 / CHAIN · Keep ${keyLabel(settings.bindings.wallRun)} held and kick toward the next wall.`;
}
function tick(){
  const bindings=settings.bindings;
  const input={forward:keys.has(bindings.forward)||keys.has('ArrowUp'),back:keys.has(bindings.back)||keys.has('ArrowDown'),left:keys.has(bindings.left)||keys.has('ArrowLeft'),right:keys.has(bindings.right)||keys.has('ArrowRight'),jump:settings.autoHop?keys.has(bindings.jump):freshJump,airJump:freshJump,wallJump:freshJump,frontflip:freshFrontflip,wallRun:keys.has(bindings.wallRun),slide:keys.has(bindings.slide)};
  if(!started&&(input.forward||input.back||input.left||input.right||input.jump||input.slide||input.frontflip)){started=true;recorder.reset(player,yaw);}
  if(started)elapsed+=FIXED_DT;
  courseTime+=FIXED_DT;updateMovingPlatforms(platforms,courseTime);world.syncPlatforms(platforms);
  const previousPosition={x:player.x,y:player.y,z:player.z};
  const grounded=player.grounded,jumps=player.jumps,wasWallRunning=player.wallRunning,wasSliding=player.sliding,wasFlipping=player.frontflipTime>0,oldWallCooldown=player.wallCooldown;
  const landingSpeed=Math.abs(player.vy);
  stepPlayer(player,input,yaw,platforms,FIXED_DT,settings.autoHop,walls,obstacles);freshJump=false;freshFrontflip=false;
  const wallKick=player.wallCooldown>oldWallCooldown;
  if(player.jumps>jumps)audio.play(wallKick?'wallKick':'jump');if(!wasFlipping&&player.frontflipTime>0)audio.play('flip');if(!grounded&&player.grounded)audio.play('land',Math.min(1,landingSpeed/PHYSICS.jump));if(player.wallRunning&&!wasWallRunning)audio.play('wall');if(player.sliding&&!wasSliding)audio.play('slide');
  const powerup=collectPowerup(player,powerups,claimedPowerups,previousPosition);
  if(powerup){
    world.collectPowerup(powerup.id);
    if(powerup.type==='surge'){
      player.vx+=-Math.sin(yaw)*3.2;player.vz+=-Math.cos(yaw)*3.2;player.boostTime=PHYSICS.surgeDuration;
      toast('Speed surge · higher speed cap for a moment');
    }else{
      player.extraJumpCharges=1;toast('Feather · one extra midair jump');
    }
    audio.play('powerup');
  }
  peak=Math.max(peak,Math.hypot(player.vx,player.vz));
  if(started)recorder.sample(elapsed,player,yaw);
  if(player.landed!==null){
    const b=platforms[player.landed];progress=Math.max(progress,b.index);
    if(b.type==='checkpoint'&&b.index>checkpoint){checkpoint=b.index;$('#checkpoint-label').textContent=`CHECKPOINT ${Math.floor(b.index/5)}`;audio.play('checkpoint');toast('Checkpoint reached · V to return');}
    if(b.type==='finish')complete();
  }
  const finish=platforms.find(platform=>platform.type==='finish');
  if(state==='playing'&&crossedFinishLine(previousPosition,player,finish))complete();
  if(state!=='playing')return;
  const fallThreshold=courses[selected].environment==='volcanic'?-3.8:-8;
  if(player.y<fallThreshold){falls++;audio.play('die',Math.min(1,Math.abs(player.vy)/PHYSICS.jump));respawn();}
}
function toggleSound(){settings.sound=!settings.sound;audio.configure(settings);audio.unlock();persist();renderSettings();toast(settings.sound?'Sound on · original soundtrack enabled':'Music and sound muted · M to enable');}
$$('nav button').forEach(b=>b.onclick=()=>setPage(b.dataset.page));$('.brand').onclick=e=>{e.preventDefault();setPage('play');};
$('#enter').onclick=start;$('#inspect').onclick=()=>inspect();$('#inspect-gloves').onclick=()=>inspect(true);
$('#again').onclick=()=>{restart();start();};$('#next-course').onclick=()=>{
  difficultyFilter='ALL';$('#course-filter').value='ALL';loadCourse((selected+1)%courses.length);
};
$('#course-filter').onchange=e=>{difficultyFilter=e.target.value;renderCourses();};$('#sound').onclick=toggleSound;
$('#ghost-target').onchange=e=>setRaceTarget(e.target.value);
for(const [id,key] of [['sensitivity','sensitivity'],['fov','fov'],['volume','volume'],['music-volume','musicVolume'],['effects-volume','effectsVolume'],['resolution-scale','resolutionScale']])$('#'+id).oninput=e=>{settings[key]=Number(e.target.value);persist();renderSettings();};
for(const [id,key] of [['autohop','autoHop'],['dynamicfov','dynamicFov'],['cameratilt','cameraTilt'],['reduced-motion','reducedMotion'],['ghost-toggle','ghost'],['music-toggle','music'],['sound-toggle','sound']])$('#'+id).onchange=e=>{settings[key]=e.target.checked;persist();renderSettings();audio.unlock();};
$('#shadow-quality').onchange=e=>{settings.shadowQuality=e.target.value;persist();renderSettings();};
$('#reset-settings').onclick=()=>{
  for(const key of ['sensitivity','fov','autoHop','dynamicFov','cameraTilt','reducedMotion','sound','music','volume','musicVolume','effectsVolume','shadowQuality','resolutionScale','ghost','raceTarget'])settings[key]=defaults[key];
  settings.bindings={...defaults.bindings};persist();renderSettings();toast('Graphics, accessibility and control defaults restored');
};
document.addEventListener('pointerdown',()=>audio.unlock());
document.addEventListener('click',event=>{
  if(!event.target.closest('button,select,input,a'))return;
  audio.unlock().then(unlocked=>{if(unlocked)audio.play('click');});
});
document.addEventListener('pointerlockchange',onLock);document.addEventListener('pointerlockerror',()=>{if(state==='menu'||state==='paused')beginRun(true);});
document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.002*settings.sensitivity;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.002*settings.sensitivity,-1.45,1.45);});
document.addEventListener('keydown',e=>{
  if(pendingBinding){
    e.preventDefault();
    if(e.code==='Escape'){pendingBinding=null;renderSettings();toast('Key binding cancelled.');return;}
    if(!isValidBindingCode(e.code)){toast('That key is unavailable. Press a letter, number, or movement key.');return;}
    const action=pendingBinding,previous=settings.bindings[action],conflict=Object.keys(settings.bindings).find(key=>key!==action&&settings.bindings[key]===e.code);
    settings.bindings[action]=e.code;if(conflict)settings.bindings[conflict]=previous;
    pendingBinding=null;persist();renderSettings();toast(conflict?`${keyLabel(e.code)} swapped with ${bindingNames[conflict]}.`:`${bindingNames[action]} set to ${keyLabel(e.code)}.`);return;
  }
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',...knifeKeys,...Object.values(settings.bindings)].includes(e.code))e.preventDefault();
  if(e.repeat)return;keys.add(e.code);
  if(e.code===settings.bindings.jump)freshJump=true;
  if(e.code===settings.bindings.frontflip)freshFrontflip=true;
  if(e.code==='Escape'&&locked&&freeLook){pauseRun();return;}
  if(e.code==='KeyF')inspect();if(e.code==='KeyG')inspect(true);if(e.code==='KeyM')toggleSound();
  if(e.code===settings.bindings.restart&&(page==='play'||page==='finish')){const retry=finished;restart();if(retry)start();}
  if(e.code===settings.bindings.checkpoint&&locked){if(checkpoint)respawn();else toast('Reach a glowing checkpoint first.');}
  const choice=knifeKeys.indexOf(e.code);
  if(choice>=0&&choice<knives.length){if(!cosmeticUnlocked('knife',choice,totalMedalPoints(courses,data.records),settings.knife)){toast(`Earn ${COSMETIC_UNLOCKS.knife[choice]} medal points to unlock this knife.`);return;}settings.knife=choice;viewmodel.build();viewmodel.inspect();audio.play(settings.knife===2?'flip':'inspect');persist();if(page==='locker')renderLocker();}
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('keyup',e=>keys.delete(e.code));
function releaseInput(){cancelBinding();keys.clear();freshJump=false;freshFrontflip=false;if(locked){pauseRun();if(document.pointerLockElement)document.exitPointerLock();}}
window.addEventListener('blur',releaseInput);
document.addEventListener('visibilitychange',()=>{previous=performance.now();accumulator=0;keys.clear();if(document.hidden){releaseInput();audio.suspend();}else audio.unlock();});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();resizeRenderer();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();graphicsLost=true;releaseInput();$('#error').textContent='Graphics were interrupted by the browser. Reload the page to safely return to the course.';$('#error').classList.remove('hidden');});
loadCourse(0);renderLocker();renderSettings();
if(data.migrated)persist();
if(data.warning)toast(data.warning);
function frame(now){
  requestAnimationFrame(frame);const rawDelta=(now-previous)/1000;previous=now;const dt=clampFrameDelta(rawDelta);clock+=dt;
  if(locked&&state==='playing'&&started&&frameGapInvalidatesRun(rawDelta)&&!practice){practice=true;$('#run-mode').textContent='PRACTICE RUN';toast('A long frame-time spike interrupted this run. It cannot set a personal best; restart for a clean run.');}
  if(locked&&state==='playing'){accumulator+=dt;while(accumulator>=FIXED_DT&&state==='playing'){tick();accumulator-=FIXED_DT;}}else accumulator=0;
  const speed=Math.hypot(player.vx,player.vz),targetFov=settings.dynamicFov&&!settings.reducedMotion&&locked?Math.min(120,settings.fov+Math.min(speed*.65,15)):settings.fov;
  camera.fov+=(targetFov-camera.fov)*Math.min(dt*6,1);camera.updateProjectionMatrix();
  const lateralSpeed=player.vx*Math.cos(yaw)+player.vz*Math.sin(yaw);
  const forwardSpeed=-player.vx*Math.sin(yaw)-player.vz*Math.cos(yaw);
  const roll=settings.cameraTilt&&!settings.reducedMotion?THREE.MathUtils.clamp(-lateralSpeed*.0035+(player.wallRunning?-player.wallSide*.065:0)+(player.sliding?Math.sin(clock*20)*.012:0),-.1,.1):0;
  const targetHeight=player.sliding?PHYSICS.slideHeight+.12:PHYSICS.height;
  cameraHeight+=(targetHeight-cameraHeight)*Math.min(dt*14,1);
  const flipProgress=player.frontflipTime>0?1-player.frontflipTime/PHYSICS.frontflipDuration:0;
  const flipAngle=settings.reducedMotion?0:Math.PI*2*flipProgress*flipProgress*(3-2*flipProgress);
  if(locked||state==='paused'||state==='finished'){camera.position.set(player.x,player.y+cameraHeight,player.z);camera.rotation.set(pitch-flipAngle+(player.sliding&&!settings.reducedMotion?0.035:0)+(settings.cameraTilt&&!settings.reducedMotion?THREE.MathUtils.clamp(forwardSpeed*.0012,0,.025):0),yaw,roll);}
  else{camera.position.set(-1.4,2.4,8.8);camera.rotation.set(-.10,-.16,0);}
  const moving=keys.has('KeyW')||keys.has('KeyA')||keys.has('KeyS')||keys.has('KeyD')||keys.has('ArrowUp')||keys.has('ArrowDown')||keys.has('ArrowLeft')||keys.has('ArrowRight');
  audio.updateMovement(speed,player.wallRunning,player.grounded&&moving);
  viewmodel.update(dt,locked?speed:0,clock,page==='locker',player.sliding);
  ghost.update(elapsed,started&&(state==='playing'||state==='paused'),settings.ghost,player);
  world.update(clock,camera);  if(!graphicsLost)renderer.render(world.scene,camera);updateHud();
  if(import.meta.env.DEV){canvas.dataset.audio=audio.context?.state??'not started';canvas.dataset.voices=String(audio.nodes.size);canvas.dataset.ghostVisible=String(ghost.group.visible);canvas.dataset.ghostDuration=String(loadedGhost?.duration??0);canvas.dataset.yaw=String(yaw);canvas.dataset.wallRunning=String(player.wallRunning);canvas.dataset.runState=state;}
}
requestAnimationFrame(frame);
if(import.meta.env.DEV)window.__strafe={get state(){return{state,selected,elapsed,progress,checkpoint,practice,settings:{...settings},player:{...player},locked,ghostDuration:loadedGhost?.duration??null,audioState:audio.context?.state??'not started',voices:audio.nodes.size};},get platforms(){return platforms.map(p=>({...p}));},get walls(){return walls.map(w=>({...w}));},get powerups(){return powerups.map(p=>({...p,claimed:claimedPowerups.has(p.id)}));}};
