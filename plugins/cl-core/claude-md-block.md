## Crunchless

This project has Crunchless specialists installed under `.claude/` (agents, skills, and commands for game development).

- Start game-development work by reading `.claude/skills/cl-router/SKILL.md` when it is present. It maps tasks to specialists and holds the shared working rules.
- Most Crunchless skills are hidden from the Skill tool so the skill list stays short. Reach one through its plugin's hub skill (the router lists them) or read `.claude/skills/<name>/SKILL.md`. Never call the Skill tool on a hidden skill.
{{commands}}
- Rules that apply everywhere: read the project before changing it, never guess a third-party SDK from memory (fetch the current official docs or stop), keep portal, ad, purchase, analytics, and save code behind game-owned interfaces, and measure before and after any performance or feel change.
