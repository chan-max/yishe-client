// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: false,
      // 禁用压缩混淆
      sourcemap: true
      // 生成sourcemap方便调试
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [vue()],
    server: {
      hmr: {
        port: 5173,
        // 指定HMR端口
        overlay: true
        // 显示错误覆盖层
      },
      watch: {
        usePolling: true,
        // 使用轮询监听文件变化
        interval: 1e3
        // 轮询间隔
      }
    },
    build: {
      sourcemap: true
      // 生成sourcemap
    }
  }
});
export {
  electron_vite_config_default as default
};
