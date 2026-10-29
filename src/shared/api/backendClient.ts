import { ApiClient } from "./ApiClient";
import { apiConfig } from "./config";

/** Single public backend entry; Vite/Nginx routes requests to Node or Python. */
export const backendClient = new ApiClient(apiConfig.baseUrl);
