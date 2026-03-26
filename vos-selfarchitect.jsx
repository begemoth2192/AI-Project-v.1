import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants & Data ───────────────────────────────────────────────
const COLORS = {
  blue: "#1B3A5C",
  blueLight: "#2A5F8F",
  blueSoft: "#3A7BC8",
  red: "#8B2232",
  redDark: "#6B1A28",
  redLight: "#A83248",
  tan: "#D4B896",
  tanLight: "#E8D5BC",
  tanSoft: "#F2E8DA",
  bg: "#0F1923",
  bgCard: "#162636",
  bgLight: "#1D3347",
  text: "#F0EDE8",
  textMuted: "#9BABBF",
  textDim: "#5E7389",
  white: "#FFFFFF",
  success: "#4CAF7D",
  warning: "#E8A838",
};

const ARCHETYPES = {
  sovereign: { name: "The Sovereign", icon: "👑", drive: "Order & Structure", strengths: ["Responsibility","Organization","Strategic thinking","Stability"], weaknesses: ["Controlling","Fear of chaos","Difficulty delegating"], shadow: "The Tyrant", figures: ["Marcus Aurelius","Queen Elizabeth I"], growth: "Learn to empower others without losing structure" },
  relational: { name: "The Relational", icon: "💫", drive: "Connection", strengths: ["Empathy","Aesthetic appreciation","Deep emotional bonds"], weaknesses: ["Loss of self-identity","Over-sensitivity","Fear of rejection"], shadow: "The Addict", figures: ["Rumi","Maya Angelou"], growth: "Build self-worth independent of others' validation" },
  guardian: { name: "The Guardian", icon: "🛡️", drive: "Protection", strengths: ["Discipline","Loyalty","Boundary protection","Nurturing"], weaknesses: ["Burnout","Martyr complex","Unnecessary aggression"], shadow: "The Mercenary", figures: ["Alexander the Great","Florence Nightingale"], growth: "Protect without sacrificing your own needs" },
  intellectual: { name: "The Intellectual", icon: "🧠", drive: "Knowledge", strengths: ["Analysis","Strategic foresight","Mastery of logic"], weaknesses: ["Isolation","Analysis paralysis","Emotional detachment"], shadow: "The Ivory Tower", figures: ["Albert Einstein","Marie Curie"], growth: "Connect knowledge to emotional wisdom" },
  autonomous: { name: "The Autonomous", icon: "🧭", drive: "Independence", strengths: ["Self-reliance","Bravery","Pioneer spirit"], weaknesses: ["Fear of commitment","Restlessness","Social alienation"], shadow: "The Wanderer", figures: ["Amelia Earhart","Ernest Hemingway"], growth: "Find freedom within commitment, not from it" },
  transformer: { name: "The Transformer", icon: "🔮", drive: "Change", strengths: ["Intuition","Rapid adaptation","Psychological rebirth"], weaknesses: ["Manipulation","Unreliability","Losing touch with reality"], shadow: "The Con Artist", figures: ["Nikola Tesla","Frida Kahlo"], growth: "Ground your vision in consistent action" },
};

const PACER_TYPES = { P: "Procedural", A: "Analogous", C: "Conceptual", E: "Evidence", R: "Reference" };

const QUIZ_BANK = [
  { id: 1, q: "How often do you feel unsure about your life direction?", type: "scale", options: ["Almost always","Often","Sometimes","Rarely","Never"], dimension: "direction", weight: { direction: [5,4,3,2,1], emotional_stability: [1,2,3,4,5] } },
  { id: 2, q: "What motivates you most deeply?", type: "choice", options: ["Achievement & mastery","Security & stability","Helping others","Freedom & exploration","Recognition & status"], dimension: "motivator", weight: { motivator_map: ["achievement","security","helping","freedom","recognition"] } },
  { id: 3, q: "When facing a difficult problem, you typically:", type: "choice", options: ["Analyze it logically step by step","Trust your gut feeling","Ask others for perspective","Take immediate action","Avoid it until necessary"], dimension: "approach", weight: { approach_map: ["analytical","intuitive","social","action","avoidant"] } },
  { id: 4, q: "How do you recharge after a draining day?", type: "choice", options: ["Alone with my thoughts","Physical activity","Deep conversation with someone","Creative expression","Sleep or escape"], dimension: "energy", weight: { introversion: [5,2,1,3,4] } },
  { id: 5, q: "Which fear resonates most with you?", type: "choice", options: ["Being powerless","Being alone","Being meaningless","Being trapped","Being exposed as a fraud"], dimension: "fear", weight: { fear_map: ["powerlessness","isolation","meaninglessness","entrapment","impostor"] } },
  { id: 6, q: "How disciplined are you with daily routines?", type: "scale", options: ["Very disciplined","Mostly consistent","It depends","Struggle often","No routine at all"], dimension: "discipline", weight: { discipline: [5,4,3,2,1] } },
  { id: 7, q: "When someone criticizes you, your first reaction is:", type: "choice", options: ["Reflect on whether it's valid","Feel hurt but hide it","Get defensive","Use it as fuel","Dismiss it entirely"], dimension: "resilience", weight: { emotional_stability: [5,2,1,3,4], openness: [5,4,1,3,2] } },
  { id: 8, q: "What does success look like to you?", type: "choice", options: ["Financial freedom","Inner peace","Impact on others","Personal mastery","Family & relationships"], dimension: "success_vision", weight: { success_map: ["financial","peace","impact","mastery","relationships"] } },
  { id: 9, q: "How do you learn best?", type: "choice", options: ["Step-by-step practice","Stories and examples","Mind maps & frameworks","Data and evidence","Repetition & review"], dimension: "learning", weight: { pacer: ["P","A","C","E","R"] } },
  { id: 10, q: "How open are you to changing your beliefs?", type: "scale", options: ["Extremely open","Quite open","Somewhat open","Resistant","Very fixed"], dimension: "openness", weight: { openness: [5,4,3,2,1] } },
  { id: 11, q: "What keeps you up at night?", type: "choice", options: ["Unfinished goals","Relationship worries","Financial stress","Existential questions","Nothing specific, just anxiety"], dimension: "anxiety_source", weight: { anxiety_map: ["goals","relationships","financial","existential","general"] } },
  { id: 12, q: "How would your closest friend describe you?", type: "choice", options: ["The reliable one","The dreamer","The fighter","The wise one","The free spirit"], dimension: "identity", weight: { archetype_hint: ["sovereign","transformer","guardian","intellectual","autonomous"] } },
  { id: 13, q: "Your relationship with authority is:", type: "choice", options: ["I respect structure","I challenge it when wrong","I prefer to be the authority","I avoid it entirely","I adapt to survive it"], dimension: "authority", weight: { authority_map: ["conformist","challenger","leader","avoider","adaptive"] } },
  { id: 14, q: "What area of life needs the most improvement?", type: "choice", options: ["Career & purpose","Health & energy","Relationships","Mental clarity","Financial situation"], dimension: "growth_area", weight: { growth_map: ["career","health","relationships","mental","financial"] } },
  { id: 15, q: "When you imagine your ideal self in 5 years:", type: "choice", options: ["Calm, wise, and grounded","Powerful and influential","Free and adventurous","Connected and loved","Creating something meaningful"], dimension: "vision", weight: { vision_map: ["sage","ruler","explorer","lover","creator"] } },
];

// Adaptive follow-up questions based on answers
const ADAPTIVE_QUESTIONS = {
  direction_high: { id: 101, q: "What feels most unclear to you right now?", type: "choice", options: ["My career path","My identity","My relationships","My purpose"], dimension: "clarity", weight: { clarity_map: ["career","identity","relationships","purpose"] } },
  fear_powerlessness: { id: 102, q: "When did you first feel powerless?", type: "choice", options: ["Childhood","School years","First job","Recent event","I can't pinpoint it"], dimension: "origin", weight: {} },
  discipline_low: { id: 103, q: "What usually breaks your routine?", type: "choice", options: ["Boredom","Overwhelm","Distractions","Emotional states","Lack of motivation"], dimension: "routine_breaker", weight: { routine_map: ["boredom","overwhelm","distraction","emotional","motivation"] } },
  anxiety_general: { id: 104, q: "Does the anxiety feel more physical or mental?", type: "choice", options: ["Physical (chest, stomach)","Mental (racing thoughts)","Both equally","Hard to tell"], dimension: "anxiety_type", weight: {} },
};

const CRISIS_KEYWORDS = ["suicide","kill myself","want to die","end it all","can't take this anymore","what's the point","no reason to live","better off dead","self harm","hurt myself","give up on life","no hope","cutting myself","overdose"];

const CRISIS_HOTLINES = {
  default: { name: "International Crisis Line", number: "988 (US) / 116 123 (EU)", text: "Text HOME to 741741" },
  US: { name: "988 Suicide & Crisis Lifeline", number: "988", text: "Text HOME to 741741" },
  UK: { name: "Samaritans", number: "116 123", text: "jo@samaritans.org" },
  GE: { name: "Georgia Crisis Line", number: "116 006", text: "" },
};

const SUGGESTED_PROMPTS = [
  { icon: "🎨", title: "Unlock Creativity", subtitle: "Discover patterns from history's masters", prompt: "I want to unlock creativity" },
  { icon: "🎯", title: "Achieve Goals", subtitle: "Define, plan, and execute with precision", prompt: "I want to achieve goals" },
  { icon: "🔑", title: "Find Keystone Actions", subtitle: "Identify your highest-leverage moves", prompt: "I want to find the keystone actions" },
  { icon: "⚛️", title: "Atomic Habits", subtitle: "Build systems that transform your life", prompt: "I want to know atomic habits" },
];

// ─── Styles ─────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const baseStyles = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',sans-serif; background:${COLORS.bg}; color:${COLORS.text}; overflow-x:hidden; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeInScale { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideRight { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes typewriter { from{width:0} to{width:100%} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes breathe { 0%,100%{box-shadow:0 0 20px rgba(27,58,92,0.3)} 50%{box-shadow:0 0 40px rgba(27,58,92,0.6)} }
  .fade-in { animation: fadeIn 0.6s ease-out forwards; }
  .slide-up { animation: slideUp 0.6s ease-out forwards; }
  input:focus, textarea:focus { outline:none; }
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:${COLORS.bg}; }
  ::-webkit-scrollbar-thumb { background:${COLORS.textDim}; border-radius:3px; }
`;
const styleEl = document.createElement("style");
styleEl.textContent = baseStyles;
document.head.appendChild(styleEl);

// ─── Helper Components ──────────────────────────────────────────────
function VosLogo({ size = 40 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <svg width={size} height={size} viewBox="0 0 60 60">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={COLORS.blueSoft}/>
            <stop offset="100%" stopColor={COLORS.red}/>
          </linearGradient>
        </defs>
        <circle cx="30" cy="30" r="28" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5"/>
        <path d="M20 20 L30 42 L40 20" fill="none" stroke={COLORS.tan} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="30" cy="18" r="3" fill={COLORS.tan}/>
      </svg>
      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:size*0.55, fontWeight:600, color:COLORS.text, letterSpacing:4 }}>VOS</span>
    </div>
  );
}

function Button({ children, onClick, variant="primary", style={}, disabled=false, fullWidth=false }) {
  const variants = {
    primary: { background:`linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDark})`, color:COLORS.white, border:"none" },
    secondary: { background:"transparent", color:COLORS.text, border:`1px solid ${COLORS.textDim}` },
    ghost: { background:"transparent", color:COLORS.tanLight, border:"none" },
    blue: { background:`linear-gradient(135deg, ${COLORS.blueLight}, ${COLORS.blue})`, color:COLORS.white, border:"none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], padding:"14px 32px", borderRadius:12, fontSize:15, fontWeight:600,
      cursor: disabled?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.3s ease",
      opacity:disabled?0.5:1, width:fullWidth?"100%":"auto", letterSpacing:0.5, ...style,
    }}
    onMouseEnter={e=>{if(!disabled){e.target.style.transform="translateY(-2px)";e.target.style.boxShadow="0 8px 25px rgba(0,0,0,0.3)"}}}
    onMouseLeave={e=>{e.target.style.transform="translateY(0)";e.target.style.boxShadow="none"}}
    >{children}</button>
  );
}

function Input({ label, type="text", value, onChange, placeholder, icon }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block", marginBottom:6, fontSize:13, color:COLORS.textMuted, fontWeight:500 }}>{label}</label>}
      <div style={{ position:"relative" }}>
        {icon && <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:18 }}>{icon}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
          width:"100%", padding:"14px 16px", paddingLeft:icon?"44px":"16px", background:COLORS.bgLight, border:`1px solid ${COLORS.textDim}33`,
          borderRadius:12, color:COLORS.text, fontSize:15, fontFamily:"'DM Sans',sans-serif", transition:"border-color 0.3s",
        }}
        onFocus={e=>e.target.style.borderColor=COLORS.blueSoft}
        onBlur={e=>e.target.style.borderColor=`${COLORS.textDim}33`}
        />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display:"flex", gap:5, padding:"16px 20px", background:COLORS.bgCard, borderRadius:"18px 18px 18px 4px", maxWidth:80 }}>
      {[0,1,2].map(i=>(
        <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:COLORS.textMuted, animation:`pulse 1.4s infinite ${i*0.2}s` }}/>
      ))}
    </div>
  );
}

function CrisisModal({ onClose }) {
  const hotline = CRISIS_HOTLINES.default;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:COLORS.bgCard, borderRadius:20, padding:32, maxWidth:420, width:"100%", border:`1px solid ${COLORS.blueSoft}33`, animation:"fadeInScale 0.3s ease" }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>💙</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, marginBottom:8 }}>You're Not Alone</h3>
          <p style={{ color:COLORS.textMuted, fontSize:14, lineHeight:1.6 }}>Your feelings matter. Please reach out to someone who can help.</p>
        </div>
        <div style={{ background:COLORS.bgLight, borderRadius:12, padding:20, marginBottom:16 }}>
          <p style={{ fontWeight:600, fontSize:15, marginBottom:8 }}>{hotline.name}</p>
          <p style={{ fontSize:24, fontWeight:700, color:COLORS.blueSoft, marginBottom:4 }}>{hotline.number}</p>
          {hotline.text && <p style={{ color:COLORS.textMuted, fontSize:13 }}>{hotline.text}</p>}
        </div>
        <p style={{ color:COLORS.textMuted, fontSize:12, textAlign:"center", lineHeight:1.5, marginBottom:16 }}>
          These services are free, confidential, and available 24/7. A trained counselor is ready to listen.
        </p>
        <Button onClick={onClose} variant="blue" fullWidth>I Understand</Button>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showCrisis, setShowCrisis] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Load saved state
  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get("vos_user");
        if (saved) {
          const data = JSON.parse(saved.value);
          setUser(data.user);
          setProfile(data.profile);
          setPoints(data.points || 0);
          setStreak(data.streak || 0);
          if (data.profile) setPage("dashboard");
        }
      } catch(e) {}
    })();
  }, []);

  // Save state
  const saveState = useCallback(async (u, p, pts, strk) => {
    try {
      await window.storage.set("vos_user", JSON.stringify({ user:u||user, profile:p||profile, points:pts??points, streak:strk??streak }));
    } catch(e) {}
  }, [user, profile, points, streak]);

  const handleSignup = (userData) => {
    setUser(userData);
    setPage("consent");
  };

  const handleConsent = () => {
    setPage("quiz");
  };

  const handleQuizComplete = (answers) => {
    setQuizAnswers(answers);
    const p = analyzeProfile(answers);
    setProfile(p);
    saveState(user, p, 10, 1); // bonus points for completing quiz
    setPoints(10);
    setStreak(1);
    setPage("reveal");
  };

  const handleLogout = async () => {
    try { await window.storage.delete("vos_user"); } catch(e) {}
    setUser(null); setProfile(null); setMessages([]); setPoints(0); setStreak(0);
    setPage("landing");
  };

  return (
    <div style={{ minHeight:"100vh", maxWidth:"100vw", overflow:"hidden" }}>
      {showCrisis && <CrisisModal onClose={()=>setShowCrisis(false)}/>}
      {page === "landing" && <LandingPage onStart={()=>setPage("signup")}/>}
      {page === "signup" && <SignupPage onSignup={handleSignup} onBack={()=>setPage("landing")}/>}
      {page === "consent" && <ConsentPage onConsent={handleConsent} gdpr={gdprConsent} setGdpr={setGdprConsent} age={ageConfirmed} setAge={setAgeConfirmed}/>}
      {page === "quiz" && <QuizPage onComplete={handleQuizComplete}/>}
      {page === "reveal" && <RevealPage profile={profile} onContinue={()=>setPage("dashboard")}/>}
      {page === "dashboard" && <DashboardPage profile={profile} points={points} streak={streak} onNavigate={setPage} onLogout={handleLogout}/>}
      {page === "chat" && <ChatPage profile={profile} messages={messages} setMessages={setMessages} points={points} setPoints={setPoints} onBack={()=>setPage("dashboard")} setShowCrisis={setShowCrisis} saveState={saveState}/>}
      {page === "plans" && <PlansPage profile={profile} onBack={()=>setPage("dashboard")}/>}
      {page === "profile" && <ProfilePage profile={profile} user={user} points={points} streak={streak} onBack={()=>setPage("dashboard")} onLogout={handleLogout}/>}
    </div>
  );
}

// ─── Profile Analysis ───────────────────────────────────────────────
function analyzeProfile(answers) {
  let scores = { introversion:50, openness:50, discipline:50, emotional_stability:50, direction:50 };
  let motivator = "achievement", fear = "uncertainty", learning = "C", successVision = "mastery", growthArea = "mental";
  let archetypeHints = {};

  answers.forEach(a => {
    const q = [...QUIZ_BANK, ...Object.values(ADAPTIVE_QUESTIONS)].find(q=>q.id===a.qId);
    if (!q) return;
    const idx = a.answerIndex;
    if (q.weight.direction) scores.direction += (q.weight.direction[idx]-3)*5;
    if (q.weight.emotional_stability) scores.emotional_stability += ((q.weight.emotional_stability[idx]||3)-3)*5;
    if (q.weight.introversion) scores.introversion += ((q.weight.introversion[idx]||3)-3)*5;
    if (q.weight.openness) scores.openness += ((q.weight.openness[idx]||3)-3)*5;
    if (q.weight.discipline) scores.discipline += ((q.weight.discipline[idx]||3)-3)*5;
    if (q.weight.motivator_map) motivator = q.weight.motivator_map[idx] || motivator;
    if (q.weight.fear_map) fear = q.weight.fear_map[idx] || fear;
    if (q.weight.pacer) learning = q.weight.pacer[idx] || learning;
    if (q.weight.success_map) successVision = q.weight.success_map[idx] || successVision;
    if (q.weight.growth_map) growthArea = q.weight.growth_map[idx] || growthArea;
    if (q.weight.archetype_hint) {
      const hint = q.weight.archetype_hint[idx];
      archetypeHints[hint] = (archetypeHints[hint]||0) + 1;
    }
    if (q.weight.vision_map) {
      const map = { sage:"intellectual", ruler:"sovereign", explorer:"autonomous", lover:"relational", creator:"transformer" };
      const hint = map[q.weight.vision_map[idx]];
      if (hint) archetypeHints[hint] = (archetypeHints[hint]||0) + 1;
    }
  });

  // Determine archetype
  // Use scores to influence
  if (scores.discipline > 65) archetypeHints.sovereign = (archetypeHints.sovereign||0) + 2;
  if (scores.discipline < 35) archetypeHints.transformer = (archetypeHints.transformer||0) + 1;
  if (scores.introversion > 65) archetypeHints.intellectual = (archetypeHints.intellectual||0) + 1;
  if (scores.openness > 65) archetypeHints.autonomous = (archetypeHints.autonomous||0) + 1;
  if (fear === "isolation") archetypeHints.relational = (archetypeHints.relational||0) + 2;
  if (fear === "powerlessness") archetypeHints.sovereign = (archetypeHints.sovereign||0) + 2;
  if (motivator === "freedom") archetypeHints.autonomous = (archetypeHints.autonomous||0) + 2;
  if (motivator === "helping") archetypeHints.guardian = (archetypeHints.guardian||0) + 2;

  let primary = "intellectual";
  let maxScore = 0;
  Object.entries(archetypeHints).forEach(([k,v]) => { if (v > maxScore) { maxScore = v; primary = k; } });

  // Secondary archetype
  let secondary = "transformer";
  let secScore = 0;
  Object.entries(archetypeHints).forEach(([k,v]) => { if (v > secScore && k !== primary) { secScore = v; secondary = k; } });

  // Clamp scores
  Object.keys(scores).forEach(k => { scores[k] = Math.max(10, Math.min(90, scores[k])); });

  return {
    personality: scores,
    motivator, fear, learning, successVision, growthArea,
    archetype: primary,
    secondaryArchetype: secondary,
    archetypeData: ARCHETYPES[primary],
    secondaryData: ARCHETYPES[secondary],
    pacerType: PACER_TYPES[learning] || "Conceptual",
    currentState: scores.emotional_stability < 40 ? "anxious" : scores.direction < 40 ? "confused" : scores.discipline > 60 ? "driven" : "exploring",
  };
}

// ─── Landing Page ───────────────────────────────────────────────────
function LandingPage({ onStart }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(()=>setLoaded(true), 100); }, []);

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      background:`linear-gradient(160deg, ${COLORS.bg} 0%, ${COLORS.blue} 40%, #0D2137 70%, ${COLORS.bg} 100%)`,
      backgroundSize:"200% 200%", animation:"gradientShift 12s ease infinite", position:"relative", overflow:"hidden", padding:20,
    }}>
      {/* Ambient orbs */}
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle, ${COLORS.blueSoft}15, transparent)`, top:"-10%", right:"-10%", filter:"blur(60px)" }}/>
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle, ${COLORS.red}10, transparent)`, bottom:"10%", left:"-5%", filter:"blur(50px)" }}/>

      <div style={{ textAlign:"center", opacity:loaded?1:0, transform:loaded?"translateY(0)":"translateY(30px)", transition:"all 1s ease 0.2s" }}>
        <div style={{ marginBottom:40 }}><VosLogo size={60}/></div>
      </div>

      <h1 style={{
        fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px, 6vw, 52px)", fontWeight:700, textAlign:"center",
        lineHeight:1.2, maxWidth:600, marginBottom:20,
        opacity:loaded?1:0, transform:loaded?"translateY(0)":"translateY(30px)", transition:"all 1s ease 0.5s",
      }}>
        Understand Yourself.<br/><span style={{ color:COLORS.tan }}>Improve Your Life.</span>
      </h1>

      <p style={{
        color:COLORS.textMuted, fontSize:"clamp(14px, 2vw, 17px)", textAlign:"center", maxWidth:440, lineHeight:1.7, marginBottom:48,
        opacity:loaded?1:0, transform:loaded?"translateY(0)":"translateY(20px)", transition:"all 1s ease 0.8s",
      }}>
        Most people never truly understand themselves. Take the test. Discover your mind. Become who you were meant to be.
      </p>

      <div style={{ opacity:loaded?1:0, transform:loaded?"translateY(0)":"translateY(20px)", transition:"all 1s ease 1.1s" }}>
        <Button onClick={onStart} style={{ padding:"18px 56px", fontSize:17, borderRadius:16, animation:"breathe 3s infinite" }}>
          START YOUR JOURNEY
        </Button>
      </div>

      <p style={{
        position:"absolute", bottom:24, color:COLORS.textDim, fontSize:12, letterSpacing:1,
        opacity:loaded?1:0, transition:"opacity 1.5s ease 1.5s",
      }}>
        Free · No credit card required · 3 min assessment
      </p>
    </div>
  );
}

// ─── Signup Page ────────────────────────────────────────────────────
function SignupPage({ onSignup, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:`linear-gradient(160deg, ${COLORS.bg}, ${COLORS.blue}30)`, padding:20,
    }}>
      <div className="fade-in" style={{ width:"100%", maxWidth:400 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:COLORS.textMuted, cursor:"pointer", fontSize:14, marginBottom:24, display:"flex", alignItems:"center", gap:6 }}>
          ← Back
        </button>
        <div style={{ marginBottom:32 }}><VosLogo size={36}/></div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, marginBottom:8 }}>Create Your Account</h2>
        <p style={{ color:COLORS.textMuted, fontSize:14, marginBottom:32, lineHeight:1.5 }}>Begin your journey of self-discovery</p>

        <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" icon="👤"/>
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" icon="✉️"/>
        <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a password" icon="🔒"/>

        <Button onClick={()=>onSignup({name,email})} disabled={!email||!password||!name} fullWidth style={{ marginTop:8, marginBottom:16 }}>
          Create Account
        </Button>

        <div style={{ textAlign:"center", color:COLORS.textDim, fontSize:13, margin:"20px 0" }}>or continue with</div>

        <button onClick={()=>onSignup({name:"User",email:"google@user.com"})} style={{
          width:"100%", padding:14, borderRadius:12, border:`1px solid ${COLORS.textDim}33`, background:COLORS.bgLight,
          color:COLORS.text, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"'DM Sans',sans-serif",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

// ─── Consent Page ───────────────────────────────────────────────────
function ConsentPage({ onConsent, gdpr, setGdpr, age, setAge }) {
  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:`linear-gradient(160deg, ${COLORS.bg}, ${COLORS.blue}20)`, padding:20,
    }}>
      <div className="fade-in" style={{ width:"100%", maxWidth:440 }}>
        <div style={{ marginBottom:32 }}><VosLogo size={36}/></div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, marginBottom:8 }}>Before We Begin</h2>
        <p style={{ color:COLORS.textMuted, fontSize:14, marginBottom:32, lineHeight:1.6 }}>Your privacy and safety matter to us</p>

        <div style={{ background:COLORS.bgCard, borderRadius:16, padding:24, marginBottom:20, border:`1px solid ${COLORS.textDim}22` }}>
          <label style={{ display:"flex", gap:12, cursor:"pointer", alignItems:"flex-start" }} onClick={()=>setAge(!age)}>
            <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${age?COLORS.blueSoft:COLORS.textDim}`, background:age?COLORS.blueSoft:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2, transition:"all 0.2s" }}>
              {age && <span style={{ color:"white", fontSize:14 }}>✓</span>}
            </div>
            <div>
              <p style={{ fontSize:15, fontWeight:500, marginBottom:4 }}>I am 16 years or older</p>
              <p style={{ color:COLORS.textMuted, fontSize:12, lineHeight:1.5 }}>VOS is designed for individuals aged 16 and above</p>
            </div>
          </label>
        </div>

        <div style={{ background:COLORS.bgCard, borderRadius:16, padding:24, marginBottom:32, border:`1px solid ${COLORS.textDim}22` }}>
          <label style={{ display:"flex", gap:12, cursor:"pointer", alignItems:"flex-start" }} onClick={()=>setGdpr(!gdpr)}>
            <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${gdpr?COLORS.blueSoft:COLORS.textDim}`, background:gdpr?COLORS.blueSoft:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2, transition:"all 0.2s" }}>
              {gdpr && <span style={{ color:"white", fontSize:14 }}>✓</span>}
            </div>
            <div>
              <p style={{ fontSize:15, fontWeight:500, marginBottom:4 }}>I consent to data processing</p>
              <p style={{ color:COLORS.textMuted, fontSize:12, lineHeight:1.5 }}>We use your responses to personalize your experience. Your data is encrypted and you can delete your account anytime. We comply with GDPR regulations. Inactive accounts are deleted after 14 days.</p>
            </div>
          </label>
        </div>

        <Button onClick={onConsent} disabled={!gdpr||!age} fullWidth>
          Continue to Assessment
        </Button>
      </div>
    </div>
  );
}

// ─── Quiz Page ──────────────────────────────────────────────────────
function QuizPage({ onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [confidence, setConfidence] = useState(3);
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [questions, setQuestions] = useState([...QUIZ_BANK]);

  const question = questions[currentQ];
  const progress = ((currentQ) / questions.length) * 100;

  const handleAnswer = (idx) => {
    setSelected(idx);
    setAnimating(true);

    const answer = { qId: question.id, answerIndex: idx, confidence, text: question.options[idx] };
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Adaptive logic: add follow-up questions
    if (question.dimension === "direction" && idx <= 1 && !questions.find(q=>q.id===101)) {
      setQuestions(prev => [...prev, ADAPTIVE_QUESTIONS.direction_high]);
    }
    if (question.dimension === "fear" && idx === 0 && !questions.find(q=>q.id===102)) {
      setQuestions(prev => [...prev, ADAPTIVE_QUESTIONS.fear_powerlessness]);
    }
    if (question.dimension === "discipline" && idx >= 3 && !questions.find(q=>q.id===103)) {
      setQuestions(prev => [...prev, ADAPTIVE_QUESTIONS.discipline_low]);
    }
    if (question.dimension === "anxiety_source" && idx === 4 && !questions.find(q=>q.id===104)) {
      setQuestions(prev => [...prev, ADAPTIVE_QUESTIONS.anxiety_general]);
    }

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        onComplete(newAnswers);
      } else {
        setCurrentQ(currentQ + 1);
        setSelected(null);
        setConfidence(3);
        setAnimating(false);
      }
    }, 400);
  };

  const handleSkip = () => {
    const answer = { qId: question.id, answerIndex: 2, confidence: 1, text: "skipped" };
    setAnswers([...answers, answer]);
    if (currentQ + 1 >= questions.length) {
      onComplete([...answers, answer]);
    } else {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setConfidence(3);
    }
  };

  if (!question) return null;

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      background:`linear-gradient(160deg, ${COLORS.bg}, ${COLORS.blue}15)`, padding:20,
    }}>
      {/* Progress */}
      <div style={{ maxWidth:500, width:"100%", margin:"0 auto", paddingTop:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <span style={{ color:COLORS.textMuted, fontSize:13 }}>Question {currentQ+1} of {questions.length}</span>
          <span style={{ color:COLORS.tan, fontSize:13, fontWeight:500 }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height:4, background:COLORS.bgCard, borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg, ${COLORS.blueSoft}, ${COLORS.tan})`, borderRadius:2, transition:"width 0.5s ease" }}/>
        </div>
      </div>

      {/* Question */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", maxWidth:500, width:"100%", margin:"0 auto" }}>
        <div key={currentQ} className="fade-in" style={{ width:"100%" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(20px, 4vw, 26px)", marginBottom:32, lineHeight:1.4, textAlign:"center" }}>
            {question.q}
          </h2>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {question.options.map((opt, i) => (
              <button key={i} onClick={()=>handleAnswer(i)} style={{
                width:"100%", padding:"16px 20px", borderRadius:14, border:`1px solid ${selected===i?COLORS.blueSoft:COLORS.textDim+"33"}`,
                background:selected===i?COLORS.blueSoft+"20":COLORS.bgCard, color:COLORS.text, fontSize:15, cursor:"pointer",
                textAlign:"left", fontFamily:"'DM Sans',sans-serif", transition:"all 0.25s ease",
                transform:selected===i?"scale(1.02)":"scale(1)", opacity:animating&&selected!==i?0.5:1,
              }}
              onMouseEnter={e=>{if(selected===null){e.target.style.borderColor=COLORS.blueSoft+"88";e.target.style.background=COLORS.bgLight}}}
              onMouseLeave={e=>{if(selected===null){e.target.style.borderColor=COLORS.textDim+"33";e.target.style.background=COLORS.bgCard}}}
              >
                <span style={{ marginRight:12, color:COLORS.textMuted }}>{String.fromCharCode(65+i)}</span>
                {opt}
              </button>
            ))}
          </div>

          {/* Confidence slider */}
          <div style={{ marginTop:28, textAlign:"center" }}>
            <p style={{ color:COLORS.textDim, fontSize:12, marginBottom:10 }}>How certain are you? (optional)</p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <span style={{ color:COLORS.textDim, fontSize:11 }}>Unsure</span>
              <input type="range" min="1" max="5" value={confidence} onChange={e=>setConfidence(parseInt(e.target.value))}
                style={{ width:140, accentColor:COLORS.blueSoft }}/>
              <span style={{ color:COLORS.textDim, fontSize:11 }}>Certain</span>
            </div>
          </div>

          {/* Skip */}
          <div style={{ textAlign:"center", marginTop:20 }}>
            <button onClick={handleSkip} style={{ background:"none", border:"none", color:COLORS.textDim, cursor:"pointer", fontSize:13, textDecoration:"underline" }}>
              Skip this question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reveal Page ────────────────────────────────────────────────────
function RevealPage({ profile, onContinue }) {
  const [step, setStep] = useState(0);
  const arch = profile.archetypeData;
  const sec = profile.secondaryData;

  useEffect(() => {
    const timers = [setTimeout(()=>setStep(1),500), setTimeout(()=>setStep(2),1500), setTimeout(()=>setStep(3),2500), setTimeout(()=>setStep(4),3500)];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      background:`radial-gradient(ellipse at 50% 30%, ${COLORS.blue}40, ${COLORS.bg} 70%)`, padding:20,
    }}>
      <div style={{ maxWidth:480, width:"100%", textAlign:"center" }}>
        {step >= 1 && (
          <div className="fade-in" style={{ marginBottom:20 }}>
            <p style={{ color:COLORS.tan, fontSize:14, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Your Primary Archetype</p>
            <div style={{ fontSize:64, marginBottom:12, animation:"float 3s infinite" }}>{arch.icon}</div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(32px, 6vw, 44px)", marginBottom:8 }}>{arch.name}</h1>
            <p style={{ color:COLORS.blueSoft, fontSize:16, fontWeight:500 }}>Core Drive: {arch.drive}</p>
          </div>
        )}

        {step >= 2 && (
          <div className="fade-in" style={{ background:COLORS.bgCard, borderRadius:16, padding:24, marginBottom:16, border:`1px solid ${COLORS.textDim}22`, textAlign:"left" }}>
            <p style={{ color:COLORS.tan, fontSize:12, fontWeight:600, letterSpacing:1, marginBottom:12 }}>YOUR STRENGTHS</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {arch.strengths.map((s,i) => (
                <span key={i} style={{ padding:"6px 14px", borderRadius:20, background:`${COLORS.blueSoft}15`, border:`1px solid ${COLORS.blueSoft}30`, fontSize:13, color:COLORS.blueSoft }}>{s}</span>
              ))}
            </div>
            <p style={{ color:COLORS.tan, fontSize:12, fontWeight:600, letterSpacing:1, marginTop:16, marginBottom:12 }}>GROWTH PATH</p>
            <p style={{ color:COLORS.textMuted, fontSize:14, lineHeight:1.6 }}>{arch.growth}</p>
          </div>
        )}

        {step >= 3 && (
          <div className="fade-in" style={{ background:COLORS.bgCard, borderRadius:16, padding:20, marginBottom:16, border:`1px solid ${COLORS.textDim}22` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:28 }}>{sec.icon}</span>
              <div style={{ textAlign:"left" }}>
                <p style={{ fontSize:12, color:COLORS.textDim }}>Supporting Archetype</p>
                <p style={{ fontSize:16, fontWeight:600 }}>{sec.name}</p>
              </div>
            </div>
          </div>
        )}

        {step >= 3 && (
          <div className="fade-in" style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:24 }}>
            <span style={{ padding:"6px 12px", borderRadius:20, background:`${COLORS.red}20`, fontSize:12, color:COLORS.tanLight }}>📚 {profile.pacerType} Learner</span>
            <span style={{ padding:"6px 12px", borderRadius:20, background:`${COLORS.red}20`, fontSize:12, color:COLORS.tanLight }}>🎯 Motivated by {profile.motivator}</span>
            <span style={{ padding:"6px 12px", borderRadius:20, background:`${COLORS.red}20`, fontSize:12, color:COLORS.tanLight }}>⚡ State: {profile.currentState}</span>
          </div>
        )}

        {step >= 4 && (
          <div className="fade-in">
            <p style={{ color:COLORS.textMuted, fontSize:14, marginBottom:24, lineHeight:1.6 }}>
              Your AI mentor is now calibrated to your unique psychological profile. Every interaction will be personalized to your archetype, learning style, and goals.
            </p>
            <Button onClick={onContinue} style={{ padding:"16px 48px" }}>
              Enter VOS →
            </Button>
            <p style={{ color:COLORS.success, fontSize:13, marginTop:12 }}>🏆 +10 points earned for completing assessment</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────
function DashboardPage({ profile, points, streak, onNavigate, onLogout }) {
  const arch = profile?.archetypeData || ARCHETYPES.intellectual;
  const freeMonth = Math.floor(points / 1000);

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg, paddingBottom:100 }}>
      {/* Header */}
      <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <VosLogo size={32}/>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={()=>onNavigate("profile")} style={{ background:COLORS.bgCard, border:"none", borderRadius:10, padding:"8px 14px", color:COLORS.text, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
            👤 Profile
          </button>
        </div>
      </div>

      <div style={{ padding:20, maxWidth:600, margin:"0 auto" }}>
        {/* Welcome */}
        <div className="fade-in" style={{ marginBottom:28 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, marginBottom:4 }}>Welcome back, {arch.name} {arch.icon}</h2>
          <p style={{ color:COLORS.textMuted, fontSize:14 }}>Your mentor is ready when you are</p>
        </div>

        {/* Stats row */}
        <div style={{ display:"flex", gap:12, marginBottom:24, overflowX:"auto", paddingBottom:4 }}>
          {[
            { label:"Points", value:points, icon:"⭐", color:COLORS.warning },
            { label:"Streak", value:`${streak}d`, icon:"🔥", color:COLORS.red },
            { label:"Free Months", value:freeMonth, icon:"🎁", color:COLORS.success },
          ].map((s,i) => (
            <div key={i} style={{ flex:"1 0 100px", background:COLORS.bgCard, borderRadius:14, padding:16, border:`1px solid ${COLORS.textDim}15`, textAlign:"center", minWidth:100 }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:COLORS.textDim, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Talk to AI — Main CTA */}
        <button onClick={()=>onNavigate("chat")} style={{
          width:"100%", padding:24, borderRadius:18, cursor:"pointer", marginBottom:24, border:"none",
          background:`linear-gradient(135deg, ${COLORS.blueLight}, ${COLORS.blue})`,
          display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"'DM Sans',sans-serif",
          transition:"transform 0.2s",
        }}
        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
        onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
        >
          <div style={{ textAlign:"left" }}>
            <h3 style={{ color:COLORS.white, fontSize:18, fontWeight:600, marginBottom:4 }}>Talk to Your Mentor</h3>
            <p style={{ color:COLORS.tanLight, fontSize:13, opacity:0.8 }}>AI calibrated to your {arch.name} archetype</p>
          </div>
          <div style={{ fontSize:32 }}>💬</div>
        </button>

        {/* Suggested Prompts */}
        <div style={{ marginBottom:28 }}>
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:14, color:COLORS.tanLight }}>Quick Start</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {SUGGESTED_PROMPTS.map((sp, i) => (
              <button key={i} onClick={()=>onNavigate("chat")} style={{
                background:COLORS.bgCard, border:`1px solid ${COLORS.textDim}20`, borderRadius:14, padding:16,
                textAlign:"left", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=COLORS.blueSoft+"55";e.currentTarget.style.transform="translateY(-1px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=COLORS.textDim+"20";e.currentTarget.style.transform="translateY(0)"}}
              >
                <div style={{ fontSize:24, marginBottom:8 }}>{sp.icon}</div>
                <p style={{ color:COLORS.text, fontSize:14, fontWeight:600, marginBottom:4 }}>{sp.title}</p>
                <p style={{ color:COLORS.textDim, fontSize:11, lineHeight:1.4 }}>{sp.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        {/* View Plans */}
        <button onClick={()=>onNavigate("plans")} style={{
          width:"100%", padding:20, borderRadius:16, cursor:"pointer", marginBottom:16, fontFamily:"'DM Sans',sans-serif",
          background:COLORS.bgCard, border:`1px solid ${COLORS.tan}20`, display:"flex", alignItems:"center", gap:16, transition:"all 0.2s",
        }}
        onMouseEnter={e=>e.currentTarget.style.borderColor=COLORS.tan+"55"}
        onMouseLeave={e=>e.currentTarget.style.borderColor=COLORS.tan+"20"}
        >
          <div style={{ fontSize:28 }}>📋</div>
          <div style={{ textAlign:"left" }}>
            <p style={{ color:COLORS.text, fontSize:15, fontWeight:600 }}>Your Growth Plan</p>
            <p style={{ color:COLORS.textDim, fontSize:12 }}>Mental · Physical · Productivity · Purpose</p>
          </div>
        </button>

        {/* Archetype summary card */}
        <div style={{ background:COLORS.bgCard, borderRadius:16, padding:20, border:`1px solid ${COLORS.textDim}15` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <span style={{ fontSize:32 }}>{arch.icon}</span>
            <div>
              <p style={{ fontWeight:600, fontSize:16 }}>{arch.name}</p>
              <p style={{ color:COLORS.textMuted, fontSize:12 }}>Core Drive: {arch.drive}</p>
            </div>
          </div>
          <p style={{ color:COLORS.textMuted, fontSize:13, lineHeight:1.6 }}>
            ⚠️ Watch for your shadow: <em>{arch.shadow}</em> — {arch.weaknesses[0].toLowerCase()}.
          </p>
          <p style={{ color:COLORS.tan, fontSize:13, marginTop:8, lineHeight:1.5 }}>
            ✨ {arch.growth}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Page ──────────────────────────────────────────────────────
function ChatPage({ profile, messages, setMessages, points, setPoints, onBack, setShowCrisis, saveState }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const arch = profile?.archetypeData || ARCHETYPES.intellectual;
      setMessages([{
        role: "ai",
        content: `Welcome, ${arch.name} ${arch.icon}\n\nI've studied your psychological profile. Your primary drive is **${arch.drive}**, and your growth path is to *${arch.growth.toLowerCase()}*.\n\nI'm here as your mentor — calibrated to your learning style (${profile?.pacerType}) and emotional patterns. What would you like to work on today?\n\nYou can ask me about creativity, goals, habits, or anything on your mind.`,
        timestamp: new Date(),
      }]);
    }
  }, []);

  const detectCrisis = (text) => {
    const lower = text.toLowerCase();
    return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
  };

  const buildSystemPrompt = () => {
    const arch = profile?.archetypeData || ARCHETYPES.intellectual;
    const sec = profile?.secondaryData || ARCHETYPES.transformer;
    return `You are VOS — an AI mentor built for identity transformation. You are NOT a chatbot. You are a behavior-shaping, emotionally intelligent guidance system.

USER PROFILE:
- Primary Archetype: ${arch.name} (${arch.drive})
- Secondary Archetype: ${sec.name} (${sec.drive})
- Strengths: ${arch.strengths.join(", ")}
- Shadow to watch: ${arch.shadow} (${arch.weaknesses.join(", ")})
- Growth path: ${arch.growth}
- Learning style (PACER): ${profile?.pacerType || "Conceptual"}
- Current emotional state: ${profile?.currentState || "exploring"}
- Primary motivator: ${profile?.motivator || "achievement"}
- Core fear: ${profile?.fear || "uncertainty"}
- Growth area: ${profile?.growthArea || "mental"}
- Personality scores: Introversion ${profile?.personality?.introversion || 50}/100, Openness ${profile?.personality?.openness || 50}/100, Discipline ${profile?.personality?.discipline || 50}/100, Emotional Stability ${profile?.personality?.emotional_stability || 50}/100

RESPONSE STRUCTURE (follow this for substantive questions):
1. **Understanding** — Mirror what the user said precisely
2. **Hidden Truth** — Reveal what they don't see about themselves
3. **Reframe** — Shift their identity or belief
4. **Strategy** — Clear direction
5. **Action System** — 3-5 concrete steps
6. **Emotional Anchor** — One powerful closing line

LEARNING STYLE ADAPTATION (critical):
${profile?.learning === "P" ? "User is PROCEDURAL — give step-by-step actions, routines, checklists" :
  profile?.learning === "A" ? "User is ANALOGOUS — use stories, historical figures, metaphors, narratives" :
  profile?.learning === "C" ? "User is CONCEPTUAL — use models, frameworks, systems thinking, mind maps" :
  profile?.learning === "E" ? "User is EVIDENCE-based — use data, case studies, research, logical proof" :
  "User is REFERENCE-based — use summaries, reminders, checklists, spaced repetition"}

EMOTIONAL CALIBRATION:
- If user is anxious: slow, grounding, simple language
- If user is angry: redirect into constructive action
- If user is confused: simplify and structure
- If user is ambitious: challenge and strategize
- If user is apathetic: spark curiosity and small wins

TONE: Calm, intelligent, grounded, non-judgmental, optimistic but realistic. Mix of wise mentor + practical strategist + supportive coach. Be human-like. Occasionally use the user's archetype for personalized references.

EVOCATION (important): You must evoke emotion intentionally — hope, pride, constructive urgency, belief. Never be manipulative. Always constructive.

SUGGESTED QUESTION HANDLING:
- "unlock creativity" → Ask their field, then share patterns from historical masters in that field, give actionable exercises
- "achieve goals" → Ask what goals, apply SMART/12-Week Year/OKR frameworks, help define execution systems
- "keystone actions" → Ask what they want to achieve and current activities, create prioritization graph, output high-leverage atomic actions
- "atomic habits" → Ask the field, then build cue→craving→response→reward loop, create daily action plan

CRISIS PROTOCOL: If user expresses suicidal ideation or crisis (even indirectly like "I can't take this anymore", "what's the point"), respond with:
1. Immediate warmth and validation
2. "You are not alone. What you're feeling is real and it matters."
3. Encourage opening up to someone they trust
4. Mention that professional support is available
Do NOT dismiss, minimize, or redirect too quickly.

RULES:
- Never give medical diagnoses or legal advice
- For serious mental health concerns say: "For deeper support, please consider speaking with a professional counselor."
- Reference the user's archetype naturally
- Avoid toxic positivity and complex jargon
- Be concise but meaningful — quality over quantity
- You can use historical figures relevant to their archetype: ${arch.figures.join(", ")}
- Keep responses focused and under 300 words unless the topic demands depth`;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role:"user", content:input.trim(), timestamp:new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Crisis detection
    if (detectCrisis(input)) {
      setTimeout(() => {
        setShowCrisis(true);
        const crisisResponse = {
          role: "ai",
          content: "I hear you, and I want you to know — what you're feeling right now is valid. You are not alone in this.\n\nPlease know that there are people who care and professionals trained to help. If you're in crisis, please reach out:\n\n📞 **988 Suicide & Crisis Lifeline** (call or text 988)\n📱 **Crisis Text Line** — Text HOME to 741741\n🌍 **International:** findahelpline.com\n\nI'm here to talk, but some feelings deserve the support of someone who can truly be there for you. Would you like to tell me more about what you're going through?",
          timestamp: new Date(),
        };
        setMessages([...newMessages, crisisResponse]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const apiMessages = newMessages
        .filter(m => m.content)
        .map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      const aiText = data.content?.map(c => c.text || "").join("") || "I'm here for you. Could you tell me more?";

      setMessages([...newMessages, { role:"ai", content:aiText, timestamp:new Date() }]);

      // Points for engagement
      if (newMessages.filter(m=>m.role==="user").length % 5 === 0) {
        setPoints(p => p + 2);
      }
    } catch(err) {
      setMessages([...newMessages, { role:"ai", content:"I'm experiencing a connection issue. Please try again in a moment. I'm here for you.", timestamp:new Date() }]);
    }
    setIsLoading(false);
  };

  const formatMessage = (text) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:COLORS.bg }}>
      {/* Header */}
      <div style={{
        padding:"12px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid ${COLORS.textDim}15`,
        background:COLORS.bgCard,
      }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:COLORS.textMuted, cursor:"pointer", fontSize:20 }}>←</button>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:16, fontWeight:600 }}>VOS Mentor</p>
          <p style={{ fontSize:11, color:COLORS.success }}>● Online — calibrated to you</p>
        </div>
        <span style={{ fontSize:12, color:COLORS.warning }}>⭐ {points} pts</span>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start",
            animation:"fadeIn 0.3s ease",
          }}>
            <div style={{
              maxWidth:"82%", padding:"12px 16px", borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
              background:msg.role==="user"?`linear-gradient(135deg, ${COLORS.blueSoft}, ${COLORS.blueLight})`:COLORS.bgCard,
              color:COLORS.text, fontSize:14, lineHeight:1.6,
              border:msg.role==="ai"?`1px solid ${COLORS.textDim}15`:"none",
            }}>
              <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}/>
              <div style={{ fontSize:10, color:msg.role==="user"?"rgba(255,255,255,0.5)":COLORS.textDim, marginTop:6, textAlign:"right" }}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : ""}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display:"flex", justifyContent:"flex-start" }}>
            <TypingIndicator/>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Suggested prompts (if no user messages yet) */}
      {messages.filter(m=>m.role==="user").length === 0 && (
        <div style={{ padding:"0 16px 8px", display:"flex", gap:8, overflowX:"auto" }}>
          {SUGGESTED_PROMPTS.map((sp, i) => (
            <button key={i} onClick={()=>{setInput(sp.prompt);}} style={{
              whiteSpace:"nowrap", padding:"8px 14px", borderRadius:20, background:COLORS.bgCard, border:`1px solid ${COLORS.textDim}30`,
              color:COLORS.tanLight, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flexShrink:0,
            }}>
              {sp.icon} {sp.title}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding:"12px 16px 20px", borderTop:`1px solid ${COLORS.textDim}15`, background:COLORS.bgCard }}>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}}}
            placeholder="Ask about your goals, habits, or challenges..."
            style={{
              flex:1, padding:"14px 16px", borderRadius:24, background:COLORS.bgLight, border:`1px solid ${COLORS.textDim}33`,
              color:COLORS.text, fontSize:15, fontFamily:"'DM Sans',sans-serif", resize:"none",
            }}
            onFocus={e=>e.target.style.borderColor=COLORS.blueSoft}
            onBlur={e=>e.target.style.borderColor=`${COLORS.textDim}33`}
          />
          <button onClick={sendMessage} disabled={!input.trim()||isLoading} style={{
            width:48, height:48, borderRadius:"50%", border:"none", cursor:input.trim()&&!isLoading?"pointer":"not-allowed",
            background:input.trim()&&!isLoading?`linear-gradient(135deg, ${COLORS.blueSoft}, ${COLORS.blueLight})`:COLORS.bgLight,
            color:COLORS.white, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s",
          }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plans Page ─────────────────────────────────────────────────────
function PlansPage({ profile, onBack }) {
  const plans = [
    { icon:"🧠", title:"Mental", color:COLORS.blueSoft, items:["Practice 5-min daily mindfulness","Journal 3 gratitudes each morning","Reframe one negative thought daily","Read 20 pages of psychology/philosophy","Weekly self-reflection session"] },
    { icon:"💪", title:"Physical", color:COLORS.red, items:["Sleep 7-8 hours consistently","30-min movement daily (walk/gym)","Hydrate: 8 glasses of water","Reduce screen time before bed","Weekly energy audit"] },
    { icon:"⚡", title:"Productivity", color:COLORS.warning, items:["Define 3 daily priorities (MIT)","Use time-blocking for deep work","2-minute rule for small tasks","Weekly review of goals progress","Remove 1 distraction source"] },
    { icon:"🧭", title:"Purpose", color:COLORS.tan, items:["Write your vision statement","Identify your keystone habit","Set 90-day milestone","Find an accountability partner","Monthly archetype check-in with VOS"] },
  ];

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg }}>
      <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid ${COLORS.textDim}15` }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:COLORS.textMuted, cursor:"pointer", fontSize:20 }}>←</button>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>Your Growth Plan</h2>
      </div>

      <div style={{ padding:20 }}>
        <p style={{ color:COLORS.textMuted, fontSize:14, marginBottom:24, lineHeight:1.6 }}>
          Personalized for your <strong style={{ color:COLORS.tan }}>{profile?.archetypeData?.name}</strong> archetype. Scroll through each dimension.
        </p>

        {/* Horizontal scrollable plan cards */}
        <div style={{ display:"flex", gap:16, overflowX:"auto", paddingBottom:16, scrollSnapType:"x mandatory" }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              minWidth:280, maxWidth:320, background:COLORS.bgCard, borderRadius:18, padding:24,
              border:`1px solid ${plan.color}25`, scrollSnapAlign:"start", flexShrink:0,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <span style={{ fontSize:28 }}>{plan.icon}</span>
                <h3 style={{ fontSize:18, fontWeight:600, color:plan.color }}>{plan.title}</h3>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {plan.items.map((item, j) => (
                  <div key={j} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${COLORS.textDim}44`, flexShrink:0, marginTop:2, cursor:"pointer" }}/>
                    <p style={{ color:COLORS.textMuted, fontSize:13, lineHeight:1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:24, background:COLORS.bgCard, borderRadius:14, padding:20, border:`1px solid ${COLORS.textDim}15` }}>
          <p style={{ fontSize:13, color:COLORS.textDim, lineHeight:1.6 }}>
            💡 <strong style={{ color:COLORS.tanLight }}>Tip:</strong> Completing small goals earns 2 points, big goals earn 5 points. Reach 1,000 points for a free premium month. Upload proof of completed goals in chat to earn points.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page ───────────────────────────────────────────────────
function ProfilePage({ profile, user, points, streak, onBack, onLogout }) {
  const arch = profile?.archetypeData || ARCHETYPES.intellectual;
  const p = profile?.personality || {};

  const StatBar = ({ label, value, color }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:13, color:COLORS.textMuted }}>{label}</span>
        <span style={{ fontSize:13, color, fontWeight:600 }}>{value}/100</span>
      </div>
      <div style={{ height:6, background:COLORS.bgLight, borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${value}%`, background:color, borderRadius:3, transition:"width 0.8s ease" }}/>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg }}>
      <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid ${COLORS.textDim}15` }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:COLORS.textMuted, cursor:"pointer", fontSize:20 }}>←</button>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>Your Profile</h2>
      </div>

      <div style={{ padding:20, maxWidth:500, margin:"0 auto" }}>
        {/* Archetype card */}
        <div style={{ background:COLORS.bgCard, borderRadius:18, padding:24, marginBottom:20, border:`1px solid ${COLORS.textDim}20`, textAlign:"center" }}>
          <div style={{ fontSize:56, marginBottom:12 }}>{arch.icon}</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, marginBottom:4 }}>{arch.name}</h3>
          <p style={{ color:COLORS.blueSoft, fontSize:14 }}>{arch.drive}</p>
          <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:16 }}>
            <div><span style={{ fontSize:20, fontWeight:700, color:COLORS.warning }}>⭐ {points}</span><br/><span style={{ fontSize:11, color:COLORS.textDim }}>Points</span></div>
            <div><span style={{ fontSize:20, fontWeight:700, color:COLORS.red }}>🔥 {streak}</span><br/><span style={{ fontSize:11, color:COLORS.textDim }}>Streak</span></div>
          </div>
        </div>

        {/* Personality scores */}
        <div style={{ background:COLORS.bgCard, borderRadius:16, padding:20, marginBottom:20, border:`1px solid ${COLORS.textDim}15` }}>
          <h4 style={{ fontSize:14, fontWeight:600, marginBottom:16, color:COLORS.tanLight }}>Personality Map</h4>
          <StatBar label="Introversion" value={p.introversion||50} color={COLORS.blueSoft}/>
          <StatBar label="Openness" value={p.openness||50} color={COLORS.tan}/>
          <StatBar label="Discipline" value={p.discipline||50} color={COLORS.success}/>
          <StatBar label="Emotional Stability" value={p.emotional_stability||50} color={COLORS.warning}/>
          <StatBar label="Direction Clarity" value={p.direction||50} color={COLORS.redLight}/>
        </div>

        {/* Details */}
        <div style={{ background:COLORS.bgCard, borderRadius:16, padding:20, marginBottom:20, border:`1px solid ${COLORS.textDim}15` }}>
          <h4 style={{ fontSize:14, fontWeight:600, marginBottom:16, color:COLORS.tanLight }}>Your Profile Details</h4>
          {[
            { label:"Learning Style", value:`${profile?.pacerType} (${profile?.learning})` },
            { label:"Primary Motivator", value:profile?.motivator },
            { label:"Core Fear", value:profile?.fear },
            { label:"Growth Area", value:profile?.growthArea },
            { label:"Current State", value:profile?.currentState },
            { label:"Shadow", value:arch.shadow },
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:i<5?`1px solid ${COLORS.textDim}15`:"none" }}>
              <span style={{ color:COLORS.textDim, fontSize:13 }}>{item.label}</span>
              <span style={{ fontSize:13, fontWeight:500, color:COLORS.text, textTransform:"capitalize" }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Historical figures */}
        <div style={{ background:COLORS.bgCard, borderRadius:16, padding:20, marginBottom:20, border:`1px solid ${COLORS.textDim}15` }}>
          <h4 style={{ fontSize:14, fontWeight:600, marginBottom:12, color:COLORS.tanLight }}>Your Archetype in History</h4>
          <div style={{ display:"flex", gap:10 }}>
            {arch.figures.map((fig, i) => (
              <div key={i} style={{ flex:1, padding:14, background:COLORS.bgLight, borderRadius:12, textAlign:"center" }}>
                <p style={{ fontSize:14, fontWeight:600 }}>{fig}</p>
                <p style={{ color:COLORS.textDim, fontSize:11, marginTop:4 }}>{arch.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ background:COLORS.bgCard, borderRadius:16, padding:20, marginBottom:20, border:`1px solid ${COLORS.tan}20` }}>
          <h4 style={{ fontSize:14, fontWeight:600, marginBottom:12, color:COLORS.tan }}>Premium Plans</h4>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { name:"Monthly", price:"$9.99/mo", features:"Deep analysis · Persistent memory · Weekly reports" },
              { name:"Yearly", price:"$79.99/yr", features:"Everything in Monthly · Priority support · Save 33%" },
              { name:"Lifetime", price:"$199", features:"Everything forever · Early access to new features" },
            ].map((plan, i) => (
              <div key={i} style={{ padding:14, borderRadius:12, border:`1px solid ${COLORS.textDim}20`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:600 }}>{plan.name}</p>
                  <p style={{ color:COLORS.textDim, fontSize:11 }}>{plan.features}</p>
                </div>
                <span style={{ fontSize:15, fontWeight:700, color:COLORS.tan }}>{plan.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <Button onClick={onLogout} variant="secondary" fullWidth style={{ marginBottom:40 }}>
          Log Out
        </Button>
      </div>
    </div>
  );
}
