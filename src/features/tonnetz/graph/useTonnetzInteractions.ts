import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, RefObject } from "react";
import type { AudioEngine } from "../audio/AudioEngine";
import { KeyboardController } from "./KeyboardController";
import PitchUtils from "./PitchUtils";
import { findModeNeighborTriangle } from "./transformUtils";
import type { Action, State } from "../store/playback";
import type { TransformMode } from "./useTransformTransition";
import type { MelodyEvent, PitchClass, TonnetzNode, TriangleData } from "../types";
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

  const selectPitch = useCallback((pitch: PitchClass, index: number, octave: number) => {
    dispatch({
      type: "PRESS_PITCH",
      pitch,
      index,
      note: PitchUtils.buildNote(pitch, octave),
    });
  }, [dispatch]);

  const pressPitch = useCallback((
    pitch: PitchClass,
    index: number,
    octave: number,
    velocity = baseVelocity,
    updateSelection = true,
  ) => {
    if (!audioEngineRef.current.attack(pitch, octave, velocity)) return;
    if (updateSelection) selectPitch(pitch, index, octave);
  }, [audioEngineRef, baseVelocity, selectPitch]);

  const releasePitch = useCallback((pitch: PitchClass, octave: number) => {
    if (!audioEngineRef.current.release(pitch, octave)) return;
    triggerNodeAnimation(pitch);
    dispatch({ type: "RELEASE_PITCH", pitch });
  }, [audioEngineRef, dispatch, triggerNodeAnimation]);

  const playNode = useCallback((pitch: PitchClass, index: number, octave: number, updateSelection = true) => {
    pressPitch(pitch, index, octave, baseVelocity, updateSelection);
    setTimeout(() => releasePitch(pitch, octave), 350);
  }, [baseVelocity, pressPitch, releasePitch]);

  const playEdge = useCallback((
    from: PitchClass,
    to: PitchClass,
    fromIndex: number,
    toIndex: number,
    octave: number,
    updateSelection = true,
  ) => {
    pressPitch(from, fromIndex, octave, baseVelocity, updateSelection);
    pressPitch(to, toIndex, octave, baseVelocity, updateSelection);
    setTimeout(() => {
      releasePitch(from, octave);
      releasePitch(to, octave);
    }, 350);
  }, [baseVelocity, pressPitch, releasePitch]);

  const selectChord = useCallback((triangle: TriangleData) => {
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
  }, [dispatch]);

  const playChord = useCallback((triangle: TriangleData, octave: number, updateSelection = true) => {
    const notes = triangle.chord.map((pitch) => PitchUtils.buildNote(pitch, octave));
    audioEngineRef.current.attackRelease(notes, 0.35);
    if (updateSelection) selectChord(triangle);
    if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
    chordTimerRef.current = setTimeout(() => dispatch({ type: "CLEAR_CHORD" }), 350);
  }, [audioEngineRef, dispatch, selectChord]);

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
    // Update the graph and Melody Window before any lazy audio work so the
    // interface responds in the same frame as the pointer event.
    selectPitch(pitch, index, state.currentOctave);
    await audioEngineRef.current.ensureStarted();
    playNode(pitch, index, state.currentOctave, false);
  }, [audioEngineRef, playNode, selectPitch, state.currentOctave]);

  const handleEdgeClick = useCallback(async (
    from: PitchClass,
    to: PitchClass,
    fromIndex: number,
    toIndex: number,
    octave: number,
    key: string,
  ) => {
    dispatch({ type: "FLASH_EDGE", key, pitchPair: [from, to] });
    selectPitch(from, fromIndex, octave);
    selectPitch(to, toIndex, octave);
    await audioEngineRef.current.ensureStarted();
    if (edgeTimerRef.current) clearTimeout(edgeTimerRef.current);
    edgeTimerRef.current = setTimeout(() => dispatch({ type: "CLEAR_EDGE", key }), 350);
    triggerEdgeAnimation(key);
    playEdge(from, to, fromIndex, toIndex, octave, false);
  }, [audioEngineRef, dispatch, playEdge, selectPitch, triggerEdgeAnimation]);

  const handleTriangleClick = useCallback(async (triangle: TriangleData) => {
    if (displayMode === "basic") {
      selectChord(triangle);
      await audioEngineRef.current.ensureStarted();
      playChord(triangle, state.currentOctave, false);
      return;
    }

    const neighbor = findModeNeighborTriangle(triangle, graph.triangles, displayMode);
    if (!neighbor) return;
    const pitchSet = Array.from(new Set([...triangle.chord, ...neighbor.chord]));
    const notes = pitchSet.map((pitch) => PitchUtils.buildNote(pitch, state.currentOctave));
    if (diamondTimerRef.current) clearTimeout(diamondTimerRef.current);
    dispatch({ type: "SET_DIAMOND_SET", pitchSet });
    await audioEngineRef.current.ensureStarted();
    audioEngineRef.current.attackRelease(notes, 0.35);
    diamondTimerRef.current = setTimeout(() => dispatch({ type: "CLEAR_DIAMOND_SET" }), 350);
  }, [audioEngineRef, dispatch, displayMode, graph.triangles, playChord, selectChord, state.currentOctave]);

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
