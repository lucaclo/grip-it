import manifest from "@/app/manifest";

/**
 * The web app manifest for an invite page. Same app as /manifest.webmanifest, but its start_url is
 * the invite itself, so adding Grip It to the home screen from an invite opens straight into joining.
 */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const from = new URL(req.url).searchParams.get("from")?.slice(0, 40);
  const start = `/invite/${code}${from ? `?from=${encodeURIComponent(from)}` : ""}`;
  return Response.json({ ...manifest(), start_url: start }, { headers: { "content-type": "application/manifest+json" } });
}
