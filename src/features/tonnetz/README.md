# Tonnetz frontend structure

The Tonnetz feature uses a small feature-first structure. React workflows stay in
hooks, deterministic music/graph calculations stay as pure functions, and classes
are reserved for objects that own resources or event lifecycles.

```text
features/tonnetz/
├── audio/       audio recognition, playback hooks, and AudioEngine
├── graph/       Tonnetz geometry, transforms, keyboard, and interactions
├── melody/      melody display derivation
├── score/       score recognition, timing transforms, notation, and playback
├── workspace/   route composition and audio/score mode coordination
├── components/  reusable visual components with component-local styles
├── config/      music mappings, demo data, and visual theme constants
├── store/       reducer-based playback state
├── types/       shared music, graph, and selection types
└── index.ts     public route entry
```

## Responsibility rules

- `workspace/` composes features; it must not implement score timing or graph math.
- `audio/` and `score/` may depend on shared `types`, `config`, and playback state.
- `graph/` owns Tonnetz math and interaction workflows, not page layout.
- Score timing modules are pure transformations from one score value to another.
- `AudioEngine` and `KeyboardController` are classes because they own external
  resources or event lifecycles. Do not convert pure transformations into classes.
- Backend access goes through `src/api`; Tonnetz code must not call `fetch` directly.
- New reusable UI follows
  `components/ComponentName/{ComponentName.tsx, styles.ts, index.ts}`.
- Complex SVG rendering stays composed from the local `TonnetzSvg` layers.
