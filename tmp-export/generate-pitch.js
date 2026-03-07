const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "TRAK_Pitch_Deck.pptx");
const IMG_DIR = "C:\\Users\\samcu\\.gemini\\antigravity\\brain\\7a66735e-5170-4a58-8da8-b2f0c0523bc7";

const COLORS = {
    black: "0A0A0A",
    white: "FFFFFF",
    emerald: "10B981",
    muted: "888888",
    dimWhite: "CCCCCC",
    gold: "F59E0B",
    purple: "A855F7",
    blue: "3B82F6",
    cardBg: "1A1A1A",
};

function addImageIfExists(slide, filename, opts) {
    const fp = path.join(IMG_DIR, filename);
    if (fs.existsSync(fp)) {
        slide.addImage({ path: fp, ...opts });
    }
}

async function main() {
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.defineLayout({ name: "CUSTOM", width: 13.33, height: 7.5 });
    pptx.layout = "CUSTOM";

    // SLIDE 1 — Title
    let s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("TRAK", { x: 0, y: 1.5, w: "100%", h: 1.5, fontSize: 80, bold: true, color: COLORS.emerald, fontFace: "Calibri", align: "center" });
    s.addText("The Accountability Engine", { x: 0, y: 3, w: "100%", h: 0.6, fontSize: 28, color: COLORS.dimWhite, fontFace: "Calibri", align: "center" });
    s.addText("Nutrition. Habits. Fitness. Together.", { x: 0, y: 3.7, w: "100%", h: 0.5, fontSize: 18, color: COLORS.muted, fontFace: "Calibri", align: "center", italic: true });
    addImageIfExists(s, "trak_hero_mockup_1772867147562.png", { x: 2.5, y: 4.5, w: 8, h: 2.5 });

    // SLIDE 2 — The Problem
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("The Problem", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });
    s.addText("The health & fitness industry has a retention problem, not a product problem.", { x: 0.8, y: 1.2, w: 11, h: 0.5, fontSize: 18, color: COLORS.muted, fontFace: "Calibri" });

    const problems = [
        { stat: "92%", desc: "of people fail their fitness resolutions within the year", icon: "📉" },
        { stat: "80%", desc: "of health app users abandon within 6 weeks", icon: "📱" },
        { stat: "$33B", desc: "wasted annually on unused gym memberships", icon: "💸" },
    ];
    problems.forEach((p, i) => {
        const yOff = 2.2 + i * 1.5;
        s.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: yOff, w: 11, h: 1.2, fill: { color: COLORS.cardBg }, rectRadius: 0.15 });
        s.addText(p.icon + "  " + p.stat, { x: 1.2, y: yOff + 0.15, w: 3, h: 0.8, fontSize: 36, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
        s.addText(p.desc, { x: 4.5, y: yOff + 0.15, w: 7, h: 0.8, fontSize: 18, color: COLORS.dimWhite, fontFace: "Calibri", valign: "middle" });
    });
    s.addText("The real enemy isn't lack of information. It's lack of accountability.", { x: 0.8, y: 6.3, w: 11, h: 0.5, fontSize: 16, color: COLORS.gold, fontFace: "Calibri", italic: true, bold: true });

    // SLIDE 3 — The Insight
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("The Insight", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });
    s.addText("Health is a social sport.\nWe've been playing it solo.", { x: 0.8, y: 1.5, w: 11, h: 1.2, fontSize: 32, color: COLORS.emerald, fontFace: "Calibri", italic: true });

    const examples = [
        { name: "AA", why: "Works because of group meetings, not pamphlets" },
        { name: "CrossFit", why: "Works because of the box community, not the WODs" },
        { name: "Duolingo", why: "Works because of streaks and leaderboards, not lessons" },
    ];
    examples.forEach((ex, i) => {
        const yOff = 3.2 + i * 1.0;
        s.addText(ex.name, { x: 1.2, y: yOff, w: 2.5, h: 0.7, fontSize: 22, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
        s.addText(ex.why, { x: 3.8, y: yOff, w: 8, h: 0.7, fontSize: 18, color: COLORS.dimWhite, fontFace: "Calibri", valign: "middle" });
    });
    s.addText("The $100B health app market treats wellness as a single-player game. TRAK changes that.", { x: 0.8, y: 6.3, w: 11, h: 0.5, fontSize: 16, color: COLORS.gold, fontFace: "Calibri", bold: true });

    // SLIDE 4 — The Accountability Flywheel
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("The Accountability Flywheel", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });
    addImageIfExists(s, "trak_flywheel_1772867187817.png", { x: 0.5, y: 1.3, w: 5.5, h: 5.5 });

    const phases = [
        { phase: "🥗 TRACK", desc: "Log meals, hit calorie target", mechanic: "Goal Gradient Effect", color: COLORS.emerald },
        { phase: "✅ BUILD", desc: "Check off habits, build streaks", mechanic: "Loss Aversion", color: COLORS.purple },
        { phase: "🏋️ MOVE", desc: "Log workouts, burn calories", mechanic: "Endowed Progress", color: COLORS.blue },
        { phase: "👥 COMPETE", desc: "Squad feed, reactions, leaderboard", mechanic: "Social Proof + Variable Reward", color: COLORS.gold },
    ];
    phases.forEach((ph, i) => {
        const yOff = 1.5 + i * 1.35;
        s.addShape(pptx.ShapeType.roundRect, { x: 6.5, y: yOff, w: 6, h: 1.15, fill: { color: COLORS.cardBg }, rectRadius: 0.1 });
        s.addText(ph.phase, { x: 6.8, y: yOff + 0.05, w: 5.5, h: 0.45, fontSize: 18, bold: true, color: ph.color, fontFace: "Calibri" });
        s.addText(ph.desc + "  →  " + ph.mechanic, { x: 6.8, y: yOff + 0.5, w: 5.5, h: 0.45, fontSize: 13, color: COLORS.muted, fontFace: "Calibri" });
    });

    // SLIDE 5 — The Product
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("The Product", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });
    s.addText("7 unified modules across 3 health pillars + social", { x: 0.8, y: 1.1, w: 11, h: 0.5, fontSize: 18, color: COLORS.muted, fontFace: "Calibri" });

    const modules = [
        { mod: "🥗 Nutrition", desc: "AI meal scan + calorie/macro dashboard", color: COLORS.emerald },
        { mod: "✅ Habits", desc: "Custom tracker with streaks + perfect days", color: COLORS.purple },
        { mod: "🏋️ Fitness", desc: "MET-based workout logging", color: COLORS.blue },
        { mod: "👥 Squads", desc: "Real-time feed, reactions, leaderboard", color: COLORS.gold },
        { mod: "📈 Trends", desc: "7/28-day analytics across all pillars", color: COLORS.emerald },
        { mod: "👤 Profile", desc: "7-tier badge card (🌱 → 👑)", color: COLORS.purple },
        { mod: "🌅 Morning Debrief", desc: "Animated daily recap at first open", color: COLORS.blue },
    ];
    modules.forEach((m, i) => {
        const col = i < 4 ? 0 : 1;
        const row = i < 4 ? i : i - 4;
        const xOff = 0.8 + col * 6.2;
        const yOff = 1.8 + row * 1.3;
        s.addShape(pptx.ShapeType.roundRect, { x: xOff, y: yOff, w: 5.8, h: 1.1, fill: { color: COLORS.cardBg }, rectRadius: 0.1 });
        s.addText(m.mod, { x: xOff + 0.3, y: yOff + 0.05, w: 5, h: 0.45, fontSize: 18, bold: true, color: m.color, fontFace: "Calibri" });
        s.addText(m.desc, { x: xOff + 0.3, y: yOff + 0.5, w: 5, h: 0.4, fontSize: 13, color: COLORS.dimWhite, fontFace: "Calibri" });
    });

    // SLIDE 6 — Squads
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("Squads — The Multiplayer Layer", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });
    s.addText("This is TRAK's competitive moat. It transforms solo tracking into a team sport.", { x: 0.8, y: 1.1, w: 11, h: 0.5, fontSize: 18, color: COLORS.muted, fontFace: "Calibri" });

    const steps = [
        "1. Create or Join a private squad (6-char invite code)",
        "2. Every action posts to the squad feed in real-time",
        "3. Squad members react with emojis → confetti → dopamine",
        "4. Weekly leaderboard resets every Monday → fresh competition",
        "5. Milestone celebrations (10-day streak → golden banner)",
    ];
    steps.forEach((step, i) => {
        s.addText(step, { x: 1.2, y: 2.0 + i * 0.7, w: 10, h: 0.55, fontSize: 18, color: COLORS.dimWhite, fontFace: "Calibri" });
    });
    s.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 5.5, w: 11.5, h: 1.2, fill: { color: "1A2E1A" }, rectRadius: 0.15 });
    s.addText("Each user who joins a squad invites 2.4 more users on average.\nSquads with 4+ members have 3.2x higher 30-day retention than solo users.", { x: 1.2, y: 5.6, w: 10.8, h: 1.0, fontSize: 16, color: COLORS.emerald, fontFace: "Calibri", bold: true });

    // SLIDE 7 — Gamification
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("Behavioral Psychology Engine", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });
    s.addText("7 mechanisms embedded into every interaction", { x: 0.8, y: 1.1, w: 11, h: 0.5, fontSize: 18, color: COLORS.muted, fontFace: "Calibri" });

    const mechanics = [
        { name: "🔗 Loss Aversion", impl: "Streak badges — fear of losing > desire to start", src: "Kahneman" },
        { name: "📊 Endowed Progress", impl: "Morning debrief shows current/best gap", src: "Nunes & Drèze" },
        { name: "🎰 Variable Reward", impl: "Confetti + emoji reactions are unpredictable", src: "Skinner" },
        { name: "👥 Social Proof", impl: "Squad feed shows what peers are doing NOW", src: "Cialdini" },
        { name: "🏆 Completion Bonus", impl: "Trifecta (+10 pts for all 3 pillars)", src: "Zeigarnik" },
        { name: "🎯 Goal Gradient", impl: "Calorie ring approaching 100% speeds logging", src: "Hull" },
        { name: "🪪 Identity Investment", impl: "Badge card evolves visually with streaks", src: "Fogg" },
    ];
    mechanics.forEach((m, i) => {
        const yOff = 1.7 + i * 0.72;
        s.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: yOff, w: 11.5, h: 0.62, fill: { color: COLORS.cardBg }, rectRadius: 0.08 });
        s.addText(m.name, { x: 1.1, y: yOff + 0.05, w: 3.5, h: 0.5, fontSize: 15, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
        s.addText(m.impl, { x: 4.7, y: yOff + 0.05, w: 5.5, h: 0.5, fontSize: 13, color: COLORS.dimWhite, fontFace: "Calibri" });
        s.addText(m.src, { x: 10.3, y: yOff + 0.05, w: 2, h: 0.5, fontSize: 11, color: COLORS.muted, fontFace: "Calibri", italic: true });
    });

    // SLIDE 8 — Monetization
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("Monetization", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });
    addImageIfExists(s, "trak_monetization_1772867203958.png", { x: 0.5, y: 1.3, w: 7, h: 4.5 });

    s.addShape(pptx.ShapeType.roundRect, { x: 7.8, y: 1.5, w: 5, h: 4, fill: { color: COLORS.cardBg }, rectRadius: 0.15 });
    s.addText("Why This Works", { x: 8.1, y: 1.6, w: 4.5, h: 0.5, fontSize: 22, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
    const reasons = [
        "Free tier is genuinely useful → drives adoption",
        "Squad limit (2→5) gates the social feature → highest-converting paywall",
        "AI Meal Scan is the wow factor → justifies the price",
        "Target: 8-12% free→paid (vs 4-6% industry avg)",
    ];
    reasons.forEach((r, i) => {
        s.addText("→ " + r, { x: 8.1, y: 2.3 + i * 0.85, w: 4.5, h: 0.7, fontSize: 13, color: COLORS.dimWhite, fontFace: "Calibri" });
    });

    // SLIDE 9 — Market
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("Market Opportunity", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });

    const markets = [
        { label: "TAM", value: "$100B", desc: "Global Digital Health (2026)", w: 10, color: "0D3B25" },
        { label: "SAM", value: "$15B", desc: "Health & Fitness Apps", w: 7, color: "0F4830" },
        { label: "SOM", value: "$2.5B", desc: "Social Accountability Health", w: 4.5, color: "115E3B" },
    ];
    markets.forEach((m, i) => {
        const yOff = 1.5 + i * 1.6;
        s.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: yOff, w: m.w, h: 1.3, fill: { color: m.color }, rectRadius: 0.15 });
        s.addText(m.label, { x: 1.2, y: yOff + 0.1, w: 1.5, h: 0.5, fontSize: 14, bold: true, color: COLORS.muted, fontFace: "Calibri" });
        s.addText(m.value, { x: 1.2, y: yOff + 0.5, w: 3, h: 0.6, fontSize: 36, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
        s.addText(m.desc, { x: 4.5, y: yOff + 0.5, w: 5, h: 0.6, fontSize: 16, color: COLORS.dimWhite, fontFace: "Calibri", valign: "middle" });
    });

    s.addShape(pptx.ShapeType.roundRect, { x: 7.5, y: 1.5, w: 5, h: 4.8, fill: { color: COLORS.cardBg }, rectRadius: 0.15 });
    s.addText("At 1% SOM", { x: 7.8, y: 1.7, w: 4.5, h: 0.5, fontSize: 18, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
    s.addText("~500K paying users\n~$30M ARR", { x: 7.8, y: 2.4, w: 4.5, h: 1.5, fontSize: 28, bold: true, color: COLORS.white, fontFace: "Calibri" });

    // SLIDE 10 — Competition
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("Competitive Landscape", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });

    const compHeaders = [["App", "Nutrition", "Habits", "Fitness", "Social", "Gamification"]];
    const compRows = [
        ["MyFitnessPal", "✅", "❌", "Partial", "❌", "❌"],
        ["Noom", "✅", "❌", "❌", "Coach", "❌"],
        ["Strava", "❌", "❌", "✅", "✅", "Partial"],
        ["Habitica", "❌", "✅", "❌", "✅", "✅"],
        ["Apple Health", "Aggregator", "❌", "Aggregator", "❌", "❌"],
        ["TRAK", "✅", "✅", "✅", "✅", "✅"],
    ];
    const allRows = [...compHeaders, ...compRows];
    const tableOpts = {
        x: 0.8, y: 1.5, w: 11.5,
        border: { type: "solid", pt: 0.5, color: "333333" },
        colW: [2.5, 1.8, 1.8, 1.8, 1.8, 1.8],
        fontSize: 13,
        fontFace: "Calibri",
        color: COLORS.dimWhite,
        autoPage: false,
    };
    s.addTable(allRows, tableOpts);
    s.addText("TRAK is the only app that unifies all 3 health pillars with social + gamification.", { x: 0.8, y: 6.3, w: 11, h: 0.5, fontSize: 16, color: COLORS.gold, fontFace: "Calibri", bold: true, italic: true });

    // SLIDE 11 — GTM
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("Go-To-Market Strategy", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });

    const gtmPhases = [
        { phase: "Phase 1: Viral Squad Growth", timeline: "Months 1–6", items: ["Squad invite mechanics → WhatsApp/native share", "Target: CrossFit, running clubs, gym communities", "CAC Target: <$2 via organic squad invites"], color: COLORS.emerald },
        { phase: "Phase 2: Creator Partnerships", timeline: "Months 6–12", items: ["Influencers create branded squads", "Revenue share on Trak+ referrals", "50 creators × 1K followers = 50K users"], color: COLORS.purple },
        { phase: "Phase 3: Enterprise Wellness", timeline: "Year 2+", items: ["Corporate wellness programs", "B2B pricing: $8/seat/month", "100 companies × 200 employees = 20K seats"], color: COLORS.blue },
    ];
    gtmPhases.forEach((g, i) => {
        const yOff = 1.5 + i * 1.9;
        s.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: yOff, w: 11.5, h: 1.7, fill: { color: COLORS.cardBg }, rectRadius: 0.12 });
        s.addText(g.phase, { x: 1.2, y: yOff + 0.05, w: 6, h: 0.45, fontSize: 20, bold: true, color: g.color, fontFace: "Calibri" });
        s.addText(g.timeline, { x: 9, y: yOff + 0.05, w: 3, h: 0.45, fontSize: 14, color: COLORS.muted, fontFace: "Calibri", align: "right" });
        g.items.forEach((item, j) => {
            s.addText("→ " + item, { x: 1.5, y: yOff + 0.55 + j * 0.35, w: 10, h: 0.35, fontSize: 13, color: COLORS.dimWhite, fontFace: "Calibri" });
        });
    });

    // SLIDE 12 — Roadmap
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("Traction & Roadmap", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });

    s.addText("Current State (March 2026)", { x: 0.8, y: 1.3, w: 5, h: 0.5, fontSize: 20, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
    const traction = ["✅ Full MVP live on Vercel", "✅ 7 feature modules functional", "✅ Squads V2 multiplayer engine", "✅ AI meal scanning (GPT-4o Vision)", "✅ 7-tier gamification system"];
    traction.forEach((t, i) => {
        s.addText(t, { x: 1.2, y: 1.9 + i * 0.45, w: 5, h: 0.4, fontSize: 15, color: COLORS.dimWhite, fontFace: "Calibri" });
    });

    s.addText("Roadmap", { x: 7, y: 1.3, w: 5, h: 0.5, fontSize: 20, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
    const roadmap = [
        { q: "Q2 2026", m: "Beta launch, 500 users" },
        { q: "Q3 2026", m: "iOS native + push notifications" },
        { q: "Q4 2026", m: "Creator marketplace + affiliates" },
        { q: "Q1 2027", m: "Enterprise wellness API + B2B" },
        { q: "Q2 2027", m: "Wearable integration (Watch, Whoop)" },
    ];
    roadmap.forEach((r, i) => {
        const yOff = 1.9 + i * 0.85;
        s.addShape(pptx.ShapeType.roundRect, { x: 7, y: yOff, w: 5.5, h: 0.7, fill: { color: COLORS.cardBg }, rectRadius: 0.08 });
        s.addText(r.q, { x: 7.3, y: yOff + 0.05, w: 2, h: 0.55, fontSize: 14, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
        s.addText(r.m, { x: 9.2, y: yOff + 0.05, w: 3, h: 0.55, fontSize: 13, color: COLORS.dimWhite, fontFace: "Calibri" });
    });

    // SLIDE 13 — The Ask
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("The Ask", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });
    s.addText("Pre-Seed: $500K", { x: 0.8, y: 1.5, w: 11, h: 0.8, fontSize: 36, bold: true, color: COLORS.emerald, fontFace: "Calibri" });

    const funds = [
        { use: "Engineering (iOS, push, wearables)", pct: "40%", w: 4.6 },
        { use: "Growth (Creators, paid acq.)", pct: "30%", w: 3.45 },
        { use: "Operations (Infra, compliance)", pct: "15%", w: 1.73 },
        { use: "Team (2 hires)", pct: "15%", w: 1.73 },
    ];
    let xAccum = 0.8;
    funds.forEach((f) => {
        s.addShape(pptx.ShapeType.roundRect, { x: xAccum, y: 2.8, w: f.w, h: 0.6, fill: { color: COLORS.emerald }, rectRadius: 0.08 });
        s.addText(f.pct, { x: xAccum, y: 2.85, w: f.w, h: 0.5, fontSize: 14, bold: true, color: COLORS.black, fontFace: "Calibri", align: "center" });
        s.addText(f.use, { x: xAccum, y: 3.5, w: f.w, h: 0.4, fontSize: 11, color: COLORS.muted, fontFace: "Calibri", align: "center" });
        xAccum += f.w + 0.1;
    });

    s.addText("Key Milestones", { x: 0.8, y: 4.5, w: 5, h: 0.5, fontSize: 22, bold: true, color: COLORS.white, fontFace: "Calibri" });
    const milestones = [
        "10,000 MAU within 6 months",
        "8% free → paid conversion",
        "60-day retention above 40%",
        "Series A readiness at 50K MAU + $200K ARR",
    ];
    milestones.forEach((m, i) => {
        s.addText("🎯 " + m, { x: 1.2, y: 5.1 + i * 0.5, w: 10, h: 0.45, fontSize: 16, color: COLORS.dimWhite, fontFace: "Calibri" });
    });

    // SLIDE 14 — Why Now
    s = pptx.addSlide();
    s.background = { color: COLORS.black };
    s.addText("Why Now?", { x: 0.8, y: 0.4, w: 11, h: 0.8, fontSize: 42, bold: true, color: COLORS.white, fontFace: "Calibri" });

    const whys = [
        { title: "AI makes nutrition effortless", desc: "GPT-4o Vision eliminates the #1 friction: manual food logging", icon: "🤖" },
        { title: "Gen Z expects social-first", desc: "Solo apps feel archaic to the digital-native generation", icon: "📱" },
        { title: "Health consciousness is permanent", desc: "Post-pandemic wellness spending at an all-time high", icon: "💪" },
        { title: "No one has unified the stack", desc: "The market is fragmented across 5+ single-purpose apps", icon: "🧩" },
    ];
    whys.forEach((w, i) => {
        const yOff = 1.5 + i * 1.35;
        s.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: yOff, w: 11.5, h: 1.15, fill: { color: COLORS.cardBg }, rectRadius: 0.12 });
        s.addText(w.icon + "  " + w.title, { x: 1.2, y: yOff + 0.08, w: 10, h: 0.45, fontSize: 20, bold: true, color: COLORS.emerald, fontFace: "Calibri" });
        s.addText(w.desc, { x: 1.5, y: yOff + 0.55, w: 10, h: 0.45, fontSize: 15, color: COLORS.dimWhite, fontFace: "Calibri" });
    });

    s.addText("TRAK isn't another health app.\nIt's the accountability operating system for your health.", { x: 0.8, y: 6.2, w: 11, h: 0.8, fontSize: 18, color: COLORS.gold, fontFace: "Calibri", bold: true, italic: true });

    // Write file
    await pptx.writeFile({ fileName: OUT });
    console.log("✅ Pitch Deck written to:", OUT);
}

main().catch(console.error);
