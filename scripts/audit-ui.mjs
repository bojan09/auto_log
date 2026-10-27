import { readFile, readdir, stat } from "node:fs/promises";
import assert from "node:assert/strict";
const html = await readFile("index.html", "utf8"),
  worker = await readFile("sw.js", "utf8");
for (const old of ["style", "controls", "reference", "forms"]) {
  assert(
    !html.includes(`src/${old}.css`) && !worker.includes(`src/${old}.css`),
    `Legacy CSS reference: ${old}`,
  );
  await assert.rejects(stat(`src/${old}.css`));
}
const files = await readdir("src/design");
let total = 0;
const css = [];
for (const f of files) {
  const text = await readFile("src/design/" + f, "utf8");
  assert(html.includes("src/design/" + f));
  assert(worker.includes("./src/design/" + f));
  assert(
    !/@import|!important.*!important|box-shadow|backdrop-filter/.test(text),
  );
  total += Buffer.byteLength(text);
  css.push(text);
}
const source =
  (
    await Promise.all(
      (await readdir("src"))
        .filter((f) => f.endsWith(".js"))
        .map((f) => readFile("src/" + f, "utf8")),
    )
  ).join("\n") + html;
const candidates = [
  ...new Set(
    css
      .join("\n")
      .matchAll(/\.([a-z][a-z0-9-]*)/g)
      .map((m) => m[1]),
  ),
].filter((c) => !["css", "woff2"].includes(c) && !source.includes(c));
assert.deepEqual(
  candidates,
  [],
  "Class selector without a source reference; inspect before retaining",
);
console.log(
  `PASS six explicit stylesheet owners, no legacy CSS/imports, static class-reference audit; ${total} CSS bytes`,
);
