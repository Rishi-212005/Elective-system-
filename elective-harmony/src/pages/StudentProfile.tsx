import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Save, Upload, Plus, Trash2, FileText, CreditCard, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getStudentProfile, updateStudentProfile } from "@/api/student";

const degrees = ["B.Tech", "M.Tech", "B.E.", "M.E.", "BCA", "MCA", "B.Sc", "M.Sc"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const branches = [
  "Computer Science", "Electronics", "Mechanical", "Civil",
  "Electrical", "Information Technology", "Chemical", "Biotechnology",
];
const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

interface CgpaEntry {
  id: string;
  cgpa: string;
  semester: string;
  year: string;
  document: File | null;
  documentName: string;
}

const StudentProfile = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    rollNumber: "",
    email: "",
    degree: "B.Tech",
    year: "3rd Year",
    branch: "Computer Science",
    semester: "6",
    backlogs: "0",
  });

  const [cgpaEntries, setCgpaEntries] = useState<CgpaEntry[]>([
    { id: "1", cgpa: "", semester: "6", year: "3rd Year", document: null, documentName: "" },
  ]);
  useEffect(() => {
    getStudentProfile()
      .then((res) => {
        setProfile((prev) => ({
          ...prev,
          name: res.name,
          rollNumber: res.username,
          email: (res as any).email || prev.email,
          degree: res.profile.degree || prev.degree,
          year: res.profile.year || prev.year,
          branch: res.profile.department,
          semester: String(res.profile.semester),
          backlogs: String((res.profile as any).backlogs ?? "0"),
        }));
        setCgpaEntries((prev) => {
          const first = prev[0] || { id: "1", cgpa: "", semester: "6", year: "3rd Year", document: null, documentName: "" };
          return [{ ...first, cgpa: String(res.profile.cgpa), semester: String(res.profile.semester), year: res.profile.year || first.year }];
        });
      })
      .catch(() => {});
  }, []);

  const [idCard, setIdCard] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);

  const updateProfile = (field: string, value: string) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const addCgpaEntry = () => {
    setCgpaEntries((prev) => [
      ...prev,
      { id: Date.now().toString(), cgpa: "", semester: "", year: "", document: null, documentName: "" },
    ]);
  };

  const updateCgpaEntry = (id: string, field: string, value: string) => {
    setCgpaEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleCgpaDoc = (id: string, file: File | null) => {
    setCgpaEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, document: file, documentName: file?.name || "" } : e
      )
    );
  };

  const removeCgpaEntry = (id: string) => {
    setCgpaEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleIdCard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCard(file);
      const reader = new FileReader();
      reader.onload = () => setIdCardPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const cgpaNum = Number(cgpaEntries[0]?.cgpa);
    if (Number.isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      toast.error("Enter a valid CGPA (0.0 to 10.0)");
      return;
    }
    try {
      const payload: {
        name: string;
        email?: string;
        department: string;
        semester: number;
        cgpa: number;
        backlogs?: number;
        degree?: string;
        year?: string;
      } = {
        name: profile.name,
        department: profile.branch,
        semester: Number(profile.semester),
        cgpa: cgpaNum,
        backlogs: Math.max(0, Number(profile.backlogs) || 0),
        degree: profile.degree,
        year: profile.year,
      };
      if (profile.email.trim()) {
        payload.email = profile.email.trim();
      }
      await updateStudentProfile(payload);
      toast.success("Profile saved successfully! 🎉 You can now submit your preferences.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save profile");
    }
  };

  const selectClass =
    "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none";

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your personal details">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Personal Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-elevated p-5 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <User size={18} className="text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-foreground">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile("name", e.target.value)}
                className="input-field w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Roll Number</label>
                <input
                  type="text"
                  value={profile.rollNumber}
                  disabled
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">College Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateProfile("email", e.target.value)}
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Degree</label>
                <select value={profile.degree} onChange={(e) => updateProfile("degree", e.target.value)} className={selectClass}>
                  {degrees.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Year</label>
                <select value={profile.year} onChange={(e) => updateProfile("year", e.target.value)} className={selectClass}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Branch</label>
                <select value={profile.branch} onChange={(e) => updateProfile("branch", e.target.value)} className={selectClass}>
                  {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Semester</label>
                <select value={profile.semester} onChange={(e) => updateProfile("semester", e.target.value)} className={selectClass}>
                  {semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Backlogs</label>
                <input
                  type="number"
                  min={0}
                  value={profile.backlogs}
                  onChange={(e) => updateProfile("backlogs", e.target.value)}
                  className="input-field w-full"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* CGPA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-elevated p-5 sm:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                <GraduationCap size={18} className="text-secondary" />
              </div>
              <h2 className="font-display font-bold text-foreground">CGPA Records</h2>
            </div>
            <button
              onClick={addCgpaEntry}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Plus size={14} /> Add CGPA
            </button>
          </div>

          <div className="space-y-4">
            {cgpaEntries.map((entry, i) => (
              <div key={entry.id} className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">CGPA Entry #{i + 1}</span>
                  {cgpaEntries.length > 1 && (
                    <button
                      onClick={() => removeCgpaEntry(entry.id)}
                      className="text-destructive/60 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">CGPA (0-10)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={entry.cgpa}
                      onChange={(e) => updateCgpaEntry(entry.id, "cgpa", e.target.value)}
                      className="input-field w-full"
                      placeholder="9.2"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Semester</label>
                    <select
                      value={entry.semester}
                      onChange={(e) => updateCgpaEntry(entry.id, "semester", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Sem</option>
                      {semesters.map((s) => <option key={s} value={s}>Sem {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Year</label>
                    <select
                      value={entry.year}
                      onChange={(e) => updateCgpaEntry(entry.id, "year", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Year</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CGPA Document (Marksheet)</label>
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground">
                    <Upload size={14} />
                    {entry.documentName || "Upload marksheet PDF/image"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleCgpaDoc(entry.id, e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-elevated p-5 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center">
              <CreditCard size={18} className="text-info" />
            </div>
            <h2 className="font-display font-bold text-foreground">Student ID Card</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            {idCardPreview ? (
              <img src={idCardPreview} alt="ID Card" className="w-48 h-auto rounded-xl border border-border object-cover" />
            ) : (
              <div className="w-48 h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
                <CreditCard size={24} className="text-muted-foreground/40" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-3">Upload a clear photo of your student ID card (front side).</p>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground">
                <Upload size={14} />
                {idCard ? idCard.name : "Choose file"}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleIdCard}
                />
              </label>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button onClick={handleSave} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save size={16} /> Save Profile
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
