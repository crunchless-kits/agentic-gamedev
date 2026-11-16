#!/usr/bin/env python3
"""Print an Unreal project's facts as JSON. Read-only. Usage: python3 unreal_facts.py <project root>"""
import json, os, re, sys

def read(p):
    try:
        with open(p, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""

def ini_values(text, key):
    return re.findall(rf"^\s*[+\-.!]?{re.escape(key)}\s*=\s*(.+)$", text, re.M)

def main(root):
    out = {"root": os.path.abspath(root)}
    uprojects = [f for f in os.listdir(root) if f.endswith(".uproject")]
    if not uprojects:
        print(json.dumps({"error": "no .uproject in root"})); return 1
    up = json.loads(read(os.path.join(root, uprojects[0])) or "{}")
    out["uproject"] = uprojects[0]
    out["engine"] = up.get("EngineAssociation")
    out["modules"] = [{"name": m.get("Name"), "type": m.get("Type"), "phase": m.get("LoadingPhase")} for m in up.get("Modules", [])]
    out["plugins_enabled"] = sorted(p["Name"] for p in up.get("Plugins", []) if p.get("Enabled"))
    out["plugins_disabled"] = sorted(p["Name"] for p in up.get("Plugins", []) if not p.get("Enabled", True))
    out["target_platforms"] = up.get("TargetPlatforms", [])

    eng = read(os.path.join(root, "Config", "DefaultEngine.ini"))
    game = read(os.path.join(root, "Config", "DefaultGame.ini"))
    inp = read(os.path.join(root, "Config", "DefaultInput.ini"))
    out["game_default_map"] = ini_values(eng, "GameDefaultMap")
    out["editor_startup_map"] = ini_values(eng, "EditorStartupMap")
    out["game_instance"] = ini_values(eng, "GameInstanceClass")
    out["default_player_input"] = ini_values(inp, "DefaultPlayerInputClass")
    out["world_partition_hint"] = "WorldPartition" in eng
    out["lumen"] = ini_values(eng, "r.DynamicGlobalIlluminationMethod")
    out["nanite"] = ini_values(eng, "r.Nanite.ProjectEnabled")
    out["project_version"] = ini_values(game, "ProjectVersion")
    out["maps_to_cook"] = ini_values(game, "MapsToCook")

    targets, build_cs, plugins_local = [], [], []
    src = os.path.join(root, "Source")
    sizes = {"uasset": 0, "umap": 0}
    counts = {"uasset": 0, "umap": 0, "cpp": 0, "h": 0}
    skip = {"Intermediate", "Saved", "Binaries", "DerivedDataCache", ".git"}
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if x not in skip]
        for f in files:
            p = os.path.join(d, f)
            ext = f.rsplit(".", 1)[-1].lower()
            if f.endswith(".Target.cs"): targets.append(os.path.relpath(p, root))
            elif f.endswith(".Build.cs"): build_cs.append(os.path.relpath(p, root))
            elif f.endswith(".uplugin"): plugins_local.append(os.path.relpath(p, root))
            if ext in counts: counts[ext] += 1
            if ext in sizes:
                try: sizes[ext] += os.path.getsize(p)
                except OSError: pass
    out["targets"], out["build_cs"], out["project_plugins"] = targets, build_cs, plugins_local
    out["counts"] = counts
    out["content_mb"] = {k: round(v / 1048576, 1) for k, v in sizes.items()}
    out["has_source"] = os.path.isdir(src)

    gi = read(os.path.join(root, ".gitignore"))
    ga = read(os.path.join(root, ".gitattributes"))
    out["gitignore_missing"] = [x for x in ("Binaries", "Intermediate", "Saved", "DerivedDataCache") if x not in gi]
    out["lfs_uasset"] = ".uasset" in ga and "lfs" in ga
    out["perforce_hint"] = os.path.exists(os.path.join(root, ".p4ignore")) or os.path.exists(os.path.join(root, ".p4config"))
    print(json.dumps(out, indent=2))
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "."))
