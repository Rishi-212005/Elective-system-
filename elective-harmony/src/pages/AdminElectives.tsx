import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit, X, BookOpen, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import type { Elective } from "@/data/mockData";
import { toast } from "sonner";
import { createAdminElective, deleteAdminElective, getAdminElectives, updateAdminElective } from "@/api/admin";

const AdminElectives = () => {
  const [electivesList, setElectivesList] = useState<Elective[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [form, setForm] = useState({
    code: "", name: "", faculty: "", department: "", totalSeats: 70, description: "", semester: "3-1",
  });

  useEffect(() => {
    getAdminElectives()
      .then((els) =>
        setElectivesList(
          els.map((e) => ({
            id: e.legacyId,
            code: e.code,
            name: e.name,
            faculty: e.facultyName || "",
            department: e.department || "",
            totalSeats: e.seatLimit,
            remainingSeats: e.seatLimit,
            description: "",
            semester: e.semester || "3-1",
          }))
        )
      )
      .catch(() => setElectivesList([]));
  }, []);

  const filtered = electivesList.filter(
    (e) =>
      (e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())) &&
      (semesterFilter === "" || e.semester === semesterFilter)
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ code: "", name: "", faculty: "", department: "", totalSeats: 70, description: "", semester: "3-1" });
    setShowModal(true);
  };

  const openEdit = (e: Elective) => {
    setEditingId(e.id);
    setForm({ code: e.code, name: e.name, faculty: e.faculty, department: e.department, totalSeats: e.totalSeats, description: e.description, semester: e.semester });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.code) return toast.error("Code and Name are required");
    if (editingId) {
      const target = electivesList.find((e) => e.id === editingId);
      if (!target) return;
      updateAdminElective(target.id, {
        code: form.code,
        name: form.name,
        facultyName: form.faculty,
        department: form.department,
        seatLimit: form.totalSeats,
        semester: form.semester,
      })
        .then((updated) => {
          setElectivesList((prev) =>
            prev.map((e) =>
              e.id === editingId
                ? {
                    id: updated.legacyId,
                    code: updated.code,
                    name: updated.name,
                    faculty: updated.facultyName || "",
                    department: updated.department || "",
                    totalSeats: updated.seatLimit,
                    remainingSeats: updated.seatLimit,
                    description: "",
                  }
                : e
            )
          );
          toast.success("Elective updated!");
        })
        .catch((e: any) => toast.error(e?.message || "Failed to update elective"));
    } else {
      createAdminElective({
        legacyId: String(Date.now()),
        code: form.code,
        name: form.name,
        facultyName: form.faculty,
        department: form.department,
        seatLimit: form.totalSeats,
        semester: form.semester,
      })
        .then((created) => {
          setElectivesList((prev) => [
            ...prev,
            {
              id: created.legacyId,
              code: created.code,
              name: created.name,
              faculty: created.facultyName || "",
              department: created.department || "",
              totalSeats: created.seatLimit,
              remainingSeats: created.seatLimit,
              description: "",
            },
          ]);
          toast.success("Elective added!");
        })
        .catch((e: any) => toast.error(e?.message || "Failed to add elective"));
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const target = electivesList.find((e) => e.id === id);
    if (!target) return;
    deleteAdminElective(target.id)
      .then(() => {
        setElectivesList((prev) => prev.filter((e) => e.id !== id));
        toast.success("Elective deleted.");
      })
      .catch((e: any) => toast.error(e?.message || "Failed to delete elective"));
  };

  return (
    <DashboardLayout title="Manage Electives" subtitle="Add, edit, or remove elective courses">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, or department..."
            className="input-field pl-9 w-full"
          />
        </div>
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="input-field w-full sm:w-40"
        >
          <option value="">All Semesters</option>
          <option value="3-1">Semester 3-1</option>
          <option value="3-2">Semester 3-2</option>
          <option value="4-1">Semester 4-1</option>
          <option value="4-2">Semester 4-2</option>
        </select>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
          <Plus size={16} /> Add Elective
        </button>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((e, i) => {
          const pct = Math.round(((e.totalSeats - e.remainingSeats) / e.totalSeats) * 100);
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-elevated p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="badge-primary text-[10px] mb-1 inline-block">{e.code}</span>
                  <span className="badge-secondary text-[10px] mb-1 inline-block">{e.semester}</span>
                </div>
                <BookOpen size={18} className="text-primary shrink-0" />
              </div>
              <h4 className="font-display font-bold text-foreground text-sm">{e.name}</h4>
              <p className="text-xs text-muted-foreground">{e.faculty}</p>
              <p className="text-xs text-muted-foreground">{e.department}</p>
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Seats filled</span>
                  <span>{e.totalSeats - e.remainingSeats}/{e.totalSeats}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-2 border-t border-border/30">
                <button onClick={() => openEdit(e)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                  <Edit size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(e.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">No electives found.</div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card rounded-3xl border border-border/50 shadow-xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <h3 className="font-display font-bold text-lg text-foreground">{editingId ? "Edit Elective" : "Add New Elective"}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={16} className="text-muted-foreground" /></button>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: "Course Code", key: "code" as const, placeholder: "e.g. CS406" },
                  { label: "Course Name", key: "name" as const, placeholder: "e.g. Data Science" },
                  { label: "Faculty", key: "faculty" as const, placeholder: "e.g. Dr. Smith" },
                  { label: "Department", key: "department" as const, placeholder: "e.g. Computer Science" },
                  { label: "Description", key: "description" as const, placeholder: "Brief description" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">{f.label}</label>
                    <input value={form[f.key]} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} className="input-field" placeholder={f.placeholder} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Semester</label>
                    <select value={form.semester} onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))} className="input-field">
                      <option value="3-1">Semester 3-1</option>
                      <option value="3-2">Semester 3-2</option>
                      <option value="4-1">Semester 4-1</option>
                      <option value="4-2">Semester 4-2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Total Seats</label>
                    <input type="number" value={form.totalSeats} onChange={(e) => setForm((prev) => ({ ...prev, totalSeats: Number(e.target.value) }))} className="input-field" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} className="btn-primary flex-1">{editingId ? "Update" : "Add"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default AdminElectives;
