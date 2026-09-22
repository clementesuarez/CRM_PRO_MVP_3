import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distRoot = path.join(rootDir, 'distribucion_crm');
const demoDir = path.join(distRoot, 'CRM_Agencia_DEMO');
const prodDir = path.join(distRoot, 'CRM_Agencia_PRODUCCION');
const prodTemplatesDir = path.join(prodDir, 'templates_migracion');

console.log('>>> Creando estructura de carpetas de distribución...');

if (fs.existsSync(distRoot)) {
  fs.rmSync(distRoot, { recursive: true, force: true });
}

fs.mkdirSync(demoDir, { recursive: true });
fs.mkdirSync(prodDir, { recursive: true });
fs.mkdirSync(prodTemplatesDir, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      if (childItemName === 'node_modules' || childItemName === '.git' || childItemName === '.gemini' || childItemName === 'distribucion_crm') return;
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

// 1. Copiar Frontend Compilado (dist), Backend (server) y node_modules precompilados
console.log('>>> Copiando archivos compilados (dist) y backend (server)...');
copyRecursiveSync(path.join(rootDir, 'dist'), path.join(demoDir, 'dist'));
copyRecursiveSync(path.join(rootDir, 'server'), path.join(demoDir, 'server'));
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(demoDir, 'package.json'));

copyRecursiveSync(path.join(rootDir, 'dist'), path.join(prodDir, 'dist'));
copyRecursiveSync(path.join(rootDir, 'server'), path.join(prodDir, 'server'));
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(prodDir, 'package.json'));

if (fs.existsSync(path.join(rootDir, 'package-lock.json'))) {
  fs.copyFileSync(path.join(rootDir, 'package-lock.json'), path.join(demoDir, 'package-lock.json'));
  fs.copyFileSync(path.join(rootDir, 'package-lock.json'), path.join(prodDir, 'package-lock.json'));
}

if (fs.existsSync(path.join(rootDir, 'node_modules'))) {
  console.log('>>> Copiando node_modules precompilados (Zero-Compile / Zero-Setup)...');
  fs.cpSync(path.join(rootDir, 'node_modules'), path.join(demoDir, 'node_modules'), { recursive: true });
  fs.cpSync(path.join(rootDir, 'node_modules'), path.join(prodDir, 'node_modules'), { recursive: true });
}

// 2. Copiar crm_local.db para DEMO (con datos)
console.log('>>> Generando crm_local.db para Paquete DEMO...');
fs.copyFileSync(path.join(rootDir, 'crm_local.db'), path.join(demoDir, 'crm_local.db'));

// 3. Generar crm_local.db limpio para PRODUCCIÓN (0 registros operativos, usuarios + plantillas intactos)
console.log('>>> Generando crm_local.db limpio para Paquete PRODUCCIÓN...');
const prodDbPath = path.join(prodDir, 'crm_local.db');
fs.copyFileSync(path.join(rootDir, 'crm_local.db'), prodDbPath);

const prodDb = new Database(prodDbPath);
prodDb.exec(`
  DELETE FROM reclamos_cobranza;
  DELETE FROM pagares;
  DELETE FROM permutas;
  DELETE FROM interacciones;
  DELETE FROM pedidos_encargo;
  DELETE FROM presupuestos;
  DELETE FROM cotizaciones;
  DELETE FROM inventario;
  DELETE FROM vehiculos;
  DELETE FROM clientes;
  VACUUM;
`);
prodDb.close();
console.log('[SQLite] Base de datos PRODUCCIÓN limpiada a 0 registros operativos.');

// 4. Script instalar_y_ejecutar.bat e iniciar_crm.bat (Sintaxis nativa blindada con goto, cd /d %~dp0 y CRLF)
const batContentLines = [
  '@echo off',
  'title CRM Agencia - Servidor Local',
  '',
  'cd /d "%~dp0"',
  '',
  'echo ======================================================',
  'echo           INICIANDO CRM AGENCIA VERSION 1.0',
  'echo ======================================================',
  'echo.',
  '',
  'REM 1. Verificacion limpia de Node.js',
  'where node >nul 2>nul',
  'if %ERRORLEVEL% NEQ 0 goto :NO_NODE',
  '',
  'REM 2. Verificacion de node_modules precompilados',
  'if exist node_modules goto :START_APP',
  '',
  'echo [1/2] Instalando modulos de produccion (Fallback)...',
  'call npm install --omit=dev --no-audit --no-fund',
  'if %ERRORLEVEL% NEQ 0 goto :NPM_ERROR',
  '',
  ':START_APP',
  'echo [2/2] Levantando aplicacion...',
  'echo.',
  'start "" http://localhost:5173',
  '',
  'echo ======================================================',
  'echo   CRM Agencia en ejecucion. Mantenga esta ventana abierta.',
  'echo ======================================================',
  'echo.',
  '',
  'if exist server\\server.js (',
  '    node server/server.js',
  ') else (',
  '    node server/index.js',
  ')',
  'goto :END',
  '',
  ':NO_NODE',
  'echo [ERROR CRITICO] Node.js no esta instalado en este sistema.',
  'echo Por favor descargue e instale Node.js LTS desde https://nodejs.org/',
  'echo.',
  'pause',
  'exit /b 1',
  '',
  ':NPM_ERROR',
  'echo [ERROR] Fallo npm install. Verifique la conexion a Internet.',
  'echo.',
  'pause',
  'exit /b 1',
  '',
  ':END',
  'pause',
  ''
];
const batContent = batContentLines.join('\r\n');

fs.writeFileSync(path.join(demoDir, 'instalar_y_ejecutar.bat'), batContent, { encoding: 'utf-8' });
fs.writeFileSync(path.join(demoDir, 'iniciar_crm.bat'), batContent, { encoding: 'utf-8' });

fs.writeFileSync(path.join(prodDir, 'instalar_y_ejecutar.bat'), batContent, { encoding: 'utf-8' });
fs.writeFileSync(path.join(prodDir, 'iniciar_crm.bat'), batContent, { encoding: 'utf-8' });

// 5. Plantillas de Migración CSV para PRODUCCIÓN (BOM UTF-8 + ;)
const BOM = '\uFEFF';

const clientesCSV = BOM + `nombre;apellido;tipo_documento;numero_documento;telefono;email;localidad;provincia;domicilio_calle;domicilio_numero;codigo_postal;tipo_cliente;notas
Juan Carlos;Fernández;DNI;="28455123";="5491166399875";juan.fernandez@gmail.com;Córdoba;Córdoba;Av. Colón;1420;5000;Cliente Frecuente;Interesado en pick-ups y permutas
María Elena;Córdoba;DNI;="32110988";="5493515544332";maria.cordoba@outlook.com;Carlos Paz;Córdoba;San Martín;450;5150;Prospecto;Consultó por financiación en cuotas fijas
`;

const inventarioCSV = BOM + `patente;marca;modelo;version;anio;precio_lista;costo_compra;moneda;kilometraje;tipo_vehiculo;estado;origen_stock;numero_chasis;numero_motor;observaciones
="AB123CD";Toyota;Hilux;SRX 2.8 4x4 TDI;2022;42000;35000;USD;45000;Pick-up / Camioneta;disponible;Propio;8AJFA33G890123456;1GD1234567;Excelente estado único dueño servicios oficiales
="AD789OP";Ford;Ranger;Limited 3.2 4x4 AT;2021;38500;31000;USD;52000;Pick-up / Camioneta;disponible;Consignacion;8AFRR33F540987654;32D9876543;Toma en consignación cliente VIP
`;

const leemeTxt = `==============================================================================
          CRM AGENCIA AUTOMOTOR - MANUAL DE INSTALACIÓN Y MIGRACIÓN
==============================================================================

1. CREDENCIALES INICIALES DE ACCESO MAESTRO:
------------------------------------------------------------------------------
   - Usuario:    superadmin
   - Contraseña: superadmin123

   ⚠️ IMPORTANTE POR SEGURIDAD:
   En el primer inicio de sesión, ingrese a la solapa "Admin -> Personal y Roles" 
   o haga clic sobre su nombre de usuario en el margen superior derecho y seleccione 
   "Cambiar Mi Contraseña" para actualizar la clave maestra.

2. PUESTA EN MARCHA DEL SISTEMA:
------------------------------------------------------------------------------
   1. Haga doble clic en el archivo "instalar_y_ejecutar.bat".
   2. El sistema verificará la instalación de Node.js, instalará las librerías 
      necesarias e iniciará automáticamente el servidor en http://localhost:5173.
   3. Para conectar teléfonos celulares o tablets de vendedores en la misma red LAN, 
      ingrese la IP de la computadora servidora (ejemplo: http://192.168.1.50:5173).

3. INSTRUCCIONES DE MIGRACIÓN DE DATOS (PLANTILLAS EXCEL / CSV):
------------------------------------------------------------------------------
   En esta carpeta "templates_migracion/" encontrará dos archivos base:

   a) Plantilla_Clientes.csv:
      - Complete con el listado de clientes de la concesionaria.
      - Respete los nombres de las cabeceras (no modifique la primera fila).

   b) Plantilla_Inventario.csv:
      - Complete con el inventario de vehículos disponibles y tomados en consignación.

   COMO CARGARLOS AL CRM:
   - Ingrese al CRM con su usuario administrador.
   - Vaya a la solapa "Admin -> Base de Datos & Resguardos".
   - En la sección "Carga Masiva Multiarchivo desde Excel (.CSV)", haga clic en "Seleccionar Archivos".
   - El CRM procesará la información e impactará los registros de forma directa en SQLite.

==============================================================================
                      AutoCRM PRO MVP 3 - SOPORTE TÉCNICO
==============================================================================
`;

fs.writeFileSync(path.join(prodTemplatesDir, 'Plantilla_Clientes.csv'), clientesCSV, 'utf-8');
fs.writeFileSync(path.join(prodTemplatesDir, 'Plantilla_Inventario.csv'), inventarioCSV, 'utf-8');
fs.writeFileSync(path.join(prodTemplatesDir, 'LEEME_INSTALACION_Y_MIGRACION.txt'), leemeTxt, 'utf-8');

console.log('>>> ¡Paquete de Distribución Comercial creado exitosamente en distribucion_crm/ !');
