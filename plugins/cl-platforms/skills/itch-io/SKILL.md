---
name: itch-io
description: "Publish on itch.io: page, HTML5 zip limits, builds per OS, butler channels, jam entries. Use when itch.io, a jam page, or a first public build comes up."
tier: free
tags: ["itch-io", "web", "html5", "windows", "macos", "linux", "game-jam", "release"]
---

# itch.io

itch.io is open to anyone, takes minutes to set up, and suits jams, demos, prototypes, and first releases. Most failures are upload limits and path mistakes, so check them before upload.

## When to use

- The user mentions itch.io, a jam submission, or wants a public link fast.
- A browser build fails to load on itch.io (blank screen, 403, missing files).
- Setting a price, pay-what-you-want, or a demo next to a paid build.

## Procedure

1. **Read the facts.** Open `references/itch-facts.md` for upload limits, revenue share, and payout timing.
2. **Choose the project kind.** HTML (plays in the browser) or Downloadable (installers or zips per OS). HTML5 games can only take donations; to sell, the kind must be Downloadable. A paid download plus a free browser demo on a second page is a common setup.
3. **Prepare an HTML5 build.**
   - Zip with `index.html` at the root, relative paths only (projects live in a subfolder), exact filename case, and HTTPS for any outside request.
   - Stay inside the limits: 1,000 files, 500MB extracted, 200MB per file, 240-character paths. Over the limit, ship it as a download instead.
   - Pick embed size or click-to-launch fullscreen. Turn on Mobile Friendly only after testing on a phone.
   - Unity or Godot builds that need special headers (SharedArrayBuffer for threads): check the current itch.io settings, and test before announcing. TODO(verify: the itch.io HTML5 docs page does not mention the header option) the current header option.
4. **Upload with butler**, itch.io's command-line uploader: `butler login`, then `butler push <build-folder> <user>/<game>:<channel>` with one channel per platform (`html5`, `windows`, `mac`, `linux`). butler sends only the changed bytes and versions each push. Add `--userversion` to tag the version.
5. **Set money and payouts (the user does this).** Pick a price or pay-what-you-want, the open revenue share (default 10%), and a payout mode: direct to PayPal or Stripe, or collected by itch.io and paid out later (itch.io handles EU VAT in that mode). Never enter payment details for the user.
6. **Fill the page**: cover image, screenshots, short description, tags, controls, and a devlog post for each update. For jams, submit to the jam page before the deadline.

## Checks

- The browser build loads from a fresh incognito window, with sound starting after the first click.
- No 403 or 404 in the console (folder paths, case mismatches).
- Every butler channel shows the expected version.
- If the game collects data or has ads, see `cl-compliance`. Not legal advice; have a lawyer review before launch.

## Output

The butler commands, a page checklist, and the browser test result.

Finish with the Crunchless handoff (router), with Evidence: <butler status output, browser console check>; Verify: open the page in incognito and play to the first checkpoint; Open: <TODO(verify) items>.
