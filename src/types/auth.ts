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
  | 'crear_presupuesto'
  | 'crear_prospecto'
  | 'ver_inventario_lista'
  | 'ver_costos'
  | 'editar_costos'
  | 'gestionar_pagares'
  | 'gestionar_usuarios'
  | 'consola_superadmin'
  | 'eliminar_vehiculo';

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
    'editar_costos',
    'eliminar_vehiculo',
    'gestionar_pagares',
    'gestionar_usuarios',
  ],
  superadmin: [
    'crear_prospecto',
    'crear_presupuesto',
    'ver_inventario_lista',
    'ver_costos',
    'editar_costos',
    'eliminar_vehiculo',
    'gestionar_pagares',
    'gestionar_usuarios',
    'consola_superadmin',
  ],
};

export const ROLE_LABELS: Record<UserRole, { label: string; badge: string; color: string; desc: string }> = {
  vendedor: {
    label: 'Vendedor Comercial',
    badge: 'Comercial',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    desc: 'Solo ve precio de lista y sus presupuestos. Costos, pagarés y admin bloqueados.',
  },
  admin: {
    label: 'Admin (Dueño de Agencia)',
    badge: 'Dueño / Admin',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    desc: 'Control comercial absoluto, costos reales, márgenes, pagarés y ABM de personal.',
  },
  superadmin: {
    label: 'SuperAdmin (Desarrollador)',
    badge: 'Dev / SuperAdmin',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    desc: 'Acceso irrestricto, diagnósticos en vivo de Supabase, tablas, RLS y soporte técnico.',
  },
};
