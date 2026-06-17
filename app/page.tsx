'use client';

import { useState, useEffect, useCallback } from 'react';
import UploadButton from '@/components/UploadButton';
import Player from '@/components/Player';
import { getAllTracks } from '@/lib/db';
import { getBuiltinTracks } from '@/lib/tracks';
import { saveBuiltinToCache, isInCache } from '@/lib/cache';
import { MusicTrack } from '@/types/music';

function cleanName(fileName: string): string {
  const base = fileName.split('/').pop() ?? fileName;
  return base.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type PlayMode = 'normal' | 'repeat-one' | 'shuffle';

interface TrackWithCache extends MusicTrack {
  cached: boolean;
  saving?: boolean;
}

export default function Home() {
  const [tracks, setTracks] = useState<TrackWithCache[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [playMode, setPlayMode] = useState<PlayMode>('normal');

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null;

  const loadTracks = useCallback(async () => {
    const [builtin, uploaded] = await Promise.all([
      getBuiltinTracks(),
      getAllTracks(),
    ]);
    const allRaw: MusicTrack[] = [
      ...builtin,
      // Uploaded tracks: dùng track.file nếu đã lưu, fallback reconstruct
      ...uploaded.map((t) => ({
        ...t,
        builtin: false,
        file: t.file ?? `/music/${t.name}`,
      })),
    ];
    const withCache: TrackWithCache[] = await Promise.all(
      allRaw.map(async (t) => ({
        ...t,
        cached: await isInCache(t.file ?? `/music/${t.name}`),
        saving: false,
      }))
    );
    setTracks(withCache);
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // ── Playback logic ──────────────────────────────────────────
  const playAt = useCallback((index: number) => {
    if (index < 0 || index >= tracks.length) return;
    setCurrentIndex(index);
  }, [tracks.length]);

  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    if (playMode === 'shuffle') {
      let next: number;
      do { next = Math.floor(Math.random() * tracks.length); }
      while (tracks.length > 1 && next === currentIndex);
      setCurrentIndex(next);
    } else {
      setCurrentIndex((i) => (i + 1) % tracks.length);
    }
  }, [tracks.length, playMode, currentIndex]);

  const handlePrev = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIndex((i) => (i - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  /** Gọi khi audio kết thúc — Player sẽ gọi callback này */
  const handleEnded = useCallback(() => {
    if (playMode === 'repeat-one') {
      // Player tự loop (loop attribute), không cần xử lý
      return;
    }
    handleNext();
  }, [playMode, handleNext]);

  const cyclePlayMode = () => {
    setPlayMode((m) => {
      if (m === 'normal') return 'repeat-one';
      if (m === 'repeat-one') return 'shuffle';
      return 'normal';
    });
  };

  // ── Save to device ──────────────────────────────────────────
  const handleSaveToDevice = async (track: TrackWithCache) => {
    const filePath = track.file ?? `/music/${track.name}`;
    setTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, saving: true } : t))
    );
    try {
      await saveBuiltinToCache(filePath);
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, cached: true, saving: false } : t))
      );
    } catch (err) {
      console.error('Lỗi lưu cache:', err);
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, saving: false } : t))
      );
    }
  };

  return (
    <div className={currentTrack ? 'pb-safe' : 'pb-8'} style={{ minHeight: '100dvh' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 glass border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)' }}
          >
            🎵
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
              TuneValt
            </h1>
            <p className="text-xs hidden sm:block" style={{ color: 'var(--muted)' }}>
              Nghe nhạc offline, lưu trên thiết bị
            </p>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <section>
          <UploadButton onUpload={loadTracks} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Thư viện
            </h2>
            {tracks.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                {tracks.length} bài
              </span>
            )}
          </div>

          {tracks.length === 0 ? (
            <div className="rounded-2xl px-6 py-12 text-center space-y-3" style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
              <div className="text-5xl">🎧</div>
              <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>
                Thư viện đang trống
              </p>
              <p className="text-xs sm:text-sm max-w-xs mx-auto" style={{ color: 'var(--muted)' }}>
                Thêm nhạc vào{' '}
                <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--surface-2)' }}>
                  public/music/
                </code>{' '}
                hoặc upload bên trên
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track, index) => {
                const isPlaying = currentIndex === index;
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl transition-colors duration-150 group"
                    style={{
                      background: isPlaying ? 'rgba(124, 58, 237, 0.15)' : 'var(--surface)',
                      border: isPlaying ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid var(--border)',
                    }}
                  >
                    {/* Index / play button */}
                    <button
                      onClick={() => playAt(index)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono flex-shrink-0 transition-all duration-150 active:scale-90"
                      style={{
                        background: isPlaying ? 'rgba(124,58,237,0.3)' : 'var(--surface-2)',
                        color: isPlaying ? 'var(--accent-light)' : 'var(--muted)',
                      }}
                      aria-label="Phát bài này"
                    >
                      {isPlaying ? (
                        <span className="text-lg leading-none">♪</span>
                      ) : (
                        <>
                          <span className="group-hover:hidden text-sm">{index + 1}</span>
                          <svg className="hidden group-hover:block w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7L8 5z" />
                          </svg>
                        </>
                      )}
                    </button>

                    {/* Track info */}
                    <button onClick={() => playAt(index)} className="min-w-0 flex-1 text-left">
                      <p
                        className="text-sm font-medium truncate leading-snug"
                        style={{ color: isPlaying ? 'var(--accent-light)' : 'var(--foreground)' }}
                      >
                        {cleanName(track.name)}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {formatSize(track.size) && (
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatSize(track.size)}</span>
                        )}
                        {track.builtin && (
                          <span className="text-xs px-1.5 py-px rounded" style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--accent-light)' }}>
                            có sẵn
                          </span>
                        )}
                        {track.cached && (
                          <span className="text-xs px-1.5 py-px rounded inline-flex items-center gap-1" style={{ background: 'rgba(5,150,105,0.2)', color: '#34d399' }}>
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            đã lưu
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Save button */}
                    {!track.cached && (
                      <button
                        onClick={() => handleSaveToDevice(track)}
                        disabled={track.saving}
                        className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50"
                        style={{ width: '42px', height: '42px', background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                        title="Lưu vào thiết bị để nghe offline"
                        aria-label="Lưu vào thiết bị"
                      >
                        {track.saving ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {currentTrack && (
        <Player
          trackName={currentTrack.name}
          filePath={currentTrack.file ?? `/music/${currentTrack.name}`}
          playMode={playMode}
          onEnded={handleEnded}
          onNext={handleNext}
          onPrev={handlePrev}
          onCycleMode={cyclePlayMode}
        />
      )}
    </div>
  );
}
