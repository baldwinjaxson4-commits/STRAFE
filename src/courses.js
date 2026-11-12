const FORWARD_RUNWAY=1.2;
const levelDesigns={
  'movement-lab':{slides:[6],moving:[9],gaps:[],phase:0,frequency:.31},
  coastline:{slides:[4,9],moving:[7],gaps:[],phase:.19,frequency:.27},
  breakwater:{slides:[6,12],moving:[8,13],gaps:[11],phase:.41,frequency:.34},
  'wall-school':{slides:[4,9,13],moving:[7,12],gaps:[],phase:.63,frequency:.23},
  overpass:{slides:[5,14],moving:[12,16],gaps:[9],phase:.82,frequency:.29},
  tideline:{slides:[6,13,17],moving:[8,15],gaps:[10],phase:1.04,frequency:.38},
  aqueduct:{slides:[5,11,18],moving:[9,17],gaps:[14],phase:1.23,frequency:.25},
  driftworks:{slides:[7,16,21],moving:[10,18],gaps:[12,19],phase:1.47,frequency:.32},
  'glacier-run':{slides:[5,15],moving:[8,16],gaps:[12,18],phase:1.68,frequency:.22},
  afterglow:{slides:[6,15,19],moving:[9,17],gaps:[11],phase:1.91,frequency:.36},
  cinder:{slides:[5,12,20],moving:[8,16],gaps:[14,21],phase:2.13,frequency:.26},
  skyline:{slides:[7,14,21],moving:[10,18],gaps:[12,19],phase:2.34,frequency:.33},
  switchback:{slides:[6,18],moving:[8,16],gaps:[11,20],phase:2.56,frequency:.24},
  crosswind:{slides:[5,13,22],moving:[9,17,23],gaps:[10,19],phase:2.79,frequency:.39},
  undertow:{slides:[8,17,25],moving:[11,20],gaps:[13,22],phase:3.01,frequency:.28},
  'magma-run':{slides:[6,15,20],moving:[9,18],gaps:[11,19],phase:3.22,frequency:.35},
  foundry:{slides:[5,14,22],moving:[7,19],gaps:[10,17,23],phase:3.44,frequency:.21},
  'signal-garden':{slides:[6,16,24],moving:[9,18,25],gaps:[12,20],phase:3.67,frequency:.37},
  highwire:{slides:[7,17,23],moving:[10,19],gaps:[12,21],phase:3.89,frequency:.3},
  razorline:{slides:[6,15,23],moving:[8,17,24],gaps:[11,19],phase:4.1,frequency:.2},
  'neon-spine':{slides:[6,15,24],moving:[9,20,27],gaps:[12,21],phase:4.32,frequency:.4},
  monolith:{slides:[8,18,26],moving:[11,21],gaps:[13,23],phase:4.55,frequency:.27},
  nightshift:{slides:[7,19,28],moving:[10,21],gaps:[12,24],phase:4.77,frequency:.34},
  canopy:{slides:[6,15,25],moving:[9,18,26],gaps:[12,22],phase:4.98,frequency:.23},
  terminal:{slides:[8,20,29],moving:[11,23,30],gaps:[14,25],phase:5.2,frequency:.31},
  'endless-blue':{slides:[7,18,30,37],moving:[10,22,34],gaps:[13,25,36],phase:5.43,frequency:.26},
  'zero-margin':{slides:[8,17,27,33],moving:[11,21,31],gaps:[12,23,32],phase:5.65,frequency:.38},
  'orbit-breaker':{slides:[6,16,27,34],moving:[10,24,32],gaps:[13,22,31],phase:5.87,frequency:.22},
};
const descriptions={
  'movement-lab':'A marked-out practice course: build speed, switch lanes, then learn to wall-run.',
  coastline:'A broad seaside warm-up with long, forgiving arcs and scattered low gates.',
  breakwater:'Short, punchy crossings weave between offset sea walls and exposed gaps.',
  'wall-school':'A straight approach breaks into a wall-run corridor built for deliberate transfers.',
  overpass:'Thread beneath a layered highway, ducking beams before the route swings wide.',
  tideline:'A rolling shoreline slalom with drifting pads and a rhythm of tight turns.',
  aqueduct:'Run the covered waterway, ducking through roofed channels between raised basins.',
  driftworks:'A scrapyard of offset catwalks, broad sweeps, and shifting metal decks.',
  'glacier-run':'Cut across slick ice shelves, moving floes, and narrow frozen crests.',
  afterglow:'A sunset rooftop route of broad curves, staggered heights, and warm-lit gates.',
  cinder:'Cross a scorched quarry where tight ledges skirt the ash pits.',
  skyline:'Climb a stepped skyline, chaining elevated rooftops into a sharp final ascent.',
  switchback:'Alternate sides across a mountain pass, with a risky detour on the inside line.',
  crosswind:'Fight gust-like lateral shifts across a sequence of exposed, narrow spans.',
  undertow:'Drop into a submerged service trench, then climb out through close-set walls.',
  'magma-run':'Thread basalt switchbacks above a glowing lava sea and timed moving ledges.',
  foundry:'Cut through a furnace hall of steel walkways and moving machinery.',
  'signal-garden':'Follow a branching neon garden among luminous pylons and wall-run lanes.',
  highwire:'A narrow high-altitude sprint with little room to correct a missed landing.',
  razorline:'A fast, alternating knife-edge route where every transfer demands precision.',
  'neon-spine':'Scale a luminous central spine, jumping between sharply offset light decks.',
  monolith:'Circle massive dark pillars on a heavy, deliberate sequence of isolated pads.',
  nightshift:'Race through a closed industrial district of roofed passages and moving lights.',
  canopy:'Leap between emerald platforms woven through a bioluminescent forest.',
  terminal:'A long switchback gauntlet through a packed transit hub and its moving platforms.',
  'endless-blue':'An extended ocean crossing with rolling lines, long gaps, and few safe pauses.',
  'zero-margin':'The tightest route in the set: thin stairs, close gates, and almost no recovery space.',
  'orbit-breaker':'Navigate orbital stations, airlocks, and suspended routes above the planet.',
};
function hslHex(h,s,l){
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return Number.parseInt([r,g,b].map(value=>Math.round((value+m)*255).toString(16).padStart(2,'0')).join(''),16);
}
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
  routePhase:levelDesigns[id].phase,
  routeFrequency:levelDesigns[id].frequency,
  gapSections:levelDesigns[id].gaps,
  scenerySeed:i*.73,
  training:id==='movement-lab',
  environment:({
    'magma-run':'volcanic','signal-garden':'neon','glacier-run':'arctic',
    foundry:'industrial',canopy:'canopy','orbit-breaker':'orbital',
  })[id]??'coastal',
  movingSections:levelDesigns[id].moving,
  alternateRoutes:id==='switchback'?[8]:id==='endless-blue'?[12,28]:id==='canopy'?[12,22]:[],
  tunnels:id==='aqueduct'?[6,7,8]:id==='terminal'?[12,13,14]:id==='orbit-breaker'?[9,10,11]:id==='undertow'?[9,10,11]:[],
  indoor:id==='overpass'?[6,7,8]:id==='nightshift'?[14,15,16]:id==='foundry'?[8,9,10]:id==='aqueduct'?[15,16]:[],
  color:({
    'magma-run':0xff7048,'signal-garden':0xc783ff,'glacier-run':0x8beaff,
    foundry:0xffbc62,canopy:0x9df078,'orbit-breaker':0x9e8cff,
  })[id]??hslHex((i*137.508+24)%360,.72,.61),
  surface:hslHex((i*137.508+24)%360,.12,.58),
  darkSurface:hslHex((i*137.508+204)%360,.25,.24),
  surfaceRoughness:.35+(i%7)*.09,
  surfaceMetalness:(i%6)*.08,
  water:({
    'magma-run':0x481d26,'signal-garden':0x192f55,'glacier-run':0x16485d,
    foundry:0x43332a,canopy:0x124b43,'orbit-breaker':0x171b42,
  })[id]??hslHex((i*137.508+224)%360,.48,.2),
  sky:({
    'magma-run':0x583744,'signal-garden':0x58638f,'glacier-run':0x9bd5e2,
    foundry:0x685346,canopy:0x598770,'orbit-breaker':0x3c477f,
  })[id]??hslHex((i*137.508+59)%360,.35,.72),
  raise:i<3?[.10,.12,.13][i]:.1+(i%3)*.035,
  medals:(()=>{const gold=count*(spacing*.075+.72)+2+(wallTier===3?Math.ceil(count/6)*.5:0);return{gold,silver:gold*1.22,bronze:gold*1.5};})(),
  description:descriptions[id],
  // A layout version prevents an old replay racing a changed map.
  version:6,
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
    z-=extended?13:course.spacing+(course.gapSections.includes(i) ? 0.8 : 0);
    let x=Math.sin(i*.58)*course.amplitude;
    if(course.pattern==='straight')x=0;
    if(course.pattern==='sweep')x=Math.sin(i*.28)*course.amplitude;
    if(course.pattern==='zigzag')x=Math.sin(i*Math.PI/4)*course.amplitude;
    if(course.pattern==='switchback')x=(i%2?1:-1)*course.amplitude;
    if(course.pattern==='training'){
      x=i<=1?0:i<=4?(i%2?1:-1)*course.amplitude*.72:i<=7?(i%2?-1:1)*course.amplitude*.7:Math.sin(i*.9)*course.amplitude*.72;
    }
    if(course.pattern!=='training'&&course.pattern!=='straight'){
      x+=Math.sin(i*course.routeFrequency+course.routePhase)*course.amplitude*.08;
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
export function makeSlideObstacles(course,platforms){
  const sections=new Set(levelDesigns[course.id]?.slides??[]);
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
