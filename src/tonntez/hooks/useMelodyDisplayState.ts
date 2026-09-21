//display helpers
import { useMemo } from "react";
import PitchUtils from "../core/PitchUtils";
import type { MelodyEvent, PitchClass } from "../type";

type Params = {
  melodyEvents:          MelodyEvent[];
  activeMelodyEventId:   string | null;
  playbackMelodyEventId: string | null;
  recentTrailCount?:     number;
};

export function useMelodyDisplayState({ melodyEvents, activeMelodyEventId, playbackMelodyEventId, recentTrailCount = 3 }:Params) {
  const activeMelodyIndex = useMemo(() =>
    melodyEvents.findIndex(e => e.id === playbackMelodyEventId),
    [melodyEvents, playbackMelodyEventId]
  );

  const displayId = activeMelodyEventId ?? playbackMelodyEventId;

  const displayMelodyIndex = useMemo(() =>
    melodyEvents.findIndex(e => e.id === displayId),
    [melodyEvents, displayId]
  );

  const recentEventIds = useMemo(() => {
    if (activeMelodyIndex < 0) return new Set<string>();;
    const ids = new Set<string>();
    for (let i = Math.max(0, activeMelodyIndex - recentTrailCount); i < activeMelodyIndex; i++)
      ids.add(melodyEvents[i].id);
    return ids;
  }, [activeMelodyIndex, melodyEvents, recentTrailCount]);

  const recentMelodyPitches = useMemo(() => {
    const s = new Set<PitchClass>();
    melodyEvents.forEach(e => {
      const pitchClass = PitchUtils.getMelodyPitchClass(e);
      if (recentEventIds.has(e.id) && pitchClass) s.add(pitchClass);
    });
    return s;
  }, [melodyEvents, recentEventIds]);

  return {
    displayMelodyIndex,
    prevMelodyEvent:    displayMelodyIndex > 0 ? melodyEvents[displayMelodyIndex-1] : null,
    currentMelodyEvent: displayMelodyIndex >= 0 ? melodyEvents[displayMelodyIndex] : null,
    nextMelodyEvent:    displayMelodyIndex >= 0 && displayMelodyIndex < melodyEvents.length-1 ? melodyEvents[displayMelodyIndex+1] : null,
    recentEventIds,
    recentMelodyPitches,
  };
}
