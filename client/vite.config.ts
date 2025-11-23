// file: client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'dns'

// 【核心修复】强制 Node.js 优先解析 IPv4
// 这行代码能直接消灭 Windows 下 localhost 解析造成的 300ms 延迟
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // 忽略旧版 Node 不支持此方法的错误
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // 强制绑定 IPv4
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // 目标后端
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})