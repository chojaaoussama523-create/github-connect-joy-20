import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const HANDLE = "Snnsei";
const API = "https://www.googleapis.com/youtube/v3";

export type YtVideo = { videoId: string; title: string; thumbnail: string; publishedAt: string; views: number; short: boolean };
export type YtPlaylist = { id: string; title: string; thumbnail: string; count: number };
export type YtFeed = { channelTitle: string; channelThumb: string; videos: YtVideo[]; playlists: YtPlaylist[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function yt(key: string, path: string, params: Record<string, string>): Promise<any> {
  const r = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key })}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || "YouTube request failed");
  return d;
}

function seconds(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}

export const getYoutubeFeed = createServerFn({ method: "GET" }).handler(async (): Promise<YtFeed> => {
  const key = process.env["YOUTUBE_API_KEY"] || "AIzaSyC-MyP-v16zhd-NFRo9h3G3Wi2Fk9vkgZc";
  const ch = await yt(key, "channels", { part: "snippet,contentDetails", forHandle: HANDLE });
  const c = ch.items?.[0];
  if (!c) throw new Error("Channel not found");
  const uploads = c.contentDetails.relatedPlaylists.uploads as string;
  const [items, pls] = await Promise.all([
    yt(key, "playlistItems", { part: "contentDetails", playlistId: uploads, maxResults: "30" }),
    yt(key, "playlists", { part: "snippet,contentDetails", channelId: c.id, maxResults: "25" }),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids = (items.items ?? []).map((x: any) => x.contentDetails.videoId).join(",");
  const det = ids ? await yt(key, "videos", { part: "snippet,contentDetails,statistics", id: ids }) : { items: [] };
  return {
    channelTitle: c.snippet.title,
    channelThumb: c.snippet.thumbnails?.default?.url ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videos: det.items.map((v: any) => ({
      videoId: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails?.high?.url ?? v.snippet.thumbnails?.medium?.url ?? "",
      publishedAt: v.snippet.publishedAt,
      views: Number(v.statistics?.viewCount || 0),
      short: seconds(v.contentDetails.duration) <= 60,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    playlists: (pls.items ?? []).map((p: any) => ({
      id: p.id,
      title: p.snippet.title,
      thumbnail: p.snippet.thumbnails?.medium?.url ?? "",
      count: p.contentDetails?.itemCount ?? 0,
    })),
  };
});

export const getPlaylistVideos = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(5).max(64) }).parse(d))
  .handler(async ({ data }): Promise<{ videoId: string; title: string; thumbnail: string }[]> => {
    const key = process.env["YOUTUBE_API_KEY"] || "AIzaSyC-MyP-v16zhd-NFRo9h3G3Wi2Fk9vkgZc";
    const r = await yt(key, "playlistItems", { part: "snippet,contentDetails", playlistId: data.id, maxResults: "50" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (r.items ?? []).map((x: any) => ({
      videoId: x.contentDetails.videoId as string,
      title: x.snippet.title as string,
      thumbnail: (x.snippet.thumbnails?.medium?.url ?? "") as string,
    }));
  });
