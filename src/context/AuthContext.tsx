import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AuthUser } from "@/types/auth";
import { loginAPI } from "@/utils/api";

const FALLBACK_USERS = [
  { userId: "CIT2022001", password: "student123", role: "Student", name: "Arun Kumar", department: "AI & DS", studentId: "CIT01" },
  { userId: "CIT2022002", password: "student456", role: "Student", name: "Priya D.", department: "AI & DS", studentId: "CIT02" },
  { userId: "CIT2022003", password: "student789", role: "Student", name: "Sanjay R.", department: "AI & DS", studentId: "CIT03" },
  { userId: "FAC001", password: "teacher123", role: "Subject Teacher", name: "Dr. S. Kavitha", department: "AI & DS" },
  { userId: "MNT001", password: "mentor123", role: "Mentor", name: "Dr. R. Meenakshi", department: "AI & DS" },
  { userId: "HOD001", password: "hod123", role: "HOD", name: "Dr. P. Anandan", department: "AI & DS" },
  { userId: "PRN001", password: "principal123", role: "Principal", name: "Dr. K. Rajkumar", department: "CIT" },
  { userId: "CHR001", password: "chairman123", role: "Chairman", name: "Shri. S. Ramabhadran", department: "CIT" },
] as const;

interface AuthContextType {
  user: AuthUser | null;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  demoUsers: typeof FALLBACK_USERS;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('sentinel_token');
    const storedUser = localStorage.getItem('sentinel_user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
      }
    } else if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => { if (data.valid) setUser(data.user); })
      .catch(() => localStorage.removeItem('sentinel_token'));
    }
  }, []);

  const login = async (userId: string, password: string) => {
    try {
      const data = await loginAPI(userId, password);
      if (data.success && data.token) {
        localStorage.setItem('sentinel_token', data.token);
        localStorage.setItem('sentinel_user', JSON.stringify(data.user));
        setUser(data.user);
        return true;
      }
      throw new Error("Fallback to demo users");
    } catch {
      // Fallback to FALLBACK_USERS
      const demoUser = FALLBACK_USERS.find(u => u.userId === userId && u.password === password);
      if (demoUser) {
        const fakeToken = btoa(JSON.stringify({ userId: demoUser.userId, timestamp: Date.now() }));
        localStorage.setItem('sentinel_token', fakeToken);
        localStorage.setItem('sentinel_user', JSON.stringify(demoUser));
        setUser(demoUser);
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, demoUsers: FALLBACK_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
