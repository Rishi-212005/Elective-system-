import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { getAdminStudents } from "@/api/admin";

const AdminStudents = () => {
  const [branch, setBranch] = useState("All");
  const [semester, setSemester] = useState("All");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | "allocated" | "unallocated" | "pending">("All");
  const [round, setRound] = useState<"All" | "1" | "2" | "3" | "4">("All");
  const [visibleCount, setVisibleCount] = useState(10);
  const [students, setStudents] = useState<
    {
      id: string;
      rollNumber: string;
      name: string;
      department: string;
      semester: number;
      cgpa: number;
      backlogs: number;
      preferences: string[];
      allocatedElective: string | null;
      allocatedElectiveCode: string | null;
      roundAllocated: number | null;
      allocationStatus: "allocated" | "unallocated" | "pending";
    }[]
  >([]);

  useEffect(() => {
    getAdminStudents()
      .then(setStudents)
      .catch(() => setStudents([]));
  }, []);

  const branches = useMemo(
    () => ["All", ...Array.from(new Set(students.map((s) => s.department)))],
    [students]
  );
  const semesters = useMemo(
    () => ["All", ...Array.from(new Set(students.map((s) => String(s.semester))))],
    [students]
  );

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (branch !== "All" && s.department !== branch) return false;
      if (semester !== "All" && String(s.semester) !== semester) return false;
      if (status !== "All" && s.allocationStatus !== status) return false;
      if (round !== "All" && String(s.roundAllocated ?? "") !== round) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.rollNumber.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [students, branch, semester, status, round, search]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <DashboardLayout title="Student Management" subtitle="View all students who applied for electives">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number..." className="input-field pl-9 w-full" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="input-field pl-8 pr-8 appearance-none cursor-pointer text-sm min-w-[140px]">
              {branches.map((b) => <option key={b} value={b}>{b === "All" ? "All Branches" : b}</option>)}
            </select>
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="input-field pl-8 pr-8 appearance-none cursor-pointer text-sm min-w-[130px]">
              {semesters.map((s) => <option key={s} value={s}>{s === "All" ? "All Semesters" : `Sem ${s}`}</option>)}
            </select>
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="input-field pl-8 pr-8 appearance-none cursor-pointer text-sm min-w-[150px]">
              <option value="All">All Statuses</option>
              <option value="allocated">Allocated</option>
              <option value="unallocated">Not Allocated</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select value={round} onChange={(e) => setRound(e.target.value as any)} className="input-field pl-8 pr-8 appearance-none cursor-pointer text-sm min-w-[130px]">
              <option value="All">All Rounds</option>
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
              <option value="3">Round 3</option>
              <option value="4">Round 4</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">{filtered.length} students found</span>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Roll No</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Branch</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Sem</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">CGPA</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Backlogs</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Round</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Preferences</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Allocated</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-3 sm:px-5 py-3"><span className="badge-primary text-[10px]">{s.rollNumber}</span></td>
                  <td className="px-3 sm:px-5 py-3 font-semibold text-foreground">{s.name}</td>
                  <td className="px-3 sm:px-5 py-3 text-muted-foreground hidden sm:table-cell">{s.department}</td>
                  <td className="px-3 sm:px-5 py-3 text-muted-foreground">{s.semester}</td>
                  <td className="px-3 sm:px-5 py-3"><span className="font-semibold text-foreground">{s.cgpa}</span></td>
                  <td className="px-3 sm:px-5 py-3 text-muted-foreground">{s.backlogs}</td>
                  <td className="px-3 sm:px-5 py-3 text-muted-foreground hidden sm:table-cell">
                    {s.roundAllocated ? <span className="badge-secondary text-[10px]">Round {s.roundAllocated}</span> : "—"}
                  </td>
                  <td className="px-3 sm:px-5 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {s.preferences.map((p, i) => (
                        <span key={i} className="badge-secondary text-[9px]">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 sm:px-5 py-3">
                    {s.allocationStatus === "allocated" && s.allocatedElective ? (
                      <span className="badge-success text-[10px]">{s.allocatedElective}</span>
                    ) : s.allocationStatus === "unallocated" ? (
                      <span className="badge-warning text-[10px]">Not Allocated</span>
                    ) : (
                      <span className="badge-secondary text-[10px]">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No students match filters.</div>
        )}
        {filtered.length > visibleCount && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => setVisibleCount((c) => Math.min(c + 10, filtered.length))}
              className="btn-secondary text-xs"
            >
              Show more ({visibleCount}/{filtered.length})
            </button>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminStudents;
