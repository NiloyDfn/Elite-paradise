// Bundle the server with esbuild into dist/index.js (node_modules stay external
// and are installed on the host).
import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  packages: "external",
  format: "esm",
  outfile: "dist/index.js",
  // `npm start` runs in production mode without needing NODE_ENV on Windows too.
  banner: { js: 'process.env.NODE_ENV ??= "production";' },
  logLevel: "info",
});
