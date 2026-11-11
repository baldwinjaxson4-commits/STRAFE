import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,readSave,save,SAVE_VERSION,isValidBindingCode} from '../src/storage.js';

function withLocalStorage(t,initial=null,failWrites=false){
  const values=new Map(initial===null?[]:[['strafe-v1',initial]]);
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:key=>values.get(key)??null,
    setItem(key,value){if(failWrites)throw new Error('quota exceeded');values.set(key,value);},
  }});
  t.after(()=>previous?Object.defineProperty(globalThis,'localStorage',previous):delete globalThis.localStorage);
  return values;
}
test('legacy saves upgrade without losing cosmetics or course records',t=>{
  const values=withLocalStorage(t,JSON.stringify({settings:{knife:6,finish:14,glove:8,sensitivity:1.4,bindings:{forward:'KeyX',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',wallRun:'ShiftLeft',slide:'KeyC',restart:'KeyR',checkpoint:'KeyV'}},records:{coastline:42}}));
  const data=readSave();
  assert.equal(data.version,SAVE_VERSION);assert.equal(data.migrated,true);
  assert.equal(data.settings.knife,6);assert.equal(data.settings.finish,14);assert.equal(data.settings.glove,8);
  assert.equal(data.settings.bindings.forward,'KeyX');assert.notEqual(data.settings.bindings.frontflip,'KeyX');
  assert.ok(data.settings.bindings.frontflip);
  assert.deepEqual(data.records,{coastline:42});
  assert.equal(save(data).ok,true);
  const saved=JSON.parse(values.get('strafe-v1'));
  assert.equal(saved.version,SAVE_VERSION);assert.deepEqual(saved.records,{coastline:42});
});
test('frontflip binding survives save and load',t=>{
  withLocalStorage(t);
  const data=readSave();data.settings.bindings.frontflip='KeyQ';
  assert.equal(save(data).ok,true);
  assert.equal(readSave().settings.bindings.frontflip,'KeyQ');
});
test('version two binding maps migrate without colliding with knife shortcuts',t=>{
  withLocalStorage(t,JSON.stringify({version:2,settings:{bindings:{forward:'KeyI',back:'KeyK',left:'KeyJ',right:'KeyL',jump:'Space',wallRun:'ShiftLeft',slide:'KeyC',restart:'KeyR',checkpoint:'KeyV'}},records:{coastline:40}}));
  const data=readSave();
  assert.equal(data.settings.bindings.forward,'KeyI');
  assert.ok(data.settings.bindings.frontflip);
  assert.notEqual(data.settings.bindings.frontflip,'KeyI');
  assert.equal(data.records.coastline,40);
  assert.equal(isValidBindingCode('Digit0'),false);
  assert.equal(isValidBindingCode('Minus'),false);
  assert.equal(isValidBindingCode('Equal'),false);
});
test('invalid saved fields fall back safely while valid progress survives',t=>{
  withLocalStorage(t,JSON.stringify({version:SAVE_VERSION,settings:{knife:999,shadowQuality:'ultra',resolutionScale:4,bindings:{jump:'Escape'}},records:{good:12,bad:'12',negative:-1}}));
  const data=readSave();
  assert.equal(data.settings.knife,defaults.knife);assert.equal(data.settings.shadowQuality,defaults.shadowQuality);
  assert.equal(data.settings.resolutionScale,1);assert.deepEqual(data.settings.bindings,defaults.bindings);
  assert.deepEqual(data.records,{good:12});
});
test('future save versions are protected from being overwritten',t=>{
  const values=withLocalStorage(t,JSON.stringify({version:SAVE_VERSION+1,settings:{knife:5},records:{course:10}}));
  const data=readSave();
  assert.equal(data.readOnly,true);assert.match(data.warning,/newer game version/);
  assert.equal(save(data).ok,false);
  assert.equal(JSON.parse(values.get('strafe-v1')).version,SAVE_VERSION+1);
});
test('storage quota failures return a useful message instead of reporting success',t=>{
  withLocalStorage(t,null,true);
  const result=save({settings:defaults,records:{}});
  assert.equal(result.ok,false);assert.match(result.error,/quota exceeded/);
});
