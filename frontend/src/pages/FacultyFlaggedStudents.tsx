import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { getFacultyCgpaFlags, resolveFacultyCgpaFlag } from "@/api/faculty";
import { toast } from "sonner";

type FacultyFlagRow = Awaited<ReturnType<typeof getFacultyCgpaFlags>>[number];

const FacultyFlaggedStudents = () => {
  const [rows, setRows] = useState<FacultyFlagRow[]>([]);
  const [search, setSearch] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = () => {
    getFacultyCgpaFlags()
      .then(setRows)
      .catch(() => setRows([]));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.rollNumber.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q)
    );
  });

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await resolveFacultyCgpaFlag(id, "Reviewed by department mentor");
      toast.success("Flag marked as resolved");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to resolve flag");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <DashboardLayout
      title="Flagged Students"
      subtitle="Students whose CGPA does not match the official record"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="text-amber-500" size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Review flagged students before allocation is final
            </p>
            <p className="text-xs text-muted-foreground">
              Confirm genuine mistakes and mark them resolved, or coordinate with the admin team.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
          <CheckCircle2 size={14} />
          <span>Resolved students can be re-included in future allocations.</span>
        </div>
      </motion.div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or roll number..."
            className="input-field pl-9 w-full"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {rows.length} total flags
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated overflow-hidden"
      >
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
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3 sm:px-4 py-3">
                    <span className="badge-primary text-[10px]">{r.rollNumber}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 font-semibold text-foreground">
                    {r.name}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-muted-foreground">
                    {r.semesterSlot}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-amber-700 font-semibold">
                    {r.cgpaEntered.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-emerald-700 font-semibold">
                    {r.cgpaOfficial.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-muted-foreground text-[11px]">
                    {r.sourceBatch}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-right">
                    <button
                      onClick={() => handleResolve(r.id)}
                      disabled={resolvingId === r.id}
                      className="btn-secondary text-[11px] px-3 py-1.5"
                    >
                      {resolvingId === r.id ? "Saving…" : "Mark resolved"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground text-xs"
                  >
                    No flagged students at the moment.
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

export default FacultyFlaggedStudents;

