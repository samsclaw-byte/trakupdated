const docx = require("docx");
const fs = require("fs");
const path = require("path");

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, ImageRun } = docx;

const OUT = path.join(__dirname, "..", "TRAK_PRD.docx");
const IMG_DIR = "C:\\Users\\samcu\\.gemini\\antigravity\\brain\\7a66735e-5170-4a58-8da8-b2f0c0523bc7";

// Helper: heading
function h(text, level = HeadingLevel.HEADING_1) {
    return new Paragraph({ heading: level, spacing: { before: 300, after: 100 }, children: [new TextRun({ text, bold: true, font: "Calibri" })] });
}
// Helper: normal paragraph
function p(text, opts = {}) {
    return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, font: "Calibri", size: 22, ...opts })] });
}
// Helper: bold + normal
function bp(boldText, normalText) {
    return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: boldText, font: "Calibri", size: 22, bold: true }), new TextRun({ text: normalText, font: "Calibri", size: 22 })] });
}
// Table helper
function makeTable(headers, rows) {
    const borderNone = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    const borders = { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone };
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ tableHeader: true, children: headers.map(h => new TableCell({ borders, shading: { fill: "1B1B1B" }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, font: "Calibri", size: 20, color: "10B981" })] })] })) }),
            ...rows.map(row => new TableRow({ children: row.map(cell => new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: cell, font: "Calibri", size: 20 })] })] })) })),
        ],
    });
}

async function main() {
    const doc = new Document({
        styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "TRAK", font: "Calibri", size: 72, bold: true, color: "10B981" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Product Requirements Document", font: "Calibri", size: 32, color: "666666" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "Version 2.0 · March 2026", font: "Calibri", size: 22, color: "999999" })] }),

                // 1. Overview
                h("1. Product Overview"),
                p("TRAK is a unified health accountability platform that fuses Nutrition Tracking, Habit Building, Fitness Logging, and Social Accountability (Squads) into a single, gamified mobile-first experience."),
                p(""),
                bp("Mission: ", "Make consistency the product, not perfection."),

                // 2. Architecture
                h("2. Core Architecture"),
                p("The app consists of 13 pages across 7 core modules:"),
                makeTable(["Page", "Purpose"], [
                    ["Landing Page", "Marketing + sign-up entry point"],
                    ["Setup Wizard", "User onboarding — biometrics, goals, habits"],
                    ["Loading/Calibration", "Animated calculation of personalized targets"],
                    ["Dashboard", "Daily overview hub"],
                    ["Nutrition", "Calorie/macro/micro tracking + AI scan"],
                    ["Habits", "Daily habit checklist + streaks"],
                    ["Fitness", "Workout logging with MET calculations"],
                    ["Squads", "Multiplayer engine — feed, leaderboard, members"],
                    ["Trends", "7/28-day analytics across all pillars"],
                    ["Profile", "Badge card, streaks, settings"],
                    ["Shake Builder", "Protein shake calculator (Trak+)"],
                    ["Trak+", "Subscription upsell page"],
                ]),

                // 3. Nutrition
                h("3. Feature Modules", HeadingLevel.HEADING_1),
                h("3.1 Nutrition Engine", HeadingLevel.HEADING_2),
                makeTable(["Feature", "Description", "Status"], [
                    ["Calorie Dashboard", "Circular gauge: daily intake vs target", "✅ Live"],
                    ["Macro Pie Chart", "Protein / Carbs / Fat breakdown", "✅ Live"],
                    ["Micronutrient Web", "Radar chart: 7+ micronutrient RDA coverage", "✅ Live"],
                    ["AI Meal Scan", "Camera → GPT-4o Vision → auto-parsed nutrients", "✅ Live"],
                    ["Manual Meal Entry", "Text-based with nutrient auto-lookup", "✅ Live"],
                    ["Nutrition Trends", "7/28-day calorie and macro trend charts", "✅ Live"],
                ]),

                // 3.2 Habits
                h("3.2 Habits Engine", HeadingLevel.HEADING_2),
                makeTable(["Feature", "Description", "Status"], [
                    ["Daily Habit Grid", "Toggle-based checklist of active habits", "✅ Live"],
                    ["Add/Edit Habits", "Modal with icons and frequency settings", "✅ Live"],
                    ["Streak Badges", "Visual badges showing current streak", "✅ Live"],
                    ["Perfect Day Detection", "Awards when all habits completed", "✅ Live"],
                    ["Habit Trends", "Heatmap calendar and completion rates", "✅ Live"],
                ]),

                // 3.3 Fitness
                h("3.3 Fitness Engine", HeadingLevel.HEADING_2),
                makeTable(["Feature", "Description", "Status"], [
                    ["Workout Logger", "Log activity type, duration, calories", "✅ Live"],
                    ["MET Calculator", "Auto-calculate calories from activity + duration", "✅ Live"],
                    ["Fitness Trends", "Weekly workout frequency and burn charts", "✅ Live"],
                ]),

                // 3.4 Squads
                h("3.4 Squads (Multiplayer Engine)", HeadingLevel.HEADING_2),
                makeTable(["Feature", "Description", "Status"], [
                    ["Create Squad", "Deploy with auto-generated 6-char code", "✅ Live"],
                    ["Join Squad", "OTP-style 6-box input with auto-focus", "✅ Live"],
                    ["Activity Feed", "Real-time Supabase listener", "✅ Live"],
                    ["Emoji Reactions", "🔥💪🙌👀 + Canvas Confetti", "✅ Live"],
                    ["Holographic Leaderboard", "Gold/Silver/Bronze podium + weekly reset", "✅ Live"],
                    ["Tiered Milestone Cards", "Streak celebrations (3→100 days)", "✅ Live"],
                    ["Multi-Squad Toggle", "Pill switcher (2 basic / 5 Trak+)", "✅ Live"],
                    ["Share Invite", "Web Share API → WhatsApp/iMessage", "✅ Live"],
                    ["Achievement Popup", "Tappable card → glassmorphic modal", "✅ Live"],
                ]),

                // Scoring
                h("Scoring System", HeadingLevel.HEADING_3),
                makeTable(["Action", "Points"], [
                    ["✅ Habit Completion", "+5 pts"],
                    ["⭐ Perfect Habit Day", "+25 pts"],
                    ["🎯 Calorie Target Hit", "+50 pts"],
                    ["🏋️ Workout Logged", "+50 pts"],
                    ["🔱 Trifecta Bonus (all 3 pillars)", "+10 pts"],
                    ["🔥 Reaction Given", "+2 pts"],
                ]),

                // 3.5 Profile
                h("3.5 Profile & Gamification", HeadingLevel.HEADING_2),
                makeTable(["Feature", "Description", "Status"], [
                    ["Profile Badge Card", "Glassmorphic card with initials + tier icons", "✅ Live"],
                    ["Current/Best Notation", "3/5 format (current vs all-time best)", "✅ Live"],
                    ["7-Tier Badge System", "🌱→🔥→⚡→💪→🎯→💎→👑", "✅ Live"],
                    ["Morning Debrief", "Daily recap with odometer animation", "✅ Live"],
                    ["Supernova Reveal", "Card-flip for new badge tiers", "✅ Live"],
                ]),

                // Badge tiers
                h("Badge Tier System", HeadingLevel.HEADING_3),
                makeTable(["Days", "Icon", "Title", "Card Treatment"], [
                    ["0", "—", "Unranked", "Default border"],
                    ["3+", "🌱", "Getting Started", "Green tint"],
                    ["5+", "🔥", "Momentum", "Orange glow"],
                    ["10+", "⚡", "Double Digits", "Blue aura"],
                    ["21+", "💪", "Habit Formed", "Purple shimmer"],
                    ["30+", "🎯", "Monthly Master", "Emerald radiance"],
                    ["50+", "💎", "Elite", "Gold border"],
                    ["100+", "👑", "Legendary", "Full gold + crown"],
                ]),

                // 4. Tech Stack
                h("4. Technical Stack"),
                makeTable(["Layer", "Technology"], [
                    ["Frontend", "Next.js 15, React 19, TypeScript"],
                    ["Styling", "Tailwind CSS, Framer Motion"],
                    ["Backend", "Supabase (Auth, Postgres, Realtime, RPC)"],
                    ["AI", "OpenAI GPT-4o Vision (meal scanning)"],
                    ["Hosting", "Vercel (Edge Functions + CDN)"],
                    ["Gamification", "canvas-confetti, framer-motion"],
                    ["PWA", "Mobile-first responsive, installable"],
                ]),

                // 5. Monetization
                h("5. Monetization: Free vs Trak+"),
                makeTable(["Feature", "Free", "Trak+ ($4.99/mo)"], [
                    ["Nutrition tracking", "✅", "✅"],
                    ["Habits", "5 max", "Unlimited"],
                    ["Fitness logging", "✅", "✅"],
                    ["AI Meal Scan", "❌", "✅"],
                    ["Squads", "2 max", "5 max"],
                    ["Trends", "7-day", "28-day"],
                    ["Shake Builder", "❌", "✅"],
                    ["Badge card tier", "Standard", "Gold + Crown"],
                ]),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(OUT, buffer);
    console.log("✅ PRD written to:", OUT);
}

main().catch(console.error);
