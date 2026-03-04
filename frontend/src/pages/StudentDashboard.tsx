import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Award, Sparkles, Brain } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import { getElectives, type ElectiveDto } from "@/api/electives";
import { getStudentAllocation, getStudentPreferences } from "@/api/student";
import AIRecommendationPanel from "@/components/AIRecommendationPanel"; // AI feature – added

const MIN_PREFS = 3;
const MAX_PREFS = 10;

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [electives, setElectives] = useState<ElectiveDto[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [allocation, setAllocation] = useState<Awaited<ReturnType<typeof getStudentAllocation>> | null>(null);

  useEffect(() => {
    getElectives().then(setElectives).catch(() => setElectives([]));
    getStudentPreferences()
      .then((p) => {
        if (p.status !== "none") {
          const ordered = p.preferences.slice().sort((a, b) => a.rank - b.rank).map((x) => x.electiveLegacyId);
          setPreferences(ordered);
          setSubmitted(p.status === "submitted");
        }
      })
      .catch(() => { });
    getStudentAllocation().then(setAllocation).catch(() => setAllocation({ announced: false }));
  }, []);

  const allocatedElective = useMemo(() => {
    if (!allocation || !allocation.announced) return null;
    if (allocation.status !== "allocated") return null;
    return allocation.elective;
  }, [allocation]);

  return (
    <DashboardLayout title="Student Dashboard" subtitle="Manage your elective preferences">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl gradient-primary p-5 sm:p-8 mb-6 sm:mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/5 to-transparent" />
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-primary-foreground/5 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Sparkles size={16} className="text-primary-foreground/70" />
              <span className="text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider">Welcome back</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-primary-foreground mb-1 sm:mb-2">
              Hello, {user?.name} 👋
            </h2>
            <p className="text-primary-foreground/50 text-xs sm:text-sm max-w-md">
              Select {MIN_PREFS}–{MAX_PREFS} preferred open electives. AI recommendations are ready for you.
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate("/elective-selection")}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-primary-foreground text-foreground text-xs sm:text-sm font-bold hover:bg-primary-foreground/90 transition-all shadow-lg flex-1 sm:flex-initial justify-center"
            >
              <BookOpen size={16} /> Browse
            </button>
            <button
              onClick={() => navigate("/allocation-result")}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary-foreground/15 transition-all flex-1 sm:flex-initial justify-center"
            >
              <Award size={16} /> Results
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <StatCard title="Preferences Set" value={`${preferences.length}/${MAX_PREFS}`} icon={<CheckCircle size={20} />} description={`Min ${MIN_PREFS} required`} delay={0.1} />
        <StatCard title="Available Electives" value={electives.length} icon={<BookOpen size={20} />} description="Open for registration" delay={0.2} />
        <StatCard title="AI Match Score" value="94%" icon={<Brain size={20} />} description="Based on your profile" trend="↑ 12% from last sem" delay={0.3} />
      </div>

      {/* Allocation Status */}
      {allocatedElective && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card-elevated p-4 sm:p-6 mb-6 sm:mb-8 border-l-4 border-l-success"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle size={18} className="text-success" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-sm sm:text-base">Allocation Confirmed</h3>
              <p className="text-xs text-muted-foreground">Your elective has been assigned</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            You have been allocated: <span className="font-bold text-foreground">{allocatedElective.name}</span> ({allocatedElective.code}){allocatedElective.facultyName ? ` with ${allocatedElective.facultyName}` : ""}
          </p>
        </motion.div>
      )}

      {/* AI Recommendation – replaced static placeholder with live AIRecommendationPanel */}
      <AIRecommendationPanel />

      {/* Preferences Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card-elevated p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-bold text-foreground text-sm sm:text-base">Your Preferences</h3>
            <p className="text-xs text-muted-foreground">
              {submitted ? "Submitted" : "Draft"} · {preferences.length}/{MAX_PREFS} selected
            </p>
          </div>
          <button onClick={() => navigate("/elective-selection")} className="btn-primary text-xs sm:text-sm">
            Edit Preferences
          </button>
        </div>

        {preferences.length === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center">
            No preferences saved yet. Click “Edit Preferences” to choose electives.
          </div>
        ) : (
          <div className="space-y-2">
            {preferences.map((id, idx) => {
              const elective = electives.find((e) => e.legacyId === id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/50"
                >
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <span className="font-mono text-muted-foreground">{elective?.code ?? id}</span>
                      <span className="font-semibold text-foreground truncate">
                        {elective?.name ?? "Elective"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {elective?.department ?? ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
