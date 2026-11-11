import test from 'node:test';
import assert from 'node:assert/strict';
import {collectPowerup} from '../src/powerups.js';

test('powerup collection detects a swept pass through the pickup',()=>{
  const player={x:2,y:0,z:0},pickup={id:'surge-1',x:0,y:1.05,z:0},claimed=new Set();
  assert.equal(collectPowerup(player,[pickup],claimed,{x:-2,y:0,z:0}),pickup);
  assert.equal(claimed.has(pickup.id),true);
  assert.equal(collectPowerup(player,[pickup],claimed,{x:-2,y:0,z:0}),null);
});

test('powerups outside the player path are not collected',()=>{
  const player={x:2,y:0,z:0},pickup={id:'feather-1',x:0,y:1.05,z:3};
  assert.equal(collectPowerup(player,[pickup],new Set(),{x:-2,y:0,z:0}),null);
});
