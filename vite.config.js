import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // LA SEULE LIGNE QUI TUE DÉFINITIVEMENT React DevTools + installHook.js.map
  // (méthode officielle utilisée par Create-React-App, Vite templates, Meta, etc.)
  define: {
    // Désactive React DevTools en remplaçant "global" par un objet vide AVANT que React ne charge
    global: {},
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
    sourcemapIgnoreList: () => true,
  },
})
















// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': {
//         target: 'http://localhost:3000',
//         changeOrigin: true, // Ajout pour éviter ECONNRESET/CORS
//         secure: false,
//         rewrite: (path) => path.replace(/^\/api/, '/api') // Garde /api intact
//       }
//     }
//   }
// })









