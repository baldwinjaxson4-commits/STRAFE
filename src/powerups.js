function distanceToSegment(point,start,end){
  const dx=end.x-start.x,dy=end.y-start.y,dz=end.z-start.z;
  const length=dx*dx+dy*dy+dz*dz;
  const t=length?Math.max(0,Math.min(1,((point.x-start.x)*dx+(point.y-start.y)*dy+(point.z-start.z)*dz)/length)):0;
  return Math.hypot(point.x-start.x-t*dx,point.y-start.y-t*dy,point.z-start.z-t*dz);
}
export function collectPowerup(player,powerups,claimed,start=player){
  const from={x:start.x,y:start.y+.82,z:start.z},to={x:player.x,y:player.y+.82,z:player.z};
  for(const powerup of powerups){
    if(claimed.has(powerup.id))continue;
    if(distanceToSegment(powerup,from,to)<=.85){
      claimed.add(powerup.id);
      return powerup;
    }
  }
  return null;
}
