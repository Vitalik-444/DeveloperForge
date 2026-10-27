import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/eporner": {
        target: "https://www.eporner.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eporner/, "/api/v2"),
      },
      "/api/pornhub": {
        target: "https://www.pornhub.com",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api\/pornhub/, "/webmasters"),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Referer: "https://www.pornhub.com/",
          Cookie:
            "accessAgeDisclaimerPH=1; accessAgeDisclaimerUK=1; accessAgeDisclaimerUS=1; platform=pc; hasVisited=1; age_verified=1; has_access=1",
        },
      },
    },
  },
  preview: {
    proxy: {
      "/api/eporner": {
        target: "https://www.eporner.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eporner/, "/api/v2"),
      },
      "/api/pornhub": {
        target: "https://www.pornhub.com",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api\/pornhub/, "/webmasters"),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Referer: "https://www.pornhub.com/",
          Cookie:
            "accessAgeDisclaimerPH=1; accessAgeDisclaimerUK=1; accessAgeDisclaimerUS=1; platform=pc; hasVisited=1; age_verified=1; has_access=1",
        },
      },
    },
  },
});
