const palettes = [
  [0x8bf4c5, 0x225b68, 0x97c3d7], [0xf6c58b, 0x374957, 0x9aafb9],
  [0xcfacff, 0x323953, 0x999dbf], [0x79d8ff, 0x18485c, 0x8ab6ce],
  [0xff91aa, 0x4e354d, 0xbba1b8], [0xffdc72, 0x38575c, 0xb5c5c8],
];
const FORWARD_RUNWAY=1.2;
const movingSections={
  overpass:[12,16],switchback:[8,16],aqueduct:[9,17],nightshift:[10,21],terminal:[11,23],
};
const roster = [
  ['movement-lab','Movement Lab','INTRO',12,4.8,6.6,3.8,'training',2],
  ['coastline','Coastline','INTRO',14,4.6,7.2,2.5,'sine',0],
  ['breakwater','Breakwater','INTRO',16,4.8,7.1,3,'sweep',1],
  ['wall-school','Wall School','INTRO',16,5,7,2,'straight',2],
  ['overpass','Overpass','FLOW',18,3.8,7.8,4.8,'sine',0],
  ['tideline','Tideline','FLOW',20,3.9,7.7,4,'zigzag',1],
  ['aqueduct','Aqueduct','FLOW',22,4.1,7.9,3.5,'sweep',2],
  ['driftworks','Driftworks','FLOW',24,3.7,7.8,5,'sweep',1],
  ['glacier-run','Glacier Run','FLOW',22,4,7.8,4.1,'sweep',1],
  ['afterglow','Afterglow','TECH',22,3.2,7.7,5.6,'sine',0],
  ['cinder','Cinder','TECH',24,3.2,8,4.4,'sine',2],
  ['skyline','Skyline','TECH',25,3.5,8.1,4.8,'stairs',1],
  ['switchback','Switchback','TECH',24,3.3,7.7,5.6,'zigzag',1],
  ['crosswind','Crosswind','TECH',26,3.1,8.1,5,'sine',2],
  ['undertow','Undertow','TECH',28,3.3,8.1,5,'stairs',2],
  ['magma-run','Magma Run','TECH',24,3.4,7.8,4.8,'switchback',2],
  ['foundry','Foundry','TECH',26,3.35,7.9,4.7,'switchback',2],
  ['signal-garden','Signal Garden','EXPERT',28,2.9,7.7,5.2,'zigzag',3],
  ['highwire','Highwire','EXPERT',28,2.1,7.3,3.2,'sweep',2],
  ['razorline','Razorline','EXPERT',28,2.35,7.4,3.8,'zigzag',2],
  ['neon-spine','Neon Spine','EXPERT',30,2.6,8,4.5,'stairs',3],
  ['monolith','Monolith','EXPERT',30,2.7,8.2,4,'zigzag',3],
  ['nightshift','Nightshift','EXPERT',32,2.5,8.1,4.8,'sweep',3],
  ['canopy','Canopy','EXPERT',30,2.8,8,4.9,'zigzag',3],
  ['terminal','Terminal','MASTER',34,2.15,8.3,4,'switchback',3],
  ['endless-blue','Endless Blue','MASTER',42,2.5,8.2,5,'sine',3],
  ['zero-margin','Zero Margin','MASTER',36,1.85,7.7,3.5,'stairs',3],
  ['orbit-breaker','Orbit Breaker','MASTER',38,2.2,8.2,4.4,'stairs',3],
];
export const courses = roster.map(([id,name,difficulty,count,width,spacing,amplitude,pattern,wallTier],i)=>({
  id,name,difficulty,count,width,spacing,amplitude,pattern,wallTier,
  training:id==='movement-lab',
  environment:({
    'magma-run':'volcanic','signal-garden':'neon','glacier-run':'arctic',
    foundry:'industrial',canopy:'canopy','orbit-breaker':'orbital',
  })[id]??'coastal',
  tunnels:id==='aqueduct'?[6,7,8]:id==='terminal'?[12,13,14]:id==='orbit-breaker'?[9,10,11]:[],
  indoor:id==='overpass'?[6,7,8]:id==='nightshift'?[14,15,16]:id==='foundry'?[8,9,10]:[],
  movingSections:movingSections[id]??(id==='glacier-run'?[8,16]:id==='foundry'?[7,19]:id==='orbit-breaker'?[10,24,32]:[]),
  alternateRoutes:id==='switchback'?[8]:id==='endless-blue'?[12,28]:id==='canopy'?[12,22]:[],
  color:({
    'magma-run':0xff7048,'signal-garden':0xc783ff,'glacier-run':0x8beaff,
    foundry:0xffbc62,canopy:0x9df078,'orbit-breaker':0x9e8cff,
  })[id]??palettes[i%palettes.length][0],
  water:({
    'magma-run':0x481d26,'signal-garden':0x192f55,'glacier-run':0x16485d,
    foundry:0x43332a,canopy:0x124b43,'orbit-breaker':0x171b42,
  })[id]??palettes[i%palettes.length][1],
  sky:({
    'magma-run':0x583744,'signal-garden':0x58638f,'glacier-run':0x9bd5e2,
    foundry:0x685346,canopy:0x598770,'orbit-breaker':0x3c477f,
  })[id]??palettes[i%palettes.length][2],
  raise:i<3?[.10,.12,.13][i]:.1+(i%3)*.035,
  medals:(()=>{const gold=count*(spacing*.075+.72)+2+(wallTier===3?Math.ceil(count/6)*.5:0);return{gold,silver:gold*1.22,bronze:gold*1.5};})(),
  description:id==='movement-lab'?'Training: build speed, air-strafe between marked pads, then kick off a wall.':id==='magma-run'?'Thread basalt switchbacks above a glowing lava sea.':id==='signal-garden'?'Neon-lit platforms, luminous towers and extended wall runs.':id==='terminal'?'Sharp switchbacks, moving pads and extended wall-run gaps.':id==='aqueduct'?'Follow the aqueduct through indoor tunnels and moving pads.':id==='glacier-run'?'Skate across blue ice shelves and shifting frozen pads.':id==='foundry'?'Cut through a furnace hall of steel walkways and moving machinery.':id==='canopy'?'Leap between emerald platforms woven through a bioluminescent forest.':id==='orbit-breaker'?'Navigate orbital stations, airlocks, and suspended zero-g routes.':wallTier===3?'Extended wall gaps. Commit to the run.':wallTier===2?'Wall-run lanes and precision landings.':wallTier?'Tight turns between concrete walls.':'Build momentum and find your line.',
  // A layout version prevents an old replay racing a changed map.
  version:5,
}));
export function courseLayoutVersion(course){
  const platforms=makePlatforms(course);
  return JSON.stringify([
    course.version,course.id,course.environment,platforms,makeWalls(course,platforms),
    makeSlideObstacles(course,platforms),makeAlternatePlatforms(course,platforms),
    makePowerups(course,platforms),
  ]);
}
export function makePlatforms(course){
  const result=[{x:0,z:5,y:0,w:11,d:13,type:'start',index:0}];
  let z=5;
  for(let i=1;i<=course.count;i++){
    const extended=course.wallTier===3&&i>=4&&i%6===0;
    z-=extended?13:course.spacing;
    let x=Math.sin(i*.58)*course.amplitude;
    if(course.pattern==='straight')x=0;
    if(course.pattern==='sweep')x=Math.sin(i*.28)*course.amplitude;
    if(course.pattern==='zigzag')x=Math.sin(i*Math.PI/4)*course.amplitude;
    if(course.pattern==='switchback')x=(i%2?1:-1)*course.amplitude;
    if(course.pattern==='training'){
      x=i<=1?0:i<=4?(i%2?1:-1)*course.amplitude*.72:i<=7?(i%2?-1:1)*course.amplitude*.7:Math.sin(i*.9)*course.amplitude*.72;
    }
    const checkpoint=i%5===0;
    const y=course.pattern==='stairs'?Math.floor((i%12)/3)*.28+Math.floor(i/12)*.3:Math.min(i*course.raise,3.5);
    const depth=course.width+(checkpoint?1.4:0);
    const moving=course.movingSections.includes(i)&&!checkpoint&&i<course.count;
    result.push({x,z:z-FORWARD_RUNWAY/2,homeX:x,homeZ:z-FORWARD_RUNWAY/2,moveAmplitude:moving?Math.min(1.7,course.width*.32):0,movePhase:i*.8,movePeriod:3.2+(i%3)*.45,moving,y,w:course.width+(checkpoint?1.8:0),d:depth+FORWARD_RUNWAY,type:i===course.count?'finish':checkpoint?'checkpoint':'normal',index:i,extended});
  }
  result.at(-1).w=8;result.at(-1).d=8;
  return result;
}
export function updateMovingPlatforms(platforms,time){
  for(const p of platforms){
    if(!p.moving)continue;
    p.x=p.homeX+Math.sin(time*Math.PI*2/p.movePeriod+p.movePhase)*p.moveAmplitude;
  }
}
export function makeAlternatePlatforms(course,platforms){
  return course.alternateRoutes.flatMap((index,routeNumber)=>{
    const side=routeNumber%2? -1:1;
    return [index,index+1].flatMap(routeIndex=>{
      const source=platforms[routeIndex];
      if(!source||source.type==='finish')return [];
      const width=Math.max(2.4,source.w*.65),offset=Math.max(3,source.w/2+width/2+.35)*side;
      return [{x:source.x+offset,z:source.z-1.4,y:source.y+.12,w:width,d:Math.max(2.6,source.d*.65),type:'alternate',index:routeIndex,moving:false}];
    });
  });
}
export function makeWalls(course,platforms){
  const walls=[];
  if(course.wallTier)for(let i=2;i<platforms.length;i++){
    const a=platforms[i-1],b=platforms[i];
    const run=b.extended||course.wallTier>=2&&(i%4===0||course.id==='wall-school');
    if(!run&&i%3!==0)continue;
    const side=Math.floor(i/4)%2?1:-1;
    const center=(a.x+b.x)/2;
    const edge=side>0?Math.max(a.x+a.w/2,b.x+b.w/2):Math.min(a.x-a.w/2,b.x-b.w/2);
    const base=Math.min(a.y,b.y)-2.5;
    walls.push({id:`wall-${i}`,x:run?center+side*(Math.max(a.w,b.w)/2+.35):edge+side*.55,z:(a.z+b.z)/2,
      w:.8,d:Math.abs(a.z-b.z)+(a.d+b.d)/2+.8,bottom:base,top:Math.max(a.y,b.y)+4.2,
      runnable:true,side,index:i,kind:run?'run':'barrier'});
    // Alternating corridor walls create a real navigational constraint.
    if(course.wallTier>=2&&!run&&i%6===3)walls.push({id:`opposite-${i}`,x:edge-side*(Math.max(a.w,b.w)+1.8),z:b.z,w:.8,d:b.d+1,bottom:base,top:b.y+3.3,runnable:true,side:-side,index:i,kind:'barrier'});
  }
  for(const index of new Set([...course.tunnels,...course.indoor])){
    const p=platforms[index];if(!p)continue;
    const indoor=course.indoor.includes(index),height=indoor?5.3:4.2,thickness=.5;
    for(const side of [-1,1])walls.push({
      id:`${indoor?'indoor':'tunnel'}-${index}-${side}`,
      x:p.x+side*(p.w/2+thickness/2),z:p.z,w:thickness,d:p.d+.3,
      bottom:p.y,top:p.y+height,runnable:false,side,index,kind:'architecture',
    });
    walls.push({
      id:`${indoor?'indoor':'tunnel'}-${index}-roof`,
      x:p.x,z:p.z,w:p.w+thickness*2,d:p.d+.3,
      bottom:p.y+height-.45,top:p.y+height,runnable:false,index,kind:'roof',
    });
  }
  return walls;
}
const slideSections={
  coastline:[5,10],breakwater:[5,10],'wall-school':[5,10,14],tideline:[6,13],
  aqueduct:[7,15],driftworks:[6,13,20],undertow:[7,15,23],nightshift:[8,17,26],
  'zero-margin':[9,19,29],
};
export function makeSlideObstacles(course,platforms){
  const generated=Array.from({length:Math.ceil((course.count-4)/5)},(_,i)=>4+i*5);
  const sections=new Set([...(slideSections[course.id]??[]),...generated]);
  return [...sections].sort((a,b)=>a-b).flatMap(index=>{
    const platform=platforms[index];
    if(!platform)return [];
    return [{
      id:`slide-${index}`,kind:'slide',x:platform.x,z:platform.z+FORWARD_RUNWAY/2,
      w:platform.w+.45,d:1.2,
      bottom:platform.y+.82,top:platform.y+1.3,index,
    }];
  });
}
export function makePowerups(course,platforms){
  const obstacleIndices=new Set(makeSlideObstacles(course,platforms).map(obstacle=>obstacle.index)),usedIndices=new Set();
  const pickups=[];
  for(let index=3;index<course.count;index+=7){
    let platform=null;
    for(let offset=0;offset<4&&index+offset<course.count;offset++){
      const candidate=platforms[index+offset];
      if(candidate&&!candidate.moving&&!obstacleIndices.has(candidate.index)&&!usedIndices.has(candidate.index)){platform=candidate;break;}
    }
    if(!platform)continue;
    usedIndices.add(platform.index);
    pickups.push({
      id:`pickup-${platform.index}`,index:platform.index,type:pickups.length%2===0?'surge':'feather',
      x:platform.x,y:platform.y+1.05,z:platform.z,
    });
  }
  return pickups;
}
