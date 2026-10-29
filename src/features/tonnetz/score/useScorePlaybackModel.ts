import { useCallback, useMemo } from "react";
import type { RefObject } from "react";

import type { ScorePianoEngine } from "../audio/ScorePianoEngine";
import type { MelodyEvent } from "../types";
import { withArticulationPlayback } from "./articulationTiming";
import { fermataHolds, sourceTime, withFermataPlayback } from "./fermataTiming";
import {
  buildHarmonicTimeline,
  estimateScoreKey,
  harmonicEventAtPosition,
  harmonyTransitionForEvent,
} from "./harmonicAnalysis";
import type { Score } from "./music";
import { withOrnamentPlayback } from "./ornamentTiming";
import { beatAtPerformanceTime, withPerformancePlayback } from "./performanceTiming";
import {
  buildPerformanceTimeline,
  eventAtPerformancePosition,
  nearestPlaybackPositionForNotationBeat,
  upperStaffMelodyNotes,
} from "./performanceTimeline";
import { spellMidiNote } from "./pitchSpelling";
import { sourceTimeAtRepeatPosition, withRepeatPlayback } from "./repeatPlayback";
import { useScorePlayback } from "./useScorePlayback";

type ScorePlaybackModelOptions = {
  score: Score | null;
  audioEngineRef: RefObject<ScorePianoEngine>;
};

export function useScorePlaybackModel({
  score,
  audioEngineRef,
}: ScorePlaybackModelOptions) {
  const articulationScore = useMemo(
    () => withArticulationPlayback(score),
    [score],
  );
  const ornamentScore = useMemo(
    () => withOrnamentPlayback(articulationScore),
    [articulationScore],
  );
  const performanceScore = useMemo(
    () => withPerformancePlayback(ornamentScore),
    [ornamentScore],
  );
  const fermataScore = useMemo(
    () => withFermataPlayback(performanceScore),
    [performanceScore],
  );
  const playbackScore = useMemo(
    () => withRepeatPlayback(fermataScore),
    [fermataScore],
  );
  const holds = useMemo(
    () => performanceScore ? fermataHolds(performanceScore) : [],
    [performanceScore],
  );
  const timeline = useMemo(
    () => buildPerformanceTimeline(playbackScore, (position) => (
      performanceScore
        ? beatAtPerformanceTime(
            performanceScore,
            sourceTime(
              sourceTimeAtRepeatPosition(
                position,
                playbackScore?.repeatSegments ?? [],
              ),
              holds,
            ),
          )
        : 0
    )),
    [holds, performanceScore, playbackScore],
  );
  // Key estimation uses the written score rather than repeat-expanded playback,
  // so repeated sections cannot bias the global major/minor decision.
  const keyEstimate = useMemo(() => estimateScoreKey(score), [score]);
  const harmonicEvents = useMemo(
    () => buildHarmonicTimeline(timeline, keyEstimate),
    [keyEstimate, timeline],
  );
  const player = useScorePlayback(playbackScore, timeline, audioEngineRef);
  const activeEvent = eventAtPerformancePosition(timeline, player.position);
  const activeHarmonicEvent = harmonicEventAtPosition(harmonicEvents, player.position);
  const activeHarmony = activeHarmonicEvent?.harmony ?? null;
  const activeHarmonyTransition = useMemo(
    () => harmonyTransitionForEvent(
      harmonicEvents,
      activeHarmonicEvent?.id ?? null,
    ),
    [activeHarmonicEvent?.id, harmonicEvents],
  );
  const notationBeat = activeEvent?.notationBeat ?? (
    player.position >= (timeline?.duration ?? Infinity) && performanceScore
      ? performanceScore.durationBeats
      : 0
  );
  const activePitches = activeEvent?.pitches ?? [];
  const upperStaffNotes = useMemo(
    () => upperStaffMelodyNotes(timeline),
    [timeline],
  );
  const upperStaffNoteIds = useMemo(
    () => new Set(upperStaffNotes.map((note) => note.id)),
    [upperStaffNotes],
  );
  const timelineEvents = useMemo<MelodyEvent[]>(
    () => upperStaffNotes.map((note) => {
      const displayName = spellMidiNote(note.midi, keyEstimate?.preferFlats ?? false);
      return {
        id: note.id,
        pitch: displayName,
        note: displayName,
        midi: note.midi,
        start: note.time,
        end: note.time + note.duration,
      };
    }),
    [keyEstimate?.preferFlats, upperStaffNotes],
  );
  // Prefer the newest sounding upper-staff melody onset. This prevents a long
  // held note from hiding a later melodic note in the same staff.
  const activeTimelineEventId = activeEvent?.notes
    .filter((note) => upperStaffNoteIds.has(note.id))
    .sort((a, b) => b.time - a.time || b.midi - a.midi)
    .at(0)?.id ?? null;
  const seekNotationBeat = useCallback((beat: number) => {
    const playbackPosition = nearestPlaybackPositionForNotationBeat(
      timeline,
      beat,
      player.getPosition(),
    );
    // A click only relocates the shared playhead; it intentionally does not
    // start audio. The cursor, Tonnetz and Melody Window then read one state.
    if (playbackPosition !== null) player.seek(playbackPosition);
  }, [player.getPosition, player.seek, timeline]);

  return {
    playbackScore,
    timeline,
    activeEvent,
    activeHarmony,
    activeHarmonyTransition,
    harmonicEvents,
    activeHarmonicEventId: activeHarmonicEvent?.id ?? null,
    keyEstimate,
    player,
    notationBeat,
    activePitches,
    timelineEvents,
    activeTimelineEventId,
    seekNotationBeat,
  };
}
