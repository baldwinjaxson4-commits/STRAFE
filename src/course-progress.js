export function crossedFinishLine(previous,current,finish){
  if(!previous||!current||!finish||current.z>=previous.z)return false;
  const line=finish.z+finish.d/2;
  if(previous.z<line||current.z>line)return false;
  const fraction=(previous.z-line)/(previous.z-current.z);
  const x=previous.x+(current.x-previous.x)*fraction;
  const y=previous.y+(current.y-previous.y)*fraction;
  return Math.abs(x-finish.x)<=finish.w/2+.28&&y>=finish.y-.1&&y<=finish.y+5;
}
export function checkpointSpawn(platforms,index){
  const platform=platforms.find(item=>item.index===index&&item.type==='checkpoint');
  return platform?{x:platform.x,y:platform.y,z:platform.z}:null;
}
