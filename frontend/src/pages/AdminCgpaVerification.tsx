import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Play, ShieldCheck, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { getAdminStudents, getCgpaFlags, runCgpaVerification, forwardCgpaFlag, getCgpaSnapshotsSummary, type CgpaFlagRow, type AdminStudentRow } from "@/api/admin";
import { toast } from "sonner";

const semesters = ["3-1", "3-2", "4-1", "4-2"];
const departments = ["Computer Science", "Electronics", "Mechanical", "Information Technology"];

const AdminCgpaVerification = () => {
  const [semesterSlot, setSemesterSlot] = useState("3-2");
  const [department, setDepartment] = useState("Computer Science");
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{
    totalChecked: number;
    matched: number;
    flagged: number;
    missingOfficial: number;
  } | null>(null);
  const [flags, setFlags] = useState<CgpaFlagRow[]>([]);
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const [officialSummary, setOfficialSummary] = useState<{ department: string; semesterSlot: string; count: number }[]>([]);

  const slotToSemesters: Record<string, number[]> = {
    "3-1": [5],
    "3-2": [6],
    "4-1": [7],
    "4-2": [8],
  };

  const loadStudentsForScope = async (slot: string, dept: string) => {
    const all = await getAdminStudents();
    const target = slotToSemesters[slot] ?? [];
    const filtered = all.filter((s) => {
      if (s.department !== dept) return false;
      if (target.length === 0) return true;
      return target.includes(s.semester);
    });
    setStudents(filtered);
  };

  const loadFlags = async () => {
    const rows = await getCgpaFlags({ department, semesterSlot, status: "open" });
    setFlags(rows);
  };

  useEffect(() => {
    loadStudentsForScope(semesterSlot, department);
    loadFlags();
    getCgpaSnapshotsSummary()
      .then((r) => setOfficialSummary(r.summary))
      .catch(() => setOfficialSummary([]));
  }, [semesterSlot, department]);

  const handleVerify = async () => {
    setIsVerifying(true);
    setProgress(5);
    setSummary(null);

    const timer = setInterval(() => {
      setProgress((p) => (p < 70 ? p + 5 : p));
    }, 200);

    try {
      const result = await runCgpaVerification({ semesterSlot, department });
      clearInterval(timer);
      setProgress(100);
      setSummary({
        totalChecked: result.totalChecked,
        matched: result.matched,
        flagged: result.flagged,
        missingOfficial: result.missingOfficial,
      });
      setFlags(result.flags);
      await loadStudentsForScope(semesterSlot, department);
      toast.success("CGPA verification completed");
      setTimeout(() => setIsVerifying(false), 600);
    } catch (e: any) {
      clearInterval(timer);
      setIsVerifying(false);
      setProgress(0);
      toast.error(e?.message || "Failed to run CGPA verification");
    }
  };

  const handleForward = async (id: string) => {
    setForwardingId(id);
    try {
      await forwardCgpaFlag(id);
      toast.success("Student forwarded to mentor and removed from this allocation round");
      await loadFlags();
      await loadStudentsForScope(semesterSlot, department);
    } catch (e: any) {
      toast.error(e?.message || "Failed to forward flag");
    } finally {
      setForwardingId(null);
    }
  };

  return (
    <DashboardLayout
      title="CGPA Verification"
      subtitle="Compare student-entered CGPA against official records before running allocation"
    >
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated p-5 sm:p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={18} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Integrity check
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Upload official CGPA sheets via CSV, then run verification here. Flagged students are
            excluded from allocation until resolved by the department mentor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>Verified students join allocation</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>Flagged students sent to mentors</span>
          </div>
        </div>
      </motion.div>

      {/* Filters + action */}
      <div className="glass-card-elevated p-4 sm:p-5 mb-6 flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Semester slot
            </label>
            <select
              value={semesterSlot}
              onChange={(e) => setSemesterSlot(e.target.value)}
              className="input-field text-sm"
              disabled={isVerifying}
            >
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="input-field text-sm"
              disabled={isVerifying}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="btn-primary flex items-center gap-2 text-sm px-5"
          >
            <Play size={16} />
            {isVerifying ? "Verifying…" : "Verify CGPA"}
          </button>
          {!isVerifying && (
            <button
              onClick={loadFlags}
              className="btn-secondary text-sm px-4"
            >
              Refresh Flags
            </button>
          )}
        </div>
      </div>

      {/* Official CSV data stored in MongoDB */}
      {officialSummary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-muted/50 border border-border/50"
        >
          <h4 className="text-xs font-semibold text-foreground mb-2">Official CGPA data in MongoDB (from your CSV uploads)</h4>
          <div className="flex flex-wrap gap-3">
            {officialSummary.map((s) => (
              <span key={`${s.department}-${s.semesterSlot}`} className="badge-primary text-xs">
                {s.department} · {s.semesterSlot}: {s.count} records
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Progress + summary */}
      {isVerifying && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-elevated p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Verifying student records…
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-primary via-secondary to-emerald-500"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Matching submitted preferences with official CGPA sheet and flagging mismatches.
          </p>
        </motion.div>
      )}

      {summary && !isVerifying && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          <div className="glass-card-elevated p-3">
            <p className="text-[11px] text-muted-foreground mb-1">Total Checked</p>
            <p className="text-lg font-bold text-foreground">{summary.totalChecked}</p>
          </div>
          <div className="glass-card-elevated p-3">
            <p className="text-[11px] text-muted-foreground mb-1">Matched</p>
            <p className="text-lg font-bold text-emerald-600">{summary.matched}</p>
          </div>
          <div className="glass-card-elevated p-3">
            <p className="text-[11px] text-muted-foreground mb-1">Flagged</p>
            <p className="text-lg font-bold text-amber-600">{summary.flagged}</p>
          </div>
          <div className="glass-card-elevated p-3">
            <p className="text-[11px] text-muted-foreground mb-1">Missing official</p>
            <p className="text-lg font-bold text-muted-foreground">{summary.missingOfficial}</p>
          </div>
        </motion.div>
      )}

      {/* All students for this scope */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated overflow-hidden mb-6"
      >
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-foreground">
              Students in this batch ({students.length})
            </h3>
            <p className="text-[11px] text-muted-foreground">
              All students from {department} with submitted preferences for {semesterSlot}. Flagged
              students are excluded from allocation until cleared.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Roll No
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Semester
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CGPA
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const isFlagged = flags.some((f) => f.rollNumber === s.rollNumber);
                return (
                  <tr
                    key={s.id}
                    className="border-t border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3">
                      <span className="badge-primary text-[10px]">{s.rollNumber}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 font-semibold text-foreground">
                      {s.name}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-muted-foreground">
                      {s.semester}
                    </td>
                    <td className="px-3 sm:px-4 py-3 font-semibold text-foreground">
                      {s.cgpa.toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      {isFlagged ? (
                        <span className="badge-warning text-[10px]">Flagged</span>
                      ) : (
                        <span className="badge-success text-[10px]">Verified / Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground text-xs"
                  >
                    No submitted students for this department and semester yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Flagged students table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-foreground">
              Flagged students ({flags.length})
            </h3>
            <p className="text-[11px] text-muted-foreground">
              These students&apos; CGPA does not match the official record or is missing, and they
              are excluded from allocation.
            </p>
          </div>
          <AlertTriangle size={18} className="text-amber-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Roll No
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sem
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Entered CGPA
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Official CGPA
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Batch
                </th>
                <th className="px-3 sm:px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr
                  key={f.id}
                  className="border-t border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3 sm:px-4 py-3">
                    <span className="badge-primary text-[10px]">{f.rollNumber}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-semibold text-foreground">{f.name}</td>
                  <td className="px-3 sm:px-4 py-3 text-muted-foreground">
                    {f.semesterSlot}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-amber-700 font-semibold">
                    {f.cgpaEntered.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-emerald-700 font-semibold">
                    {f.cgpaOfficial.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-muted-foreground text-[11px]">
                    {f.sourceBatch === "NO_OFFICIAL_CGPA" ? "No official CGPA" : f.sourceBatch}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-right">
                    <button
                      onClick={() => handleForward(f.id)}
                      disabled={forwardingId === f.id}
                      className="btn-secondary text-[11px] px-3 py-1.5"
                    >
                      {forwardingId === f.id ? "Forwarding…" : "Forward to mentor"}
                    </button>
                  </td>
                </tr>
              ))}
              {flags.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground text-xs"
                  >
                    No flagged students for this department and semester. You&apos;re all set to
                    run allocation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminCgpaVerification;

