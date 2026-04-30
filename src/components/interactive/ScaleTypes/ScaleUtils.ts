import * as Tone from 'tone';

export const SCALE_FORMULAS = {
  major: [2, 2, 1, 2, 2, 2, 1], 
  naturalMinor: [2, 1, 2, 2, 1, 2, 2], 
  harmonicMinor: [2, 1, 2, 2, 1, 3, 1], 
  melodicMinor: [2, 1, 2, 2, 2, 2, 1],
  chromatic: [1, 1, 1, 1, 1, 1, 1, 1], 
  wholeTone: [2, 2, 2, 2, 2, 2, 2, 2], 
};

const ROOT_MIDI_MAP: Record<string, number> = {
  'C': 60, 
  'Db': 61, 'C#': 61, 
  'D': 62, 
  'Eb': 63, 'D#': 63, 
  'E': 64, 
  'F': 65,
  'Gb': 66, 'F#': 66, 
  'G': 67, 
  'Ab': 68, 'G#': 68, 
  'A': 69, 
  'Bb': 70, 'A#': 70, 
  'B': 71
};

const BASE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const LETTER_BASE_STEPS: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

export const generateScale = (rootNote: string, formula: number[], isMinor: boolean = false) => {
  const scale = []; 

  let currentMidi = ROOT_MIDI_MAP[rootNote] || 60;
  
  const rootLetter = rootNote.charAt(0);
  let currentLetterIndex = BASE_LETTERS.indexOf(rootLetter);

  scale.push({ 
    noteName: rootNote, 
    octave: (Math.floor(currentMidi / 12) - 1).toString(),
    fullPitch: Tone.Frequency(currentMidi, "midi").toNote() 
  });

  const shouldEnforceSpelling = isMinor || formula === SCALE_FORMULAS.major;

  for (let i = 0; i < formula.length; i++) {
    currentMidi += formula[i];
    
    let calculatedOctave = Math.floor(currentMidi / 12) - 1;
    let finalNoteName = "";

    if (shouldEnforceSpelling) {

      currentLetterIndex = (currentLetterIndex + 1) % 7;
      const expectedLetter = BASE_LETTERS[currentLetterIndex];

      const targetPitchClass = currentMidi % 12;
      const expectedLetterStep = LETTER_BASE_STEPS[expectedLetter];
      
      let diff = targetPitchClass - expectedLetterStep;
      if (diff < -6) diff += 12;
      if (diff > 6) diff -= 12;

      let modifier = '';
      if (diff === 1) modifier = '♯'; 
      else if (diff === 2) modifier = 'x';
      else if (diff === -1) modifier = '♭';
      else if (diff === -2) modifier = '𝄫'; 
      
      finalNoteName = expectedLetter + modifier;

      if (finalNoteName.includes('♭') && expectedLetter === 'C' && targetPitchClass === 11) {
          calculatedOctave += 1;
      }
      else if (finalNoteName.includes('♯') && expectedLetter === 'B' && targetPitchClass === 0) {
          calculatedOctave -= 1;
      }

    } else {
      const rawNote = Tone.Frequency(currentMidi, "midi").toNote();
      finalNoteName = rawNote.replace(/[0-9]/g, '').replace('#', '♯');
      
      if (rootNote.includes('b')) {
          const enharmonics: Record<string, string> = {'C♯':'D♭', 'D♯':'E♭', 'F♯':'G♭', 'G♯':'A♭', 'A♯':'B♭'};
          finalNoteName = enharmonics[finalNoteName] || finalNoteName;
      }
    }
    
    let tonePitchForPlay = Tone.Frequency(currentMidi, "midi").toNote();

    scale.push({ 
      noteName: finalNoteName, 
      octave: calculatedOctave.toString(),
      fullPitch: tonePitchForPlay 
    });
  }

  return scale;
};

export const generatePianoKeys = (startMidi: number = 60, count: number = 24) => {
  const keys = [];
  for (let i = 0; i < count; i++) {
    const fullPitch = Tone.Frequency(startMidi + i, "midi").toNote();
    keys.push({
      pitchName: fullPitch.replace(/[0-9]/g, ''), 
      fullPitch: fullPitch                        
    });
  }
  return keys;
};