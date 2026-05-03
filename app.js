/* OutreachAI Suite — Core + Tools 1-2 */

// ── Particles ──
(function(){const c=document.getElementById('particles'),cols=['#a78bfa','#38bdf8','#34d399','#818cf8'];
for(let i=0;i<20;i++){const p=document.createElement('div');p.className='particle';const s=Math.random()*4+2;
p.style.cssText=`width:${s}px;height:${s}px;left:${Math.random()*100}%;background:${cols[i%4]};animation-duration:${Math.random()*20+15}s;animation-delay:${Math.random()*15}s`;c.appendChild(p)}})();

// ── Toast ──
function toast(msg,ms=2200){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),ms)}

// ── API Key — sessionStorage only (cleared when tab closes) ──
const apiEl=document.getElementById('api-key');
apiEl.addEventListener('change',()=>{if(apiEl.value)sessionStorage.setItem('gemini_key',apiEl.value)});
const sk=sessionStorage.getItem('gemini_key');if(sk)apiEl.value=sk;

// ── Tabs ──
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

// ── Tone selector ──
let selectedTone='friendly';
document.querySelectorAll('#tone-selector .tone-btn').forEach(b=>{
  b.addEventListener('click',()=>{document.querySelectorAll('#tone-selector .tone-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedTone=b.dataset.tone});
});

// ── Variant picker ──
let variantCount=3;
document.querySelectorAll('.var-btn').forEach(b=>{
  b.addEventListener('click',()=>{document.querySelectorAll('.var-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');variantCount=+b.dataset.v});
});

// ── Helpers ──
function setLoading(btn,on){btn.querySelector('.btn-label').classList.toggle('hidden',on);btn.querySelector('.btn-loading').classList.toggle('hidden',!on);btn.disabled=on}
function showPanel(emptyId,resultId,showResult){document.getElementById(emptyId).classList.toggle('hidden',showResult);document.getElementById(resultId).classList.toggle('hidden',!showResult)}
function makeCard(tag,tagClass,body,extra=''){return`<div class="output-card ${extra}"><div class="card-header"><span class="card-tag ${tagClass}">${tag}</span><button class="copy-section-btn">📋 Copy</button></div><div class="card-body">${body}</div></div>`}
function copyText(btn){const body=btn.closest('.output-card').querySelector('.card-body').textContent.trim();navigator.clipboard.writeText(body).then(()=>toast('✓ Copied!')).catch(()=>toast('Copy failed'))}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

// Event delegation — replaces inline onclick="copyText(this)" removed from makeCard
document.addEventListener('click',e=>{if(e.target.classList.contains('copy-section-btn'))copyText(e.target)});

// ── Input sanitization ──
function sanitize(s,maxLen=500){return String(s).trim().slice(0,maxLen)}

// ── Schema validators — treat all AI output as untrusted ──
function requireStr(v,maxLen=2000){return typeof v==='string'?v.slice(0,maxLen):''}
function requireNum(v,min=0,max=10){const n=Number(v);return isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):min}
function requireArr(v){return Array.isArray(v)?v:[]}
function requireOneOf(v,allowed,fallback){return allowed.includes(v)?v:fallback}

// ── Gemini API call ──
async function callAI(systemPrompt,userContent){
  const key=apiEl.value.trim();
  if(!key){await new Promise(r=>setTimeout(r,1000));return null;}
  let r;
  try{
    r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        systemInstruction:{parts:[{text:systemPrompt}]},
        contents:[{role:'user',parts:[{text:userContent}]}],
        generationConfig:{temperature:0.85,maxOutputTokens:1200}
      })
    });
  }catch(networkErr){
    console.error('Network error calling Gemini:',networkErr);
    throw new Error('Network error — check your connection.');
  }
  if(!r.ok){
    const e=await r.json().catch(()=>({}));
    console.error('Gemini API error:',e);
    throw new Error('AI request failed — check your API key.');
  }
  const j=await r.json();
  const raw=j.candidates?.[0]?.content?.parts?.[0]?.text?.trim()||'';
  try{
    return JSON.parse(raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/i,''));
  }catch(parseErr){
    console.error('Failed to parse AI response:',raw,parseErr);
    throw new Error('AI returned an unexpected format — please try again.');
  }
}

// ═══════════════════════════════════════
// TOOL 1: OUTREACH GENERATOR
// ═══════════════════════════════════════
document.getElementById('clear-outreach').addEventListener('click',()=>{document.getElementById('outreach-form').reset();showPanel('outreach-empty','outreach-result',false);document.getElementById('outreach-actions').classList.add('hidden');toast('Cleared')});

document.getElementById('outreach-form').addEventListener('submit',async e=>{
  e.preventDefault();const btn=document.getElementById('outreach-submit');setLoading(btn,true);
  const d={
    name:sanitize(g('o-name'),100),role:sanitize(g('o-role'),100),
    company:sanitize(g('o-company'),100),info:sanitize(g('o-info'),500),
    activity:sanitize(g('o-activity'),500),pain:sanitize(g('o-pain'),500),
    product:sanitize(g('o-product'),200),value:sanitize(g('o-value'),300),
    proof:sanitize(g('o-proof'),200),tone:selectedTone
  };
  try{
    const sys=`You are a top 1% sales copywriter. Generate hyper-personalized cold emails.\nRules: Specific personalization hook (NOT generic). Under 120 words. Low-friction CTA. No buzzwords.\nRespond ONLY with valid JSON, no markdown fences:\n{"subject":"<max 8 words>","body":"<email with \\n\\n between paragraphs>","followup":"<day 3 follow-up under 60 words>"}`;
    const user=`Prospect: ${d.name}, ${d.role} at ${d.company}\nCompany: ${d.info}\nRecent Activity: ${d.activity||'N/A'}\nPain Points: ${d.pain||'N/A'}\nMy Product: ${d.product}\nValue Prop: ${d.value}\nSocial Proof: ${d.proof||'N/A'}\nTone: ${d.tone}`;
    let res=await callAI(sys,user);
    if(!res){res=demoOutreach(d);toast('⚡ Demo mode — add API key for AI output')}
    const subject=requireStr(res.subject,100);
    const body=requireStr(res.body,2000);
    const followup=requireStr(res.followup,500);
    const html=makeCard('Subject','',`<strong>${escHtml(subject)}</strong>`,'highlight')+makeCard('Email Body','cyan',escHtml(body))+makeCard('Follow-up (Day 3)','green',escHtml(followup));
    document.getElementById('outreach-result').innerHTML=html;
    showPanel('outreach-empty','outreach-result',true);
    document.getElementById('outreach-actions').classList.remove('hidden');
  }catch(err){console.error(err);toast('Something went wrong — please try again.')}finally{setLoading(btn,false)}
});
function g(id){return document.getElementById(id).value.trim()}

document.getElementById('regen-outreach').addEventListener('click',()=>document.getElementById('outreach-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
document.getElementById('copy-outreach').addEventListener('click',()=>{const cards=document.querySelectorAll('#outreach-result .card-body');const t=Array.from(cards).map(c=>c.textContent.trim()).join('\n\n---\n\n');navigator.clipboard.writeText(t).then(()=>toast('✓ Copied all!'))});

function demoOutreach(d){
  const greet=d.tone==='bold'?d.name+' —':d.tone==='professional'?'Hi '+d.name+',':'Hey '+d.name+',';
  let hook=d.activity?`${d.activity} — that resonated with me.`:`Noticed ${d.company} is ${d.info.split('.')[0].toLowerCase()}.`;
  let bridge=d.pain?`${d.pain.split(',')[0]} is a challenge I hear constantly from ${d.role}s. ${d.product} was built to solve exactly this.`:`${d.product} helps ${d.role}s ${d.value.split('.')[0].toLowerCase()}.`;
  let proof=d.proof?`\n\nFor context: ${d.proof}`:'';
  return{subject:`Quick question, ${d.name.split(' ')[0]}`,body:`${greet}\n\n${hook}\n\n${bridge}${proof}\n\nWorth a 15-min chat this week?`,followup:`Hey ${d.name.split(' ')[0]}, just bumping this — no pressure. Happy to share a one-pager if that's easier.`};
}

// ═══════════════════════════════════════
// TOOL 2: A/B TESTER
// ═══════════════════════════════════════
document.getElementById('clear-ab').addEventListener('click',()=>{document.getElementById('ab-form').reset();showPanel('ab-empty','ab-result',false);toast('Cleared')});

document.getElementById('ab-form').addEventListener('submit',async e=>{
  e.preventDefault();const btn=document.getElementById('ab-submit');setLoading(btn,true);
  const d={
    name:sanitize(g('ab-name'),100),role:sanitize(g('ab-role'),100),
    company:sanitize(g('ab-company'),100),context:sanitize(g('ab-context'),500),
    product:sanitize(g('ab-product'),300)
  };
  try{
    const sys=`Generate cold email variants for A/B testing. Each variant must use a different angle (pain-focused, opportunity-focused, social-proof-focused, curiosity-driven, direct-ask). Each under 100 words with a subject line. Predict performance.\nRespond ONLY with valid JSON, no markdown fences:\n{"variants":[{"angle":"<angle name>","subject":"<subject>","body":"<email>","prediction":"best|good|ok"}],"analysis":"<1-2 sentences on which wins and why>"}`;
    const user=`Number of variants: ${variantCount}\nProspect: ${d.name}, ${d.role} at ${d.company}\nContext: ${d.context}\nProduct: ${d.product}`;
    let res=await callAI(sys,user);
    if(!res){res=demoAB(d);toast('⚡ Demo mode')}
    let html='';
    requireArr(res.variants).forEach((v,i)=>{
      const angle=requireStr(v.angle,100);
      const subject=requireStr(v.subject,150);
      const body=requireStr(v.body,1000);
      const prediction=requireOneOf(v.prediction,['best','good','ok'],'ok');
      const predClass=prediction==='best'?'best':prediction==='good'?'good':'ok';
      html+=`<div class="output-card variant-card"><div class="variant-num">${i+1}</div><div class="card-header"><span class="card-tag">${escHtml(angle)}</span><button class="copy-section-btn">📋 Copy</button></div><div class="card-body"><strong>Subject:</strong> ${escHtml(subject)}\n\n${escHtml(body)}</div><span class="predicted-badge ${predClass}">📊 ${escHtml(prediction.toUpperCase())}</span></div>`;
    });
    const analysis=requireStr(res.analysis,500);
    if(analysis)html+=makeCard('AI Analysis','amber',escHtml(analysis));
    document.getElementById('ab-result').innerHTML=html;
    showPanel('ab-empty','ab-result',true);
  }catch(err){console.error(err);toast('Something went wrong — please try again.')}finally{setLoading(btn,false)}
});

function demoAB(d){
  const angles=['Pain-Focused','Curiosity-Driven','Social Proof'];
  return{variants:angles.slice(0,variantCount).map((a,i)=>({angle:a,subject:i===0?`${d.name.split(' ')[0]}, quick fix for ${d.role} headaches`:i===1?`Weird pattern I noticed at ${d.company}`:`What 200+ teams discovered`,body:i===0?`Hey ${d.name},\n\nI keep hearing from ${d.role}s that ${d.context.split('.')[0].toLowerCase()} creates a lot of friction.\n\n${d.product} — worth a quick look?`:i===1?`${d.name},\n\nSomething interesting: companies like ${d.company} that ${d.context.split('.')[0].toLowerCase()} often leave a lot of pipeline on the table.\n\nCurious if that tracks with what you're seeing?`:`Hi ${d.name},\n\n200+ sales teams use ${d.product.split('.')[0]} to solve exactly the challenge you're facing at ${d.company}.\n\n15 min this week?`,prediction:i===0?'best':i===1?'good':'ok'})),analysis:`Variant 1 (Pain-Focused) likely wins — it leads with a specific, relatable problem that ${d.role}s face daily, creating immediate resonance.`};
}
