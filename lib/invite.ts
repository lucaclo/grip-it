"use client";

/**
 * Invites. A link looks like https://…/invite/K7QMXA?from=Luca. If a friend installs the app from it,
 * the home-screen icon opens that same link (see app/invite/[code]), and the code waits here
 * through onboarding, then they join automatically. The code alone also works: Me → Join a group.
 */
const KEY = "gripit:invite";

export function inviteUrl(code: string, from?: string) {
  const q = from ? `?from=${encodeURIComponent(from)}` : "";
  return `${location.origin}/invite/${code}${q}`;
}

export const cleanCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

export const INVITE_EVENT = "gripit:invite";

/** Remembers the invite and tells the app, which joins as soon as there's a profile. */
export function savePendingInvite(code: string) {
  try {
    localStorage.setItem(KEY, cleanCode(code));
  } catch {}
  window.dispatchEvent(new Event(INVITE_EVENT));
}
export function pendingInvite(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
export function clearPendingInvite() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** Opens the share sheet with the invite link, or copies it where sharing isn't available. */
export async function shareInvite(code: string, groupName: string, from?: string): Promise<"shared" | "copied" | "cancelled"> {
  const url = inviteUrl(code, from);
  const text = `Join ${groupName} on Grip It and let's see who lifts more.`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "Join me on Grip It", text, url });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  await navigator.clipboard?.writeText(`${text} ${url}`);
  return "copied";
}
