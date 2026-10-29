// 頻率計算工具
import * as Tone from 'tone';

export const getETCalculation = (note: string) => {
  const freq = Tone.Frequency(note).toFrequency();
  // 計算該音符距離 A4 (MIDI 69) 的半音差
  const midi = Tone.Frequency(note).toMidi();
  const i = midi - 69; 
  
  // 回傳格式化後的字串與數值
  return {
    pitch: note.replace(/[0-9]/g, ''),
    octave: note.replace(/\D/g, ''),
    frequency: freq.toFixed(2),
    semitonesFromA4: i,
    formula: `440 × (12√2)^${i}`
  };
};