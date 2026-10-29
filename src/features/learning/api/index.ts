import { backendClient } from "../../../shared/api/backendClient";
import { ChapterApi } from "./ChapterApi";

export const chapterApi = new ChapterApi(backendClient);
