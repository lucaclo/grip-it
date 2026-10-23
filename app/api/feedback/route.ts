import { put } from "@vercel/blob";
import { acceptedType, FEEDBACK_LIMITS, safeName, validateMeta } from "@/lib/feedback";

/**
 * Receives app feedback and stores it privately in Vercel Blob:
 *   feedback/<yyyy-mm-dd>-<clientId>/feedback.json  (the message and context)
 *   feedback/<yyyy-mm-dd>-<clientId>/<n>-<file>      (attachments)
 * Nothing here is public; read it with `npm run feedback`.
 */
export async function POST(req: Request) {
  const size = Number(req.headers.get("content-length") ?? 0);
  if (size > FEEDBACK_LIMITS.totalBytes + 64 * 1024) return bad("Attachments are too big. Try fewer or smaller files.", 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Couldn't read that. Try again.");
  }
  // Bots fill every field; people never see this one.
  if (form.get("website")) return Response.json({ ok: true });

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("meta") ?? ""));
  } catch {
    return bad("Bad request");
  }
  const meta = validateMeta(raw);
  if ("error" in meta) return bad(meta.error);

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > FEEDBACK_LIMITS.files) return bad(`Attach up to ${FEEDBACK_LIMITS.files} files`);
  if (files.some((f) => !acceptedType(f.type))) return bad("Attach images, PDFs or text files");
  if (files.reduce((a, f) => a + f.size, 0) > FEEDBACK_LIMITS.totalBytes) return bad("Attachments are too big. Try fewer or smaller files.", 413);

  const day = meta.createdAt.slice(0, 10).replace(/[^0-9-]/g, "") || new Date().toISOString().slice(0, 10);
  const base = `feedback/${day}-${meta.clientId}`;
  try {
    const attachments = await Promise.all(
      files.map(async (f, i) => {
        const pathname = `${base}/${i + 1}-${safeName(f.name)}`;
        await put(pathname, f, { access: "private", contentType: f.type, addRandomSuffix: false, allowOverwrite: true });
        return { name: f.name, type: f.type, bytes: f.size, pathname };
      }),
    );
    const record = { ...meta, attachments, receivedAt: new Date().toISOString() };
    await put(`${base}/feedback.json`, JSON.stringify(record, null, 2), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return Response.json({ ok: true, id: base });
  } catch (e) {
    console.error("feedback upload failed", e);
    return bad("Couldn't save right now. It's kept on your phone and will retry.", 503);
  }
}

function bad(error: string, status = 400) {
  return Response.json({ error }, { status });
}
