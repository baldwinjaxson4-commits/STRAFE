// Original procedural soundtrack: each arrangement gets a 32-bar turn.
export const LOOP_STEPS=32*16;
export const SONGS=[
  {
    title:'Tidal Circuit',bpm:112,
    chords:[[50,57,60,65],[46,53,57,62],[53,60,64,69],[48,55,58,64]],
    motif:[0,7,12,10,7,3,5,7,0,3,7,14,12,10,7,5],
    kick:[0,4,8,12],snare:[4,12],bass:[0,3,6,8,11,14],
  },
  {
    title:'Velocity Bloom',bpm:120,
    chords:[[52,59,62,67],[57,64,67,71],[50,57,60,65],[55,62,66,69]],
    motif:[7,10,14,12,10,7,5,3,7,12,15,14,10,5,3,2],
    kick:[0,4,7,10,12],snare:[4,12],bass:[0,2,6,8,10,14],
  },
  {
    title:'Neon Overdrive',bpm:126,
    chords:[[45,52,55,60],[48,55,58,63],[53,60,63,67],[50,57,60,65]],
    motif:[0,3,7,12,15,12,10,7,3,5,10,14,12,7,5,3],
    kick:[0,3,6,8,11,14],snare:[4,10,12],bass:[0,3,5,8,11,13],
  },
  {
    title:'Emberline',bpm:104,
    chords:[[48,55,60,64],[43,50,55,59],[45,52,57,60],[41,48,53,57]],
    motif:[0,5,7,12,10,7,5,2,0,5,9,12,14,12,7,5],
    kick:[0,5,8,12],snare:[4,12],bass:[0,4,7,8,12,15],
  },
];
export const BPM=SONGS[0].bpm;
export const STEP_SECONDS=60/BPM/4;

function cyclePosition(step){
  const position=((step%(LOOP_STEPS*SONGS.length))+(LOOP_STEPS*SONGS.length))%(LOOP_STEPS*SONGS.length);
  return{song:SONGS[Math.floor(position/LOOP_STEPS)],localStep:position%LOOP_STEPS};
}
export function songAtStep(step){return cyclePosition(step).song;}
export function stepDuration(step){return 60/songAtStep(step).bpm/4;}
export function scoreStep(step){
  const{song,localStep}=cyclePosition(step),bar=Math.floor(localStep/16),beat=localStep%16;
  const chord=song.chords[Math.floor(bar/2)%song.chords.length],notes=[],beatSeconds=60/song.bpm;
  if(beat===0)notes.push({voice:'pad',notes:chord.map(note=>note+12),duration:beatSeconds*3.8,gain:.025});
  if(song.kick.includes(beat))notes.push({voice:'kick',gain:bar%8>=6?.045:.035,duration:.22});
  if(song.snare.includes(beat))notes.push({voice:'snare',gain:.055,duration:.14});
  if(beat%2===0||(bar%4===3&&beat>11))notes.push({voice:'hat',gain:beat%4===2?.024:.014,duration:.045});
  if(song.bass.includes(beat))notes.push({voice:'bass',notes:[chord[0]-12+(beat===14?12:0)],gain:.075,duration:beatSeconds/4*(beat%2?1.4:2)});
  if(bar>=4&&beat%2===0){
    const motifIndex=(Math.floor(localStep/2)+Math.floor(bar/8)*3)%song.motif.length;
    notes.push({voice:'lead',notes:[chord[0]+24+song.motif[motifIndex]],gain:bar<16?.020:.027,duration:beatSeconds/4*1.45});
  }
  return notes;
}
export function midiFrequency(note){return 440*2**((note-69)/12);}
