import type * as Tone from "tone";
import PitchUtils from "./PitchUtils";
import type { PitchClass } from "../type";
import { createPianoInstrument, type PianoInstrument } from "./PianoInstrument";

export class AudioEngine {
  private _synth: PianoInstrument | null = null;
  private _active : Set<string>;
  private _activePCs: Set<PitchClass>;
  private _Tone: typeof Tone | null = null;
  private _initPromise: Promise<void> | null = null;
  private _generation = 0;

  constructor() {
    this._synth = null;
    this._active = new Set<string>();       // active note strings
    this._activePCs = new Set<PitchClass>();    // active pitch classes
  }

  init(): Promise<void> {
    if (this._synth) return Promise.resolve();
    if (this._initPromise) return this._initPromise;

    const generation = this._generation;
    this._initPromise = import("tone").then(async (tone) => {
      if (generation !== this._generation) return;
      this._Tone = tone;
      const instrument = await createPianoInstrument(tone);
      if (generation !== this._generation) {
        instrument.dispose();
        return;
      }
      this._synth = instrument;
    });
    return this._initPromise;
  }

  dispose(): void {
    this._generation += 1;
    this._synth?.dispose();
    this._synth = null;
    this._Tone = null;
    this._initPromise = null;
    this._active.clear();
    this._activePCs.clear();
  }

  async ensureStarted() :Promise<void>{
    await this.init();
    if (this._Tone && this._Tone.context.state !== "running") {
      await this._Tone.start();
    }
  }

  /** Returns false if note already active */
  attack(pitch:PitchClass, octave:number, velocity:number = 0.7):boolean {
    const note = PitchUtils.buildNote(pitch, octave);
    if (this._active.has(note)) return false;
    this._active.add(note);
    this._activePCs.add(pitch);
    this._synth?.triggerAttack(note, undefined, velocity);
    return true;
  }

  release(pitch:PitchClass, octave:number):boolean {
    const note = PitchUtils.buildNote(pitch, octave);
    if (!this._active.has(note)) return false;
    this._active.delete(note);
    this._activePCs.delete(pitch);
    this._synth?.triggerRelease(note);
    return true;
  }

  attackRelease(
    notes: string | string[],
    durationSec: number,
    velocity: number = 0.7,
    startTime: number = this.now(),
  ): void {
    this._synth?.triggerAttackRelease(notes, durationSec, startTime, velocity);
  }

  releaseAll(): void {
    this._synth?.releaseAll(this.now());
    this._active.clear();
    this._activePCs.clear();
  }

  now(): number {
    return this._Tone?.now() ?? 0;
  }

  getActivePitchClasses(): PitchClass[] { return Array.from(this._activePCs); }
}
