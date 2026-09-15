import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, PerfilUsuario, Permission, ROLE_PERMISSIONS } from '../types/auth';

interface AuthContextType {
  currentUser: PerfilUsuario;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  can: (permission: Permission) => boolean;
  usuarios: PerfilUsuario[];
  addUsuario: (usuario: Omit<PerfilUsuario, 'id' | 'created_at'>) => void;
  updateUsuario: (id: string, data: Partial<PerfilUsuario>) => void;
  toggleUsuarioActivo: (id: string) => void;
}

const DEFAULT_USERS: PerfilUsuario[] = [
  {
    id: 'usr-admin-1',
    nombre: 'Clemente Suárez',
    email: 'clemente@autocrm.com',
    rol: 'admin',
    activo: true,
    telefono: '+54 9 11 4444-5555',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'usr-vend-1',
    nombre: 'Lucas Rodríguez',
    email: 'lucas.ventas@autocrm.com',
    rol: 'vendedor',
    activo: true,
    telefono: '+54 9 11 2233-4455',
    created_at: '2026-02-01T12:00:00Z',
  },
  {
    id: 'usr-vend-2',
    nombre: 'Sofía Martínez',
    email: 'sofia.ventas@autocrm.com',
    rol: 'vendedor',
    activo: true,
    telefono: '+54 9 11 3344-5566',
    created_at: '2026-02-15T14:30:00Z',
  },
  {
    id: 'usr-super-1',
    nombre: 'Dev Team / Soporte',
    email: 'dev@autocrm-pro.io',
    rol: 'superadmin',
    activo: true,
    telefono: '+54 9 11 9999-0000',
    created_at: '2025-12-01T08:00:00Z',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_ROLE_KEY = 'autocrm_current_role_mvp3';
const STORAGE_USERS_KEY = 'autocrm_usuarios_list_mvp3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>(() => {
    const saved = localStorage.getItem(STORAGE_USERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved users', e);
      }
    }
    return DEFAULT_USERS;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole;
    if (saved && (saved === 'vendedor' || saved === 'admin' || saved === 'superadmin')) {
      return saved;
    }
    return 'admin'; // Dueño de agencia por defecto
  });

  // Guardar usuarios en storage al cambiar
  useEffect(() => {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usuarios));
  }, [usuarios]);

  // Guardar rol seleccionado
  const handleSetRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem(STORAGE_ROLE_KEY, role);
  };

  // Buscar usuario activo que coincida con el rol o usar fallback
  const currentUser: PerfilUsuario = usuarios.find((u) => u.rol === currentRole && u.activo) || {
    id: `usr-${currentRole}-default`,
    nombre: currentRole === 'admin' ? 'Dueño / Admin' : currentRole === 'superadmin' ? 'Desarrollador / SuperAdmin' : 'Vendedor Comercial',
    email: `${currentRole}@agencia.com`,
    rol: currentRole,
    activo: true,
    created_at: new Date().toISOString(),
  };

  // Verificador de permisos RBAC
  const can = (permission: Permission): boolean => {
    const permissions = ROLE_PERMISSIONS[currentRole] || [];
    return permissions.includes(permission);
  };

  const addUsuario = (data: Omit<PerfilUsuario, 'id' | 'created_at'>) => {
    const nuevo: PerfilUsuario = {
      ...data,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setUsuarios((prev) => [...prev, nuevo]);
  };

  const updateUsuario = (id: string, data: Partial<PerfilUsuario>) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...data } : u))
    );
  };

  const toggleUsuarioActivo = (id: string) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        setRole: handleSetRole,
        can,
        usuarios,
        addUsuario,
        updateUsuario,
        toggleUsuarioActivo,
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
