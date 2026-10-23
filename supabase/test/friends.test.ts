import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Each query runs as the "authenticated" role with a given user id, the way Supabase runs browser
// requests, so row level security is what decides what comes back.
const db = new Client({ connectionString: process.env.DB_TEST_URL });
const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const C = "00000000-0000-0000-0000-00000000000c"; // not in the group

async function as<T = Record<string, unknown>>(user: string | null, sql: string, params: unknown[] = []): Promise<T[]> {
  await db.query("begin");
  try {
    await db.query(`set local role ${user ? "authenticated" : "anon"}`);
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? ""]);
    const r = await db.query(sql, params);
    await db.query("commit");
    return r.rows as T[];
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

const workout = (key: string, extra: Record<string, unknown> = {}) => ({
  key,
  title: "Push",
  started_at: "2026-10-21T10:00:00Z",
  ended_at: "2026-10-21T11:00:00Z",
  is_private: false,
  lifted_kg: 1100,
  exercises: [
    { key: "bench-press", name: "Bench press", primary: "chest", secondary: ["triceps"], equipment: "barbell", sets: [{ kg: 27.5, reps: 20, rir: 2, type: "normal" }, { kg: 27.5, reps: 20, rir: null, type: "normal" }] },
    { key: "custom-abc", custom: true, name: "Landmine press", primary: "front_delts", secondary: [], equipment: "barbell", sets: [{ kg: 20, reps: 10, rir: null, type: "normal" }] },
  ],
  ...extra,
});

beforeAll(async () => {
  await db.connect();
  await db.query("insert into auth.users (id) values ($1), ($2), ($3)", [A, B, C]);
  for (const [id, name] of [[A, "Luca"], [B, "Sam"], [C, "Stranger"]])
    await as(id, "insert into profiles (id, display_name) values ($1, $2)", [id, name]);
});
afterAll(() => db.end());

describe("friends", () => {
  let code = "";

  it("creating a group makes you its owner with a 6-character code", async () => {
    const [g] = await as<{ invite_code: string; role: string; name: string }>(A, "select * from create_group('Luca''s crew')");
    expect(g.role).toBe("owner");
    expect(g.invite_code).toMatch(/^[A-HJ-KM-NP-Z2-9]{6}$/);
    code = g.invite_code;
  });

  it("joining by code works with any case and spaces; a wrong code is refused", async () => {
    const [g] = await as<{ name: string; role: string }>(B, "select * from join_group($1)", [` ${code.toLowerCase().slice(0, 3)} ${code.slice(3)} `]);
    expect(g).toMatchObject({ name: "Luca's crew", role: "member" });
    await expect(as(C, "select * from join_group('ZZZZZZ')")).rejects.toThrow(/invalid_invite/);
  });

  it("saving is idempotent and keeps half kilos and high reps", async () => {
    await as(A, "select save_workout($1)", [workout("w1")]);
    await as(A, "select save_workout($1)", [workout("w1", { title: "Push day" })]);
    const rows = await as<{ title: string; n: string }>(A, "select title, (select count(*) from workout_exercises we where we.workout_id = w.id) n from workouts w");
    expect(rows).toEqual([{ title: "Push day", n: "2" }]);
    const sets = await as<{ kg: string; reps: number }>(A, "select kg, reps from sets order by position limit 1");
    expect(sets[0]).toEqual({ kg: "27.50", reps: 20 });
  });

  it("group-mates see your workouts, sets and custom exercises; strangers see nothing", async () => {
    expect(await as(B, "select title from workouts")).toEqual([{ title: "Push day" }]);
    expect((await as(B, "select * from sets")).length).toBe(3);
    expect((await as(B, "select name from exercises where created_by is not null")).map((r) => r.name)).toEqual(["Landmine press"]);
    expect((await as(B, "select display_name from profiles order by display_name")).map((r) => r.display_name)).toEqual(["Luca", "Sam"]);
    expect(await as(C, "select * from workouts")).toEqual([]);
    expect(await as(C, "select * from sets")).toEqual([]);
    expect((await as(C, "select display_name from profiles")).map((r) => r.display_name)).toEqual(["Stranger"]);
  });

  it("grips are saved and shared; a malformed grip is dropped, not rejected", async () => {
    const base = workout("wg");
    const w = { ...base, exercises: [{ ...base.exercises[0], grip: "close" }, { ...base.exercises[1], grip: "DROP TABLE" }] };
    await as(A, "select save_workout($1)", [w]);
    const rows = await as<{ grip: string | null }>(
      B,
      "select we.grip from workout_exercises we join workouts w on w.id = we.workout_id where w.client_key = 'wg' order by we.position",
    );
    expect(rows).toEqual([{ grip: "close" }, { grip: null }]);
    await as(A, "select delete_workout('wg')");
  });

  it("private workouts stay private", async () => {
    await as(A, "select save_workout($1)", [workout("w2", { is_private: true })]);
    expect((await as(B, "select client_key from workouts")).map((r) => r.client_key)).toEqual(["w1"]);
    expect((await as(A, "select client_key from workouts order by client_key")).length).toBe(2);
  });

  it("nobody can write or delete someone else's workouts", async () => {
    await expect(as(B, "update workouts set title = 'hacked'")).rejects.toThrow();
    await as(B, "select delete_workout('w1')");
    expect((await as(A, "select client_key from workouts where client_key = 'w1'")).length).toBe(1);
    await expect(as(B, "insert into profiles (id, display_name) values ($1, 'x')", [A])).rejects.toThrow();
  });

  it("signed-out requests get nothing and can't call the functions", async () => {
    await expect(as(null, "select * from workouts")).rejects.toThrow(/permission denied/);
    await expect(as(null, "select * from my_group()")).rejects.toThrow(/permission denied/);
  });

  it("joining another group leaves the old one; leaving hides the old group's data", async () => {
    const [g2] = await as<{ invite_code: string }>(C, "select * from create_group('Other')");
    await as(B, "select * from join_group($1)", [g2.invite_code]);
    expect(await as(B, "select * from workouts")).toEqual([]);
    expect((await as(B, "select name from my_group()"))[0]).toEqual({ name: "Other" });
  });

  it("deleting your own workout removes it everywhere", async () => {
    await as(A, "select delete_workout('w1')");
    expect((await as(A, "select client_key from workouts")).map((r) => r.client_key)).toEqual(["w2"]);
  });
});
