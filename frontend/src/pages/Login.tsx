import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Lock, User, ArrowLeft, AlertCircle, Shield, BookOpen, Sparkles, Eye, EyeOff } from "lucide-react";

const roleConfig: Record<UserRole, { label: string; hint: string; userLabel: string; icon: React.ReactNode }> = {
  student: { label: "Student Portal", hint: "Use your registered roll number + password", userLabel: "Roll Number", icon: <GraduationCap size={20} /> },
  admin: { label: "Admin Portal", hint: "Use admin username + password", userLabel: "Username", icon: <Shield size={20} /> },
  faculty: { label: "Faculty Portal", hint: "Use faculty username + password", userLabel: "Username", icon: <BookOpen size={20} /> },
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "student";
  const [role, setRole] = useState<UserRole>(initialRole);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await login(role, username, password);
    if (res.ok) navigate(`/dashboard/${role}`);
    else setError(res.message || "Invalid credentials");
  };

  const config = roleConfig[role];

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-primary/10 blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-secondary/10 blur-[128px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
      </div>
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative z-10 w-full max-w-md">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-primary-foreground/40 hover:text-primary-foreground/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/50 shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 pb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-sm">
                <GraduationCap className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-foreground">{config.label}</h1>
                <p className="text-xs text-muted-foreground">Sign in to continue</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Role Tabs */}
            <div className="flex gap-1 p-1 bg-muted/80 rounded-2xl mb-8">
              {(["student", "admin", "faculty"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setError(""); setUsername(""); setPassword(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 ${
                    role === r
                      ? "bg-card text-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "student" && <GraduationCap size={14} />}
                  {r === "admin" && <Shield size={14} />}
                  {r === "faculty" && <BookOpen size={14} />}
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">{config.userLabel}</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field pl-11"
                    placeholder={`Enter ${config.userLabel.toLowerCase()}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11 pr-11"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/8 rounded-xl px-4 py-3"
                  >
                    <AlertCircle size={14} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" className="btn-primary w-full py-3.5 text-sm">
                Sign In
              </button>
            </form>

            <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-border/50">
              <Sparkles size={14} className="text-primary shrink-0" />
              <p className="text-[11px] text-muted-foreground">{config.hint}</p>
            </div>

            {role === "student" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                New student?{" "}
                <button type="button" onClick={() => navigate("/register")} className="text-primary font-semibold hover:underline">
                  Register here
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
