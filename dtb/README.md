# DTB — Diligent Tutors Bureau

Owner-managed tutoring for Delhi NCR. Includes parent/student registration, private tutor applications, learning goals, needs-based tutor requests, student/tutor portals, owner assignment and approval tools, private messaging, and verified referral/full-mark rewards. No public tutor directory or profile listings.

## Development

Node.js 22.13+, Vinext, React and Cloudflare D1. Install from the included manifest/lockfile. Run `npm run dev` locally and `npm run build` for production. Preserve the Sites integration in `vite.config.ts` and `build/`.

## Identity and operations

Hosted authentication uses Sites/ChatGPT trusted identity. Never trust these identity headers on an alternative host. Configure `DTB_OWNER_EMAIL` as a runtime secret matching G's verified sign-in email. Owner privileges fail closed when it is absent. All non-owner records are scoped to authenticated user IDs. The current deployment remains owner-private.

Apply migrations in `drizzle/` in order. G reviews tutors, assigns requests (including to himself), sets confirmed schedules, replies in private inbox threads and verifies rewards. Tutor profile edits return the application to pending review. Assigned tutors receive minimal learner details; students receive assignment status without tutor profiles. Messages require manual refresh; email/WhatsApp notifications and video classroom services are not connected.

Rewards apply to Class 10, Class 12 and entrance-exam learners. Referrals require actual enrollment verification by G. Full-mark claims require owner verification of results. Points are awarded once per approved claim, with no cash value or redemption promise. Supplied worksheets/video are sample learning resources.

## Checks

`node node_modules/typescript/bin/tsc --noEmit`

`node scripts/test-workspace.mjs` exercises route handlers against in-memory SQLite with a D1 adapter and mocked authenticated actors. Covers authentication, cross-user privacy, owner-only writes, assignment visibility, reward eligibility and duplicate claims/reviews. Hosted authentication itself is not simulated end-to-end.

Production build completed. Browser interaction/visual QA is unavailable in this environment.
