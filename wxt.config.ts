import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],

  manifest: {
    manifest_version: 3,
    name: "BYOK AI Code Reviewer Extension",
    version: "1.0.0",

    permissions: ["cookies", "tabs", "scripting", "activeTab", "notifications"],
    host_permissions: ["http://*/*", "https://*/*"],

    background: {
      service_worker: "background.ts",
      type: "module",
    },

    action: {
      default_popup: "popup/index.html",
    },

    content_scripts: [
      {
        matches: [
          "*://*.github.com/*",
          "*://*.chatgpt.com/*",
          "*://gemini.google.com/*",
          "https://byok-ai-code-reviewer.vercel.app/*",
        ],
        js: ["content-scripts/github.js"],
      },
    ],
  },

  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
  }),
});
