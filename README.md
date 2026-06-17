# 🎵 Offline Music Player - Next.js PWA

Một ứng dụng web nghe nhạc **hoàn toàn offline** trên điện thoại, được xây dựng bằng **Next.js 14+** và chạy như một Progressive Web App (PWA).

Người dùng có thể upload nhạc từ điện thoại và nghe ngay cả khi **không có mạng WiFi/Internet**.

---

## ✨ Tính năng chính

- Upload nhiều file nhạc (MP3, WAV, M4A,...)
- Nghe nhạc **hoàn toàn offline** (sau khi upload)
- Cache nhạc bằng Service Worker + Cache API
- Giao diện đẹp, thân thiện với mobile
- Hỗ trợ **Add to Home Screen** (chạy như app thật)
- Lưu metadata bài hát bằng IndexedDB
- Playlist cá nhân
- Tự động cache tất cả bài hát đã upload

---

## 🛠 Công nghệ sử dụng

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **next-pwa** (Service Worker & PWA)
- **Cache API** + **IndexedDB**
- **HTML5 Audio**
- **jsmediatags** (đọc metadata bài hát - tùy chọn)

---

## 📋 Yêu cầu

- Node.js ≥ 18
- npm hoặc yarn

---

## 🚀 Cài đặt và Chạy dự án

### 1. Clone dự án

```bash
git clone <url-dự-án>
cd offline-music-player