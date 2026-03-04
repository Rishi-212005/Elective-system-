/**
 * AIRecommendationPanel.tsx
 * ---------------------------
 * A self-contained component that provides two AI features:
 *   1. CGPA-based Elective Recommendation
 *   2. Subject Explainer
 *
 * Designed to blend with the existing glass-card / badge design system.
 * No existing files were modified to accommodate this component.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Sparkles, BookOpen, AlertCircle, ChevronRight } from "lucide-react";
import { recommendElectives, explainSubject } from "@/api/ai";
import type { ElectiveRecommendation, ExplainResponse } from "@/api/ai";

// ── Difficulty badge colours ──────────────────────────────────────────────────
const difficultyClass: Record<string, string> = {
    Easy: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    Medium: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    Hard: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Loading spinner */
const Spinner = () => (
    <div className="flex items-center justify-center py-8">
        <Loader2 size={28} className="animate-spin text-secondary" />
        <span className="ml-3 text-sm text-muted-foreground">Asking AI…</span>
    </div>
);

/** Error message */
const ErrorBox = ({ message }: { message: string }) => (
    <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
        <span>{message}</span>
    </div>
);

/** Recommendation card */
const RecommendationCard = ({
    rec,
    index,
    onExplain,
}: {
    rec: ElectiveRecommendation;
    index: number;
    onExplain: (subject: string) => void;
}) => (
    <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.07 }}
        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/40 border border-border/50 hover:border-secondary/40 transition-colors"
    >
        {/* Rank bubble */}
        <div className="w-8 h-8 rounded-lg gradient-primary flex-shrink-0 flex items-center justify-center text-primary-foreground text-xs font-bold">
            #{index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-foreground text-sm">{rec.subject}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${difficultyClass[rec.difficulty] ?? difficultyClass.Medium}`}>
                    {rec.difficulty}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
                    {rec.probability} chance
                </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{rec.explanation}</p>
        </div>

        {/* Quick-explain button */}
        <button
            onClick={() => onExplain(rec.subject)}
            title="Explain this subject"
            className="flex items-center gap-1 text-[11px] font-semibold text-secondary hover:text-secondary/80 transition-colors flex-shrink-0"
        >
            Explain <ChevronRight size={12} />
        </button>
    </motion.div>
);

/** Subject explanation card */
const ExplainCard = ({ data }: { data: ExplainResponse }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 rounded-xl bg-muted/40 border border-border/50 space-y-3"
    >
        <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${difficultyClass[data.difficulty] ?? difficultyClass.Medium}`}>
                {data.difficulty}
            </span>
        </div>

        <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">About</p>
            <p className="text-sm text-foreground leading-relaxed">{data.about}</p>
        </div>

        <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Topics</p>
            <div className="flex flex-wrap gap-1.5">
                {data.keyTopics.map((topic, i) => (
                    <span key={i} className="badge-primary px-2.5 py-1 text-[11px] font-medium">
                        {topic}
                    </span>
                ))}
            </div>
        </div>

        <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Who Should Choose This?</p>
            <p className="text-sm text-foreground leading-relaxed">{data.whoShouldChoose}</p>
        </div>
    </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const AIRecommendationPanel = () => {
    // ── Recommendation state
    const [cgpa, setCgpa] = useState("");
    const [recs, setRecs] = useState<ElectiveRecommendation[]>([]);
    const [recLoading, setRecLoading] = useState(false);
    const [recError, setRecError] = useState("");

    // ── Explainer state
    const [subjectInput, setSubjectInput] = useState("");
    const [explainData, setExplainData] = useState<ExplainResponse | null>(null);
    const [explainLoading, setExplainLoading] = useState(false);
    const [explainError, setExplainError] = useState("");
    const [explainedFor, setExplainedFor] = useState(""); // label for what we explained

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleRecommend = async () => {
        const val = parseFloat(cgpa);
        if (isNaN(val) || val < 0 || val > 10) {
            setRecError("Please enter a valid CGPA between 0 and 10.");
            return;
        }
        setRecLoading(true);
        setRecError("");
        setRecs([]);
        try {
            const result = await recommendElectives(val);
            setRecs(result.recommendations ?? []);
        } catch (err: any) {
            setRecError(err?.message ?? "Failed to get recommendations. Please try again.");
        } finally {
            setRecLoading(false);
        }
    };

    const handleExplain = async (subject: string) => {
        if (!subject.trim()) {
            setExplainError("Please enter a subject name.");
            return;
        }
        setExplainLoading(true);
        setExplainError("");
        setExplainData(null);
        setExplainedFor(subject.trim());
        try {
            const result = await explainSubject(subject.trim());
            setExplainData(result);
        } catch (err: any) {
            setExplainError(err?.message ?? "Failed to explain subject. Please try again.");
        } finally {
            setExplainLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-elevated p-4 sm:p-6 mb-6 sm:mb-8"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Brain size={18} className="text-secondary" />
                </div>
                <div>
                    <h3 className="font-display font-bold text-foreground text-sm sm:text-base">AI Recommendation</h3>
                    <p className="text-xs text-muted-foreground">Enter your CGPA to get personalised elective suggestions</p>
                </div>
            </div>

            {/* ── Section 1: CGPA Recommender ── */}
            <div className="mb-5">
                <div className="flex gap-2">
                    <input
                        id="ai-cgpa-input"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        placeholder="Enter CGPA (e.g. 8.5)"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRecommend()}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/50 transition-all"
                    />
                    <button
                        id="ai-recommend-btn"
                        onClick={handleRecommend}
                        disabled={recLoading}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs sm:text-sm font-bold hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <Sparkles size={14} />
                        {recLoading ? "Loading…" : "Recommend"}
                    </button>
                </div>

                {recError && <ErrorBox message={recError} />}
                {recLoading && <Spinner />}

                <AnimatePresence>
                    {recs.length > 0 && (
                        <motion.div
                            key="recs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mt-3 space-y-2"
                        >
                            {recs.map((rec, i) => (
                                <RecommendationCard
                                    key={rec.subject + i}
                                    rec={rec}
                                    index={i}
                                    onExplain={(s) => {
                                        setSubjectInput(s);
                                        handleExplain(s);
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="border-t border-border/40 my-4" />

            {/* ── Section 2: Subject Explainer ── */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={14} className="text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject Explainer</p>
                </div>

                <div className="flex gap-2">
                    <input
                        id="ai-subject-input"
                        type="text"
                        placeholder="Enter subject name (e.g. Machine Learning)"
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleExplain(subjectInput)}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-muted/50 border border-border/60 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/50 transition-all"
                    />
                    <button
                        id="ai-explain-btn"
                        onClick={() => handleExplain(subjectInput)}
                        disabled={explainLoading}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted border border-border/60 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Brain size={14} />
                        {explainLoading ? "Loading…" : "Explain"}
                    </button>
                </div>

                {explainError && <ErrorBox message={explainError} />}
                {explainLoading && <Spinner />}

                <AnimatePresence>
                    {explainData && !explainLoading && (
                        <motion.div key="explain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <p className="text-xs text-muted-foreground mt-4 mb-1 font-medium">
                                Explaining: <span className="font-bold text-foreground">{explainedFor}</span>
                            </p>
                            <ExplainCard data={explainData} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default AIRecommendationPanel;
