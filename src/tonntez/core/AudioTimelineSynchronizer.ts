import type { MelodyEvent } from "../type";

type SyncFrameHandler = (events: MelodyEvent[], currentTime: number) => void;
type SyncDoneHandler = () => void;

export class AudioTimelineSynchronizer {
  private _rafId: number | null = null;
  start(
    audioEl: HTMLAudioElement,
    events: MelodyEvent[],
    onFrame: SyncFrameHandler,
    onDone?: SyncDoneHandler,
  ): void {
    this.stop();
    const tick = () => {
      const currentTime = audioEl.currentTime;
      onFrame(events.filter((event) => currentTime >= event.start && currentTime < event.end), currentTime);

      if (currentTime >= (events[events.length - 1]?.end ?? Infinity)) {
        onDone?.();
        this.stop();
        return;
      }

      if (!audioEl.paused && !audioEl.ended) {
        this._rafId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  stop(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}
