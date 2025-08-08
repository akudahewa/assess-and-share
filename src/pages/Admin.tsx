import { useState, useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
// TODO: Replace with proper authentication system
// For now, using a simple mock authentication

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement proper authentication
    // For now, just set admin to true for development
    setIsAdmin(true);
    setUser({ id: 'admin', email: 'admin@example.com' });
    setLoading(false);
  }, []);

  const checkAdminStatus = async (userId: string) => {
    // TODO: Implement proper admin check
    setIsAdmin(true);
    setLoading(false);
  };

  const handleAuthSuccess = () => {
    // The useEffect will handle checking admin status
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}