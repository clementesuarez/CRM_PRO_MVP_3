export type UserRole = 'vendedor' | 'admin' | 'superadmin';

export interface PerfilUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  telefono?: string;
  created_at: string;
}

export type Permission = 
  | 'ver_costos'
  | 'ver_margenes'
  | 'editar_costo_vehiculo'
  | 'eliminar_vehiculo'
  | 'gestionar_pagares'
  | 'gestionar_usuarios'
  | 'consola_superadmin'
  | 'ver_diagnostico_supabase'
  | 'ver_logs_tecnicos'
  | 'crear_prospecto'
  | 'crear_presupuesto'
  | 'ver_inventario_lista';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  vendedor: [
    'crear_prospecto',
    'crear_presupuesto',
    'ver_inventario_lista',
  ],
  admin: [
    'crear_prospecto',
    'crear_presupuesto',
    'ver_inventario_lista',
    'ver_costos',
    'ver_margenes',
    'editar_costo_vehiculo',
    'eliminar_vehiculo',
    'gestionar_pagares',
    'gestionar_usuarios',
  ],
  superadmin: [
    'crear_prospecto',
    'crear_presupuesto',
    'ver_inventario_lista',
    'ver_costos',
    'ver_margenes',
    'editar_costo_vehiculo',
    'eliminar_vehiculo',
    'gestionar_pagares',
    'gestionar_usuarios',
    'consola_superadmin',
    'ver_diagnostico_supabase',
    'ver_logs_tecnicos',
  ],
};

export const ROLE_LABELS: Record<UserRole, { label: string; badge: string; color: string; desc: string }> = {
  vendedor: {
    label: 'Vendedor Comercial',
    badge: 'Comercial',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    desc: 'Solo ve precios de lista y sus operaciones. Sin acceso a costos ni pagarés.',
  },
  admin: {
    label: 'Admin (Dueño de Agencia)',
    badge: 'Dueño / Admin',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    desc: 'Control comercial absoluto, costos reales, márgenes, pagarés y personal.',
  },
  superadmin: {
    label: 'SuperAdmin (Desarrollador)',
    badge: 'Dev / SuperAdmin',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    desc: 'Acceso total sin restricciones, diagnóstico de BD, consola y soporte técnico.',
  },
};
