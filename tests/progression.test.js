import test from 'node:test';
import assert from 'node:assert/strict';
import {courses} from '../src/courses.js';
import {medalForTime,pointsForMedal,totalMedalPoints,cosmeticUnlocked,COSMETIC_UNLOCKS} from '../src/storage.js';
import {knives,finishes} from '../src/viewmodel.js';

test('medal tiers use each course target and medal points reward faster runs',()=>{
 const course=courses.find(item=>item.id==='movement-lab');
 assert.equal(medalForTime(course,course.medals.gold),'gold');
 assert.equal(medalForTime(course,course.medals.silver),'silver');
 assert.equal(medalForTime(course,course.medals.bronze),'bronze');
 assert.equal(medalForTime(course,course.medals.bronze+.01),null);
 assert.deepEqual(['bronze','silver','gold'].map(pointsForMedal),[1,2,3]);
});
test('medal points accumulate from the best course records only',()=>{
 const scores=Object.fromEntries(courses.map((course,index)=>[course.id,index===0?course.medals.gold:index===1?course.medals.silver:index===2?course.medals.bronze:course.medals.bronze+1]));
 assert.equal(totalMedalPoints(courses,scores),6);
});
test('cosmetics unlock at medal thresholds while equipped cosmetics remain available',()=>{
 const kind=Object.keys(COSMETIC_UNLOCKS)[0];
 const firstIndex=Number(Object.keys(COSMETIC_UNLOCKS[kind])[0]);
 const required=COSMETIC_UNLOCKS[kind][firstIndex];
 assert.equal(cosmeticUnlocked(kind,firstIndex,required-1),false);
 assert.equal(cosmeticUnlocked(kind,firstIndex,required),true);
 assert.equal(cosmeticUnlocked(kind,firstIndex,0,firstIndex),true);
 assert.equal(cosmeticUnlocked('knife',0,0),true);
});
test('new knives and detailed finishes have medal-gated cosmetic unlocks',()=>{
 assert.equal(knives.length,12);assert.equal(finishes.length,24);
 for(const [index,points] of [[5,16],[6,22],[7,30]])assert.equal(cosmeticUnlocked('knife',index,points),true);
 assert.equal(cosmeticUnlocked('knife',7,29),false);
 assert.equal(cosmeticUnlocked('finish',16,24),true);
 assert.equal(cosmeticUnlocked('finish',17,31),false);
 assert.equal(cosmeticUnlocked('knife',11,54),true);
 assert.equal(cosmeticUnlocked('finish',23,59),false);
});
