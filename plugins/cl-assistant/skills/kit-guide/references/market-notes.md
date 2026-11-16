# Market notes (judgment, dated)

Last verified: 2026-11-09. Refreshed with the monthly snapshot job. Everything here is a starting point for a conversation, labeled judgment unless a source is named; the assistant quotes it as such and never as fact.

## Which engine for which project
- TypeScript web (Phaser, PixiJS, Three.js): fastest iteration, the natural target for web portals and playable ads, deploys anywhere a browser runs; weaker for large 3D or heavy native features.
- Unity: the broadest asset and tooling ecosystem, the default for mobile and 3D, strong for teams with C# experience; builds and licensing need attention; an official Unity agent plugin exists for editor operations.
- Godot 4: lean, open source, strong for 2D and small teams, growing fast among solo developers; smaller third-party ecosystem; web export needs care (threads and headers).
- A new builder with no engine preference: start on TypeScript web for the shortest loop from idea to something playable in a browser; move to an engine when the design needs it.

## Where web games find players
- Portals with SDKs and revenue share: Poki, CrazyGames, GameDistribution, YouTube Playables (snapshots in the kit); Wavedash and Coolmath Games (to be added via portal-recon).
- Each portal has its own lifecycle calls, ad rules, and review process; one game, one adapter per portal.
- Playable ads are a separate market: short interactive creatives for user acquisition, judged by size caps and compliance, sold to mobile publishers.

## What buyers of kits like this complain about (anecdotal, from blogs and vendor posts)
- Outdated or invented engine APIs (the most cited pain, and why vendors ship official plugins).
- Long sessions losing context; agents unable to judge feel; usage limits under parallel work; storefronts flooded with low-effort games.

## How this kit answers those
- Verify-first notes with dates for platform SDKs; `paths`-scoped skills and bundles to limit context; budget mode and checkpoints for usage limits; slop check and mechanic critique for feel and quality; audits with evidence instead of claims.
