import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminElectives from "./pages/AdminElectives";
import AdminStudents from "./pages/AdminStudents";
import AdminAllocation from "./pages/AdminAllocation";
import AdminAllocatedStudents from "./pages/AdminAllocatedStudents";
import FacultyDashboard from "./pages/FacultyDashboard";
import ElectiveSelection from "./pages/ElectiveSelection";
import PreferenceCheckout from "./pages/PreferenceCheckout";
import AllocationResult from "./pages/AllocationResult";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={`/dashboard/${user.role}`} />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<StudentRegister />} />
    <Route path="/dashboard/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
    <Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
    <Route path="/dashboard/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/electives" element={<ProtectedRoute role="admin"><AdminElectives /></ProtectedRoute>} />
    <Route path="/admin/students" element={<ProtectedRoute role="admin"><AdminStudents /></ProtectedRoute>} />
    <Route path="/admin/allocated-students" element={<ProtectedRoute role="admin"><AdminAllocatedStudents /></ProtectedRoute>} />
    <Route path="/admin/allocation" element={<ProtectedRoute role="admin"><AdminAllocation /></ProtectedRoute>} />
    <Route path="/dashboard/faculty" element={<ProtectedRoute role="faculty"><FacultyDashboard /></ProtectedRoute>} />
    <Route path="/elective-selection" element={<ProtectedRoute role="student"><ElectiveSelection /></ProtectedRoute>} />
    <Route path="/preference-checkout" element={<ProtectedRoute role="student"><PreferenceCheckout /></ProtectedRoute>} />
    <Route path="/allocation-result" element={<ProtectedRoute role="student"><AllocationResult /></ProtectedRoute>} />
    <Route path="/analytics" element={<ProtectedRoute role="admin"><AnalyticsDashboard /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
