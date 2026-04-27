import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

const rawPort = process.env.PORT;
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;
if (!basePath) {
  throw new Error("BASE_PATH environment variable is required but was not provided.");
}

const root = path.resolve(import.meta.dirname);

function collectHtmlFiles(dir: string, baseDir: string): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist" || entry.name === "public") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(inputs, collectHtmlFiles(full, baseDir));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const rel = path.relative(baseDir, full).replace(/\\/g, "/").replace(/\.html$/, "").replace(/\//g, "_");
      inputs[rel] = full;
    }
  }
  return inputs;
}

export default defineConfig({
  base: basePath,
  root,
  publicDir: "public",
  build: {
    outDir: path.resolve(root, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: collectHtmlFiles(root, root),
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
