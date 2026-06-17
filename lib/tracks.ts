import { MusicTrack } from '@/types/music';

const TRACKS_URL = '/music/tracks.json';

/**
 * Fetch danh sách nhạc built-in từ public/music/tracks.json.
 * SW sẽ intercept và trả từ cache khi offline (StaleWhileRevalidate).
 * Nếu SW chưa có cache (lần đầu offline), trả về mảng rỗng — graceful degrade.
 */
export async function getBuiltinTracks(): Promise<MusicTrack[]> {
  try {
    const res = await fetch(TRACKS_URL);
    if (!res.ok) return [];
    const data: MusicTrack[] = await res.json();
    return data.map((t) => ({ ...t, builtin: true, addedAt: new Date(0) }));
  } catch {
    // Offline và SW chưa có cache tracks.json → trả rỗng, không crash
    return [];
  }
}
