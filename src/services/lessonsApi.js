import bffApi from "./bffApi";

export function videoSource(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    let id;
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(url.hostname)) {
      id = url.pathname === "/watch" ? url.searchParams.get("v") : /^\/(?:embed|shorts|live)\/([^/]+)\/?$/.exec(url.pathname)?.[1];
    } else if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    if (id && /^[\w-]{11}$/.test(id)) return { type: "embed", url: `https://www.youtube-nocookie.com/embed/${id}` };
    if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname)) {
      const match = /^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/.exec(url.pathname);
      if (match) {
        const hash = match[2] || url.searchParams.get("h");
        return { type: "embed", url: `https://player.vimeo.com/video/${match[1]}${hash && /^[a-zA-Z0-9]+$/.test(hash) ? `?h=${hash}` : ""}` };
      }
    }
    return { type: /\.(mp4|webm|ogv)$/i.test(url.pathname) ? "file" : "link", url: url.href };
  } catch { return null; }
}

export async function getLessons(offset = 0, signal) {
  const response = await bffApi.request({ method: "get", url: "api/lessons", params: { limit: 20, offset }, signal, timeout: 15000 });
  const data = response.data?.data;
  if (response.data?.success !== true || !Array.isArray(data?.items) || typeof data.hasMore !== "boolean" ||
      data.items.some(item => !item || typeof item.id !== "string" || typeof item.title !== "string" || typeof item.description !== "string" || !videoSource(item.videoUrl))) {
    throw new Error("Resposta de aulas inválida.");
  }
  return data;
}
