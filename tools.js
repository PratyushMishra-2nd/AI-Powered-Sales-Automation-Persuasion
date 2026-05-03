/* OutreachAI Suite — Tools 3-5 */

// ═══════════════════════════════════════
// TOOL 3: RESPONSE ANALYZER
// ═══════════════════════════════════════
document.getElementById('response-form').addEventListener('submit',async e=>{
  e.preventDefault();const btn=document.getElementById('response-submit');setLoading(btn,true);
  const original=sanitize(document.getElementById('r-original').value,2000);
  const reply=sanitize(document.getElementById('r-reply').value,2000);
  const goal=sanitize(document.getElementById('r-goal').value,200);
  try{
    const sys=`You are an expert sales coach analyzing prospect replies. Assess sentiment, buying signals, intent, and urgency. Write the ideal follow-up response.\nRespond ONLY with valid JSON, no markdown fences:\n{"sentiment":"positive|negative|neutral","signals":["<signal1>","<signal2>"],"intent":"<what they actually want>","urgency":<1-5>,"analysis":"<2-3 sentence breakdown>","suggested_reply":"<the ideal response email>"}`;
    const user=`Seller's goal: ${goal||'Book a meeting'}\n\nOriginal email:\n${original}\n\nProspect's reply:\n${reply}`;
    let res=await callAI(sys,user);
    if(!res){res=demoResponse(reply);toast('⚡ Demo mode')}
    const sentiment=requireOneOf(res.sentiment,['positive','negative','neutral'],'neutral');
    const urgency=requireNum(res.urgency,1,5);
    const analysis=requireStr(res.analysis,500);
    const intent=requireStr(res.intent,300);
    const suggested_reply=requireStr(res.suggested_reply,1000);
    const signals=requireArr(res.signals).map(s=>requireStr(s,200)).filter(Boolean);
    const sClass=sentiment==='positive'?'positive':sentiment==='negative'?'negative':'neutral';
    let html=`<div class="output-card highlight"><div class="card-header"><span class="card-tag">Sentiment Analysis</span></div><div class="pill-row"><span class="pill ${sClass}">${escHtml(sentiment.toUpperCase())}</span><span class="pill info">Urgency: ${urgency}/5</span></div><div class="card-body" style="margin-top:.6rem">${escHtml(analysis)}</div></div>`;
    if(signals.length){html+=`<div class="output-card"><div class="card-header"><span class="card-tag cyan">Buying Signals</span></div><div class="card-body">${signals.map(s=>'• '+escHtml(s)).join('\n')}</div></div>`}
    html+=`<div class="output-card"><div class="card-header"><span class="card-tag green">Intent</span></div><div class="card-body">${escHtml(intent)}</div></div>`;
    html+=makeCard('Suggested Reply','amber',escHtml(suggested_reply));
    document.getElementById('response-result').innerHTML=html;
    showPanel('response-empty','response-result',true);
  }catch(err){console.error(err);toast('Something went wrong — please try again.')}finally{setLoading(btn,false)}
});

function demoResponse(reply){
  const lower=reply.toLowerCase();
  const pos=lower.includes('interest')||lower.includes('sure')||lower.includes('tell me more')||lower.includes('sounds');
  const neg=lower.includes('not interested')||lower.includes('no thanks')||lower.includes('remove')||lower.includes('unsubscribe');
  const sentiment=neg?'negative':pos?'positive':'neutral';
  const signals=pos?['Expressed openness to learning more','Engaged with specific details']:neg?['Clear rejection signal','Low priority indicator']:['Non-committal but responded','Possible timing concern'];
  return{sentiment,signals,intent:pos?'Genuinely curious but not yet committed — needs a concrete reason to take the next step.':neg?'Not interested right now. May be worth revisiting in 3-6 months with a different angle.':'On the fence — they responded (good sign) but need more value before committing time.',urgency:pos?4:neg?1:2,analysis:pos?'This is a warm reply. They took the time to engage, which puts them in the top 10% of cold outreach responses. Strike while the iron is hot — be specific about next steps.':neg?'A clear pass. Don\'t burn the bridge. Acknowledge gracefully and leave the door open for future timing.':'They replied but didn\'t commit — classic "interested but cautious." Your next move should add value without asking for more of their time.',suggested_reply:pos?'Thanks for the reply! Rather than a generic overview, I\'d love to share a 2-min walkthrough specific to your setup.\n\nWould Thursday or Friday work for a quick 15-min call? Happy to work around your schedule.':neg?'Totally understand — appreciate you letting me know. I\'ll keep this off your plate.\n\nIf anything changes down the road, happy to reconnect. Wishing you a great quarter.':'Got it — no rush at all. I put together a quick one-pager that shows exactly how this works for teams like yours.\n\nWant me to send it over? Zero commitment, just context.'};
}

// ═══════════════════════════════════════
// TOOL 4: OBJECTION SIMULATOR
// ═══════════════════════════════════════
let currentObjection='';
document.getElementById('objection-form').addEventListener('submit',async e=>{
  e.preventDefault();const btn=document.getElementById('objection-submit');setLoading(btn,true);
  const product=sanitize(document.getElementById('obj-product').value,200);
  const persona=sanitize(document.getElementById('obj-persona').value,200);
  const scenario=document.getElementById('obj-scenario').value;
  const scenarioSafe=requireOneOf(scenario,['random','price','timing','competitor','authority','need'],'random');
  try{
    const sys=`You are a realistic sales prospect generating tough but realistic objections. Stay in character.\nRespond ONLY with valid JSON, no markdown fences:\n{"objection":"<the prospect's objection, 2-3 sentences, realistic and challenging>","type":"price|timing|competitor|authority|need","difficulty":"easy|medium|hard","context":"<brief context about why this objection is common>"}`;
    const user=`You are: ${persona}\nSeller is pitching: ${product}\nObjection type: ${scenarioSafe==='random'?'any realistic type':scenarioSafe}`;
    let res=await callAI(sys,user);
    if(!res){res=demoObjection(product,persona,scenarioSafe);toast('⚡ Demo mode')}
    const objection=requireStr(res.objection,500);
    const difficulty=requireOneOf(res.difficulty,['easy','medium','hard'],'medium');
    const context=requireStr(res.context,300);
    currentObjection=objection;
    const diffClass=difficulty==='hard'?'red':difficulty==='medium'?'amber':'green';
    let html=`<div class="output-card highlight"><div class="card-header"><span class="card-tag red">Objection</span><span class="card-tag ${diffClass}" style="margin-left:4px">${escHtml(difficulty.toUpperCase())}</span></div><div class="card-body" style="font-size:.95rem"><em>"${escHtml(objection)}"</em></div></div>`;
    html+=`<div class="output-card"><div class="card-header"><span class="card-tag">Context</span></div><div class="card-body">${escHtml(context)}</div></div>`;
    document.getElementById('objection-result').innerHTML=html;
    showPanel('objection-empty','objection-result',true);
    document.getElementById('sim-response-area').classList.remove('hidden');
    document.getElementById('obj-reply').value='';
    document.getElementById('obj-reply').focus();
  }catch(err){console.error(err);toast('Something went wrong — please try again.')}finally{setLoading(btn,false)}
});

document.getElementById('score-btn').addEventListener('click',async()=>{
  const reply=sanitize(document.getElementById('obj-reply').value,1000);
  if(!reply){toast('Write your response first');return}
  const btn=document.getElementById('score-btn');setLoading(btn,true);
  const product=sanitize(document.getElementById('obj-product').value,200);
  try{
    const sys=`You are a sales coach scoring a rep's objection response. Score 1-10 on empathy, reframe quality, value reinforcement, CTA strength. Give an overall score and specific improvement tips.\nRespond ONLY with valid JSON, no markdown fences:\n{"overall":<1-10>,"empathy":<1-10>,"reframe":<1-10>,"value":<1-10>,"cta":<1-10>,"feedback":"<2-3 sentences>","improved_version":"<a better version of their response>"}`;
    const user=`Product being sold: ${product}\n\nObjection: "${currentObjection}"\n\nRep's response: "${reply}"`;
    let res=await callAI(sys,user);
    if(!res){res=demoScore(reply);toast('⚡ Demo mode')}
    const overall=requireNum(res.overall,1,10);
    const empathy=requireNum(res.empathy,1,10);
    const reframe=requireNum(res.reframe,1,10);
    const value=requireNum(res.value,1,10);
    const cta=requireNum(res.cta,1,10);
    const feedback=requireStr(res.feedback,500);
    const improved=requireStr(res.improved_version,1000);
    const cls=overall>=7?'high':overall>=5?'mid':'low';
    let html=document.getElementById('objection-result').innerHTML;
    html+=`<div class="output-card"><div class="card-header"><span class="card-tag green">Your Score</span></div><div class="score-row"><div class="score-badge ${cls}">${overall}</div><div class="score-detail"><div class="score-label">Overall Score</div>Empathy: ${empathy}/10 · Reframe: ${reframe}/10 · Value: ${value}/10 · CTA: ${cta}/10</div></div></div>`;
    html+=makeCard('Feedback','amber',escHtml(feedback));
    html+=makeCard('Improved Version','cyan',escHtml(improved));
    document.getElementById('objection-result').innerHTML=html;
  }catch(err){console.error(err);toast('Something went wrong — please try again.')}finally{setLoading(btn,false)}
});

function demoObjection(product,persona,scenario){
  const objections={price:{objection:`Honestly, we've looked at tools like ${product} before, and the pricing never made sense for our team size. We'd need to see a very clear ROI before even considering bringing this to finance.`,difficulty:'hard'},timing:{objection:`I appreciate the outreach, but we just rolled out a new process last quarter and the team is still adjusting. Adding another tool right now would create more chaos than value.`,difficulty:'medium'},competitor:{objection:`We're already using [competitor] and it's deeply embedded in our workflow. Switching would mean retraining 30+ reps and migrating all our templates. That's a big ask.`,difficulty:'hard'},authority:{objection:`This sounds interesting, but I'm not the person who makes these decisions. Our CRO handles all tool purchases and she's pretty set on our current stack.`,difficulty:'easy'},need:{objection:`I'm not sure we actually need this. Our current process is working fine — we hit quota last quarter. Why fix what isn't broken?`,difficulty:'medium'}};
  const type=scenario==='random'?['price','timing','competitor','authority','need'][Math.floor(Math.random()*5)]:scenario;
  const o=objections[type]||objections.price;
  return{...o,type,context:`This is one of the most common objections ${persona}s raise. It tests whether you can acknowledge their concern without being defensive, then reframe the conversation.`};
}

function demoScore(reply){
  const len=reply.length;const hasQuestion=reply.includes('?');
  const sc=Math.min(10,Math.max(3,Math.round(len/40+(hasQuestion?2:0))));
  return{overall:sc,empathy:Math.min(10,sc+1),reframe:sc,value:Math.max(3,sc-1),cta:hasQuestion?sc:Math.max(3,sc-2),feedback:sc>=7?`Strong response. You acknowledged their concern without being defensive and pivoted to value effectively. ${hasQuestion?'Good use of a question to keep the conversation open.':'Consider ending with a question to keep the conversation open.'}`:`Your response could use more empathy upfront — acknowledge their position before pivoting. ${hasQuestion?'':'End with a clear but low-pressure question to keep the door open.'} Try to connect your reframe to a specific, measurable outcome.`,improved_version:`I completely understand — that's a valid concern and I hear it a lot.\n\nWhat I've seen work well for teams in a similar position is starting with a small pilot. No full rollout, no big commitment. Just enough to see if the numbers move.\n\nWould it be worth a 15-minute look at how that might work for your team?`};
}

// ═══════════════════════════════════════
// TOOL 5: CALL PREP BRIEF
// ═══════════════════════════════════════
document.getElementById('callprep-form').addEventListener('submit',async e=>{
  e.preventDefault();const btn=document.getElementById('callprep-submit');setLoading(btn,true);
  const d={
    name:sanitize(g('cp-name'),100),role:sanitize(g('cp-role'),100),
    company:sanitize(g('cp-company'),100),context:sanitize(g('cp-context'),1000),
    product:sanitize(g('cp-product'),200),competitors:sanitize(g('cp-competitors'),200)
  };
  try{
    const sys=`You are a sales strategist creating a call prep brief. Provide key talking points, likely objections with rebuttals, competitive positioning, conversation openers, and discovery questions.\nRespond ONLY with valid JSON, no markdown fences:\n{"summary":"<1-2 sentence prospect summary>","openers":["<opener1>","<opener2>"],"talking_points":["<point1>","<point2>","<point3>"],"objections":[{"objection":"<obj>","rebuttal":"<rebuttal>"}],"competitive_intel":"<positioning vs competitors>","questions":["<q1>","<q2>","<q3>"]}`;
    const user=`Meeting with: ${d.name}, ${d.role} at ${d.company}\nContext: ${d.context}\nMy product: ${d.product}\nKnown competitors: ${d.competitors||'Unknown'}`;
    let res=await callAI(sys,user);
    if(!res){res=demoCallPrep(d);toast('⚡ Demo mode')}
    const summary=requireStr(res.summary,300);
    const openers=requireArr(res.openers).map(o=>requireStr(o,300)).filter(Boolean);
    const talking_points=requireArr(res.talking_points).map(t=>requireStr(t,300)).filter(Boolean);
    const objections=requireArr(res.objections).map(o=>({objection:requireStr(o.objection,300),rebuttal:requireStr(o.rebuttal,300)})).filter(o=>o.objection);
    const competitive_intel=requireStr(res.competitive_intel,500);
    const questions=requireArr(res.questions).map(q=>requireStr(q,300)).filter(Boolean);
    let html=makeCard('Prospect Summary','','<strong>'+escHtml(summary)+'</strong>','highlight');
    html+=`<div class="output-card"><div class="card-header"><span class="card-tag cyan">Conversation Openers</span></div><div class="card-body">${openers.map(o=>'• '+escHtml(o)).join('\n')}</div></div>`;
    html+=`<div class="output-card"><div class="card-header"><span class="card-tag green">Talking Points</span></div><div class="card-body">${talking_points.map((t,i)=>(i+1)+'. '+escHtml(t)).join('\n\n')}</div></div>`;
    let objHtml=objections.map(o=>`<strong>❌ "${escHtml(o.objection)}"</strong>\n✅ ${escHtml(o.rebuttal)}`).join('\n\n');
    html+=makeCard('Likely Objections + Rebuttals','red',objHtml);
    if(competitive_intel)html+=makeCard('Competitive Intel','amber',escHtml(competitive_intel));
    html+=`<div class="output-card"><div class="card-header"><span class="card-tag">Discovery Questions</span></div><div class="card-body">${questions.map(q=>'→ '+escHtml(q)).join('\n')}</div></div>`;
    document.getElementById('callprep-result').innerHTML=html;
    showPanel('callprep-empty','callprep-result',true);
  }catch(err){console.error(err);toast('Something went wrong — please try again.')}finally{setLoading(btn,false)}
});

function demoCallPrep(d){
  return{
    summary:`${d.name} is a ${d.role} at ${d.company}. ${d.context.split('.')[0]}. Likely evaluating solutions in a competitive market — focus on differentiation and measurable outcomes.`,
    openers:[`I saw that ${d.company} is ${d.context.split('.')[0].toLowerCase()} — curious how that's impacting your team's priorities this quarter.`,`Before we dive in, I'd love to understand what "success" looks like for you in your role right now.`],
    talking_points:[`${d.product} reduces ramp-up time by 60% — directly relevant given ${d.company}'s growth stage.`,`Unlike generic tools, this is built specifically for ${d.role}s who need speed without sacrificing quality.`,`The ROI model shows payback within 45 days for teams at ${d.company}'s scale.`],
    objections:[{objection:'We already have a solution for this',rebuttal:`That makes sense — most teams do. The question isn't whether you have a tool, it's whether it's keeping up with your growth. A lot of ${d.role}s tell me their current setup worked great at 50 reps but breaks at 200.`},{objection:'We need to think about it',rebuttal:`Totally fair. What would be most helpful — a one-pager you can share with the team, or a quick sandbox they can try? I want to make this easy, not add to your plate.`}],
    competitive_intel:d.competitors?`Compared to ${d.competitors}: our edge is speed-to-value and personalization depth. Most competitors require 2-4 weeks of setup. We're live in 48 hours with full integration.`:`Position against likely alternatives by emphasizing: faster implementation (48hrs vs weeks), no training required, and measurable ROI within the first month.`,
    questions:[`What's your current process for this, and where does it create the most friction?`,`If you could fix one thing about your current workflow, what would it be?`,`Who else would need to be involved in evaluating something like this?`]
  };
}

// ── Keyboard shortcut: Ctrl+Enter ──
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){const active=document.querySelector('.tab-content.active form');if(active&&active.checkValidity())active.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));else if(active)active.reportValidity()}});
