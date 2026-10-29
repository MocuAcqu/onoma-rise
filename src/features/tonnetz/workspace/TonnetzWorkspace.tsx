import InfoModal from '../../../shared/components/InfoModal';
import { progressApi } from '../../progress';
import { useReducer, useEffect, useRef, useCallback, useMemo, useState } from "react";

import { TonnetzGraph } from "../graph/TonnetzGraph";
import { AudioEngine } from "../audio/AudioEngine";
import { ScorePianoEngine } from "../audio/ScorePianoEngine";
import { playbackReducer, INITIAL_STATE } from "../store/playback";
import { useMelodyDisplayState } from "../melody/useMelodyDisplayState";
import MelodyDemoPanel from "../components/MelodyDemoPanel";
import TonnetzSvg from "../components/TonnetzSvg";
import PlaybackSettings from "../components/PlaybackSettings";
import MelodyWindow from "../components/MelodyWindow";
import MelodyTimeline from "../components/MelodyTimeline";
import ScoreTimelineDock from "../components/ScoreTimelineDock";
import { DEMO_MELODY } from "../config";
import { useTransformTransition } from "../graph/useTransformTransition";
import { useAudioTranscription } from "../audio/useAudioTranscription";
import { useMelodyPlayback } from "../audio/useMelodyPlayback";
import { useTonnetzInteractions } from "../graph/useTonnetzInteractions";
import { useWorkspaceMode } from "./useWorkspaceMode";
import { ScorePanel } from "../score/ScorePanel";
import { useScoreImport } from "../score/useScoreImport";
import { useScorePlaybackModel } from "../score/useScorePlaybackModel";
import { spellPitchClass } from "../score/pitchSpelling";
import PitchUtils from "../graph/PitchUtils";
import type { PitchClass } from "../types";
import { RecognitionToolbar } from "./RecognitionToolbar";
import { styles as S } from "./styles";


const INITIAL_VIEW_BOUNDS = { qMin: -6, qMax: 22, rMin: -4, rMax: 16 };
const RADIUS = 18;
const BASE_VELOCITY = 0.7;
const STRONG_VELOCITY = 1;
const WEAK_VELOCITY = 0.45;
const EMPTY_PITCH_SET = new Set<PitchClass>();

/* ─────────────────────────────────────────────
   Root Component
───────────────────────────────────────────── */
export default function Tonnetz() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, dispatch] = useReducer(playbackReducer, INITIAL_STATE);
  const [viewBounds, setViewBounds] = useState(INITIAL_VIEW_BOUNDS);
  const graph = useMemo(
    () => TonnetzGraph.sliceRange(viewBounds.qMin, viewBounds.qMax, viewBounds.rMin, viewBounds.rMax),
    [viewBounds],
  );
  useEffect(() => {
    setIsModalOpen(true);

    const currentUsername = localStorage.getItem('user');
    if (currentUsername) {
      progressApi.recordAudioIdentify(currentUsername)
        .catch(err => console.error("紀錄調性網路使用失敗", err));
    }
  }, []);

  const handleViewportChange = useCallback((required: typeof INITIAL_VIEW_BOUNDS) => {
    setViewBounds((prev) => {
      // TonnetzSvg already reports a six-cell offscreen buffer. Reusing those
      // bounds avoids rendering a duplicate second buffer around every edge.
      const next = required;
      // Re-fit tightly to the current viewport (shrinking as well as growing) so the
      // node count doesn't ratchet upward forever after zooming out or panning far.
      // Small drifts are ignored to avoid regenerating the grid on every pixel of pan.
      const DRIFT_TOLERANCE = 2;
      const settled = Math.abs(next.qMin - prev.qMin) <= DRIFT_TOLERANCE
        && Math.abs(next.qMax - prev.qMax) <= DRIFT_TOLERANCE
        && Math.abs(next.rMin - prev.rMin) <= DRIFT_TOLERANCE
        && Math.abs(next.rMax - prev.rMax) <= DRIFT_TOLERANCE;
      return settled ? prev : next;
    });
  }, []);

  const handleTranscribed = useCallback(() => {
    dispatch({ type: "TIMELINE_CLEAR" });
    dispatch({ type: "MELODY_END" });
  }, []);

  const {
    melodyEvents,
    chordEvents,
    estimatedKey,
    audioObjectUrl,
    isTranscribing,
    error: transcribeError,
    selectAudioFile: handleUploadAudio,
  } = useAudioTranscription({
    initialEvents: DEMO_MELODY,
    onTranscribed: handleTranscribed,
  });

  const currentChord = useMemo(() => {
    return chordEvents.find(
      (chord) => state.playbackTime >= chord.start && state.playbackTime < chord.end,
    ) ?? null;
  }, [chordEvents, state.playbackTime]);
  const displayedFocus = state.isPlayingMelody && currentChord
    ? Array.from(new Set([...state.focusedPitchClasses, ...currentChord.notes]))
    : state.focusedPitchClasses;

  const {
    transitionFrame,
    isTransitioning,
    displayMode,
    triggerTransformTransition,
  } = useTransformTransition((mode) => {
    if (mode === "basic") dispatch({ type: "RESET_DIAMOND_SET" });
  });

  /* ── Core audio engine & melody player ──────────────────────────────── */
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  // Score playback owns its piano sampler so Tonnetz interactions keep their
  // existing lightweight synth and do not load piano samples unnecessarily.
  const scorePianoEngineRef = useRef<ScorePianoEngine>(new ScorePianoEngine());

  const {
    play: handlePlay,
    pause: handlePause,
    resume: handleResume,
    stop: handleStop,
    seekAudio: handleAudioSeek,
    changeMode: handleModeChange,
    setAudioElement: handleAudioElementReady,
    handleAudioPlay: handleAudioElementPlay,
    handleAudioPause: handleAudioElementPause,
    handleAudioSeeked: handleAudioElementSeeked,
    handleAudioEnded: handleAudioElementEnded,
  } = useMelodyPlayback({
    melodyEvents,
    state,
    dispatch,
    audioEngineRef,
    baseVelocity: BASE_VELOCITY,
  });
  const {
    isScoreMode,
    activateAudioMode,
    activateScoreMode,
  } = useWorkspaceMode(handleStop);

  const handleScoreLoaded = useCallback(() => {
    const currentUsername = localStorage.getItem('user');
    if (currentUsername) {
      progressApi.recordScoreIdentify(currentUsername)
        .catch(err => console.error(err));
    }
    activateScoreMode();
  }, [activateScoreMode]);
  const scoreImport = useScoreImport(handleScoreLoaded);
  const {
    playbackScore,
    player: scorePlayer,
    activeHarmony: scoreHarmony,
    activeHarmonyTransition: scoreHarmonyTransition,
    harmonicEvents: scoreHarmonicEvents,
    activeHarmonicEventId: scoreHarmonicEventId,
    keyEstimate: scoreKey,
    notationBeat,
    activePitches: scorePitches,
    timelineEvents: scoreMelodyEvents,
    activeTimelineEventId: scoreMelodyEventId,
    seekNotationBeat,
  } = useScorePlaybackModel({
    score: scoreImport.score,
    audioEngineRef: scorePianoEngineRef,
  });
  const handleActivateAudioMode = useCallback(() => {
    activateAudioMode(scorePlayer.pause);
  }, [activateAudioMode, scorePlayer.pause]);
  useEffect(() => {
    const audioEngine = audioEngineRef.current;
    const scorePianoEngine = scorePianoEngineRef.current;
    // Import and construct the lightweight interaction synth while the page is
    // idle. The browser still resumes audio from the user's first gesture.
    void audioEngine.init().catch((error: unknown) => {
      console.error("預載調性網路音訊失敗", error);
    });
    return () => {
      audioEngine.dispose();
      scorePianoEngine.dispose();
    };
  }, []);

  const {
    nodeFrames,
    edgeFrames,
    handleNodeClick,
    handleEdgeClick,
    handleTriangleClick,
    handleTimelineEventClick,
  } = useTonnetzInteractions({
    graph,
    state,
    displayMode,
    weakVelocity: WEAK_VELOCITY,
    strongVelocity: STRONG_VELOCITY,
    baseVelocity: BASE_VELOCITY,
    audioEngineRef,
    dispatch,
  });

  const handleTimelineClick = useCallback((event: typeof melodyEvents[number]) => {
    void handleTimelineEventClick(event);
    if (state.playbackMode === "audio") handleAudioSeek(event.start);
  }, [handleAudioSeek, handleTimelineEventClick, state.playbackMode]);

  const tonnetzPlayedPitchClasses = useMemo(
    () => isScoreMode && scoreImport.score
      ? Array.from(new Set([...scorePitches, ...state.playedPitchClasses]))
      : state.playedPitchClasses,
    [isScoreMode, scoreImport.score, scorePitches, state.playedPitchClasses],
  );

  /* ── Display state ───────────────────────────────────────────────────── */
  const {
    displayMelodyIndex, prevMelodyEvent, currentMelodyEvent, nextMelodyEvent,
    recentEventIds, recentMelodyPitches,
  } = useMelodyDisplayState({
    melodyEvents,
    activeMelodyEventId: state.activeMelodyEventId,
    playbackMelodyEventId: state.playbackMelodyEventId,
  });
  const scoreMelodyDisplay = useMelodyDisplayState({
    melodyEvents: scoreMelodyEvents,
    activeMelodyEventId: null,
    playbackMelodyEventId: scoreMelodyEventId,
  });

  /* ══════════════════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={S.page}>
      <div style={S.hero}>
        <h1 style={S.heroTitle}>調性網路</h1>
        <p>探索與拆解音樂中的調性關係</p>
      </div>

      <div style={S.content}>
        <RecognitionToolbar
          isScoreMode={isScoreMode}
          displayMode={displayMode}
          isTranscribing={isTranscribing}
          onActivateAudioMode={handleActivateAudioMode}
          onActivateScoreMode={activateScoreMode}
          onTransformModeChange={triggerTransformTransition}
          onSelectAudioFile={handleUploadAudio}
        />

        {transcribeError && (
          <div style={S.uploadError}>
            {transcribeError}
          </div>
        )}

        {isScoreMode && (
          <ScorePanel
            importer={scoreImport}
            player={scorePlayer}
            playbackDuration={playbackScore?.duration ?? 0}
            notationPosition={notationBeat}
            onNotationNoteSelect={seekNotationBeat}
          />
        )}

        <div
          style={isScoreMode
            ? { ...S.grid, gridTemplateColumns: "minmax(0, 1fr)" }
            : S.grid}
        >
          <div style={S.leftColumn}>
            {!isScoreMode && (
              <>
                <MelodyDemoPanel
                  melodyEvents={melodyEvents}
                  isPlayingMelody={state.isPlayingMelody}
                  isPaused={state.isPaused}
                  playbackMode={state.playbackMode}
                  audioObjectUrl={audioObjectUrl}
                  activeEventId={state.playbackMelodyEventId ?? state.activeMelodyEventId}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onResume={handleResume}
                  onStop={handleStop}
                  onModeChange={handleModeChange}
                  onAudioElementReady={handleAudioElementReady}
                  onAudioPlay={handleAudioElementPlay}
                  onAudioPause={handleAudioElementPause}
                  onAudioSeeked={handleAudioElementSeeked}
                  onAudioEnded={handleAudioElementEnded}
                />

                <div style={S.settingsRow}>
                  {(estimatedKey || currentChord) && (
                    <div style={S.chordKeyCard}>
                      <span><strong>目前和弦：</strong>{currentChord?.name ?? "N.C."}</span>
                      <span><strong>推測調性：</strong>{estimatedKey?.key ?? "—"}</span>
                      {currentChord && <span><strong>可信度：</strong>{Math.round(currentChord.confidence * 100)}%</span>}
                    </div>
                  )}

                  <PlaybackSettings
                    octave={state.currentOctave}
                    isSustain={state.isSustain}
                    onOctaveChange={(value) => dispatch({ type: "SET_OCTAVE", value })}
                  />
                </div>
              </>
            )}

            <div style={S.graphPanel}>
              {isScoreMode && (
                <div style={S.scoreMelodyWindow}>
                  <MelodyWindow
                    currentMelodyEvent={scoreMelodyDisplay.currentMelodyEvent}
                    prevMelodyEvent={scoreMelodyDisplay.prevMelodyEvent}
                    nextMelodyEvent={scoreMelodyDisplay.nextMelodyEvent}
                    displayMelodyIndex={scoreMelodyDisplay.displayMelodyIndex}
                    melodyEventsLength={scoreMelodyEvents.length}
                    // Before a score is recognized, reuse the Tonnetz's live
                    // note/chord selection just like the audio workspace.
                    // Recognized scores instead reserve this card for playback.
                    selectionInfo={scoreImport.score ? null : state.selectionInfo}
                    emptyText={scoreImport.score
                      ? "等待播放音符…"
                      : "點擊 Tonnetz 的音符或和弦以查看資訊。"}
                    statusLabel="Tonnetz"
                    statusValue={scoreImport.score
                      ? scorePitches
                        .map((pitch) => spellPitchClass(pitch, scoreKey?.preferFlats ?? false))
                        .join(" · ") || "休止"
                      : "等待匯入"}
                    showTonnetzFocus={Boolean(scoreImport.score)}
                    scoreHarmony={scoreImport.score ? scoreHarmony : null}
                    scoreTransition={scoreImport.score ? scoreHarmonyTransition : null}
                    scoreKey={scoreImport.score ? scoreKey : null}
                  />
                </div>
              )}
              {isScoreMode && scoreImport.score && (
                <ScoreTimelineDock
                  melodyEvents={scoreMelodyEvents}
                  playbackMelodyEventId={scoreMelodyEventId}
                  recentMelodyEventIds={scoreMelodyDisplay.recentEventIds}
                  harmonicEvents={scoreHarmonicEvents}
                  activeHarmonicEventId={scoreHarmonicEventId}
                  // Timeline navigation shares the notation, Tonnetz and
                  // harmony playhead without starting playback.
                  onSeek={scorePlayer.seek}
                />
              )}
              <TonnetzSvg
                nodes={graph.nodes}
                triangles={graph.triangles}
                onViewportChange={handleViewportChange}
                radius={RADIUS}
                playedPitchClasses={tonnetzPlayedPitchClasses}
                focusedPitchClasses={isScoreMode ? state.focusedPitchClasses : displayedFocus}
                focusedNodeIndex={state.focusedNodeIndex}
                showStrongFocus={isScoreMode
                  ? scorePlayer.isPlaying
                  : state.isPlayingMelody || state.playbackMelodyEventId !== null}
                activeChordKey={isScoreMode && scoreImport.score
                  ? scoreHarmony?.tonnetzChord
                    ? PitchUtils.getChordKey(scoreHarmony.tonnetzChord)
                    : null
                  : state.activeChordKey}
                harmonyTransition={isScoreMode && scoreImport.score
                  ? scoreHarmonyTransition
                  : null}
                activeEdgeKey={state.activeEdgeKey}
                activeEdgePitchPair={state.activeEdgePitchPair}
                edgeFrames={edgeFrames}
                recentMelodyPitches={isScoreMode ? EMPTY_PITCH_SET : recentMelodyPitches}
                nodeFrames={nodeFrames}
                onClickNode={handleNodeClick}
                onClickTriangle={handleTriangleClick}
                onClickEdge={handleEdgeClick}
                currentOctave={state.currentOctave}
                accentActivePitch={state.accentActivePitch}
                accentMode={state.accentMode}
                weakVelocity={WEAK_VELOCITY}
                strongVelocity={STRONG_VELOCITY}
                transformMode={displayMode}
                transitionFrame={transitionFrame}
                isTransitioning={isTransitioning}
                selectedDiamondPitchSet={state.selectedDiamondPitchSet}
              />
            </div>
          </div>

          {!isScoreMode && (
            <div style={S.rightColumn}>
              <MelodyWindow
                currentMelodyEvent={currentMelodyEvent}
                prevMelodyEvent={prevMelodyEvent}
                nextMelodyEvent={nextMelodyEvent}
                displayMelodyIndex={displayMelodyIndex}
                melodyEventsLength={melodyEvents.length}
                selectionInfo={state.selectionInfo}
              />
              <MelodyTimeline
                melodyEvents={melodyEvents}
                activeMelodyEventId={state.activeMelodyEventId}
                playbackMelodyEventId={state.playbackMelodyEventId}
                recentEventIds={recentEventIds}
                onClickEvent={handleTimelineClick}
              />
            </div>
          )}
        </div>
      </div>
      <InfoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="💡 貼心提醒"
      >
        <p>音樂辨識與 AI 樂譜轉錄需要經過運算分析，載入時間可能較長（約 10 ~ 30 秒），此為正常現象，請耐心等候系統處理！</p>
      </InfoModal>
    </div>
  );
}
