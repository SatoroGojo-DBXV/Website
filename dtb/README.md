# DTB - Diligent Tutors Bureau

Full-stack tutoring website with responsive home page, illustrative tutor directory, parent/student registration, tutor applications, trial requests and a student portal.

## Run

Use Node.js 22.13 or later. Install dependencies from the included package manifest and lockfile. Run `npm run dev` for local development and `npm run build` for a production build. This project uses Vinext, React and Cloudflare D1. The Sites build integration is preserved in `vite.config.ts` and `build/`.

## Authentication and data

Hosted sign-in is provided by Sites / ChatGPT. The trusted `oai-authenticated-user-id` header is the owner key for all records; never accept these identity headers from untrusted internet clients on an alternative host. Public write access is not enabled. The site remains owner-private.

D1 migrations are in `drizzle/`. `registrations` stores one learner profile and one tutor application per account. `trial_requests` stores requested trials. APIs enforce identity, same-origin writes and server-side validation. Tutor applications are pending review and do not publish directory listings.

The dashboard distinguishes real account records from demo sessions and progress. No video classroom, scheduling service, email or WhatsApp notifications are connected. Trial requests are saved requests, not confirmed bookings.

## Sample content

All six directory tutors, reviews, rates, schedules and progress metrics are illustrative and labelled. The hero and portrait contact sheet are AI-generated website assets. Original PDF worksheets and a 20-second sample maths video are in `public/resources/`. The walkthrough is an animated in-page guide, not a testimonial video. No school partnerships or aggregate parent-rating claims are asserted.

## Validation

TypeScript type check and production build; server-side validation checks; PDF rendering and asset inspection. Browser interaction/visual QA was unavailable in this environment.
