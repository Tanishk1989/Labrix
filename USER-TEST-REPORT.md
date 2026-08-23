# TRACE real-user website test

Tested 23 August 2026 using the locally configured application and the existing signed-in browser session.

## Verdict

**Critical failure: the website is currently unusable for a signed-in user.** The configured Neon database cannot be reached. Normal startup refuses to open TRACE, and bypassing the startup check only exposes a generic dashboard error page.

## Tested journey

1. **Start the website — Failed**
   - `npm run dev` exits before opening the website.
   - The startup check reports that the configured PostgreSQL/Neon database is unavailable or has pending migrations.
   - Directly starting Next.js was required just to inspect the web interface.

2. **Open TRACE as an existing signed-in user — Failed**
   - Opening `/` redirects the signed-in user to `/dashboard`.
   - The dashboard renders only “Couldn't load this page.”
   - Browser diagnostics confirm `PrismaClientInitializationError`: the dashboard cannot reach the configured Neon database while loading classrooms.
   - Evidence: `user-test-evidence/01-landing-start.png`.

3. **Use the error recovery action — Failed**
   - Clicking “Try again” returns to the identical error.
   - The development issue counter increases, confirming another failed render.
   - There is no back-to-home action, sign-out action, status explanation, support path, or automatic retry state.
   - Evidence: `user-test-evidence/02-try-again-fails.png`.

4. **Open the access-denied recovery screen — Partially healthy**
   - The screen has a clear heading, plain explanation, and a visible action.
   - Its only action is “Go to sign in,” even for an already signed-in user.
   - Clicking it sends the existing user to `/dashboard`, which returns to the database error. The action therefore creates a recovery loop rather than resolving access.
   - Evidence: `user-test-evidence/05-unauthorized.png` and `user-test-evidence/06-access-recovery-loop.png`.

5. **Create or open a classroom — Blocked**
   - The dashboard cannot load, so classroom navigation is unavailable.

6. **Create/publish a practical — Blocked**
   - No authenticated product navigation renders.

7. **Join a class as a student — Blocked**
   - The active browser session is already authenticated, and the product fails before a role-specific workflow becomes available.

8. **Run code, save work, submit, and review — Blocked**
   - None of these tasks can be reached while the database is unavailable.

## Confirmed faults

### Critical

1. **Production data dependency is offline or unreachable.** Health endpoint returns HTTP 503 with `database.status = error`.
2. **Normal development startup is not resilient.** The app exits completely when database readiness fails.
3. **Authenticated entry has no degraded experience.** A user receives a generic route error instead of navigation, cached/read-only content, or an actionable maintenance state.
4. **The primary recovery button does not recover.** “Try again” repeats the same failing request without new guidance.

### High

5. **Access-denied recovery is wrong for authenticated users.** “Go to sign in” redirects an existing session back to the broken dashboard.
6. **No escape route from the dashboard error.** Users cannot return home, sign out, switch accounts, view service status, or contact support.
7. **The error copy is too generic.** It says the page cannot load but does not say TRACE is temporarily unavailable, identify the affected service, or tell the user when/where to retry.
8. **No observable retry state.** The button provides no spinner, disabled state, retry count, or changed message while the request is retried.

### Medium

9. **Development tooling is visible in the user interface.** Next.js issue controls appear in screenshots. These must not exist in the classroom release.
10. **Notification infrastructure loads on error/public surfaces.** “Real-time notifications” is present even when the dashboard itself cannot load.
11. **Secondary error text has weak contrast.** The muted grey text is difficult to read against the black background, especially at smaller sizes.
12. **Large empty areas make the failure look unfinished.** The error is placed in a narrow region with no application shell or service identity around it.

## What worked

- Protected routing recognizes the existing authenticated session.
- The route error uses a semantic alert, heading, paragraph, and real button.
- The access-denied screen is visually consistent and easy to scan.
- The `/api/health` endpoint correctly returns HTTP 503 rather than falsely reporting success.
- Current responses include a Content Security Policy and standard security headers.

## Accessibility limits

The visible error semantics are reasonable, but a complete keyboard, focus, screen-reader, zoom, and contrast audit was impossible because the primary user journey never rendered. Passing this error screen does not establish accessibility for the dashboard, classroom, workspace, or review flows.

## Fix order

1. Restore and verify database connectivity from the exact environment that runs Next.js.
2. Make `/api/health` healthy and verify migrations before reopening the user test.
3. Add a service-unavailable state with Home, Sign out/Switch account, Status, and Support actions.
4. Make retry show progress and return a meaningful result.
5. Correct access-denied recovery for already-authenticated users.
6. Rerun the complete teacher and student journey only after the dashboard loads.
