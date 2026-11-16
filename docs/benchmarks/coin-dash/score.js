const fs=require("fs");
const checks={delta:/delta|refresh rate|frame rate|framerate|per frame|frame-bound|fixed timestep|fixed-timestep|Hz/i,
listeners:/listener/i,storage:/localStorage/i,autoplay:/autoplay|user gesture|interaction/i,
pause:/visibilitychange|blur|loses focus|tab is hidden|tab hide|pause/i,canvas:/800.?.?600|devicePixelRatio|device-pixel|responsive|resize|scal/i,
portalsdk:/SDK adapter|portal integration|portal SDK|adapter/i, evidence:/Evidence:/, verify:/Verify:/, route:/Route to:/};
const rows=[];
for (const f of fs.readdirSync(".").filter(f=>f.endsWith(".jsonl")).sort()){
 const l=fs.readFileSync(f,"utf8").trim().split("\n").map(JSON.parse); const r=l.findLast(e=>e.type==="result");
 const t=r.result; const hit={}; for(const [k,re] of Object.entries(checks)) hit[k]=re.test(t)?1:0;
 const seeded=["delta","listeners","storage","autoplay","pause","canvas"].reduce((a,k)=>a+hit[k],0);
 let raw=0; for(const u of Object.values(r.modelUsage)) raw+=u.inputTokens+u.outputTokens+u.cacheReadInputTokens+u.cacheCreationInputTokens;
 const out=Object.values(r.modelUsage).reduce((a,u)=>a+u.outputTokens,0);
 rows.push({run:f.replace(".jsonl",""),seeded,portalsdk:hit.portalsdk,evidence:hit.evidence,verify:hit.verify,route:hit.route,raw,out,cost:+r.total_cost_usd.toFixed(3),s:+(r.duration_ms/1000).toFixed(1),turns:r.num_turns,words:t.split(/\s+/).length});
}
console.table(rows); fs.writeFileSync("../scores.json",JSON.stringify(rows,null,1));
