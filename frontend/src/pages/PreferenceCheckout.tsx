import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Send, Edit3, BookOpen, User, Users, Hash } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { getElectives, type ElectiveDto } from "@/api/electives";
import { getStudentPreferences, getStudentProfile, saveStudentPreferences, submitStudentPreferences } from "@/api/student";

const PreferenceCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedIds: string[] = location.state?.selected || [];
  const [electives, setElectives] = useState<ElectiveDto[]>([]);
  const [resolvedSelected, setResolvedSelected] = useState<string[]>(selectedIds);
  const [deadline, setDeadline] = useState<string | null | undefined>(undefined);
  const [status, setStatus] = useState<"none" | "draft" | "submitted">("none");
  const [preferenceLocked, setPreferenceLocked] = useState(false);

  useEffect(() => {
    getElectives().then(setElectives).catch(() => setElectives([]));

    if (!selectedIds || selectedIds.length === 0) {
      getStudentPreferences()
        .then((p) => {
          setStatus(p.status);
          setDeadline(p.deadline ?? null);
          setPreferenceLocked(!!p.preferenceLocked);
          if (p.status !== "none") {
            const ordered = p.preferences.slice().sort((a, b) => a.rank - b.rank).map((x) => x.electiveLegacyId);
            setResolvedSelected(ordered);
          }
        })
        .catch(() => {});
    } else {
      getStudentPreferences()
        .then((p) => {
          setStatus(p.status);
          setDeadline(p.deadline ?? null);
          setPreferenceLocked(!!p.preferenceLocked);
        })
        .catch(() => {});
    }
  }, []);

  const selectedElectives = useMemo(
    () => resolvedSelected.map((id) => electives.find((e) => e.legacyId === id)).filter(Boolean),
    [resolvedSelected, electives]
  );

  const handleSave = async () => {
    if (preferenceLocked) {
      toast.error("Your results have been announced. You cannot save or change preferences.");
      return;
    }
    if (deadline && new Date(deadline) < new Date()) {
      toast.error("The preference deadline has passed. You can no longer save or change your draft.");
      return;
    }
    try {
      const profile = await getStudentProfile();
      if (!profile.profile.profileCompleted) {
        toast.error("Please save your Profile first, then you can save preferences.");
        navigate("/student/profile");
        return;
      }
      await saveStudentPreferences(resolvedSelected.map((id, i) => ({ electiveId: id, rank: i + 1 })));
      toast.success("Draft saved successfully! 🎉 Your preferences are stored, you can edit anytime before deadline.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save draft");
    }
  };

  const handleSubmit = async () => {
    if (preferenceLocked) {
      toast.error("Your results have been announced. You cannot submit preferences.");
      return;
    }
    if (deadline && new Date(deadline) < new Date()) {
      toast.error("The preference deadline has passed. You can no longer submit preferences.");
      return;
    }
    try {
      const profile = await getStudentProfile();
      if (!profile.profile.profileCompleted) {
        toast.error("Please save your Profile first, then submit preferences.");
        navigate("/student/profile");
        return;
      }
      await saveStudentPreferences(resolvedSelected.map((id, i) => ({ electiveId: id, rank: i + 1 })));
      await submitStudentPreferences();
      toast.success("Preferences submitted successfully! 🎉 Your final list has been recorded.");
      navigate("/dashboard/student");
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit preferences");
    }
  };

  if (selectedElectives.length === 0) {
    return (
      <DashboardLayout title="Checkout" subtitle="Review your preferences">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={48} className="text-muted-foreground/30 mb-4" />
          <h2 className="font-display font-bold text-lg text-foreground mb-2">No Preferences Selected</h2>
          <p className="text-sm text-muted-foreground mb-4">Go back and select your preferred electives first.</p>
          <button onClick={() => navigate("/elective-selection")} className="btn-primary">
            Browse Electives
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Preference Checkout" subtitle="Review and confirm your selections">
      {preferenceLocked && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-sm">
          <strong>Results announced.</strong> You can no longer edit or submit preferences. Your allocation is final.
        </div>
      )}
      <button
        onClick={() => navigate("/elective-selection")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Selection
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl sm:text-2xl font-display font-extrabold text-foreground mb-1">Review Your Preferences</h2>
        <p className="text-sm text-muted-foreground">
          You have selected <strong className="text-foreground">{selectedElectives.length}</strong> elective(s). Review the details below before saving or submitting.
        </p>
        {deadline && (
          <p className="text-xs mt-1">
            <span className="font-semibold text-foreground">Deadline:</span>{" "}
            <span className={new Date(deadline) < new Date() ? "text-destructive" : "text-emerald-600"}>
              {new Date(deadline).toLocaleString()}
            </span>{" "}
            {new Date(deadline) < new Date() && "· Editing is now locked."}
          </p>
        )}
      </motion.div>

      {/* Preference List */}
      <div className="space-y-4 mb-8">
        {selectedElectives.map((elective, i) => (
          <motion.div
            key={elective!.legacyId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card-elevated p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
              #{i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm sm:text-base">{elective!.name}</h3>
                  <span className="text-xs font-mono text-muted-foreground">{elective!.code}</span>
                </div>
                <span className="badge-primary text-xs px-2 py-1">Preference {i + 1}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3"></p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User size={12} /> {elective!.facultyName || "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Hash size={12} /> {elective!.department || "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={12} /> {elective!.seatLimit} seats
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card-elevated p-5 sm:p-6 mb-6"
      >
        <h3 className="font-display font-bold text-foreground mb-3">Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">Total Selected</span>
            <span className="font-bold text-foreground">{selectedElectives.length} electives</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Top Choice</span>
            <span className="font-bold text-foreground">{selectedElectives[0]?.name}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Status</span>
            <span className="font-bold">
              {preferenceLocked ? (
                <span className="text-amber-600">Locked (Results announced)</span>
              ) : status === "submitted" ? (
                <span className="text-emerald-600">Submitted</span>
              ) : deadline && new Date(deadline) < new Date() ? (
                <span className="text-destructive">Locked</span>
              ) : (
                <span className="text-warning">Pending Review</span>
              )}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons - hidden when results announced */}
      {!preferenceLocked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => navigate("/elective-selection")}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex-1"
          >
            <Edit3 size={16} /> Edit Selections
          </button>
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-bold hover:bg-secondary/20 transition-all flex-1"
          >
            <Save size={16} /> Save Draft
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex items-center justify-center gap-2 flex-1"
          >
            <Send size={16} /> Submit Preferences
          </button>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default PreferenceCheckout;
