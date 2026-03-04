import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { BookOpen, Users, GraduationCap, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { getFacultyStats, getFacultyStudents } from "@/api/faculty";
import type { AdminStudentRow } from "@/api/admin";
import { toast } from "sonner";

const FacultyDashboard = () => {
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [stats, setStats] = useState<{ totalStudents: number; allocated: number; unallocated: number; department: string } | null>(null);

  useEffect(() => {
    getFacultyStats()
      .then((s) => setStats(s))
      .catch(() => setStats(null));

    getFacultyStudents()
      .then((rows) => setStudents(rows))
      .catch(() => setStudents([]));
  }, []);

  const fillPct = useMemo(() => {
    if (!stats || stats.totalStudents === 0) return 0;
    return Math.round(((stats.allocated ?? 0) / stats.totalStudents) * 100);
  }, [stats]);

  const electiveChartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of students) {
      if (!s.allocatedElectiveCode) continue;
      counts.set(s.allocatedElectiveCode, (counts.get(s.allocatedElectiveCode) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([code, count]) => ({ code, count }));
  }, [students]);

  const allocationSplitData = useMemo(() => {
    const total = stats?.totalStudents ?? 0;
    const allocated = stats?.allocated ?? 0;
    const unallocated = Math.max(total - allocated, 0);
    return [
      { name: "Allocated", value: allocated },
      { name: "Pending", value: unallocated },
    ];
  }, [stats]);

  const pieColors = ["#22c55e", "#e5e7eb"];

  return (
    <DashboardLayout title="Faculty Dashboard" subtitle="View your department allocations and students">
      {/* Hero / overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl gradient-primary p-5 sm:p-8 mb-6 sm:mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/5 to-transparent" />
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-primary-foreground/5 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <BookOpen size={16} className="text-primary-foreground/60" />
            <span className="text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider">
              Department Mentor Overview
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-primary-foreground mb-1 sm:mb-2">
            {stats?.department || "Your Department"} Open Electives
          </h2>
          <p className="text-primary-foreground/50 text-xs sm:text-sm mb-4 sm:mb-6">
            Monitor how many students from your department have been allocated and quickly review their details.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <StatCard
          title="Total Students (Dept)"
          value={stats?.totalStudents ?? 0}
          icon={<Users size={20} />}
          delay={0.1}
        />
        <StatCard
          title="Allocated"
          value={stats?.allocated ?? 0}
          icon={<TrendingUp size={20} />}
          delay={0.2}
        />
        <StatCard
          title="Allocation Rate"
          value={`${fillPct}%`}
          icon={<GraduationCap size={20} />}
          trend={fillPct >= 80 ? "Great coverage" : "In progress"}
          delay={0.3}
        />
      </div>

      {/* Charts section */}
      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Bar chart: students per elective */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card-elevated p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-foreground text-sm sm:text-base">
                Students per Elective
              </h3>
              <p className="text-xs text-muted-foreground">
                How many department students are allocated in each elective.
              </p>
            </div>
          </div>
          <div className="h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={electiveChartData}>
                <XAxis dataKey="code" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie chart: allocated vs pending */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-elevated p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-foreground text-sm sm:text-base">
                Allocation Breakdown
              </h3>
              <p className="text-xs text-muted-foreground">
                Share of students already allocated vs still pending.
              </p>
            </div>
          </div>
          <div className="h-60 sm:h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationSplitData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {allocationSplitData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
