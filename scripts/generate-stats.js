const fs = require("fs");
const path = require("path");

const USER = process.env.GITHUB_USERNAME || process.env.GITHUB_REPOSITORY_OWNER;
const TOKEN = process.env.GITHUB_TOKEN;
const out = path.join(process.cwd(), "assets");
fs.mkdirSync(out, { recursive: true });

async function gh(url) {
  const r = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
    }
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"
  }[c]));
}

function ringSvg(label, value, max, color="#00e7ff") {
  const pct = Math.max(0.04, Math.min(1, value / Math.max(1, max)));
  const C = 2 * Math.PI * 68;
  const offset = C * (1-pct);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
<style>
text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.num{font-size:30px;font-weight:700;fill:#fff}
.label{font-size:12px;letter-spacing:2px;fill:#8b949e}
.ring{animation:load 1.8s ease-out forwards}
.pulse{animation:pulse 2.4s ease-in-out infinite}
@keyframes load{from{stroke-dashoffset:${C}}to{stroke-dashoffset:${offset}}}
@keyframes pulse{0%,100%{opacity:.65}50%{opacity:1}}
</style>
<defs>
 <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
  <feGaussianBlur stdDeviation="4" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
 </filter>
</defs>
<circle cx="100" cy="100" r="68" fill="none" stroke="#161b22" stroke-width="7"/>
<circle class="ring pulse" cx="100" cy="100" r="68" fill="none" stroke="${color}" stroke-width="7"
 stroke-linecap="round" transform="rotate(-90 100 100)"
 stroke-dasharray="${C}" stroke-dashoffset="${offset}" filter="url(#glow)"/>
<text class="num" x="100" y="98" text-anchor="middle">${value}</text>
<text class="label" x="100" y="122" text-anchor="middle">${esc(label)}</text>
</svg>`;
}

function clockSvg(hours, total) {
  const cx=260, cy=260, r1=142, r2=195;
  const max=Math.max(...hours,1);
  let ticks="", bars="", labels="";
  for(let h=0;h<24;h++){
    const a=(h/24)*Math.PI*2-Math.PI/2;
    const intensity=hours[h]/max;
    const inner=r1;
    const outer=inner+18+intensity*48;
    const x1=cx+Math.cos(a)*inner, y1=cy+Math.sin(a)*inner;
    const x2=cx+Math.cos(a)*outer, y2=cy+Math.sin(a)*outer;
    bars += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#00e7ff" stroke-width="${3+intensity*5}" stroke-linecap="round" opacity="${0.25+intensity*0.75}" filter="url(#glow)"><animate attributeName="opacity" values="${0.25+intensity*0.5};${0.45+intensity*0.55};${0.25+intensity*0.5}" dur="${2+(h%5)*0.25}s" repeatCount="indefinite"/></line>`;
    if(h%3===0){
      const lx=cx+Math.cos(a)*225, ly=cy+Math.sin(a)*225+5;
      labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${String(h).padStart(2,"0")}</text>`;
    }
  }
  const peak=hours.indexOf(max);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520">
<style>
text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;fill:#8b949e;font-size:13px}
.title{fill:#fff;font-size:19px;font-weight:700;letter-spacing:3px}.value{fill:#00e7ff;font-size:14px}
.orbit{stroke-dasharray:5 12;animation:spin 30s linear infinite;transform-origin:260px 260px}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
<defs><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="260" cy="260" r="196" fill="none" stroke="#21262d"/>
<circle class="orbit" cx="260" cy="260" r="178" fill="none" stroke="#00e7ff" opacity=".35"/>
${bars}${labels}
<circle cx="260" cy="260" r="92" fill="#0d1117" stroke="#00e7ff" opacity=".95" filter="url(#glow)"/>
<text class="title" x="260" y="246" text-anchor="middle">ACTIVITY</text>
<text class="value" x="260" y="275" text-anchor="middle">${total} EVENTS</text>
<text x="260" y="300" text-anchor="middle">PEAK ${String(peak).padStart(2,"0")}:00</text>
</svg>`;
}

async function main(){
  // Public Events API: recent public activity. We use it for the clock.
  const events = await gh(`https://api.github.com/users/${USER}/events/public?per_page=100`);
  const hours=Array(24).fill(0);
  for(const e of events){
    const d=new Date(e.created_at);
    hours[d.getUTCHours()]++;
  }

  // Search API gives useful public totals for authored commits/PRs and reviewed PRs.
  // Commit search may be capped/limited depending on GitHub API visibility.
  let commits=0, prs=0, reviews=0;
  try {
    const x=await gh(`https://api.github.com/search/commits?q=author:${encodeURIComponent(USER)}`);
    commits=x.total_count || 0;
  } catch {}
  try {
    const x=await gh(`https://api.github.com/search/issues?q=author:${encodeURIComponent(USER)}+type:pr`);
    prs=x.total_count || 0;
  } catch {}
  try {
    const x=await gh(`https://api.github.com/search/issues?q=reviewed-by:${encodeURIComponent(USER)}+type:pr`);
    reviews=x.total_count || 0;
  } catch {}

  const max=Math.max(commits,prs,reviews,1);
  fs.writeFileSync(path.join(out,"commits-ring.svg"), ringSvg("COMMITS",commits,max));
  fs.writeFileSync(path.join(out,"pull-requests-ring.svg"), ringSvg("PULL REQUESTS",prs,max));
  fs.writeFileSync(path.join(out,"reviews-ring.svg"), ringSvg("REVIEWS",reviews,max));
  fs.writeFileSync(path.join(out,"activity-clock.svg"), clockSvg(hours,events.length));

  console.log({USER, commits, prs, reviews, recentPublicEvents:events.length});
}
main().catch(e=>{console.error(e);process.exit(1)});
