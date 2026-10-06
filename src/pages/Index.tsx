import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import DashboardLayout from "@/components/DashboardLayout";
import MainContent from "@/components/views/MainContent";

export default function Index() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  return (
    <DashboardLayout user={user}>
      <MainContent />
    </DashboardLayout>
  );
}
