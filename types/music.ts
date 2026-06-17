export type MusicTrack = {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt?: Date;
  blobUrl?: string;
  /** true = nhạc có sẵn trong source code (public/music/) */
  builtin?: boolean;
  /** đường dẫn tĩnh, chỉ dùng cho builtin tracks */
  file?: string;
  /** true = đã được lưu vào Cache API trên thiết bị này */
  cached?: boolean;
};
