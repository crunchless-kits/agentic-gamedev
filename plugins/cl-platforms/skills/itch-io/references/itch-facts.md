# itch.io Facts

**Role: REFERENCE.** Dated facts for `itch-io`. Re-check if this file is older than 90 days.

Verified 2026-11-15.

## HTML5 Uploads

| Fact | Value | Source |
|---|---|---|
| Format | ZIP only, with `index.html` at the root; or a single HTML file | https://itch.io/docs/creators/html5 |
| Limits | At most 1,000 files, 500MB extracted, 200MB per file, 240-character paths | same |
| Paths | Relative only; filenames case sensitive; folder requests return 403 | same |
| Outside requests | HTTPS only | same |
| Compression | `.br` served as brotli; html, js, css, wasm, pck auto-gzipped | same |
| Selling | HTML5 projects take donations only; set kind to Downloadable to sell | same |
| SharedArrayBuffer | Not covered on the HTML5 page. TODO(verify: not mentioned on the HTML5 docs page, no second official source found) | same |

## Money

| Fact | Value | Source |
|---|---|---|
| Revenue share | Open revenue sharing; seller picks the itch.io share, default 10%, can be 0% | https://itch.io/docs/creators/payments, https://itch.io/updates/introducing-open-revenue-sharing |
| Payout modes | Direct to you (PayPal or Stripe per purchase) or collected by itch.io and paid later; EU VAT automatic when collected | https://itch.io/docs/creators/faq |
| Payout timing | Collected revenue is available 7 days after purchase (up to 30 days in some cases, such as a permanently closed balance). A payout needs at least 7 days after you create it; staff review typically takes 10 to 14 days, and first-time sellers or high-risk payouts can take longer. Tax information must be validated first | https://itch.io/docs/creators/payments |

## Tools

| Fact | Value | Source |
|---|---|---|
| butler | Command-line uploader with patching and channels: `butler login`, `butler push <dir> <user>/<game>:<channel>`, `butler status <user>/<game>` | https://itch.io/docs/butler/ |

## Changelog

| Date | Change |
|---|---|
| 2026-11-15 | First version for v0.15 |
| 2026-11-15 | V2 verification pass on open fact markers |
