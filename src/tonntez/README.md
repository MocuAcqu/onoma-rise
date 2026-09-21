# Tonnetz frontend structure

- `pages/`: route-level UI composition only.
- `components/`: one UI object per folder, with local styles and a public `index.ts`.
- `hooks/`: reusable workflows; audio and synth playback are scheduled independently.
- `core/`: framework-independent audio, graph, keyboard, and pitch classes.
- `config/`: music mappings, demo data, and visual theme constants.
- `services/`: backend API access.
- `store/playback/`: reducer types, initial state, and transitions.
- `types/`: music, graph, and selection domain types.
New UI should follow `components/ComponentName/{ComponentName.tsx, styles.ts, index.ts}`.
Complex SVG components should be composed from local visual layers rather than one large render function.
