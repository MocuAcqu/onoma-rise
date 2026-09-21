"""Recover piano-system and barline geometry from the prepared score image.

HOMR currently emits system breaks but not source coordinates.  This module
keeps OCR directions attached to the printed system and bar instead of evenly
splitting the page into a grid.  Detection is deliberately limited to strong
staff/bar lines; callers fall back safely when a page is not a piano score.
"""
from __future__ import annotations

from bisect import bisect_right
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SystemGeometry:
    index: int
    top_staff_y: float
    bottom_staff_y: float
    barlines: tuple[float, ...]

    @property
    def center_y(self) -> float:
        return (self.top_staff_y + self.bottom_staff_y) / 2

    def locate_x(self, x: float) -> tuple[int, float]:
        """Return zero-based measure slot and horizontal fraction in the bar."""
        slot = min(len(self.barlines) - 2, max(0, bisect_right(self.barlines, x) - 1))
        left, right = self.barlines[slot:slot + 2]
        fraction = min(1.0, max(0.0, (x - left) / max(1.0, right - left)))
        return slot, fraction

    def direction_lane(self, y: float, kind: str) -> tuple[str, int]:
        if kind in {"tempo", "restore_tempo", "section"} or y < self.top_staff_y:
            return "above", 1
        if y <= self.bottom_staff_y:
            return "below", 1
        return "below", 2


@dataclass(frozen=True)
class ScoreGeometry:
    width: int
    height: int
    systems: tuple[SystemGeometry, ...]

    def nearest_system(self, y: float) -> SystemGeometry:
        return min(self.systems, key=lambda system: abs(system.center_y - y))


def _staff_centers(binary, system_count: int) -> list[int]:
    import cv2
    import numpy as np

    height, width = binary.shape
    horizontal = cv2.morphologyEx(
        binary,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (max(40, width // 18), 1)),
    )
    projection = (horizontal > 0).sum(axis=1).astype(float)
    window = max(20, height // 32)
    density = np.convolve(projection, np.ones(window), mode="same")
    separation = max(20, round(height / max(1, system_count * 4.5)))
    centers: list[int] = []
    for candidate in np.argsort(density)[::-1]:
        y = int(candidate)
        if y < window // 2 or y >= height - window // 2:
            continue
        if all(abs(y - existing) > separation for existing in centers):
            centers.append(y)
        if len(centers) == system_count * 2:
            break
    return sorted(centers)


def _cluster_candidates(candidates: list[tuple[float, float]], distance: float):
    clusters: list[list[tuple[float, float]]] = []
    for candidate in sorted(candidates):
        if not clusters or candidate[0] - clusters[-1][-1][0] > distance:
            clusters.append([candidate])
        else:
            clusters[-1].append(candidate)
    return [
        (
            sum(x * max(score, 1) for x, score in cluster)
            / sum(max(score, 1) for _, score in cluster),
            max(score for _, score in cluster),
        )
        for cluster in clusters
    ]


def _barlines(binary, top: int, bottom: int, expected: int) -> tuple[float, ...]:
    import cv2
    import numpy as np

    _, width = binary.shape
    staff_distance = max(1, bottom - top)
    margin = max(6, round(staff_distance * 0.28))
    y1, y2 = top + margin, bottom - margin
    if y2 - y1 < 12:
        return tuple(np.linspace(width * 0.05, width * 0.95, expected))
    gap = binary[y1:y2]
    gap_height = gap.shape[0]
    vertical = cv2.morphologyEx(
        gap,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(
            cv2.MORPH_RECT, (1, max(5, round(gap_height * 0.45)))
        ),
    )
    projection = (vertical > 0).sum(axis=0)
    active = projection >= gap_height * 0.65
    raw: list[tuple[float, float]] = []
    start = None
    for x, enabled in enumerate(active):
        if enabled and start is None:
            start = x
        if start is not None and (not enabled or x == width - 1):
            end = x if not enabled else x + 1
            raw.append(((start + end - 1) / 2, float(projection[start:end].max())))
            start = None
    candidates = [
        item for item in _cluster_candidates(raw, max(8, width * 0.012))
        if width * 0.01 <= item[0] <= width * 0.99
    ]
    if len(candidates) > expected:
        edge = {min(candidates)[0], max(candidates)[0]}
        internal = sorted(
            (item for item in candidates if item[0] not in edge),
            key=lambda item: item[1],
            reverse=True,
        )[:max(0, expected - 2)]
        candidates = [item for item in candidates if item[0] in edge] + internal
    if len(candidates) != expected:
        if len(candidates) >= 2:
            left, right = min(candidates)[0], max(candidates)[0]
        else:
            left, right = width * 0.05, width * 0.95
        return tuple(float(value) for value in np.linspace(left, right, expected))
    return tuple(item[0] for item in sorted(candidates))


def analyze_score_geometry(
    image_path: Path | None, measures_per_system: list[int]
) -> ScoreGeometry | None:
    if not image_path or not image_path.is_file() or not measures_per_system:
        return None
    import cv2

    grayscale = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if grayscale is None:
        return None
    binary = cv2.threshold(
        grayscale, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )[1]
    height, width = binary.shape
    centers = _staff_centers(binary, len(measures_per_system))
    if len(centers) != len(measures_per_system) * 2:
        return None
    systems = []
    for index, measure_count in enumerate(measures_per_system):
        top, bottom = centers[index * 2:index * 2 + 2]
        systems.append(SystemGeometry(
            index=index,
            top_staff_y=top,
            bottom_staff_y=bottom,
            barlines=_barlines(binary, top, bottom, measure_count + 1),
        ))
    return ScoreGeometry(width=width, height=height, systems=tuple(systems))
