/**
 * AI Routes – Smart Open Elective System
 * ----------------------------------------
 * Provides two AI-powered endpoints:
 *   POST /ai/recommend  – CGPA-based elective recommendations
 *   POST /ai/explain    – Detailed explanation for a given subject name
 *
 * The OpenAI API key is read only from environment variables (process.env.OPENAI_API_KEY).
 * It is NEVER sent to the frontend.
 */

import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { Elective } from "../models/Elective";

const router = Router();

/** Lazy OpenAI client – only created when OPENAI_API_KEY is set. Server can start without it. */
function getOpenAI(): OpenAI | null {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.trim() === "") return null;
    return new OpenAI({
        apiKey: key,
        baseURL: process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "http://localhost:4000",
            "X-Title": "Smart Open Elective System",
        },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /ai/recommend
// Body: { cgpa: number }
// Returns: { recommendations: Array<{ subject, difficulty, probability, explanation }> }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/recommend", async (req: Request, res: Response) => {
    try {
        const openai = getOpenAI();
        if (!openai) {
            return res.status(503).json({
                message: "AI is not configured. Set OPENAI_API_KEY in backend/.env to enable recommendations.",
            });
        }

        const { cgpa } = req.body;

        // Basic validation
        if (cgpa === undefined || cgpa === null) {
            return res.status(400).json({ message: "cgpa is required" });
        }
        const cgpaNum = parseFloat(cgpa);
        if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
            return res.status(400).json({ message: "cgpa must be a number between 0 and 10" });
        }

        // ── Structured prompt for elective recommendations ──
        const electives = await Elective.find({ isActive: true })
            .select("code name department")
            .sort({ code: 1 })
            .lean();

        const availableList = electives
            .map((e) => `- ${e.name} (${e.department || "Dept N/A"}) [${e.code}]`)
            .join("\n");

        const prompt = `
You are an academic advisor for an Indian engineering college. A student has a CGPA of ${cgpaNum.toFixed(2)} (on a 10-point scale).

Based on their CGPA, recommend the 5 best open elective subjects they are most suitable for.
You MUST choose ONLY from the following available electives list (do not invent new subjects):
${availableList}

Return ONLY a valid JSON array (no markdown, no extra text) in this exact format:
[
  {
    "subject": "Subject Name",
    "difficulty": "Easy" | "Medium" | "Hard",
    "probability": "percentage string like 85%",
    "explanation": "Short 1–2 sentence explanation of why this suits the student and what they will learn."
  }
]

Rules:
- You MUST pick subjects exactly as named in the available electives list.
- Students with CGPA 8.5–10 can handle Hard subjects; 7–8.4 are best suited for Medium; below 7 do best with Easy / Medium.
- Probability should reflect how likely the student is to be allotted the subject given competition vs their CGPA.
- Keep explanations concise and encouraging.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful academic advisor AI. Always respond with valid JSON only, no markdown code blocks.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        // Parse the AI response as JSON
        const raw = completion.choices[0]?.message?.content ?? "[]";
        let recommendations;
        try {
            // Strip any accidental markdown code fences the model may add
            const clean = raw.replace(/```json?|```/g, "").trim();
            recommendations = JSON.parse(clean);
        } catch {
            return res.status(500).json({ message: "AI returned an invalid format. Please try again." });
        }

        return res.json({ recommendations });
    } catch (err: any) {
        console.error("[AI /recommend error]", err?.message ?? err);
        const status = err?.status ?? err?.response?.status;
        if (status === 429) {
            return res.status(503).json({
                message: "OpenAI quota exceeded. Please add billing credits at platform.openai.com and try again.",
            });
        }
        if (status === 401) {
            return res.status(503).json({
                message: "Invalid OpenAI API key. Please check OPENAI_API_KEY in backend/.env.",
            });
        }
        return res.status(500).json({ message: "AI service error. Please try again later." });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /ai/explain
// Body: { subject: string }
// Returns: { about, keyTopics: string[], difficulty, whoShouldChoose }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/explain", async (req: Request, res: Response) => {
    try {
        const openai = getOpenAI();
        if (!openai) {
            return res.status(503).json({
                message: "AI is not configured. Set OPENAI_API_KEY in backend/.env to enable explanations.",
            });
        }

        const { subject } = req.body;

        if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
            return res.status(400).json({ message: "subject name is required" });
        }

        const subjectTrimmed = subject.trim();
        const exists = await Elective.findOne({ isActive: true, name: subjectTrimmed }).select("_id").lean();
        if (!exists) {
            return res.status(400).json({ message: "Unknown elective subject. Please choose a subject from the electives list." });
        }

        // ── Structured prompt for subject explanation ──
        const prompt = `
You are an expert academic advisor. Explain the open elective subject "${subjectTrimmed}" for an engineering student.

Return ONLY a valid JSON object (no markdown, no extra text) in this exact format:
{
  "about": "2–3 sentence overview of what the subject covers.",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "difficulty": "Easy" | "Medium" | "Hard",
  "whoShouldChoose": "1–2 sentences describing which type of student (interest, career goals, CGPA range) should pick this subject."
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful academic advisor AI. Always respond with valid JSON only, no markdown code blocks.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const raw = completion.choices[0]?.message?.content ?? "{}";
        let explanation;
        try {
            const clean = raw.replace(/```json?|```/g, "").trim();
            explanation = JSON.parse(clean);
        } catch {
            return res.status(500).json({ message: "AI returned an invalid format. Please try again." });
        }

        return res.json(explanation);
    } catch (err: any) {
        console.error("[AI /explain error]", err?.message ?? err);
        const status = err?.status ?? err?.response?.status;
        if (status === 429) {
            return res.status(503).json({
                message: "OpenAI quota exceeded. Please add billing credits at platform.openai.com and try again.",
            });
        }
        if (status === 401) {
            return res.status(503).json({
                message: "Invalid OpenAI API key. Please check OPENAI_API_KEY in backend/.env.",
            });
        }
        return res.status(500).json({ message: "AI service error. Please try again later." });
    }
});

export default router;
