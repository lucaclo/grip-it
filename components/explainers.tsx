"use client";

import { InfoButton } from "@/components/ui/info";
import { EFFORT_CITATIONS, HARD_SET_RIR, RIR_CITATIONS, SESSION_HEAT, WEEK_HEAT } from "@/lib/science/effort";
import { DOTS_CITATIONS, E1RM_CITATIONS } from "@/lib/science/strength";
import { VOLUME_BAND, VOLUME_CITATIONS } from "@/lib/science/volume";

/**
 * Plain-English explanations behind the "i" icons. One place, so every screen says the same thing.
 */

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-md bg-surface-raised/70 p-3 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="tabular text-muted">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function HardSetsText() {
  return (
    <>
      <p>
        An <strong>exercise</strong> is a movement, like bench press. A <strong>set</strong> is one go at it: lift,
        rest, go again.
      </p>
      <p>
        A <strong>hard set</strong> is a working set you finish with about {HARD_SET_RIR} or fewer reps left in the tank.
        Those are the sets that build muscle. Warm-ups and easy sets don&apos;t count.
      </p>
      <p className="text-muted">
        Example: 3 exercises × 3 sets = 9 sets. If every set ended close to failure, that&apos;s 9 hard sets.
      </p>
      <p className="text-muted">
        How we know: if you log reps left (RIR), we use that. Otherwise we estimate it from the weight compared with
        your best on that lift and the reps you did.
      </p>
    </>
  );
}

export function HardSetsInfo({ className }: { className?: string }) {
  return (
    <InfoButton title="Hard sets" label="What are hard sets?" keys={[...EFFORT_CITATIONS.slice(0, 2), ...VOLUME_CITATIONS]} className={className}>
      <HardSetsText />
    </InfoButton>
  );
}

export function IntensityInfo({ scale, className }: { scale: "session" | "week"; className?: string }) {
  const [a, b, c] = scale === "session" ? SESSION_HEAT : WEEK_HEAT;
  return (
    <InfoButton title="How hard each muscle worked" label="How muscle intensity works" keys={EFFORT_CITATIONS} className={className}>
      <p>
        The redder a muscle, the harder it worked. Every set gets an effort score from how close it took you to
        failure:
      </p>
      <Table
        rows={[
          ["0–1 reps left", "1 (all-out)"],
          ["2 left", "0.85"],
          ["3 left", "0.7"],
          ["4 left", "0.5"],
          ["5+ left", "0.25 (easy)"],
        ]}
      />
      <p className="text-muted">
        Reps left come from the weight as a % of your best on that lift, and the reps you did. Logged RIR is used when
        you have it. Warm-ups score 0, and very light sets (under 30% of your max) count half.
      </p>
      <p className="text-muted">
        A muscle adds up the scores of every set that trained it. Muscles that only help (like triceps on bench press)
        count half.{" "}
        {scale === "session"
          ? `In one workout: under ${a} is light, ${a}–${b} moderate, ${b}–${c} hard, ${c}+ very hard.`
          : `Over a week: under ${a} is light, ${a}–${b} moderate, ${b}–${c} hard (the ${VOLUME_BAND.min}–${VOLUME_BAND.max} range most people grow best in), over ${c} very hard.`}
      </p>
      <p className="text-muted">
        First time on a lift? Your best set today stands in for your max, so it&apos;s marked as an estimate until you
        have more history.
      </p>
    </InfoButton>
  );
}

export function RirText() {
  return (
    <>
      <p>
        <strong>RIR = reps in reserve.</strong> After a set, ask yourself: how many more reps could I have done with good
        form?
      </p>
      <Table
        rows={[
          ["0", "Couldn't do another rep"],
          ["1", "One more, just"],
          ["2–3", "A couple left: a solid working set"],
          ["5+", "Easy, plenty left"],
        ]}
      />
      <p>
        With this on, ticking a set asks <strong>&ldquo;Reps left in the tank?&rdquo;</strong> One tap answers it, or
        ignore it and we estimate.
      </p>
      <p className="text-muted">
        Your answers make next-session targets, hard sets and the muscle diagram more accurate. Most growth comes from
        sets ending 0–3 reps from failure; it gets easier to judge with practice.
      </p>
    </>
  );
}

export function RirInfo({ className }: { className?: string }) {
  return (
    <InfoButton title="Reps left (RIR)" label="What is RIR?" keys={RIR_CITATIONS} className={className}>
      <RirText />
    </InfoButton>
  );
}

export function PowerliftingInfo({ className }: { className?: string }) {
  return (
    <InfoButton title="Powerlifting score (DOTS)" label="How the powerlifting score works" keys={[...DOTS_CITATIONS, ...E1RM_CITATIONS]} className={className}>
      <p>
        Powerlifting is about three lifts: <strong>squat, bench press and deadlift</strong>. Your total is your best
        estimated 1-rep max on each, added together.
      </p>
      <p>
        Heavier people can lift more, so the total is adjusted for body weight using <strong>DOTS</strong>, the formula
        powerlifting federations use. That way a 60 kg and a 100 kg lifter compete fairly. Higher is better.
      </p>
      <p className="text-muted">
        Your 1-rep maxes are estimated from your sets (Epley formula), so you never need to test a true max. Your body
        weight is used for the score but never shown to anyone.
      </p>
    </InfoButton>
  );
}

export function VolumeBoardInfo({ className }: { className?: string }) {
  return (
    <InfoButton title="Total volume" label="How total volume works" className={className}>
      <p>
        Total volume is every kilo you lifted this week: <strong>weight × reps</strong>, added up over all your working
        sets, Monday to Sunday.
      </p>
      <p className="text-muted">
        Example: 3 sets of 10 at 60 kg = 1,800 kg. Warm-ups don&apos;t count. For body-weight moves like pull-ups and
        dips, your body weight plus any added weight counts.
      </p>
      <p className="text-muted">It rewards work done, so bigger lifters and longer sessions score higher.</p>
    </InfoButton>
  );
}
