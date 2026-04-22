import * as Tone from 'tone';

const PITCH_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const MAJOR_SCALE_INTERVALS: Record<number, number> = {
  1: 0,  // 完全一度
  2: 2,  // 大二度
  3: 4,  // 大三度
  4: 5,  // 完全四度
  5: 7,  // 完全五度
  6: 9,  // 大六度
  7: 11, // 大七度
  8: 12  // 完全八度
};

const PERFECT_DEGREES = [1, 4, 5, 8];

export const calculateInterval = (note1: string, note2: string) => {
  const midi1 = Tone.Frequency(note1).toMidi();
  const midi2 = Tone.Frequency(note2).toMidi();

  // 確保 note1 永遠是較低的音
  const [lowNote, highNote] = [note1, note2].sort((a, b) => 
    Tone.Frequency(a).toMidi() - Tone.Frequency(b).toMidi()
  );

  const semitones = Math.abs(midi1 - midi2);
  const wholetones = semitones / 2;

  const name1 = lowNote.charAt(0);
  const name2 = highNote.charAt(0);
  const oct1 = parseInt(lowNote.replace(/\D/g, ''));
  const oct2 = parseInt(highNote.replace(/\D/g, ''));
  
  const index1 = PITCH_NAMES.indexOf(name1);
  const index2 = PITCH_NAMES.indexOf(name2);

  const degree = (index2 - index1) + (oct2 - oct1) * 7 + 1;

  let quality = '';
  let fullIntervalName = '';

  // 我們只處理一個八度內的命名，超過八度的簡單顯示度數即可
  if (degree >= 1 && degree <= 8) {
    const standardSemitones = MAJOR_SCALE_INTERVALS[degree];
    const diff = semitones - standardSemitones;

    const isPerfectType = PERFECT_DEGREES.includes(degree);

    if (isPerfectType) {
      // 1, 4, 5, 8 度：完全、增、減
      if (diff === 0) quality = '完全';
      else if (diff === 1) quality = '增';
      else if (diff === -1) quality = '減';
      else if (diff > 1) quality = '倍增';
      else if (diff < -1) quality = '倍減';
    } else {
      // 2, 3, 6, 7 度：大、小、增、減
      if (diff === 0) quality = '大';
      else if (diff === -1) quality = '小';
      else if (diff === 1) quality = '增';
      else if (diff <= -2) quality = '減'; // 降兩個半音才是減
      else if (diff > 1) quality = '倍增';
    }

    fullIntervalName = `${quality} ${degree} 度`;
  } else {
    fullIntervalName = `相差 ${degree} 度`;
  }

  return {
    lowNote,
    highNote,
    semitones,
    wholetones: wholetones.toFixed(1),
    degree,
    quality,
    fullIntervalName,
  };
};