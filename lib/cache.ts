/**
 * Cache names phải khớp với next.config.js runtimeCaching.
 * SW dùng 'tunevalt-audio', app code cũng dùng cùng tên để read/write thống nhất.
 */
const AUDIO_CACHE = 'tunevalt-audio';
const META_CACHE = 'tunevalt-meta';

/** Lưu file upload từ <input> vào Cache API */
export async function saveMusicToCache(file: File): Promise<string> {
  const cache = await caches.open(AUDIO_CACHE);
  const urlPath = `/music/${encodeURIComponent(file.name)}`;
  await cache.put(
    urlPath,
    new Response(file, {
      headers: {
        'Content-Type': file.type,
        'Content-Length': String(file.size),
      },
    })
  );
  return urlPath;
}

/** Lưu nhạc built-in (fetch từ URL tĩnh) vào Cache API để dùng offline */
export async function saveBuiltinToCache(filePath: string): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  const existing = await cache.match(filePath);
  if (existing) return; // đã có rồi

  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`Không tải được: ${filePath}`);
  // Clone để đảm bảo response chưa bị consume
  await cache.put(filePath, response.clone());
}

/** Kiểm tra một file có trong cache chưa */
export async function isInCache(filePath: string): Promise<boolean> {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const match = await cache.match(filePath, { ignoreVary: true });
    return !!match;
  } catch {
    return false;
  }
}

/** Lấy blob URL từ cache. Trả về null nếu chưa cache. */
export async function getMusicFromCache(filePath: string): Promise<string | null> {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const response = await cache.match(filePath, { ignoreVary: true });
    if (!response) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Lấy URL để phát:
 * - Có cache → trả blob URL (hoạt động offline)
 * - Chưa cache → trả path gốc (cần online, SW sẽ cache lại lần đầu phát)
 */
export async function getPlayUrl(filePath: string): Promise<string> {
  const cached = await getMusicFromCache(filePath);
  if (cached) return cached;
  return filePath;
}

/** Xoá toàn bộ audio cache (dùng trong settings nếu cần) */
export async function clearAudioCache(): Promise<void> {
  await caches.delete(AUDIO_CACHE);
  await caches.delete(META_CACHE);
}
