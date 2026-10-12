# RealmCanvas - Antigravity IDE Starter Pack

This pack contains the project's **full proposed product/engineering specification**, original concept diagrams and an `AGENTS.md` rule file for Antigravity. No application source code is included yet.

## Quick start

1. Create or open your `realmcanvas` local repository.
2. Copy `AGENTS.md` to the repository root and `docs/REALMCANVAS_MASTER_SPEC.md` plus `docs/realmcanvas_assets/` to `docs/`.
3. Open the repository folder as an Antigravity IDE project.
4. Check that workspace rules are in effect; if necessary visit Agent panel > Customizations > Rules.
5. Give the agent this prompt:

```text
Read AGENTS.md and docs/REALMCANVAS_MASTER_SPEC.md completely.
We are starting RC-001 only (repository and quality tooling baseline).
Inspect current files and versions, identify risks, and present a reviewable
implementation plan with changed files, acceptance tests and commands.
Do not write code or run destructive commands until I approve the plan.
Do not generate the whole platform at once.
```

6. Review the plan and diffs. Implement one milestone at a time.
7. Run and check lint, typecheck, tests, build and relevant browser workflows after each milestone.

**Important:** The RealmCanvas name is provisional. Commercial pricing and performance numbers in the specification are proposals, not verified outcomes. Legacy Antigravity workflows are documented as transitioning on 19 October 2026; this pack uses workspace rules and task prompts instead.
