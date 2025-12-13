import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],

  manifest: {
    manifest_version: 3,
    name: "My Extension",
    version: "1.0.0",

    permissions: ["cookies", "tabs", "scripting", "activeTab", "runtime"],

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
        js: ["content.ts"],
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
