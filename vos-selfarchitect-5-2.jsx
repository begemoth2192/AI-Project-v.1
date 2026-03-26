import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   VOS — SELFARCHITECT v2.0
   Identity Transformation Engine
   ═══════════════════════════════════════════════════════════════════ */

// ─── BROWSER-SAFE STORAGE ───────────────────────────────────────────
const storage = {
  get: async (key) => {
    return { value: localStorage.getItem(key) };
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
  },
  delete: async (key) => {
    localStorage.removeItem(key);
  }
};

// ─── PHASE COLORS ───────────────────────────────────────────────────
const PHASE = {
  mentality:   { label:"Mentality",    color:"#00B4FF", colorDark:"#0088CC", colorGlow:"#00B4FF40", icon:"🧠", gradient:"linear-gradient(135deg,#00B4FF,#0066DD)" },
  physicality: { label:"Physicality",  color:"#E85D4A", colorDark:"#C44535", colorGlow:"#E85D4A40", icon:"💪", gradient:"linear-gradient(135deg,#E85D4A,#B83A2A)" },
  spirituality:{ label:"Spirituality", color:"#9B59E8", colorDark:"#7B3BC4", colorGlow:"#9B59E840", icon:"✨", gradient:"linear-gradient(135deg,#9B59E8,#6C2DBB)" },
};

// ─── APP COLORS ─────────────────────────────────────────────────────
const C = {
  ocean:"#0C2340", oceanLight:"#133254", oceanMid:"#1A3F68",
  tan:"#D4B896", tanLight:"#E8D5BC", tanDim:"#A89070",
  white:"#FFFFFF", offWhite:"#F8F7F5", warmGray:"#E8E4DF", lightGray:"#F0EEEB",
  chatBg:"#FFFFFF", userBubble:"#0C2340", aiBubble:"#F0EEEB",
  textDark:"#1A1A1A", textMid:"#555555", textLight:"#888888",
  red:"#8B2232", redDark:"#6B1A28",
  accent:"#0088CC", success:"#2EAA6B", warning:"#E8A838",
  gold:"#D4A853",
};

// ─── ARCHETYPES ─────────────────────────────────────────────────────
const ARCHETYPES = {
  sovereign:   { name:"The Sovereign",   icon:"👑", drive:"Order & Structure",  strengths:["Responsibility","Organization","Strategic thinking","Stability"],  weaknesses:["Controlling","Fear of chaos","Difficulty delegating"],  shadow:"The Tyrant",     figures:["Marcus Aurelius","Queen Elizabeth I"],  growth:"Learn to empower others without losing structure" },
  relational:  { name:"The Relational",  icon:"💫", drive:"Connection",         strengths:["Empathy","Aesthetic appreciation","Deep emotional bonds"],          weaknesses:["Loss of self-identity","Over-sensitivity","Fear of rejection"],  shadow:"The Addict",    figures:["Rumi","Maya Angelou"],                  growth:"Build self-worth independent of others' validation" },
  guardian:    { name:"The Guardian",    icon:"🛡️", drive:"Protection",         strengths:["Discipline","Loyalty","Boundary protection","Nurturing"],          weaknesses:["Burnout","Martyr complex","Unnecessary aggression"],             shadow:"The Mercenary", figures:["Alexander the Great","Florence Nightingale"], growth:"Protect without sacrificing your own needs" },
  intellectual:{ name:"The Intellectual",icon:"🧠", drive:"Knowledge",          strengths:["Analysis","Strategic foresight","Mastery of logic"],               weaknesses:["Isolation","Analysis paralysis","Emotional detachment"],         shadow:"The Ivory Tower",figures:["Albert Einstein","Marie Curie"],          growth:"Connect knowledge to emotional wisdom" },
  autonomous:  { name:"The Autonomous",  icon:"🧭", drive:"Independence",       strengths:["Self-reliance","Bravery","Pioneer spirit"],                        weaknesses:["Fear of commitment","Restlessness","Social alienation"],         shadow:"The Wanderer",  figures:["Amelia Earhart","Ernest Hemingway"],      growth:"Find freedom within commitment, not from it" },
  transformer: { name:"The Transformer", icon:"🔮", drive:"Change",             strengths:["Intuition","Rapid adaptation","Psychological rebirth"],             weaknesses:["Manipulation","Unreliability","Losing touch with reality"],      shadow:"The Con Artist",figures:["Nikola Tesla","Frida Kahlo"],             growth:"Ground your vision in consistent action" },
};
const PACER_TYPES = { P:"Procedural", A:"Analogous", C:"Conceptual", E:"Evidence", R:"Reference" };

// ─── QUIZ QUESTIONS — 3 PHASES × 5 QUESTIONS ───────────────────────
const QUIZ_PHASES = [
  { key:"mentality", ...PHASE.mentality, questions:[
    { id:1,  q:"How often do you feel unsure about your life direction?", answers:["Almost always","Often","Sometimes","Rarely","Never"], dim:"direction", w:{direction:[5,4,3,2,1],emotional_stability:[1,2,3,4,5]} },
    { id:2,  q:"What motivates you most deeply?", answers:["Achievement","Security","Helping others","Freedom","Recognition"], dim:"motivator", w:{motivator_map:["achievement","security","helping","freedom","recognition"]} },
    { id:3,  q:"When facing a difficult problem, you typically:", answers:["Analyze logically","Trust gut feeling","Ask for perspective","Act immediately","Avoid it"], dim:"approach", w:{approach_map:["analytical","intuitive","social","action","avoidant"]} },
    { id:4,  q:"When someone criticizes you, your first reaction is:", answers:["Reflect on it","Feel hurt","Get defensive","Use it as fuel","Dismiss it"], dim:"resilience", w:{emotional_stability:[5,2,1,3,4],openness:[5,4,1,3,2]} },
    { id:5,  q:"Which fear resonates most with you?", answers:["Powerlessness","Loneliness","Meaninglessness","Feeling trapped","Being a fraud"], dim:"fear", w:{fear_map:["powerlessness","isolation","meaninglessness","entrapment","impostor"]} },
  ]},
  { key:"physicality", ...PHASE.physicality, questions:[
    { id:6,  q:"How disciplined are you with daily routines?", answers:["Very disciplined","Mostly consistent","It depends","Struggle often","No routine"], dim:"discipline", w:{discipline:[5,4,3,2,1]} },
    { id:7,  q:"How do you recharge after a draining day?", answers:["Alone time","Physical activity","Conversation","Creative work","Sleep / escape"], dim:"energy", w:{introversion:[5,2,1,3,4]} },
    { id:8,  q:"How would you rate your current sleep quality?", answers:["Excellent","Good","Average","Poor","Very poor"], dim:"sleep", w:{physical_health:[5,4,3,2,1]} },
    { id:9,  q:"Your relationship with your body is:", answers:["Strong & aware","Working on it","Neutral","Disconnected","Conflicted"], dim:"body", w:{body_awareness:[5,4,3,2,1]} },
    { id:10, q:"What keeps you up at night?", answers:["Unfinished goals","Relationships","Financial stress","Existential questions","General anxiety"], dim:"anxiety", w:{anxiety_map:["goals","relationships","financial","existential","general"]} },
  ]},
  { key:"spirituality", ...PHASE.spirituality, questions:[
    { id:11, q:"How open are you to changing your deepest beliefs?", answers:["Extremely open","Quite open","Somewhat open","Resistant","Very fixed"], dim:"openness", w:{openness:[5,4,3,2,1]} },
    { id:12, q:"What does success look like to you?", answers:["Financial freedom","Inner peace","Impact on others","Personal mastery","Family & love"], dim:"success", w:{success_map:["financial","peace","impact","mastery","relationships"]} },
    { id:13, q:"How do you learn best?", answers:["Step-by-step practice","Stories & examples","Frameworks & systems","Data & evidence","Repetition & review"], dim:"learning", w:{pacer:["P","A","C","E","R"]} },
    { id:14, q:"How would your closest friend describe you?", answers:["The reliable one","The dreamer","The fighter","The wise one","The free spirit"], dim:"identity", w:{archetype_hint:["sovereign","transformer","guardian","intellectual","autonomous"]} },
    { id:15, q:"When you imagine your ideal self in 5 years:", answers:["Calm & grounded","Powerful & influential","Free & adventurous","Connected & loved","Creating meaning"], dim:"vision", w:{vision_map:["sage","ruler","explorer","lover","creator"]} },
  ]},
];

const ALL_QUESTIONS = QUIZ_PHASES.flatMap(p => p.questions);

const CRISIS_KEYWORDS = ["suicide","kill myself","want to die","end it all","can't take this anymore","what's the point","no reason to live","better off dead","self harm","hurt myself","give up on life","no hope","cutting myself","overdose"];

const SUGGESTED_PROMPTS = [
  { icon:"🎨", title:"Unlock Creativity",    prompt:"I want to unlock creativity" },
  { icon:"🎯", title:"Achieve Goals",         prompt:"I want to achieve goals" },
  { icon:"🔑", title:"Find Keystone Actions", prompt:"I want to find the keystone actions" },
  { icon:"⚛️", title:"Atomic Habits",         prompt:"I want to know atomic habits" },
];

// ─── INJECT STYLES ──────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const globalCSS = document.createElement("style");
globalCSS.textContent = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',sans-serif;background:${C.ocean};color:${C.textDark};overflow-x:hidden;-webkit-font-smoothing:antialiased}
  @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeInScale{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes breathe{0%,100%{box-shadow:0 0 20px rgba(12,35,64,.3)}50%{box-shadow:0 0 40px rgba(12,35,64,.5)}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes revealGlow{0%{opacity:0;filter:blur(20px);transform:scale(.5)}60%{opacity:1;filter:blur(5px);transform:scale(1.1)}100%{opacity:1;filter:blur(0);transform:scale(1)}}
  @keyframes typeDots{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
  @keyframes bubbleFloat{0%,100%{transform:translateY(0px)}50%{transform:translateY(-8px)}}
  @keyframes ringPulse{0%{box-shadow:0 0 0 0 rgba(0,136,204,.4)}70%{box-shadow:0 0 0 20px rgba(0,136,204,0)}100%{box-shadow:0 0 0 0 rgba(0,136,204,0)}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes bubbleFadeIn{from{opacity:0;transform:translateY(30px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes bubbleFadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-20px) scale(.9)}}
  @keyframes orbitDot{0%{transform:rotate(0deg) translateX(32px) rotate(0deg)}100%{transform:rotate(360deg) translateX(32px) rotate(-360deg)}}
  .fade-in{animation:fadeIn .5s ease-out forwards}
  input:focus,textarea:focus{outline:none}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}
  ::-webkit-scrollbar-thumb:hover{background:#aaa}
`;
document.head.appendChild(globalCSS);

// ═════════════════════════════════════════════════════════════════════
//  HELPER COMPONENTS
// ═════════════════════════════════════════════════════════════════════
function VosLogo({ size=36, dark=false }) {
  const col = dark ? C.ocean : C.tan;
  const textCol = dark ? C.ocean : C.white;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,cursor:"default"}}>
      <svg width={size} height={size} viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="28" fill="none" stroke={col} strokeWidth="2"/>
        <path d="M20 20 L30 42 L40 20" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="30" cy="17" r="2.5" fill={col}/>
      </svg>
      <span style={{fontFamily:"'Playfair Display',serif",fontSize:size*.5,fontWeight:600,color:textCol,letterSpacing:3}}>VOS</span>
    </div>
  );
}

function TypingDots({ color="#aaa" }) {
  return (
    <div style={{display:"flex",gap:4,padding:"14px 18px"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:7,height:7,borderRadius:"50%",background:color,animation:`typeDots 1.2s infinite ${i*.15}s`}}/>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  PROFILE ANALYSIS
// ═════════════════════════════════════════════════════════════════════
function analyzeProfile(answers) {
  let scores = {introversion:50,openness:50,discipline:50,emotional_stability:50,direction:50,physical_health:50,body_awareness:50};
  let motivator="achievement",fear="uncertainty",learning="C",successVision="mastery",growthArea="mental";
  let archetypeHints = {};

  answers.forEach(a => {
    const q = ALL_QUESTIONS.find(q=>q.id===a.qId);
    if(!q) return;
    const idx = a.answerIndex;
    const w = q.w;
    if(w.direction) scores.direction += (w.direction[idx]-3)*5;
    if(w.emotional_stability) scores.emotional_stability += ((w.emotional_stability[idx]||3)-3)*5;
    if(w.introversion) scores.introversion += ((w.introversion[idx]||3)-3)*5;
    if(w.openness) scores.openness += ((w.openness[idx]||3)-3)*5;
    if(w.discipline) scores.discipline += ((w.discipline[idx]||3)-3)*5;
    if(w.physical_health) scores.physical_health += ((w.physical_health[idx]||3)-3)*5;
    if(w.body_awareness) scores.body_awareness += ((w.body_awareness[idx]||3)-3)*5;
    if(w.motivator_map) motivator = w.motivator_map[idx]||motivator;
    if(w.fear_map) fear = w.fear_map[idx]||fear;
    if(w.pacer) learning = w.pacer[idx]||learning;
    if(w.success_map) successVision = w.success_map[idx]||successVision;
    if(w.archetype_hint){ const h=w.archetype_hint[idx]; archetypeHints[h]=(archetypeHints[h]||0)+1; }
    if(w.vision_map){ const m={sage:"intellectual",ruler:"sovereign",explorer:"autonomous",lover:"relational",creator:"transformer"}; const h=m[w.vision_map[idx]]; if(h) archetypeHints[h]=(archetypeHints[h]||0)+1; }
  });

  if(scores.discipline>65) archetypeHints.sovereign=(archetypeHints.sovereign||0)+2;
  if(scores.discipline<35) archetypeHints.transformer=(archetypeHints.transformer||0)+1;
  if(scores.introversion>65) archetypeHints.intellectual=(archetypeHints.intellectual||0)+1;
  if(scores.openness>65) archetypeHints.autonomous=(archetypeHints.autonomous||0)+1;
  if(fear==="isolation") archetypeHints.relational=(archetypeHints.relational||0)+2;
  if(fear==="powerlessness") archetypeHints.sovereign=(archetypeHints.sovereign||0)+2;
  if(motivator==="freedom") archetypeHints.autonomous=(archetypeHints.autonomous||0)+2;
  if(motivator==="helping") archetypeHints.guardian=(archetypeHints.guardian||0)+2;

  let primary="intellectual",maxS=0;
  Object.entries(archetypeHints).forEach(([k,v])=>{if(v>maxS){maxS=v;primary=k}});
  let secondary="transformer",secS=0;
  Object.entries(archetypeHints).forEach(([k,v])=>{if(v>secS&&k!==primary){secS=v;secondary=k}});
  Object.keys(scores).forEach(k=>{scores[k]=Math.max(10,Math.min(90,scores[k]))});

  return {
    personality:scores, motivator,fear,learning,successVision,growthArea,
    archetype:primary, secondaryArchetype:secondary,
    archetypeData:ARCHETYPES[primary], secondaryData:ARCHETYPES[secondary],
    pacerType:PACER_TYPES[learning]||"Conceptual",
    currentState: scores.emotional_stability<40?"anxious":scores.direction<40?"confused":scores.discipline>60?"driven":"exploring",
  };
}

// ═════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═════════════════════════════════════════════════════════════════════
export default function App() {
  const [page,setPage] = useState("landing");
  const [user,setUser] = useState(null);
  const [profile,setProfile] = useState(null);
  const [sessions,setSessions] = useState([]);
  const [activeSession,setActiveSession] = useState(null);
  const [points,setPoints] = useState(0);
  const [streak,setStreak] = useState(0);
  const [showCrisis,setShowCrisis] = useState(false);

  useEffect(()=>{
    (async()=>{
      try {
        const s = await storage.get("vos_v2");
        if(s){ const d=JSON.parse(s.value); setUser(d.user); setProfile(d.profile); setPoints(d.points||0); setStreak(d.streak||0); setSessions(d.sessions||[]); if(d.profile) setPage("main"); }
      } catch(e){}
    })();
  },[]);

  const save = useCallback(async(overrides={})=>{
    try{
      const d = {user:overrides.user??user,profile:overrides.profile??profile,points:overrides.points??points,streak:overrides.streak??streak,sessions:overrides.sessions??sessions};
      await storage.set("vos_v2",JSON.stringify(d));
    }catch(e){}
  },[user,profile,points,streak,sessions]);

  const handleQuizDone = (answers) => {
    const p = analyzeProfile(answers);
    setProfile(p); setPoints(10); setStreak(1);
    save({profile:p,points:10,streak:1});
    setPage("reveal");
  };

  const handleLogout = async()=>{
    try{await storage.delete("vos_v2")}catch(e){}
    setUser(null);setProfile(null);setSessions([]);setPoints(0);setStreak(0);setActiveSession(null);
    setPage("landing");
  };

  return (
    <div style={{height:"100vh",width:"100vw",overflow:"hidden"}}>
      {showCrisis && <CrisisOverlay onClose={()=>setShowCrisis(false)}/>}
      {page==="landing"  && <LandingPage onStart={()=>setPage("signup")}/>}
      {page==="signup"   && <SignupPage onDone={d=>{setUser(d);setPage("consent")}} onBack={()=>setPage("landing")}/>}
      {page==="consent"  && <ConsentPage onDone={()=>setPage("quiz")}/>}
      {page==="quiz"     && <QuizPage onComplete={handleQuizDone}/>}
      {page==="reveal"   && <RevealPage profile={profile} onContinue={()=>setPage("main")}/>}
      {page==="main"     && <MainApp profile={profile} user={user} sessions={sessions} setSessions={setSessions} activeSession={activeSession} setActiveSession={setActiveSession} points={points} setPoints={setPoints} streak={streak} setStreak={setStreak} setShowCrisis={setShowCrisis} save={save} onLogout={handleLogout}/>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  CRISIS OVERLAY
// ═════════════════════════════════════════════════════════════════════
function CrisisOverlay({onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:20,padding:32,maxWidth:400,width:"100%",animation:"fadeInScale .3s ease",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>💙</div>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:C.ocean,marginBottom:8}}>You're Not Alone</h3>
        <p style={{color:C.textMid,fontSize:14,lineHeight:1.6,marginBottom:20}}>Your feelings matter. Please reach out to someone who can help.</p>
        <div style={{background:C.offWhite,borderRadius:12,padding:20,marginBottom:16,textAlign:"left"}}>
          <p style={{fontWeight:600,color:C.textDark,marginBottom:4}}>988 Suicide & Crisis Lifeline</p>
          <p style={{fontSize:28,fontWeight:700,color:C.accent}}>988</p>
          <p style={{color:C.textLight,fontSize:13,marginTop:4}}>Text HOME to 741741</p>
        </div>
        <p style={{color:C.textLight,fontSize:12,lineHeight:1.5,marginBottom:16}}>Free, confidential, available 24/7.</p>
        <button onClick={onClose} style={{width:"100%",padding:14,borderRadius:12,background:C.ocean,color:C.white,border:"none",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>I Understand</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  LANDING PAGE
// ═════════════════════════════════════════════════════════════════════
function LandingPage({onStart}) {
  const [show,setShow]=useState(false);
  useEffect(()=>{setTimeout(()=>setShow(true),100)},[]);
  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg,#060F1A 0%,${C.ocean} 40%,#0A1B30 100%)`,backgroundSize:"200% 200%",animation:"gradientShift 14s ease infinite",position:"relative",overflow:"hidden",padding:24}}>
      <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,180,255,.06),transparent)",top:"-15%",right:"-15%"}}/>
      <div style={{position:"absolute",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,89,232,.05),transparent)",bottom:"5%",left:"-8%"}}/>
      <div style={{opacity:show?1:0,transform:show?"translateY(0)":"translateY(24px)",transition:"all .8s ease .2s",marginBottom:48}}>
        <VosLogo size={50}/>
      </div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(30px,6vw,54px)",fontWeight:700,textAlign:"center",lineHeight:1.15,maxWidth:580,color:C.white,opacity:show?1:0,transform:show?"translateY(0)":"translateY(24px)",transition:"all 1s ease .5s"}}>
        Understand Yourself.<br/><span style={{color:C.tan}}>Improve Your Life.</span>
      </h1>
      <p style={{color:"rgba(255,255,255,.5)",fontSize:"clamp(14px,2vw,17px)",textAlign:"center",maxWidth:420,lineHeight:1.7,marginTop:20,marginBottom:48,opacity:show?1:0,transition:"all 1s ease .8s"}}>
        Most people never truly understand themselves. Take the test. Discover your mind. Become who you were meant to be.
      </p>
      <div style={{opacity:show?1:0,transition:"all 1s ease 1.1s"}}>
        <button onClick={onStart} style={{padding:"18px 60px",borderRadius:50,border:"none",background:`linear-gradient(135deg,${C.tan},${C.gold})`,color:C.ocean,fontSize:17,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:.5,animation:"breathe 3s infinite",transition:"transform .2s"}}
          onMouseEnter={e=>e.target.style.transform="scale(1.04)"}
          onMouseLeave={e=>e.target.style.transform="scale(1)"}
        >START YOUR JOURNEY</button>
      </div>
      <p style={{position:"absolute",bottom:28,color:"rgba(255,255,255,.25)",fontSize:12,letterSpacing:1,opacity:show?1:0,transition:"opacity 1.5s ease 1.5s"}}>Free · 3 min assessment · No credit card</p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  SIGNUP
// ═════════════════════════════════════════════════════════════════════
function SignupPage({onDone,onBack}) {
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [name,setName]=useState("");
  const inp = (label,val,set,type="text",ph="") => (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",marginBottom:5,fontSize:13,color:"rgba(255,255,255,.5)",fontWeight:500}}>{label}</label>
      <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:"100%",padding:"14px 16px",borderRadius:12,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",color:C.white,fontSize:15,fontFamily:"'DM Sans',sans-serif",transition:"border-color .3s"}}
        onFocus={e=>e.target.style.borderColor="rgba(255,255,255,.3)"}
        onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.12)"}
      />
    </div>
  );
  return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg,#060F1A,${C.ocean})`,padding:20}}>
      <div className="fade-in" style={{width:"100%",maxWidth:400}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:14,marginBottom:24}}>← Back</button>
        <div style={{marginBottom:28}}><VosLogo size={32}/></div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:C.white,marginBottom:6}}>Create Your Account</h2>
        <p style={{color:"rgba(255,255,255,.4)",fontSize:14,marginBottom:28}}>Begin your journey of self-discovery</p>
        {inp("Full Name",name,setName,"text","Your name")}
        {inp("Email",email,setEmail,"email","you@example.com")}
        {inp("Password",pw,setPw,"password","Create a password")}
        <button onClick={()=>onDone({name,email})} disabled={!email||!pw||!name} style={{width:"100%",padding:15,borderRadius:12,border:"none",background:(!email||!pw||!name)?"rgba(255,255,255,.1)":`linear-gradient(135deg,${C.tan},${C.gold})`,color:(!email||!pw||!name)?"rgba(255,255,255,.3)":C.ocean,fontSize:15,fontWeight:600,cursor:(!email||!pw||!name)?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:4,marginBottom:16,transition:"all .3s"}}>Create Account</button>
        <div style={{textAlign:"center",color:"rgba(255,255,255,.25)",fontSize:13,margin:"16px 0"}}>or continue with</div>
        <button onClick={()=>onDone({name:"User",email:"google@user.com"})} style={{width:"100%",padding:14,borderRadius:12,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.05)",color:C.white,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"'DM Sans',sans-serif"}}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  CONSENT
// ═════════════════════════════════════════════════════════════════════
function ConsentPage({onDone}) {
  const [age,setAge]=useState(false);
  const [gdpr,setGdpr]=useState(false);
  const Check=({on,toggle,title,desc})=>(
    <div style={{background:"rgba(255,255,255,.04)",borderRadius:14,padding:20,marginBottom:14,border:"1px solid rgba(255,255,255,.08)",cursor:"pointer"}} onClick={toggle}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${on?"#00B4FF":"rgba(255,255,255,.2)"}`,background:on?"#00B4FF":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
          {on&&<span style={{color:C.white,fontSize:13,fontWeight:700}}>✓</span>}
        </div>
        <div><p style={{color:C.white,fontSize:15,fontWeight:500,marginBottom:3}}>{title}</p><p style={{color:"rgba(255,255,255,.4)",fontSize:12,lineHeight:1.5}}>{desc}</p></div>
      </div>
    </div>
  );
  return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg,#060F1A,${C.ocean})`,padding:20}}>
      <div className="fade-in" style={{maxWidth:440,width:"100%"}}>
        <div style={{marginBottom:28}}><VosLogo size={32}/></div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:C.white,marginBottom:6}}>Before We Begin</h2>
        <p style={{color:"rgba(255,255,255,.4)",fontSize:14,marginBottom:28}}>Your privacy and safety matter</p>
        <Check on={age} toggle={()=>setAge(!age)} title="I am 16 years or older" desc="VOS is designed for individuals aged 16+"/>
        <Check on={gdpr} toggle={()=>setGdpr(!gdpr)} title="I consent to data processing" desc="Encrypted data, GDPR compliant. Inactive accounts deleted after 14 days. Delete anytime."/>
        <button onClick={onDone} disabled={!age||!gdpr} style={{width:"100%",padding:15,borderRadius:12,border:"none",background:(!age||!gdpr)?"rgba(255,255,255,.08)":`linear-gradient(135deg,${C.tan},${C.gold})`,color:(!age||!gdpr)?"rgba(255,255,255,.2)":C.ocean,fontSize:15,fontWeight:600,cursor:(!age||!gdpr)?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:8,transition:"all .3s"}}>Continue to Assessment</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  QUIZ — 3 PHASES WITH LIKERT BUBBLES
// ═════════════════════════════════════════════════════════════════════
function QuizPage({onComplete}) {
  const [phaseIdx,setPhaseIdx]=useState(0);
  const [qIdx,setQIdx]=useState(0);
  const [answers,setAnswers]=useState([]);
  const [selected,setSelected]=useState(null);
  const [dir,setDir]=useState(1);
  const [animState,setAnimState]=useState("in");
  const [showPhaseIntro,setShowPhaseIntro]=useState(true);
  const [phaseIntroAnim,setPhaseIntroAnim]=useState("in");
  const skipIntroRef = useRef(false);

  const phase = QUIZ_PHASES[phaseIdx];
  const question = phase.questions[qIdx];
  const totalQ = QUIZ_PHASES.reduce((s,p)=>s+p.questions.length,0);
  const doneQ = QUIZ_PHASES.slice(0,phaseIdx).reduce((s,p)=>s+p.questions.length,0) + qIdx;
  const isFirst = phaseIdx===0 && qIdx===0;

  useEffect(()=>{
    if(skipIntroRef.current){ skipIntroRef.current=false; return; }
    setPhaseIntroAnim("in");
    setShowPhaseIntro(true);
    const t=setTimeout(()=>{
      setPhaseIntroAnim("out");
      setTimeout(()=>{ setShowPhaseIntro(false); setAnimState("in"); },400);
    },1800);
    return()=>clearTimeout(t);
  },[phaseIdx]);

  const transitionTo = (nextPhaseIdx, nextQIdx, direction) => {
    setDir(direction);
    setAnimState("out");
    setTimeout(()=>{
      setPhaseIdx(nextPhaseIdx);
      setQIdx(nextQIdx);
      setAnimState("in");
    }, 300);
  };

  const advance = (newAns, curPhaseIdx, curQIdx) => {
    const curPhase = QUIZ_PHASES[curPhaseIdx];
    if(curQIdx+1 < curPhase.questions.length){
      transitionTo(curPhaseIdx, curQIdx+1, 1);
      setTimeout(()=>setSelected(null), 300);
    } else if(curPhaseIdx+1 < QUIZ_PHASES.length){
      setPhaseIdx(curPhaseIdx+1); setQIdx(0); setSelected(null);
    } else {
      onComplete(newAns);
    }
  };

  const handleSelect = (ansIdx, likert) => {
    if(animState==="out") return;
    setSelected({ansIdx,likert});
    const ans = {qId:question.id, answerIndex:ansIdx, confidence:likert};
    const existingIdx = answers.findIndex(a=>a.qId===question.id);
    let newAns;
    if(existingIdx>=0){ newAns=[...answers]; newAns[existingIdx]=ans; }
    else { newAns=[...answers,ans]; }
    setAnswers(newAns);
    setTimeout(()=>advance(newAns, phaseIdx, qIdx), 200);
  };

  const handleBack = () => {
    if(animState==="out") return;
    if(isFirst) return;
    let prevPhaseIdx=phaseIdx, prevQIdx;
    if(qIdx>0){
      prevQIdx=qIdx-1;
      transitionTo(prevPhaseIdx, prevQIdx, -1);
      const prevQ = QUIZ_PHASES[prevPhaseIdx].questions[prevQIdx];
      const prevAns = answers.find(a=>a.qId===prevQ.id);
      setTimeout(()=>setSelected(prevAns ? {ansIdx:prevAns.answerIndex, likert:prevAns.confidence} : null), 300);
    } else {
      prevPhaseIdx=phaseIdx-1;
      prevQIdx=QUIZ_PHASES[prevPhaseIdx].questions.length-1;
      skipIntroRef.current=true;
      const prevQ = QUIZ_PHASES[prevPhaseIdx].questions[prevQIdx];
      const prevAns = answers.find(a=>a.qId===prevQ.id);
      setPhaseIdx(prevPhaseIdx);
      setQIdx(prevQIdx);
      setDir(-1);
      setAnimState("in");
      setSelected(prevAns ? {ansIdx:prevAns.answerIndex, likert:prevAns.confidence} : null);
    }
  };

  const handleSkip = () => {
    if(animState==="out") return;
    const ans = {qId:question.id, answerIndex:2, confidence:3};
    const existingIdx = answers.findIndex(a=>a.qId===question.id);
    let newAns;
    if(existingIdx>=0){ newAns=[...answers]; newAns[existingIdx]=ans; }
    else { newAns=[...answers,ans]; }
    setAnswers(newAns);
    advance(newAns, phaseIdx, qIdx);
  };

  const slideStyle = {
    opacity: animState==="in" ? 1 : 0,
    transform: animState==="in"
      ? "translateX(0) scale(1)"
      : dir===1 ? "translateX(-36px) scale(.97)" : "translateX(36px) scale(.97)",
    transition: animState==="in"
      ? "opacity .4s cubic-bezier(.4,0,.2,1), transform .4s cubic-bezier(.34,1.1,.64,1)"
      : "opacity .25s ease, transform .25s ease",
  };

  if(showPhaseIntro) {
    return (
      <div style={{height:"100vh",display:"flex",flexDirection:"column",background:`linear-gradient(160deg,#060F1A,${C.ocean})`}}>
        <div style={{padding:"20px 24px"}}>
          <button onClick={()=>{
            if(phaseIdx>0){
              skipIntroRef.current=true;
              const prevPIdx=phaseIdx-1;
              const prevQIdx2=QUIZ_PHASES[prevPIdx].questions.length-1;
              const prevQ2=QUIZ_PHASES[prevPIdx].questions[prevQIdx2];
              const prevAns2=answers.find(a=>a.qId===prevQ2.id);
              setPhaseIdx(prevPIdx);
              setQIdx(prevQIdx2);
              setSelected(prevAns2 ? {ansIdx:prevAns2.answerIndex, likert:prevAns2.confidence} : null);
              setShowPhaseIntro(false);
            }
          }} style={{background:"none",border:"none",color:phaseIdx>0?"rgba(255,255,255,.45)":"rgba(255,255,255,.12)",cursor:phaseIdx>0?"pointer":"default",fontSize:14,padding:0,fontFamily:"'DM Sans',sans-serif",transition:"color .2s"}}
          onMouseEnter={e=>{if(phaseIdx>0)e.currentTarget.style.color="rgba(255,255,255,.9)"}}
          onMouseLeave={e=>{if(phaseIdx>0)e.currentTarget.style.color="rgba(255,255,255,.45)"}}
          >← Back</button>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{
            textAlign:"center",
            opacity: phaseIntroAnim==="in" ? 1 : 0,
            transform: phaseIntroAnim==="in" ? "scale(1) translateY(0)" : "scale(.92) translateY(12px)",
            transition:"opacity .4s cubic-bezier(.4,0,.2,1), transform .4s cubic-bezier(.4,0,.2,1)",
          }}>
            <div style={{fontSize:72,marginBottom:16,animation:"float 2s infinite"}}>{phase.icon}</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:36,color:phase.color,marginBottom:8}}>{phase.label}</h2>
            <p style={{color:"rgba(255,255,255,.4)",fontSize:15}}>Step {phaseIdx+1} of 3</p>
            <div style={{width:60,height:3,background:phase.color,borderRadius:2,margin:"20px auto",opacity:.6}}/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:`linear-gradient(160deg,#060F1A,${C.ocean})`}}>
      <div style={{padding:"20px 20px 0"}}>
        <div style={{display:"flex",gap:4,marginBottom:16,maxWidth:500,margin:"0 auto"}}>
          {QUIZ_PHASES.map((p,i)=>{
            const done = i<phaseIdx;
            const active = i===phaseIdx;
            return (
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{height:4,borderRadius:2,background:done?p.color:active?`${p.color}55`:"rgba(255,255,255,.08)",transition:"all .6s cubic-bezier(.4,0,.2,1)",marginBottom:8}}>
                  {active && <div style={{height:"100%",width:`${((qIdx+1)/p.questions.length)*100}%`,background:p.color,borderRadius:2,transition:"width .5s cubic-bezier(.4,0,.2,1)"}}/>}
                </div>
                <span style={{fontSize:11,fontWeight:active?600:400,color:active?p.color:"rgba(255,255,255,.3)",letterSpacing:.5,textTransform:"uppercase",transition:"color .4s"}}>{p.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{textAlign:"center",marginBottom:4}}>
          <span style={{fontSize:12,color:"rgba(255,255,255,.3)"}}>{doneQ+1} / {totalQ}</span>
        </div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,maxWidth:560,width:"100%",margin:"0 auto",...slideStyle}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(20px,3.5vw,26px)",color:C.white,textAlign:"center",lineHeight:1.4,marginBottom:40}}>
          {question.q}
        </h2>

        <div style={{width:"100%",display:"flex",flexDirection:"column",gap:14}}>
          {question.answers.map((ans,aIdx)=>{
            const isSelected = selected?.ansIdx===aIdx;
            const likertVal = isSelected ? selected.likert : null;
            return (
              <div key={aIdx} style={{
                background: isSelected ? `${phase.color}14` : "rgba(255,255,255,.04)",
                border:`1.5px solid ${isSelected?phase.color:"rgba(255,255,255,.08)"}`,
                borderRadius:14, padding:"14px 18px",
                transition:"background .25s ease, border-color .25s ease, box-shadow .25s ease",
                boxShadow: isSelected ? `0 4px 20px ${phase.colorGlow}` : "none",
              }}>
                <p style={{color:C.white,fontSize:14,fontWeight:500,marginBottom:12}}>{ans}</p>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span style={{fontSize:10,color:"rgba(255,255,255,.3)",width:44,textAlign:"right"}}>Unsure</span>
                  {[1,2,3,4,5].map(lv=>{
                    const isEdge = lv===1||lv===5;
                    const isMid = lv===3;
                    const size = isEdge?28:isMid?18:22;
                    const filled = isSelected && likertVal===lv;
                    return (
                      <button key={lv} onClick={()=>handleSelect(aIdx,lv)} style={{
                        width:size, height:size, borderRadius:"50%",
                        border:`2px solid ${filled?phase.color:(isSelected?"rgba(255,255,255,.2)":"rgba(255,255,255,.12)")}`,
                        background: filled ? phase.color : "transparent",
                        cursor:"pointer",
                        transition:"all .22s cubic-bezier(.34,1.3,.64,1)",
                        boxShadow: filled ? `0 0 14px ${phase.colorGlow}` : "none",
                        transform: filled ? "scale(1.15)" : "scale(1)",
                      }}
                      onMouseEnter={e=>{if(!filled){e.target.style.borderColor=phase.color;e.target.style.background=`${phase.color}28`;e.target.style.transform="scale(1.1)"}}}
                      onMouseLeave={e=>{if(!filled){e.target.style.borderColor=isSelected?"rgba(255,255,255,.2)":"rgba(255,255,255,.12)";e.target.style.background="transparent";e.target.style.transform="scale(1)"}}}
                      />
                    );
                  })}
                  <span style={{fontSize:10,color:"rgba(255,255,255,.3)",width:44}}>Certain</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{display:"flex",gap:12,marginTop:32,width:"100%",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={handleBack} disabled={isFirst} style={{
            padding:"12px 24px",borderRadius:10,background:"transparent",
            border:`1px solid ${isFirst?"rgba(255,255,255,.06)":"rgba(255,255,255,.18)"}`,
            color:isFirst?"rgba(255,255,255,.12)":"rgba(255,255,255,.55)",
            fontSize:13,cursor:isFirst?"default":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .2s",
          }}
          onMouseEnter={e=>{if(!isFirst)e.currentTarget.style.color="rgba(255,255,255,.9)"}}
          onMouseLeave={e=>{if(!isFirst)e.currentTarget.style.color="rgba(255,255,255,.55)"}}
          >← Back</button>
          <button onClick={handleSkip} style={{
            padding:"12px 24px",borderRadius:10,background:"transparent",
            border:"1px solid rgba(255,255,255,.1)",
            color:"rgba(255,255,255,.35)",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
          }}>Skip</button>
        </div>

        {!selected && (
          <p style={{color:"rgba(255,255,255,.18)",fontSize:11,marginTop:16,textAlign:"center",letterSpacing:.3}}>
            Select an answer to continue automatically
          </p>
        )}
      </div>
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════
//  REVEAL PAGE — Thinking animation → Archetype reveal
// ═════════════════════════════════════════════════════════════════════
function RevealPage({profile,onContinue}) {
  const [stage,setStage]=useState(0); // 0=thinking, 1=icon, 2=name, 3=details, 4=button
  const arch = profile.archetypeData;
  const sec = profile.secondaryData;

  useEffect(()=>{
    const t = [
      setTimeout(()=>setStage(1),2800),
      setTimeout(()=>setStage(2),3600),
      setTimeout(()=>setStage(3),4400),
      setTimeout(()=>setStage(4),5400),
    ];
    return()=>t.forEach(clearTimeout);
  },[]);

  // Thinking stage
  if(stage===0) {
    return (
      <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 50% 40%,${C.oceanLight},#060F1A)`,padding:20}}>
        <div style={{marginBottom:32}}>
          <div style={{width:80,height:80,border:`3px solid transparent`,borderTop:`3px solid ${C.tan}`,borderRight:`3px solid ${PHASE.spirituality.color}`,borderRadius:"50%",animation:"spin 1.2s linear infinite"}}/>
        </div>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:C.white,marginBottom:8}}>Analyzing your psyche...</p>
        <div style={{display:"flex",gap:16,marginTop:20}}>
          {QUIZ_PHASES.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,animation:`fadeIn .5s ease ${i*.3}s both`}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:p.color}}/>
              <span style={{fontSize:12,color:p.color}}>{p.label}</span>
            </div>
          ))}
        </div>
        <p style={{color:"rgba(255,255,255,.3)",fontSize:13,marginTop:24,animation:"pulse 1.5s infinite"}}>Mapping patterns · Building archetype · Calibrating AI</p>
      </div>
    );
  }

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 50% 35%,${C.oceanMid},#060F1A)`,padding:20,overflow:"auto"}}>
      <div style={{maxWidth:460,width:"100%",textAlign:"center"}}>
        {stage>=1 && <div style={{fontSize:80,marginBottom:16,animation:"revealGlow 1s ease"}}>{arch.icon}</div>}
        {stage>=2 && (
          <div style={{animation:"fadeIn .6s ease"}}>
            <p style={{color:C.tan,fontSize:13,letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Your Primary Archetype</p>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(32px,7vw,48px)",color:C.white,marginBottom:6}}>{arch.name}</h1>
            <p style={{color:PHASE.mentality.color,fontSize:15,fontWeight:500}}>Core Drive: {arch.drive}</p>
          </div>
        )}
        {stage>=3 && (
          <div style={{animation:"fadeIn .6s ease",marginTop:24}}>
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
              {arch.strengths.map((s,i)=>(
                <span key={i} style={{padding:"6px 14px",borderRadius:20,background:"rgba(0,180,255,.1)",border:"1px solid rgba(0,180,255,.25)",fontSize:12,color:PHASE.mentality.color}}>{s}</span>
              ))}
            </div>
            <div style={{background:"rgba(255,255,255,.04)",borderRadius:14,padding:20,marginBottom:16,textAlign:"left",border:"1px solid rgba(255,255,255,.06)"}}>
              <p style={{color:C.tan,fontSize:11,fontWeight:600,letterSpacing:1,marginBottom:8}}>GROWTH PATH</p>
              <p style={{color:"rgba(255,255,255,.6)",fontSize:14,lineHeight:1.6}}>{arch.growth}</p>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:14,background:"rgba(255,255,255,.03)",borderRadius:12,border:"1px solid rgba(255,255,255,.05)"}}>
              <span style={{fontSize:24}}>{sec.icon}</span>
              <div style={{textAlign:"left"}}>
                <p style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>Supporting Archetype</p>
                <p style={{color:C.white,fontSize:14,fontWeight:500}}>{sec.name}</p>
              </div>
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginTop:14}}>
              <span style={{padding:"5px 10px",borderRadius:16,background:"rgba(155,89,232,.12)",fontSize:11,color:PHASE.spirituality.color}}>📚 {profile.pacerType} Learner</span>
              <span style={{padding:"5px 10px",borderRadius:16,background:"rgba(232,93,74,.12)",fontSize:11,color:PHASE.physicality.color}}>🎯 {profile.motivator}</span>
              <span style={{padding:"5px 10px",borderRadius:16,background:"rgba(0,180,255,.12)",fontSize:11,color:PHASE.mentality.color}}>⚡ {profile.currentState}</span>
            </div>
          </div>
        )}
        {stage>=4 && (
          <div style={{animation:"fadeIn .5s ease",marginTop:28}}>
            <p style={{color:"rgba(255,255,255,.4)",fontSize:13,marginBottom:20,lineHeight:1.6}}>Your AI mentor is now calibrated to your unique psychological profile.</p>
            <button onClick={onContinue} style={{padding:"16px 48px",borderRadius:50,border:"none",background:`linear-gradient(135deg,${C.tan},${C.gold})`,color:C.ocean,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"transform .2s"}}
              onMouseEnter={e=>e.target.style.transform="scale(1.04)"}
              onMouseLeave={e=>e.target.style.transform="scale(1)"}
            >Enter VOS →</button>
            <p style={{color:C.success,fontSize:12,marginTop:12}}>🏆 +10 points for completing assessment</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  MAIN APP — ChatGPT-style Layout
// ═════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════
//  SESSION BUBBLES — Profile · Plans · Progress
// ═════════════════════════════════════════════════════════════════════
function SessionBubbles({ profile, onSelect, visible }) {
  const arch = profile?.archetypeData || ARCHETYPES.intellectual;
  const p = profile?.personality || {};

  const bubbles = [
    {
      key: "profile",
      icon: arch.icon,
      label: "Profile",
      color: PHASE.mentality.color,
      glow: PHASE.mentality.colorGlow,
      subtitle: arch.name,
      detail: arch.drive,
      pulse: true,
      delay: "0s",
    },
    {
      key: "plans",
      icon: "📋",
      label: "Plans",
      color: PHASE.physicality.color,
      glow: PHASE.physicality.colorGlow,
      subtitle: "3-Month Master Plan",
      detail: "Mental · Physical · Spiritual",
      pulse: false,
      delay: "0.12s",
    },
    {
      key: "progress",
      icon: "📈",
      label: "Progress",
      color: PHASE.spirituality.color,
      glow: PHASE.spirituality.colorGlow,
      subtitle: `${Math.round((p.discipline || 50))}% Discipline`,
      detail: `${Math.round((p.openness || 50))}% Openness · ${Math.round((p.emotional_stability || 50))}% Stability`,
      pulse: false,
      delay: "0.24s",
    },
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      gap: 20,
      padding: "0 20px",
      pointerEvents: visible ? "auto" : "none",
    }}>
      {/* Greeting */}
      <div style={{
        textAlign: "center",
        marginBottom: 8,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-16px)",
        transition: "all .5s ease",
      }}>
        <p style={{ fontSize: 13, color: C.textLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          Where would you like to start?
        </p>
        <p style={{ fontSize: 11, color: C.warmGray, fontStyle: "italic" }}>
          Or type anything below to begin
        </p>
      </div>

      {/* Bubble row */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {bubbles.map((b, i) => (
          <BubbleCard key={b.key} bubble={b} index={i} visible={visible} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function BubbleCard({ bubble: b, index, visible, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onSelect(b.key)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 160,
        background: hovered
          ? `linear-gradient(145deg, ${C.white}, ${C.offWhite})`
          : C.white,
        borderRadius: 20,
        padding: "22px 18px 18px",
        border: `1.5px solid ${hovered ? b.color : C.warmGray}`,
        cursor: "pointer",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        boxShadow: hovered
          ? `0 8px 32px ${b.glow}, 0 2px 8px rgba(0,0,0,.06)`
          : "0 2px 12px rgba(0,0,0,.06)",
        // Staggered fade-in
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(.9)",
        transition: `opacity .55s ease ${b.delay}, transform .55s cubic-bezier(.34,1.56,.64,1) ${b.delay}, box-shadow .25s, border-color .25s`,
        // Float animation when visible and not hovered
        animation: visible && !hovered ? `bubbleFloat ${3.5 + index * 0.4}s ease-in-out infinite ${b.delay}` : "none",
      }}
    >
      {/* Shimmer sweep on hover */}
      {hovered && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none",
          background: `linear-gradient(105deg, transparent 30%, rgba(255,255,255,.6) 50%, transparent 70%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer .7s ease forwards",
        }} />
      )}

      {/* Orbit ring */}
      <div style={{
        width: 64, height: 64, borderRadius: "50%", margin: "0 auto 14px",
        background: `${b.color}14`,
        border: `2px solid ${b.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        boxShadow: hovered ? `0 0 0 0 ${b.color}50, inset 0 0 12px ${b.color}20` : "none",
        animation: hovered ? "ringPulse 1.2s ease infinite" : "none",
        transition: "all .3s",
      }}>
        {/* Orbit dot */}
        <div style={{
          position: "absolute", width: 7, height: 7, borderRadius: "50%",
          background: b.color, top: "50%", left: "50%", marginTop: -3.5, marginLeft: -3.5,
          animation: `orbitDot ${2 + index * 0.3}s linear infinite`,
          opacity: hovered ? 1 : 0.4,
          transition: "opacity .3s",
        }} />
        <span style={{ fontSize: 26, zIndex: 1, position: "relative" }}>{b.icon}</span>
      </div>

      {/* Label */}
      <p style={{
        fontFamily: "'Playfair Display',serif",
        fontSize: 16, fontWeight: 600,
        color: hovered ? b.color : C.textDark,
        marginBottom: 4,
        transition: "color .25s",
      }}>{b.label}</p>

      {/* Subtitle */}
      <p style={{
        fontSize: 11, fontWeight: 600,
        color: b.color,
        marginBottom: 3,
        opacity: 0.85,
      }}>{b.subtitle}</p>

      {/* Detail */}
      <p style={{
        fontSize: 10, color: C.textLight, lineHeight: 1.4,
      }}>{b.detail}</p>

      {/* Bottom accent bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${b.color}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity .3s",
        borderRadius: "0 0 20px 20px",
      }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  MAIN APP — ChatGPT-style Layout
// ═════════════════════════════════════════════════════════════════════

// ─── POINTS MILESTONE CONFIG ────────────────────────────────────────
const MILESTONES = [
  { pts: 200,  label: "Seeker",      icon: "🌱", color: "#2EAA6B" },
  { pts: 500,  label: "Architect",   icon: "🔷", color: "#00B4FF" },
  { pts: 900,  label: "Sovereign",   icon: "👑", color: "#D4A853" },
  { pts: 1000, label: "Transcendent",icon: "🔮", color: "#9B59E8" },
];

function getStatus(pts) {
  const effective = pts % 1000;
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (effective >= MILESTONES[i].pts) return MILESTONES[i];
  }
  return { pts: 0, label: "Initiate", icon: "⚡", color: C.tanDim };
}

// ─── FORMAT HELPER ──────────────────────────────────────────────────
const fmt = (t) =>
  t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
   .replace(/\*(.*?)\*/g, "<em>$1</em>")
   .replace(/\n/g, "<br/>");

// ═════════════════════════════════════════════════════════════════════
//  SIDEBAR  (top-level — no remount bug)
// ═════════════════════════════════════════════════════════════════════
function VosSidebar({ isMobile, sidebarOpen, setSidebarOpen, sessions, activeSession, points, streak, onNewSession, onLoadSession, onLogout }) {
  return (
    <div style={{
      width: isMobile ? (sidebarOpen ? "100%" : "0") : 260,
      height: "100vh", background: C.ocean,
      borderRight: "1px solid rgba(255,255,255,.06)",
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: isMobile ? "absolute" : "relative",
      zIndex: isMobile ? 100 : 1, left: 0, top: 0,
      transition: "width .3s ease", overflow: "hidden",
    }}>
      <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <VosLogo size={28} />
          {isMobile && <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: C.tan, cursor: "pointer", fontSize: 20 }}>✕</button>}
        </div>
        <button onClick={onNewSession} style={{
          width: "100%", padding: 12, borderRadius: 10,
          border: "1px solid rgba(212,184,150,.25)", background: "rgba(212,184,150,.06)",
          color: C.tan, fontSize: 13, fontWeight: 500, cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center",
          gap: 8, justifyContent: "center", transition: "all .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,184,150,.14)"; e.currentTarget.style.borderColor = "rgba(212,184,150,.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,184,150,.06)"; e.currentTarget.style.borderColor = "rgba(212,184,150,.25)"; }}
        >＋ New Session</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
        <p style={{ color: C.tanDim, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", padding: "8px 10px", fontWeight: 600 }}>Recent</p>
        {sessions.slice().reverse().map(s => (
          <button key={s.id} onClick={() => onLoadSession(s)} style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, border: "none",
            background: activeSession === s.id ? "rgba(212,184,150,.1)" : "transparent",
            color: activeSession === s.id ? C.tan : C.tanDim,
            fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            marginBottom: 2, transition: "all .15s", whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis", display: "block",
          }}
            onMouseEnter={e => { if (activeSession !== s.id) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
            onMouseLeave={e => { if (activeSession !== s.id) e.currentTarget.style.background = "transparent"; }}
          >💬 {s.title}</button>
        ))}
        {sessions.length === 0 && <p style={{ color: "rgba(255,255,255,.15)", fontSize: 12, padding: "20px 12px", textAlign: "center" }}>No sessions yet</p>}
      </div>

      <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.tanDim }}>⭐ {points} pts</span>
          <span style={{ fontSize: 12, color: C.tanDim }}>🔥 {streak}d streak</span>
        </div>
        <button onClick={onLogout} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "rgba(255,255,255,.3)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.3)"}
        >Log out</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  CHAT VIEW  (top-level — stable reference, no remount)
// ═════════════════════════════════════════════════════════════════════
function VosChatView({ isMobile, setSidebarOpen, view, setView, messages, isLoading, isTyping, bubblesVisible, profile, input, setInput, onSend, onStop, messagesEndRef, inputRef }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", background: C.white }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: `1px solid ${C.warmGray}`, background: C.white, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: C.ocean, cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>}
          <span style={{ fontSize: 14, fontWeight: 600, color: C.textDark }}>VOS Mentor</span>
          <span style={{ fontSize: 10, color: C.success }}>● Online</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <TopBtn label="Profile" icon="👤" active={view === "profile"} onClick={() => setView("profile")} />
          <TopBtn label="Master Plan" icon="📋" active={view === "plans"} onClick={() => setView("plans")} />
          <TopBtn label="Upgrade" icon="⭐" active={view === "pricing"} onClick={() => setView("pricing")} />
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 6, background: C.white }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          if (isUser && isTyping && i < messages.length - 1) return null;
          return (
            <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", animation: "fadeIn .3s ease" }}>
              {!isUser && <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.ocean, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 8, flexShrink: 0, marginTop: 4, color: C.tan, fontWeight: 700 }}>V</div>}
              <div style={{ maxWidth: "72%", padding: "12px 16px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? C.userBubble : C.aiBubble, color: isUser ? C.white : C.textDark, fontSize: 14, lineHeight: 1.65 }}>
                <div dangerouslySetInnerHTML={{ __html: fmt(msg.text) }} />
              </div>
            </div>
          );
        })}

        {bubblesVisible && <SessionBubbles profile={profile} onSelect={(key) => { if (key === "profile") setView("profile"); else if (key === "plans") setView("plans"); else if (key === "progress") setView("progress"); }} visible={bubblesVisible} />}

        {isLoading && (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.ocean, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 8, color: C.tan, fontWeight: 700 }}>V</div>
            <div style={{ background: C.aiBubble, borderRadius: "18px 18px 18px 4px" }}><TypingDots color={C.textLight} /></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${C.warmGray}`, background: C.white, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 720, margin: "0 auto" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Ask about your goals, habits, or challenges..."
            style={{ flex: 1, padding: "14px 18px", borderRadius: 24, background: C.offWhite, border: `1px solid ${C.warmGray}`, color: C.textDark, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.warmGray}
          />
          {isLoading ? (
            <button onClick={onStop} title="Stop" style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${C.red}`, background: C.white, color: C.red, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 }}>■</button>
          ) : (
            <button onClick={onSend} disabled={!input.trim()} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: input.trim() ? C.ocean : C.warmGray, color: input.trim() ? C.white : C.textLight, fontSize: 18, cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 }}>↑</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  PROFILE VIEW  (top-level)
// ═════════════════════════════════════════════════════════════════════
function VosProfileView({ isMobile, setSidebarOpen, setView, profile, arch, points, streak }) {
  const p = profile.personality;
  const effective = points % 1000;
  const status = getStatus(points);
  const cycleCount = Math.floor(points / 1000);

  const Bar = ({ label, val, color }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: C.textLight }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 600 }}>{val}</span>
      </div>
      <div style={{ height: 5, background: C.warmGray, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${val}%`, background: color, borderRadius: 3, transition: "width .8s" }} />
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, background: C.chatBg, height: "100vh", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${C.warmGray}`, background: C.white }}>
        {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: C.ocean, cursor: "pointer", fontSize: 20, marginRight: 12 }}>☰</button>}
        <button onClick={() => setView("chat")} style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", fontSize: 14, marginRight: 12 }}>← Chat</button>
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: C.textDark, fontSize: 18 }}>Your Profile</h3>
      </div>

      <div style={{ padding: 24, maxWidth: 500, margin: "0 auto" }}>
        {/* Archetype header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>{arch.icon}</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: C.textDark, fontSize: 28 }}>{arch.name}</h2>
          <p style={{ color: C.accent, fontSize: 14 }}>{arch.drive}</p>
        </div>

        {/* ── POINTS JOURNEY BAR ── */}
        <div style={{ background: C.ocean, borderRadius: 16, padding: 20, marginBottom: 20, position: "relative", overflow: "hidden" }}>
          {/* Background shimmer */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(212,168,83,.05),rgba(155,89,232,.05))", borderRadius: 16 }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, position: "relative" }}>
            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
                {cycleCount > 0 ? `Cycle ${cycleCount + 1} · ` : ""}Your Journey
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{status.icon}</span>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: status.color, fontWeight: 600 }}>{status.label}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: C.white }}>⭐ {points}</span>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
                {1000 - effective} pts to free month
              </p>
            </div>
          </div>

          {/* Progress track */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <div style={{ height: 8, background: "rgba(255,255,255,.08)", borderRadius: 6, overflow: "visible", position: "relative" }}>
              <div style={{ height: "100%", width: `${(effective / 1000) * 100}%`, background: `linear-gradient(90deg,${PHASE.mentality.color},${status.color})`, borderRadius: 6, transition: "width 1s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 10px ${status.color}60` }} />
            </div>
            {/* Milestone markers */}
            {MILESTONES.map((m, i) => {
              const pct = (m.pts / 1000) * 100;
              const reached = effective >= m.pts;
              return (
                <div key={i} style={{ position: "absolute", top: -6, left: `${pct}%`, transform: "translateX(-50%)" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${reached ? m.color : "rgba(255,255,255,.2)"}`, background: reached ? m.color : "rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, transition: "all .4s", boxShadow: reached ? `0 0 8px ${m.color}` : "none" }}>
                    {reached ? "✓" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Milestone labels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            {MILESTONES.map((m, i) => (
              <div key={i} style={{ textAlign: "center", flex: 1 }}>
                <p style={{ fontSize: 9, color: effective >= m.pts ? m.color : "rgba(255,255,255,.25)", fontWeight: 600, transition: "color .4s" }}>{m.icon} {m.label}</p>
                <p style={{ fontSize: 8, color: "rgba(255,255,255,.2)" }}>{m.pts}pts</p>
              </div>
            ))}
          </div>

          {effective >= 900 && effective < 1000 && (
            <div style={{ marginTop: 12, padding: "8px 14px", background: "rgba(155,89,232,.2)", borderRadius: 8, border: "1px solid rgba(155,89,232,.3)", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: PHASE.spirituality.color, fontWeight: 600 }}>🎯 {1000 - effective} pts until FREE premium month!</p>
            </div>
          )}

          {cycleCount > 0 && (
            <div style={{ marginTop: 8, padding: "6px 12px", background: "rgba(212,168,83,.15)", borderRadius: 8, textAlign: "center" }}>
              <p style={{ fontSize: 11, color: C.gold }}>🏆 {cycleCount} free month{cycleCount > 1 ? "s" : ""} earned</p>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: C.white, borderRadius: 12, padding: 16, border: `1px solid ${C.warmGray}`, textAlign: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.warning }}>⭐ {points}</span>
            <p style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>Total Points</p>
          </div>
          <div style={{ flex: 1, background: C.white, borderRadius: 12, padding: 16, border: `1px solid ${C.warmGray}`, textAlign: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.red }}>🔥 {streak}</span>
            <p style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>Day Streak</p>
          </div>
          <div style={{ flex: 1, background: C.white, borderRadius: 12, padding: 16, border: `1px solid ${C.warmGray}`, textAlign: "center" }}>
            <span style={{ fontSize: 18 }}>{status.icon}</span>
            <p style={{ fontSize: 11, color: status.color, fontWeight: 600, marginTop: 4 }}>{status.label}</p>
          </div>
        </div>

        {/* Personality map */}
        <div style={{ background: C.white, borderRadius: 14, padding: 20, marginBottom: 16, border: `1px solid ${C.warmGray}` }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: C.ocean, marginBottom: 14 }}>Personality Map</h4>
          <Bar label="Introversion" val={p.introversion} color={PHASE.mentality.color} />
          <Bar label="Openness" val={p.openness} color={PHASE.spirituality.color} />
          <Bar label="Discipline" val={p.discipline} color={PHASE.physicality.color} />
          <Bar label="Emotional Stability" val={p.emotional_stability} color={C.warning} />
          <Bar label="Direction" val={p.direction} color={C.accent} />
        </div>

        {/* Details */}
        <div style={{ background: C.white, borderRadius: 14, padding: 20, marginBottom: 16, border: `1px solid ${C.warmGray}` }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: C.ocean, marginBottom: 12 }}>Details</h4>
          {[["Learning", profile.pacerType], ["Motivator", profile.motivator], ["Fear", profile.fear], ["Growth Area", profile.growthArea], ["State", profile.currentState], ["Shadow", arch.shadow]].map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 5 ? `1px solid ${C.lightGray}` : "none" }}>
              <span style={{ color: C.textLight, fontSize: 13 }}>{k}</span>
              <span style={{ color: C.textDark, fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Figures */}
        <div style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.warmGray}` }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: C.ocean, marginBottom: 12 }}>Historical Parallels</h4>
          <div style={{ display: "flex", gap: 10 }}>
            {arch.figures.map((f, i) => (
              <div key={i} style={{ flex: 1, padding: 14, background: C.offWhite, borderRadius: 10, textAlign: "center" }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: C.textDark }}>{f}</p>
                <p style={{ color: C.textLight, fontSize: 11, marginTop: 2 }}>{arch.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  PLANS VIEW  (top-level — with working checkboxes + goal setter)
// ═════════════════════════════════════════════════════════════════════
const DEFAULT_PLAN_ITEMS = {
  mental: [
    { id: "m1", text: "5-min daily mindfulness practice", pts: 2 },
    { id: "m2", text: "Journal 3 gratitudes each morning", pts: 2 },
    { id: "m3", text: "Reframe one negative thought daily", pts: 2 },
    { id: "m4", text: "Read 20 pages of psychology/philosophy", pts: 2 },
    { id: "m5", text: "Weekly self-reflection with VOS", pts: 5 },
  ],
  physical: [
    { id: "p1", text: "Sleep 7–8 hours consistently", pts: 2 },
    { id: "p2", text: "30-min daily movement", pts: 2 },
    { id: "p3", text: "Hydrate: 8 glasses of water", pts: 2 },
    { id: "p4", text: "Reduce screen time before bed", pts: 2 },
    { id: "p5", text: "Weekly energy assessment", pts: 5 },
  ],
  spiritual: [
    { id: "s1", text: "Define your personal mission statement", pts: 5 },
    { id: "s2", text: "Practice 10-min meditation", pts: 2 },
    { id: "s3", text: "Connect with nature weekly", pts: 2 },
    { id: "s4", text: "Identify your keystone virtue", pts: 5 },
    { id: "s5", text: "Monthly purpose check-in with VOS", pts: 5 },
  ],
};

function VosPlansView({ isMobile, setSidebarOpen, setView, arch, setPoints, planChecked, setPlanChecked, planGoals, setPlanGoals }) {
  const checked = planChecked;
  const setChecked = setPlanChecked;
  const goals = planGoals;
  const setGoals = setPlanGoals;
  const [goalInput, setGoalInput] = useState("");
  const [goalType, setGoalType] = useState("small");
  const [justEarned, setJustEarned] = useState(null);

  const toggleItem = (id, pts) => {
    const wasChecked = !!checked[id];
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
    if (!wasChecked) {
      setPoints(p => p + pts);
      setJustEarned(`+${pts} pts`);
      setTimeout(() => setJustEarned(null), 1800);
    } else {
      setPoints(p => Math.max(0, p - pts));
    }
  };

  const addGoal = () => {
    if (!goalInput.trim()) return;
    const pts = goalType === "big" ? 5 : 2;
    setGoals(prev => [...prev, { id: `g${Date.now()}`, text: goalInput.trim(), pts, type: goalType }]);
    setGoalInput("");
  };

  const plans = [
    { key: "mental", icon: "🧠", title: "Mental", color: PHASE.mentality.color, items: DEFAULT_PLAN_ITEMS.mental },
    { key: "physical", icon: "💪", title: "Physical", color: PHASE.physicality.color, items: DEFAULT_PLAN_ITEMS.physical },
    { key: "spiritual", icon: "✨", title: "Spiritual", color: PHASE.spirituality.color, items: DEFAULT_PLAN_ITEMS.spiritual },
  ];

  const totalItems = plans.reduce((s, p) => s + p.items.length, 0) + goals.length;
  const doneItems = Object.values(checked).filter(Boolean).length;
  const completionPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div style={{ flex: 1, background: "#F4F2EF", height: "100vh", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ background: C.ocean, padding: "0 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: C.tan, cursor: "pointer", fontSize: 20, marginRight: 12 }}>☰</button>}
          <button onClick={() => setView("chat")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 14, marginRight: 12 }}>← Chat</button>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", color: C.white, fontSize: 20, marginBottom: 2 }}>3-Month Master Plan</h3>
            <p style={{ color: C.tan, fontSize: 12, opacity: 0.7 }}>Calibrated for {arch.name} · {arch.drive}</p>
          </div>
          {/* Point toast */}
          {justEarned && (
            <div style={{ background: C.success, color: C.white, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, animation: "fadeIn .3s ease" }}>{justEarned} ✓</div>
          )}
        </div>

        {/* Commitment banner */}
        <div style={{ padding: "16px 0 20px", display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Overall Commitment</p>
            <div style={{ height: 6, background: "rgba(255,255,255,.1)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${completionPct}%`, background: `linear-gradient(90deg,${PHASE.mentality.color},${PHASE.spirituality.color})`, borderRadius: 3, transition: "width .6s" }} />
            </div>
            <p style={{ color: C.tan, fontSize: 12, marginTop: 6 }}>{doneItems} of {totalItems} completed · {completionPct}%</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: C.white, lineHeight: 1 }}>{completionPct}%</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 2 }}>Done</p>
          </div>
        </div>
      </div>

      {/* Commitment quote */}
      <div style={{ background: `linear-gradient(135deg,${C.ocean}f0,${C.oceanMid})`, padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
        <p style={{ color: C.tan, fontSize: 13, fontStyle: "italic", textAlign: "center", opacity: 0.9 }}>
          "Discipline is choosing between what you want now and what you want most." — A. Lincoln
        </p>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 960, margin: "0 auto" }}>
        {/* Plan columns */}
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8, marginBottom: 24 }}>
          {plans.map((pl) => {
            const donePl = pl.items.filter(it => checked[it.id]).length;
            return (
              <div key={pl.key} style={{ minWidth: 280, maxWidth: 320, background: C.white, borderRadius: 16, flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,.07)", border: `1px solid ${C.warmGray}` }}>
                {/* Column header */}
                <div style={{ background: `linear-gradient(135deg,${pl.color}18,${pl.color}08)`, padding: "18px 20px 14px", borderBottom: `3px solid ${pl.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 22 }}>{pl.icon}</span>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: pl.color }}>{pl.title}</h4>
                    </div>
                    <span style={{ fontSize: 11, background: `${pl.color}20`, color: pl.color, padding: "3px 8px", borderRadius: 10, fontWeight: 600 }}>{donePl}/{pl.items.length}</span>
                  </div>
                  <div style={{ height: 4, background: `${pl.color}20`, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(donePl / pl.items.length) * 100}%`, background: pl.color, borderRadius: 2, transition: "width .5s" }} />
                  </div>
                </div>
                {/* Items */}
                <div style={{ padding: "12px 16px 16px" }}>
                  {pl.items.map((item) => {
                    const isDone = !!checked[item.id];
                    return (
                      <div key={item.id} onClick={() => toggleItem(item.id, item.pts)} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, cursor: "pointer", padding: "8px 10px", borderRadius: 8, background: isDone ? `${pl.color}08` : "transparent", border: `1px solid ${isDone ? pl.color + "30" : "transparent"}`, transition: "all .2s" }}
                        onMouseEnter={e => { if (!isDone) e.currentTarget.style.background = "#f8f7f5"; }}
                        onMouseLeave={e => { if (!isDone) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isDone ? pl.color : C.warmGray}`, background: isDone ? pl.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all .2s" }}>
                          {isDone && <span style={{ color: C.white, fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: isDone ? C.textLight : C.textMid, fontSize: 13, lineHeight: 1.45, textDecoration: isDone ? "line-through" : "none", transition: "all .2s" }}>{item.text}</p>
                          <p style={{ fontSize: 10, color: pl.color, marginTop: 2, fontWeight: 600 }}>+{item.pts} pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MY GOALS ── */}
        <div style={{ background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,.07)", border: `1px solid ${C.warmGray}` }}>
          {/* Goals header */}
          <div style={{ background: `linear-gradient(135deg,${C.ocean},${C.oceanMid})`, padding: "18px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>🎯</span>
              <h4 style={{ fontFamily: "'Playfair Display',serif", color: C.white, fontSize: 18 }}>My Commitments</h4>
            </div>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: 12, lineHeight: 1.5 }}>
              Set bold goals. Hold yourself accountable. Every completion earns points and builds the identity you're becoming.
            </p>
          </div>

          {/* Add goal form */}
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.warmGray}`, background: C.offWhite }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.textLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Add New Commitment</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addGoal(); }}
                placeholder="What will you commit to?"
                style={{ flex: 1, minWidth: 200, padding: "11px 16px", borderRadius: 10, border: `1.5px solid ${C.warmGray}`, background: C.white, color: C.textDark, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none" }}
                onFocus={e => e.target.style.borderColor = C.ocean}
                onBlur={e => e.target.style.borderColor = C.warmGray}
              />
              <div style={{ display: "flex", gap: 6 }}>
                {["small", "big"].map(t => (
                  <button key={t} onClick={() => setGoalType(t)} style={{ padding: "11px 16px", borderRadius: 10, border: `1.5px solid ${goalType === t ? C.ocean : C.warmGray}`, background: goalType === t ? C.ocean : C.white, color: goalType === t ? C.white : C.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}>
                    {t === "small" ? "+2 pts" : "+5 pts"}
                  </button>
                ))}
                <button onClick={addGoal} disabled={!goalInput.trim()} style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: goalInput.trim() ? `linear-gradient(135deg,${C.tan},${C.gold})` : C.warmGray, color: goalInput.trim() ? C.ocean : C.textLight, fontSize: 13, fontWeight: 700, cursor: goalInput.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}>
                  Commit →
                </button>
              </div>
            </div>
          </div>

          {/* Goals list */}
          <div style={{ padding: "16px 24px 20px" }}>
            {goals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🌱</p>
                <p style={{ color: C.textLight, fontSize: 13 }}>No commitments yet. Your future self is waiting.</p>
              </div>
            ) : (
              goals.map((g) => {
                const isDone = !!checked[g.id];
                return (
                  <div key={g.id} onClick={() => toggleItem(g.id, g.pts)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", borderRadius: 10, marginBottom: 8, background: isDone ? `${C.success}10` : C.offWhite, border: `1.5px solid ${isDone ? C.success + "40" : C.warmGray}`, cursor: "pointer", transition: "all .2s" }}
                    onMouseEnter={e => { if (!isDone) e.currentTarget.style.borderColor = C.ocean + "40"; }}
                    onMouseLeave={e => { if (!isDone) e.currentTarget.style.borderColor = C.warmGray; }}
                  >
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isDone ? C.success : C.ocean}`, background: isDone ? C.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .25s" }}>
                      {isDone && <span style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                    <p style={{ flex: 1, color: isDone ? C.textLight : C.textDark, fontSize: 14, textDecoration: isDone ? "line-through" : "none", transition: "all .2s" }}>{g.text}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: g.type === "big" ? C.gold : C.accent, background: g.type === "big" ? `${C.gold}15` : `${C.accent}12`, padding: "3px 8px", borderRadius: 8 }}>+{g.pts} pts</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Accountability footer */}
          <div style={{ background: `linear-gradient(135deg,${C.ocean}08,${C.oceanMid}12)`, padding: "14px 24px", borderTop: `1px solid ${C.warmGray}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, color: C.textLight }}>
              Small goal <span style={{ color: C.accent, fontWeight: 600 }}>+2 pts</span> · Big goal <span style={{ color: C.gold, fontWeight: 600 }}>+5 pts</span> · 1,000 pts = free month
            </p>
            <p style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>{doneItems}/{totalItems} done</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  PROGRESS VIEW  (shows current plan state + vision CTA)
// ═════════════════════════════════════════════════════════════════════
function VosProgressView({ isMobile, setSidebarOpen, setView, arch, profile, points, planChecked, planGoals }) {
  const allPlanItems = [
    ...DEFAULT_PLAN_ITEMS.mental,
    ...DEFAULT_PLAN_ITEMS.physical,
    ...DEFAULT_PLAN_ITEMS.spiritual,
    ...planGoals,
  ];
  const totalItems = allPlanItems.length;
  const doneItems = allPlanItems.filter(it => planChecked[it.id]).length;
  const completionPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const allDone = totalItems > 0 && doneItems === totalItems;

  const categories = [
    { key: "mental",   label: "Mental",   icon: "🧠", color: PHASE.mentality.color,   items: DEFAULT_PLAN_ITEMS.mental },
    { key: "physical", label: "Physical", icon: "💪", color: PHASE.physicality.color, items: DEFAULT_PLAN_ITEMS.physical },
    { key: "spiritual",label: "Spiritual",icon: "✨", color: PHASE.spirituality.color,items: DEFAULT_PLAN_ITEMS.spiritual },
  ];

  return (
    <div style={{ flex: 1, background: "#F4F2EF", height: "100vh", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ background: C.ocean, padding: "0 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 0 16px", borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: 20 }}>
          {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: C.tan, cursor: "pointer", fontSize: 20, marginRight: 12 }}>☰</button>}
          <button onClick={() => setView("chat")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 14, marginRight: 12 }}>← Chat</button>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", color: C.white, fontSize: 20, marginBottom: 2 }}>Your Progress</h3>
            <p style={{ color: C.tan, fontSize: 12, opacity: 0.7 }}>{arch.name} · {arch.drive}</p>
          </div>
          <button onClick={() => setView("plans")} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(212,184,150,.3)", background: "rgba(212,184,150,.08)", color: C.tan, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Edit Plan →
          </button>
        </div>

        {/* Big completion ring */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={allDone ? C.gold : PHASE.spirituality.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - completionPct / 100)}`}
                style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: C.white, lineHeight: 1 }}>{completionPct}%</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginTop: 2 }}>DONE</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: C.white, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              {allDone ? "🏆 All tasks complete!" : `${doneItems} of ${totalItems} tasks done`}
            </p>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
              {allDone
                ? "You've fulfilled your commitment. You're ready to generate your ideal life vision."
                : `${totalItems - doneItems} tasks remaining. Keep going — your future self is counting on you.`}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: C.warning }}>⭐ {points}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>Points</p>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,.08)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: PHASE.physicality.color }}>{doneItems}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 640, margin: "0 auto" }}>
        {/* Category breakdown */}
        <p style={{ fontSize: 11, color: C.textLight, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>Category Breakdown</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {categories.map(cat => {
            const catDone = cat.items.filter(it => planChecked[it.id]).length;
            const catPct = Math.round((catDone / cat.items.length) * 100);
            return (
              <div key={cat.key} style={{ background: C.white, borderRadius: 14, padding: "16px 18px", border: `1px solid ${C.warmGray}`, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <span style={{ fontWeight: 600, color: cat.color, fontSize: 14 }}>{cat.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: catPct === 100 ? C.success : C.textLight }}>
                    {catDone}/{cat.items.length} {catPct === 100 ? "✓" : ""}
                  </span>
                </div>
                <div style={{ height: 5, background: C.warmGray, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${catPct}%`, background: cat.color, borderRadius: 3, transition: "width .8s" }} />
                </div>
                {/* Checklist preview */}
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  {cat.items.map(it => {
                    const done = !!planChecked[it.id];
                    return (
                      <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${done ? cat.color : C.warmGray}`, background: done ? cat.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
                          {done && <span style={{ color: C.white, fontSize: 8, fontWeight: 700 }}>✓</span>}
                        </div>
                        <p style={{ fontSize: 12, color: done ? C.textLight : C.textMid, textDecoration: done ? "line-through" : "none" }}>{it.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Personal goals */}
          {planGoals.length > 0 && (
            <div style={{ background: C.white, borderRadius: 14, padding: "16px 18px", border: `1px solid ${C.warmGray}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                <span style={{ fontWeight: 600, color: C.ocean, fontSize: 14 }}>My Commitments</span>
                <span style={{ fontSize: 12, color: C.textLight, marginLeft: "auto" }}>
                  {planGoals.filter(g => planChecked[g.id]).length}/{planGoals.length}
                </span>
              </div>
              {planGoals.map(g => {
                const done = !!planChecked[g.id];
                return (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${done ? C.success : C.warmGray}`, background: done ? C.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {done && <span style={{ color: C.white, fontSize: 8, fontWeight: 700 }}>✓</span>}
                    </div>
                    <p style={{ fontSize: 12, color: done ? C.textLight : C.textMid, textDecoration: done ? "line-through" : "none" }}>{g.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── VISION CTA ── */}
        <div onClick={() => setView("vision")} style={{
          background: `linear-gradient(135deg, ${C.ocean}, #1a1040)`,
          borderRadius: 20, padding: "28px 24px", cursor: "pointer",
          border: `1px solid ${allDone ? C.gold + "60" : "rgba(255,255,255,.08)"}`,
          boxShadow: allDone ? `0 0 40px ${C.gold}25` : "0 4px 20px rgba(0,0,0,.12)",
          position: "relative", overflow: "hidden",
          transition: "all .3s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = allDone ? `0 8px 48px ${C.gold}40` : "0 8px 32px rgba(0,0,0,.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = allDone ? `0 0 40px ${C.gold}25` : "0 4px 20px rgba(0,0,0,.12)"; }}
        >
          {/* Star field bg */}
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ position: "absolute", width: 2, height: 2, borderRadius: "50%", background: "rgba(255,255,255,.3)", top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animation: `pulse ${1.5 + Math.random()}s infinite ${Math.random()}s` }} />
          ))}
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 36, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>
              {allDone ? "🔮" : "✨"}
            </div>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              {allDone ? "You're ready" : `${completionPct}% complete`}
            </p>
            <h3 style={{ fontFamily: "'Playfair Display',serif", color: C.white, fontSize: 22, lineHeight: 1.3, marginBottom: 10 }}>
              Generate Your Ideal<br />
              <span style={{ color: allDone ? C.gold : C.tan }}>Life Picture in 6 Months</span>
            </h3>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              {allDone
                ? "VOS will craft a vivid, personalized vision of your transformed life — based on your archetype, commitments and growth path."
                : "Complete your commitments to unlock your personalized 6-month vision. Your future self awaits."}
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 50, background: allDone ? `linear-gradient(135deg,${C.tan},${C.gold})` : "rgba(255,255,255,.08)", color: allDone ? C.ocean : "rgba(255,255,255,.4)", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
              {allDone ? "Generate My Vision →" : `${totalItems - doneItems} tasks remaining`}
            </div>
            {!allDone && (
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 10 }}>You can still preview — click to see what awaits you</p>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", color: C.textLight, fontSize: 11, marginTop: 16 }}>
          🛡️ If you follow VOS guidance and don't see results in 6 months — full refund, no questions asked.
        </p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  VISION VIEW  — "Generate Your Ideal Life in 6 Months"
// ═════════════════════════════════════════════════════════════════════
function VosVisionView({ isMobile, setSidebarOpen, setView, arch, profile, planChecked, planGoals }) {
  const [stage, setStage] = useState("idle"); // idle | generating | done
  const [vision, setVision] = useState("");
  const [showGuarantee, setShowGuarantee] = useState(false);

  const allItems = [...DEFAULT_PLAN_ITEMS.mental, ...DEFAULT_PLAN_ITEMS.physical, ...DEFAULT_PLAN_ITEMS.spiritual, ...planGoals];
  const doneItems = allItems.filter(it => planChecked[it.id]).length;
  const completionPct = allItems.length > 0 ? Math.round((doneItems / allItems.length) * 100) : 0;

  const generateVision = async () => {
    setStage("generating");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          messages: [{
            role: "user",
            content: `You are VOS — a powerful identity transformation AI. Write a vivid, cinematic, deeply personal 6-month life vision for this user.

USER ARCHETYPE: ${arch.name}
CORE DRIVE: ${arch.drive}
STRENGTHS: ${arch.strengths.join(", ")}
GROWTH PATH: ${arch.growth}
MOTIVATOR: ${profile?.motivator || "achievement"}
CURRENT STATE: ${profile?.currentState || "exploring"}
COMPLETION: ${completionPct}% of their 3-month plan achieved
PERSONAL GOALS: ${planGoals.map(g => g.text).join(", ") || "none set"}

Write 4 short vivid paragraphs (2-3 sentences each) describing their transformed life in exactly 6 months. Be SPECIFIC to their archetype and goals. Use second person ("You wake up..."). Make it emotional, concrete, and aspirational — not generic. Cover: morning self, relationships/work, mental state, and one defining moment that shows their transformation. Keep it under 280 words total. No headers. Just flowing, powerful prose.`
          }]
        })
      });
      const data = await res.json();
      setVision(data.content?.map(c => c.text || "").join("") || "");
      setStage("done");
    } catch (e) {
      setVision("Connection issue. Please try again.");
      setStage("done");
    }
  };

  const paragraphs = vision.split("\n\n").filter(p => p.trim());

  return (
    <div style={{ flex: 1, height: "100vh", overflowY: "auto", background: "linear-gradient(160deg,#060F1A 0%,#0C2340 50%,#1a1040 100%)", position: "relative" }}>
      {/* Starfield */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[...Array(40)].map((_, i) => (
          <div key={i} style={{ position: "absolute", borderRadius: "50%", background: "white", width: Math.random() * 2 + 1, height: Math.random() * 2 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 + 0.1, animation: `pulse ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s` }} />
        ))}
      </div>

      {/* Nav */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: C.tan, cursor: "pointer", fontSize: 20, marginRight: 12 }}>☰</button>}
        <button onClick={() => setView("progress")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 14, marginRight: 12 }}>← Progress</button>
        <span style={{ fontFamily: "'Playfair Display',serif", color: C.white, fontSize: 16 }}>6-Month Life Vision</span>
      </div>

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "32px 24px 60px", position: "relative" }}>

        {/* Stage: idle */}
        {stage === "idle" && (
          <div style={{ textAlign: "center", animation: "fadeIn .6s ease" }}>
            <div style={{ fontSize: 72, marginBottom: 20, animation: "float 3s ease-in-out infinite" }}>🔮</div>
            <p style={{ color: C.tan, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Ready to see</p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,5vw,42px)", color: C.white, lineHeight: 1.2, marginBottom: 16 }}>
              Your Ideal Life<br /><span style={{ color: C.gold }}>in 6 Months</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 15, lineHeight: 1.7, marginBottom: 12, maxWidth: 440, margin: "0 auto 16px" }}>
              VOS will paint a vivid, personalized vision of the life you're building — grounded in your archetype, your commitments, and the identity you're becoming.
            </p>
            {completionPct < 100 && (
              <div style={{ display: "inline-block", padding: "8px 18px", borderRadius: 20, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.4)", fontSize: 12, marginBottom: 24 }}>
                {completionPct}% of your plan complete — vision will reflect your progress
              </div>
            )}

            {/* Archetype badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 20px", background: "rgba(255,255,255,.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", marginBottom: 36, maxWidth: 320, margin: "0 auto 36px" }}>
              <span style={{ fontSize: 28 }}>{arch.icon}</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ color: C.tan, fontSize: 12, fontWeight: 600 }}>{arch.name}</p>
                <p style={{ color: "rgba(255,255,255,.3)", fontSize: 11 }}>{arch.drive}</p>
              </div>
            </div>

            <button onClick={generateVision} style={{
              padding: "18px 52px", borderRadius: 50, border: "none",
              background: `linear-gradient(135deg,${C.tan},${C.gold})`,
              color: C.ocean, fontSize: 17, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.5,
              boxShadow: `0 8px 32px ${C.gold}40`,
              animation: "breathe 3s infinite",
              transition: "transform .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >Generate My Vision ✦</button>

            {/* Guarantee */}
            <div style={{ marginTop: 32 }}>
              <button onClick={() => setShowGuarantee(!showGuarantee)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.3)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                🛡️ 100% Results Guarantee
              </button>
              {showGuarantee && (
                <div style={{ marginTop: 12, padding: "16px 20px", background: "rgba(255,255,255,.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", animation: "fadeIn .3s ease", textAlign: "left" }}>
                  <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, lineHeight: 1.7 }}>
                    <strong style={{ color: C.tan }}>We stand behind VOS completely.</strong> If you follow the guidance your personalized mentor gives you — consistently, for 6 months — and you don't experience meaningful transformation in your mindset, habits, and direction, we will issue a full refund. No questions asked. No hoops to jump through.
                  </p>
                  <p style={{ color: "rgba(255,255,255,.35)", fontSize: 11, marginTop: 8 }}>Valid for Premium and Lifetime members who completed their 3-Month Master Plan.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stage: generating */}
        {stage === "generating" && (
          <div style={{ textAlign: "center", paddingTop: 60, animation: "fadeIn .5s ease" }}>
            <div style={{ width: 80, height: 80, margin: "0 auto 28px", position: "relative" }}>
              <div style={{ width: 80, height: 80, border: "3px solid transparent", borderTop: `3px solid ${C.tan}`, borderRight: `3px solid ${PHASE.spirituality.color}`, borderRadius: "50%", animation: "spin 1.2s linear infinite" }} />
              <div style={{ position: "absolute", inset: 12, border: "2px solid transparent", borderBottom: `2px solid ${PHASE.mentality.color}`, borderRadius: "50%", animation: "spin 1.8s linear infinite reverse" }} />
            </div>
            <p style={{ fontFamily: "'Playfair Display',serif", color: C.white, fontSize: 22, marginBottom: 12 }}>Weaving your vision...</p>
            <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13, animation: "pulse 1.5s infinite" }}>Mapping your archetype · Building your future · Seeing who you'll become</p>
          </div>
        )}

        {/* Stage: done */}
        {stage === "done" && (
          <div style={{ animation: "fadeIn .8s ease" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ fontSize: 48, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>🔮</div>
              <p style={{ color: C.tan, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Your Vision · 6 Months From Now</p>
              <h2 style={{ fontFamily: "'Playfair Display',serif", color: C.white, fontSize: "clamp(22px,4vw,32px)", marginBottom: 4 }}>{arch.name}</h2>
              <p style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>{arch.drive}</p>
            </div>

            {/* Vision paragraphs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
              {paragraphs.map((para, i) => (
                <div key={i} style={{ padding: "20px 24px", background: "rgba(255,255,255,.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", borderLeft: `3px solid ${[PHASE.mentality.color, PHASE.physicality.color, PHASE.spirituality.color, C.gold][i % 4]}`, animation: `fadeIn .5s ease ${i * 0.15}s both` }}>
                  <p style={{ color: "rgba(255,255,255,.82)", fontSize: 15, lineHeight: 1.8, fontStyle: "italic", fontFamily: "'Playfair Display',serif" }}>{para}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
              <button onClick={generateVision} style={{ padding: "13px 28px", borderRadius: 50, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.6)", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                ↺ Regenerate
              </button>
              <button onClick={() => setView("plans")} style={{ padding: "13px 28px", borderRadius: 50, border: "none", background: `linear-gradient(135deg,${C.tan},${C.gold})`, color: C.ocean, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Back to My Plan →
              </button>
            </div>

            {/* Guarantee banner */}
            <div style={{ padding: "16px 20px", background: "rgba(46,170,107,.08)", border: "1px solid rgba(46,170,107,.2)", borderRadius: 14, textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, lineHeight: 1.6 }}>
                🛡️ <strong style={{ color: C.success }}>Full Results Guarantee.</strong> Follow VOS guidance for 6 months and don't transform? We refund completely. No questions asked.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  PRICING VIEW  (top-level)
// ═════════════════════════════════════════════════════════════════════
function VosPricingView({ isMobile, setSidebarOpen, setView, points }) {
  return (
    <div style={{ flex: 1, background: C.chatBg, height: "100vh", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${C.warmGray}`, background: C.white }}>
        {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: C.ocean, cursor: "pointer", fontSize: 20, marginRight: 12 }}>☰</button>}
        <button onClick={() => setView("chat")} style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", fontSize: 14, marginRight: 12 }}>← Chat</button>
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: C.textDark, fontSize: 18 }}>Upgrade for Memory</h3>
      </div>
      <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <p style={{ color: C.textMid, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Unlock persistent memory so your mentor remembers every session, tracks your progress, and provides deep personalized analysis over time.</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <PriceCard title="Free" price="$0" period="forever" features={["Basic AI chat", "Session-only memory", "Quiz + archetype profile", "Community access"]} cta="Current Plan" disabled accent={C.textLight} />
          <PriceCard title="Premium" price="$59" period="/ 2 months" features={["Persistent AI memory", "Deep personality analysis", "Pattern recognition engine", "Research-backed insights", "Weekly progress reports", "Priority support"]} cta="Upgrade Now" featured accent={C.accent} />
          <PriceCard title="Lifetime" price="$5,000" period="one-time" features={["Everything in Premium", "Lifetime access forever", "Early feature access", "1-on-1 onboarding", "Custom archetype deep-dive", "Legacy member status"]} cta="Go Lifetime" accent={C.gold} />
        </div>
        <p style={{ textAlign: "center", color: C.textLight, fontSize: 12, marginTop: 24 }}>🏆 Earn 1,000 points to get a free premium month. Currently: ⭐ {points} pts</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  MAIN APP  (slim orchestrator — no sub-components defined inside)
// ═════════════════════════════════════════════════════════════════════
function MainApp({ profile, user, sessions, setSessions, activeSession, setActiveSession, points, setPoints, streak, save, setShowCrisis, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  // Lifted plan state so Progress view can read it
  const [planChecked, setPlanChecked] = useState({});
  const [planGoals, setPlanGoals] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const arch = profile?.archetypeData || ARCHETYPES.intellectual;

  const hasUserMessages = messages.some(m => m.role === "user");
  const bubblesVisible = view === "chat" && !hasUserMessages && input === "" && !isLoading;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "ai",
        text: `Welcome, ${arch.name} ${arch.icon}\n\nI've calibrated to your psychological profile. Your primary drive is **${arch.drive}**, and your growth path is to *${arch.growth.toLowerCase()}*.\n\nWhat would you like to work on today?`,
        time: Date.now(),
      }]);
    }
  }, [sessionKey]);

  const newSession = () => {
    if (messages.some(m => m.role === "user")) {
      const title = messages.find(m => m.role === "user")?.text?.slice(0, 40) || "Session";
      const ns = [...sessions, { id: Date.now(), title, messages, time: Date.now() }];
      setSessions(ns);
      save({ sessions: ns });
    }
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setActiveSession(null);
    setView("chat");
    setIsLoading(false);
    setIsTyping(false);
    setSessionKey(k => k + 1);
    if (isMobile) setSidebarOpen(false);
  };

  const loadSession = (s) => {
    setMessages(s.messages);
    setActiveSession(s.id);
    setView("chat");
    if (isMobile) setSidebarOpen(false);
  };

  const buildSystemPrompt = () => {
    const sec = profile?.secondaryData || ARCHETYPES.transformer;
    return `You are VOS — an AI mentor for identity transformation. Behavior-shaping, emotionally intelligent.

USER PROFILE:
- Primary Archetype: ${arch.name} (${arch.drive})
- Secondary: ${sec.name} (${sec.drive})
- Strengths: ${arch.strengths.join(", ")}
- Shadow: ${arch.shadow} (${arch.weaknesses.join(", ")})
- Growth: ${arch.growth}
- PACER Learning: ${profile?.pacerType || "Conceptual"}
- State: ${profile?.currentState || "exploring"}
- Motivator: ${profile?.motivator || "achievement"}
- Fear: ${profile?.fear || "uncertainty"}
- Scores: Intro ${profile?.personality?.introversion || 50}, Open ${profile?.personality?.openness || 50}, Disc ${profile?.personality?.discipline || 50}, Emot ${profile?.personality?.emotional_stability || 50}

RESPONSE STRUCTURE:
1. **Understanding** — Mirror precisely
2. **Hidden Truth** — Reveal blind spot
3. **Reframe** — Shift identity/belief
4. **Strategy** — Clear direction
5. **Action System** — 3-5 steps
6. **Emotional Anchor** — One powerful closing line

LEARNING: ${profile?.learning === "P" ? "PROCEDURAL" : profile?.learning === "A" ? "ANALOGOUS" : profile?.learning === "C" ? "CONCEPTUAL" : profile?.learning === "E" ? "EVIDENCE" : "REFERENCE"}
TONE: Calm, intelligent, grounded. Wise mentor + strategist. Evoke hope, pride, belief.
CRISIS: Warmth, validation, encourage professional support.
RULES: No medical/legal advice. Under 250 words unless needed. Figures: ${arch.figures.join(", ")}`;
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setIsTyping(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    const userMsg = { role: "user", text, time: Date.now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);
    setTimeout(() => {
      setMessages([...newMsgs, {
        role: "ai",
        text: "⚠️ THIS is only for viewing purposes only. The AI is not functional yet.\n\nIf you know a Technician, please recommend them to me for this project.",
        time: Date.now(),
      }]);
      setIsLoading(false);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", position: "relative" }}>
      <VosSidebar
        isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        sessions={sessions} activeSession={activeSession} points={points} streak={streak}
        onNewSession={newSession} onLoadSession={loadSession} onLogout={onLogout}
      />
      {view === "chat" && (
        <VosChatView
          isMobile={isMobile} setSidebarOpen={setSidebarOpen}
          view={view} setView={setView}
          messages={messages} isLoading={isLoading} isTyping={isTyping}
          bubblesVisible={bubblesVisible} profile={profile}
          input={input} setInput={setInput}
          onSend={sendMessage} onStop={stopGeneration}
          messagesEndRef={messagesEndRef} inputRef={inputRef}
        />
      )}
      {view === "profile" && (
        <VosProfileView
          isMobile={isMobile} setSidebarOpen={setSidebarOpen} setView={setView}
          profile={profile} arch={arch} points={points} streak={streak}
        />
      )}
      {view === "plans" && (
        <VosPlansView
          isMobile={isMobile} setSidebarOpen={setSidebarOpen} setView={setView}
          arch={arch} setPoints={setPoints}
          planChecked={planChecked} setPlanChecked={setPlanChecked}
          planGoals={planGoals} setPlanGoals={setPlanGoals}
        />
      )}
      {view === "progress" && (
        <VosProgressView
          isMobile={isMobile} setSidebarOpen={setSidebarOpen} setView={setView}
          arch={arch} profile={profile} points={points}
          planChecked={planChecked} planGoals={planGoals}
        />
      )}
      {view === "vision" && (
        <VosVisionView
          isMobile={isMobile} setSidebarOpen={setSidebarOpen} setView={setView}
          arch={arch} profile={profile}
          planChecked={planChecked} planGoals={planGoals}
        />
      )}
      {view === "pricing" && (
        <VosPricingView
          isMobile={isMobile} setSidebarOpen={setSidebarOpen} setView={setView}
          points={points}
        />
      )}
    </div>
  );
}



// ── Top bar button ──
function TopBtn({label,icon,active,onClick}) {
  return (
    <button onClick={onClick} style={{
      padding:"6px 14px",borderRadius:8,border:`1px solid ${active?C.accent:C.warmGray}`,
      background:active?`${C.accent}10`:C.white,
      color:active?C.accent:C.textMid,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
      display:"flex",alignItems:"center",gap:4,transition:"all .15s",
    }}
    onMouseEnter={e=>{if(!active)e.currentTarget.style.background=C.offWhite}}
    onMouseLeave={e=>{if(!active)e.currentTarget.style.background=C.white}}
    >{icon} {label}</button>
  );
}

// ── Pricing card ──
function PriceCard({title,price,period,features,cta,disabled,featured,accent}) {
  return (
    <div style={{
      flex:"1 1 220px",maxWidth:260,background:featured?C.ocean:C.white,borderRadius:16,padding:28,
      border:featured?"none":`1px solid ${C.warmGray}`,
      boxShadow:featured?"0 8px 32px rgba(12,35,64,.2)":"none",
      position:"relative",overflow:"hidden",
    }}>
      {featured && <div style={{position:"absolute",top:12,right:-28,background:C.tan,color:C.ocean,fontSize:10,fontWeight:700,padding:"4px 32px",transform:"rotate(45deg)",letterSpacing:.5}}>POPULAR</div>}
      <h4 style={{fontSize:14,fontWeight:600,color:featured?C.tanLight:C.textLight,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{title}</h4>
      <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:4}}>
        <span style={{fontSize:36,fontWeight:700,color:featured?C.white:C.textDark}}>{price}</span>
        <span style={{fontSize:13,color:featured?"rgba(255,255,255,.5)":C.textLight}}>{period}</span>
      </div>
      <div style={{height:1,background:featured?"rgba(255,255,255,.1)":C.warmGray,margin:"16px 0"}}/>
      {features.map((f,i)=>(
        <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
          <span style={{color:accent,fontSize:12}}>✓</span>
          <span style={{fontSize:13,color:featured?"rgba(255,255,255,.7)":C.textMid}}>{f}</span>
        </div>
      ))}
      <button disabled={disabled} style={{
        width:"100%",padding:12,borderRadius:10,border:featured?"none":`1px solid ${C.warmGray}`,
        background:featured?`linear-gradient(135deg,${C.tan},${C.gold})`:disabled?"transparent":C.offWhite,
        color:featured?C.ocean:disabled?C.textLight:C.textDark,
        fontSize:14,fontWeight:600,cursor:disabled?"default":"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:16,transition:"all .2s",
      }}>{cta}</button>
    </div>
  );
}
