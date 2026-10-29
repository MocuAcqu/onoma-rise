import { describe, expect, it } from "vitest";

import { ScorePlaybackSynchronizer } from "./ScorePlaybackSynchronizer";

describe("ScorePlaybackSynchronizer", () => {
  it("derives score position from the audio clock without accumulating frames", () => {
    const synchronizer = new ScorePlaybackSynchronizer();
    synchronizer.setDuration(30);
    synchronizer.seek(4);
    synchronizer.start(10);

    expect(synchronizer.positionAt(10.5)).toBe(4.5);
    expect(synchronizer.positionAt(13)).toBe(7);
  });

  it("does not advance before a future scheduled audio start", () => {
    const synchronizer = new ScorePlaybackSynchronizer();
    synchronizer.setDuration(10);
    synchronizer.start(5.1);

    expect(synchronizer.positionAt(5)).toBe(0);
    expect(synchronizer.positionAt(5.1)).toBe(0);
  });

  it("rebases pause, seek and playback speed on the same clock", () => {
    const synchronizer = new ScorePlaybackSynchronizer();
    synchronizer.setDuration(20);
    synchronizer.setSpeed(0.25);
    synchronizer.seek(2);
    synchronizer.start(8);

    expect(synchronizer.pause(12)).toBe(3);
    expect(synchronizer.positionAt(18)).toBe(3);

    synchronizer.seek(10);
    synchronizer.setSpeed(2);
    synchronizer.start(20);
    expect(synchronizer.positionAt(22)).toBe(14);
  });

  it("clamps every reported position to the score duration", () => {
    const synchronizer = new ScorePlaybackSynchronizer();
    synchronizer.setDuration(5);
    expect(synchronizer.seek(9)).toBe(5);
    expect(synchronizer.seek(-2)).toBe(0);
  });
});
