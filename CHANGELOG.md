# Changelog

All notable changes to the CareerLink Nepal platform will be documented in this file.

## [Unreleased] - Defect Remediation

### Added
- Created `/forgot-password` and `/reset-password` flows using Supabase Auth.
- Created `/settings` page for authenticated users to update their password.
- Created `/posts/:id` detail page for direct linking to specific feed posts.
- Created `/about`, `/privacy`, `/terms`, and `/contact` pages.
- Added a `Share` button on feed posts that copies a deep link to the clipboard.
- Added `pluralize.ts` utility for grammatically correct counts (members, pending requests).
- Added `vercel.json` with comprehensive security headers (CSP, X-Frame-Options, etc.).
- Added `validation.ts` utility to enforce UUID formatting for backend calls.

### Changed
- **AppLayout.tsx**: "Profile" sidebar link is now only highlighted when actively on the user's own profile page, not when viewing others.
- **LoginForm.tsx & SignupForm.tsx**: Removed `noValidate` attributes to allow native browser validation alongside React Hook Form + Zod.
- **Profile.tsx**: Added `isValidUUID` check to prevent Supabase backend errors on malformed routes. Added accessibility attributes (`id`, `htmlFor`, `name`, `maxLength`) to the Profile Editor modal.
- **Landing.tsx**: Updated footer navigation to point to functional pages (About, Contact, Privacy, Terms) instead of placeholder fragments.
- **Community UI**: Pluralized member counts in lists and detail headers.

### Removed
- **AppLayout.tsx**: Removed duplicate imports.
- **Explore.tsx**: Removed unused interfaces (`PostResult`, `CommunityResult`, `EventResult`).
- **connections.ts / Profile.tsx**: Cleaned up leftover debugging `console.log` statements.
