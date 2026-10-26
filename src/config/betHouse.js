import { SUPPORT_URL } from "config/support";
import { getTrackingParams } from "../services/tracking";

// Official affiliation supplied for Paga Bandida. Actual campaign tracking takes priority.
const DEFAULT_AFFILIATION = {
  axioClickId: "e5050517-3f86-4335-9fc7-5d0adaf550f4",
  axioAffId: "NLNYO",
};

export const BET_HOUSE = {
  id: "ganhebetbr",
  name: "ganhebetBR",
  baseUrl: "https://www.ganhebetbr.com/",
  get siteUrl() {
    const url = new URL(this.baseUrl);
    Object.entries(this.registrationTracking).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
  },
  supportUrl: SUPPORT_URL,
  recoveryUrl: null, // Await a confirmed deep link; never guess an auth route.
  get registrationTracking() { return { ...DEFAULT_AFFILIATION, ...getTrackingParams() }; },
  registrationUrl: "https://go.ganhebetbr.com/c/7ul",
};
