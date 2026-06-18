const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // tắt SW khi dev
  runtimeCaching: [
    // 1. Navigation (HTML pages) — NetworkFirst: luôn thử network trước,
    //    fallback về cache khi offline. Quan trọng nhất để trang load được offline.
    {
      urlPattern: /^https?.+/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'tunevalt-pages',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24, // 1 ngày
        },
        matchOptions: {
          ignoreVary: true,
        },
      },
    },
    // 2. tracks.json metadata
    {
      urlPattern: /\/music\/tracks\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'tunevalt-meta',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
    // 3. Audio files — CacheFirst sau khi đã được app cache thủ công
    {
      urlPattern: /\/music\/.*\.(mp3|wav|m4a|ogg|flac|aac)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tunevalt-audio',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 90,
        },
        matchOptions: {
          ignoreVary: true,
        },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
});
