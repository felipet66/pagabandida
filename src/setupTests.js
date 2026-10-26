import { makeFixtureUrl, testSession } from "./testSupport/fixtures";

// Request adapters are mocked in tests. Override even locally configured real values.
process.env.REACT_APP_APP_KEY = testSession;
process.env.REACT_APP_BFF_URL = makeFixtureUrl();
