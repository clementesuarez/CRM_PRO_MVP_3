import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../crm_local.db');
console.log(`[SQLite] Conectando a la base de datos local: ${dbPath}`);

export const db = new Database(dbPath);

// Modo WAL, Pragmas de durabilidad, timeout y claves foráneas
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('recursive_triggers = OFF');

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
      numero_documento TEXT,
      tipo_documento TEXT DEFAULT 'DNI',
      telefono TEXT NOT NULL,
      email TEXT,
      domicilio_calle TEXT,
      domicilio_numero TEXT,
      localidad TEXT,
      provincia TEXT,
      codigo_postal TEXT,
      compro_credito INTEGER DEFAULT 0,
      monto_credito REAL DEFAULT 0,
      deja_auto_permuta INTEGER DEFAULT 0,
      auto_permuta_detalle TEXT,
      tipo_cliente TEXT DEFAULT 'Prospecto',
      notas TEXT,
      ultimo_contacto TEXT,
      created_at TEXT NOT NULL
    );

    -- TABLA CANÓNICA DE STOCK
    CREATE TABLE IF NOT EXISTS inventario (
      id TEXT PRIMARY KEY,
      patente TEXT,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      version TEXT,
      anio INTEGER NOT NULL,
      precio_lista REAL NOT NULL DEFAULT 0,
      costo_compra REAL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'disponible',
      fecha_ingreso TEXT NOT NULL,
      fecha_venta TEXT,
      tipo_vehiculo TEXT,
      numero_chasis TEXT,
      numero_motor TEXT,
      kilometraje INTEGER DEFAULT 0,
      es_cero_km INTEGER DEFAULT 0,
      moneda TEXT DEFAULT 'USD',
      origen_stock TEXT DEFAULT 'Propio',
      dueno_consigna_nombre TEXT,
      dueno_consigna_telefono TEXT,
      dueno_consigna_documento TEXT,
      origen_transaccion TEXT,
      es_solo_compra INTEGER DEFAULT 0,
      fecha_compra TEXT,
      observaciones TEXT,
      created_at TEXT NOT NULL
    );

    -- TABLA DE STOCK LEGACY (REPLICADA EN TIEMPO REAL CON INVENTARIO)
    CREATE TABLE IF NOT EXISTS vehiculos (
      id TEXT PRIMARY KEY,
      patente TEXT,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      version TEXT,
      anio INTEGER NOT NULL,
      precio_venta REAL NOT NULL DEFAULT 0,
      precio_lista REAL DEFAULT 0,
      costo_toma REAL DEFAULT 0,
      costo_compra REAL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'disponible',
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
      dueno_consigna_nombre TEXT,
      dueno_consigna_telefono TEXT,
      dueno_consigna_documento TEXT,
      origen_transaccion TEXT,
      es_solo_compra INTEGER DEFAULT 0,
      fecha_compra TEXT,
      observaciones TEXT
    );

    -- TABLA CANÓNICA DE PRESUPUESTOS
    CREATE TABLE IF NOT EXISTS presupuestos (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL,
      vehiculo_id TEXT,
      precio_ofrecido REAL NOT NULL DEFAULT 0,
      anticipo REAL DEFAULT 0,
      saldo_financiado REAL DEFAULT 0,
      cant_cuotas INTEGER DEFAULT 0,
      valor_cuota REAL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'borrador',
      moneda TEXT DEFAULT 'USD',
      motivo_perdida TEXT,
      vehiculos_cotizados TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    );

    -- TABLA DE COTIZACIONES LEGACY (REPLICADA EN TIEMPO REAL)
    CREATE TABLE IF NOT EXISTS cotizaciones (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL,
      vehiculo_id TEXT,
      precio_vehiculo REAL NOT NULL DEFAULT 0,
      precio_ofrecido REAL NOT NULL DEFAULT 0,
      permuta_monto REAL DEFAULT 0,
      anticipo REAL DEFAULT 0,
      saldo_financiar REAL DEFAULT 0,
      saldo_financiado REAL DEFAULT 0,
      cant_cuotas INTEGER DEFAULT 0,
      valor_cuota REAL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'borrador',
      moneda TEXT DEFAULT 'USD',
      motivo_perdida TEXT,
      vehiculos_cotizados TEXT,
      created_at TEXT NOT NULL
    );

    -- TABLA DE PERMUTAS (TOMA DE USADOS)
    CREATE TABLE IF NOT EXISTS permutas (
      id TEXT PRIMARY KEY,
      presupuesto_id TEXT NOT NULL,
      cotizacion_id TEXT,
      patente TEXT,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      version TEXT,
      marca_modelo TEXT,
      anio INTEGER NOT NULL,
      kilometraje INTEGER NOT NULL DEFAULT 0,
      moneda TEXT DEFAULT 'USD',
      valor_tasacion REAL NOT NULL DEFAULT 0,
      observaciones TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interacciones (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL,
      tipo TEXT NOT NULL,
      nota TEXT NOT NULL,
      accion_siguiente TEXT,
      fecha_contacto TEXT NOT NULL,
      proximo_contacto TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
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
      created_at TEXT NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
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
      created_at TEXT NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reclamos_cobranza (
      id TEXT PRIMARY KEY,
      cuota_id TEXT NOT NULL,
      cliente_id TEXT NOT NULL,
      fecha_contacto TEXT NOT NULL,
      tipo_gestion TEXT NOT NULL,
      resultado_gestion TEXT NOT NULL,
      fecha_compromiso_pago TEXT,
      monto_prometido REAL DEFAULT 0,
      detalle_reclamo TEXT NOT NULL,
      atendido_por TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plantillas_wsp (
      id TEXT PRIMARY KEY,
      modulo TEXT NOT NULL,
      codigo TEXT UNIQUE NOT NULL,
      titulo TEXT NOT NULL,
      contenido TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- TRIGGERS DE REPLICACIÓN AUTOMÁTICA ENTRE VEHICULOS E INVENTARIO
    CREATE TRIGGER IF NOT EXISTS trg_vehiculos_to_inventario_insert
    AFTER INSERT ON vehiculos
    BEGIN
      INSERT INTO inventario (
        id, patente, marca, modelo, version, anio, precio_lista, costo_compra, estado,
        fecha_ingreso, fecha_venta, tipo_vehiculo, numero_chasis, numero_motor,
        kilometraje, es_cero_km, moneda, origen_stock, observaciones, created_at
      ) VALUES (
        NEW.id, NEW.patente, NEW.marca, NEW.modelo, NEW.version, NEW.anio,
        COALESCE(NEW.precio_lista, NEW.precio_venta, 0),
        COALESCE(NEW.costo_compra, NEW.costo_toma, 0),
        LOWER(COALESCE(NEW.estado, 'disponible')),
        COALESCE(NEW.fecha_ingreso, CURRENT_TIMESTAMP),
        NEW.fecha_venta, NEW.tipo_vehiculo, NEW.numero_chasis, NEW.numero_motor,
        COALESCE(NEW.kilometraje, 0), COALESCE(NEW.es_cero_km, 0),
        COALESCE(NEW.moneda, 'USD'), COALESCE(NEW.origen_stock, 'Propio'),
        NEW.observaciones, COALESCE(NEW.fecha_ingreso, CURRENT_TIMESTAMP)
      )
      ON CONFLICT(id) DO UPDATE SET
        patente = excluded.patente,
        marca = excluded.marca,
        modelo = excluded.modelo,
        version = excluded.version,
        anio = excluded.anio,
        precio_lista = excluded.precio_lista,
        costo_compra = excluded.costo_compra,
        estado = excluded.estado,
        fecha_venta = excluded.fecha_venta,
        observaciones = excluded.observaciones;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_vehiculos_to_inventario_update
    AFTER UPDATE ON vehiculos
    BEGIN
      UPDATE inventario SET
        patente = NEW.patente,
        marca = NEW.marca,
        modelo = NEW.modelo,
        version = NEW.version,
        anio = NEW.anio,
        precio_lista = COALESCE(NEW.precio_lista, NEW.precio_venta, 0),
        costo_compra = COALESCE(NEW.costo_compra, NEW.costo_toma, 0),
        estado = LOWER(COALESCE(NEW.estado, 'disponible')),
        fecha_venta = NEW.fecha_venta,
        tipo_vehiculo = NEW.tipo_vehiculo,
        numero_chasis = NEW.numero_chasis,
        numero_motor = NEW.numero_motor,
        kilometraje = COALESCE(NEW.kilometraje, 0),
        es_cero_km = COALESCE(NEW.es_cero_km, 0),
        moneda = COALESCE(NEW.moneda, 'USD'),
        observaciones = NEW.observaciones
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_vehiculos_to_inventario_delete
    AFTER DELETE ON vehiculos
    BEGIN
      DELETE FROM inventario WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_inventario_to_vehiculos_insert
    AFTER INSERT ON inventario
    BEGIN
      INSERT INTO vehiculos (
        id, patente, marca, modelo, version, anio, precio_venta, precio_lista, costo_toma, costo_compra, estado,
        fecha_ingreso, fecha_venta, tipo_vehiculo, numero_chasis, numero_motor,
        kilometraje, es_cero_km, moneda, origen_stock, observaciones
      ) VALUES (
        NEW.id, NEW.patente, NEW.marca, NEW.modelo, NEW.version, NEW.anio,
        NEW.precio_lista, NEW.precio_lista, NEW.costo_compra, NEW.costo_compra, NEW.estado,
        NEW.fecha_ingreso, NEW.fecha_venta, NEW.tipo_vehiculo, NEW.numero_chasis, NEW.numero_motor,
        NEW.kilometraje, NEW.es_cero_km, NEW.moneda, NEW.origen_stock, NEW.observaciones
      )
      ON CONFLICT(id) DO UPDATE SET
        patente = excluded.patente,
        marca = excluded.marca,
        modelo = excluded.modelo,
        precio_venta = excluded.precio_venta,
        precio_lista = excluded.precio_lista,
        costo_toma = excluded.costo_toma,
        costo_compra = excluded.costo_compra,
        estado = excluded.estado,
        fecha_venta = excluded.fecha_venta,
        observaciones = excluded.observaciones;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_inventario_to_vehiculos_update
    AFTER UPDATE ON inventario
    BEGIN
      UPDATE vehiculos SET
        patente = NEW.patente,
        marca = NEW.marca,
        modelo = NEW.modelo,
        version = NEW.version,
        anio = NEW.anio,
        precio_venta = NEW.precio_lista,
        precio_lista = NEW.precio_lista,
        costo_toma = NEW.costo_compra,
        costo_compra = NEW.costo_compra,
        estado = NEW.estado,
        fecha_venta = NEW.fecha_venta,
        observaciones = NEW.observaciones
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_inventario_to_vehiculos_delete
    AFTER DELETE ON inventario
    BEGIN
      DELETE FROM vehiculos WHERE id = OLD.id;
    END;
  `);

  syncExistingTables();
  seedIfEmpty();
}

function syncExistingTables() {
  try {
    // Sincronización automática de columnas para la tabla 'clientes'
    const cliCols = db.prepare('PRAGMA table_info(clientes)').all().map(c => c.name);
    if (!cliCols.includes('numero_documento')) {
      db.exec('ALTER TABLE clientes ADD COLUMN numero_documento TEXT');
      if (cliCols.includes('dni')) {
        db.exec("UPDATE clientes SET numero_documento = dni WHERE (numero_documento IS NULL OR numero_documento = '') AND dni IS NOT NULL");
      }
    }
    if (!cliCols.includes('tipo_documento')) db.exec("ALTER TABLE clientes ADD COLUMN tipo_documento TEXT DEFAULT 'DNI'");
    if (!cliCols.includes('apellido')) db.exec('ALTER TABLE clientes ADD COLUMN apellido TEXT');
    if (!cliCols.includes('email')) db.exec('ALTER TABLE clientes ADD COLUMN email TEXT');
    if (!cliCols.includes('domicilio_calle')) db.exec('ALTER TABLE clientes ADD COLUMN domicilio_calle TEXT');
    if (!cliCols.includes('domicilio_numero')) db.exec('ALTER TABLE clientes ADD COLUMN domicilio_numero TEXT');
    if (!cliCols.includes('localidad')) db.exec('ALTER TABLE clientes ADD COLUMN localidad TEXT');
    if (!cliCols.includes('provincia')) db.exec('ALTER TABLE clientes ADD COLUMN provincia TEXT');
    if (!cliCols.includes('codigo_postal')) db.exec('ALTER TABLE clientes ADD COLUMN codigo_postal TEXT');
    if (!cliCols.includes('compro_credito')) db.exec('ALTER TABLE clientes ADD COLUMN compro_credito INTEGER DEFAULT 0');
    if (!cliCols.includes('monto_credito')) db.exec('ALTER TABLE clientes ADD COLUMN monto_credito REAL DEFAULT 0');
    if (!cliCols.includes('deja_auto_permuta')) db.exec('ALTER TABLE clientes ADD COLUMN deja_auto_permuta INTEGER DEFAULT 0');
    if (!cliCols.includes('auto_permuta_detalle')) db.exec('ALTER TABLE clientes ADD COLUMN auto_permuta_detalle TEXT');
    if (!cliCols.includes('tipo_cliente')) db.exec("ALTER TABLE clientes ADD COLUMN tipo_cliente TEXT DEFAULT 'Prospecto'");
    if (!cliCols.includes('notas')) db.exec('ALTER TABLE clientes ADD COLUMN notas TEXT');
    if (!cliCols.includes('ultimo_contacto')) db.exec('ALTER TABLE clientes ADD COLUMN ultimo_contacto TEXT');

    const vehCols = db.prepare('PRAGMA table_info(vehiculos)').all().map(c => c.name);
    if (!vehCols.includes('precio_lista')) db.exec('ALTER TABLE vehiculos ADD COLUMN precio_lista REAL DEFAULT 0');
    if (!vehCols.includes('costo_compra')) db.exec('ALTER TABLE vehiculos ADD COLUMN costo_compra REAL DEFAULT 0');
    if (!vehCols.includes('dueno_consigna_nombre')) db.exec('ALTER TABLE vehiculos ADD COLUMN dueno_consigna_nombre TEXT');
    if (!vehCols.includes('dueno_consigna_telefono')) db.exec('ALTER TABLE vehiculos ADD COLUMN dueno_consigna_telefono TEXT');
    if (!vehCols.includes('dueno_consigna_documento')) db.exec('ALTER TABLE vehiculos ADD COLUMN dueno_consigna_documento TEXT');
    if (!vehCols.includes('origen_transaccion')) db.exec('ALTER TABLE vehiculos ADD COLUMN origen_transaccion TEXT');
    if (!vehCols.includes('es_solo_compra')) db.exec('ALTER TABLE vehiculos ADD COLUMN es_solo_compra INTEGER DEFAULT 0');
    if (!vehCols.includes('fecha_compra')) db.exec('ALTER TABLE vehiculos ADD COLUMN fecha_compra TEXT');

    const invCols = db.prepare('PRAGMA table_info(inventario)').all().map(c => c.name);
    if (!invCols.includes('precio_venta')) db.exec('ALTER TABLE inventario ADD COLUMN precio_venta REAL DEFAULT 0');
    if (!invCols.includes('costo_toma')) db.exec('ALTER TABLE inventario ADD COLUMN costo_toma REAL DEFAULT 0');
    if (!invCols.includes('dueno_consigna_nombre')) db.exec('ALTER TABLE inventario ADD COLUMN dueno_consigna_nombre TEXT');
    if (!invCols.includes('dueno_consigna_telefono')) db.exec('ALTER TABLE inventario ADD COLUMN dueno_consigna_telefono TEXT');
    if (!invCols.includes('dueno_consigna_documento')) db.exec('ALTER TABLE inventario ADD COLUMN dueno_consigna_documento TEXT');
    if (!invCols.includes('origen_transaccion')) db.exec('ALTER TABLE inventario ADD COLUMN origen_transaccion TEXT');
    if (!invCols.includes('es_solo_compra')) db.exec('ALTER TABLE inventario ADD COLUMN es_solo_compra INTEGER DEFAULT 0');
    if (!invCols.includes('fecha_compra')) db.exec('ALTER TABLE inventario ADD COLUMN fecha_compra TEXT');

    const cotCols = db.prepare('PRAGMA table_info(cotizaciones)').all().map(c => c.name);
    if (!cotCols.includes('precio_ofrecido')) db.exec('ALTER TABLE cotizaciones ADD COLUMN precio_ofrecido REAL DEFAULT 0');
    if (!cotCols.includes('saldo_financiado')) db.exec('ALTER TABLE cotizaciones ADD COLUMN saldo_financiado REAL DEFAULT 0');
    if (!cotCols.includes('vehiculos_cotizados')) db.exec('ALTER TABLE cotizaciones ADD COLUMN vehiculos_cotizados TEXT');

    const permCols = db.prepare('PRAGMA table_info(permutas)').all().map(c => c.name);
    if (!permCols.includes('cotizacion_id')) db.exec('ALTER TABLE permutas ADD COLUMN cotizacion_id TEXT');

    db.exec(`
      INSERT OR IGNORE INTO inventario (
        id, patente, marca, modelo, version, anio, precio_lista, costo_compra, estado,
        fecha_ingreso, fecha_venta, tipo_vehiculo, numero_chasis, numero_motor,
        kilometraje, es_cero_km, moneda, origen_stock, observaciones, created_at
      )
      SELECT
        id, patente, marca, modelo, version, anio,
        COALESCE(precio_lista, precio_venta, 0),
        COALESCE(costo_compra, costo_toma, 0),
        LOWER(COALESCE(estado, 'disponible')),
        COALESCE(fecha_ingreso, CURRENT_TIMESTAMP),
        fecha_venta, tipo_vehiculo, numero_chasis, numero_motor,
        COALESCE(kilometraje, 0), COALESCE(es_cero_km, 0),
        COALESCE(moneda, 'USD'), COALESCE(origen_stock, 'Propio'),
        observaciones, COALESCE(fecha_ingreso, CURRENT_TIMESTAMP)
      FROM vehiculos WHERE id NOT IN (SELECT id FROM inventario);

      INSERT OR IGNORE INTO vehiculos (
        id, patente, marca, modelo, version, anio, precio_venta, precio_lista, costo_toma, costo_compra, estado,
        fecha_ingreso, fecha_venta, tipo_vehiculo, numero_chasis, numero_motor,
        kilometraje, es_cero_km, moneda, origen_stock, observaciones
      )
      SELECT
        id, patente, marca, modelo, version, anio,
        precio_lista, precio_lista, costo_compra, costo_compra, estado,
        fecha_ingreso, fecha_venta, tipo_vehiculo, numero_chasis, numero_motor,
        kilometraje, es_cero_km, moneda, origen_stock, observaciones
      FROM inventario WHERE id NOT IN (SELECT id FROM vehiculos);

      INSERT OR IGNORE INTO cotizaciones (
        id, cliente_id, vehiculo_id, precio_vehiculo, precio_ofrecido, permuta_monto, anticipo,
        saldo_financiar, saldo_financiado, cant_cuotas, valor_cuota, estado, moneda, motivo_perdida,
        vehiculos_cotizados, created_at
      )
      SELECT
        id, cliente_id, vehiculo_id, precio_ofrecido, precio_ofrecido, 0, anticipo,
        saldo_financiado, saldo_financiado, cant_cuotas, valor_cuota, estado, moneda, motivo_perdida,
        vehiculos_cotizados, created_at
      FROM presupuestos WHERE id NOT IN (SELECT id FROM cotizaciones);
    `);
  } catch (err) {
    console.error('[SQLite] Error sincronizando tablas iniciales:', err);
  }
}

function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM usuarios').get().count;
  if (userCount === 0) {
    console.log('[SQLite] Sembrando datos iniciales en crm_local.db...');

    // 1. Usuarios
    const insertUsuario = db.prepare(`
      INSERT INTO usuarios (id, nombre, usuario, password_hash, rol, activo, email, telefono, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUsuario.run('usr-admin-default', 'Administrador General', 'admin', 'admin123', 'admin', 1, 'admin@concesionaria.com', '+54 9 11 0000-1111', '2026-01-01T00:00:00Z');
    insertUsuario.run('usr-vend-1', 'Lucas Rodríguez', 'lucas', 'vend123', 'vendedor', 1, 'lucas.ventas@concesionaria.com', '+54 9 11 2233-4455', '2026-02-01T12:00:00Z');
    insertUsuario.run('usr-super-1', 'Soporte Técnico', 'superadmin', 'super123', 'superadmin', 1, 'soporte@concesionaria.com', '+54 9 11 9999-0000', '2025-12-01T08:00:00Z');

    // 2. Clientes
    const insertCliente = db.prepare(`
      INSERT INTO clientes (id, nombre, apellido, numero_documento, tipo_documento, telefono, email, localidad, provincia, domicilio_calle, domicilio_numero, codigo_postal, compro_credito, monto_credito, deja_auto_permuta, auto_permuta_detalle, tipo_cliente, notas, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCliente.run('c1', 'Carlos', 'Rodríguez', '32.145.890', 'DNI', '5491155443322', 'crodriguez@email.com', 'Balvanera', 'Ciudad Autónoma de Buenos Aires (CABA)', 'Av. Corrientes', '2450', 'C1046', 1, 16000, 1, 'Volkswagen Gol Trend 1.6 (2018) - Patente AC987ZZ', 'Prospecto', 'Interesado en Hilux 4x4 con entrega de usado', '2026-09-01T10:00:00Z');
    insertCliente.run('c2', 'Lucía', 'Benítez', '38.990.112', 'DNI', '5491166778899', 'lbenitez@email.com', 'La Plata', 'Buenos Aires', 'Calle 7', '512', '1900', 0, 0, 0, null, 'No compro', 'Buscaba 208 GT', '2026-07-20T14:30:00Z');
    insertCliente.run('c3', 'Esteban', 'Fernández', '20-35444333-9', 'CUIT', '5491133221100', 'efernandez@email.com', 'Córdoba Capital', 'Córdoba', 'Av. Colón', '1280', '5000', 1, 22500, 0, null, 'Prospecto', 'Consulta por Amarok V6', '2026-09-06T11:20:00Z');

    // 3. Inventario
    const insertInventario = db.prepare(`
      INSERT INTO inventario (id, patente, marca, modelo, version, anio, precio_lista, costo_compra, estado, fecha_ingreso, fecha_venta, tipo_vehiculo, numero_chasis, numero_motor, kilometraje, es_cero_km, moneda, origen_stock, dueno_consigna_nombre, dueno_consigna_telefono, dueno_consigna_documento, origen_transaccion, es_solo_compra, fecha_compra, observaciones, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertInventario.run('v1', 'AF123JK', 'Toyota', 'Hilux', 'SRX 4x4 AT', 2022, 36500, 31000, 'disponible', '2026-08-01T10:00:00Z', null, 'Pick-up / Camioneta', '8AJFA8CB900123456', '1GD5678901', 42000, 0, 'USD', 'Compra Directa', 'Carlos Rodríguez', '5491155443322', '32.145.890', 'Compra Directa a Cliente', 1, '2026-07-28', 'Service oficial Toyota al día.', '2026-08-01T10:00:00Z');
    insertInventario.run('v2', 'AG999ZZ', 'Volkswagen', 'Amarok', 'V6 Extreme', 2024, 48000, 42000, 'disponible', '2026-08-20T10:00:00Z', null, 'Pick-up / Camioneta', 'WVWZZZ2HZH8901234', 'DDX123456', 15000, 0, 'USD', 'Compra Directa', 'Esteban Fernández', '5491133221100', '20-35444333-9', 'Compra Directa a Cliente', 1, '2026-08-15', 'Excelente estado general.', '2026-08-20T10:00:00Z');
    insertInventario.run('v3', 'AE456LM', 'Peugeot', '208', 'GT T200', 2023, 21500, 18000, 'disponible', '2026-08-10T10:00:00Z', null, 'Hatchback', '8ADCCB123456789', 'T200987654', 18500, 0, 'USD', 'Consignación', 'Mariana Gómez', '5491144332211', '34.567.890', 'Consignación', 0, '2026-08-10', 'Techo panorámico, único dueño.', '2026-08-10T10:00:00Z');
    insertInventario.run('v4', 'AD789OP', 'Ford', 'Ranger', 'Limited 3.2', 2021, 31000, 26000, 'reservado', '2026-07-15T10:00:00Z', null, 'Pick-up / Camioneta', '8AF234567890123', 'PUMA32001', 65000, 0, 'USD', 'Propio', null, null, null, 'Stock Propio 0km/Usado', 0, null, 'Seña recibida.', '2026-07-15T10:00:00Z');

    // 4. Presupuestos
    const insertPresupuesto = db.prepare(`
      INSERT INTO presupuestos (id, cliente_id, vehiculo_id, precio_ofrecido, anticipo, saldo_financiado, cant_cuotas, valor_cuota, estado, moneda, motivo_perdida, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPresupuesto.run('p1', 'c1', 'v1', 36000, 20000, 16000, 24, 666, 'enviado', 'USD', null, '2026-09-05T12:00:00Z');
    insertPresupuesto.run('p2', 'c3', 'v2', 47500, 25000, 22500, 18, 1250, 'borrador', 'USD', null, '2026-09-07T09:30:00Z');

    // 5. Permutas
    const insertPermuta = db.prepare(`
      INSERT INTO permutas (id, presupuesto_id, cotizacion_id, patente, marca, modelo, version, marca_modelo, anio, kilometraje, moneda, valor_tasacion, observaciones, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPermuta.run('pm1', 'p1', 'p1', 'AC987ZZ', 'Volkswagen', 'Gol Trend', '1.6 MSI', 'Volkswagen Gol Trend 1.6', 2018, 85000, 'USD', 9500, 'Cubiertas al 70%.', '2026-09-05T12:00:00Z');

    // 6. Interacciones
    const insertInteraccion = db.prepare(`
      INSERT INTO interacciones (id, cliente_id, tipo, nota, accion_siguiente, fecha_contacto, proximo_contacto)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertInteraccion.run('i1', 'c1', 'Vino al salón', 'Probó la Hilux. Pidió plan de financiación.', 'Enviar simulación', '2026-09-05T11:00:00Z', '2026-09-08T15:00:00Z');
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

    const adminExists = db.prepare("SELECT * FROM usuarios WHERE usuario = 'admin'").get();
    if (!adminExists) {
      insertOrUpdate.run('usr-admin-default', 'Administrador General', 'admin', bcrypt.hashSync('admin123', 10), 'admin', 'admin@concesionaria.com', '+54 9 11 0000-1111', new Date().toISOString());
    }

    const superExists = db.prepare("SELECT * FROM usuarios WHERE usuario = 'superadmin'").get();
    if (!superExists) {
      insertOrUpdate.run('usr-super-default', 'Soporte SuperAdmin', 'superadmin', bcrypt.hashSync('superadmin123', 10), 'superadmin', 'soporte@concesionaria.com', '+54 9 11 9999-0000', new Date().toISOString());
    } else if (!superExists.activo) {
      db.prepare("UPDATE usuarios SET activo = 1 WHERE usuario = 'superadmin'").run();
    }

    const vendExists = db.prepare("SELECT * FROM usuarios WHERE usuario = 'vendedor'").get();
    if (!vendExists) {
      insertOrUpdate.run('usr-vend-default', 'Vendedor Salón', 'vendedor', bcrypt.hashSync('vendedor123', 10), 'vendedor', 'vendedor@concesionaria.com', '+54 9 11 2233-4455', new Date().toISOString());
    }

    const clementeExists = db.prepare("SELECT * FROM usuarios WHERE usuario = 'clemente' OR email = 'clemens_arg@hotmail.com'").get();
    if (!clementeExists) {
      insertOrUpdate.run('usr-clemente-dev', 'Clemente Suárez (Dev)', 'clemente', bcrypt.hashSync('superadmin123', 10), 'superadmin', 'clemens_arg@hotmail.com', '+54 9 11 9999-8888', new Date().toISOString());
    }
  } catch (e) {
    console.error('[SQLite] Error asegurando usuarios por defecto:', e);
  }
}

function ensureDefaultPlantillasWsp() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM plantillas_wsp').get();
    if (count.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO plantillas_wsp (id, modulo, codigo, titulo, contenido, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const now = new Date().toISOString();
      const defaults = [
        {
          id: 'pl_1',
          modulo: 'pagares',
          codigo: 'reclamo_mora',
          titulo: 'Mora Vencida (Cobranzas)',
          contenido: 'Hola {nombre_cliente}, te contactamos del área de administración y cobranzas de la Concesionaria. ⚠️📜\n\nTe informamos que tu Pagaré *{numero_pagare}* ({numero_cuota}) por el monto de *{monto_formateado}*, registró fecha de vencimiento el *{fecha_vencimiento}* y figura actualmente impago con mora.\n\nTe solicitamos por favor contactarte a la brevedad para regularizar el estado de tu cuenta o hacernos llegar el comprobante de transferencia correspondiente. ¡Muchas gracias!'
        },
        {
          id: 'pl_2',
          modulo: 'pagares',
          codigo: 'proximo_vencer',
          titulo: 'Recordatorio Próximo a Vencer',
          contenido: 'Hola {nombre_cliente}, te saludamos de la Concesionaria. 🚗📜\n\nTe enviamos un recordatorio sobre tu Pagaré *{numero_pagare}* ({numero_cuota}) por el monto de *{monto_formateado}*, con fecha de vencimiento el *{fecha_vencimiento}*.\n\nQuedamos a tu entera disposición para coordinar el cobro o recibir tu comprobante. ¡Muchas gracias!'
        },
        {
          id: 'pl_3',
          modulo: 'pagares',
          codigo: 'aviso_general',
          titulo: 'Aviso General de Pagos',
          contenido: 'Hola {nombre_cliente}, te saludamos de la Concesionaria respecto a tu plan de pagos y pagarés.\n\nQuedamos a tu entera disposición para cualquier consulta o coordinación de tus cuotas. ¡Saludos cordiales!'
        },
        {
          id: 'pl_4',
          modulo: 'clientes',
          codigo: 'cotizacion',
          titulo: 'Propuesta Comercial / Cotización',
          contenido: 'Hola {nombre_cliente}, te escribo de la agencia respecto al *{vehiculo}*{monto_formateado ? ` (Valor: *{monto_formateado}*)` : ""}.\n\n¿Te gustaría que te envíe los detalles del plan de financiación o la tasación de tu usado en permuta? 🚗✨'
        },
        {
          id: 'pl_5',
          modulo: 'clientes',
          codigo: 'seguimiento',
          titulo: 'Seguimiento Post-Cotización',
          contenido: 'Hola {nombre_cliente}, ¿cómo estás? Te contacto para hacer seguimiento sobre el *{vehiculo}* que estuvimos viendo.\n\n¿Querés que coordinemos para que pases por el salón a probarlo? 🔑'
        }
      ];

      db.transaction(() => {
        defaults.forEach(p => {
          stmt.run(p.id, p.modulo, p.codigo, p.titulo, p.contenido, now, now);
        });
      })();
      console.log('[SQLite] Plantillas de WhatsApp inicializadas en DB.');
    }
  } catch (err) {
    console.error('[SQLite] Error inicializando plantillas de WhatsApp:', err);
  }
}

initDb();
ensureDefaultSeedUsers();
ensureDefaultPlantillasWsp();