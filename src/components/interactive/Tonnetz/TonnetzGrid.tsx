import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as Tone from 'tone';
import './Tonnetz.css';

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface TonnetzNode {
  id: string;
  cx: number;
  cy: number;
  name: string;
  freq: number;
  midi: number;
  col: number;
  row: number;
}

interface TonnetzLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'p5' | 'm3-major' | 'm3-minor';
  node1Id: string; 
  node2Id: string;
  notes: string[];
}

interface TonnetzFace {
  id: string;
  type: 'major' | 'minor';
  points: string;
  notes: string[];
}

// 處理負數 modulo
const safeMod = (n: number, m: number) => ((n % m) + m) % m;

type TonnetzGridProps = {
  mode?: 'none' | 'point' | 'line' | 'face';
  transformMode?: 'P' | 'L' | 'R' | 'N' | 'none';
  highlightChordType?: 'major' | 'minor' | 'augmented' | 'diminished' | 'none';
  interactive?: boolean;
  width?: string;
  height?: string;
};

const TonnetzGrid: React.FC<TonnetzGridProps> = ({ 
  mode = 'none', 
  transformMode = 'none',
  highlightChordType = 'none',
  interactive = true,
  width = '100%',
  height = '400px'
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNodeIds, setHoveredNodeIds] = useState<string[]>([]);
  const dragStart = useRef({ x: 0, y: 0 });
  const samplerRef = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
    samplerRef.current = new Tone.Sampler({
      urls: { C4: "C4.mp3", A4: "A4.mp3", "D#4": "Ds4.mp3" },
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();
    return () => { samplerRef.current?.dispose(); };
  }, []);

  const L = 90;
  const H = L * (Math.sqrt(3) / 2);

  const gridData = useMemo(() => {
    const nodes = new Map<string, TonnetzNode>();
    const lines: TonnetzLine[] = [];
    const faces: TonnetzFace[] = [];
    
    const minCol = -8, maxCol = 8;
    const minRow = -6, maxRow = 6;

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const offsetX = safeMod(row, 2) === 1 ? L / 2 : 0;
        const cx = col * L + offsetX;
        const cy = row * H;
        
        const rowShift = (row * 4) - (Math.floor(row / 2) * 7);
        const midi = 60 + (col * 7) + rowShift; 
        
        const name = PITCH_CLASSES[safeMod(midi, 12)];
        const freq = Tone.Frequency(midi, "midi").toFrequency();
        nodes.set(`${col},${row}`, { id: `${col},${row}`, cx, cy, name, freq, midi, col, row });
      }
    }

    nodes.forEach(node => {
      const { col, row, cx, cy, midi } = node;
      const isOddRow = safeMod(row, 2) === 1;

      const right = nodes.get(`${col + 1},${row}`);
      const drCol = isOddRow ? col + 1 : col;
      const dlCol = isOddRow ? col : col - 1;
      
      const dr = nodes.get(`${drCol},${row + 1}`);
      const dl = nodes.get(`${dlCol},${row + 1}`);

      // 線段 (音程)
      if (right) {
        lines.push({ 
          id: `h-${col}-${row}`, x1: cx, y1: cy, x2: right.cx, y2: right.cy, type: 'p5', 
          node1Id: node.id, node2Id: right.id, 
          notes: [Tone.Frequency(midi, "midi").toNote(), Tone.Frequency(right.midi, "midi").toNote()] 
        });
      }
      if (dr) {
        lines.push({ 
          id: `dr-${col}-${row}`, x1: cx, y1: cy, x2: dr.cx, y2: dr.cy, type: 'm3-major', 
          node1Id: node.id, node2Id: dr.id, 
          notes: [Tone.Frequency(midi, "midi").toNote(), Tone.Frequency(dr.midi, "midi").toNote()] 
        });
      }
      if (dl) {
        lines.push({ 
          id: `dl-${col}-${row}`, x1: cx, y1: cy, x2: dl.cx, y2: dl.cy, type: 'm3-minor', 
          node1Id: node.id, node2Id: dl.id, 
          notes: [Tone.Frequency(midi, "midi").toNote(), Tone.Frequency(dl.midi, "midi").toNote()] 
        });
      }

      // 面 (和弦)
      // 大調倒三角 (例如 C-G-E)
      if (right && dr) {
        faces.push({
          id: `maj-${col}-${row}`, type: 'major',
          points: `${cx},${cy} ${right.cx},${right.cy} ${dr.cx},${dr.cy}`,
          notes: [
            Tone.Frequency(midi, "midi").toNote(),
            Tone.Frequency(right.midi, "midi").toNote(),
            Tone.Frequency(dr.midi, "midi").toNote()
          ]
        });
      }
      // 小調正三角 (例如 E-G-B)
      if (dr && dl) {
        faces.push({
          id: `min-${col}-${row}`, type: 'minor',
          points: `${cx},${cy} ${dl.cx},${dl.cy} ${dr.cx},${dr.cy}`,
          notes: [
            Tone.Frequency(midi, "midi").toNote(),
            Tone.Frequency(dl.midi, "midi").toNote(),
            Tone.Frequency(dr.midi, "midi").toNote()
          ]
        });
      }
    });

    return { nodes: Array.from(nodes.values()), lines, faces };
  }, [L, H]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !interactive) return;
    
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;

    setPan({
      x: Math.max(-500, Math.min(500, newX)),
      y: Math.max(-400, Math.min(400, newY))
    });
  };

  const playSingleNote = async (note: string) => {
    if (!interactive) return;
    await Tone.start();
    samplerRef.current?.triggerAttackRelease(note, "4n");
  };

  const playChord = async (notes: string[]) => {
    if (!interactive) return;
    await Tone.start();
    samplerRef.current?.triggerAttackRelease(notes, "2n");
  };

  return (
    <div 
      className={`tonnetz-wrapper ${isDragging ? 'dragging' : ''}`}
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <g transform={`translate(${pan.x + 350}, ${pan.y + 200})`}>
          
          {/* 面 (Faces) */}
          <g className={`tonnetz-faces mode-${mode} highlight-chord-${highlightChordType}`}>
            {gridData.faces.map(f => (
              <polygon 
                key={f.id} 
                points={f.points} 
                className={`t-face ${f.type}`} 
                onClick={(e) => {
                  e.stopPropagation(); 
                  playChord(f.notes);
                }}
              />
            ))}
          </g>

          {/* 線 (Lines) */}
          <g className={`tonnetz-lines mode-${mode} highlight-chord-${highlightChordType}`}>
            {gridData.lines.map(l => (
              <line 
                key={l.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} 
                className={`t-line ${l.type} ${
                    (transformMode === 'P' && l.type === 'p5') ||
                    (transformMode === 'L' && l.type === 'm3-minor') ||
                    (transformMode === 'R' && l.type === 'm3-major') ? 'transform-highlight' : ''
                }`}
                onMouseEnter={() => setHoveredNodeIds([l.node1Id, l.node2Id])}
                onMouseLeave={() => setHoveredNodeIds([])}
                onClick={(e) => {
                    e.stopPropagation(); 
                    playChord(l.notes);  
                }}
              />
            ))}
          </g>

          {/* 點 (Nodes) */}
          <g className={`tonnetz-nodes mode-${mode}`}>
            {gridData.nodes.map(n => {
              const isLineHighlight = hoveredNodeIds.includes(n.id);
              return (
                <g 
                  key={n.id} transform={`translate(${n.cx}, ${n.cy})`}
                  onClick={(e) => { e.stopPropagation(); playSingleNote(Tone.Frequency(n.midi, "midi").toNote()); }}
                  className={`t-node-group ${isLineHighlight ? 'line-highlight' : ''}`}
                >
                  <circle r={22} className="t-node-circle" />
                  <text y={5} className="t-node-text">{n.name}</text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
};

export default TonnetzGrid;