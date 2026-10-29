import { backendClient } from "../../shared/api/backendClient";
import { ProgressApi } from "./ProgressApi";

export const progressApi = new ProgressApi(backendClient);
export type { Dashboard, QuizRecord } from "./ProgressApi";
