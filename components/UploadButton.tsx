'use client';

import { useState } from 'react';
import { saveMusicToCache } from '@/lib/cache';
import { saveTrack } from '@/lib/db';
import { MusicTrack } from '@/types/music';

export default function UploadButton({ onUpload }: { onUpload: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const audioFiles = Array.from(files).filter((f) => f.type.startsWith('audio/'));
    if (audioFiles.length === 0) return;

    setUploading(true);
    setDone(false);
    setCount(0);

    for (const file of audioFiles) {
      try {
        const filePath = await saveMusicToCache(file); // /music/<tên>
        const track: MusicTrack = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          file: filePath, // lưu path để sau reload không cần reconstruct
          size: file.size,
          type: file.type,
          addedAt: new Date(),
        };
        await saveTrack(track);
        setCount((c) => c + 1);
      } catch (err) {
        console.error('Lỗi upload:', err);
      }
    }

    setUploading(false);
    setDone(true);
    onUpload();

    setTimeout(() => setDone(false), 3000);
    // reset input
    e.target.value = '';
  };

  return (
    <label
      className="flex items-center justify-center gap-3 w-full cursor-pointer rounded-2xl px-6 py-4 font-semibold text-sm transition-all duration-200 select-none"
      style={{
        background: uploading
          ? 'linear-gradient(135deg, #4c1d95, #6d28d9)'
          : done
          ? 'linear-gradient(135deg, #065f46, #059669)'
          : 'linear-gradient(135deg, #5b21b6, #7c3aed)',
        boxShadow: '0 4px 24px rgba(124, 58, 237, 0.35)',
      }}
    >
      {uploading ? (
        <>
          <span className="animate-spin text-lg">⏳</span>
          <span>Đang lưu... ({count} bài)</span>
        </>
      ) : done ? (
        <>
          <span className="text-lg">✅</span>
          <span>Đã thêm {count} bài hát</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4"
            />
          </svg>
          <span>Thêm nhạc vào thư viện</span>
        </>
      )}
      <input
        type="file"
        multiple
        accept="audio/*"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
    </label>
  );
}
