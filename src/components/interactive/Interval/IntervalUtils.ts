import * as Tone from 'tone';

const PITCH_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

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

  return {
    lowNote,
    highNote,
    semitones,
    wholetones: wholetones.toFixed(1),
    degree,
  };
};