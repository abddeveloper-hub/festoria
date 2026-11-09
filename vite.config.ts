import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/festoria/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '::',
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
        superAdmin: resolve(import.meta.dirname, 'super-admin.html'),
        teamLeader: resolve(import.meta.dirname, 'team-leader.html'),
        participant: resolve(import.meta.dirname, 'participant.html'),
      },
    },
  },
})


