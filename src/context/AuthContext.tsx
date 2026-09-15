import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export const STORAGE_ROLE_KEY = 'autocrm_current_role_mvp3';
export const STORAGE_USERS_KEY = 'autocrm_usuarios_list_mvp3';

/**
 * Función utilitaria global para obtener de forma síncrona el rol activo
 * Permite a dataService.ts u otros servicios verificar el rol sin depender del ciclo de React.
 */
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
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error al cargar usuarios iniciales:', e);
    }
    return DEFAULT_USERS;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => getActiveRoleSync());

  // Guardar usuarios en storage al cambiar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usuarios));
    } catch (e) {
      console.error('Error al guardar usuarios en storage:', e);
    }
  }, [usuarios]);

  // Modificar rol activo de forma reactiva y persistente
  const handleSetRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    try {
      localStorage.setItem(STORAGE_ROLE_KEY, role);
      // Disparar evento para que componentes o servicios externos se sincronicen
      window.dispatchEvent(new Event('autocrm_role_changed'));
    } catch (e) {
      console.error('Error al guardar rol en storage:', e);
    }
  }, []);

  // Calcular el usuario activo según el rol actual
  const currentUser: PerfilUsuario = usuarios.find((u) => u.rol === currentRole && u.activo) || {
    id: `usr-${currentRole}-default`,
    nombre: currentRole === 'admin' ? 'Dueño / Admin' : currentRole === 'superadmin' ? 'Desarrollador / SuperAdmin' : 'Vendedor Comercial',
    email: `${currentRole}@agencia.com`,
    rol: currentRole,
    activo: true,
    created_at: new Date().toISOString(),
  };

  // Verificador estricto de permisos según la Matriz RBAC
  const can = useCallback((permission: Permission): boolean => {
    const allowed = ROLE_PERMISSIONS[currentRole] || [];
    return allowed.includes(permission);
  }, [currentRole]);

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
