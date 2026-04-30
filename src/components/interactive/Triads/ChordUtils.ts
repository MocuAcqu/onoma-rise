import * as Tone from 'tone';

export const TRIAD_FORMULAS: Record<string, number[]> = {
  'Major':    [0, 4, 7],     // 大三和弦 (根音, 大三度, 純五度)
  'Minor':    [0, 3, 7],     // 小三和弦 (根音, 小三度, 純五度)
  'Augmented':[0, 4, 8],     // 增三和弦 (根音, 大三度, 增五度)
  'Diminished':[0, 3, 6],    // 減三和弦 (根音, 小三度, 減五度)
};

export const CHORD_INTERVAL_LABELS: Record<string, string[]> = {
  'Major': ['大三度', '小三度'],      
  'Minor': ['小三度', '大三度'],     
  'Augmented': ['大三度', '大三度'],
  'Diminished': ['小三度', '小三度'],
};

export const SEVENTH_CHORD_FORMULAS: Record<string, number[]> = {
  'Major 7th':    [0, 4, 7, 11], // 大七和弦 (M7)
  'Minor 7th':    [0, 3, 7, 10], // 小七和弦 (m7)
  'Dominant 7th': [0, 4, 7, 10], // 屬七和弦 (7)
  'Minor Major 7th': [0, 3, 7, 11], // 小大七和弦 (mM7)
  'Half Diminished 7th': [0, 3, 6, 10], // 半減七和弦 (m7b5)
  'Diminished 7th': [0, 3, 6, 9],  // 減七和弦 (dim7)
  'Augmented 7th': [0, 4, 8, 10], // 增七和弦 (aug7)
  'Augmented Major 7th': [0, 4, 8, 11], // 增大七和弦 (aug M7)
};

const BASE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_TO_SEMITONE: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };

export const getNoteY = (pitch: string) => {
  const letter = pitch.charAt(0).toUpperCase(); 
  const octave = parseInt(pitch.replace(/\D/g, '')) || 4;
  const letterMap: Record<string, number> = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
  
  const basePos = letterMap[letter];
  const degreeDiff = ((octave - 4) * 7 + basePos) - 2.8; 
  
  return degreeDiff * 8; // 每度 8px
};

export const getAccidental = (pitch: string) => {
  if (pitch.includes('bb')) return '𝄫';
  if (pitch.includes('b')) return '♭';
  if (pitch.includes('##') || pitch.includes('x')) return 'x';
  if (pitch.includes('#')) return '♯';
  return null;
};

export const generateChordNotes = (rootNote: string, chordType: string, isSeventh: boolean = false) => {
  const formulas = isSeventh ? SEVENTH_CHORD_FORMULAS : TRIAD_FORMULAS;
  const formula = formulas[chordType];
  if (!formula) return [];

  const rootLetter = rootNote.charAt(0).toUpperCase();
  const rootAccidental = rootNote.includes('b') ? -1 : rootNote.includes('#') ? 1 : 0;
  const rootMidiBase = 60 + LETTER_TO_SEMITONE[rootLetter] + rootAccidental;
  
  const rootLetterIndex = BASE_LETTERS.indexOf(rootLetter);

  const chordNotes = formula.map((semitonesFromRoot, i) => {
    const degreeStep = i * 2; 
    const targetLetterIndex = (rootLetterIndex + degreeStep) % 7;
    const targetLetter = BASE_LETTERS[targetLetterIndex];
    
    const targetMidi = rootMidiBase + semitonesFromRoot;
    
    let octave = 4;
    if (targetMidi >= 72) octave = 5; 
    if (targetMidi < 60) octave = 3; 
    
    const baseLetterMidi = (octave + 1) * 12 + LETTER_TO_SEMITONE[targetLetter];
    
    let diff = targetMidi - baseLetterMidi;
    
    while (diff > 6) diff -= 12;
    while (diff < -6) diff += 12;

    let accidentalStr = '';
    if (diff === 1) accidentalStr = '#';
    else if (diff === 2) accidentalStr = '##';
    else if (diff === -1) accidentalStr = 'b';
    else if (diff === -2) accidentalStr = 'bb';

    return `${targetLetter}${accidentalStr}${octave}`;
  });
  
  return chordNotes;
};
