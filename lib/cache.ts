const AUDIO_CACHE = 'tunevalt-audio';
const META_CACHE = 'tunevalt-meta';

/**
 * Chuẩn hoá cache key: luôn dùng /music/<tên file gốc>, KHÔNG encode.
 * Nhất quán giữa lúc lưu (saveMusicToCache) và lúc đọc (getPlayUrl / isInCache).
 */
function audioKey(fileName: string): string {
  // Nếu đã là full path thì giữ nguyên, nếu chỉ là tên file thì thêm prefix
  return fileName.startsWith('/') ? fileName : `/music/${fileName}`;
}

/** Lưu file upload từ <input> vào Cache API */
export async function saveMusicToCache(file: File): Promise<string> {
  const cache = await caches.open(AUDIO_CACHE);
  const key = audioKey(file.name); // /music/Tên bài.mp3  (không encode)
  await cache.put(
    key,
    new Response(file, {
      status: 200,
      headers: {
        'Content-Type': file.type,
        'Content-Length': String(file.size),
      },
    })
  );
  return key;
}

/** Lưu nhạc built-in (fetch từ URL tĩnh) vào Cache API để dùng offline */
export async function saveBuiltinToCache(filePath: string): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  const key = audioKey(filePath);
  const existing = await cache.match(key);
  if (existing) return;

  const response = await fetch(key);
  if (!response.ok) throw new Error(`Không tải được: ${key}`);
  await cache.put(key, response.clone());
}

/** Kiểm tra một file có trong cache chưa */
export async function isInCache(filePath: string): Promise<boolean> {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const key = audioKey(filePath);
    const match = await cache.match(key, { ignoreVary: true });
    return !!match;
  } catch {
    return false;
  }
}

/** Lấy blob URL từ cache. Trả về null nếu chưa cache. */
export async function getMusicFromCache(filePath: string): Promise<string | null> {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const key = audioKey(filePath);
    const response = await cache.match(key, { ignoreVary: true });
    if (!response) return null;
    const blob = await response.blob();
    if (blob.size === 0) return null; // response rỗng — không phát được
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Lấy URL để phát:
 * - Có cache → trả blob URL (hoạt động offline)
 * - Chưa cache → trả path gốc (cần online)
 */
export async function getPlayUrl(filePath: string): Promise<string> {
  const cached = await getMusicFromCache(filePath);
  if (cached) return cached;
  return audioKey(filePath);
}

export async function clearAudioCache(): Promise<void> {
  await caches.delete(AUDIO_CACHE);
  await caches.delete(META_CACHE);
}
