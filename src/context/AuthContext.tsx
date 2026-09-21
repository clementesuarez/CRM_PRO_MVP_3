import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, PerfilUsuario, Permission, ROLE_PERMISSIONS } from '../types/auth';
import { dataService } from '../services/dataService';

interface AuthContextType {
  currentUser: PerfilUsuario | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  login: (usuario: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setRole?: (role: UserRole) => void;
  can: (permission: Permission) => boolean;
  usuarios: PerfilUsuario[];
  addUsuario: (usuario: Omit<PerfilUsuario, 'id' | 'created_at'> & { usuario?: string; password_hash?: string }) => Promise<void>;
  updateUsuario: (id: string, data: Partial<PerfilUsuario>) => Promise<void>;
  toggleUsuarioActivo: (id: string) => Promise<void>;
  resetUserPassword: (id: string, newPassword?: string) => Promise<boolean>;
  refreshUsuarios: () => Promise<void>;
}

export const STORAGE_SESSION_KEY = 'autocrm_session_user_mvp3';

// Função síncrona exigida pelo dataService.ts para obter o perfil ativo
export function getActiveRoleSync(): UserRole {
  try {
    const saved = sessionStorage.getItem(STORAGE_SESSION_KEY) || localStorage.getItem(STORAGE_SESSION_KEY);
    if (saved) {
      const parsed: PerfilUsuario = JSON.parse(saved);
      if (parsed?.rol) return parsed.rol;
    }
  } catch (e) {}
  return 'admin';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);

  // Usar sessionStorage para exigir login en cada nueva ventana/sesión de navegador
  const [sessionUser, setSessionUser] = useState<PerfilUsuario | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const refreshUsuarios = useCallback(async () => {
    try {
      const list = await dataService.getUsuarios();
      if (Array.isArray(list)) {
        setUsuarios(list);
      }
    } catch (err) {
      console.error('Erro ao sincronizar usuários com SQLite:', err);
    }
  }, []);

  useEffect(() => {
    if (sessionUser) {
      refreshUsuarios();
    }
  }, [sessionUser, refreshUsuarios]);

  const login = async (usuario: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await dataService.loginUser(usuario, password);
      if (res.success && res.user) {
        setSessionUser(res.user);
        sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(res.user));
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: res.error || 'Credenciales inválidas' };
    } catch {
      return { success: false, error: 'Erro de conexão com o servidor local' };
    }
  };

  const logout = useCallback(() => {
    setSessionUser(null);
    setUsuarios([]);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }, []);

  const can = useCallback((permission: Permission): boolean => {
    if (!sessionUser || !sessionUser.activo) return false;
    const allowed = ROLE_PERMISSIONS[sessionUser.rol] || [];
    return allowed.includes(permission);
  }, [sessionUser]);

  const addUsuario = async (data: Omit<PerfilUsuario, 'id' | 'created_at'> & { usuario?: string; password_hash?: string }) => {
    await dataService.createUsuario(data);
    await refreshUsuarios();
  };

  const updateUsuario = async (id: string, data: Partial<PerfilUsuario>) => {
    await dataService.updateUsuario(id, data);
    await refreshUsuarios();
  };

  const toggleUsuarioActivo = async (id: string) => {
    await dataService.toggleUsuarioActivo(id);
    await refreshUsuarios();
  };

  const resetUserPassword = async (id: string, newPassword?: string): Promise<boolean> => {
    return await dataService.resetUserPassword(id, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: sessionUser,
        currentRole: sessionUser ? sessionUser.rol : 'admin',
        isAuthenticated: !!sessionUser,
        login,
        logout,
        can,
        usuarios,
        addUsuario,
        updateUsuario,
        toggleUsuarioActivo,
        resetUserPassword,
        refreshUsuarios,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};