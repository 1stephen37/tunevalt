/**
 * Cache name phải khớp với next.config.js runtimeCaching cacheName.
 * App code đọc/ghi trực tiếp vào cache này, SW cũng serve từ đây.
 */
const AUDIO_CACHE = 'tunevalt-audio';

/** Chuẩn hoá về relative path: /music/<tên file> */
function toRelativePath(filePath: string): string {
  // Đã là relative path
  if (filePath.startsWith('/music/')) return filePath;
  // Absolute URL → lấy pathname
  if (filePath.startsWith('http')) {
    try { return new URL(filePath).pathname; } catch { /* ignore */ }
  }
  // Chỉ là tên file
  return `/music/${filePath}`;
}

/** Lưu file upload từ <input> vào Cache API */
export async function saveMusicToCache(file: File): Promise<string> {
  const cache = await caches.open(AUDIO_CACHE);
  const key = `/music/${file.name}`;
  await cache.put(
    new Request(key),
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

/** Lưu nhạc built-in bằng cách fetch rồi đưa vào cache */
export async function saveBuiltinToCache(filePath: string): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  const key = toRelativePath(filePath);

  const existing = await cache.match(new Request(key));
  if (existing) return;

  const response = await fetch(key);
  if (!response.ok) throw new Error(`Không tải được: ${key}`);
  await cache.put(new Request(key), response.clone());
}

/** Kiểm tra file có trong cache chưa */
export async function isInCache(filePath: string): Promise<boolean> {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const key = toRelativePath(filePath);
    const match = await cache.match(new Request(key));
    return !!match;
  } catch {
    return false;
  }
}

/** Lấy blob URL từ cache để phát offline */
export async function getMusicFromCache(filePath: string): Promise<string | null> {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const key = toRelativePath(filePath);
    const response = await cache.match(new Request(key));
    if (!response) return null;
    const blob = await response.blob();
    if (blob.size === 0) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Lấy URL để phát:
 * - Có trong cache → blob URL (offline OK)
 * - Không có → relative path (cần network, SW sẽ cache khi online)
 */
export async function getPlayUrl(filePath: string): Promise<string> {
  const blobUrl = await getMusicFromCache(filePath);
  if (blobUrl) return blobUrl;
  return toRelativePath(filePath);
}

export async function clearAudioCache(): Promise<void> {
  await caches.delete(AUDIO_CACHE);
}
