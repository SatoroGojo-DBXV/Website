# DTB — Diligent Tutors Bureau

Owner-managed tutoring for Delhi NCR. Includes parent/student registration, private tutor applications, learning goals, needs-based tutor requests, student/tutor portals, owner assignment and approval tools, private messaging, and verified referral/full-mark rewards. No public tutor directory or profile listings.

## Development

Node.js 22.13+, Vinext, React and Cloudflare D1. Install from the included manifest/lockfile. Run `npm run dev` locally and `npm run build` for production. Preserve the Sites integration in `vite.config.ts` and `build/`.

## Identity and operations

Hosted authentication uses Sites/ChatGPT trusted identity. Never trust these identity headers on an alternative host. Configure `DTB_OWNER_EMAILS` as a comma-separated runtime secret listing initial owner sign-in emails. Owners added from the private Owner access tab are saved in D1 with the adding owner's email and timestamp. Every owner can add more owners; emails are normalized to lowercase and duplicates are rejected. The private owner page, unlock API, document downloads and management APIs all use the same owner directory. This is an application role, separate from Site project editing permissions. While hosting is private, each added email also needs a private Site viewer invitation before it can reach the application; adding an app owner does not send invitations or expose the link/code. Configure `DTB_OWNER_PATH_KEY` (12–100 URL-safe letters, digits, underscores or hyphens) and `DTB_OWNER_CODE` (12–200 characters) only when the owner supplies them. The private owner route is `/owner/<configured key>`; it is not linked from the ordinary website. All owner access fails closed until these settings exist. A verified owner login plus the correct link and code issues a signed, HTTP-only, secure 30-minute cookie. The server limits access-code attempts to five per 15 minutes. Code or path changes invalidate existing sessions. The ordinary workspace API never grants owner access, even to the owner account; privileged actions use the separate owner API. All non-owner records are scoped to authenticated user IDs. The current deployment remains owner-private.

Users must complete student/parent or tutor registration before entering the ordinary website. Apply migrations in `drizzle/` in order. G reviews tutors, assigns requests (including to himself), sets confirmed schedules, replies in private inbox threads and verifies rewards. Tutor applications require one identity document and one qualification document, each PDF/JPG/PNG up to 5 MB. Documents use the private `BUCKET` R2 binding, with authenticated downloads limited to the uploader and the unlocked owner. File signatures and size are checked; authenticity is manually checked by G, who must explicitly confirm verification to approve. Existing tutors must upload missing documents before they can receive assignments. Replacing a document or editing a tutor profile returns the application to pending review. Assigned tutors receive minimal learner details; students receive assignment status without tutor profiles. Messages require manual refresh; email/WhatsApp notifications and video classroom services are not connected.

Rewards apply to Class 10, Class 12 and entrance-exam learners. Referrals require actual enrollment verification by G. Full-mark claims require owner verification of results. Points are awarded once per approved claim, with no cash value or redemption promise. Supplied worksheets/video are sample learning resources.

## Checks

`node node_modules/typescript/bin/tsc --noEmit`

`node scripts/test-registration.mjs` also runs the workspace suite and exercises route handlers against in-memory SQLite with a D1 adapter and mocked authenticated actors. Covers authentication, cross-user privacy, owner-only writes, assignment visibility, reward eligibility and duplicate claims/reviews. Additional tests cover all three initial owners, delegated owner creation, normalized duplicates, owner-list privacy, and required documents, private downloads, file replacement, owner-link/code configuration, secure cookies, tampering, expiry and attempt limits. Hosted authentication and R2 are mocked, not tested end-to-end.

Production build completed. Browser interaction/visual QA is unavailable in this environment.
