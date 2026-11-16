#!/usr/bin/env python3
"""Unity project facts for unity-project-audit. Read-only. Prints JSON.
Usage: unity_facts.py <project-root>
"""
import json, os, re, sys

SKIP_DIRS = {"Library", "Temp", "Logs", "obj", "Build", "Builds", ".git", "UserSettings"}


def read(path):
    try:
        return open(path, encoding="utf-8", errors="ignore").read()
    except OSError:
        return ""


def walk(root):
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            yield os.path.join(base, f)


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
    ps = os.path.join(root, "ProjectSettings")
    version = re.search(r"m_EditorVersion:\s*(.+)", read(os.path.join(ps, "ProjectVersion.txt")))
    ser = re.search(r"m_SerializationMode:\s*(\d)", read(os.path.join(ps, "EditorSettings.asset")))
    gfx = read(os.path.join(ps, "GraphicsSettings.asset"))
    rp = re.search(r"m_CustomRenderPipeline:\s*\{fileID:\s*(-?\d+)(?:,\s*guid:\s*([0-9a-f]{32}))?", gfx)
    scenes = re.findall(r"- enabled:\s*(\d)\s*\n\s*path:\s*(.+)", read(os.path.join(ps, "EditorBuildSettings.asset")))
    proj = read(os.path.join(ps, "ProjectSettings.asset"))
    backend = dict(re.findall(r"^\s+(\w+):\s*(\d)\s*$", proj.split("scriptingBackend:")[1].split("\n\n")[0] if "scriptingBackend:" in proj else "", re.M))
    product = re.search(r"productName:\s*(.+)", proj)
    manifest, lock = {}, {}
    try:
        manifest = json.load(open(os.path.join(root, "Packages", "manifest.json")))
    except Exception:
        pass
    try:
        lock = json.load(open(os.path.join(root, "Packages", "packages-lock.json")))
    except Exception:
        pass
    deps = manifest.get("dependencies", {})
    flagged = []
    for name, ver in deps.items():
        v = str(ver)
        if v.startswith(("https://", "git+", "ssh://", "git@")) and "#" not in v: flagged.append({"package": name, "reason": "git dependency without pinned revision"})
        if v.startswith("file:"): flagged.append({"package": name, "reason": "local path dependency"})
        if any(t in v for t in ("-preview", "-pre.", "-exp.")): flagged.append({"package": name, "reason": "preview or experimental version"})
    pipelines = [n for n in deps if n in ("com.unity.render-pipelines.universal", "com.unity.render-pipelines.high-definition")]
    if rp and rp.group(1) != "0" and not pipelines: flagged.append({"package": "render pipeline", "reason": "custom render pipeline asset set but no URP or HDRP package in manifest"})
    if len(pipelines) > 1: flagged.append({"package": "render pipeline", "reason": "both URP and HDRP packages installed"})

    asm = {}
    for p in walk(root):
        if p.endswith(".asmdef"):
            try:
                d = json.load(open(p, encoding="utf-8"))
            except Exception:
                continue
            asm[d.get("name", os.path.basename(p))] = {"path": os.path.relpath(p, root), "references": [r.replace("GUID:", "") for r in d.get("references", [])], "editorOnly": d.get("includePlatforms") == ["Editor"], "rootNamespace": d.get("rootNamespace", "")}
    names = set(asm)
    graph = {n: [r for r in a["references"] if r in names] for n, a in asm.items()}
    cycles, state = [], {}
    def dfs(n, path):
        state[n] = 1
        for m in graph.get(n, []):
            if state.get(m) == 1: cycles.append(path[path.index(m):] + [m])
            elif state.get(m) is None: dfs(m, path + [m])
        state[n] = 2
    for n in graph:
        if state.get(n) is None: dfs(n, [n])

    counts = {"csFiles": 0, "scenes": 0, "prefabs": 0, "resourcesFolders": 0, "editorFolders": 0, "pluginsFolders": 0, "largeBinaries": []}
    hot = {"findObjectOfType": 0, "getComponentInUpdate": 0, "sendMessage": 0, "resourcesLoad": 0, "emptyUpdate": 0, "debugLogInUpdate": 0}
    for p in walk(root):
        rel = os.path.relpath(p, root)
        if not rel.startswith("Assets"): continue
        base = os.path.basename(p)
        if base == "Resources" or rel.endswith("/Resources"): pass
        if p.endswith(".cs"):
            counts["csFiles"] += 1
            s = read(p)
            hot["findObjectOfType"] += len(re.findall(r"FindObjectOfType|FindObjectsOfType|FindAnyObjectByType|FindFirstObjectByType", s))
            hot["sendMessage"] += len(re.findall(r"\.SendMessage\(|\bInvoke\(\s*\"", s))
            hot["resourcesLoad"] += len(re.findall(r"Resources\.Load", s))
            for body in re.findall(r"void\s+(?:Update|LateUpdate|FixedUpdate)\s*\([^)]*\)\s*\{([^}]*)\}", s, re.S):
                if not body.strip(): hot["emptyUpdate"] += 1
                hot["getComponentInUpdate"] += len(re.findall(r"GetComponent", body))
                hot["debugLogInUpdate"] += len(re.findall(r"Debug\.Log", body))
        elif p.endswith(".unity"): counts["scenes"] += 1
        elif p.endswith(".prefab"): counts["prefabs"] += 1
        try:
            sz = os.path.getsize(p)
        except OSError:
            sz = 0
        if sz > 20 * 1024 * 1024: counts["largeBinaries"].append({"path": rel, "bytes": sz})
    for base, dirs, _ in os.walk(os.path.join(root, "Assets")):
        for d in dirs:
            if d == "Resources": counts["resourcesFolders"] += 1
            if d == "Editor": counts["editorFolders"] += 1
            if d == "Plugins": counts["pluginsFolders"] += 1

    gi = read(os.path.join(root, ".gitignore"))
    hygiene = {"gitignoreCovers": {k: (k in gi) for k in ("Library", "Temp", "Logs", "UserSettings", "obj")}, "gitattributesLfs": "lfs" in read(os.path.join(root, ".gitattributes"))}
    webgl = {k: (re.search(rf"{k}:\s*(.+)", proj) or [None, None])[1] for k in ("webGLCompressionFormat", "webGLDecompressionFallback", "webGLExceptionSupport", "webGLMemorySize", "webGLTemplate", "webGLDataCaching", "webGLNameFilesAsHashes")}

    print(json.dumps({
        "root": root, "editorVersion": version.group(1).strip() if version else None, "productName": product.group(1).strip() if product else None,
        "serialization": {"0": "Mixed", "1": "ForceBinary", "2": "ForceText"}.get(ser.group(1) if ser else "", "unknown"),
        "renderPipeline": ("Built-in" if (not rp or rp.group(1) == "0") else {"com.unity.render-pipelines.universal": "URP", "com.unity.render-pipelines.high-definition": "HDRP"}.get(pipelines[0] if pipelines else "", "custom")),
        "pipelinePackages": {n: deps[n] for n in pipelines}, "scriptingBackend": {k: {"0": "Mono", "1": "IL2CPP"}.get(v, v) for k, v in backend.items()},
        "scenesInBuild": [{"enabled": e == "1", "path": p.strip()} for e, p in scenes],
        "packages": {"count": len(deps), "dependencies": deps, "lockPresent": bool(lock), "flagged": flagged},
        "assemblies": {"count": len(asm), "definitions": asm, "cycles": cycles},
        "counts": counts, "codeSmells": hot, "webgl": webgl, "hygiene": hygiene,
    }, indent=2))


if __name__ == "__main__":
    main()
