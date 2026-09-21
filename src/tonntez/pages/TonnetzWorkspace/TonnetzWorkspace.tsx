import axios from 'axios';
import InfoModal from '../../../components/InfoModal';
import { useReducer, useEffect, useRef, useCallback, useMemo, useState } from "react";

import { TonnetzGraph } from "../../core/TonnetzGraph";
import { AudioEngine } from "../../core/AudioEngine";
import { playbackReducer, INITIAL_STATE } from "../../store/playbackStore";
import { useMelodyDisplayState } from "../../hooks/useMelodyDisplayState";
import MelodyDemoPanel from "../../components/MelodyDemoPanel";
import AudioUploadPanel from "../../components/AudioUploadPanel";
import TonnetzSvg from "../../components/TonnetzSvg";
import PlaybackSettings from "../../components/PlaybackSettings";
import MelodyWindow from "../../components/MelodyWindow";
import MelodyTimeline from "../../components/MelodyTimeline";
import TransformToolbar from "../../components/TransformToolbar";
import { DEMO_MELODY } from "../../constants";
import { useTransformTransition } from "../../hooks/useTransformTransition";
import { useAudioTranscription } from "../../hooks/useAudioTranscription";
import { useMelodyPlayback } from "../../hooks/useMelodyPlayback";
import { useTonnetzInteractions } from "../../hooks/useTonnetzInteractions";
import { ScorePanel } from "../../score/ScorePanel";
import { withArticulationPlayback } from "../../score/articulationTiming";
import { useScoreImport } from "../../score/useScoreImport";
import { useScorePlayback } from "../../score/useScorePlayback";
import { fermataHolds, sourceTime, withFermataPlayback } from "../../score/fermataTiming";
import { withOrnamentPlayback } from "../../score/ornamentTiming";
import { beatAtPerformanceTime, withPerformancePlayback } from "../../score/performanceTiming";
import { sourceTimeAtRepeatPosition, withRepeatPlayback } from "../../score/repeatPlayback";
import { scorePitchesAt } from "../../score/scoreTimeline";
import type { MelodyEvent, PitchClass } from "../../type";
import { styles as S } from "./styles";


const INITIAL_VIEW_BOUNDS = { qMin: -6, qMax: 22, rMin: -4, rMax: 16 };
const VIEW_BOUNDS_MARGIN = 6;
const RADIUS = 18;
const BASE_VELOCITY = 0.7;
const STRONG_VELOCITY = 1;
const WEAK_VELOCITY = 0.45;

/* ─────────────────────────────────────────────
   Root Component
───────────────────────────────────────────── */
export default function Tonnetz() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, dispatch] = useReducer(playbackReducer, INITIAL_STATE);
  const [workspaceMode, setWorkspaceMode] = useState<"audio" | "score">("audio");
  const [viewBounds, setViewBounds] = useState(INITIAL_VIEW_BOUNDS);
  const graph = useMemo(
    () => TonnetzGraph.sliceRange(viewBounds.qMin, viewBounds.qMax, viewBounds.rMin, viewBounds.rMax),
    [viewBounds],
  );
  useEffect(() => {
    setIsModalOpen(true);

    const currentUsername = localStorage.getItem('user');
    if (currentUsername) {
      axios.post('http://localhost:5000/api/user/progress/audio-identify', { username: currentUsername })
        .catch(err => console.error("紀錄調性網路使用失敗", err));
    }
  }, []);

  const handleViewportChange = useCallback((required: typeof INITIAL_VIEW_BOUNDS) => {
    setViewBounds((prev) => {
      const next = {
        qMin: required.qMin - VIEW_BOUNDS_MARGIN,
        qMax: required.qMax + VIEW_BOUNDS_MARGIN,
        rMin: required.rMin - VIEW_BOUNDS_MARGIN,
        rMax: required.rMax + VIEW_BOUNDS_MARGIN,
      };
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

  const handleScoreLoaded = useCallback(() => {
    const currentUsername = localStorage.getItem('user');
    if (currentUsername) {
      axios.post('http://localhost:5000/api/user/progress/score-identify', { username: currentUsername })
        .catch(err => console.error(err));
    }
    handleStop();
    setWorkspaceMode("score");
  }, [handleStop]);
  const scoreImport = useScoreImport(handleScoreLoaded);
  const articulationScore = useMemo(
    () => withArticulationPlayback(scoreImport.score),
    [scoreImport.score],
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
  const scorePlayer = useScorePlayback(playbackScore, audioEngineRef);
  const notationBeat = performanceScore
    ? beatAtPerformanceTime(
        performanceScore,
        sourceTime(
          sourceTimeAtRepeatPosition(
            scorePlayer.position,
            playbackScore?.repeatSegments ?? [],
          ),
          holds,
        ),
      )
    : 0;
  const scorePitches = useMemo(
    () => scorePitchesAt(playbackScore, scorePlayer.position),
    [playbackScore, scorePlayer.position],
  );
  const scoreEvents = useMemo<MelodyEvent[]>(() =>
    (playbackScore?.notes ?? []).map((note, index) => ({
      id: `score-${index}`,
      pitch: note.name,
      note: note.name,
      midi: note.midi,
      start: note.time,
      end: note.time + note.duration,
    })), [playbackScore]);
  const isScoreMode = workspaceMode === "score";
  const timelineEvents = isScoreMode ? scoreEvents : melodyEvents;
  const scoreEventId = scoreEvents.reduce<string | null>((current, event) =>
    event.start <= scorePlayer.position && scorePlayer.position < event.end
      ? event.id
      : current,
  null);
  const timelineActiveId = isScoreMode ? null : state.activeMelodyEventId;
  const timelinePlaybackId = isScoreMode ? scoreEventId : state.playbackMelodyEventId;

  const activateAudioMode = useCallback(() => {
    scorePlayer.pause();
    setWorkspaceMode("audio");
  }, [scorePlayer]);

  const activateScoreMode = useCallback(() => {
    handleStop();
    setWorkspaceMode("score");
  }, [handleStop]);

  useEffect(() => {
    const audioEngine = audioEngineRef.current;
    return () => audioEngine.dispose();
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
    if (isScoreMode) {
      scorePlayer.seek(event.start);
      return;
    }
    void handleTimelineEventClick(event);
    if (state.playbackMode === "audio") handleAudioSeek(event.start);
  }, [handleAudioSeek, handleTimelineEventClick, state.playbackMode, isScoreMode, scorePlayer]);

  /* ── Display state ───────────────────────────────────────────────────── */
  const {
    displayMelodyIndex, prevMelodyEvent, currentMelodyEvent, nextMelodyEvent,
    recentEventIds, recentMelodyPitches,
  } = useMelodyDisplayState({
    melodyEvents: timelineEvents,
    activeMelodyEventId: timelineActiveId,
    playbackMelodyEventId: timelinePlaybackId,
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
        <div style={S.toolbar}>
          <h2 style={S.toolbarTitle}>音樂辨識</h2>

          <div style={S.toolbarRight}>
            <div style={S.modeSwitch} role="group" aria-label="辨識模式">
              <button
                type="button"
                style={{ ...S.modeButton, ...(!isScoreMode ? S.modeButtonActive : {}) }}
                aria-pressed={!isScoreMode}
                onClick={activateAudioMode}
              >
                音訊辨識
              </button>
              <button
                type="button"
                style={{ ...S.modeButton, ...(isScoreMode ? S.modeButtonActive : {}) }}
                aria-pressed={isScoreMode}
                onClick={activateScoreMode}
              >
                樂譜辨識
              </button>
            </div>

            <TransformToolbar
              activeMode={displayMode}
              onModeChange={triggerTransformTransition}
            />

            {/* 音檔上傳區塊 */}
            {!isScoreMode && (
              <AudioUploadPanel
                isTranscribing={isTranscribing}
                onSelectFile={handleUploadAudio}
              />
            )}
          </div>
        </div>

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
          />
        )}

        <div style={S.grid}>
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
                <div style={S.scoreGraphLabel}>
                  <span>Tonnetz</span>
                  <strong>{scoreImport.score ? scorePitches.join(" · ") || "休止" : "等待匯入"}</strong>
                </div>
              )}
              <TonnetzSvg
                nodes={graph.nodes}
                triangles={graph.triangles}
                onViewportChange={handleViewportChange}
                radius={RADIUS}
                playedPitchClasses={isScoreMode && scoreImport.score
                  ? Array.from(new Set([...scorePitches, ...state.playedPitchClasses]))
                  : state.playedPitchClasses}
                focusedPitchClasses={isScoreMode ? state.focusedPitchClasses : displayedFocus}
                focusedNodeIndex={state.focusedNodeIndex}
                showStrongFocus={isScoreMode
                  ? scorePlayer.isPlaying
                  : state.isPlayingMelody || state.playbackMelodyEventId !== null}
                activeChordKey={state.activeChordKey}
                activeEdgeKey={state.activeEdgeKey}
                activeEdgePitchPair={state.activeEdgePitchPair}
                edgeFrames={edgeFrames}
                recentMelodyPitches={isScoreMode ? new Set<PitchClass>() : recentMelodyPitches}
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

          <div style={S.rightColumn}>
            <MelodyWindow
              currentMelodyEvent={currentMelodyEvent}
              prevMelodyEvent={prevMelodyEvent}
              nextMelodyEvent={nextMelodyEvent}
              displayMelodyIndex={displayMelodyIndex}
              melodyEventsLength={timelineEvents.length}
              selectionInfo={isScoreMode ? null : state.selectionInfo}
            />
            <MelodyTimeline
              melodyEvents={timelineEvents}
              activeMelodyEventId={timelineActiveId}
              playbackMelodyEventId={timelinePlaybackId}
              recentEventIds={recentEventIds}
              onClickEvent={handleTimelineClick}
            />
          </div>
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
