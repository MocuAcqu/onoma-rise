import { useCallback, useState } from "react";

type WorkspaceMode = "audio" | "score";

export function useWorkspaceMode(stopAudio: () => void) {
  const [mode, setMode] = useState<WorkspaceMode>("audio");

  const activateAudioMode = useCallback((pauseScore: () => void) => {
    pauseScore();
    setMode("audio");
  }, []);

  const activateScoreMode = useCallback(() => {
    stopAudio();
    setMode("score");
  }, [stopAudio]);

  return {
    isScoreMode: mode === "score",
    activateAudioMode,
    activateScoreMode,
  };
}
