# Required Package Installations

Run the following command to add the new dependencies:

```bash
npm install react-hook-form @hookform/resolvers zod
```

## What each package does

| Package | Purpose |
|---|---|
| `react-hook-form` | Performant, accessible form state management with minimal re-renders |
| `@hookform/resolvers` | Bridges react-hook-form with Zod (and other schema validators) |
| `zod` | TypeScript-first schema validation with inferred types |

## Already expected in your project

These should already be present (they were used in the original code):

- `react-router-dom` — routing
- `sonner` — toast notifications
- `lucide-react` — icons
- `@supabase/supabase-js` — Supabase client

## Supabase project configuration required

In your Supabase dashboard → Authentication → URL Configuration:

1. Add `http://localhost:5173/auth/verified` to **Redirect URLs** (development)
2. Add `https://yourdomain.com/auth/verified` to **Redirect URLs** (production)

This is the URL Supabase will redirect to after email verification.

If email verification is enabled in your Supabase project (recommended for
production), users will receive a verification email after signup and will
NOT be immediately signed in until they click the link.

## Optional: Enable email confirmation in Supabase

Dashboard → Authentication → Providers → Email:
- ✅ Enable email confirmations

This is required for the email verification flow to work correctly.
