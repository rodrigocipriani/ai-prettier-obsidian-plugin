import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.argv[2] === "production";

async function start() {
  const ctx = await esbuild.context({
    entryPoints: [path.join(__dirname, "..", "src", "main.ts")],
    bundle: true,
    platform: "node",
    target: "es2017",
    outfile: path.join(__dirname, "..", "main.js"),
    external: ["obsidian"],
  });

  if (!isProduction) {
    await ctx.watch(); // Enable watch mode during development
    console.log("Watching for changes...");
  }

  await ctx.rebuild(); // Initial build
}

start();
