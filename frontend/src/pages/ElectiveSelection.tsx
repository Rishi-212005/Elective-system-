import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, ShoppingCart, Search, Info } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ElectiveCard from "@/components/ElectiveCard";
import { toast } from "sonner";
import { getElectives, type ElectiveDto } from "@/api/electives";
import { getStudentPreferences, getStudentProfile, saveStudentPreferences } from "@/api/student";

const MIN_PREFS = 3;
const MAX_PREFS = 10;

const ElectiveSelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [deadline, setDeadline] = useState<string | null | undefined>(undefined);
  const [preferenceLocked, setPreferenceLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [electives, setElectives] = useState<ElectiveDto[]>([]);
  const [semesterFilter, setSemesterFilter] = useState<string>("");

  useEffect(() => {
    getElectives()
      .then((list) => {
        setElectives(list);
        const semesters = Array.from(new Set(list.map((e) => e.semester).filter(Boolean))) as string[];
        if (semesters.length > 0) {
          setSemesterFilter(semesters[0]);
        }
      })
      .catch(() => setElectives([]));
    getStudentPreferences()
      .then((p) => {
        if (p.status !== "none") {
          const ordered = p.preferences.slice().sort((a, b) => a.rank - b.rank).map((x) => x.electiveLegacyId);
          setSelected(ordered);
          setSubmitted(p.status === "submitted");
        }
        setDeadline(p.deadline ?? null);
        setPreferenceLocked(!!p.preferenceLocked);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      electives.filter((e) => {
        if (semesterFilter && e.semester && e.semester !== semesterFilter) return false;
        const q = searchQuery.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          (e.facultyName || "").toLowerCase().includes(q)
        );
      }),
    [electives, searchQuery, semesterFilter]
  );

  const toggle = (id: string) => {
    if (preferenceLocked) {
      toast.error("Your results have been announced. You cannot change preferences.");
      return;
    }
    if (submitted) return;
    if (deadline && new Date(deadline) < new Date()) {
      toast.error("The preference deadline has passed. You can no longer change your selections.");
      return;
    }
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_PREFS) {
        toast.error(`Maximum ${MAX_PREFS} preferences allowed`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleCheckout = () => {
    if (preferenceLocked) {
      toast.error("Your results have been announced. You cannot edit or submit preferences.");
      return;
    }
    if (selected.length < MIN_PREFS) {
      toast.error(`Select at least ${MIN_PREFS} preferences`);
      return;
    }
    if (deadline && new Date(deadline) < new Date()) {
      toast.error("The preference deadline has passed. You can no longer submit or edit preferences.");
      return;
    }
    getStudentProfile()
      .then((p) => {
        if (!p.profile.profileCompleted) {
          toast.error("Please save your Profile first, then you can submit preferences.");
          navigate("/student/profile");
          return;
        }
        // best-effort save draft before checkout
        saveStudentPreferences(selected.map((id, i) => ({ electiveId: id, rank: i + 1 }))).catch(() => {});
        navigate("/preference-checkout", { state: { selected } });
      })
      .catch(() => {
        // fallback: still allow navigation
        navigate("/preference-checkout", { state: { selected } });
      });
  };

  return (
    <DashboardLayout title="Elective Selection" subtitle="Choose your preferred electives">
      {preferenceLocked && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-sm">
          <strong>Results announced.</strong> You can no longer edit or submit preferences. Your allocation is final.
        </div>
      )}
      <button
        onClick={() => navigate("/dashboard/student")}
        className="btn-ghost flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Header with search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4"
      >
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-extrabold text-foreground">Choose Your Electives</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Select {MIN_PREFS}–{MAX_PREFS} electives in order of preference ({selected.length}/{MAX_PREFS})
          </p>
          {deadline && (
            <p className="text-xs mt-1">
              <span className="font-semibold text-foreground">Deadline:</span>{" "}
              <span className={new Date(deadline) < new Date() ? "text-destructive" : "text-emerald-600"}>
                {new Date(deadline).toLocaleString()}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full sm:w-64"
              placeholder="Search electives..."
            />
          </div>
          {semesterFilter && (
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="input-field w-full sm:w-40"
            >
              {Array.from(new Set(electives.map((e) => e.semester).filter(Boolean))).map((s) => (
                <option key={s as string} value={s as string}>
                  Semester {s}
                </option>
              ))}
            </select>
          )}
          {selected.length >= MIN_PREFS && !preferenceLocked && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleCheckout}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} /> Checkout ({selected.length})
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-info/5 border border-info/20 mb-6 text-xs sm:text-sm text-muted-foreground">
        <Info size={16} className="text-info shrink-0 mt-0.5" />
        <span>Select minimum <strong className="text-foreground">{MIN_PREFS}</strong> and maximum <strong className="text-foreground">{MAX_PREFS}</strong> electives. Higher-ranked choices get priority. Allocation is based on CGPA.</span>
      </div>

      {/* Selected preferences summary */}
      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass-card-elevated p-3 sm:p-4 mb-6"
        >
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Your picks:</span>
          <div className="flex flex-wrap items-center gap-2">
            {selected.map((id, i) => {
              const e = electives.find((el) => el.legacyId === id);
              return (
                <span key={id} className="badge-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
                  <span className="font-bold">{i + 1}.</span> {e?.name}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {filtered.map((e, i) => {
          const idx = selected.indexOf(e.legacyId);
          return (
            <ElectiveCard
              key={e.legacyId}
              elective={{
                id: e.legacyId,
                code: e.code,
                name: e.name,
                faculty: e.facultyName || "",
                department: e.department || "",
                totalSeats: e.seatLimit,
                remainingSeats: e.seatLimit,
                description: "",
              }}
              selectable
              selected={idx !== -1}
              preferenceLabel={idx !== -1 ? `Preference ${idx + 1}` : undefined}
              onSelect={() => toggle(e.legacyId)}
              delay={i * 0.05}
            />
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default ElectiveSelection;
