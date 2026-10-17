# Cline #14858 component-replay evidence

Captured on October 17, 2026.

- Before: actual merge base `cd01a92faac40af398e43cbafecfb31c63dba2ad`
- After: PR tip `f0d34fbfa8014a8ef162f5b00c5e3e6b83dc1c67`
- Same URL `http://127.0.0.1:3125/pr-evidence`, viewport 1280×900, and identical `page.tsx` replay harness
- Exact source trees run through the real Next app layout, CSS, production `SettingsView`, production `AccountView`, and production `AccountProvider`
- Only `desktopClient.invoke`, the desktop IPC/transport boundary, is replaced with an isolated deterministic fixture. The actual AccountView Sign Out button issues the save command and owns invalidation. There is no fabricated replacement sign-out button or forced UI badge.
- Dependency lock and SDK package sources are unchanged between these trees; the same installed frozen-lock dependencies and compiled SDK are reused
- The header explicitly labels this a fixture-backed component replay. **This is not a live account, real OAuth sign-out, native Tauri test, or deployed E2E.** No personal credentials, real sidecar, or global Cline home was used.

## Identical observed steps

1. Open Providers: both Cline and Cline Pass show Configured; header says `2 configured · 2 available`.
2. Open Account and click the production Sign Out button.
3. Return to Providers within the 60-second cache lifetime.

Before: the fixture confirms the account is signed out, but both provider badges and the header remain configured. Only one `list_provider_catalog` call occurred.

After: the fixture confirms the account is signed out; the header prompts connection, both provider rows offer Sign in, and the detail says Not configured. The catalog was fetched exactly twice, once initially and once after sign-out.

Red boxes are the only screenshot annotations. The temporary route is outside the PR diff and is archived here solely for reproducibility.

On the PR tip, the SDK build and all 75 settings UI tests in 11 files passed again. These are separate from the browser replay; the replay does not claim to cover every race/failure regression or replace the native-authentication verification gap.
