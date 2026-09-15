# 🚗 AutoCRM PRO MVP 3 — Gestor Automotor Serverless & Seguro

Sistema CRM integral diseñado para agencias de autos usados y 0km en Argentina. Opera con costo $0 en infraestructura, arquitectura híbrida (Supabase Cloud + LocalStorage Offline), control de acceso basado en 3 roles (RBAC) y catálogo predictivo vehicular unificado.

---

## 🎯 Novedades y Objetivos de MVP 3

1. **Control de Acceso Basado en Roles (RBAC en 3 Niveles)**:
   - **`vendedor`**: Solo accede a precios de venta de lista (`precio_lista`) y sus propias cotizaciones.
     - **Costo de compra (`costo_compra`) ofuscado y bloqueado**: No viaja al frontend comercial y se oculta en stock, fichas y formularios.
     - **Márgenes comerciales ocultos**.
     - **Módulo de Pagarés & Cobranzas bloqueado**: Inaccesible por UI y por políticas de seguridad RLS.
     - **Panel de Administración inaccesible**.
   - **`admin` (Dueño de Agencia)**: Control comercial total.
     - Visualización de costos reales y márgenes brutos estimados.
     - Gestión integral de pagarés, refinanciaciones y reclamos.
     - Panel de **"Gestión de Personal & Roles (RBAC)"** para alta de vendedores, asignación de perfiles y activación/desactivación de cuentas.
   - **`superadmin` (Desarrollador / Soporte)**:
     - Acceso irrestricto sin restricciones.
     - **Consola Técnica SuperAdmin**: Diagnóstico de latencia en vivo (ping a Supabase), inspección de estado de las 6 tablas y verificación de políticas RLS.
   - **Simulador en Navbar**: Dropdown interactivo para alternar entre los 3 roles con 1 clic y verificar las restricciones al instante.

2. **Catálogo Predictivo de Vehículos Argentina ($0 Costo de API)**:
   - Base de datos estática indexada en [`src/data/catalogoVehicular.ts`](./src/data/catalogoVehicular.ts) con las marcas, modelos y versiones más populares del mercado automotor argentino.
   - Motor de búsqueda difusa ultrarrápida (<15ms) por tokens múltiples.
   - Componente [`VehicleAutocomplete.tsx`](./src/components/VehicleAutocomplete.tsx) con soporte de navegación por teclado, chips de tipo de carrocería (Pick-up, SUV, Sedán, Hatchback), procedencia (Nacional / Importado) y sugerencia automática de años.

3. **Arquitectura de Base de Datos Segura ([`schema.sql`](./schema.sql))**:
   - Tabla `perfiles_usuarios` vinculada a `auth.users(id)` con validación de roles (`vendedor`, `admin`, `superadmin`).
   - Función segura `public.get_current_user_role()` (SECURITY DEFINER) para evaluación en Row Level Security (RLS).
   - Vista `vista_inventario_comercial` que excluye `costo_compra` a nivel de servidor PostgreSQL.
   - Tabla `catalogo_vehiculos` con extensión `pg_trgm` e índice GIN tridimensional.
   - Políticas RLS estrictas en `cuotas_pagares`, `prestamos_pagares` y `perfiles_usuarios`.

---

## 🏗️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite.
- **Estilos**: Tailwind CSS + Glassmorphism Dark Mode.
- **Iconos**: Lucide React.
- **Persistencia**: Dual-mode (Supabase PostgreSQL si existen credenciales en `.env`, con fallback automático a LocalStorage).

---

## 🚀 Puesta en Marcha Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
   (o ejecutar `PRENDER_SERVIDOR.bat`)
3. Compilar para producción:
   ```bash
   npm run build
   ```

---

## 📋 Guía de Auditoría para Gemini / Evaluador

- **Control de Acceso (RBAC)**:
  - Definición de tipos y permisos: [`src/types/auth.ts`](./src/types/auth.ts)
  - Proveedor y contexto de autenticación: [`src/context/AuthContext.tsx`](./src/context/AuthContext.tsx)
  - Control en barra de navegación: [`src/components/Navbar.tsx`](./src/components/Navbar.tsx)
  - Ofuscación de costos y eliminación restringida: [`src/components/InventoryManager.tsx`](./src/components/InventoryManager.tsx) y [`src/services/dataService.ts`](./src/services/dataService.ts)
  - Panel de ABM de vendedores y Consola SuperAdmin: [`src/components/AdminManager.tsx`](./src/components/AdminManager.tsx)
- **Catálogo Predictivo**:
  - Dataset vehicular: [`src/data/catalogoVehicular.ts`](./src/data/catalogoVehicular.ts)
  - Componente Autocomplete: [`src/components/VehicleAutocomplete.tsx`](./src/components/VehicleAutocomplete.tsx)
- **Seguridad en PostgreSQL**:
  - Script SQL unificado: [`schema.sql`](./schema.sql)
