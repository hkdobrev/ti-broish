# Ти Броиш

Monorepo for the new public site and signup.

- `apps/web` is a TanStack Start app on Cloudflare Workers. It is the clickable staging prototype: campaign pages, the signup flow, and the profile.
- `infra` is OpenTofu for the staging Worker route on `d1t.tibroish.bg`. Production `tibroish.bg` is not in this slice.
- EmDash will own the editable public pages. The prototype serves those pages from `apps/web` so staging is one clickable site.

Staging data stays in the browser. Email confirmation is simulated.

```bash
cd apps/web
pnpm install
pnpm dev
```
