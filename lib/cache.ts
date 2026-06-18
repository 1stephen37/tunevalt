const AUDIO_CACHE = 'tunevalt-audio';
const META_CACHE = 'tunevalt-meta';

/**
 * Luôn dùng ABSOLUTE URL làm cache key.
 * cache.match() với relative URL sẽ được browser resolve thành absolute,
 * nhưng cache.put() với relative key lưu dưới dạng relative → mismatch khi lookup.
 * Dùng absolute URL tránh hoàn toàn vấn đề này.
 */
function toAbsoluteUrl(filePath: string): string {
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const path = filePath.startsWith('/') ? filePath : `/music/${filePath}`;
  // typeof window check để tránh lỗi SSR
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  return path;
}

/** Lưu file upload từ <input> vào Cache API */
export async function saveMusicToCache(file: File): Promise<string> {
  const cache = await caches.open(AUDIO_CACHE);
  const relativePath = `/music/${file.name}`;
  const absoluteUrl = toAbsoluteUrl(relativePath);

  await cache.put(
    absoluteUrl,
    new Response(file, {
      status: 200,
      headers: {
        'Content-Type': file.type,
        'Content-Length': String(file.size),
      },
    })
  );

  // Trả về relative path để lưu vào DB (portable hơn absolute)
  return relativePath;
}

/** Lưu nhạc built-in (fetch từ URL tĩnh) vào Cache API để dùng offline */
export async function saveBuiltinToCache(filePath: string): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  const absoluteUrl = toAbsoluteUrl(filePath);

  const existing = await cache.match(absoluteUrl);
  if (existing) return;

  const response = await fetch(absoluteUrl);
  if (!response.ok) throw new Error(`Không tải được: ${absoluteUrl}`);
  await cache.put(absoluteUrl, response.clone());
}

/** Kiểm tra một file có trong cache chưa */
export async function isInCache(filePath: string): Promise<boolean> {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const absoluteUrl = toAbsoluteUrl(filePath);
    const match = await cache.match(absoluteUrl);
    return !!match;
  } catch {
    return false;
  }
}

/** Lấy blob URL từ cache. Trả về null nếu chưa cache. */
export async function getMusicFromCache(filePath: string): Promise<string | null> {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const absoluteUrl = toAbsoluteUrl(filePath);
    const response = await cache.match(absoluteUrl);
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
 * - Có cache → trả blob URL (hoạt động offline)
 * - Chưa cache → trả absolute URL (cần online)
 */
export async function getPlayUrl(filePath: string): Promise<string> {
  const cached = await getMusicFromCache(filePath);
  if (cached) return cached;
  return toAbsoluteUrl(filePath);
}

export async function clearAudioCache(): Promise<void> {
  await caches.delete(AUDIO_CACHE);
  await caches.delete(META_CACHE);
}
