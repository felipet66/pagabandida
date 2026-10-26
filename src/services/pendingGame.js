const KEY = "pagabandida:pendingGame";

export const rememberPendingGame = game => {
  // Store only the catalog selection, never the session-bearing launch URL.
  sessionStorage.setItem(KEY, JSON.stringify({ launchSlug: game.launchSlug, name: game.name }));
};

export const takePendingGame = () => {
  const value = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  try {
    const game = JSON.parse(value);
    return typeof game?.launchSlug === "string" ? game : null;
  } catch {
    return null;
  }
};

export const hasPendingGame = () => Boolean(sessionStorage.getItem(KEY));
