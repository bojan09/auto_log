// Copy only the files referenced by the offline shell, preserving relative URLs.
import {
  readFile,
  mkdir,
  rm,
  copyFile,
  writeFile,
  stat,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
const shell = await readFile("sw.js", "utf8");
const match = shell.match(/const ASSETS = (\[[\s\S]*?\]);/);
if (!match) throw Error("Missing offline asset manifest");
const paths = JSON.parse(match[1].replace(/,\s*\]/g, "]"))
  .filter((p) => p !== "./")
  .map((p) => p.replace(/^\.\//, ""));
paths.push("sw.js");
for (const path of paths)
  if (path.includes("..") || path.startsWith("/"))
    throw Error("Unsafe asset path");
await rm("dist", { recursive: true, force: true });
let bytes = 0;
for (const path of paths) {
  const output = resolve("dist", path);
  await mkdir(dirname(output), { recursive: true });
  await copyFile(path, output);
  bytes += (await stat(path)).size;
}
await writeFile("dist/.nojekyll", "");
console.log(`Release: ${paths.length} files, ${bytes} bytes. Output: dist/`);
