# The Melusine — implementation and activation

The site is static HTML, CSS and JavaScript. The repository remote is the GitHub Pages reference supplied in the brief. No application server, enquiry endpoint, email provider, deployment workflow, package manifest, GA4/GTM tag, analytics ID or consent platform was found in the active project. The live Wix site has not been changed. No deployment was made.

## Events content

Edit `content/events.json`, then run:

```powershell
node tools/build-events.cjs
node tools/build-events.cjs --check
```

The dependency-free generator updates cards in both `index.html` and `events.html`. Generated HTML works without JavaScript. Keep the generation markers. IDs provide Events-page anchors; internal CTA routes and fragments are checked during generation. Change `featured` and the item order to change seasonal prominence. Dates, prices, packages and availability should be added only after client confirmation. The current items are enquiry topics, not scheduled events or active offers.

## Private hire delivery

`private-hire.html#enquire` contains the prepared form. `data-endpoint=""` intentionally keeps sending disabled. Visible email and phone links remain available. The form does not prepare a mailto submission or claim success without delivery confirmation.

To activate it, deploy and test a same-origin HTTPS endpoint (for example, a reverse-proxied serverless function), then set its route in `data-endpoint`. GitHub Pages alone cannot execute that endpoint. Do not put email credentials, service API secrets or private keys in the browser or repository. Configure the restaurant recipient, sender domain and email provider on the server.

Request: JSON `POST` with `requestId` (UUID), `name`, `email`, `date` (optional `YYYY-MM-DD`), `guests` (optional positive integer), `message` and `website` (honeypot, must be empty). The browser validates required fields, email, date, number and length; the server must validate independently, including whitespace-only fields, field lengths, a bounded request body and today's date in Europe/London. Current client limits are 120 characters for name, 254 for email and 3,000 for message. No restaurant capacity has been invented.

Required server protections and reliability:

- Validate the request origin and content type; reject cross-origin requests. Add CSRF protection if the selected hosting/session architecture needs it.
- Check the honeypot and enforce server-side rate limits. Add a challenge such as Turnstile if abuse warrants it; validate challenge tokens server-side. A client honeypot alone is not sufficient protection.
- Deduplicate `requestId` for retries, bind it to the original payload, and persist accepted enquiries before acknowledging. Handle email through a durable queue with retries and delivery monitoring, or return acceptance only after the provider has accepted delivery. Do not return success solely because input validation passed.
- Return a successful HTTP status and `{"accepted":true}` only after the enquiry is durably received. Other responses, invalid JSON and network errors produce honest failure feedback. Supply accessible error text without exposing provider diagnostics.
- Use verified sender details, safe email templates and sanitisation; never treat a visitor's address as the sender. Set SPF/DKIM as required by the email service. Agree retention and access controls with the restaurant.
- Test actual inbox receipt, timeout/retry deduplication, provider failure, rate limiting and spam rejection before enabling the button. Local mocked tests do not establish production delivery.

The UI blocks double submission, uses a 15-second timeout, retains details on failure, and keeps the same request ID for unchanged retries. Only an explicit accepted response resets the form and calls the enquiry conversion hook. JavaScript-free visitors are directed to contact the team.

## Analytics

No analytics or consent implementation existed in the active static pages. `analytics.js` adds hooks only: it installs no Google tag, makes no analytics requests, creates no cookies or storage, and invents no ID. It drops events while consent or configuration is missing; it does not replay pre-consent actions.

Activation requires the owner's GA4 property/stream, its real ID, and the agreed consent implementation. Load one Google tag through that consent system. Before the hooks run, or at runtime, supply:

```javascript
window.MelusineAnalytics = {
  enabled: true,
  hasConsent: () => yourConsentAdapter.analyticsAllowed() === true
};
```

`yourConsentAdapter` is a documented placeholder for the actual consent platform, not supplied code. It must read current consent on every event, including revocation; the hooks fail closed if it throws. No listener here changes or overrides a Google consent setting. Verify both tag loading and event transmission in the actual consent platform before launch.

| Event | Trigger |
| --- | --- |
| `book_table_click` | Existing OpenTable link for restaurant 206064 |
| `food_menu_click` | Food/menu page links and food section tabs |
| `drinks_menu_click` | Drinks anchor and drinks section tabs |
| `private_hire_click` | Private Hire page or enquiry anchor |
| `private_hire_enquiry_submit` | Endpoint explicitly confirms acceptance |
| `events_click` | Events page or topic anchor |
| `directions_click` | Google directions or OpenStreetMap links |

Parameters are fixed CTA location labels only. Form values, email addresses, dates, guest numbers, messages and query strings are never included. One delegated click listener emits one named event per click. The initialization guard prevents duplicate installation. Keep these events owned by this script: do not add equivalent GTM click/submit triggers or GA4 derived events with the same names. Treat GA4 enhanced outbound `click` as a separate diagnostic event; do not count it again as a booking lead. Disable automatic form interaction measurement for this form/stream, or ensure its `form_submit` is never used as a successful enquiry conversion.

Mark `private_hire_enquiry_submit` as a GA4 key event only after real delivery validation. `book_table_click` measures booking intent, not a reservation. No completed-reservation event is implemented.

Google documents [enhanced outbound click measurement](https://support.google.com/analytics/answer/13566436?hl=en). Cross-domain measurement requires appropriate tagging on participating domains; simply listing OpenTable does not establish booking completion. See [Google's cross-domain requirements](https://support.google.com/analytics/answer/10071811?hl=en-NA).

OpenTable describes [ad tracking and booking widget reservation integrations](https://www.opentable.com/restaurant-solutions/resources/ad-tracking-for-restaurants/). The current site uses an outbound hosted reservation link, not that integration. Obtain account access and confirm supported tracking with OpenTable before implementing completed-booking attribution. Preserve the current `restref=206064`, `lang=en-GB` and `ot_source=Restaurant website` destination. Validate reservations against OpenTable's reporting, rather than inferring completion from a click or return visit.

For Wix comparison, obtain dated Wix reports and GA4 access where available. Agree matching periods, traffic sources, consent coverage and definitions: menu visits, outbound booking clicks, delivered hire enquiries and confirmed reservations are distinct metrics. Wix historical data is not automatically transferred to GA4. If the owner already has a GA4 property on Wix, decide whether to reuse it with a suitable stream and deployment annotations; keep historical reporting intact. No Wix changes are required to review this local implementation.

## Verification

### Internal sources and shared assets

The current GitHub Pages branch deployment uses Jekyll. `_config.yml` excludes `_development`, which retains the local font lab and migration inventory. The font lab has its own `noindex, nofollow`; public restaurant pages remain indexable. Keep this folder excluded if hosting changes to a raw static deployment, and check that both old `/font-lab.html` and `/_development/font-lab.html` return 404 after the next approved deployment. The retained lab can be opened locally at `/_development/font-lab.html`.

All six public pages use shared asset version `20261011-technical-completion`. When editing a shared stylesheet or script, update its version consistently on all six pages before deployment. Header/favicon and footer logos use lossless WebP copies with identical RGBA pixels; original PNG sources are retained. Photography has not changed. Open Graph images use the intended production domain; retrieval and social previews must be checked after the new production assets are hosted.

Migration planning and business approval gates are documented in `_development/MIGRATION.md`; no live migration has been performed.

### Existing checks

There was no existing package-based build or test command. This remains a static site; the content generator is the only build step. Syntax/content checks:

```powershell
node tools/build-events.cjs --check
node --check script.js
node --check analytics.js
git diff --check
```

From the enclosing `The Melusine files` workspace, run `node homepage-refinement-2026-10-10/verify.cjs` using the bundled Playwright runtime referenced in that file. It serves the site temporarily on loopback, tests all six main pages at 375, 390, 768 and 1440 pixels, and writes screenshots and `verification.json`. Endpoint acceptance and analytics tests are local mocks and send no real enquiries or Google events. The archived earlier design-audit scripts target superseded DOM selectors and the former email-preparation flow; they are not a current project test suite.

Opening status is calculated in Europe/London and agrees with the configured hours: Monday–Saturday 12:00–22:30, Sunday 12:00–21:30, including daylight-saving changes and inclusive opening/exclusive closing boundaries. No holiday override source exists; add confirmed exception dates if required. Contact address, phone and existing legal destinations have been preserved.
