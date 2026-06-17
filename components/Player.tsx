'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getPlayUrl } from '@/lib/cache';
import type { PlayMode } from '@/app/page';

function formatTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function cleanName(fileName: string): string {
  const base = fileName.split('/').pop() ?? fileName;
  return base.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

interface PlayerProps {
  trackName: string;
  filePath: string;
  playMode: PlayMode;
  onEnded: () => void;
  onNext: () => void;
  onPrev: () => void;
  onCycleMode: () => void;
}

// ── SVG Icons ────────────────────────────────────────────────

function IconPrev({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  );
}

function IconNext({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z" />
    </svg>
  );
}

function IconPlay({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function IconPause({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function IconSpin({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} className="animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function IconRepeat({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
  );
}

function IconRepeatOne({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
    </svg>
  );
}

function IconShuffle({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
    </svg>
  );
}

function IconVolumeLow({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.5 12A4.5 4.5 0 0016 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
    </svg>
  );
}

function IconVolumeHigh({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

// ── Player Component ──────────────────────────────────────────

export default function Player({
  trackName,
  filePath,
  playMode,
  onEnded,
  onNext,
  onPrev,
  onCycleMode,
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = '';
    setLoading(true);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    async function load() {
      const url = await getPlayUrl(filePath);
      if (url.startsWith('blob:')) objectUrl = url;
      setAudioUrl(url);
      setLoading(false);
    }
    load();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [filePath]);

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  }, [playing]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (audioRef.current) audioRef.current.volume = v;
    setVolume(v);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const modeActive = playMode !== 'normal';
  const ModeIcon = playMode === 'repeat-one' ? IconRepeatOne : playMode === 'shuffle' ? IconShuffle : IconRepeat;
  const modeLabel = playMode === 'normal' ? 'Tuần tự' : playMode === 'repeat-one' ? 'Lặp 1 bài' : 'Ngẫu nhiên';

  // Shared button styles
  const btnSec = {
    color: 'var(--muted)',
    background: 'transparent',
  } as React.CSSProperties;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 glass border-t safe-bottom"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Thin progress strip */}
      <div className="w-full h-1" style={{ background: 'var(--border)' }}>
        <div
          className="h-full transition-all duration-100"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
        />
      </div>

      {/* ── MOBILE layout (< sm) ── */}
      <div className="sm:hidden px-4 pt-3 pb-2">
        {/* Row 1: art + title + mode */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)' }}
          >
            🎵
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {cleanName(trackName)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {loading ? 'Đang tải…' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </p>
          </div>
          {/* Mode button — top right */}
          <button
            onClick={onCycleMode}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ color: modeActive ? 'var(--accent-light)' : 'var(--muted)', background: modeActive ? 'rgba(124,58,237,0.15)' : 'var(--surface-2)' }}
            aria-label={modeLabel}
            title={modeLabel}
          >
            <ModeIcon size={20} />
          </button>
        </div>

        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full mb-3"
          style={{ background: `linear-gradient(to right, #7c3aed ${progress}%, var(--border) ${progress}%)` }}
          aria-label="Tiến trình phát"
        />

        {/* Row 2: prev | play | next */}
        <div className="flex items-center justify-center gap-6 pb-1">
          <button
            onClick={onPrev}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={btnSec}
            aria-label="Bài trước"
          >
            <IconPrev size={24} />
          </button>

          <button
            onClick={togglePlay}
            disabled={loading || !audioUrl}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
            }}
            aria-label={playing ? 'Dừng' : 'Phát'}
          >
            {loading ? <IconSpin size={26} /> : playing ? <IconPause size={26} /> : <IconPlay size={26} />}
          </button>

          <button
            onClick={onNext}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={btnSec}
            aria-label="Bài tiếp"
          >
            <IconNext size={24} />
          </button>
        </div>
      </div>

      {/* ── DESKTOP layout (sm+) ── */}
      <div className="hidden sm:block max-w-3xl mx-auto px-6 py-4">
        {/* Seek bar — full width top */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs tabular-nums w-10 text-right flex-shrink-0" style={{ color: 'var(--muted)' }}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1"
            style={{ background: `linear-gradient(to right, #7c3aed ${progress}%, var(--border) ${progress}%)` }}
            aria-label="Tiến trình phát"
          />
          <span className="text-xs tabular-nums w-10 flex-shrink-0" style={{ color: 'var(--muted)' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-4">
          {/* Art + title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)' }}
            >
              🎵
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {cleanName(trackName)}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {loading ? 'Đang tải…' : formatTime(duration)}
              </p>
            </div>
          </div>

          {/* Center: prev | play | next */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onPrev}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 hover:opacity-80"
              style={btnSec}
              aria-label="Bài trước"
            >
              <IconPrev size={22} />
            </button>

            <button
              onClick={togglePlay}
              disabled={loading || !audioUrl}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
                boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
              }}
              aria-label={playing ? 'Dừng' : 'Phát'}
            >
              {loading ? <IconSpin size={24} /> : playing ? <IconPause size={24} /> : <IconPlay size={24} />}
            </button>

            <button
              onClick={onNext}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 hover:opacity-80"
              style={btnSec}
              aria-label="Bài tiếp"
            >
              <IconNext size={22} />
            </button>
          </div>

          {/* Right: mode + volume */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Mode */}
            <button
              onClick={onCycleMode}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 hover:opacity-80"
              style={{ color: modeActive ? 'var(--accent-light)' : 'var(--muted)', background: modeActive ? 'rgba(124,58,237,0.15)' : 'transparent' }}
              title={modeLabel}
              aria-label={modeLabel}
            >
              <ModeIcon size={20} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--muted)' }}>
                {volume < 0.5 ? <IconVolumeLow size={18} /> : <IconVolumeHigh size={18} />}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolume}
                className="w-24"
                style={{ background: `linear-gradient(to right, #7c3aed ${volume * 100}%, var(--border) ${volume * 100}%)` }}
                aria-label="Âm lượng"
              />
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        loop={playMode === 'repeat-one'}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => { setPlaying(false); onEnded(); }}
        className="hidden"
      />
    </div>
  );
}
