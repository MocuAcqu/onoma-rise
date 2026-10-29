import { backendClient } from "../../../shared/api/backendClient";
import { AudioRecognitionApi } from "./AudioRecognitionApi";
import { ScoreRecognitionApi } from "./ScoreRecognitionApi";

export const audioRecognitionApi = new AudioRecognitionApi(backendClient);
export const scoreRecognitionApi = new ScoreRecognitionApi(backendClient);

export type { ScoreJob, ScoreNotation } from "./ScoreRecognitionApi";
