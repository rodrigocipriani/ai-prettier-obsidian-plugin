import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  target: "es2016",
  logLevel: "info",
  sourcemap: "inline",
  treeShaking: true,
  outfile: "dist/main.js",
});

if (isProduction) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
