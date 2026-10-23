import type { Metadata } from "next";
import { InviteClient } from "./invite-client";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ from?: string }> };

const clean = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const code = clean((await params).code);
  const from = (await searchParams).from?.slice(0, 40);
  return {
    title: from ? `${from} invited you to Grip It` : "You're invited to Grip It",
    // Adding to the home screen from here installs an app that opens this invite (see the route).
    manifest: `/api/invite-manifest/${code}${from ? `?from=${encodeURIComponent(from)}` : ""}`,
  };
}

export default async function InvitePage({ params, searchParams }: Props) {
  const code = clean((await params).code);
  const from = (await searchParams).from?.slice(0, 40);
  return <InviteClient code={code} from={from} />;
}
