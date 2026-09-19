import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../crm_local.db');
console.log(`[SQLite] Conectando a la base de datos local: ${dbPath}`);

export const db = new Database(dbPath);

// Enable Foreign Keys & WAL mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      usuario TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      email TEXT,
      telefono TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      apellido TEXT,
      dni TEXT,
      telefono TEXT NOT NULL,
      email TEXT,
      localidad TEXT,
      provincia TEXT,
      domicilio_calle TEXT,
      domicilio_numero TEXT,
      codigo_postal TEXT,
      tipo_documento TEXT DEFAULT 'DNI',
      compro_credito INTEGER DEFAULT 0,
      monto_credito REAL DEFAULT 0,
      deja_auto_permuta INTEGER DEFAULT 0,
      auto_permuta_detalle TEXT,
      tipo_cliente TEXT DEFAULT 'Prospecto',
      sexo TEXT,
      fecha_nacimiento TEXT,
      numero_tramite TEXT,
      notas TEXT,
      ultimo_contacto TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehiculos (
      id TEXT PRIMARY KEY,
      patente TEXT,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      version TEXT,
      anio INTEGER NOT NULL,
      precio_venta REAL NOT NULL,
      costo_toma REAL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'Disponible',
      fecha_ingreso TEXT NOT NULL,
      fecha_venta TEXT,
      motivo_perdida TEXT,
      tipo_vehiculo TEXT,
      numero_chasis TEXT,
      numero_motor TEXT,
      kilometraje INTEGER DEFAULT 0,
      es_cero_km INTEGER DEFAULT 0,
      moneda TEXT DEFAULT 'USD',
      origen_stock TEXT DEFAULT 'Propio',
      observaciones TEXT,
      comprado_a_cliente_id TEXT,
      dueno_consigna_nombre TEXT,
      dueno_consigna_telefono TEXT,
      dueno_consigna_documento TEXT,
      origen_transaccion TEXT,
      es_solo_compra INTEGER DEFAULT 0,
      fecha_compra TEXT
    );

    CREATE TABLE IF NOT EXISTS cotizaciones (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL,
      vehiculo_id TEXT,
      precio_vehiculo REAL NOT NULL DEFAULT 0,
      permuta_monto REAL DEFAULT 0,
      anticipo REAL DEFAULT 0,
      saldo_financiar REAL DEFAULT 0,
      cant_cuotas INTEGER DEFAULT 0,
      valor_cuota REAL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'Borrador',
      moneda TEXT DEFAULT 'USD',
      motivo_perdida TEXT,
      vehiculos_cotizados TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS permutas (
      id TEXT PRIMARY KEY,
      presupuesto_id TEXT NOT NULL,
      patente TEXT,
      marca TEXT,
      modelo TEXT,
      version TEXT,
      marca_modelo TEXT NOT NULL,
      anio INTEGER NOT NULL,
      kilometraje INTEGER NOT NULL,
      moneda TEXT DEFAULT 'USD',
      valor_tasacion REAL NOT NULL,
      observaciones TEXT,
      created_at TEXT,
      FOREIGN KEY (presupuesto_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prestamos (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL,
      vehiculo_id TEXT,
      presupuesto_id TEXT,
      monto_total_prestado REAL NOT NULL,
      moneda TEXT DEFAULT 'USD',
      cantidad_cuotas INTEGER NOT NULL,
      tasa_interes_anual REAL DEFAULT 0,
      monto_cuota_promedio REAL NOT NULL,
      fecha_otorgamiento TEXT NOT NULL,
      estado TEXT DEFAULT 'Activo',
      observaciones TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pagares (
      id TEXT PRIMARY KEY,
      cotizacion_id TEXT,
      cliente_id TEXT,
      nro_cuota INTEGER NOT NULL,
      monto REAL NOT NULL,
      fecha_vencimiento TEXT NOT NULL,
      fecha_pago TEXT,
      estado TEXT NOT NULL DEFAULT 'Pendiente',
      numero_pagare TEXT,
      monto_capital REAL DEFAULT 0,
      monto_interes REAL DEFAULT 0,
      moneda TEXT DEFAULT 'USD',
      monto_pagado REAL DEFAULT 0,
      comprobante_pago TEXT,
      observaciones TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interacciones (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL,
      tipo TEXT NOT NULL,
      nota TEXT NOT NULL,
      accion_siguiente TEXT,
      fecha_contacto TEXT NOT NULL,
      proximo_contacto TEXT
    );

    CREATE TABLE IF NOT EXISTS pedidos_encargo (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL,
      marca_buscada TEXT NOT NULL,
      modelo_buscado TEXT NOT NULL,
      anio_minimo INTEGER,
      anio_maximo INTEGER,
      presupuesto_maximo REAL NOT NULL,
      moneda TEXT DEFAULT 'USD',
      es_cero_km INTEGER DEFAULT 0,
      color_preferencia TEXT,
      estado TEXT DEFAULT 'Buscando en Mercado',
      vehiculo_coincidente_id TEXT,
      observaciones TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reclamos_cobranza (
      id TEXT PRIMARY KEY,
      cuota_id TEXT NOT NULL,
      cliente_id TEXT NOT NULL,
      fecha_contacto TEXT NOT NULL,
      tipo_gestion TEXT NOT NULL,
      resultado_gestion TEXT NOT NULL,
      fecha_compromiso_pago TEXT,
      monto_prometido REAL,
      detalle_reclamo TEXT NOT NULL,
      atendido_por TEXT
    );
  `);

  seedIfEmpty();
}

function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM usuarios').get().count;
  if (userCount === 0) {
    console.log('[SQLite] Sembrando datos iniciales en crm_local.db...');

    // Seed usuarios
    const insertUsuario = db.prepare(`
      INSERT INTO usuarios (id, nombre, usuario, password_hash, rol, activo, email, telefono, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUsuario.run('usr-admin-default', 'Administrador General', 'admin', 'admin123', 'admin', 1, 'admin@autocrm.com', '+54 9 11 0000-1111', '2026-01-01T00:00:00Z');
    insertUsuario.run('usr-admin-1', 'Clemente Suárez', 'clemente', 'admin123', 'admin', 1, 'clemente@autocrm.com', '+54 9 11 4444-5555', '2026-01-10T10:00:00Z');
    insertUsuario.run('usr-vend-1', 'Lucas Rodríguez', 'lucas', 'vend123', 'vendedor', 1, 'lucas.ventas@autocrm.com', '+54 9 11 2233-4455', '2026-02-01T12:00:00Z');
    insertUsuario.run('usr-vend-2', 'Sofía Martínez', 'sofia', 'vend123', 'vendedor', 1, 'sofia.ventas@autocrm.com', '+54 9 11 3344-5566', '2026-02-15T14:30:00Z');
    insertUsuario.run('usr-super-1', 'Dev Team / Soporte', 'superadmin', 'super123', 'superadmin', 1, 'dev@autocrm-pro.io', '+54 9 11 9999-0000', '2025-12-01T08:00:00Z');

    // Seed clientes
    const insertCliente = db.prepare(`
      INSERT INTO clientes (id, nombre, apellido, dni, telefono, email, localidad, provincia, domicilio_calle, domicilio_numero, codigo_postal, tipo_documento, compro_credito, monto_credito, deja_auto_permuta, auto_permuta_detalle, tipo_cliente, notas, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCliente.run('c1', 'Carlos', 'Rodríguez', '32.145.890', '5491155443322', 'crodriguez@email.com', 'Balvanera', 'Ciudad Autónoma de Buenos Aires (CABA)', 'Av. Corrientes', '2450', 'C1046', 'DNI', 1, 16000, 1, 'Volkswagen Gol Trend 1.6 (2018) - Patente AC987ZZ - Tasación: USD 9.500', 'Prospecto', 'Interesado en Hilux 4x4 o camioneta con entrega de Gol 2018', '2026-09-01T10:00:00Z');
    insertCliente.run('c2', 'Lucía', 'Benítez', '38.990.112', '5491166778899', 'lbenitez@email.com', 'La Plata', 'Buenos Aires', 'Calle 7', '512', '1900', 'DNI', 0, 0, 0, null, 'No compro', 'Buscaba 208 GT pero la tasación de su usado le pareció baja', '2026-07-20T14:30:00Z');
    insertCliente.run('c3', 'Esteban', 'Fernández', '20-35444333-9', '5491133221100', 'efernandez@email.com', 'Córdoba Capital', 'Córdoba', 'Av. Colón', '1280', '5000', 'CUIT', 1, 22500, 0, null, 'Prospecto', 'Consulta por Amarok V6. Quiere financiar USD 22.500', '2026-09-06T11:20:00Z');
    insertCliente.run('c4', 'El Memens', 'Comercial', '29.888.777', '5491166399875', 'elmemens@email.com', 'Rosario', 'Santa Fe', 'Mitre', '450', '2000', 'DNI', 0, 0, 0, null, 'Prospecto', 'Borrador iniciado', '2026-09-08T08:00:00Z');
    insertCliente.run('c5', 'Roberto', 'Rossi', '25.666.111', '5491188990011', 'rrossi@email.com', 'Córdoba', 'Córdoba', 'Bv. Chacabuco', '890', '5000', 'DNI', 1, 10000, 0, null, 'Comprador', 'Compró Corolla en Marzo 2025 con crédito prendario', '2025-03-12T09:15:00Z');

    // Seed vehiculos
    const insertVehiculo = db.prepare(`
      INSERT INTO vehiculos (id, patente, marca, modelo, version, anio, precio_venta, costo_toma, estado, fecha_ingreso, fecha_venta, motivo_perdida, tipo_vehiculo, numero_chasis, numero_motor, kilometraje, es_cero_km, moneda, origen_stock, observaciones, comprado_a_cliente_id, dueno_consigna_nombre, dueno_consigna_telefono, dueno_consigna_documento, origen_transaccion, es_solo_compra, fecha_compra)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertVehiculo.run('v1', 'AF123JK', 'Toyota', 'Hilux SRX 4x4 AT', 'SRX 4x4 AT', 2022, 36500, 31000, 'Disponible', '2026-08-01T10:00:00Z', null, null, 'Pick-up / Camioneta', '8AJFA8CB900123456', '1GD5678901', 42000, 0, 'USD', 'Compra Directa', 'Excelente estado, service oficial Toyota al día. Adquirido por compra directa.', 'c1', 'Carlos Rodríguez', '5491155443322', '30.123.456', 'Compra Directa a Cliente', 1, '2026-07-28');
    insertVehiculo.run('v2', 'AG999ZZ', 'Volkswagen', 'Amarok V6 Extreme', 'V6 Extreme', 2024, 48000, 42000, 'Disponible', '2026-08-20T10:00:00Z', null, null, 'Pick-up / Camioneta', 'WVWZZZ2HZH8901234', 'DDX123456', 15000, 0, 'USD', 'Compra Directa', 'Unidad Usada comprada directamente a cliente Esteban Fernández.', 'c3', 'Esteban Fernández', '5491133221100', '20-35444333-9', 'Compra Directa a Cliente', 1, '2026-08-15');
    insertVehiculo.run('v3', 'AE456LM', 'Peugeot', '208 GT T200', 'GT T200', 2023, 21500, 18000, 'Disponible', '2026-08-10T10:00:00Z', null, null, 'Hatchback', '8ADCCB123456789', 'T200987654', 18500, 0, 'USD', 'Consignación', 'Techo panorámico, único dueño, consignación cliente VIP', 'c2', 'Mariana Gómez', '5491144332211', '34.567.890', 'Consignación', 0, '2026-08-10');
    insertVehiculo.run('v4', 'AD789OP', 'Ford', 'Ranger Limited 3.2', 'Limited 3.2', 2021, 31000, 26000, 'Reservado', '2026-07-15T10:00:00Z', null, null, 'Pick-up / Camioneta', '8AF234567890123', 'PUMA32001', 65000, 0, 'USD', 'Propio', 'Reservado con seña', null, null, null, null, 'Stock Propio 0km/Usado', 0, null);
    insertVehiculo.run('v5', 'AA321XY', 'Toyota', 'Corolla SEG Hybrid', 'SEG Hybrid', 2020, 22000, 18500, 'Vendido', '2025-03-01T10:00:00Z', '2025-03-12T15:00:00Z', null, 'Sedán', '9BRBL3HE1234567', '2ZR554433', 55000, 0, 'USD', 'Propio', 'Vendido a Roberto Rossi', 'c5', 'Roberto Rossi', '5491188550011', null, 'Stock Propio 0km/Usado', 0, null);
    insertVehiculo.run('v6', 'AC654BN', 'Chevrolet', 'Cruze LTZ Sedan', 'LTZ Sedan', 2019, 16500, 14000, 'Reacondicionamiento', '2026-09-02T10:00:00Z', null, null, 'Sedán', '8AGCA5678901234', 'LE212345', 72000, 0, 'USD', 'Permuta', 'Ingresado por permuta de Carlos Rodríguez, detalla chapa guardabarros', 'c1', 'Carlos Rodríguez', '5491155443322', '30.123.456', 'Toma en Permuta por Venta', 0, '2026-08-01');

    // Seed cotizaciones
    const insertCotizacion = db.prepare(`
      INSERT INTO cotizaciones (id, cliente_id, vehiculo_id, precio_vehiculo, permuta_monto, anticipo, saldo_financiar, cant_cuotas, valor_cuota, estado, moneda, motivo_perdida, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCotizacion.run('p1', 'c1', 'v1', 36000, 9500, 20000, 16000, 24, 666, 'Enviado', 'USD', null, '2026-09-05T12:00:00Z');
    insertCotizacion.run('p2', 'c3', 'v2', 47500, 0, 25000, 22500, 18, 1250, 'Borrador', 'USD', null, '2026-09-07T09:30:00Z');
    insertCotizacion.run('p3', 'c5', 'v5', 22000, 0, 12000, 10000, 10, 1100, 'Ganado', 'USD', null, '2025-03-12T15:00:00Z');
    insertCotizacion.run('p4', 'c4', 'v3', 21500, 0, 10000, 11500, 12, 958, 'Perdido', 'USD', 'Tasación baja', '2026-07-22T11:00:00Z');

    // Seed permutas
    const insertPermuta = db.prepare(`
      INSERT INTO permutas (id, presupuesto_id, patente, marca, modelo, version, marca_modelo, anio, kilometraje, moneda, valor_tasacion, observaciones, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPermuta.run('pm1', 'p1', 'AC987ZZ', 'Volkswagen', 'Gol Trend 1.6', '1.6 MSI', 'Volkswagen Gol Trend 1.6', 2018, 85000, 'USD', 9500, 'Buen estado general, cubiertas 70%', '2026-09-05T12:00:00Z');

    // Seed prestamos
    const insertPrestamo = db.prepare(`
      INSERT INTO prestamos (id, cliente_id, vehiculo_id, presupuesto_id, monto_total_prestado, moneda, cantidad_cuotas, tasa_interes_anual, monto_cuota_promedio, fecha_otorgamiento, estado, observaciones, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPrestamo.run('prest_1', 'c5', 'v5', 'p3', 10000, 'USD', 10, 12, 1100, '2025-03-12', 'Activo', 'Crédito con 10 pagarés firmados por el comprador Roberto Rossi', '2025-03-12T15:00:00Z');

    // Seed pagares
    const insertPagare = db.prepare(`
      INSERT INTO pagares (id, cotizacion_id, cliente_id, nro_cuota, monto, fecha_vencimiento, fecha_pago, estado, numero_pagare, monto_capital, monto_interes, moneda, monto_pagado, comprobante_pago, observaciones, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPagare.run('cuota_1', 'prest_1', 'c5', 1, 1100, '2025-04-12', '2025-04-10T11:00:00Z', 'Cobrado', 'PAG-0001', 1000, 100, 'USD', 1100, 'REC-00124', null, '2025-03-12T15:00:00Z');
    insertPagare.run('cuota_2', 'prest_1', 'c5', 2, 1100, '2025-05-12', '2025-05-11T16:00:00Z', 'Cobrado', 'PAG-0002', 1000, 100, 'USD', 1100, 'REC-00155', null, '2025-03-12T15:00:00Z');
    insertPagare.run('cuota_3', 'prest_1', 'c5', 3, 1100, '2026-09-10', null, 'Vencido', 'PAG-0003', 1000, 100, 'USD', 0, null, null, '2025-03-12T15:00:00Z');
    insertPagare.run('cuota_4', 'prest_1', 'c5', 4, 1100, '2026-09-18', null, 'Pendiente', 'PAG-0004', 1000, 100, 'USD', 0, null, null, '2025-03-12T15:00:00Z');

    // Seed interacciones
    const insertInteraccion = db.prepare(`
      INSERT INTO interacciones (id, cliente_id, tipo, nota, accion_siguiente, fecha_contacto, proximo_contacto)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertInteraccion.run('i1', 'c1', 'Vino al salón', 'Probó la Hilux. Le gustó el estado. Pidió presupuesto con financiación a 24 meses.', null, '2026-09-05T11:00:00Z', '2026-09-08T15:00:00Z');
    insertInteraccion.run('i2', 'c3', 'Llamó', 'Consulta por Amarok V6 0km. Quiere entregar Ford Focus 2017 en parte de pago.', null, '2026-09-07T09:15:00Z', '2026-09-09T11:20:00Z');
    insertInteraccion.run('i3', 'c4', 'No contesta', 'Se envió whatsapp con re-tasación mejorada.', null, '2026-08-01T10:00:00Z', '2026-09-10T10:00:00Z');
  }
}

function ensureDefaultSeedUsers() {
  try {
    const insertOrUpdate = db.prepare(`
      INSERT INTO usuarios (id, nombre, usuario, password_hash, rol, activo, email, telefono, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        password_hash = excluded.password_hash,
        rol = excluded.rol,
        activo = 1
    `);

    // Ensure admin / admin123
    const adminExists = db.prepare("SELECT * FROM usuarios WHERE usuario = 'admin'").get();
    if (!adminExists) {
      insertOrUpdate.run('usr-admin-default', 'Administrador General', 'admin', 'admin123', 'admin', 'admin@autocrm.com', '+54 9 11 0000-1111', new Date().toISOString());
    } else {
      db.prepare("UPDATE usuarios SET password_hash = 'admin123', activo = 1 WHERE usuario = 'admin'").run();
    }

    // Ensure superadmin / superadmin123
    const superExists = db.prepare("SELECT * FROM usuarios WHERE usuario = 'superadmin'").get();
    if (!superExists) {
      insertOrUpdate.run('usr-super-default', 'Dev Team / SuperAdmin', 'superadmin', 'superadmin123', 'superadmin', 'dev@autocrm-pro.io', '+54 9 11 9999-0000', new Date().toISOString());
    } else {
      db.prepare("UPDATE usuarios SET password_hash = 'superadmin123', activo = 1 WHERE usuario = 'superadmin'").run();
    }

    // Ensure vendedor / vendedor123
    const vendExists = db.prepare("SELECT * FROM usuarios WHERE usuario = 'vendedor'").get();
    if (!vendExists) {
      insertOrUpdate.run('usr-vend-default', 'Vendedor Comercial', 'vendedor', 'vendedor123', 'vendedor', 'vendedor@autocrm.com', '+54 9 11 2233-4455', new Date().toISOString());
    } else {
      db.prepare("UPDATE usuarios SET password_hash = 'vendedor123', activo = 1 WHERE usuario = 'vendedor'").run();
    }
  } catch (e) {
    console.error('[SQLite] Error asegurando usuarios semilla por defecto:', e);
  }
}

// Ensure DB initialization
initDb();
ensureDefaultSeedUsers();
