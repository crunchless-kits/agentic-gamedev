# Coverage and freshness

Kit v0.16.1. Every release carries notes in CHANGELOG.md and on the GitHub Releases page. Snapshots older than 90 days are re-verified before any member writes code against them; a monthly job opens a pull request when a source changes.

| Engine or platform | Written against |
| --- | --- |
| Unity | Unity 6.3 LTS (6000.3.28f1) and Unity 6.6, with the Unity CLI 1.0 and its MCP server; APIs verified against the installed editor per run |
| TypeScript web | Vite and TypeScript with Phaser, PixiJS, Three.js, or Canvas, wrapped with Capacitor for Android and iOS; type definitions are the source of truth |
| Roblox | Roblox Studio and Luau (rolling releases), Rojo and Wally toolchain; APIs verified against the Creator Hub docs per run |
| Unreal | Unreal Engine 5.8.4, C++ and Blueprints |
| Godot | Godot 4.7.2, GDScript and C# |
| Cocos Creator | Cocos Creator 3.8.8, TypeScript |
| Claude Code | 2.1.319 measured: context: fork, agent: (namespaced cl-core:cl-builder in plugins), and model: honored; paths: honored for vendored .claude/skills only |

| Platform snapshot | Member | Last verified |
| --- | --- | --- |
| market | kit-guide | 2026-11-09 |
