# The Melusine — migration preparation

Prepared 11 October 2026 against baseline `84d5f91`. Planning only: no DNS, hosting, Wix, mailbox, live redirects or PDF links have been changed. Intended production origin: `https://www.themelusine.co.uk`. The GitHub preview is not the production identity.

## Verified current routes

Every path in this table is relative to the production origin above. All returned HTTP 200 on 11 October 2026. Inventory sources: the live [pages sitemap](https://www.themelusine.co.uk/pages-sitemap.xml), [dynamic-items sitemap](https://www.themelusine.co.uk/dynamic-items_p_e7b8f597_97a0_4b80_b760_5be8391291c7_0_5000-sitemap.xml), current page responses and the existing read-only audit. This is the public sitemap inventory, not a complete Search Console or inbound-link export; obtain those before approving redirect coverage.

| Current URL path | Intended new destination | Required treatment | Approval / dependency |
| --- | --- | --- | --- |
| `/` | `/` served by `index.html` | Retain the homepage URL. | Final website and hosting approval. |
| `/privacy-policy` | `/privacy-policy` | Independently host approved legal content at this same path, e.g. `privacy-policy/index.html`. No redirect if preserved. | Theodore must approve currency and wording. No legal page has been copied or published. |
| `/terms-and-conditions` | `/terms-and-conditions` | Independently host approved legal content at this same path, e.g. `terms-and-conditions/index.html`. No redirect if preserved. | Theodore must approve currency and wording. No legal page has been copied or published. |
| `/copy-of-food-menu` | Provisionally `/menu.html`, only if equivalent to the intended menu | Decide whether “Taste of the City Menu” is a retired offer, a separate current menu, or a legacy duplicate. Use a permanent HTTP redirect only after deciding an equivalent destination; otherwise preserve approved content or return 404/410. | Theodore; check Search Console and inbound links. Do not silently retire an offer. |
| `/items` | No equivalent page currently approved | This is the Wix placeholder listing “Items (All)”. Prefer a proper 404/410 if confirmed obsolete; retain any approved real content if identified. | Confirm retirement after checking traffic and links. No blanket homepage redirect. |
| `/items/this-is-a-title-03` | No equivalent page currently approved | Wix placeholder “This is a Title 03”; proposed 404/410 if confirmed obsolete. | Same approval and traffic/link check as `/items`. |
| `/items/this-is-a-title-02` | No equivalent page currently approved | Wix placeholder “This is a Title 02”; proposed 404/410 if confirmed obsolete. | Same approval and traffic/link check as `/items`. |
| `/items/this-is-a-title-01` | No equivalent page currently approved | Wix placeholder “This is a Title 01”; proposed 404/410 if confirmed obsolete. | Same approval and traffic/link check as `/items`. |

## PDFs requiring independent hosting

These exact existing links remain in the site. Each currently resolves to a working `application/pdf` response at `https://1592057c-298d-4955-b330-e8424e9c9ccf.filesusr.com/ugd/<filename>`. That Wix-managed destination should not be assumed permanent after ending Wix hosting.

| Existing production path | Referenced from | Intended migration treatment |
| --- | --- | --- |
| `/_files/ugd/48a963_79cf8294433e48ed951ef3a31bc144ee.pdf` | Menu — food PDF | Independently host the approved, unmodified food PDF at this exact path. If a new path is approved instead, implement a permanent HTTP redirect from this old path to it. |
| `/_files/ugd/48a963_8d5adb8dd89e41efad547f7bb16f7abf.pdf` | Menu — drinks PDF | Same treatment for the approved drinks PDF. |
| `/_files/ugd/48a963_ed079c1bd8cb49fcbdaeea8fc7bf0bcf.pdf` | Private Hire — two “View private hire brochure” links, in the hero and brochure section | Same treatment for the approved Events 2026/2027 PDF. It contains minimum-spend prices. Keep it accessible until Theodore approves whether to retain the pricing or provide a replacement. |

The events brochure is also accessible directly through its production URL and Wix file-host URL; changing a button alone would not withdraw the published file. Current local/GitHub site source does not include these PDF files. Independently host the approved originals before domain cutover, verify content/checksums and MIME types, and test both old bookmarked URLs and visible download links. Do not redirect old PDF URLs to an HTML homepage. Do not change a brochure or remove a working link without approval.

## New site destinations and compatibility

| Intended production URL | Source / compatibility |
| --- | --- |
| `https://www.themelusine.co.uk/` | `index.html`; keep homepage canonical as currently declared. |
| `https://www.themelusine.co.uk/menu.html` | `menu.html`; food and drinks anchors retained. |
| `https://www.themelusine.co.uk/private-hire.html` | `private-hire.html`; email and telephone contact remains available without a backend. |
| `https://www.themelusine.co.uk/events.html` | `events.html`. |
| `https://www.themelusine.co.uk/about.html` | `about.html`; includes the story gallery. |
| `https://www.themelusine.co.uk/gallery.html` | `gallery.html`. |
| `https://www.themelusine.co.uk/drinks.html` | Existing compatibility file redirects to `menu.html#drinks`. Preserve it; a host-supported permanent redirect can later replace it. |

Extensionless `/menu`, `/about` and `/events` were not live Wix pages in the audit. GitHub Pages currently resolves extensionless HTML routes, but the future host must explicitly support or redirect any desired aliases. Do not rely on that preview behaviour or invent missing legacy redirects. Normalise apex/www, HTTPS and duplicate `/index.html` only when the chosen host and canonical policy are approved, and avoid redirect loops.

## Internal source and deployment boundaries

GitHub Pages settings were checked read-only: `build_type: legacy`, source `main`, path `/`, no custom domain. There is no `.nojekyll` file. The font lab is now `_development/font-lab.html`, with its own `noindex, nofollow`; `_config.yml` excludes `_development`. Jekyll also excludes underscore-prefixed folders by default ([GitHub documentation](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll)). This document belongs to the same excluded folder.

After an approved push, verify both `/font-lab.html` and `/_development/font-lab.html` return 404 on the published preview. They have not been claimed absent on the current unchanged deployment. Local development servers can still open the retained source. If deployment later switches to raw static copying, `.nojekyll`, or another host, honour the same exclusions explicitly; never upload the full development checkout. No main page received a `noindex` directive.

## Controlled migration sequence — not performed

1. Obtain Theodore's final design/content approval, approved legal documents, current PDF originals, the brochure-pricing decision, and decisions for legacy offers/placeholders. Resolve audit content questions (including brochure capacity differences, event hours/offers and the wine-origin discrepancy) without changing unconfirmed information.
2. Obtain Search Console/analytics and inbound-link route exports. Extend this inventory with real historical URLs and assign equivalent destinations or explicit 404/410 decisions.
3. Choose hosting with the required permanent HTTP redirects and error-status support. Agree who controls domain registration, hosting, deployment and rollback. No new account or service has been configured in this pass.
4. Stage the six approved pages, assets, legal documents and original PDFs independently of Wix. Apply the internal-source exclusions. Configure only approved redirects; do not forward unrelated placeholders to the homepage. Prepare a branded error page for the chosen deployment base and ensure unknown URLs return an actual 404 rather than a soft 200. No error-page or redirect deployment has been performed here.
5. Preserve production canonicals and the absolute Open Graph URLs now in the source. After production assets are staged, fetch all six social image URLs over HTTPS and test social previews. They cannot yet be validated as serving these new assets on the current Wix domain.
6. Prepare the final host's public robots/sitemap configuration and approved route list. Check that production is crawlable and no staging restriction carries over; include approved legal routes once hosted. The current Wix sitemaps and robots file are not replacements for this work.
7. Before approved DNS changes, export and back up the existing zone. The audit identified Wix web hosting, domaincontrol nameservers and Microsoft 365 mail. Preserve existing MX, SPF, DKIM, DMARC and verification records where present; do not substitute website records for email records. Check Search Console ownership and its verification method before leaving Wix.
8. With explicit approval and a rollback window, deploy and switch only the required web records. Verify HTTPS, canonical host, every inventory route, all three PDFs, legal links, contact/booking actions, no-JS navigation, footer focus and images. Test production social previews and publish the approved sitemap. Check email separately without changing its configuration.
9. Confirm Search Console coverage, old URL responses and real enquiries/bookings after launch. Retain Wix rollback access until independent files, redirects and legal pages are confirmed working.

## Approval and launch gates

- **Theodore:** final website/content approval; legal documents; independent PDF hosting and events-brochure pricing visibility; legacy “Taste of the City” offer and placeholder retirement; hosting/cutover/rollback ownership; unresolved business-content questions from the audit.
- **Technical before domain migration:** independent legal/PDF availability, approved redirect coverage and status codes, production HTTPS/host/crawl configuration, final social-image retrieval and staging-to-production regression checks.
- **Optional later capabilities:** Cloudflare/Resend delivery, online form activation and consented live GA4 remain out of scope. Working email and telephone enquiry alternatives remain in place, so those services are not prerequisites for the current contact experience.
- **Publication approval:** the user authorised the production-branch push on 11 October 2026. This publishes the GitHub Pages preview; domain migration remains separate. No DNS, Wix, mailbox or analytics configuration has been changed.
