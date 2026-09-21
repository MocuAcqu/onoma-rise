import { KEY_TO_PITCH} from "../constants"
import type {PitchClass} from "../type"

type AccentMode = "," | "." | null;

type PressedNote = {
  pitch: PitchClass;
  octave: number;
};

type KeyboardControllerConfig = {
  getOctave: () => number;
  setOctave: (n: number) => void;
  onPress: (
    pitch: PitchClass,
    nodeIndex: number,
    octave: number,
    velocity: number
  ) => void;
  onRelease: (pitch: PitchClass, octave: number) => void;
  getNodeIndex: (pitch: PitchClass) => number;
  baseVelocity: number;
  weakVelocity: number;
  strongVelocity: number;
  onSustainChange: (v: boolean) => void;
  onAccentChange: (mode: AccentMode, pitch: PitchClass | null) => void;
  ensureAudio: () => Promise<void>;
};

export class KeyboardController {
 
  private _cfg: KeyboardControllerConfig;
  private _sustained: boolean;
  private _accentMode: AccentMode = null;
  private _accentPitch: PitchClass | null = null;
  private _pressed: Record<string, PressedNote>;
  private _onKeyDown: (e: KeyboardEvent) => void;
  private _onKeyUp : (e: KeyboardEvent) => void;

  constructor(config:KeyboardControllerConfig) {
    this._cfg         = config;
    this._sustained   = false;
    this._accentMode  = null;     // null | ',' | '.'
    this._accentPitch = null;
    this._pressed     = {};       // key → { pitch, octave }

    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp   = this._handleKeyUp.bind(this);
  }

  attach():void {
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup",   this._onKeyUp);
  }

  detach() :void{
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup",   this._onKeyUp);
  }

  get isSustain():boolean   { return this._sustained; }
  get accentMode():AccentMode  { return this._accentMode; }
  get accentPitch():PitchClass |null { return this._accentPitch; }

  async _handleKeyDown(e: KeyboardEvent): Promise<void> {
    if (e.repeat) return;
    const { getOctave, setOctave, onPress, getNodeIndex,
            baseVelocity, weakVelocity, strongVelocity,
            onSustainChange, onAccentChange, ensureAudio } = this._cfg;

    if (e.code === "Space")     { e.preventDefault(); this._sustained = true;  onSustainChange(true);  return; }
    if (e.key === ",")          { this._accentMode = ","; onAccentChange(",", this._accentPitch); return; }
    if (e.key === ".")          { this._accentMode = "."; onAccentChange(".", this._accentPitch); return; }
    if (e.key === "ArrowUp")    { e.preventDefault(); setOctave(Math.min(getOctave() + 1, 6)); return; }
    if (e.key === "ArrowDown")  { e.preventDefault(); setOctave(Math.max(getOctave() - 1, 2)); return; }

    const key   = e.key.toLowerCase();
    const pitch = KEY_TO_PITCH[key as keyof typeof KEY_TO_PITCH];
    if (!pitch) return;

    const octave    = getOctave();
    const nodeIndex = getNodeIndex(pitch);
    if (nodeIndex === -1) return;

    this._pressed[key] = { pitch, octave };
    await ensureAudio();

    let velocity = baseVelocity;
    if (this._accentMode === ",") velocity = weakVelocity;
    if (this._accentMode === ".") velocity = strongVelocity;

    onPress(pitch, nodeIndex, octave, velocity);

    if (this._accentMode !== null) {
      this._accentPitch = pitch;
      onAccentChange(this._accentMode, pitch);
    }
  }

  _handleKeyUp(e:KeyboardEvent) {
    const { onRelease, onSustainChange, onAccentChange } = this._cfg;

    if (e.code === "Space") {
      this._sustained = false;
      onSustainChange(false);
      Object.values(this._pressed).forEach(({ pitch, octave }) => onRelease(pitch, octave));
      this._pressed     = {};
      this._accentPitch = null;
      onAccentChange(this._accentMode, null);
      return;
    }

    if (e.key === "," || e.key === ".") {
      this._accentMode = null;
      onAccentChange(null, this._accentPitch);
      return;
    }

    const key     = e.key.toLowerCase();
    const pressed = this._pressed[key];
    if (!pressed) return;

    if (!this._sustained) {
      onRelease(pressed.pitch, pressed.octave);
      if (this._accentPitch === pressed.pitch) {
        this._accentPitch = null;
        onAccentChange(this._accentMode, null);
      }
      delete this._pressed[key];
    }
  }
}
