const KEY='strafe-v1';
export const SAVE_VERSION=3;
export const defaults={
  sensitivity:1,fov:90,autoHop:true,dynamicFov:true,cameraTilt:true,reducedMotion:false,
  knife:0,finish:0,glove:0,sound:true,music:true,volume:.55,musicVolume:.8,effectsVolume:.8,
  shadowQuality:'high',resolutionScale:1,ghost:true,raceTarget:'best',
  bindings:{forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',wallRun:'ShiftLeft',slide:'KeyC',frontflip:'KeyX',restart:'KeyR',checkpoint:'KeyV'},
};
export const COSMETIC_UNLOCKS={knife:{4:12,5:16,6:22,7:30,8:34,9:39,10:46,11:54},finish:{4:2,8:7,12:13,14:20,16:24,17:32,18:28,19:34,20:40,21:46,22:52,23:60},glove:{3:3,5:7,8:14,11:21,12:27,13:36,14:46}};
const bindingActions=Object.keys(defaults.bindings);
const reservedBindings=new Set(['Escape','Tab','Enter','NumpadEnter','Unidentified','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Minus','Equal','KeyF','KeyG','KeyM',...'0123456789'.split('').map(key=>`Digit${key}`)]);
export function isValidBindingCode(code){
  return typeof code==='string'&&/^([A-Za-z]+|Digit[0-9]|Numpad[0-9])$/.test(code)&&!reservedBindings.has(code);
}
function validBindings(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const bindings={};
  for(const action of bindingActions){
    if(value[action]===undefined)continue;
    const code=value[action];
    if(!isValidBindingCode(code))return false;
    bindings[action]=code;
  }
  const used=new Set(Object.values(bindings));
  if(used.size!==Object.keys(bindings).length)return false;
  for(const action of bindingActions){
    if(bindings[action])continue;
    const candidates=[defaults.bindings[action],'KeyB','KeyN','KeyU','KeyY','KeyI','KeyO','KeyP','KeyL'];
    const code=candidates.find(candidate=>!used.has(candidate));
    if(!code)return false;
    bindings[action]=code;used.add(code);
  }
  return bindings;
}
export function medalForTime(course,time){
  if(!Number.isFinite(time)||!course?.medals)return null;
  if(time<=course.medals.gold)return 'gold';
  if(time<=course.medals.silver)return 'silver';
  if(time<=course.medals.bronze)return 'bronze';
  return null;
}
export function pointsForMedal(medal){return medal==='gold'?3:medal==='silver'?2:medal==='bronze'?1:0;}
export function totalMedalPoints(courses,records){
  return courses.reduce((total,course)=>total+pointsForMedal(medalForTime(course,records[course.id])),0);
}
export function cosmeticUnlocked(kind,index,points,equipped){
  const required=COSMETIC_UNLOCKS[kind]?.[index];
  return required===undefined||points>=required||index===equipped;
}
export function readSave(){
  try{
    const serialized=localStorage.getItem(KEY);
    if(serialized===null)return{version:SAVE_VERSION,settings:{...defaults,bindings:{...defaults.bindings}},records:{},warning:null,readOnly:false};
    const raw=JSON.parse(serialized);
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('The saved progress has an invalid format.');
    const sourceVersion=Number.isInteger(raw.version)?raw.version:1;
    if(sourceVersion>SAVE_VERSION)return{version:sourceVersion,settings:{...defaults,bindings:{...defaults.bindings}},records:{},warning:`This save was made by a newer game version (${sourceVersion}) and is read-only here.`,readOnly:true};
    const s=raw.settings&&typeof raw.settings==='object'?raw.settings:{};
    const settings={...defaults,bindings:{...defaults.bindings}};
    for(const key of Object.keys(defaults)){
      if(key==='bindings')continue;
      if(typeof s[key]===typeof defaults[key])settings[key]=s[key];
    }
    const bindings=validBindings(s.bindings);
    if(bindings)settings.bindings=bindings;
    if(!['best','latest'].includes(settings.raceTarget))settings.raceTarget='best';
    if(s.music===undefined)settings.sound=true;
    for(const [key,min,max] of [['sensitivity',.3,2.5],['fov',75,110],['volume',0,1],['musicVolume',0,1],['effectsVolume',0,1],['resolutionScale',.5,1]])settings[key]=Number.isFinite(settings[key])?Math.max(min,Math.min(max,settings[key])):defaults[key];
    if(!['off','low','high'].includes(settings.shadowQuality))settings.shadowQuality=defaults.shadowQuality;
    for(const [key,count] of [['knife',12],['finish',24],['glove',15]])settings[key]=Number.isInteger(settings[key])&&settings[key]>=0&&settings[key]<count?settings[key]:0;
    const records={};
    if(raw.records&&typeof raw.records==='object'&&!Array.isArray(raw.records)){
      for(const [key,value] of Object.entries(raw.records))if(typeof value==='number'&&Number.isFinite(value)&&value>0)records[key]=value;
    }
    const migrated=sourceVersion<SAVE_VERSION;
    return{version:SAVE_VERSION,settings,records,warning:migrated?'Your previous save was upgraded. Cosmetics and course records were preserved.':null,readOnly:false,migrated};
  }catch(error){
    return{version:SAVE_VERSION,settings:{...defaults,bindings:{...defaults.bindings}},records:{},warning:`Saved progress could not be read: ${error.message}`,readOnly:false};
  }
}
export function save(data){
  if(data.readOnly)return{ok:false,error:'This save belongs to a newer game version and was not overwritten.'};
  try{
    localStorage.setItem(KEY,JSON.stringify({version:SAVE_VERSION,settings:data.settings,records:data.records}));
    data.version=SAVE_VERSION;data.migrated=false;
    return{ok:true,error:null};
  }catch(error){
    return{ok:false,error:`Progress could not be saved in this browser: ${error.message}`};
  }
}
export function formatTime(seconds){const ms=Math.floor(Math.max(0,seconds)*1000);return `${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;}
