import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, BookOpen, TrendingUp, CheckCircle, BarChart3, Activity, Eye, Shield, Play, Pause } from "lucide-react";
import { getAdminStudents, getAdminElectives, getAdminStats, type AdminStudentRow, type AdminElective } from "@/api/admin";

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

type SimRound = { round: number; allocated: number; description: string };

type FairnessRow = {
  range: string;
  students: number;
  gotFirst: number;
  gotSecond: number;
  gotThird: number;
  unallocated: number;
  satisfaction: number;
};

type ElectiveDemandRow = { name: string; fullName: string; requests: number };
type SeatUtilRow = { name: string; fullName: string; filled: number; total: number; percentage: number };

function getBandIndex(cgpa: number) {
  if (cgpa >= 9) return 0;
  if (cgpa >= 8) return 1;
  if (cgpa >= 7) return 2;
  return 3;
}

function simulateAllocation(
  students: AdminStudentRow[],
  electives: AdminElective[],
  seatLimit: number
): {
  rounds: SimRound[];
  cumulativeByRound: { name: string; allocated: number; unallocated: number }[];
  fairness: FairnessRow[];
  seatUtilization: SeatUtilRow[];
} {
  if (!students.length || !electives.length || seatLimit <= 0) {
    return { rounds: [], cumulativeByRound: [], fairness: [], seatUtilization: [] };
  }

  const capacity = new Map<string, number>();
  electives.forEach((e) => capacity.set(e.code, seatLimit));

  const sorted = [...students].sort((a, b) => {
    if (b.cgpa !== a.cgpa) return b.cgpa - a.cgpa;
    if (a.backlogs !== b.backlogs) return a.backlogs - b.backlogs;
    const nameCmp = a.name.localeCompare(b.name);
    if (nameCmp !== 0) return nameCmp;
    return a.rollNumber.localeCompare(b.rollNumber);
  });

  const bandCounts = [
    { label: "CGPA 9.0 - 10.0", allocated: 0, unallocated: 0 },
    { label: "CGPA 8.0 - 8.9", allocated: 0, unallocated: 0 },
    { label: "CGPA 7.0 - 7.9", allocated: 0, unallocated: 0 },
    { label: "CGPA < 7.0", allocated: 0, unallocated: 0 },
  ];

  const fairnessBuckets: FairnessRow[] = [
    { range: "9.0-10.0", students: 0, gotFirst: 0, gotSecond: 0, gotThird: 0, unallocated: 0, satisfaction: 0 },
    { range: "8.0-8.9", students: 0, gotFirst: 0, gotSecond: 0, gotThird: 0, unallocated: 0, satisfaction: 0 },
    { range: "7.0-7.9", students: 0, gotFirst: 0, gotSecond: 0, gotThird: 0, unallocated: 0, satisfaction: 0 },
    { range: "< 7.0", students: 0, gotFirst: 0, gotSecond: 0, gotThird: 0, unallocated: 0, satisfaction: 0 },
  ];

  const allocatedByElective = new Map<string, number>();

  sorted.forEach((s) => {
    const bandIdx = getBandIndex(s.cgpa);
    fairnessBuckets[bandIdx].students += 1;

    let assigned: string | null = null;

    for (const pref of s.preferences) {
      const cap = capacity.get(pref) ?? 0;
      if (cap <= 0) continue;
      capacity.set(pref, cap - 1);
      assigned = pref;
      allocatedByElective.set(pref, (allocatedByElective.get(pref) ?? 0) + 1);
      break;
    }

    if (assigned) {
      bandCounts[bandIdx].allocated += 1;
      const idx = s.preferences.indexOf(assigned);
      if (idx === 0) fairnessBuckets[bandIdx].gotFirst += 1;
      else if (idx === 1) fairnessBuckets[bandIdx].gotSecond += 1;
      else if (idx === 2) fairnessBuckets[bandIdx].gotThird += 1;
    } else {
      bandCounts[bandIdx].unallocated += 1;
      fairnessBuckets[bandIdx].unallocated += 1;
    }
  });

  fairnessBuckets.forEach((b) => {
    const satisfied = b.gotFirst + b.gotSecond + b.gotThird;
    b.satisfaction = b.students ? Math.round((satisfied / b.students) * 100) : 0;
  });

  const rounds: SimRound[] = bandCounts.map((b, i) => ({
    round: i + 1,
    allocated: b.allocated,
    description: b.label,
  }));

  const totalStudents = students.length;
  const cumulativeByRound: { name: string; allocated: number; unallocated: number }[] = [];
  let runningAllocated = 0;
  bandCounts.forEach((b, i) => {
    runningAllocated += b.allocated;
    cumulativeByRound.push({
      name: `R${i + 1}`,
      allocated: runningAllocated,
      unallocated: Math.max(totalStudents - runningAllocated, 0),
    });
  });

  const seatUtilization: SeatUtilRow[] = electives.map((e) => {
    const filled = allocatedByElective.get(e.code) ?? 0;
    return {
      name: e.code,
      fullName: e.name,
      filled,
      total: seatLimit,
      percentage: seatLimit ? Math.round((filled / seatLimit) * 100) : 0,
    };
  });

  return { rounds, cumulativeByRound, fairness: fairnessBuckets, seatUtilization };
}

const trendData = [
  { day: "Day 1", selections: 12 },
  { day: "Day 2", selections: 35 },
  { day: "Day 3", selections: 58 },
  { day: "Day 4", selections: 72 },
  { day: "Day 5", selections: 89 },
  { day: "Day 6", selections: 95 },
  { day: "Day 7", selections: 100 },
];

const AnalyticsDashboard = () => {
  const [seatLimit, setSeatLimit] = useState(70);
  const [activeRound, setActiveRound] = useState(-1);
  const [simulating, setSimulating] = useState(false);
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [electives, setElectives] = useState<AdminElective[]>([]);
  const [stats, setStats] = useState<{ totalStudents: number; totalElectives: number; allocated: number; unallocated: number }>({
    totalStudents: 0,
    totalElectives: 0,
    allocated: 0,
    unallocated: 0,
  });

  const [rounds, setRounds] = useState<SimRound[]>([]);
  const [cumulativeByRound, setCumulativeByRound] = useState<{ name: string; allocated: number; unallocated: number }[]>([]);
  const [fairnessData, setFairnessData] = useState<FairnessRow[]>([]);
  const [seatUtilization, setSeatUtilization] = useState<SeatUtilRow[]>([]);

  const [comparisonData, setComparisonData] = useState<any[]>([]);

  useEffect(() => {
    getAdminStudents()
      .then(setStudents)
      .catch(() => setStudents([]));

    getAdminElectives()
      .then(setElectives)
      .catch(() => setElectives([]));

    getAdminStats()
      .then((s) => setStats({ totalStudents: s.totalStudents, totalElectives: s.totalElectives, allocated: s.allocated, unallocated: s.unallocated }))
      .catch(() => setStats({ totalStudents: 0, totalElectives: 0, allocated: 0, unallocated: 0 }));
  }, []);

  useEffect(() => {
    if (!students.length || !electives.length) {
      setRounds([]);
      setCumulativeByRound([]);
      setFairnessData([]);
      setSeatUtilization([]);
      setComparisonData([]);
      return;
    }

    const base = simulateAllocation(students, electives, seatLimit);
    setRounds(base.rounds);
    setCumulativeByRound(base.cumulativeByRound);
    setFairnessData(base.fairness);
    setSeatUtilization(base.seatUtilization);

    const limits = [50, 70, 90, 100, 120];
    const comp: any[] = [];
    const maxRounds = 4;
    for (let r = 0; r < maxRounds; r++) {
      const row: Record<string, string | number> = { round: `Round ${r + 1}` };
      limits.forEach((limit) => {
        const sim = simulateAllocation(students, electives, limit);
        row[`${limit} seats`] = sim.rounds[r]?.allocated ?? 0;
      });
      comp.push(row);
    }
    setComparisonData(comp);
  }, [students, electives, seatLimit]);

  const startSimulation = () => {
    if (!rounds.length) return;
    setSimulating(true);
    setActiveRound(0);
    let round = 0;
    const interval = setInterval(() => {
      round++;
      if (round >= rounds.length) {
        clearInterval(interval);
        setSimulating(false);
        return;
      }
      setActiveRound(round);
    }, 1200);
  };

  return (
    <DashboardLayout title="Analytics Dashboard" subtitle="Comprehensive allocation insights">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        <StatCard title="Total Students" value={stats.totalStudents} icon={<Users size={20} />} delay={0} />
        <StatCard title="Total Electives" value={stats.totalElectives} icon={<BookOpen size={20} />} delay={0.1} />
        <StatCard
          title="Allocation Rate"
          value={`${stats.totalStudents ? Math.round((stats.allocated / stats.totalStudents) * 100) : 0}%`}
          icon={<TrendingUp size={20} />}
          delay={0.2}
          gradient
        />
        <StatCard title="Avg Satisfaction" value="87%" icon={<CheckCircle size={20} />} description="Based on preference match" delay={0.3} />
      </div>

      {/* Allocation Round Visualization */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card-elevated p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-primary" />
            <h3 className="font-display font-bold text-foreground text-sm sm:text-base">Allocation Round Visualization</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Seat Limit / Elective:</label>
              <input
                type="number"
                value={seatLimit}
                onChange={(e) => {
                  const v = Math.max(10, Number(e.target.value));
                  setSeatLimit(v);
                  setActiveRound(-1);
                }}
                className="input-field w-20 text-center text-sm"
                min={10}
                step={10}
              />
            </div>
            <div className="flex gap-1.5">
              {[50, 70, 90, 100, 120].map((v) => (
                <button
                  key={v}
                  onClick={() => { setSeatLimit(v); setActiveRound(-1); }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    seatLimit === v ? "gradient-primary text-primary-foreground shadow-glow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={startSimulation}
              disabled={simulating}
              className="btn-primary flex items-center gap-2 text-xs disabled:opacity-50"
            >
              {simulating ? <><Pause size={14} /> Simulating...</> : <><Play size={14} /> Run Simulation</>}
            </button>
          </div>
        </div>

        {/* Round cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {rounds.map((round, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.4, scale: 0.95 }}
              animate={{
                opacity: i <= activeRound ? 1 : 0.4,
                scale: i === activeRound ? 1.03 : 0.95,
                borderColor: i === activeRound ? "hsl(221,83%,53%)" : "hsl(220,13%,91%)",
              }}
              transition={{ duration: 0.4 }}
              className={`p-3 sm:p-4 rounded-xl border-2 text-center ${i <= activeRound ? "bg-primary/5" : "bg-muted/30"}`}
            >
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Round {round.round}</p>
              <p className="text-xl sm:text-2xl font-display font-extrabold text-foreground">{round.allocated}</p>
              <p className="text-[10px] text-muted-foreground">allocated</p>
              {i <= activeRound && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-primary font-medium mt-2 leading-tight">
                  {round.description}
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Allocation progress bar chart */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3">Cumulative Allocation (Limit: {seatLimit})</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cumulativeByRound}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} />
                <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220,13%,91%)", fontSize: 12 }} />
                <Bar dataKey="allocated" name="Allocated" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="unallocated" name="Remaining" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3">Comparison Across Seat Limits</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="round" tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220,9%,46%)" }} />
                <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220,13%,91%)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="50 seats" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="70 seats" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="90 seats" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="100 seats" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="120 seats" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Fairness Analytics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card-elevated p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} className="text-secondary" />
          <h3 className="font-display font-bold text-foreground text-sm sm:text-base">Fairness Analytics by CGPA Range</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left px-3 sm:px-4 py-2.5 font-semibold text-xs uppercase text-muted-foreground">CGPA Range</th>
                <th className="text-center px-3 sm:px-4 py-2.5 font-semibold text-xs uppercase text-muted-foreground">Students</th>
                <th className="text-center px-3 sm:px-4 py-2.5 font-semibold text-xs uppercase text-muted-foreground">1st Pref</th>
                <th className="text-center px-3 sm:px-4 py-2.5 font-semibold text-xs uppercase text-muted-foreground">2nd Pref</th>
                <th className="text-center px-3 sm:px-4 py-2.5 font-semibold text-xs uppercase text-muted-foreground">3rd Pref</th>
                <th className="text-center px-3 sm:px-4 py-2.5 font-semibold text-xs uppercase text-muted-foreground hidden sm:table-cell">Unalloc.</th>
                <th className="text-center px-3 sm:px-4 py-2.5 font-semibold text-xs uppercase text-muted-foreground">Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {fairnessData.map((row, i) => (
                <tr key={i} className="border-t border-border/30">
                  <td className="px-3 sm:px-4 py-3 font-semibold text-foreground">{row.range}</td>
                  <td className="px-3 sm:px-4 py-3 text-center">{row.students}</td>
                  <td className="px-3 sm:px-4 py-3 text-center"><span className="badge-success text-[10px]">{row.gotFirst}</span></td>
                  <td className="px-3 sm:px-4 py-3 text-center"><span className="badge-primary text-[10px]">{row.gotSecond}</span></td>
                  <td className="px-3 sm:px-4 py-3 text-center"><span className="badge-warning text-[10px]">{row.gotThird}</span></td>
                  <td className="px-3 sm:px-4 py-3 text-center hidden sm:table-cell">{row.unallocated > 0 ? <span className="text-destructive font-bold">{row.unallocated}</span> : "—"}</td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 sm:w-16 progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${row.satisfaction}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{row.satisfaction}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-5 sm:gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card-elevated p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="font-display font-bold text-foreground text-sm sm:text-base">Elective Demand</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={useMemo(
                () =>
                  electives.map((e) => ({
                    name: e.code,
                    fullName: e.name,
                    requests: e.requestedCount ?? 0,
                  })),
                [electives]
              )}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
              <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid hsl(220,13%,91%)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Bar dataKey="requests" radius={[8, 8, 0, 0]}>
                {electives.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card-elevated p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Activity size={18} className="text-info" />
            <h3 className="font-display font-bold text-foreground text-sm sm:text-base">Selection Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
              <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid hsl(220,13%,91%)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221,83%,53%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(221,83%,53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="selections" stroke="hsl(221,83%,53%)" strokeWidth={2.5} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-5 sm:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card-elevated p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <TrendingUp size={18} className="text-secondary" />
            <h3 className="font-display font-bold text-foreground text-sm sm:text-base">Seat Utilization</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={seatUtilization} dataKey="filled" nameKey="fullName" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={3} label={({ percentage }) => `${percentage}%`}>
                {seatUtilization.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card-elevated p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Users size={18} className="text-success" />
            <h3 className="font-display font-bold text-foreground text-sm sm:text-base">CGPA Distribution of Allocated Students</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={fairnessData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
              <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid hsl(220,13%,91%)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Bar dataKey="gotFirst" name="1st Pref" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="gotSecond" name="2nd Pref" stackId="a" fill="#3b82f6" />
              <Bar dataKey="gotThird" name="3rd Pref" stackId="a" fill="#f59e0b" />
              <Bar dataKey="unallocated" name="Unallocated" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;
