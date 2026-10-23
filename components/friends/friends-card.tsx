"use client";

import { Check, Copy, Loader2, LogOut, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useStore } from "@/lib/data/store";
import { cleanCode, shareInvite } from "@/lib/invite";
import { createGroup, joinGroup, leaveGroup, SyncError } from "@/lib/sync";

const message = (e: unknown) => (e instanceof SyncError ? e.message : "Something went wrong. Try again.");

/**
 * Friends, in as few taps as possible. No group yet: "Invite friends" makes your group and opens the
 * share sheet in one go. In a group: share the link again, see the code, or leave (on Me).
 */
export function FriendsCard({ manage = false }: { manage?: boolean }) {
  const me = useStore((s) => s.me);
  const group = useStore((s) => s.account?.group ?? null);
  const members = useStore((s) => s.friends.length + 1);
  const [busy, setBusy] = useState<null | "invite" | "join" | "leave">(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  async function invite() {
    setBusy("invite");
    setError(null);
    setNote(null);
    try {
      const g = group ?? (await createGroup());
      const r = await shareInvite(g.inviteCode, g.name, me?.name);
      if (r === "copied") setNote("Invite link copied. Paste it to your friends.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(null);
    }
  }

  async function join() {
    setBusy("join");
    setError(null);
    try {
      await joinGroup(code);
      setJoinOpen(false);
      setCode("");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card rounded-lg p-4" aria-label="Friends">
      {group ? (
        <div className="flex items-center gap-3">
          <Users aria-hidden className="size-6 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{group.name}</p>
            <p className="text-sm text-muted">
              {members} member{members === 1 ? "" : "s"} · code{" "}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(group.inviteCode);
                  setCopied(true);
                }}
                className="inline-flex min-h-9 items-center gap-1 font-semibold tracking-[0.08em] text-text"
                aria-label={`Invite code ${group.inviteCode.split("").join(" ")}. Tap to copy`}
              >
                {group.inviteCode}
                {copied ? <Check aria-hidden className="size-3.5 text-success" /> : <Copy aria-hidden className="size-3.5 text-subtle" />}
              </button>
            </p>
          </div>
          <Button size="sm" onClick={invite} disabled={!!busy} className="min-h-11 shrink-0">
            {busy === "invite" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <UserPlus aria-hidden className="size-4" />}
            Invite
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Users aria-hidden className="size-6 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Compete with friends</p>
            <button type="button" onClick={() => setJoinOpen(true)} className="-my-2 min-h-11 text-left text-[0.8125rem] text-accent">
              Got a code? Join a group
            </button>
          </div>
          <Button size="sm" onClick={invite} disabled={!!busy || !me} className="min-h-11 shrink-0">
            {busy === "invite" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <UserPlus aria-hidden className="size-4" />}
            Invite
          </Button>
        </div>
      )}

      {manage && group && (
        <div className="mt-3 flex justify-between border-t border-border pt-2">
          <button type="button" onClick={() => setJoinOpen(true)} className="min-h-11 text-sm text-accent">
            Join a different group
          </button>
          <button type="button" onClick={() => setLeaveOpen(true)} className="flex min-h-11 items-center gap-1.5 text-sm text-subtle">
            <LogOut aria-hidden className="size-4" /> Leave
          </button>
        </div>
      )}

      {(error || note) && (
        <p role={error ? "alert" : "status"} className={`mt-2 text-sm ${error ? "text-danger" : "text-success"}`}>
          {error ?? note}
        </p>
      )}

      <Sheet open={joinOpen} onClose={() => setJoinOpen(false)} title="Join a group">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) join();
          }}
        >
          <label htmlFor="invite-code" className="text-sm text-muted">
            Enter the 6-character code from your invite.{group ? ` You'll leave ${group.name}.` : ""}
          </label>
          <input
            id="invite-code"
            value={code}
            onChange={(e) => setCode(cleanCode(e.target.value))}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="K7QMXA"
            data-autofocus
            className="min-h-14 rounded-md border border-border-input bg-bg px-3 text-center font-display text-3xl font-semibold tracking-[0.3em] uppercase outline-none placeholder:text-subtle/50 focus:border-focus"
          />
          {error && joinOpen && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" disabled={code.length !== 6 || busy === "join"}>
            {busy === "join" ? <Loader2 aria-hidden className="size-5 animate-spin" /> : null} Join
          </Button>
        </form>
      </Sheet>

      <Sheet open={leaveOpen} onClose={() => setLeaveOpen(false)} title={`Leave ${group?.name ?? "group"}?`}>
        <div className="flex flex-col gap-3">
          <p className="text-muted">You&apos;ll stop seeing their workouts and they&apos;ll stop seeing yours. Your own workouts stay on your phone.</p>
          <Button
            variant="danger"
            size="lg"
            disabled={busy === "leave"}
            onClick={async () => {
              setBusy("leave");
              try {
                await leaveGroup();
                setLeaveOpen(false);
              } catch (e) {
                setError(message(e));
              } finally {
                setBusy(null);
              }
            }}
          >
            Leave group
          </Button>
          <Button variant="secondary" onClick={() => setLeaveOpen(false)}>
            Stay
          </Button>
        </div>
      </Sheet>
    </section>
  );
}
