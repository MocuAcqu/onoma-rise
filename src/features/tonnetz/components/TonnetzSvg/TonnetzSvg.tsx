import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import DiamondLayer from "./DiamondLayer";
import EdgeLayer from "./EdgeLayer";
import NodeHaloLayer from "./NodeHaloLayer";
import NodeLayer from "./NodeLayer";
import SvgFilters from "./SvgFilters";
import TriangleLayer from "./TriangleLayer";
import { createTonnetzDisplayState, LATTICE_OFFSET_X, LATTICE_OFFSET_Y } from "./displayState";
import { SQRT3 } from "../../config/music";
import PitchUtils from "../../graph/PitchUtils";
import type { PitchClass } from "../../types";
import type { TonnetzSvgProps } from "./types";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const VIEWPORT_MARGIN = 6;
const EMPTY_PITCH_CLASSES: readonly PitchClass[] = [];

function TonnetzSvg({
  nodes,
  triangles,
  scale = 80,
  radius = 18,
  playedPitchClasses,
  focusedPitchClasses,
  focusedNodeIndex,
  showStrongFocus,
  activeChordKey,
  harmonyTransition,
  recentMelodyPitches,
  onClickNode,
  onClickTriangle,
  activeEdgeKey,
  activeEdgePitchPair,
  edgeFrames,
  nodeFrames,
  onClickEdge,
  currentOctave,
  accentActivePitch,
  accentMode,
  weakVelocity,
  strongVelocity,
  transformMode,
  transitionFrame,
  isTransitioning,
  selectedDiamondPitchSet,
  onViewportChange,
}: TonnetzSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isHarmonyAdditionActive, setIsHarmonyAdditionActive] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  // Pointer events cover mouse, touch and pen. Touch devices pan with one
  // finger and zoom with a two-finger pinch (desktop keeps wheel zoom).
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    startDistance: number;
    startZoom: number;
    worldX: number;
    worldY: number;
  } | null>(null);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  useEffect(() => {
    panRef.current = pan;
    zoomRef.current = zoom;
  }, [pan, zoom]);

  const startDrag = useCallback((clientX: number, clientY: number) => {
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      originX: panRef.current.x,
      originY: panRef.current.y,
    };
    setIsDragging(true);
  }, []);

  const startPinch = useCallback(() => {
    const container = containerRef.current;
    const [a, b] = Array.from(pointersRef.current.values());
    if (!container || !a || !b) return;
    const rect = container.getBoundingClientRect();
    const midX = (a.x + b.x) / 2 - rect.left;
    const midY = (a.y + b.y) / 2 - rect.top;
    pinchRef.current = {
      startDistance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      startZoom: zoomRef.current,
      worldX: (midX - panRef.current.x) / zoomRef.current,
      worldY: (midY - panRef.current.y) / zoomRef.current,
    };
    dragRef.current = null;
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 1) {
      startDrag(event.clientX, event.clientY);
    } else if (pointersRef.current.size === 2) {
      startPinch();
    }
  }, [startDrag, startPinch]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const pinch = pinchRef.current;
    const container = containerRef.current;
    if (pinch && container && pointersRef.current.size >= 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      const rect = container.getBoundingClientRect();
      const midX = (a.x + b.x) / 2 - rect.left;
      const midY = (a.y + b.y) / 2 - rect.top;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, pinch.startZoom * (distance / pinch.startDistance)),
      );
      setZoom(nextZoom);
      setPan({ x: midX - pinch.worldX * nextZoom, y: midY - pinch.worldY * nextZoom });
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    setPan({ x: drag.originX + dx, y: drag.originY + dy });
  }, []);

  const endPointer = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;

    const [remaining] = Array.from(pointersRef.current.values());
    if (remaining) {
      // Lifting one finger after a pinch continues as a one-finger pan.
      startDrag(remaining.x, remaining.y);
      return;
    }
    dragRef.current = null;
    setIsDragging(false);
  }, [startDrag]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = container.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      setZoom((prevZoom) => {
        const zoomFactor = Math.exp(-event.deltaY * 0.001);
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * zoomFactor));
        if (nextZoom === prevZoom) return prevZoom;

        setPan((prevPan) => {
          const worldX = (cursorX - prevPan.x) / prevZoom;
          const worldY = (cursorY - prevPan.y) / prevZoom;
          return {
            x: cursorX - worldX * nextZoom,
            y: cursorY - worldY * nextZoom,
          };
        });

        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (!harmonyTransition?.addedPitchClasses.length) {
      setIsHarmonyAdditionActive(false);
      return;
    }
    // This state changes only at a harmonic block boundary and once more when
    // the short accent ends; it is independent of requestAnimationFrame.
    setIsHarmonyAdditionActive(true);
    const timer = window.setTimeout(() => setIsHarmonyAdditionActive(false), 700);
    return () => window.clearTimeout(timer);
  }, [harmonyTransition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onViewportChange) return;

    const reportViewport = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const corners = [
        [0, 0],
        [rect.width, 0],
        [0, rect.height],
        [rect.width, rect.height],
      ];

      let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
      for (const [screenX, screenY] of corners) {
        const worldX = (screenX - pan.x) / zoom;
        const worldY = (screenY - pan.y) / zoom;
        const latticeX = (worldX - LATTICE_OFFSET_X) / scale;
        const latticeY = (worldY - LATTICE_OFFSET_Y) / scale;
        const r = latticeY / (SQRT3 / 2);
        const q = latticeX - r * 0.5;
        qMin = Math.min(qMin, q);
        qMax = Math.max(qMax, q);
        rMin = Math.min(rMin, r);
        rMax = Math.max(rMax, r);
      }

      onViewportChange({
        qMin: Math.floor(qMin) - VIEWPORT_MARGIN,
        qMax: Math.ceil(qMax) + VIEWPORT_MARGIN,
        rMin: Math.floor(rMin) - VIEWPORT_MARGIN,
        rMax: Math.ceil(rMax) + VIEWPORT_MARGIN,
      });
    };

    reportViewport();
    const observer = new ResizeObserver(reportViewport);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pan, zoom, scale, onViewportChange]);

  // Score playback changes the active notes much more often than the graph
  // geometry or harmony overlay. Preserve the latter so the static SVG layers
  // can skip reconciliation between note events.
  const display = useMemo(() => createTonnetzDisplayState({
    scale,
    triangles,
    activeChordKey,
    previousChordKey: harmonyTransition?.previousTonnetzChord
      ? PitchUtils.getChordKey(harmonyTransition.previousTonnetzChord)
      : null,
    activeEdgePitchPair,
    selectedDiamondPitchSet,
    transformMode,
    transitionFrame,
  }), [
    activeChordKey,
    activeEdgePitchPair,
    scale,
    harmonyTransition?.previousTonnetzChord,
    selectedDiamondPitchSet,
    transformMode,
    transitionFrame,
    triangles,
  ]);

  const nodeVisualProps = {
    nodes,
    radius,
    playedPitchClasses,
    focusedPitchClasses,
    recentMelodyPitches,
    highlightedPitchClasses: display.highlightedPitchClasses,
    focusedNodeIndex,
    showStrongFocus,
    accentActivePitch,
    accentMode,
    weakVelocity,
    strongVelocity,
    nodeFrames,
    previousHarmonyPitchClasses: harmonyTransition?.removedPitchClasses
      ?? EMPTY_PITCH_CLASSES,
    commonHarmonyPitchClasses: harmonyTransition?.commonPitchClasses
      ?? EMPTY_PITCH_CLASSES,
    addedHarmonyPitchClasses: harmonyTransition?.addedPitchClasses
      ?? EMPTY_PITCH_CLASSES,
    isHarmonyAdditionActive,
    toX: display.toX,
    toY: display.toY,
  };

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}
    >
      <svg
        width="100%"
        height="100%"
        role="img"
        aria-label="Interactive Tonnetz graph"
        style={{
          display: "block",
          overflow: "visible",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
          transformOrigin: "0 0",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
      >
        <SvgFilters />
        <g
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            transform: `scale(${display.transitionScale})`,
            opacity: display.transitionOpacity,
            filter: display.transitionBlur > 0 ? `blur(${display.transitionBlur}px)` : "none",
            transition: isTransitioning ? "all 95ms linear" : "all 180ms ease",
          }}
        >
          <TriangleLayer
            triangles={triangles}
            highlightedIds={display.highlightedTriangleIds}
            previousIds={display.previousTriangleIds}
            transformMode={transformMode}
            toX={display.toX}
            toY={display.toY}
            onClick={onClickTriangle}
          />
          {transformMode !== "basic" && (
            <DiamondLayer
              triangles={triangles}
              transformMode={transformMode}
              selectedPitchSet={selectedDiamondPitchSet}
              activeDiamond={display.activeDiamond}
              toX={display.toX}
              toY={display.toY}
              onClick={onClickTriangle}
            />
          )}
          <EdgeLayer
            nodes={nodes}
            activeEdgeKey={activeEdgeKey}
            activeEdgePitchPair={activeEdgePitchPair}
            highlightedPitchClasses={display.highlightedPitchClasses}
            selectedDiamondPitchSet={selectedDiamondPitchSet}
            transformMode={transformMode}
            edgeFrames={edgeFrames}
            currentOctave={currentOctave}
            toX={display.toX}
            toY={display.toY}
            onClick={onClickEdge}
          />
          <NodeHaloLayer {...nodeVisualProps} />
          <NodeLayer {...nodeVisualProps} onClick={onClickNode} />
        </g>
      </svg>
    </div>
  );
}

export default memo(TonnetzSvg);
