# CareerLink Nepal — TODOs

## Backend Configuration (Supabase Dashboard)
- [ ] Configure Rate Limiting for Auth endpoints (Settings > API > Rate Limiting).
- [ ] Configure hCaptcha / CAPTCHA integration in Supabase Auth to prevent automated signups (Settings > Auth > Protection).
- [ ] Ensure SMTP email provider is fully set up for the new Forgot Password flow (Settings > Auth > Email).
- [ ] Implement database-level self-exclusion filters on connections feed (if not already strictly enforced via RLS).

## Future Improvements
- [ ] Migrate `generateMetadata` OpenGraph/Twitter card features to a small Edge Function (e.g., Supabase Edge Functions or Vercel Serverless) since Vite SPA cannot natively serve dynamic HTML headers for social media crawlers.
- [ ] Complete the remaining missing UI views for user settings (e.g. email change, notification preferences).
- [ ] Consolidate the 1300+ line `Profile.tsx` monolith into smaller functional sub-components (e.g., `ProfileHeader`, `ProfileTabs`, `ConnectionRequests`).
- [ ] Implement an end-to-end testing suite (Playwright or Cypress) to catch regressions in authentication flows.
