import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', '**/*.gltf', '**/*.glb', '**/*.mp3', '**/*.wav'],
            manifest: {
                name: 'NAZAR',
                short_name: 'NAZAR',
                description: 'A 2.5D Dystopian Puzzle-Platformer',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'fullscreen',
                orientation: 'landscape',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,gltf,glb,mp3,wav}'],
                runtimeCaching: [
                    {
                        urlPattern: /.*/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'nazar-assets',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ]
});
