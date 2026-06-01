/// <reference lib="dom" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8080",
        //target: 'http://jagoz-backend:8080',
        changeOrigin: true,
        configure: (proxy: any) => {
          proxy.on("error", (_err: any, _req: any, res: any) => {
            console.log("error connection upstream")
            res.writeHead(502)
            res.end()
          })
          proxy.on("proxyRes", (proxyRes: any, _: any, res: any) => {
            const upstreamSocket = proxyRes.socket
            if(upstreamSocket) {
              upstreamSocket.once('close', () => {
                if(!res.writableFinished) {
                  console.log("destroying downstream")
                  res.destroy()
                }
              })
            }
          })
        },
      }
    }
  }
})
