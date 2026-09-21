import { describe, expect, it } from "vitest";
import { INITIAL_STATE } from "./initialState";
import { playbackReducer } from "./reducer";

describe("playbackReducer", () => {
  it("clamps the playable octave range", () => {
    expect(playbackReducer(INITIAL_STATE, { type: "SET_OCTAVE", value: 1 }).currentOctave).toBe(2);
    expect(playbackReducer(INITIAL_STATE, { type: "SET_OCTAVE", value: 8 }).currentOctave).toBe(6);
  });

  it("moves through melody playback states", () => {
    const playing = playbackReducer(INITIAL_STATE, { type: "MELODY_START" });
    const paused = playbackReducer(playing, { type: "MELODY_PAUSE" });
    const resumed = playbackReducer(paused, { type: "MELODY_RESUME" });
    const ended = playbackReducer(resumed, { type: "MELODY_END" });

    expect(playing.isPlayingMelody).toBe(true);
    expect(paused.isPaused).toBe(true);
    expect(resumed.isPaused).toBe(false);
    expect(ended.isPlayingMelody).toBe(false);
  });

  it("resets only the selected diamond when changing back to basic view", () => {
    const selected = playbackReducer(INITIAL_STATE, {
      type: "SET_DIAMOND_SET",
      pitchSet: ["C", "E", "G"],
    });
    const reset = playbackReducer(selected, { type: "RESET_DIAMOND_SET" });

    expect(reset.selectedDiamondPitchSet).toBeNull();
    expect(reset.focusedPitchClasses).toEqual(["C", "E", "G"]);
  });
});
