# RealmCanvas Agent Rules

- Read `docs/REALMCANVAS_MASTER_SPEC.md` before architecture-changing edits.
- Work on exactly one approved milestone/task per request.
- Before editing, summarize objectives, likely changed files, acceptance criteria, risks and proposed test commands.
- Preserve modular-monolith domain boundaries and public/admin API separation.
- Treat published scene data as untrusted: validate schema and whitelist interaction types.
- Enforce server-side tenant membership and role checks on every admin data action.
- Never expose secrets, unpublished data, unsafe URLs or raw PII through public manifests.
- Ensure product browsing and CTAs remain usable without WebGL.
- Blender, GSAP, Rapier, microservices and WebGPU-only features are optional: add only after demonstrating a need.
- Use strict TypeScript, small modules, runtime validation and explicit error paths.
- Tests and documentation must accompany behavior changes.
- Do not run destructive commands, deploy, change billing, send external communications or touch production without explicit approval.
- When done, report changed files, command outputs and observed results, security/accessibility checks, limitations, and next smallest recommended task.
