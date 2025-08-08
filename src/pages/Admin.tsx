import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function Admin() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return <AdminDashboard onLogout={handleLogout} />;
}