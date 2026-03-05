import { useNavigate, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth, UserRole } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  Award,
  User,
  Users,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  Plus,
  Play,
  Download,
  AlertTriangle,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const studentNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard/student", icon: LayoutDashboard },
  { title: "Electives", url: "/elective-selection", icon: BookOpen },
  { title: "Results", url: "/allocation-result", icon: Award },
  { title: "Profile", url: "/student/profile", icon: User },
];

const adminNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Electives", url: "/admin/electives", icon: BookOpen },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Allocation", url: "/admin/allocation", icon: ListChecks },
  { title: "Allocated Students", url: "/admin/allocated-students", icon: Award },
  { title: "CGPA Verification", url: "/admin/cgpa-verification", icon: ListChecks },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const facultyNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard/faculty", icon: LayoutDashboard },
  { title: "Allocated Students", url: "/dashboard/faculty/allocated", icon: Users },
  { title: "Flagged Students", url: "/dashboard/faculty/flags", icon: AlertTriangle },
];

const getNavItems = (role: UserRole): NavItem[] => {
  switch (role) {
    case "student": return studentNav;
    case "admin": return adminNav;
    case "faculty": return facultyNav;
  }
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-card/50 backdrop-blur-xl">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-glow-sm">
            <GraduationCap className="text-primary-foreground" size={18} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-display font-bold text-sm text-foreground truncate">OE Manager</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user.role} Portal</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "gradient-primary text-primary-foreground shadow-glow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-card/50 backdrop-blur-xl p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/50 mb-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
