import type { ApiClient } from "../../../shared/api/ApiClient";

export type GoogleProfile = { email: string; name: string; sub: string };

export class GoogleIdentityApi {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  profile(accessToken: string): Promise<GoogleProfile> {
    return this.client.get<GoogleProfile>("/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}
