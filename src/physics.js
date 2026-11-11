// Metres / seconds; rendered HUD converts to familiar game units.
export const FIXED_DT=1/120;
export const PHYSICS={radius:.28,height:1.65,slideHeight:.66,slideDuration:1.1,slideStartSpeed:4.5,slideBoost:1.08,slideFriction:1.6,gravity:22,jump:8.2,groundSpeed:8.3,groundAcceleration:65,airAcceleration:26,airWishCap:4,landingForgiveness:.1,coyoteTime:.1,maxSpeed:23,friction:7.5,wallDuration:3,wallReach:.55,wallSpeed:10.5,frontflipDuration:.78,frontflipCooldown:1.5,surgeDuration:1.6,surgeSpeedBonus:4};
export function createPlayer(spawn={x:0,y:0,z:5}){
  return {x:spawn.x,y:spawn.y,z:spawn.z,vx:0,vy:0,vz:0,grounded:true,coyoteTime:0,jumps:0,landed:null,jumpHeld:false,wallRunning:false,wallTime:0,wallSide:0,wallCooldown:0,sliding:false,slideTime:0,slideQueued:false,slideHeld:false,slideBlocked:false,supportIndex:null,supportX:null,supportZ:null,supportVx:0,supportVz:0,frontflipTime:0,frontflipCooldown:0,extraJumpCharges:0,boostTime:0};
}
function overlapAt(p,b,x=p.x,z=p.z,padding=0){return x+PHYSICS.radius+padding>b.x-b.w/2&&x-PHYSICS.radius-padding<b.x+b.w/2&&z+PHYSICS.radius+padding>b.z-b.d/2&&z-PHYSICS.radius-padding<b.z+b.d/2;}
function overlap(p,b){return overlapAt(p,b);}
function top(b){return b.top??b.y;}
function bottom(b){return b.bottom??b.y-2.5;}
function verticalOverlap(p,b){return p.y<top(b)-.015&&p.y+(p.sliding?PHYSICS.slideHeight:PHYSICS.height)>bottom(b)+.015;}
export function nearbyWall(p,walls){
  let nearest=null;
  for(const wall of walls){
    if(!wall.runnable||!verticalOverlap(p,wall))continue;
    const faces=[
      {distance:Math.abs(p.x-(wall.x-wall.w/2))-PHYSICS.radius,nx:-1,nz:0,within:p.z>=wall.z-wall.d/2&&p.z<=wall.z+wall.d/2},
      {distance:Math.abs(p.x-(wall.x+wall.w/2))-PHYSICS.radius,nx:1,nz:0,within:p.z>=wall.z-wall.d/2&&p.z<=wall.z+wall.d/2},
      {distance:Math.abs(p.z-(wall.z-wall.d/2))-PHYSICS.radius,nx:0,nz:-1,within:p.x>=wall.x-wall.w/2&&p.x<=wall.x+wall.w/2},
      {distance:Math.abs(p.z-(wall.z+wall.d/2))-PHYSICS.radius,nx:0,nz:1,within:p.x>=wall.x-wall.w/2&&p.x<=wall.x+wall.w/2},
    ];
    for(const f of faces)if(f.within&&f.distance>=-.1&&f.distance<=PHYSICS.wallReach&&(!nearest||f.distance<nearest.distance))nearest={...f,wall};
  }
  return nearest;
}
function moveAxis(p,axis,amount,blocks){
  const old=p[axis];p[axis]+=amount;
  for(const b of blocks){
    if(!verticalOverlap(p,b)||!overlap(p,b))continue;
    const mid=axis==='x'?b.x:b.z,half=(axis==='x'?b.w:b.d)/2;
    const velocity=axis==='x'?'vx':'vz';
    const preserveSlideMomentum=b.kind==='slide'&&p.slideQueued&&!p.grounded;
    if(old<=mid-half){p[axis]=mid-half-PHYSICS.radius;if(!preserveSlideMomentum)p[velocity]=0;}
    else if(old>=mid+half){p[axis]=mid+half+PHYSICS.radius;if(!preserveSlideMomentum)p[velocity]=0;}
  }
}
export function stepPlayer(p,input,yaw,platforms,dt=FIXED_DT,autoHop=true,walls=[],obstacles=[]){
  p.landed=null;const wasWallRunning=p.wallRunning;p.wallRunning=false;p.wallCooldown=Math.max(0,p.wallCooldown-dt);
  p.frontflipCooldown=Math.max(0,p.frontflipCooldown-dt);
  p.frontflipTime=Math.max(0,p.frontflipTime-dt);
  p.boostTime=Math.max(0,p.boostTime-dt);
  if(p.grounded&&p.supportIndex!==null){
    const support=platforms.find(b=>b.index===p.supportIndex&&b.type!=='alternate');
    if(support){
      const dx=support.x-p.supportX,dz=support.z-p.supportZ;
      p.x+=dx;p.z+=dz;p.supportVx=dx/dt;p.supportVz=dz/dt;
      p.supportX=support.x;p.supportZ=support.z;
    }else p.supportIndex=null;
  }
  p.coyoteTime=p.grounded?PHYSICS.coyoteTime:Math.max(0,(p.coyoteTime??0)-dt);
  if(p.grounded){p.wallTime=0;p.wallSide=0;}
  const slidePressed=input.slide&&!p.slideHeld;
  p.slideHeld=!!input.slide;
  if(slidePressed){p.slideTime=PHYSICS.slideDuration;p.slideBlocked=false;}
  if(!input.slide){p.slideQueued=false;p.sliding=false;p.slideTime=PHYSICS.slideDuration;p.slideBlocked=false;}
  let right=(input.right?1:0)-(input.left?1:0),forward=(input.forward?1:0)-(input.back?1:0);
  const mag=Math.hypot(right,forward);if(mag){right/=mag;forward/=mag;}
  const wx=Math.cos(yaw)*right-Math.sin(yaw)*forward,wz=-Math.sin(yaw)*right-Math.cos(yaw)*forward;
  if(input.slide&&!p.grounded&&!p.slideBlocked)p.slideQueued=true;
  // Jump before friction so chained hops retain momentum.
  if((p.grounded||p.coyoteTime>0)&&input.jump&&(autoHop||!p.jumpHeld)&&(!p.sliding||!autoHop)){p.vy=PHYSICS.jump;p.grounded=false;p.coyoteTime=0;p.sliding=false;p.jumps++;}
  else if(!p.grounded&&!p.wallRunning&&input.airJump&&p.extraJumpCharges>0&&!((wasWallRunning||input.wallRun)&&nearbyWall(p,walls))){
    p.vy=PHYSICS.jump*.86;p.extraJumpCharges--;p.jumps++;p.frontflipTime=0;
  }
  if(!p.grounded&&!p.wallRunning&&input.frontflip&&p.frontflipCooldown===0){
    p.frontflipTime=PHYSICS.frontflipDuration;p.frontflipCooldown=PHYSICS.frontflipCooldown;
  }
  p.jumpHeld=!!input.jump;
  if(p.grounded&&input.slide&&!p.slideBlocked&&!p.sliding&&Math.hypot(p.vx,p.vz)>=PHYSICS.slideStartSpeed){
    p.sliding=true;p.vx*=PHYSICS.slideBoost;p.vz*=PHYSICS.slideBoost;
  }
  if(p.sliding){
    p.slideTime=Math.max(0,p.slideTime-dt);
    if(!p.grounded||p.slideTime===0){
      p.sliding=false;
      if(p.slideTime===0)p.slideBlocked=true;
    }
  }
  if(p.grounded){const speed=Math.hypot(p.vx,p.vz);if(speed){const friction=p.sliding?PHYSICS.slideFriction:PHYSICS.friction;const n=Math.max(0,speed-Math.max(speed,2)*friction*dt)/speed;p.vx*=n;p.vz*=n;}}
  if(mag){const current=p.vx*wx+p.vz*wz;const wish=p.grounded?PHYSICS.groundSpeed:PHYSICS.airWishCap;const acceleration=p.grounded?(p.sliding?10:PHYSICS.groundAcceleration):PHYSICS.airAcceleration;const amount=Math.min(Math.max(0,wish-current),acceleration*dt);p.vx+=wx*amount;p.vz+=wz*amount;}
  const contact=!p.grounded?nearbyWall(p,walls):null;
  const wallSpeed=Math.hypot(p.vx,p.vz);
  const wallJump=input.wallJump&&contact&&(wasWallRunning||input.wallRun)&&wallSpeed>2;
  const wallRun=input.wallRun&&contact&&p.wallTime<PHYSICS.wallDuration-1e-7&&(p.wallCooldown===0||wallJump&&wasWallRunning)&&wallSpeed>2;
  if(wallRun||wallJump){
    p.wallRunning=wallRun&&!wallJump;
    if(wallRun){p.wallTime=Math.min(PHYSICS.wallDuration,p.wallTime+dt);if(PHYSICS.wallDuration-p.wallTime<1e-7)p.wallTime=PHYSICS.wallDuration;}
    const {nx,nz}=contact;
    p.wallSide=Math.sign(nx*Math.cos(yaw)-nz*Math.sin(yaw));
    const tx=-nz,tz=nx;
    const projected=p.vx*tx+p.vz*tz;
    const direction=Math.sign(projected)||Math.sign(wx*tx+wz*tz)||1;
    const tangentSpeed=Math.max(Math.abs(projected),PHYSICS.wallSpeed);
    p.vx=tx*direction*tangentSpeed;p.vz=tz*direction*tangentSpeed;
    p.vy=Math.max(p.vy,-.55);
    if(wallJump){p.vx+=nx*5.5;p.vz+=nz*5.5;p.vy=PHYSICS.jump*.88;p.wallRunning=false;p.wallCooldown=.12;p.jumps++;}
  }
  const speed=Math.hypot(p.vx,p.vz),maxSpeed=PHYSICS.maxSpeed+(p.boostTime>0?PHYSICS.surgeSpeedBonus:0);if(speed>maxSpeed){p.vx*=maxSpeed/speed;p.vz*=maxSpeed/speed;}
  const oldX=p.x,oldY=p.y,oldZ=p.z,blocks=[...platforms,...walls,...obstacles];
  moveAxis(p,'x',p.vx*dt,blocks);moveAxis(p,'z',p.vz*dt,blocks);
  p.vy-=(p.wallRunning?1.5:PHYSICS.gravity)*dt;p.y+=p.vy*dt;p.grounded=false;
  let landing=null;
  let landingPosition=null;
  for(const b of blocks){
    if(p.vy<=0&&oldY>=top(b)-.02&&p.y<=top(b)){
      const fraction=(oldY-top(b))/(oldY-p.y);
      const x=oldY<=top(b)?p.x:oldX+(p.x-oldX)*fraction,z=oldY<=top(b)?p.z:oldZ+(p.z-oldZ)*fraction;
      if(overlapAt(p,b,x,z,PHYSICS.landingForgiveness)&&(!landing||top(b)>top(landing))){
        landing=b;landingPosition={x,z};
      }
    }
    if(!overlap(p,b))continue;
    if(p.vy>0&&oldY+(p.sliding?PHYSICS.slideHeight:PHYSICS.height)<=bottom(b)&&p.y+(p.sliding?PHYSICS.slideHeight:PHYSICS.height)>=bottom(b)){p.y=bottom(b)-(p.sliding?PHYSICS.slideHeight:PHYSICS.height);p.vy=0;}
  }
  if(landing){
    p.x=landingPosition.x;p.z=landingPosition.z;p.y=top(landing);p.vy=0;p.grounded=true;p.coyoteTime=PHYSICS.coyoteTime;p.wallRunning=false;p.wallTime=0;p.wallSide=0;p.landed=landing.top===undefined?landing.index:null;
    p.supportIndex=landing.type==='alternate'?null:(landing.index??null);p.supportX=landing.x;p.supportZ=landing.z;
    if(p.slideQueued&&input.slide&&!p.slideBlocked){p.slideQueued=false;p.sliding=true;p.vx*=PHYSICS.slideBoost;p.vz*=PHYSICS.slideBoost;}
  }
  if(!p.grounded&&p.supportIndex!==null){
    p.vx+=p.supportVx;p.vz+=p.supportVz;p.supportIndex=null;p.supportVx=0;p.supportVz=0;
  }
  return p;
}
export function respawnPlayer(p,spawn){const jumps=p.jumps;Object.assign(p,createPlayer(spawn));p.jumps=jumps;}
