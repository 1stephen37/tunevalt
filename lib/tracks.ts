import { MusicTrack } from '@/types/music';

/** Fetch danh sách nhạc built-in từ public/music/tracks.json */
export async function getBuiltinTracks(): Promise<MusicTrack[]> {
  try {
    const res = await fetch('/music/tracks.json');
    if (!res.ok) return [];
    const data: MusicTrack[] = await res.json();
    return data.map((t) => ({ ...t, builtin: true, addedAt: new Date(0) }));
  } catch {
    return [];
  }
}
