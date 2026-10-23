// Downloads app feedback from the private Vercel Blob store into feedback-inbox/ (git-ignored)
// and prints a summary, newest first. Run: npm run feedback  (needs `vercel env pull` once).
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { get, list } from "@vercel/blob";

const OUT = path.resolve("feedback-inbox");

async function all(prefix) {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

const blobs = await all("feedback/");
let fresh = 0;
for (const b of blobs) {
  const file = path.join(OUT, b.pathname.replace(/^feedback\//, ""));
  if (existsSync(file)) continue;
  const res = await get(b.pathname, { access: "private" });
  if (!res || res.statusCode !== 200) continue;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(await new Response(res.stream).arrayBuffer()));
  fresh++;
}

const dirs = existsSync(OUT) ? (await readdir(OUT)).sort().reverse() : [];
console.log(`${dirs.length} feedback item(s), ${fresh} new file(s) downloaded to feedback-inbox/\n`);
for (const d of dirs) {
  const f = path.join(OUT, d, "feedback.json");
  if (!existsSync(f)) continue;
  const r = JSON.parse(await readFile(f, "utf8"));
  console.log(`${r.createdAt.slice(0, 16).replace("T", " ")}  [${r.kind}]  from ${r.from}  (${d})`);
  console.log(`  ${r.text.replace(/\n/g, "\n  ")}`);
  for (const a of r.attachments ?? []) console.log(`  📎 ${path.join("feedback-inbox", d, path.basename(a.pathname))}`);
  console.log(`  screen ${r.context?.screen ?? "?"} · build ${r.context?.build ?? "?"} · opened from ${r.context?.from ?? "?"}\n`);
}
