/**
 * Maps the Web Audio clock to score time.
 *
 * AudioContext.currentTime is monotonic and continues independently of React
 * rendering. Deriving the score position from one anchor prevents delayed
 * animation frames from accumulating timing drift across the notation,
 * Tonnetz and timelines.
 */
export class ScorePlaybackSynchronizer {
  private duration = 0;
  private offset = 0;
  private audioAnchor = 0;
  private speed = 1;
  private playing = false;

  setDuration(seconds: number): void {
    this.duration = Math.max(0, seconds);
    this.offset = this.clamp(this.offset);
  }

  start(audioTime: number): void {
    this.audioAnchor = audioTime;
    this.playing = true;
  }

  pause(audioTime: number): number {
    this.offset = this.positionAt(audioTime);
    this.playing = false;
    return this.offset;
  }

  stop(): void {
    this.offset = 0;
    this.audioAnchor = 0;
    this.playing = false;
  }

  seek(seconds: number): number {
    this.offset = this.clamp(seconds);
    this.playing = false;
    return this.offset;
  }

  setSpeed(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0) return;
    this.speed = speed;
  }

  getSpeed(): number {
    return this.speed;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  positionAt(audioTime: number): number {
    if (!this.playing) return this.offset;
    const elapsed = Math.max(0, audioTime - this.audioAnchor);
    return this.clamp(this.offset + elapsed * this.speed);
  }

  private clamp(seconds: number): number {
    return Math.max(0, Math.min(seconds, this.duration));
  }
}
