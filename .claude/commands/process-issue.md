---
description: Plan, build, test and open a PR for one GitHub issue
argument-hint: <issue-number>
---

Work on GitHub issue #$ARGUMENTS from a cold start. Follow every phase in order.

# PLAN

1. Run `gh issue view $ARGUMENTS` to get the issue details.
2. Understand the problem in the issue. Its Acceptance Criteria are the definition of done. Its
   Out of Scope list is a hard boundary.
3. Ask clarifying questions only if you are genuinely blocked.
4. Understand the prior art for this issue:
   - search `scratchpads/` for earlier thoughts on it
   - search PRs for history (`gh pr list --state all --search "<keywords>"`)
   - search the codebase for relevant files
   - read the specs it touches: `brainstorm.md`, `replica/recon.md` (screen S-IDs and flow F-IDs),
     `replica/architecture.md`, `replica/schema.sql`, `replica/design/components.md`
5. Think hard about how to break the issue into small, manageable tasks.
6. Document the plan in a new scratchpad, `scratchpads/<issue-number>-<short-slug>.md`. Include the
   issue title, a link to the issue, and the task list.

# CREATE

- Create a branch: `git checkout -b issue-$ARGUMENTS-<short-slug>` from an up-to-date `main`.
- Solve the issue in small steps, following the plan.
- Commit after each step with a descriptive message that references the issue
  (e.g. "Add OTP input component #15"). One logical change = one commit. Don't batch steps.
- After every commit, push straight away with `git push origin <branch-name>`.
- Project rules (also in CLAUDE.md):
  - RLS on every new table
  - migrations are non-destructive (expand → migrate → contract)
  - tokens only, no raw hex
  - science outputs carry citation keys
  - kg only
  - never use another app's assets or copy

# TEST

- Write Vitest tests that describe the expected behaviour (unit for pure logic, integration for
  server code).
- Any migration or RPC gets DB tests against the Postgres + auth-stub harness, covering RLS for the
  owner, a group-mate and a stranger.
- Add or extend Playwright e2e tests for any flow this changes.
- If the UI changed:
  - Use the Playwright MCP server to open the app at the iPhone viewport and click through the
    change. Take screenshots of each state (empty, filled, error, loading).
  - Run the `/apple-design` audit on the changed screens and fix every high-severity finding.
  - Check it against `replica/design/components.md` and the `/ui-ux-pro-max` pre-delivery checklist
    (`references/pro-rules.md`).
- Run the full suite: `npm run lint && npm run typecheck && npm test && npm run test:db && npm run e2e`.
- If tests fail, fix them. Everything must pass before moving on.

# DEPLOY

- Run `/code-review` on the branch and fix the findings that hold up.
- If the branch adds a migration, confirm the migration safety gate passes in CI. Add this line to
  the PR body: "Before merge: `pg_dump` prod."
- Open a PR with `gh pr create`. The body has: a summary, how it was tested (with screenshots for UI),
  the `/apple-design` audit notes, the Vercel preview URL, and `Closes #$ARGUMENTS`.
- Report the PR URL. Don't merge it yourself.
