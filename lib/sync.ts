"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { exerciseMap, liftedKg, myDots } from "@/lib/data/selectors";
import { useStore } from "@/lib/data/store";
import type { Exercise } from "@/lib/data/exercises";
import type { Friend, Group, State, Workout } from "@/lib/data/types";
import type { Muscle } from "@/lib/science/volume";

/**
 * Friends sync. Local-first: everything is saved on the phone and works offline; this uploads your
 * workouts and downloads your group's. Accounts are made silently (Supabase anonymous sign-in) the
 * first time you invite or join, so nobody types an email or a password.
 *
 * What leaves the phone: your name, goal, sessions-per-week, powerlifting score, and your workouts
 * (sets, weights, reps). Never your body weight, height, age, food or body fat.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient | null {
  if (!URL || !KEY || typeof window === "undefined") return null;
  client ??= createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "gripit-auth" },
  });
  return client;
}
export const syncAvailable = () => !!URL && !!KEY;

/** Friendly words for anything that can go wrong. */
export class SyncError extends Error {}
const offline = () => typeof navigator !== "undefined" && !navigator.onLine;

/** Signs this phone in (silently, the first time) and returns the user id. */
async function session(): Promise<string> {
  const sb = supabase();
  if (!sb) throw new SyncError("Friends aren't switched on for this app yet.");
  if (offline()) throw new SyncError("No signal. Try again when you're online.");
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signed, error } = await sb.auth.signInAnonymously();
  if (error || !signed.user) throw new SyncError("Couldn't connect. Try again in a moment.");
  return signed.user.id;
}

async function pushProfile(sb: SupabaseClient, userId: string, s: State) {
  if (!s.me) return;
  const { error } = await sb.from("profiles").upsert({
    id: userId,
    display_name: s.me.name.trim().slice(0, 40) || "Lifter",
    goal: s.me.goal,
    experience: s.me.experience,
    sessions_per_week: s.me.sessionsPerWeek,
    dots_score: myDots(s),
  });
  if (error) throw new SyncError("Couldn't save your profile.");
}

type GroupRow = { id: string; name: string; invite_code: string; role: "owner" | "member" };
const toGroup = (g: GroupRow | undefined | null): Group | null =>
  g ? { id: g.id, name: g.name, inviteCode: g.invite_code, role: g.role } : null;

/** Makes sure this phone has an account and a profile; returns the user id. */
async function ensureAccount(): Promise<string> {
  const sb = supabase()!;
  const userId = await session();
  const s = useStore.getState();
  await pushProfile(sb, userId, s);
  if (!s.account || s.account.userId !== userId) useStore.getState().setAccount({ userId, group: s.account?.group ?? null });
  return userId;
}

/** Creates your group (named after you) and returns it. Leaves any other group. */
export async function createGroup(name?: string): Promise<Group> {
  await ensureAccount();
  const me = useStore.getState().me;
  const { data, error } = await supabase()!.rpc("create_group", { group_name: name ?? `${me?.name ?? "My"}'s crew` });
  if (error || !data?.[0]) throw new SyncError("Couldn't create your group. Try again.");
  const group = toGroup(data[0])!;
  useStore.getState().setAccount({ ...useStore.getState().account!, group });
  await syncNow();
  return group;
}

/** Joins a group by its 6-character code (leaving any other group). */
export async function joinGroup(code: string): Promise<Group> {
  await ensureAccount();
  const { data, error } = await supabase()!.rpc("join_group", { code });
  if (error) throw new SyncError(/invalid_invite/.test(error.message) ? "That invite code doesn't exist. Check it and try again." : "Couldn't join. Try again.");
  const group = toGroup(data?.[0])!;
  useStore.getState().setAccount({ ...useStore.getState().account!, group });
  await syncNow();
  return group;
}

export async function leaveGroup() {
  const s = useStore.getState();
  const sb = supabase();
  if (!sb || !s.account?.group) return;
  await session();
  const { error } = await sb.from("group_members").delete().eq("group_id", s.account.group.id).eq("user_id", s.account.userId);
  if (error) throw new SyncError("Couldn't leave the group. Try again.");
  s.setAccount({ ...s.account, group: null });
  s.applyGroupData({ friends: [], workouts: [], exercises: [], groupName: "Grip It crew" });
}

function payload(s: State, w: Workout) {
  const ex = exerciseMap(s);
  return {
    key: w.id,
    title: w.title,
    started_at: w.startedAt,
    ended_at: w.endedAt,
    is_private: w.isPrivate,
    lifted_kg: liftedKg(s, w),
    exercises: w.exercises
      .map((e) => ({ e, def: ex.get(e.exerciseId) }))
      .filter((x) => x.def)
      .map(({ e, def }) => ({
        key: e.exerciseId,
        custom: !!def!.custom,
        name: def!.name,
        primary: def!.primary,
        secondary: def!.secondary,
        equipment: def!.equipment,
        grip: e.grip ?? null,
        sets: e.sets.map((x) => ({ kg: x.kg, reps: x.reps, rir: x.rir, type: x.type })),
      })),
  };
}

async function pushQueue(sb: SupabaseClient) {
  const s = useStore.getState();
  const done: { upserts: string[]; deletes: string[] } = { upserts: [], deletes: [] };
  for (const id of s.syncQueue.upserts) {
    const w = s.workouts.find((x) => x.id === id && x.userId === "me");
    if (!w) {
      done.upserts.push(id);
      continue;
    }
    const { error } = await sb.rpc("save_workout", { payload: payload(s, w) });
    if (error) break;
    done.upserts.push(id);
  }
  for (const id of s.syncQueue.deletes) {
    const { error } = await sb.rpc("delete_workout", { key: id });
    if (error) break;
    done.deletes.push(id);
  }
  useStore.getState().synced(done);
}

type RemoteWorkout = {
  id: string;
  user_id: string;
  title: string;
  started_at: string;
  ended_at: string;
  is_private: boolean;
  lifted_kg: number;
  workout_exercises: {
    position: number;
    /** Present once migration 0003 is applied. */
    grip?: string | null;
    exercises: { client_key: string; name: string; primary_muscle: string; secondary_muscles: string[]; equipment: string; created_by: string | null };
    sets: { position: number; kg: number; reps: number; rir: number | null; set_type: string }[];
  }[];
};

async function pull(sb: SupabaseClient, userId: string) {
  const { data: g } = await sb.rpc("my_group");
  const group = toGroup(g?.[0]);
  const st = useStore.getState();
  st.setAccount({ userId, group, lastSyncAt: new Date().toISOString() });
  if (!group) return;

  const { data: members } = await sb
    .from("group_members")
    .select("user_id, profiles(display_name, sessions_per_week, dots_score)")
    .eq("group_id", group.id);
  const friends: Friend[] = (members ?? [])
    .filter((m) => m.user_id !== userId)
    .map((m) => {
      const p = (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as
        | { display_name: string; sessions_per_week: number; dots_score: number | null }
        | null;
      return {
        id: m.user_id,
        name: p?.display_name ?? "Friend",
        weightKg: null,
        sessionsPerWeek: p?.sessions_per_week ?? 3,
        dots: p?.dots_score == null ? null : Number(p.dots_score),
      };
    });

  const since = new Date(Date.now() - 180 * 86_400_000).toISOString();
  const ids = friends.map((f) => f.id);
  const fetchWorkouts = (gripColumn: boolean) =>
    sb
      .from("workouts")
      .select(
        `id, user_id, title, started_at, ended_at, is_private, lifted_kg, workout_exercises(position, ${gripColumn ? "grip, " : ""}exercises(client_key, name, primary_muscle, secondary_muscles, equipment, created_by), sets(position, kg, reps, rir, set_type))`,
      )
      .in("user_id", ids)
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(1000);
  let rows: unknown[] | null = [];
  if (ids.length) {
    // A database without migration 0003 has no grip column yet: fall back to fetching without it.
    const first = await fetchWorkouts(true);
    rows = first.error ? (await fetchWorkouts(false)).data : first.data;
  }

  const exercises = new Map<string, Exercise>();
  const workouts: Workout[] = ((rows ?? []) as unknown as RemoteWorkout[]).map((w) => ({
    id: w.id,
    userId: w.user_id,
    title: w.title,
    startedAt: w.started_at,
    endedAt: w.ended_at,
    isPrivate: w.is_private,
    liftedKg: w.lifted_kg,
    exercises: [...w.workout_exercises]
      .sort((a, b) => a.position - b.position)
      .map((we) => {
        const e = we.exercises;
        if (e.created_by)
          exercises.set(e.client_key, {
            id: e.client_key,
            name: e.name,
            primary: e.primary_muscle as Muscle,
            secondary: e.secondary_muscles as Muscle[],
            equipment: e.equipment as Exercise["equipment"],
            custom: true,
          });
        return {
          exerciseId: e.client_key,
          ...(we.grip ? { grip: we.grip } : {}),
          sets: [...we.sets]
            .sort((a, b) => a.position - b.position)
            .map((x) => ({ kg: Number(x.kg), reps: x.reps, rir: x.rir, type: x.set_type as Workout["exercises"][number]["sets"][number]["type"] })),
        };
      }),
  }));
  useStore.getState().applyGroupData({ friends, workouts, exercises: [...exercises.values()], groupName: group.name });
}

let running: Promise<void> | null = null;

/** Upload pending workouts and download the group's. Safe to call often; quiet when offline. */
export function syncNow(): Promise<void> {
  if (running) return running;
  running = (async () => {
    const sb = supabase();
    const s = useStore.getState();
    if (!sb || !s.account || !s.me || offline()) return;
    try {
      const userId = await session();
      await pushProfile(sb, userId, s);
      await pushQueue(sb);
      await pull(sb, userId);
    } catch {
      // Network trouble: everything stays queued on the phone and retries next time.
    }
  })().finally(() => {
    running = null;
  });
  return running;
}
