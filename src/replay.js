import {courseLayoutVersion} from './courses.js';
export const REPLAY_INTERVAL=.05;
export const REPLAY_VERSION=2;
export const MAX_REPLAY_SECONDS=1200;
export class RunRecorder {
  constructor(){this.reset({x:0,y:0,z:7},0);}
  reset(player,yaw){this.frames=[0,player.x,player.y,player.z,yaw];this.nextSample=REPLAY_INTERVAL;this.truncated=false;}
  sample(time,player,yaw){
    if(time>MAX_REPLAY_SECONDS){this.truncated=true;return;}
    if(time+1e-7<this.nextSample)return;
    this.frames.push(time,player.x,player.y,player.z,yaw);
    this.nextSample=time+REPLAY_INTERVAL;
  }
  finish(course,time,player,yaw){
    if(this.truncated||!Number.isFinite(time)||time<=0)return null;
    const frames=this.frames.slice();
    if(frames[frames.length-5]<time)frames.push(time,player.x,player.y,player.z,yaw);
    return {version:REPLAY_VERSION,layout:courseLayoutVersion(course),course:course.id,duration:time,frames:new Float32Array(frames)};
  }
}
export function validReplay(replay,course){
  if(!replay||replay.version!==REPLAY_VERSION||replay.layout!==courseLayoutVersion(course)||replay.course!==course.id||!Number.isFinite(replay.duration)||replay.duration<=0||replay.duration>MAX_REPLAY_SECONDS)return false;
  const f=replay.frames;
  if(!(f instanceof Float32Array)||f.length<10||f.length%5!==0||f.length>120010)return false;
  let previous=-1;
  for(let i=0;i<f.length;i+=5){if(![f[i],f[i+1],f[i+2],f[i+3],f[i+4]].every(Number.isFinite)||f[i]<=previous)return false;previous=f[i];}
  return Math.abs(f[f.length-5]-replay.duration)<.1;
}
export function sampleReplay(frames,time){
  if(!frames?.length)return null;
  const count=frames.length/5;
  let low=0,high=count-1;
  while(low+1<high){const mid=(low+high)>>1;if(frames[mid*5]<=time)low=mid;else high=mid;}
  const a=low*5,b=high*5;
  const gap=frames[b]-frames[a],t=gap>0?Math.max(0,Math.min(1,(time-frames[a])/gap)):0;
  // A fall respawn is a teleport, never a flight through the whole map.
  const teleport=Math.hypot(frames[b+1]-frames[a+1],frames[b+2]-frames[a+2],frames[b+3]-frames[a+3])>4;
  const mix=teleport?(t>=1?1:0):t;
  const yawDelta=Math.atan2(Math.sin(frames[b+4]-frames[a+4]),Math.cos(frames[b+4]-frames[a+4]));
  return{x:frames[a+1]+(frames[b+1]-frames[a+1])*mix,y:frames[a+2]+(frames[b+2]-frames[a+2])*mix,z:frames[a+3]+(frames[b+3]-frames[a+3])*mix,yaw:frames[a+4]+yawDelta*mix};
}
let dbPromise;
const DB_VERSION=2;
const BEST_STORE='best';
const LATEST_STORE='latest';
function database(){
  if(!globalThis.indexedDB)return Promise.resolve(null);
  dbPromise??=new Promise(resolve=>{const request=indexedDB.open('strafe-replays',DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(BEST_STORE))db.createObjectStore(BEST_STORE,{keyPath:'course'});if(!db.objectStoreNames.contains(LATEST_STORE))db.createObjectStore(LATEST_STORE,{keyPath:'course'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);request.onblocked=()=>resolve(null);});
  return dbPromise;
}
async function loadFrom(store,course){
  try{const db=await database();if(!db)return null;return await new Promise(resolve=>{const request=db.transaction(store,'readonly').objectStore(store).get(course.id);request.onsuccess=()=>resolve(validReplay(request.result,course)?request.result:null);request.onerror=()=>resolve(null);});}catch{return null;}
}
async function saveTo(store,replay){
  if(!replay)return false;
  try{const db=await database();if(!db)return false;return await new Promise(resolve=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(replay);tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>resolve(false);});}catch{return false;}
}
export function loadReplay(course){return loadFrom(BEST_STORE,course);}
export function saveReplay(replay){return saveTo(BEST_STORE,replay);}
export function loadLatestReplay(course){return loadFrom(LATEST_STORE,course);}
export function saveLatestReplay(replay){return saveTo(LATEST_STORE,replay);}
