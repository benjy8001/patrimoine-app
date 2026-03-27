import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    root: '.',
    build: {
        outDir: 'public/build',
        emptyOutDir: true,
        manifest: 'manifest.json',
        rollupOptions: {
            input: [
                'resources/js/main.tsx',
                'resources/css/app.css',
            ],
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./resources/js/test/setup.ts'],
    },
})
