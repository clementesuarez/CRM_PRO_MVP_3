# 🚗 AutoCRM PRO — Gestor Automotor Local, Autónomo & Seguro

Sistema integral de gestión comercial y control financiero para agencias de autos usados y 0km. Diseñado bajo una arquitectura **100% autónoma y local (On-Premise)** con persistencia física en **SQLite**, acceso en red local (LAN / Wi-Fi) para terminales satélite (PCs y móviles), control de acceso jerárquico (RBAC) y soberanía absoluta de datos sin costos recurrentes de infraestructura ni dependencias externas.

---

## 🎯 Características Principales

### 1. Autonomía Total & Persistencia SQL Local
- **Motor SQLite Integrado**: Todos los datos se almacenan en un único archivo físico seguro (`crm_local.db`) dentro del equipo servidor de la agencia.
- **Cero Dependencias de Nube**: Funciona sin internet para la operatoria interna del salón.
- **Resguardos Físicos & Google Drive**: Módulo de respaldo con descarga directa y copia automatizada a la carpeta local sincronizada de Google Drive (`crm_backup_YYYY-MM-DD_HHmm.db`).
- **Restauración Asistida**: Script de contingencia (`RESTAURAR_BACKUP.bat`) con validación de procesos activos, purga de diarios SQLite y backup preventivo antes de sobrescribir.

### 2. Control de Acceso por Roles (RBAC Jerárquico)
Autenticación estricta con credenciales validadas contra base SQLite:
- **`vendedor` (Comercial)**:
  - Consulta de stock y precios de venta de lista (`precio_lista`).
  - **Costos de toma y compra bloqueados** (no expuestos al frontend).
  - Márgenes comerciales y rentabilidad ocultos.
  - Módulo de Pagarés, Cobranzas y Dashboard Directivo completamente restringidos.
- **`admin` (Dueño de Agencia)**:
  - Visibilidad de costos de compra, márgenes brutos y cotizaciones globales.
  - Tablero Directivo con métricas de rotación de stock (días en salón), volumen de ventas comparativo y motivos de pérdida.
  - Gestión integral de cartera de pagarés y reclamos de cobranza.
  - Alta y blanqueo de contraseñas de personal (exclusivamente para rol `vendedor`).
- **`superadmin` (Desarrollador / Soporte Técnico)**:
  - Control de infraestructura y mantenimiento de base de datos.
  - Gestión jerárquica: habilitado para crear y gestionar cuentas de `admin` (Dueños) y `vendedor`.

### 3. Operatoria Dinámica y Sin Fricción
- **Carga 100% Manual y Directa**: Registro libre de vehículos y clientes sin restricciones de catálogos rígidos ni dependencias de APIs gubernamentales.
- **Cotizador Rápido con Salida a WhatsApp**: Formateo automático de presupuestos comerciales detallando anticipo, toma de permuta, saldo y esquema de cuotas fijas, con enlace directo a la app oficial de WhatsApp.
- **Cierre de Venta con Fecha Histórica**: Registro explícito de la fecha de entrega de la unidad para auditorías contables y cálculo de rotación de inventario.
- **Exportación Completa a CSV**: Descarga en planillas independientes de Clientes, Inventario, Presupuestos y Pagarés.

---

## 🏗️ Stack Tecnológico

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Glassmorphism Dark UI), Lucide Icons.
- **Backend Local**: Node.js, Express (API REST interna embebida en middleware Vite).
- **Base de Datos**: SQLite nativo (`better-sqlite3`), esquemas relacionales indexados con integridad referencial (`PRAGMA foreign_keys = ON`).
- **Despliegue Local**: Scripts por lotes de Windows (.bat) para orquestación y respaldos.

---

## 🚀 Puesta en Marcha

### En la Computadora Servidora (Notebook Principal)
1. **Instalar dependencias** (solo la primera vez):
   ```bash
   npm install