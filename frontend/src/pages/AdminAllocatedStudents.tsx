import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { getAdminStudents, getAdminElectives } from "@/api/admin";

const AdminAllocatedStudents = () => {
  const [branch, setBranch] = useState("All");
  const [semester, setSemester] = useState("All");
  const [search, setSearch] = useState("");
  const [round, setRound] = useState<"All" | "1" | "2" | "3" | "4">("All");
  const [electiveCode, setElectiveCode] = useState("All");
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
  const [electives, setElectives] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    getAdminStudents()
      .then((rows) => setStudents(rows.filter((s) => s.allocationStatus === "allocated")))
      .catch(() => setStudents([]));

    getAdminElectives()
      .then((els) => setElectives(els.map((e) => ({ code: e.code, name: e.name }))))
      .catch(() => setElectives([]));
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
      if (round !== "All" && String(s.roundAllocated ?? "") !== round) return false;
      if (electiveCode !== "All" && s.allocatedElectiveCode !== electiveCode) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.rollNumber.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [students, branch, semester, round, electiveCode, search]);

  return (
    <DashboardLayout title="Allocated Students" subtitle="View allocated students by round and elective">
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
            <select value={round} onChange={(e) => setRound(e.target.value as any)} className="input-field pl-8 pr-8 appearance-none cursor-pointer text-sm min-w-[130px]">
              <option value="All">All Rounds</option>
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
              <option value="3">Round 3</option>
              <option value="4">Round 4</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select value={electiveCode} onChange={(e) => setElectiveCode(e.target.value)} className="input-field pl-8 pr-8 appearance-none cursor-pointer text-sm min-w-[150px]">
              <option value="All">All Electives</option>
              {electives.map((e) => (
                <option key={e.code} value={e.code}>{e.code} · {e.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">{filtered.length} allocated students</span>
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
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Backlogs</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Round</th>
                <th className="text-left px-3 sm:px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Elective</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-3 sm:px-5 py-3"><span className="badge-primary text-[10px]">{s.rollNumber}</span></td>
                  <td className="px-3 sm:px-5 py-3 font-semibold text-foreground">{s.name}</td>
                  <td className="px-3 sm:px-5 py-3 text-muted-foreground hidden sm:table-cell">{s.department}</td>
                  <td className="px-3 sm:px-5 py-3 text-muted-foreground">{s.semester}</td>
                  <td className="px-3 sm:px-5 py-3 font-semibold text-foreground">{s.cgpa.toFixed(2)}</td>
                  <td className="px-3 sm:px-5 py-3 text-muted-foreground hidden sm:table-cell">{s.backlogs}</td>
                  <td className="px-3 sm:px-5 py-3">
                    {s.roundAllocated ? <span className="badge-secondary text-[10px]">Round {s.roundAllocated}</span> : "—"}
                  </td>
                  <td className="px-3 sm:px-5 py-3">
                    <span className="badge-success text-[10px]">
                      {s.allocatedElectiveCode ? `${s.allocatedElectiveCode} · ` : ""}{s.allocatedElective}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No allocated students match filters.</div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminAllocatedStudents;

