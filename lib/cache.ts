const CACHE_NAME = 'music-cache';

/** Lưu file upload từ <input> vào Cache API */
export async function saveMusicToCache(file: File): Promise<string> {
  const cache = await caches.open(CACHE_NAME);
  const urlPath = `/music/${file.name}`;
  await cache.put(urlPath, new Response(file, { headers: { 'Content-Type': file.type } }));
  return urlPath;
}

/** Lưu nhạc built-in (fetch từ URL tĩnh) vào Cache API để dùng offline */
export async function saveBuiltinToCache(filePath: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const existing = await cache.match(filePath);
  if (existing) return; // đã có rồi, không fetch lại
  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`Không tải được: ${filePath}`);
  await cache.put(filePath, response);
}

/** Kiểm tra một file có trong cache chưa */
export async function isInCache(filePath: string): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  const match = await cache.match(filePath);
  return !!match;
}

/** Lấy blob URL từ cache. Trả về null nếu chưa cache. */
export async function getMusicFromCache(filePath: string): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(filePath);
  if (!response) return null;
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/** Lấy URL để phát: ưu tiên cache, fallback về đường dẫn gốc */
export async function getPlayUrl(filePath: string): Promise<string> {
  const cached = await getMusicFromCache(filePath);
  if (cached) return cached;
  // fallback: stream thẳng từ server (chỉ hoạt động khi online)
  return filePath;
}
