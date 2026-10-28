import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  // Workspace packages ship TypeScript source, which `node dist/index.js` can't
  // load, so they are bundled in. npm dependencies stay external.
  noExternal: [/^@repo\//],
  // Bundled CommonJS code (ws, dotenv…) calls require(), which ESM lacks.
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
});
