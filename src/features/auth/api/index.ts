import { ApiClient } from "../../../shared/api/ApiClient";
import { backendClient } from "../../../shared/api/backendClient";
import { AuthApi } from "./AuthApi";
import { GoogleIdentityApi } from "./GoogleIdentityApi";

const googleClient = new ApiClient("https://www.googleapis.com");

export const authApi = new AuthApi(backendClient);
export const googleIdentityApi = new GoogleIdentityApi(googleClient);
