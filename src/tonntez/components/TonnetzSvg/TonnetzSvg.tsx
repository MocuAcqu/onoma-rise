import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import DiamondLayer from "./DiamondLayer";
import EdgeLayer from "./EdgeLayer";
import NodeHaloLayer from "./NodeHaloLayer";
import NodeLayer from "./NodeLayer";
import SvgFilters from "./SvgFilters";
import TriangleLayer from "./TriangleLayer";
import { createTonnetzDisplayState, LATTICE_OFFSET_X, LATTICE_OFFSET_Y } from "./displayState";
import { SQRT3 } from "../../config/music";
import type { TonnetzSvgProps } from "./types";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const VIEWPORT_MARGIN = 6;

export default function TonnetzSvg({
  nodes,
  triangles,
  scale = 80,
  radius = 18,
  playedPitchClasses,
  focusedPitchClasses,
  focusedNodeIndex,
  showStrongFocus,
  activeChordKey,
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
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const handleMouseDown = useCallback((event: ReactMouseEvent<SVGSVGElement>) => {
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    setIsDragging(true);
  }, [pan.x, pan.y]);

  const handleMouseMove = useCallback((event: ReactMouseEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    setPan({ x: drag.originX + dx, y: drag.originY + dy });
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

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

  const display = createTonnetzDisplayState({
    scale,
    triangles,
    activeChordKey,
    activeEdgePitchPair,
    selectedDiamondPitchSet,
    transformMode,
    transitionFrame,
  });

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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
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
