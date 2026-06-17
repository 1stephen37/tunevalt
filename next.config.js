const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /\.(mp3|wav|m4a|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'music-cache',
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 ngày
        },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
});