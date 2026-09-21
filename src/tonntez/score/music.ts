import { Midi } from "@tonejs/midi";
import type { ArticulationEvent } from "./articulationTiming";
import type { NotationMark } from "./fermataTiming";
import type { OrnamentEvent } from "./ornamentTiming";
import type { PerformanceEvent } from "./performanceTiming";
export type Score = ReturnType<typeof parseMidi>;
export function parseMidi(
  bytes: Uint8Array,
  xml: string,
  marks: NotationMark[] = [],
  performance: PerformanceEvent[] = [],
  ornaments: OrnamentEvent[] = [],
  articulations: ArticulationEvent[] = [],
) {
  const midi = new Midi(bytes);
  const notes = midi.tracks
    .flatMap((track, part) =>
      track.notes.map((n) => ({
        midi: n.midi,
        name: n.name,
        time: n.time,
        duration: n.duration,
        velocity: n.velocity,
        part: part + 1,
        startBeat: n.ticks / midi.header.ppq,
        durationBeats: n.durationTicks / midi.header.ppq,
      })),
    )
    .sort((a, b) => a.time - b.time);
  if (!notes.length || !Number.isFinite(midi.duration) || midi.duration <= 0)
    throw new Error("結果沒有可播放的音符，請換一份樂譜重試。");
  return {
    bytes,
    xml,
    marks,
    performance,
    ornaments,
    articulations,
    notes,
    duration: midi.duration,
    bpm: midi.header.tempos[0]?.bpm ?? 120,
    durationBeats: Math.max(
      0,
      ...notes.map((note) => note.startBeat + note.durationBeats),
    ),
    tracks: midi.tracks.filter((t) => t.notes.length).length,
  };
}
export function demoScore() {
  const pitches = [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62];
  const midi = new Midi();
  midi.header.setTempo(108);
  const track = midi.addTrack();
  let beat = 0,
    measure = "";
  const measures: string[] = [];
  pitches.forEach((pitch, i) => {
    const duration = i === 12 ? 1.5 : i === 13 ? 0.5 : i === 14 ? 2 : 1;
    track.addNote({
      midi: pitch,
      time: (beat * 60) / 108,
      duration: (duration * 60) / 108,
      velocity: 0.65,
    });
    const step = (
      { 60: "C", 62: "D", 64: "E", 65: "F", 67: "G" } as Record<number, string>
    )[pitch];
    measure += `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>${duration * 2}</duration><type>${duration === 2 ? "half" : duration === 0.5 ? "eighth" : "quarter"}</type>${duration === 1.5 ? "<dot/>" : ""}${i === 14 ? "<notations><fermata/></notations>" : ""}</note>`;
    beat += duration;
    if (beat % 4 === 0) {
      measures.push(measure);
      measure = "";
    }
  });
  const xml = `<?xml version="1.0"?><score-partwise version="4.0"><work><work-title>Ode to Joy</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${measures.map((m, i) => `<measure number="${i + 1}">${i === 0 ? "<attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>" : ""}${m}</measure>`).join("")}</part></score-partwise>`;
  return parseMidi(midi.toArray(), xml, [
    {
      id: "0:14",
      part: 1,
      measure: 4,
      label: "D4",
      startBeat: 14,
      durationBeats: 2,
      dots: 0,
      fermata: true,
    },
  ]);
}
export function validate(file: File) {
  if (!/\.(png|pdf)$/i.test(file.name)) return "請選擇 PNG 圖片或單頁 PDF。";
  if (!file.size) return "檔案是空的，請重新選擇。";
  if (file.size > 20 * 1024 * 1024) return "檔案不可超過 20 MB。";
  return "";
}
export const time = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
