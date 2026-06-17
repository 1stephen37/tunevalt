const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Bật cả trong production lẫn development để test offline
  disable: false,
  runtimeCaching: [
    // 1. App shell: Next.js pages + static assets (tự động bởi next-pwa precache)

    // 2. tracks.json — phải online lần đầu, sau đó dùng cache
    {
      urlPattern: /\/music\/tracks\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'tunevalt-meta',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 ngày
        },
      },
    },
    // 3. File nhạc — CacheFirst, lưu lâu dài
    {
      urlPattern: /\/music\/.*\.(mp3|wav|m4a|ogg|flac|aac)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tunevalt-audio',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 90, // 90 ngày
        },
        // Cho phép cache response có Content-Range (audio streaming)
        matchOptions: {
          ignoreVary: true,
        },
      },
    },
    // 4. Font + icon tĩnh
    {
      urlPattern: /\.(woff2?|ttf|eot|png|ico|svg)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tunevalt-static',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    // 5. Next.js chunks + JS
    {
      urlPattern: /\/_next\//i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tunevalt-nextjs',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
});
