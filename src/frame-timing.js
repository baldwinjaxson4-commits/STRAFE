export const MAX_FRAME_DELTA=.05;
export const MAX_RECORDABLE_FRAME_GAP=MAX_FRAME_DELTA+.001;
export function clampFrameDelta(seconds){
  return Number.isFinite(seconds)?Math.max(0,Math.min(seconds,MAX_FRAME_DELTA)):0;
}
export function frameGapInvalidatesRun(seconds){
  return Number.isFinite(seconds)&&seconds>MAX_RECORDABLE_FRAME_GAP;
}
