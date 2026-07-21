import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const externalPackages = new Set([
  'react',
  'react-dom',
  'react/jsx-runtime',
  'ai',
  '@tanstack/react-virtual',
  'class-variance-authority',
  'clsx',
  'lucide-react',
  'radix-ui',
  'streamdown',
  'tailwind-merge',
])

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: {
        index: path.resolve(import.meta.dirname, 'src/index.ts'),
        surface: path.resolve(import.meta.dirname, 'src/entries/surface.ts'),
        composer: path.resolve(import.meta.dirname, 'src/entries/composer.ts'),
        messages: path.resolve(import.meta.dirname, 'src/entries/messages.ts'),
        markdown: path.resolve(import.meta.dirname, 'src/entries/markdown.ts'),
        utils: path.resolve(import.meta.dirname, 'src/entries/utils.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'styles',
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external(id) {
        // Bundle Streamdown's CSS into our single public stylesheet.
        if (id === 'streamdown/styles.css') return false

        return (
          externalPackages.has(id) ||
          [...externalPackages].some((pkg) => id.startsWith(`${pkg}/`))
        )
      },
    },
  },
})
