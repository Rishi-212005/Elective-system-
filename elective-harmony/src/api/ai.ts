/**
 * ai.ts – Frontend API helpers for AI features
 * -----------------------------------------------
 * Uses the existing apiFetch helper to call the backend AI endpoints.
 * The OpenAI API key is NEVER present here – it lives only in the backend .env.
 */

import { apiFetch } from "./http";

// ── Types ────────────────────────────────────────────────────────────────────

export type ElectiveRecommendation = {
    subject: string;
    difficulty: "Easy" | "Medium" | "Hard";
    probability: string; // e.g. "82%"
    explanation: string;
};

export type RecommendResponse = {
    recommendations: ElectiveRecommendation[];
};

export type ExplainResponse = {
    about: string;
    keyTopics: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    whoShouldChoose: string;
};

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Sends CGPA to the backend and returns AI-powered elective recommendations.
 * @param cgpa  Student's CGPA on a 0–10 scale
 */
export function recommendElectives(cgpa: number): Promise<RecommendResponse> {
    return apiFetch<RecommendResponse>("/ai/recommend", {
        method: "POST",
        body: JSON.stringify({ cgpa }),
    });
}

/**
 * Asks the AI to explain a given elective subject.
 * @param subject  Name of the elective subject
 */
export function explainSubject(subject: string): Promise<ExplainResponse> {
    return apiFetch<ExplainResponse>("/ai/explain", {
        method: "POST",
        body: JSON.stringify({ subject }),
    });
}
