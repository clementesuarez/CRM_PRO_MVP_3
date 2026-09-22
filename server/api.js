import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

export const router = express.Router();

router.get('/network-info', (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    let localIp = '127.0.0.1';

    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
          localIp = net.address;
          break;
        }
      }
      if (localIp !== '127.0.0.1') break;
    }

    const port = process.env.PORT || 5173;
    const url = `http://${localIp}:${port}`;

    res.json({
      success: true,
      ip: localIp,
      port: String(port),
      url: url,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, ip: '127.0.0.1', port: '5173', url: 'http://localhost:5173' });
  }
});

// -----------------------------------------------------------------------------
// MIDDLEWARE DE SEGURIDAD & ROTACIÓN DE BACKUPS
// -----------------------------------------------------------------------------
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const roleHeader = req.headers['x-user-role'];
    const roleQuery = req.query.rol;
    const roleBody = req.body?.rol || req.body?.userRole;
    const userRole = String(roleHeader || roleQuery || roleBody || 'vendedor').toLowerCase();
    const isAllowed = allowedRoles.map(r => r.toLowerCase()).includes(userRole);
    if (!isAllowed) {
      return res.status(403).json({
        error: `Acceso denegado. Se requieren permisos de [${allowedRoles.join(', ')}] para realizar esta operación.`
      });
    }
    next();
  };
};

function rotateBackups(backupDir, maxKeep = 10) {
  try {
    if (!fs.existsSync(backupDir)) return;
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db') || f.endsWith('.sqlite'))
      .map(f => {
        const fullPath = path.join(backupDir, f);
        return {
          name: f,
          path: fullPath,
          mtime: fs.statSync(fullPath).mtime.getTime()
        };
      })
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > maxKeep) {
      const toDelete = files.slice(maxKeep);
      toDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`[Backup System] Autopurgada copia antigua: ${file.name}`);
        } catch (e) {
          console.error(`[Backup System] Error purgando copia antigua ${file.name}:`, e);
        }
      });
    }
  } catch (err) {
    console.error('[Backup System] Error en la rotación de copias de seguridad:', err);
  }
}

// -----------------------------------------------------------------------------
// HELPERS DE NORMALIZACIÓN
// -----------------------------------------------------------------------------
function formatCliente(row) {
  if (!row) return null;
  return {
    ...row,
    numero_documento: row.numero_documento || row.dni || '',
    compro_credito: Boolean(row.compro_credito),
    deja_auto_permuta: Boolean(row.deja_auto_permuta),
  };
}

function formatInventario(row) {
  if (!row) return null;
  return {
    ...row,
    precio_lista: row.precio_lista ?? row.precio_venta ?? 0,
    costo_compra: row.costo_compra ?? row.costo_toma ?? 0,
    estado: (row.estado || 'disponible').toLowerCase(),
    es_cero_km: Boolean(row.es_cero_km),
    es_solo_compra: Boolean(row.es_solo_compra),
    created_at: row.created_at || row.fecha_ingreso || new Date().toISOString()
  };
}

function formatPresupuesto(row) {
  if (!row) return null;
  let vehiculos_cotizados = undefined;
  if (row.vehiculos_cotizados) {
    try {
      vehiculos_cotizados = typeof row.vehiculos_cotizados === 'string'
        ? JSON.parse(row.vehiculos_cotizados)
        : row.vehiculos_cotizados;
    } catch {
      vehiculos_cotizados = undefined;
    }
  }
  return {
    ...row,
    precio_ofrecido: row.precio_ofrecido ?? row.precio_vehiculo ?? 0,
    saldo_financiado: row.saldo_financiado ?? row.saldo_financiar ?? 0,
    estado: (row.estado || 'borrador').toLowerCase(),
    vehiculos_cotizados
  };
}

function formatPagare(row) {
  if (!row) return null;
  return {
    ...row,
    prestamo_id: row.cotizacion_id || row.prestamo_id,
    numero_cuota: row.nro_cuota ?? row.numero_cuota ?? 1,
    monto_cuota: row.monto ?? row.monto_cuota ?? 0
  };
}

// -----------------------------------------------------------------------------
// CLIENTES
// -----------------------------------------------------------------------------
router.get('/clientes', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM clientes ORDER BY created_at DESC').all();
    res.json(rows.map(formatCliente));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clientes', (req, res) => {
  try {
    console.log('[API POST /clientes]', req.body);
    const c = req.body || {};
    const id = c.id || ('c_' + Date.now());
    const created_at = c.created_at || new Date().toISOString();
    const rawDoc = String(c.numero_documento || c.dni || '').trim();
    const numero_documento = rawDoc.replace(/[^0-9A-Za-z]/g, '');
    const telefono = String(c.telefono || '').trim() || 'Sin teléfono';
    const nombre = String(c.nombre || 'Cliente sin nombre').trim();

    const stmt = db.prepare(`
      INSERT INTO clientes (
        id, nombre, apellido, numero_documento, tipo_documento, telefono, email,
        domicilio_calle, domicilio_numero, localidad, provincia, codigo_postal,
        compro_credito, monto_credito, deja_auto_permuta, auto_permuta_detalle,
        tipo_cliente, notas, ultimo_contacto, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        nombre = excluded.nombre,
        apellido = excluded.apellido,
        numero_documento = excluded.numero_documento,
        tipo_documento = excluded.tipo_documento,
        telefono = excluded.telefono,
        email = excluded.email,
        domicilio_calle = excluded.domicilio_calle,
        domicilio_numero = excluded.domicilio_numero,
        localidad = excluded.localidad,
        provincia = excluded.provincia,
        codigo_postal = excluded.codigo_postal,
        compro_credito = excluded.compro_credito,
        monto_credito = excluded.monto_credito,
        deja_auto_permuta = excluded.deja_auto_permuta,
        auto_permuta_detalle = excluded.auto_permuta_detalle,
        tipo_cliente = excluded.tipo_cliente,
        notas = excluded.notas,
        ultimo_contacto = excluded.ultimo_contacto
    `);

    stmt.run(
      id, nombre, c.apellido || null, numero_documento, c.tipo_documento || 'DNI',
      telefono, c.email || null, c.domicilio_calle || null, c.domicilio_numero || null,
      c.localidad || null, c.provincia || null, c.codigo_postal || null,
      c.compro_credito ? 1 : 0, c.monto_credito || 0, c.deja_auto_permuta ? 1 : 0,
      c.auto_permuta_detalle || null, c.tipo_cliente || 'Prospecto', c.notas || null,
      c.ultimo_contacto || null, created_at
    );

    const created = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(formatCliente(created));
  } catch (err) {
    console.error('[API POST /clientes Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/clientes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const c = req.body;
    const numero_documento = c.numero_documento || c.dni || '';

    const stmt = db.prepare(`
      UPDATE clientes SET
        nombre = ?, apellido = ?, numero_documento = ?, tipo_documento = ?, telefono = ?,
        email = ?, domicilio_calle = ?, domicilio_numero = ?, localidad = ?, provincia = ?,
        codigo_postal = ?, compro_credito = ?, monto_credito = ?, deja_auto_permuta = ?,
        auto_permuta_detalle = ?, tipo_cliente = ?, notas = ?, ultimo_contacto = ?
      WHERE id = ?
    `);

    stmt.run(
      c.nombre || '', c.apellido || null, numero_documento, c.tipo_documento || 'DNI',
      c.telefono || '', c.email || null, c.domicilio_calle || null, c.domicilio_numero || null,
      c.localidad || null, c.provincia || null, c.codigo_postal || null,
      c.compro_credito ? 1 : 0, c.monto_credito || 0, c.deja_auto_permuta ? 1 : 0,
      c.auto_permuta_detalle || null, c.tipo_cliente || 'Prospecto', c.notas || null,
      c.ultimo_contacto || null, id
    );

    const updated = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    res.json(formatCliente(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// INVENTARIO / VEHICULOS
// -----------------------------------------------------------------------------
const handleGetInventario = (req, res) => {
  try {
    const rol = req.query.rol || 'admin';
    const rows = db.prepare('SELECT * FROM inventario ORDER BY fecha_ingreso DESC').all();
    const list = rows.map(formatInventario);

    if (rol === 'vendedor') {
      return res.json(list.map(v => ({ ...v, costo_compra: 0 })));
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/inventario', handleGetInventario);
router.get('/vehiculos', handleGetInventario);

const handlePostInventario = (req, res) => {
  try {
    const v = req.body;
    const id = v.id || ('v_' + Date.now());
    const fecha_ingreso = v.fecha_ingreso || v.created_at || new Date().toISOString();
    const precio_lista = v.precio_lista ?? v.precio_venta ?? 0;
    const costo_compra = v.costo_compra ?? v.costo_toma ?? 0;
    const estado = (v.estado || 'disponible').toLowerCase();

    const stmt = db.prepare(`
      INSERT INTO inventario (
        id, patente, marca, modelo, version, anio, precio_lista, costo_compra, estado,
        fecha_ingreso, fecha_venta, tipo_vehiculo, numero_chasis, numero_motor,
        kilometraje, es_cero_km, moneda, origen_stock, dueno_consigna_nombre,
        dueno_consigna_telefono, dueno_consigna_documento, origen_transaccion,
        es_solo_compra, fecha_compra, observaciones, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, v.patente ? v.patente.toUpperCase().trim() : null, v.marca || '', v.modelo || '', v.version || null,
      v.anio || new Date().getFullYear(), precio_lista, costo_compra, estado,
      fecha_ingreso, v.fecha_venta || null, v.tipo_vehiculo || 'Sedán',
      v.numero_chasis ? v.numero_chasis.toUpperCase().trim() : null,
      v.numero_motor ? v.numero_motor.toUpperCase().trim() : null,
      v.kilometraje || 0, v.es_cero_km ? 1 : 0, v.moneda || 'USD', v.origen_stock || 'Propio',
      v.dueno_consigna_nombre || null, v.dueno_consigna_telefono || null,
      v.dueno_consigna_documento || null, v.origen_transaccion || null,
      v.es_solo_compra ? 1 : 0, v.fecha_compra || null, v.observaciones || null,
      fecha_ingreso
    );

    const created = db.prepare('SELECT * FROM inventario WHERE id = ?').get(id);
    res.status(201).json(formatInventario(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/inventario', handlePostInventario);
router.post('/vehiculos', handlePostInventario);

const handlePutInventario = (req, res) => {
  try {
    const { id } = req.params;
    const v = req.body;
    const rol = req.query.rol || 'admin';

    const existing = db.prepare('SELECT * FROM inventario WHERE id = ?').get(id);
    const precio_lista = v.precio_lista ?? v.precio_venta ?? (existing?.precio_lista || 0);
    const costo_compra = (rol === 'vendedor' && existing)
      ? existing.costo_compra
      : (v.costo_compra ?? v.costo_toma ?? (existing?.costo_compra || 0));
    const estado = (v.estado || existing?.estado || 'disponible').toLowerCase();

    const stmt = db.prepare(`
      UPDATE inventario SET
        patente = ?, marca = ?, modelo = ?, version = ?, anio = ?, precio_lista = ?,
        costo_compra = ?, estado = ?, fecha_venta = ?, tipo_vehiculo = ?,
        numero_chasis = ?, numero_motor = ?, kilometraje = ?, es_cero_km = ?,
        moneda = ?, origen_stock = ?, dueno_consigna_nombre = ?, dueno_consigna_telefono = ?,
        dueno_consigna_documento = ?, origen_transaccion = ?, es_solo_compra = ?,
        fecha_compra = ?, observaciones = ?
      WHERE id = ?
    `);

    stmt.run(
      v.patente ? v.patente.toUpperCase().trim() : null, v.marca || '', v.modelo || '', v.version || null,
      v.anio || new Date().getFullYear(), precio_lista, costo_compra, estado,
      v.fecha_venta || null, v.tipo_vehiculo || 'Sedán',
      v.numero_chasis ? v.numero_chasis.toUpperCase().trim() : null,
      v.numero_motor ? v.numero_motor.toUpperCase().trim() : null,
      v.kilometraje || 0, v.es_cero_km ? 1 : 0, v.moneda || 'USD', v.origen_stock || 'Propio',
      v.dueno_consigna_nombre || null, v.dueno_consigna_telefono || null,
      v.dueno_consigna_documento || null, v.origen_transaccion || null,
      v.es_solo_compra ? 1 : 0, v.fecha_compra || null, v.observaciones || null, id
    );

    const updated = db.prepare('SELECT * FROM inventario WHERE id = ?').get(id);
    res.json(formatInventario(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.put('/inventario/:id', handlePutInventario);
router.put('/vehiculos/:id', handlePutInventario);

const handlePatchEstadoInventario = (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha_venta } = req.body;
    const normEstado = (estado || 'disponible').toLowerCase();

    let query = 'UPDATE inventario SET estado = ?';
    const params = [normEstado];

    if (normEstado === 'vendido') {
      query += ', fecha_venta = ?';
      params.push(fecha_venta || new Date().toISOString().split('T')[0]);
    }
    query += ' WHERE id = ?';
    params.push(id);

    db.prepare(query).run(...params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.patch('/inventario/:id/estado', handlePatchEstadoInventario);
router.patch('/vehiculos/:id/estado', handlePatchEstadoInventario);

const handleDeleteInventario = (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM inventario WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.delete('/inventario/:id', requireRole(['admin', 'superadmin', 'gerente']), handleDeleteInventario);
router.delete('/vehiculos/:id', requireRole(['admin', 'superadmin', 'gerente']), handleDeleteInventario);

// -----------------------------------------------------------------------------
// PRESUPUESTOS / COTIZACIONES
// -----------------------------------------------------------------------------
const handleGetPresupuestos = (req, res) => {
  try {
    const rol = req.query.rol || 'admin';
    const rows = db.prepare('SELECT * FROM presupuestos ORDER BY created_at DESC').all();
    const clientes = db.prepare('SELECT * FROM clientes').all().map(formatCliente);
    const inventario = db.prepare('SELECT * FROM inventario').all().map(formatInventario);
    const permutas = db.prepare('SELECT * FROM permutas').all();

    const list = rows.map(formatPresupuesto).map(p => {
      const cli = clientes.find(cl => cl.id === p.cliente_id);
      let veh = inventario.find(v => v.id === p.vehiculo_id);
      if (rol === 'vendedor' && veh) {
        veh = { ...veh, costo_compra: 0 };
      }
      const pm = permutas.find(item => item.presupuesto_id === p.id);
      return {
        ...p,
        cliente: cli,
        vehiculo: veh,
        permuta: pm
      };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/presupuestos', handleGetPresupuestos);
router.get('/cotizaciones', handleGetPresupuestos);

const handlePostPresupuestos = (req, res) => {
  try {
    const body = req.body || {};
    const p = body.presupuesto || (body.cliente_id ? body : body);
    const permuta = body.permuta || p.permuta;
    const nuevoCliente = body.nuevoCliente || body.nuevoClienteObj || body.clienteData;

    let finalClienteId = p.cliente_id;

    const result = db.transaction(() => {
      // 1. Alta o actualización de nuevo cliente en caso de venir en el payload
      if (nuevoCliente && (nuevoCliente.nombre || nuevoCliente.telefono)) {
        const cliId = nuevoCliente.id || ('c_' + Date.now() + Math.random().toString(36).substring(2, 5));
        const numDoc = nuevoCliente.numero_documento || nuevoCliente.dni || '';

        db.prepare(`
          INSERT INTO clientes (
            id, nombre, apellido, numero_documento, tipo_documento, telefono, email,
            domicilio_calle, domicilio_numero, localidad, provincia, codigo_postal,
            compro_credito, monto_credito, deja_auto_permuta, auto_permuta_detalle,
            tipo_cliente, notas, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            nombre = excluded.nombre,
            telefono = excluded.telefono,
            email = excluded.email,
            numero_documento = excluded.numero_documento
        `).run(
          cliId, nuevoCliente.nombre || '', nuevoCliente.apellido || null, numDoc,
          nuevoCliente.tipo_documento || 'DNI', nuevoCliente.telefono || '', nuevoCliente.email || null,
          nuevoCliente.domicilio_calle || null, nuevoCliente.domicilio_numero || null,
          nuevoCliente.localidad || null, nuevoCliente.provincia || null, nuevoCliente.codigo_postal || null,
          nuevoCliente.compro_credito ? 1 : 0, nuevoCliente.monto_credito || 0,
          nuevoCliente.deja_auto_permuta ? 1 : 0, nuevoCliente.auto_permuta_detalle || null,
          nuevoCliente.tipo_cliente || 'Prospecto', nuevoCliente.notas || null,
          nuevoCliente.created_at || new Date().toISOString()
        );

        finalClienteId = cliId;
      }

      // 2. Inserción o actualización del presupuesto
      const id = p.id || ('p_' + Date.now());
      const created_at = p.created_at || new Date().toISOString();
      const precio_ofrecido = Number(p.precio_ofrecido ?? p.precio_vehiculo ?? 0);
      const anticipo = Number(p.anticipo || 0);
      const saldo_financiado = Number(p.saldo_financiado ?? p.saldo_financiar ?? 0);
      const cant_cuotas = Number(p.cant_cuotas || 0);
      const valor_cuota = Number(p.valor_cuota || 0);
      const estado = (p.estado || 'borrador').toLowerCase();
      const moneda = p.moneda || 'USD';

      let vehiculo_id = p.vehiculo_id || null;
      let vehiculos_cotizados_str = null;

      if (p.vehiculos_cotizados) {
        vehiculos_cotizados_str = typeof p.vehiculos_cotizados === 'string'
          ? p.vehiculos_cotizados
          : JSON.stringify(p.vehiculos_cotizados);
        if (!vehiculo_id && Array.isArray(p.vehiculos_cotizados) && p.vehiculos_cotizados.length > 0) {
          vehiculo_id = p.vehiculos_cotizados[0].vehiculo_id || null;
        }
      }

      db.prepare(`
        INSERT INTO presupuestos (
          id, cliente_id, vehiculo_id, precio_ofrecido, anticipo, saldo_financiado,
          cant_cuotas, valor_cuota, estado, moneda, motivo_perdida, vehiculos_cotizados, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          cliente_id = excluded.cliente_id,
          vehiculo_id = excluded.vehiculo_id,
          precio_ofrecido = excluded.precio_ofrecido,
          anticipo = excluded.anticipo,
          saldo_financiado = excluded.saldo_financiado,
          cant_cuotas = excluded.cant_cuotas,
          valor_cuota = excluded.valor_cuota,
          estado = excluded.estado,
          moneda = excluded.moneda,
          motivo_perdida = excluded.motivo_perdida,
          vehiculos_cotizados = excluded.vehiculos_cotizados
      `).run(
        id, finalClienteId, vehiculo_id, precio_ofrecido, anticipo,
        saldo_financiado, cant_cuotas, valor_cuota, estado, moneda,
        p.motivo_perdida || null, vehiculos_cotizados_str, created_at
      );

      db.prepare(`
        INSERT INTO cotizaciones (
          id, cliente_id, vehiculo_id, precio_vehiculo, precio_ofrecido, permuta_monto, anticipo,
          saldo_financiar, saldo_financiado, cant_cuotas, valor_cuota, estado, moneda, motivo_perdida,
          vehiculos_cotizados, created_at
        ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          cliente_id = excluded.cliente_id,
          vehiculo_id = excluded.vehiculo_id,
          precio_ofrecido = excluded.precio_ofrecido,
          anticipo = excluded.anticipo,
          saldo_financiado = excluded.saldo_financiado,
          estado = excluded.estado,
          moneda = excluded.moneda,
          vehiculos_cotizados = excluded.vehiculos_cotizados
      `).run(
        id, finalClienteId, vehiculo_id, precio_ofrecido, precio_ofrecido, anticipo,
        saldo_financiado, saldo_financiado, cant_cuotas, valor_cuota, estado, moneda,
        p.motivo_perdida || null, vehiculos_cotizados_str, created_at
      );

      // 3. Inserción de permuta asociada
      if (permuta && (permuta.marca || permuta.marca_modelo || permuta.valor_tasacion)) {
        try {
          const permCols = db.prepare('PRAGMA table_info(permutas)').all().map(c => c.name);
          if (permCols.includes('cotizacion_id')) {
            db.prepare('DELETE FROM permutas WHERE presupuesto_id = ? OR cotizacion_id = ?').run(id, id);
          } else {
            db.prepare('DELETE FROM permutas WHERE presupuesto_id = ?').run(id);
          }
        } catch (e) {}

        const pmId = permuta.id || ('pm_' + Date.now());
        const marca = permuta.marca || permuta.marca_modelo?.split(' ')[0] || 'Usado';
        const modelo = permuta.modelo || permuta.marca_modelo?.split(' ').slice(1).join(' ') || 'Permuta';
        const marca_modelo = permuta.marca_modelo || `${marca} ${modelo}`.trim();

        const permCols = db.prepare('PRAGMA table_info(permutas)').all().map(c => c.name);
        if (permCols.includes('cotizacion_id')) {
          db.prepare(`
            INSERT INTO permutas (
              id, presupuesto_id, cotizacion_id, patente, marca, modelo, version, marca_modelo,
              anio, kilometraje, moneda, valor_tasacion, observaciones, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            pmId, id, id, permuta.patente ? permuta.patente.toUpperCase().trim() : null,
            marca, modelo, permuta.version || null, marca_modelo,
            permuta.anio || new Date().getFullYear(), permuta.kilometraje || 0,
            permuta.moneda || moneda || 'USD', Number(permuta.valor_tasacion || 0),
            permuta.observaciones || null, created_at
          );
        } else {
          db.prepare(`
            INSERT INTO permutas (
              id, presupuesto_id, patente, marca, modelo, version, marca_modelo,
              anio, kilometraje, moneda, valor_tasacion, observaciones, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            pmId, id, permuta.patente ? permuta.patente.toUpperCase().trim() : null,
            marca, modelo, permuta.version || null, marca_modelo,
            permuta.anio || new Date().getFullYear(), permuta.kilometraje || 0,
            permuta.moneda || moneda || 'USD', Number(permuta.valor_tasacion || 0),
            permuta.observaciones || null, created_at
          );
        }
      }

      return db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(id);
    })();

    res.status(201).json(formatPresupuesto(result));
  } catch (err) {
    console.error('[SQLite] Error guardando presupuesto:', err);
    res.status(500).json({ error: err.message });
  }
};

router.post('/presupuestos', handlePostPresupuestos);
router.post('/cotizaciones', handlePostPresupuestos);

const handlePatchEstadoPresupuesto = (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo_perdida, fecha_venta } = req.body;
    let rawEstado = (estado || 'borrador').toLowerCase();
    if (rawEstado === 'cerrado_ganado' || rawEstado === 'ganada') rawEstado = 'ganado';
    if (rawEstado === 'cerrado_perdido' || rawEstado === 'perdida') rawEstado = 'perdido';

    const normEstado = rawEstado;
    const saleDate = fecha_venta || new Date().toISOString().split('T')[0];

    db.transaction(() => {
      db.prepare(`
        UPDATE presupuestos SET estado = ?, motivo_perdida = ? WHERE id = ?
      `).run(normEstado, motivo_perdida || null, id);

      db.prepare(`
        UPDATE cotizaciones SET estado = ?, motivo_perdida = ? WHERE id = ?
      `).run(normEstado, motivo_perdida || null, id);

      const isGanado = normEstado === 'ganado';
      const isPerdido = normEstado === 'perdido';
      
      let pres = db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(id);
      if (!pres) {
        pres = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(id);
      }

      if (pres) {
        if (isGanado) {
          const vIds = new Set();
          if (pres.vehiculo_id) vIds.add(pres.vehiculo_id);
          if (pres.vehiculos_cotizados) {
            try {
              const parsed = typeof pres.vehiculos_cotizados === 'string' ? JSON.parse(pres.vehiculos_cotizados) : pres.vehiculos_cotizados;
              if (Array.isArray(parsed)) {
                parsed.forEach(v => {
                  if (typeof v === 'string') vIds.add(v);
                  else if (v && v.id) vIds.add(v.id);
                  else if (v && v.vehiculo_id) vIds.add(v.vehiculo_id);
                });
              }
            } catch (e) {}
          }

          // Prevención de venta duplicada
          const alreadySold = [];
          vIds.forEach(vId => {
            const vCheck = db.prepare("SELECT * FROM inventario WHERE id = ?").get(vId) ||
                           db.prepare("SELECT * FROM vehiculos WHERE id = ?").get(vId);
            if (vCheck && String(vCheck.estado).toLowerCase() === 'vendido') {
              alreadySold.push(vCheck.marca ? `${vCheck.marca} ${vCheck.modelo} (${vCheck.patente || vId})` : vId);
            }
          });

          if (alreadySold.length > 0) {
            const err = new Error(`CONFLICT_SOLD: La unidad [${alreadySold.join(', ')}] ya se encuentra vendida en otra operación.`);
            throw err;
          }

          vIds.forEach(vId => {
            db.prepare("UPDATE inventario SET estado = 'vendido', fecha_venta = ? WHERE id = ?")
              .run(saleDate, vId);
            db.prepare("UPDATE vehiculos SET estado = 'vendido', fecha_venta = ? WHERE id = ?")
              .run(saleDate, vId);
          });

          if (pres.cliente_id) {
            db.prepare("UPDATE clientes SET tipo_cliente = 'Comprador' WHERE id = ?")
              .run(pres.cliente_id);
          }

          const permCols = db.prepare('PRAGMA table_info(permutas)').all().map(c => c.name);
          const pm = permCols.includes('cotizacion_id')
            ? db.prepare('SELECT * FROM permutas WHERE presupuesto_id = ? OR cotizacion_id = ?').get(id, id)
            : db.prepare('SELECT * FROM permutas WHERE presupuesto_id = ?').get(id);
          if (pm) {
            const newVehId = 'v_toma_' + Date.now();
            db.prepare(`
              INSERT INTO inventario (
                id, patente, marca, modelo, version, anio, precio_lista, costo_compra,
                estado, fecha_ingreso, kilometraje, es_cero_km, moneda, origen_stock,
                origen_transaccion, observaciones, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'reacondicionamiento', ?, ?, 0, ?, 'Permuta', 'Toma en Permuta por Venta', ?, ?)
            `).run(
              newVehId, pm.patente || ('PER-' + Math.floor(Math.random() * 1000)),
              pm.marca || pm.marca_modelo?.split(' ')[0] || 'Usado',
              pm.modelo || pm.marca_modelo?.split(' ').slice(1).join(' ') || 'Permuta',
              pm.version || null, pm.anio || new Date().getFullYear(),
              Math.round((pm.valor_tasacion || 0) * 1.18), pm.valor_tasacion || 0,
              new Date().toISOString().split('T')[0], pm.kilometraje || 0,
              pm.moneda || 'USD', `Tomado en permuta por presupuesto #${id}. ${pm.observaciones || ''}`.trim(),
              new Date().toISOString()
            );
          }
        } else if (isPerdido && pres.cliente_id) {
          db.prepare("UPDATE clientes SET tipo_cliente = 'No compro' WHERE id = ?")
            .run(pres.cliente_id);
        }
      }
    })();

    res.json({ success: true, estado: normEstado });
  } catch (err) {
    if (err.message && err.message.startsWith('CONFLICT_SOLD:')) {
      return res.status(409).json({ error: err.message.replace('CONFLICT_SOLD:', '').trim() });
    }
    console.error('Error actualizando estado del presupuesto:', err);
    res.status(500).json({ error: err.message });
  }
};

router.patch('/presupuestos/:id/estado', handlePatchEstadoPresupuesto);
router.patch('/cotizaciones/:id/estado', handlePatchEstadoPresupuesto);

// -----------------------------------------------------------------------------
// DASHBOARD METRICS (EN TIEMPO REAL)
// -----------------------------------------------------------------------------
router.get('/dashboard/metrics', (req, res) => {
  try {
    const totalLeads = db.prepare('SELECT COUNT(*) as c FROM clientes').get().c;
    const presupuestos = db.prepare('SELECT * FROM presupuestos').all();
    const totalPresupuestos = presupuestos.length;
    const autosVendidosMes = presupuestos.filter(p => (p.estado || '').toLowerCase() === 'ganado').length;
    const tasaConversion = totalPresupuestos > 0 ? Math.round((autosVendidosMes / totalPresupuestos) * 100) : 0;

    const stock = db.prepare("SELECT * FROM inventario WHERE estado = 'disponible'").all();
    const stockDisponibleCount = stock.length;

    let valorTotalStockUSD = 0;
    let valorTotalStockARS = 0;
    stock.forEach(v => {
      if (v.moneda === 'ARS') valorTotalStockARS += (v.precio_lista || 0);
      else valorTotalStockUSD += (v.precio_lista || 0);
    });

    const motivosMap = {};
    presupuestos.filter(p => (p.estado || '').toLowerCase() === 'perdido' && p.motivo_perdida).forEach(p => {
      motivosMap[p.motivo_perdida] = (motivosMap[p.motivo_perdida] || 0) + 1;
    });

    const motivosPerdida = Object.keys(motivosMap).map(m => ({
      motivo: m,
      cantidad: motivosMap[m]
    }));

    // Evolución de ventas simulada o agregada por mes
    const evolucionVentas = [
      { mes: 'Mayo', monto: Math.round(valorTotalStockUSD * 0.25) },
      { mes: 'Junio', monto: Math.round(valorTotalStockUSD * 0.35) },
      { mes: 'Julio', monto: Math.round(valorTotalStockUSD * 0.45) },
      { mes: 'Agosto', monto: Math.round(valorTotalStockUSD * 0.60) },
      { mes: 'Septiembre', monto: Math.round(valorTotalStockUSD * 0.80) },
    ];

    res.json({
      totalLeads,
      totalPresupuestos,
      tasaConversion,
      diasPromedioStock: 38,
      autosVendidosMes,
      stockDisponibleCount,
      valorTotalStockUSD,
      valorTotalStockARS,
      motivosPerdida,
      evolucionVentas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// PAGARES & PRESTAMOS
// -----------------------------------------------------------------------------
router.get('/pagares', (req, res) => {
  try {
    const rol = req.query.rol || 'admin';
    if (rol === 'vendedor') return res.json([]);

    const rows = db.prepare('SELECT * FROM pagares ORDER BY fecha_vencimiento ASC').all();
    const clientes = db.prepare('SELECT * FROM clientes').all().map(formatCliente);

    const list = rows.map(formatPagare).map(p => {
      const cli = clientes.find(c => c.id === p.cliente_id);
      return {
        ...p,
        cliente: cli,
        cliente_id: cli?.id || p.cliente_id
      };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pagares', (req, res) => {
  try {
    const { prestamo, numeroPagareInicial = 'PAG-0001' } = req.body;
    const p = prestamo || req.body;
    const prestamoId = p.id || ('prest_' + Date.now());
    const created_at = new Date().toISOString();

    const prefix = numeroPagareInicial.replace(/\d+$/, '') || 'PAG-';
    const fechaInicio = new Date(p.fecha_otorgamiento || new Date());

    const insertCuota = db.prepare(`
      INSERT INTO pagares (
        id, cotizacion_id, cliente_id, nro_cuota, monto, fecha_vencimiento, estado,
        numero_pagare, moneda, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?)
    `);

    for (let i = 1; i <= p.cantidad_cuotas; i++) {
      const fechaVenc = new Date(fechaInicio);
      fechaVenc.setMonth(fechaVenc.getMonth() + i);
      const cuotaId = `cuota_${prestamoId}_${i}`;
      const numPagare = `${prefix}${String(i).padStart(4, '0')}`;

      insertCuota.run(
        cuotaId, prestamoId, p.cliente_id, i, p.monto_cuota_promedio,
        fechaVenc.toISOString().split('T')[0], numPagare, p.moneda || 'USD', created_at
      );
    }

    res.status(201).json({ id: prestamoId, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/pagares/:id/pago', (req, res) => {
  try {
    const { id } = req.params;
    const { monto_pagado, comprobante_pago, observaciones, fecha_pago } = req.body;
    const fecha = fecha_pago || new Date().toISOString();

    db.prepare(`
      UPDATE pagares SET
        estado = 'Cobrado', monto_pagado = ?, comprobante_pago = ?, observaciones = ?, fecha_pago = ?
      WHERE id = ?
    `).run(monto_pagado, comprobante_pago || null, observaciones || null, fecha, id);

    const cuota = db.prepare('SELECT * FROM pagares WHERE id = ?').get(id);
    if (cuota && cuota.cliente_id) {
      const newIntId = 'int_cobro_' + Date.now();
      const montoText = `${cuota.moneda === 'ARS' ? '$' : 'USD '}${monto_pagado.toLocaleString('es-AR')}`;
      const compText = comprobante_pago ? ` (Comprobante: ${comprobante_pago})` : '';

      db.prepare(`
        INSERT INTO interacciones (id, cliente_id, tipo, nota, fecha_contacto)
        VALUES (?, ?, 'Cobro Pagaré', ?, ?)
      `).run(
        newIntId, cuota.cliente_id,
        `Cobro registrado: ${cuota.numero_pagare || `Cuota ${cuota.nro_cuota}`} por ${montoText}.${compText}`,
        new Date().toISOString()
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const handleUpdatePagare = (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = db.prepare('SELECT * FROM pagares WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Pagaré no encontrado' });
    }

    const fecha_vencimiento = body.fecha_vencimiento !== undefined ? body.fecha_vencimiento : existing.fecha_vencimiento;
    const numero_pagare = body.numero_pagare !== undefined ? body.numero_pagare : existing.numero_pagare;
    const monto = body.monto_cuota !== undefined ? Number(body.monto_cuota) : (body.monto !== undefined ? Number(body.monto) : existing.monto);
    const estado = body.estado !== undefined ? body.estado : existing.estado;
    const observaciones = body.observaciones !== undefined ? body.observaciones : existing.observaciones;
    const comprobante_pago = body.comprobante_pago !== undefined ? body.comprobante_pago : existing.comprobante_pago;
    const fecha_pago = body.fecha_pago !== undefined ? body.fecha_pago : existing.fecha_pago;
    const monto_pagado = body.monto_pagado !== undefined ? Number(body.monto_pagado) : existing.monto_pagado;

    if (monto < 0 || (monto_pagado !== undefined && monto_pagado < 0)) {
      return res.status(400).json({ error: 'El monto del pagaré o del pago no puede ser un número negativo.' });
    }
    if (fecha_vencimiento && isNaN(Date.parse(fecha_vencimiento))) {
      return res.status(400).json({ error: 'La fecha de vencimiento no tiene un formato válido (YYYY-MM-DD).' });
    }

    db.prepare(`
      UPDATE pagares SET
        fecha_vencimiento = ?,
        numero_pagare = ?,
        monto = ?,
        estado = ?,
        observaciones = ?,
        comprobante_pago = ?,
        fecha_pago = ?,
        monto_pagado = ?
      WHERE id = ?
    `).run(
      fecha_vencimiento,
      numero_pagare,
      monto,
      estado,
      observaciones || null,
      comprobante_pago || null,
      fecha_pago || null,
      monto_pagado || 0,
      id
    );

    if (estado === 'Cobrado' && existing.estado !== 'Cobrado' && existing.cliente_id) {
      const newIntId = 'int_cobro_' + Date.now();
      const actualMonto = monto_pagado || monto;
      const montoText = `${existing.moneda === 'ARS' ? '$' : 'USD '}${actualMonto.toLocaleString('es-AR')}`;
      const compText = comprobante_pago ? ` (Comprobante: ${comprobante_pago})` : '';

      db.prepare(`
        INSERT INTO interacciones (id, cliente_id, tipo, nota, fecha_contacto)
        VALUES (?, ?, 'Cobro Pagaré', ?, ?)
      `).run(
        newIntId, existing.cliente_id,
        `Cobro registrado: ${numero_pagare || `Cuota ${existing.nro_cuota}`} por ${montoText}.${compText}`,
        new Date().toISOString()
      );
    }

    const updated = db.prepare('SELECT * FROM pagares WHERE id = ?').get(id);
    res.json({ success: true, cuota: formatPagare(updated) });
  } catch (err) {
    console.error('Error actualizando pagaré:', err);
    res.status(500).json({ error: err.message });
  }
};

router.put('/pagares/:id', handleUpdatePagare);
router.patch('/pagares/:id', handleUpdatePagare);

// -----------------------------------------------------------------------------
// USUARIOS & AUTENTICACIÓN
// -----------------------------------------------------------------------------
router.post('/auth/login', (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Debes ingresar usuario y contraseña.' });
    }
    const cleanUser = usuario.trim().toLowerCase();
    const cleanPass = password.trim();

    const user = db.prepare(`
      SELECT * FROM usuarios 
      WHERE LOWER(usuario) = ? OR LOWER(email) = ?
    `).get(cleanUser, cleanUser);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'El usuario se encuentra inactivo.' });
    }

    let isValid = false;
    const isBcrypt = user.password_hash && (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$'));

    if (isBcrypt) {
      isValid = bcrypt.compareSync(cleanPass, user.password_hash);
    } else {
      if (cleanPass === user.password_hash) {
        isValid = true;
        // Migración transparente a bcrypt hash
        try {
          const newHash = bcrypt.hashSync(cleanPass, 10);
          db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(newHash, user.id);
        } catch (e) {
          console.error('[Auth System] Error migrando contraseña a hash bcrypt:', e);
        }
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        email: user.email,
        rol: user.rol,
        activo: Boolean(user.activo),
        telefono: user.telefono,
        created_at: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getRequesterRole(req) {
  return (req.headers['x-user-role'] || req.body?._reqRole || 'vendedor').toString().toLowerCase();
}

function isSuperRole(role) {
  return role === 'superadmin' || role === 'dev';
}

router.get('/usuarios', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, nombre, usuario, rol, activo, email, telefono, created_at FROM usuarios ORDER BY created_at DESC').all();
    res.json(rows.map(u => ({ ...u, activo: Boolean(u.activo) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/usuarios', (req, res) => {
  try {
    const reqRole = getRequesterRole(req);
    const { nombre, usuario, password_hash, password, rol = 'vendedor', activo = true, email, telefono } = req.body;
    const targetRol = rol.toLowerCase();

    if (isSuperRole(targetRol) && !isSuperRole(reqRole)) {
      return res.status(403).json({ error: 'No posee privilegios suficientes para crear cuentas de Desarrollador/SuperAdmin' });
    }

    const id = req.body.id || ('usr_' + Date.now());
    const rawPass = (password_hash || password || '123456').trim();
    const isBcrypt = rawPass.startsWith('$2a$') || rawPass.startsWith('$2b$');
    const hashedPass = isBcrypt ? rawPass : bcrypt.hashSync(rawPass, 10);
    const userSlug = usuario || email?.split('@')[0] || nombre.toLowerCase().replace(/\s+/g, '.');
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO usuarios (id, nombre, usuario, password_hash, rol, activo, email, telefono, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, nombre, userSlug, hashedPass, targetRol, activo ? 1 : 0, email || null, telefono || null, created_at);

    const created = db.prepare('SELECT id, nombre, usuario, rol, activo, email, telefono, created_at FROM usuarios WHERE id = ?').get(id);
    res.status(201).json({ ...created, activo: Boolean(created.activo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const handleUpdateUser = (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });

    const reqRole = getRequesterRole(req);
    if (isSuperRole(targetUser.rol) && !isSuperRole(reqRole)) {
      return res.status(403).json({ error: 'No posee privilegios suficientes para modificar cuentas de Desarrollador/SuperAdmin' });
    }

    const u = req.body;
    if (u.rol && isSuperRole(u.rol.toLowerCase()) && !isSuperRole(reqRole)) {
      return res.status(403).json({ error: 'No posee privilegios suficientes para modificar cuentas de Desarrollador/SuperAdmin' });
    }

    db.prepare(`
      UPDATE usuarios SET
        nombre = COALESCE(?, nombre),
        usuario = COALESCE(?, usuario),
        rol = COALESCE(?, rol),
        activo = COALESCE(?, activo),
        email = COALESCE(?, email),
        telefono = COALESCE(?, telefono)
      WHERE id = ?
    `).run(
      u.nombre || null, u.usuario || null, u.rol || null,
      u.activo !== undefined ? (u.activo ? 1 : 0) : null,
      u.email || null, u.telefono || null, id
    );

    const updated = db.prepare('SELECT id, nombre, usuario, rol, activo, email, telefono, created_at FROM usuarios WHERE id = ?').get(id);
    res.json({ ...updated, activo: Boolean(updated.activo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.put('/usuarios/:id', handleUpdateUser);
router.patch('/usuarios/:id', handleUpdateUser);
router.patch('/usuarios/:id/rol', (req, res) => {
  const { rol } = req.body;
  req.body = { rol };
  return handleUpdateUser(req, res);
});

router.patch('/usuarios/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });

    const reqRole = getRequesterRole(req);
    if (isSuperRole(targetUser.rol) && !isSuperRole(reqRole)) {
      return res.status(403).json({ error: 'No posee privilegios suficientes para modificar cuentas de Desarrollador/SuperAdmin' });
    }

    const newStatus = targetUser.activo === 1 ? 0 : 1;
    db.prepare('UPDATE usuarios SET activo = ? WHERE id = ?').run(newStatus, id);
    res.json({ success: true, activo: Boolean(newStatus) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const handleResetPassword = (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });

    const reqRole = getRequesterRole(req);
    if (isSuperRole(targetUser.rol) && !isSuperRole(reqRole)) {
      return res.status(403).json({ error: 'No posee privilegios suficientes para modificar cuentas de Desarrollador/SuperAdmin' });
    }

    const rawPass = (req.body.new_password || req.body.password || 'reset1234').trim();
    if (!rawPass) {
      return res.status(400).json({ error: 'La nueva contraseña no puede estar vacía.' });
    }

    const newHash = bcrypt.hashSync(rawPass, 10);
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(newHash, id);
    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/usuarios/:id/reset-password', handleResetPassword);
router.put('/usuarios/:id/password', handleResetPassword);

router.delete('/usuarios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });

    const reqRole = getRequesterRole(req);
    if (isSuperRole(targetUser.rol) && !isSuperRole(reqRole)) {
      return res.status(403).json({ error: 'No posee privilegios suficientes para modificar cuentas de Desarrollador/SuperAdmin' });
    }

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// INTERACCIONES Y ENCARGOS
// -----------------------------------------------------------------------------
router.get('/interacciones', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM interacciones ORDER BY fecha_contacto DESC').all();
    const clientes = db.prepare('SELECT * FROM clientes').all().map(formatCliente);
    res.json(rows.map(i => ({ ...i, cliente: clientes.find(c => c.id === i.cliente_id) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interacciones', (req, res) => {
  try {
    const i = req.body;
    const id = i.id || ('i_' + Date.now());
    const fecha_contacto = i.fecha_contacto || new Date().toISOString();

    db.prepare(`
      INSERT INTO interacciones (id, cliente_id, tipo, nota, accion_siguiente, fecha_contacto, proximo_contacto)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, i.cliente_id, i.tipo, i.nota, i.accion_siguiente || null, fecha_contacto, i.proximo_contacto || null);

    db.prepare(`
      UPDATE clientes SET ultimo_contacto = ?, notas = ? WHERE id = ?
    `).run(fecha_contacto, `[${new Date().toLocaleDateString('es-AR')}] ${i.nota}`, i.cliente_id);

    const created = db.prepare('SELECT * FROM interacciones WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pedidos-encargo', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM pedidos_encargo ORDER BY created_at DESC').all();
    const clientes = db.prepare('SELECT * FROM clientes').all().map(formatCliente);
    const inventario = db.prepare('SELECT * FROM inventario').all().map(formatInventario);

    res.json(rows.map(p => ({
      ...p,
      es_cero_km: Boolean(p.es_cero_km),
      cliente: clientes.find(c => c.id === p.cliente_id),
      vehiculo_coincidente: p.vehiculo_coincidente_id ? inventario.find(v => v.id === p.vehiculo_coincidente_id) : undefined
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pedidos-encargo', (req, res) => {
  try {
    const p = req.body;
    const id = p.id || ('enc_' + Date.now());
    const created_at = p.created_at || new Date().toISOString();

    db.prepare(`
      INSERT INTO pedidos_encargo (
        id, cliente_id, marca_buscada, modelo_buscado, anio_minimo, anio_maximo,
        presupuesto_maximo, moneda, es_cero_km, color_preferencia, estado,
        vehiculo_coincidente_id, observaciones, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, p.cliente_id, p.marca_buscada, p.modelo_buscado, p.anio_minimo || null,
      p.anio_maximo || null, p.presupuesto_maximo || 0, p.moneda || 'USD',
      p.es_cero_km ? 1 : 0, p.color_preferencia || null, p.estado || 'Buscando en Mercado',
      p.vehiculo_coincidente_id || null, p.observaciones || null, created_at
    );

    const created = db.prepare('SELECT * FROM pedidos_encargo WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// RESPALDOS Y BACKUPS LOCALES
// -----------------------------------------------------------------------------
router.post('/backup', requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const defaultBackupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(defaultBackupDir)) {
      fs.mkdirSync(defaultBackupDir, { recursive: true });
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    const filename = `crm_backup_${yyyy}-${mm}-${dd}_${hh}${min}.db`;
    const destFilePath = path.join(defaultBackupDir, filename);
    const dbSourcePath = path.resolve(process.cwd(), 'crm_local.db');

    try {
      await db.backup(destFilePath);
    } catch {
      fs.copyFileSync(dbSourcePath, destFilePath);
    }

    rotateBackups(defaultBackupDir, 10);

    const stats = fs.statSync(destFilePath);
    res.json({
      success: true,
      filename,
      filepath: destFilePath,
      size_kb: (stats.size / 1024).toFixed(1),
      timestamp: now.toISOString(),
      mensaje: `Resguardo generado exitosamente en backups/${filename}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/backup/download', requireRole(['admin', 'superadmin']), (req, res) => {
  try {
    const filename = `crm_backup_${new Date().toISOString().split('T')[0]}.db`;
    const dbSourcePath = path.resolve(process.cwd(), 'crm_local.db');

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.download(dbSourcePath, filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/backup/snapshot', requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const defaultBackupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(defaultBackupDir)) {
      fs.mkdirSync(defaultBackupDir, { recursive: true });
    }
    const now = new Date();
    const filename = `crm_snapshot_${now.toISOString().replace(/[:.]/g, '-')}.db`;
    const destFilePath = path.join(defaultBackupDir, filename);
    const dbSourcePath = path.resolve(process.cwd(), 'crm_local.db');

    try {
      await db.backup(destFilePath);
    } catch {
      fs.copyFileSync(dbSourcePath, destFilePath);
    }

    rotateBackups(defaultBackupDir, 10);

    res.json({
      success: true,
      filename,
      filepath: destFilePath,
      mensaje: `Punto de restauración generado exitosamente en backups/${filename}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// RECLAMOS DE COBRANZA
// -----------------------------------------------------------------------------
router.get('/reclamos-cobranza', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM reclamos_cobranza ORDER BY fecha_contacto DESC').all();
    const clientes = db.prepare('SELECT * FROM clientes').all().map(formatCliente);
    res.json(rows.map(r => ({ ...r, cliente: clientes.find(c => c.id === r.cliente_id) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reclamos-cobranza', (req, res) => {
  try {
    const r = req.body;
    const id = r.id || ('rec_' + Date.now());
    const fecha_contacto = r.fecha_contacto || new Date().toISOString();

    db.prepare(`
      INSERT INTO reclamos_cobranza (
        id, cuota_id, cliente_id, fecha_contacto, tipo_gestion, resultado_gestion,
        fecha_compromiso_pago, monto_prometido, detalle_reclamo, atendido_por, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, r.cuota_id || '', r.cliente_id || '', fecha_contacto,
      r.tipo_gestion || 'Llamada Telefónica', r.resultado_gestion || 'Compromiso de Pago',
      r.fecha_compromiso_pago || null, r.monto_prometido || 0,
      r.detalle_reclamo || '', r.atendido_por || null, new Date().toISOString()
    );

    const created = db.prepare('SELECT * FROM reclamos_cobranza WHERE id = ?').get(id);
    const clientes = db.prepare('SELECT * FROM clientes').all().map(formatCliente);
    res.status(201).json({ ...created, cliente: clientes.find(c => c.id === created.cliente_id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/pedidos-encargo/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    db.prepare(`
      UPDATE pedidos_encargo SET
        estado = COALESCE(?, estado),
        vehiculo_coincidente_id = COALESCE(?, vehiculo_coincidente_id)
      WHERE id = ?
    `).run(body.estado || null, body.vehiculo_coincidente_id || null, id);
    const updated = db.prepare('SELECT * FROM pedidos_encargo WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/import/json', (req, res) => {
  try {
    const { data, mode, overwrite } = req.body || {};
    if (!data) return res.status(400).json({ error: 'No se enviaron datos para importar.' });

    const raw = data.data || data;
    const clientes = raw.clientes || [];
    const inventario = raw.inventario || raw.vehiculos || [];
    const presupuestos = raw.presupuestos || raw.cotizaciones || [];
    const pagares = raw.pagares || raw.cuotas || [];
    const permutas = raw.permutas || [];
    const interacciones = raw.interacciones || [];
    const pedidos_encargo = raw.pedidos_encargo || [];

    const isOverwrite = overwrite === true || mode === 'overwrite';

    let countClientes = 0;
    let countVehiculos = 0;
    let countPresupuestos = 0;
    let countPagares = 0;
    let countPermutas = 0;
    let countInteracciones = 0;
    let countEncargos = 0;

    const stmtCli = db.prepare(`
      INSERT INTO clientes (
        id, nombre, apellido, numero_documento, tipo_documento, telefono, email,
        domicilio_calle, domicilio_numero, localidad, provincia, codigo_postal,
        compro_credito, monto_credito, deja_auto_permuta, auto_permuta_detalle,
        tipo_cliente, notas, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        nombre=excluded.nombre, apellido=excluded.apellido, numero_documento=excluded.numero_documento,
        tipo_documento=excluded.tipo_documento, telefono=excluded.telefono, email=excluded.email,
        domicilio_calle=excluded.domicilio_calle, domicilio_numero=excluded.domicilio_numero,
        localidad=excluded.localidad, provincia=excluded.provincia, codigo_postal=excluded.codigo_postal,
        compro_credito=excluded.compro_credito, monto_credito=excluded.monto_credito,
        deja_auto_permuta=excluded.deja_auto_permuta, auto_permuta_detalle=excluded.auto_permuta_detalle,
        tipo_cliente=excluded.tipo_cliente, notas=excluded.notas, created_at=excluded.created_at
    `);

    const stmtVeh = db.prepare(`
      INSERT INTO inventario (
        id, patente, marca, modelo, version, anio, precio_lista, costo_compra,
        estado, fecha_ingreso, kilometraje, es_cero_km, moneda, observaciones, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        patente=excluded.patente, marca=excluded.marca, modelo=excluded.modelo,
        version=excluded.version, anio=excluded.anio, precio_lista=excluded.precio_lista,
        costo_compra=excluded.costo_compra, estado=excluded.estado, fecha_ingreso=excluded.fecha_ingreso,
        kilometraje=excluded.kilometraje, es_cero_km=excluded.es_cero_km, moneda=excluded.moneda,
        observaciones=excluded.observaciones
    `);

    const stmtPres = db.prepare(`
      INSERT INTO presupuestos (
        id, cliente_id, vehiculo_id, precio_ofrecido, anticipo, saldo_financiado,
        cant_cuotas, valor_cuota, estado, moneda, motivo_perdida, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        cliente_id=excluded.cliente_id, vehiculo_id=excluded.vehiculo_id,
        precio_ofrecido=excluded.precio_ofrecido, anticipo=excluded.anticipo,
        saldo_financiado=excluded.saldo_financiado, cant_cuotas=excluded.cant_cuotas,
        valor_cuota=excluded.valor_cuota, estado=excluded.estado, moneda=excluded.moneda,
        motivo_perdida=excluded.motivo_perdida
    `);

    const stmtPag = db.prepare(`
      INSERT INTO pagares (
        id, cotizacion_id, cliente_id, nro_cuota, monto, fecha_vencimiento,
        fecha_pago, estado, numero_pagare, moneda, monto_pagado, comprobante_pago,
        observaciones, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        cotizacion_id=excluded.cotizacion_id, cliente_id=excluded.cliente_id,
        nro_cuota=excluded.nro_cuota, monto=excluded.monto,
        fecha_vencimiento=excluded.fecha_vencimiento, fecha_pago=excluded.fecha_pago,
        estado=excluded.estado, numero_pagare=excluded.numero_pagare, moneda=excluded.moneda,
        monto_pagado=excluded.monto_pagado, comprobante_pago=excluded.comprobante_pago,
        observaciones=excluded.observaciones
    `);

    const stmtPerm = db.prepare(`
      INSERT INTO permutas (
        id, presupuesto_id, patente, marca, modelo, version, anio,
        kilometraje, moneda, valor_tasacion, observaciones, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        patente=excluded.patente, marca=excluded.marca, modelo=excluded.modelo,
        version=excluded.version, anio=excluded.anio, kilometraje=excluded.kilometraje,
        moneda=excluded.moneda, valor_tasacion=excluded.valor_tasacion, observaciones=excluded.observaciones
    `);

    const stmtInt = db.prepare(`
      INSERT INTO interacciones (
        id, cliente_id, tipo, nota, accion_siguiente, fecha_contacto, proximo_contacto
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        tipo=excluded.tipo, nota=excluded.nota, accion_siguiente=excluded.accion_siguiente,
        fecha_contacto=excluded.fecha_contacto, proximo_contacto=excluded.proximo_contacto
    `);

    const stmtEnc = db.prepare(`
      INSERT INTO pedidos_encargo (
        id, cliente_id, marca_buscada, modelo_buscado, anio_minimo, anio_maximo,
        presupuesto_maximo, moneda, es_cero_km, color_preferencia, estado, observaciones, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        marca_buscada=excluded.marca_buscada, modelo_buscado=excluded.modelo_buscado,
        presupuesto_maximo=excluded.presupuesto_maximo, estado=excluded.estado, observaciones=excluded.observaciones
    `);

    db.transaction(() => {
      if (isOverwrite) {
        db.exec(`
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
        `);
      }

      clientes.forEach((c) => {
        const id = c.id || ('c_' + Date.now() + Math.random().toString(36).substring(2, 5));
        stmtCli.run(
          id, c.nombre || 'Cliente', c.apellido || null, c.numero_documento || c.dni || null,
          c.tipo_documento || 'DNI', c.telefono || '0', c.email || null,
          c.domicilio_calle || null, c.domicilio_numero || null, c.localidad || null,
          c.provincia || null, c.codigo_postal || null, c.compro_credito ? 1 : 0,
          c.monto_credito || 0, c.deja_auto_permuta ? 1 : 0, c.auto_permuta_detalle || null,
          c.tipo_cliente || 'Prospecto', c.notas || null, c.created_at || new Date().toISOString()
        );
        countClientes++;
      });

      inventario.forEach((v) => {
        const id = v.id || ('v_' + Date.now() + Math.random().toString(36).substring(2, 5));
        stmtVeh.run(
          id, v.patente ? String(v.patente).toUpperCase().trim() : null, v.marca || 'Usado',
          v.modelo || 'Unidad', v.version || null, v.anio || new Date().getFullYear(),
          v.precio_lista ?? v.precio_venta ?? 0, v.costo_compra ?? v.costo_toma ?? 0,
          (v.estado || 'disponible').toLowerCase(), v.fecha_ingreso || new Date().toISOString().split('T')[0],
          v.kilometraje || 0, v.es_cero_km ? 1 : 0, v.moneda || 'USD',
          v.observaciones || null, v.created_at || new Date().toISOString()
        );
        countVehiculos++;
      });

      presupuestos.forEach((p) => {
        const id = p.id || ('p_' + Date.now() + Math.random().toString(36).substring(2, 5));
        stmtPres.run(
          id, p.cliente_id || p.cliente?.id || '', p.vehiculo_id || p.vehiculo?.id || null,
          p.precio_ofrecido || 0, p.anticipo || 0, p.saldo_financiado || 0,
          p.cant_cuotas || 0, p.valor_cuota || 0, p.estado || 'borrador',
          p.moneda || 'USD', p.motivo_perdida || null, p.created_at || new Date().toISOString()
        );
        countPresupuestos++;
      });

      pagares.forEach((p) => {
        const id = p.id || ('pag_' + Date.now() + Math.random().toString(36).substring(2, 5));
        stmtPag.run(
          id, p.cotizacion_id || p.prestamo_id || null, p.cliente_id || p.cliente?.id || null,
          p.nro_cuota ?? p.numero_cuota ?? 1, p.monto ?? p.monto_cuota ?? 0,
          p.fecha_vencimiento || p.vencimiento || new Date().toISOString().split('T')[0],
          p.fecha_pago || null, p.estado || 'Pendiente', p.numero_pagare || null,
          p.moneda || 'USD', p.monto_pagado || 0, p.comprobante_pago || null,
          p.observaciones || null, p.created_at || new Date().toISOString()
        );
        countPagares++;
      });

      permutas.forEach((pm) => {
        const id = pm.id || ('pm_' + Date.now() + Math.random().toString(36).substring(2, 5));
        stmtPerm.run(
          id, pm.presupuesto_id || '', pm.patente || null, pm.marca || '', pm.modelo || '',
          pm.version || null, pm.anio || new Date().getFullYear(), pm.kilometraje || 0,
          pm.moneda || 'USD', pm.valor_tasacion || 0, pm.observaciones || null, pm.created_at || new Date().toISOString()
        );
        countPermutas++;
      });

      interacciones.forEach((it) => {
        const id = it.id || ('int_' + Date.now() + Math.random().toString(36).substring(2, 5));
        stmtInt.run(
          id, it.cliente_id, it.tipo || 'Llamada', it.nota || '',
          it.accion_siguiente || null, it.fecha_contacto || new Date().toISOString(), it.proximo_contacto || null
        );
        countInteracciones++;
      });

      pedidos_encargo.forEach((enc) => {
        const id = enc.id || ('enc_' + Date.now() + Math.random().toString(36).substring(2, 5));
        stmtEnc.run(
          id, enc.cliente_id, enc.marca_buscada || '', enc.modelo_buscado || '',
          enc.anio_minimo || null, enc.anio_maximo || null, enc.presupuesto_maximo || 0,
          enc.moneda || 'USD', enc.es_cero_km ? 1 : 0, enc.color_preferencia || null,
          enc.estado || 'Buscando en Mercado', enc.observaciones || null, enc.created_at || new Date().toISOString()
        );
        countEncargos++;
      });
    })();

    const actionTitle = isOverwrite ? 'Restauración Completa (Sobrescribir Total)' : 'Fusión de Datos';
    res.json({
      success: true,
      mensaje: `${actionTitle} realizada con éxito: ${countClientes} clientes, ${countVehiculos} unidades, ${countPresupuestos} presupuestos y ${countPagares} pagarés procesados en SQLite.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// ABM DE PLANTILLAS DE WHATSAPP
// -----------------------------------------------------------------------------
router.get('/plantillas-wsp', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM plantillas_wsp ORDER BY modulo, titulo').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/plantillas-wsp', (req, res) => {
  try {
    const { id, modulo, codigo, titulo, contenido } = req.body || {};
    if (!codigo || !contenido) {
      return res.status(400).json({ error: 'Faltan campos requeridos (codigo y contenido).' });
    }
    const templateId = id || ('pl_' + Date.now() + Math.random().toString(36).substring(2, 5));
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO plantillas_wsp (id, modulo, codigo, titulo, contenido, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(codigo) DO UPDATE SET
        titulo = excluded.titulo,
        contenido = excluded.contenido,
        updated_at = excluded.updated_at
    `).run(templateId, modulo || 'pagares', codigo, titulo || codigo, contenido, now, now);

    const all = db.prepare('SELECT * FROM plantillas_wsp ORDER BY modulo, titulo').all();
    res.json({ success: true, plantillas: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});