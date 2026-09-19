import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, PerfilUsuario, Permission, ROLE_PERMISSIONS } from '../types/auth';
import { dataService } from '../services/dataService';

interface AuthContextType {
  currentUser: PerfilUsuario;
  currentRole: UserRole;
  isAuthenticated: boolean;
  login: (usuario: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  can: (permission: Permission) => boolean;
  usuarios: PerfilUsuario[];
  addUsuario: (usuario: Omit<PerfilUsuario, 'id' | 'created_at'> & { usuario?: string; password_hash?: string }) => Promise<void>;
  updateUsuario: (id: string, data: Partial<PerfilUsuario>) => Promise<void>;
  toggleUsuarioActivo: (id: string) => Promise<void>;
  resetUserPassword: (id: string, newPassword?: string) => Promise<boolean>;
  refreshUsuarios: () => Promise<void>;
}

export const STORAGE_ROLE_KEY = 'autocrm_current_role_mvp3';
export const STORAGE_USERS_KEY = 'autocrm_usuarios_list_mvp3';
export const STORAGE_SESSION_KEY = 'autocrm_session_user_mvp3';

export const getActiveRoleSync = (): UserRole => {
  try {
    const saved = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole;
    if (saved === 'vendedor' || saved === 'admin' || saved === 'superadmin') {
      return saved;
    }
  } catch (e) {
    console.error('Error al leer STORAGE_ROLE_KEY:', e);
  }
  return 'admin';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [sessionUser, setSessionUser] = useState<PerfilUsuario | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error al leer sesión de usuario:', e);
    }
    return null;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (sessionUser) return sessionUser.rol;
    return getActiveRoleSync();
  });

  const refreshUsuarios = useCallback(async () => {
    try {
      const list = await dataService.getUsuarios();
      if (list && list.length > 0) {
        setUsuarios(list);
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(list));
      }
    } catch (err) {
      console.error('Error al actualizar usuarios desde SQLite:', err);
    }
  }, []);

  useEffect(() => {
    refreshUsuarios();
  }, [refreshUsuarios]);

  const login = async (usuario: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const res = await dataService.loginUser(usuario, password);
    if (res.success && res.user) {
      setSessionUser(res.user);
      setCurrentRole(res.user.rol);
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(res.user));
      localStorage.setItem(STORAGE_ROLE_KEY, res.user.rol);
      window.dispatchEvent(new Event('autocrm_role_changed'));
      return { success: true };
    }
    return { success: false, error: res.error || 'Credenciales inválidas' };
  };

  const logout = useCallback(() => {
    setSessionUser(null);
    localStorage.removeItem(STORAGE_SESSION_KEY);
    window.dispatchEvent(new Event('autocrm_role_changed'));
  }, []);

  const handleSetRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    try {
      localStorage.setItem(STORAGE_ROLE_KEY, role);
      window.dispatchEvent(new Event('autocrm_role_changed'));
    } catch (e) {
      console.error('Error al guardar rol en storage:', e);
    }
  }, []);

  const currentUser: PerfilUsuario = sessionUser || usuarios.find((u) => u.rol === currentRole && u.activo) || {
    id: `usr-${currentRole}-default`,
    nombre: currentRole === 'admin' ? 'Dueño / Admin' : currentRole === 'superadmin' ? 'Desarrollador / SuperAdmin' : 'Vendedor Comercial',
    email: `${currentRole}@agencia.com`,
    rol: currentRole,
    activo: true,
    created_at: new Date().toISOString(),
  };

  const can = useCallback((permission: Permission): boolean => {
    const roleToTest = sessionUser ? sessionUser.rol : currentRole;
    const allowed = ROLE_PERMISSIONS[roleToTest] || [];
    return allowed.includes(permission);
  }, [currentRole, sessionUser]);

  const addUsuario = async (data: Omit<PerfilUsuario, 'id' | 'created_at'> & { usuario?: string; password_hash?: string }) => {
    const created = await dataService.createUsuario(data);
    setUsuarios((prev) => [...prev, created]);
    await refreshUsuarios();
  };

  const updateUsuario = async (id: string, data: Partial<PerfilUsuario>) => {
    const updated = await dataService.updateUsuario(id, data);
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    await refreshUsuarios();
  };

  const toggleUsuarioActivo = async (id: string) => {
    const newStatus = await dataService.toggleUsuarioActivo(id);
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: newStatus } : u))
    );
    await refreshUsuarios();
  };

  const resetUserPassword = async (id: string, newPassword?: string): Promise<boolean> => {
    return await dataService.resetUserPassword(id, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: sessionUser ? sessionUser.rol : currentRole,
        isAuthenticated: !!sessionUser,
        login,
        logout,
        setRole: handleSetRole,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
