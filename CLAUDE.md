# Project: 1757 (SPL@)
1757 is a multiplayer RPG project built as a Turborepo monorepo with a Next.js frontend and a Fastify API backend backed by Postgres via Prisma, with Socket.IO for real-time game events.

---

## Your operating instructions

You are an AI coding agent working on this project. On every prompt,
follow these steps exactly in order. Do not skip steps.

### Step 1 — always, on every prompt
Read CLAUDE.md (you are here). This takes 5 seconds and is never optional.

### Step 2 — identify the mode

**Plan mode** is when the user asks you to plan, think through, design,
or figure out how to approach something. Keywords: "plan", "how should
we", "think through", "design", "what's the approach", "figure out".

**Act mode** is when the user asks you to build, implement, write, fix,
add, or change something. Keywords: "build", "implement", "do it",
"write", "fix", "add", "change", "go ahead".

**Question mode** is when the user asks a question that does not require
code or planning. Answer from loaded context. Read more files if needed.

**If you cannot tell which mode**, do not guess. Ask:
"Should I plan this out first, or go ahead and build it?"

### Step 3 — plan mode flow

Read in this order, stop if the answer becomes clear:
1. `.claude/requirements.md` — is this in scope? if not, tell the user.
2. `.claude/features/<name>.md` — get the full spec for this feature.
   If the feature file does not exist yet, tell the user and offer to
   create it before planning.
3. `.claude/architecture.md` — where does this fit in the project?
4. `.claude/data-model.md` — only if the task touches data or schema.
5. `.claude/api-routes.md` — only if the task touches routes or auth.

Then write `.claude/active-plan.md` using the exact format defined in
Part 7 of this setup prompt. When done, show the plan to the user and
stop. Do not write any code in plan mode. Wait for the user to approve,
correct, or reject the plan before doing anything else.

### Step 4 — act mode flow

Read in this order before touching any file:
1. `.claude/active-plan.md` — what is the plan? follow it exactly.
   If active-plan.md is empty or missing, stop and say:
   "There is no active plan. Should I plan this first?"
2. `.claude/rules.md` — what must never happen? read every line.
3. `.claude/conventions.md` — how must code be written in this project?
4. `.claude/known-errors.md` — have we hit related bugs before?
5. `.claude/features/<name>.md` — re-read behaviour and edge cases
   while coding, not just before. Check them as you implement each part.

Then write code. Follow the plan exactly. Only touch files listed in
active-plan.md under "files to modify" or "files to create". If you
realize mid-task that you need to touch a file not in the plan, stop
and tell the user why, then wait for confirmation before proceeding.

When done, update `.claude/progress.md`. Mark completed items done.
If you fixed a bug along the way, add it to `.claude/known-errors.md`.

---

## Context files — what to read and when

| File | Read when |
|------|-----------|
| `.claude/stack.md` | You need the tech stack or any run/build/test/lint command |
| `.claude/architecture.md` | You need folder structure, module boundaries, or data flow |
| `.claude/conventions.md` | You are writing or reviewing any code |
| `.claude/rules.md` | Before writing any code — non-negotiable, always read |
| `.claude/requirements.md` | You need to know if something is in scope |
| `.claude/data-model.md` | You are touching DB, types, schema, or relations |
| `.claude/api-routes.md` | You are touching any route, payload, auth, or middleware |
| `.claude/decisions.md` | You are about to suggest a library or architectural change |
| `.claude/progress.md` | You need to know what is already built or what is pending |
| `.claude/known-errors.md` | You hit a bug or something unexpected is happening |
| `.claude/active-plan.md` | You are in act mode — read before touching any file |
| `.claude/features/<name>.md` | You are planning or building that specific feature |
