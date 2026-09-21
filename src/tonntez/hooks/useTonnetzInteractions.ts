import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, RefObject } from "react";
import type { AudioEngine } from "../core/AudioEngine";
import { KeyboardController } from "../core/KeyboardController";
import PitchUtils from "../core/PitchUtils";
import { findModeNeighborTriangle } from "../core/transformUtils";
import type { Action, State } from "../store/playbackStore";
import type { TransformMode } from "./useTransformTransition";
import type { MelodyEvent, PitchClass, TonnetzNode, TriangleData } from "../type";
import { useEdgeFrameAnimation } from "./useEdgeFrameAnimation";
import { useNodeFrameAnimation } from "./useNodeFrameAnimation";

type Options = {
  graph: { nodes: TonnetzNode[]; triangles: TriangleData[] };
  state: State;
  displayMode: TransformMode;
  weakVelocity: number;
  strongVelocity: number;
  baseVelocity: number;
  audioEngineRef: RefObject<AudioEngine>;
  dispatch: Dispatch<Action>;
};

export function useTonnetzInteractions({
  graph,
  state,
  displayMode,
  weakVelocity,
  strongVelocity,
  baseVelocity,
  audioEngineRef,
  dispatch,
}: Options) {
  const currentOctaveRef = useRef(state.currentOctave);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diamondTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { nodeFrames, triggerNodeAnimation } = useNodeFrameAnimation();
  const { edgeFrames, triggerEdgeAnimation } = useEdgeFrameAnimation();

  useEffect(() => {
    currentOctaveRef.current = state.currentOctave;
  }, [state.currentOctave]);

  const pressPitch = useCallback((
    pitch: PitchClass,
    index: number,
    octave: number,
    velocity = baseVelocity,
  ) => {
    if (!audioEngineRef.current.attack(pitch, octave, velocity)) return;
    dispatch({
      type: "PRESS_PITCH",
      pitch,
      index,
      note: PitchUtils.buildNote(pitch, octave),
    });
  }, [audioEngineRef, baseVelocity, dispatch]);

  const releasePitch = useCallback((pitch: PitchClass, octave: number) => {
    if (!audioEngineRef.current.release(pitch, octave)) return;
    triggerNodeAnimation(pitch);
    dispatch({ type: "RELEASE_PITCH", pitch });
  }, [audioEngineRef, dispatch, triggerNodeAnimation]);

  const playNode = useCallback((pitch: PitchClass, index: number, octave: number) => {
    pressPitch(pitch, index, octave);
    setTimeout(() => releasePitch(pitch, octave), 350);
  }, [pressPitch, releasePitch]);

  const playEdge = useCallback((
    from: PitchClass,
    to: PitchClass,
    fromIndex: number,
    toIndex: number,
    octave: number,
  ) => {
    pressPitch(from, fromIndex, octave);
    pressPitch(to, toIndex, octave);
    setTimeout(() => {
      releasePitch(from, octave);
      releasePitch(to, octave);
    }, 350);
  }, [pressPitch, releasePitch]);

  const playChord = useCallback((triangle: TriangleData, octave: number) => {
    const notes = triangle.chord.map((pitch) => PitchUtils.buildNote(pitch, octave));
    audioEngineRef.current.attackRelease(notes, 0.35);
    dispatch({
      type: "PLAY_CHORD",
      chordKey: PitchUtils.getChordKey(triangle.chord),
      chord: triangle.chord,
      selectionInfo: {
        kind: "chord",
        chordType: triangle.type,
        chordName: PitchUtils.getChordName(triangle),
        notes: triangle.chord,
      },
    });
    if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
    chordTimerRef.current = setTimeout(() => dispatch({ type: "CLEAR_CHORD" }), 350);
  }, [audioEngineRef, dispatch]);

  useEffect(() => {
    const keyboard = new KeyboardController({
      getOctave: () => currentOctaveRef.current,
      setOctave: (value) => dispatch({ type: "SET_OCTAVE", value }),
      getNodeIndex: (pitch) => graph.nodes.findIndex((node) => node.label === pitch),
      onPress: (pitch, index, octave, velocity) => {
        void audioEngineRef.current.ensureStarted();
        pressPitch(pitch, index, octave, velocity);
      },
      onRelease: releasePitch,
      baseVelocity,
      weakVelocity,
      strongVelocity,
      onSustainChange: (value) => dispatch({ type: "SET_SUSTAIN", value }),
      onAccentChange: (mode, pitch) => dispatch({ type: "SET_ACCENT", mode, pitch }),
      ensureAudio: () => audioEngineRef.current.ensureStarted(),
    });
    keyboard.attach();
    return () => keyboard.detach();
  }, [audioEngineRef, baseVelocity, dispatch, graph, pressPitch, releasePitch, strongVelocity, weakVelocity]);

  useEffect(() => () => {
    [chordTimerRef, timelineTimerRef, edgeTimerRef, diamondTimerRef].forEach((ref) => {
      if (ref.current) clearTimeout(ref.current);
    });
  }, []);

  const handleNodeClick = useCallback(async (pitch: PitchClass, index: number) => {
    await audioEngineRef.current.ensureStarted();
    playNode(pitch, index, state.currentOctave);
  }, [audioEngineRef, playNode, state.currentOctave]);

  const handleEdgeClick = useCallback(async (
    from: PitchClass,
    to: PitchClass,
    fromIndex: number,
    toIndex: number,
    octave: number,
    key: string,
  ) => {
    await audioEngineRef.current.ensureStarted();
    dispatch({ type: "FLASH_EDGE", key, pitchPair: [from, to] });
    if (edgeTimerRef.current) clearTimeout(edgeTimerRef.current);
    edgeTimerRef.current = setTimeout(() => dispatch({ type: "CLEAR_EDGE", key }), 350);
    triggerEdgeAnimation(key);
    playEdge(from, to, fromIndex, toIndex, octave);
  }, [audioEngineRef, dispatch, playEdge, triggerEdgeAnimation]);

  const handleTriangleClick = useCallback(async (triangle: TriangleData) => {
    await audioEngineRef.current.ensureStarted();
    if (displayMode === "basic") {
      playChord(triangle, state.currentOctave);
      return;
    }

    const neighbor = findModeNeighborTriangle(triangle, graph.triangles, displayMode);
    if (!neighbor) return;
    const pitchSet = Array.from(new Set([...triangle.chord, ...neighbor.chord]));
    const notes = pitchSet.map((pitch) => PitchUtils.buildNote(pitch, state.currentOctave));
    audioEngineRef.current.attackRelease(notes, 0.35);
    if (diamondTimerRef.current) clearTimeout(diamondTimerRef.current);
    dispatch({ type: "SET_DIAMOND_SET", pitchSet });
    diamondTimerRef.current = setTimeout(() => dispatch({ type: "CLEAR_DIAMOND_SET" }), 350);
  }, [audioEngineRef, dispatch, displayMode, graph.triangles, playChord, state.currentOctave]);

  const handleTimelineEventClick = useCallback(async (event: MelodyEvent) => {
    await audioEngineRef.current.ensureStarted();
    const pitchClass = PitchUtils.getMelodyPitchClass(event);
    if (!pitchClass) return;

    const note = PitchUtils.getMelodyNote(event, state.currentOctave);
    dispatch({ type: "TIMELINE_CLICK", eventId: event.id, pitch: pitchClass, note });
    audioEngineRef.current.attackRelease(note, 0.25, 0.7);
    if (timelineTimerRef.current) clearTimeout(timelineTimerRef.current);
    timelineTimerRef.current = setTimeout(() => dispatch({ type: "TIMELINE_CLEAR" }), 3000);
  }, [audioEngineRef, dispatch, state.currentOctave]);

  return {
    nodeFrames,
    edgeFrames,
    handleNodeClick,
    handleEdgeClick,
    handleTriangleClick,
    handleTimelineEventClick,
  };
}
