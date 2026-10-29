"""Fermata and augmentation-dot metadata retained outside MIDI timing."""
from music21 import expressions


def notation_marks(score):
    marks = []
    for part_index, part in enumerate(score.parts):
        for note_index, item in enumerate(part.recurse().notesAndRests):
            fermata = any(isinstance(e, expressions.Fermata) for e in item.expressions)
            if not item.duration.dots and not fermata:
                continue
            marks.append({
                'id': f'{part_index}:{note_index}',
                'part': part_index + 1,
                'measure': item.measureNumber,
                'label': '休止符' if item.isRest else '/'.join(p.nameWithOctave for p in item.pitches),
                'startBeat': float(item.getOffsetInHierarchy(score)),
                'durationBeats': float(item.duration.quarterLength),
                'dots': item.duration.dots,
                'fermata': fermata,
            })
    return marks
