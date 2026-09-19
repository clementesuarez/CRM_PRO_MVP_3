import express from 'express';
import fs from 'fs';
import path from 'path';
import { db } from './db.js';

export const router = express.Router();

// Helper to format SQLite boolean ints to booleans & sanitize
function formatCliente(row) {
  if (!row) return null;
  return {
    ...row,
    numero_documento: row.dni || row.numero_documento || '',
    compro_credito: Boolean(row.compro_credito),
    deja_auto_permuta: Boolean(row.deja_auto_permuta),
  };
}

function formatVehiculo(row) {
  if (!row) return null;
  return {
    ...row,
    precio_lista: row.precio_venta ?? row.precio_lista ?? 0,
    costo_compra: row.costo_toma ?? row.costo_compra ?? 0,
    es_cero_km: Boolean(row.es_cero_km),
    es_solo_compra: Boolean(row.es_solo_compra),
    created_at: row.fecha_ingreso || row.created_at || new Date().toISOString()
  };
}

function formatCotizacion(row) {
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
    precio_ofrecido: row.precio_vehiculo ?? row.precio_ofrecido ?? 0,
    saldo_financiado: row.saldo_financiar ?? row.saldo_financiado ?? 0,
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
    const c = req.body;
    const id = c.id || ('c_' + Date.now());
    const created_at = c.created_at || new Date().toISOString();
    const dni = c.dni || c.numero_documento || '';

    const stmt = db.prepare(`
      INSERT INTO clientes (
        id, nombre, apellido, dni, telefono, email, localidad, provincia,
        domicilio_calle, domicilio_numero, codigo_postal, tipo_documento,
        compro_credito, monto_credito, deja_auto_permuta, auto_permuta_detalle,
        tipo_cliente, sexo, fecha_nacimiento, numero_tramite, notas, ultimo_contacto, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, c.nombre || '', c.apellido || null, dni, c.telefono || '', c.email || null,
      c.localidad || null, c.provincia || null, c.domicilio_calle || null,
      c.domicilio_numero || null, c.codigo_postal || null, c.tipo_documento || 'DNI',
      c.compro_credito ? 1 : 0, c.monto_credito || 0, c.deja_auto_permuta ? 1 : 0,
      c.auto_permuta_detalle || null, c.tipo_cliente || 'Prospecto', c.sexo || null,
      c.fecha_nacimiento || null, c.numero_tramite || null, c.notas || null,
      c.ultimo_contacto || null, created_at
    );

    const created = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    res.status(201).json(formatCliente(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/clientes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const c = req.body;
    const dni = c.dni || c.numero_documento || '';

    const stmt = db.prepare(`
      UPDATE clientes SET
        nombre = ?, apellido = ?, dni = ?, telefono = ?, email = ?, localidad = ?,
        provincia = ?, domicilio_calle = ?, domicilio_numero = ?, codigo_postal = ?,
        tipo_documento = ?, compro_credito = ?, monto_credito = ?, deja_auto_permuta = ?,
        auto_permuta_detalle = ?, tipo_cliente = ?, sexo = ?, fecha_nacimiento = ?,
        numero_tramite = ?, notas = ?, ultimo_contacto = ?
      WHERE id = ?
    `);

    stmt.run(
      c.nombre || '', c.apellido || null, dni, c.telefono || '', c.email || null,
      c.localidad || null, c.provincia || null, c.domicilio_calle || null,
      c.domicilio_numero || null, c.codigo_postal || null, c.tipo_documento || 'DNI',
      c.compro_credito ? 1 : 0, c.monto_credito || 0, c.deja_auto_permuta ? 1 : 0,
      c.auto_permuta_detalle || null, c.tipo_cliente || 'Prospecto', c.sexo || null,
      c.fecha_nacimiento || null, c.numero_tramite || null, c.notas || null,
      c.ultimo_contacto || null, id
    );

    const updated = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
    res.json(formatCliente(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// VEHICULOS
// -----------------------------------------------------------------------------
router.get('/vehiculos', (req, res) => {
  try {
    const rol = req.query.rol || 'admin';
    const rows = db.prepare('SELECT * FROM vehiculos ORDER BY fecha_ingreso DESC').all();
    const list = rows.map(formatVehiculo);

    if (rol === 'vendedor') {
      return res.json(list.map(v => ({ ...v, costo_compra: 0, costo_toma: 0 })));
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehiculos', (req, res) => {
  try {
    const v = req.body;
    const id = v.id || ('v_' + Date.now());
    const fecha_ingreso = v.fecha_ingreso || v.created_at || new Date().toISOString();

    const precio_venta = v.precio_venta ?? v.precio_lista ?? 0;
    const costo_toma = v.costo_toma ?? v.costo_compra ?? 0;

    const stmt = db.prepare(`
      INSERT INTO vehiculos (
        id, patente, marca, modelo, version, anio, precio_venta, costo_toma, estado,
        fecha_ingreso, fecha_venta, motivo_perdida, tipo_vehiculo, numero_chasis,
        numero_motor, kilometraje, es_cero_km, moneda, origen_stock, observaciones,
        comprado_a_cliente_id, dueno_consigna_nombre, dueno_consigna_telefono,
        dueno_consigna_documento, origen_transaccion, es_solo_compra, fecha_compra
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, v.patente || null, v.marca || '', v.modelo || '', v.version || null,
      v.anio || new Date().getFullYear(), precio_venta, costo_toma, v.estado || 'Disponible',
      fecha_ingreso, v.fecha_venta || null, v.motivo_perdida || null, v.tipo_vehiculo || 'Sedán',
      v.numero_chasis || null, v.numero_motor || null, v.kilometraje || 0, v.es_cero_km ? 1 : 0,
      v.moneda || 'USD', v.origen_stock || 'Propio', v.observaciones || null,
      v.comprado_a_cliente_id || null, v.dueno_consigna_nombre || null,
      v.dueno_consigna_telefono || null, v.dueno_consigna_documento || null,
      v.origen_transaccion || null, v.es_solo_compra ? 1 : 0, v.fecha_compra || null
    );

    const created = db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(id);
    res.status(201).json(formatVehiculo(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vehiculos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const v = req.body;
    const rol = req.query.rol || 'admin';

    const existing = db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(id);
    const precio_venta = v.precio_venta ?? v.precio_lista ?? (existing?.precio_venta || 0);
    const costo_toma = (rol === 'vendedor' && existing) 
      ? existing.costo_toma 
      : (v.costo_toma ?? v.costo_compra ?? (existing?.costo_toma || 0));

    const stmt = db.prepare(`
      UPDATE vehiculos SET
        patente = ?, marca = ?, modelo = ?, version = ?, anio = ?, precio_venta = ?,
        costo_toma = ?, estado = ?, fecha_venta = ?, motivo_perdida = ?, tipo_vehiculo = ?,
        numero_chasis = ?, numero_motor = ?, kilometraje = ?, es_cero_km = ?, moneda = ?,
        origen_stock = ?, observaciones = ?, comprado_a_cliente_id = ?, dueno_consigna_nombre = ?,
        dueno_consigna_telefono = ?, dueno_consigna_documento = ?, origen_transaccion = ?,
        es_solo_compra = ?, fecha_compra = ?
      WHERE id = ?
    `);

    stmt.run(
      v.patente || null, v.marca || '', v.modelo || '', v.version || null,
      v.anio || new Date().getFullYear(), precio_venta, costo_toma, v.estado || 'Disponible',
      v.fecha_venta || null, v.motivo_perdida || null, v.tipo_vehiculo || 'Sedán',
      v.numero_chasis || null, v.numero_motor || null, v.kilometraje || 0, v.es_cero_km ? 1 : 0,
      v.moneda || 'USD', v.origen_stock || 'Propio', v.observaciones || null,
      v.comprado_a_cliente_id || null, v.dueno_consigna_nombre || null,
      v.dueno_consigna_telefono || null, v.dueno_consigna_documento || null,
      v.origen_transaccion || null, v.es_solo_compra ? 1 : 0, v.fecha_compra || null, id
    );

    const updated = db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(id);
    res.json(formatVehiculo(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/vehiculos/:id/estado', (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha_venta } = req.body;
    let query = 'UPDATE vehiculos SET estado = ?';
    const params = [estado];

    if (estado === 'Vendido') {
      query += ', fecha_venta = ?';
      params.push(fecha_venta || new Date().toISOString());
    }
    query += ' WHERE id = ?';
    params.push(id);

    db.prepare(query).run(...params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vehiculos/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM vehiculos WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// COTIZACIONES
// -----------------------------------------------------------------------------
router.get('/cotizaciones', (req, res) => {
  try {
    const rol = req.query.rol || 'admin';
    const rows = db.prepare('SELECT * FROM cotizaciones ORDER BY created_at DESC').all();
    const clientes = db.prepare('SELECT * FROM clientes').all().map(formatCliente);
    const vehiculos = db.prepare('SELECT * FROM vehiculos').all().map(formatVehiculo);
    const permutas = db.prepare('SELECT * FROM permutas').all();

    const list = rows.map(formatCotizacion).map(c => {
      const cli = clientes.find(cl => cl.id === c.cliente_id);
      let veh = vehiculos.find(v => v.id === c.vehiculo_id);
      if (rol === 'vendedor' && veh) {
        veh = { ...veh, costo_compra: 0, costo_toma: 0 };
      }
      const pm = permutas.find(p => p.presupuesto_id === c.id);
      return {
        ...c,
        cliente: cli,
        vehiculo: veh,
        permuta: pm
      };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cotizaciones', (req, res) => {
  try {
    const { presupuesto, permuta } = req.body;
    const p = presupuesto || req.body;
    const id = p.id || ('p_' + Date.now());
    const created_at = p.created_at || new Date().toISOString();

    const precio_vehiculo = p.precio_vehiculo ?? p.precio_ofrecido ?? 0;
    const saldo_financiar = p.saldo_financiar ?? p.saldo_financiado ?? 0;
    const vehiculos_cotizados = p.vehiculos_cotizados ? JSON.stringify(p.vehiculos_cotizados) : null;

    const existing = db.prepare('SELECT id FROM cotizaciones WHERE id = ?').get(id);

    if (existing) {
      db.prepare(`
        UPDATE cotizaciones SET
          cliente_id = ?, vehiculo_id = ?, precio_vehiculo = ?, permuta_monto = ?,
          anticipo = ?, saldo_financiar = ?, cant_cuotas = ?, valor_cuota = ?,
          estado = ?, moneda = ?, motivo_perdida = ?, vehiculos_cotizados = ?
        WHERE id = ?
      `).run(
        p.cliente_id, p.vehiculo_id || null, precio_vehiculo, p.permuta_monto || 0,
        p.anticipo || 0, saldo_financiar, p.cant_cuotas || 0, p.valor_cuota || 0,
        p.estado || 'Borrador', p.moneda || 'USD', p.motivo_perdida || null,
        vehiculos_cotizados, id
      );
    } else {
      db.prepare(`
        INSERT INTO cotizaciones (
          id, cliente_id, vehiculo_id, precio_vehiculo, permuta_monto, anticipo,
          saldo_financiar, cant_cuotas, valor_cuota, estado, moneda, motivo_perdida,
          vehiculos_cotizados, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, p.cliente_id, p.vehiculo_id || null, precio_vehiculo, p.permuta_monto || 0,
        p.anticipo || 0, saldo_financiar, p.cant_cuotas || 0, p.valor_cuota || 0,
        p.estado || 'Borrador', p.moneda || 'USD', p.motivo_perdida || null,
        vehiculos_cotizados, created_at
      );
    }

    if (permuta) {
      db.prepare('DELETE FROM permutas WHERE presupuesto_id = ?').run(id);
      const pmId = permuta.id || ('pm_' + Date.now());
      db.prepare(`
        INSERT INTO permutas (
          id, presupuesto_id, patente, marca, modelo, version, marca_modelo,
          anio, kilometraje, moneda, valor_tasacion, observaciones, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        pmId, id, permuta.patente || null, permuta.marca || null, permuta.modelo || null,
        permuta.version || null, permuta.marca_modelo || `${permuta.marca || ''} ${permuta.modelo || ''}`.trim() || 'Permuta',
        permuta.anio || new Date().getFullYear(), permuta.kilometraje || 0, permuta.moneda || 'USD',
        permuta.valor_tasacion || 0, permuta.observaciones || null, created_at
      );
    }

    const created = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(id);
    res.status(201).json(formatCotizacion(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/cotizaciones/:id/estado', (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo_perdida, fecha_venta } = req.body;
    const saleDate = fecha_venta || new Date().toISOString();

    db.prepare(`
      UPDATE cotizaciones SET estado = ?, motivo_perdida = ? WHERE id = ?
    `).run(estado, motivo_perdida || null, id);

    const isGanado = estado.toLowerCase() === 'ganado';
    const isPerdido = estado.toLowerCase() === 'perdido';
    const pres = db.prepare('SELECT * FROM cotizaciones WHERE id = ?').get(id);

    if (pres) {
      if (isGanado) {
        if (pres.vehiculo_id) {
          db.prepare("UPDATE vehiculos SET estado = 'Vendido', fecha_venta = ? WHERE id = ?")
            .run(saleDate, pres.vehiculo_id);
        }
        db.prepare("UPDATE clientes SET tipo_cliente = 'Comprador' WHERE id = ?")
          .run(pres.cliente_id);

        const pm = db.prepare('SELECT * FROM permutas WHERE presupuesto_id = ?').get(id);
        if (pm) {
          const parts = (pm.marca_modelo || '').split(' ');
          const marca = pm.marca || parts[0] || 'Usado';
          const modelo = pm.modelo || parts.slice(1).join(' ') || 'Permuta';
          const newVehId = 'v_' + Date.now();
          db.prepare(`
            INSERT INTO vehiculos (id, patente, marca, modelo, version, anio, precio_venta, costo_toma, estado, fecha_ingreso, kilometraje, es_cero_km, moneda, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Reacondicionamiento', ?, ?, 0, ?, ?)
          `).run(
            newVehId, pm.patente || ('PER-' + Math.floor(Math.random()*1000)), marca, modelo, pm.version || null,
            pm.anio || new Date().getFullYear(), Math.round(pm.valor_tasacion * 1.15), pm.valor_tasacion,
            new Date().toISOString(), pm.kilometraje || 0, pm.moneda || 'USD',
            `Ingresado por permuta de presupuesto #${id}. Notes: ${pm.observaciones || ''}`
          );
        }
      } else if (isPerdido) {
        db.prepare("UPDATE clientes SET tipo_cliente = 'No compro' WHERE id = ?")
          .run(pres.cliente_id);
      }
    }

    res.json({ success: true });
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
    const prestamos = db.prepare('SELECT * FROM prestamos').all();
    const clientes = db.prepare('SELECT * FROM clientes').all().map(formatCliente);

    const list = rows.map(formatPagare).map(p => {
      const prest = prestamos.find(pr => pr.id === p.cotizacion_id || pr.id === p.prestamo_id);
      const cli = clientes.find(c => c.id === (p.cliente_id || prest?.cliente_id));
      return {
        ...p,
        prestamo: prest,
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

    db.prepare(`
      INSERT INTO prestamos (
        id, cliente_id, vehiculo_id, presupuesto_id, monto_total_prestado, moneda,
        cantidad_cuotas, tasa_interes_anual, monto_cuota_promedio, fecha_otorgamiento,
        estado, observaciones, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      prestamoId, p.cliente_id, p.vehiculo_id || null, p.presupuesto_id || null,
      p.monto_total_prestado, p.moneda || 'USD', p.cantidad_cuotas, p.tasa_interes_anual || 0,
      p.monto_cuota_promedio, p.fecha_otorgamiento || new Date().toISOString().split('T')[0],
      p.estado || 'Activo', p.observaciones || null, created_at
    );

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
      const montoText = `${cuota.moneda === 'ARS' ? '$' : 'USD $'}${monto_pagado.toLocaleString('es-AR')}`;
      const compText = comprobante_pago ? ` (Forma/Comprobante: ${comprobante_pago})` : '';

      db.prepare(`
        INSERT INTO interacciones (id, cliente_id, tipo, nota, fecha_contacto)
        VALUES (?, ?, 'Cobro Pagaré', ?, ?)
      `).run(
        newIntId, cuota.cliente_id,
        `💰 COBRO DE PAGARÉ REGISTRADO: ${cuota.numero_pagare || `Cuota ${cuota.nro_cuota}`} cobrado exitosamente por ${montoText}.${compText}`,
        new Date().toISOString()
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/pagares/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const fields = [];
    const params = [];

    if (data.fecha_vencimiento !== undefined) { fields.push('fecha_vencimiento = ?'); params.push(data.fecha_vencimiento); }
    if (data.numero_pagare !== undefined) { fields.push('numero_pagare = ?'); params.push(data.numero_pagare); }
    if (data.monto_cuota !== undefined || data.monto !== undefined) { fields.push('monto = ?'); params.push(data.monto_cuota ?? data.monto); }
    if (data.observaciones !== undefined) { fields.push('observaciones = ?'); params.push(data.observaciones); }
    if (data.estado !== undefined) { fields.push('estado = ?'); params.push(data.estado); }
    if (data.comprobante_pago !== undefined) { fields.push('comprobante_pago = ?'); params.push(data.comprobante_pago); }
    if (data.fecha_pago !== undefined) { fields.push('fecha_pago = ?'); params.push(data.fecha_pago); }
    if (data.monto_pagado !== undefined) { fields.push('monto_pagado = ?'); params.push(data.monto_pagado); }

    if (fields.length > 0) {
      params.push(id);
      db.prepare(`UPDATE pagares SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// USUARIOS & AUTENTICACIÓN (MÓDULO DE USUARIOS Y ROLES - ABM ADMIN)
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
      WHERE (LOWER(usuario) = ? OR LOWER(email) = ?) 
        AND password_hash = ?
    `).get(cleanUser, cleanUser, cleanPass);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas. Verifica tu usuario/email y contraseña.' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Tu usuario se encuentra inactivo. Contacta al Administrador del sistema.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        email: user.email || `${user.usuario}@agencia.com`,
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

router.get('/usuarios', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM usuarios ORDER BY created_at DESC').all();
    res.json(rows.map(u => ({
      ...u,
      activo: Boolean(u.activo)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/usuarios', (req, res) => {
  try {
    const { nombre, usuario, password_hash, password, rol, activo = true, email, telefono } = req.body;
    const id = req.body.id || ('usr_' + Date.now());
    const pass = password_hash || password || '123456';
    const userSlug = usuario || email?.split('@')[0] || nombre.toLowerCase().replace(/\s+/g, '.');
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO usuarios (id, nombre, usuario, password_hash, rol, activo, email, telefono, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, nombre, userSlug, pass, rol || 'vendedor', activo ? 1 : 0, email || null, telefono || null, created_at);

    const created = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    res.status(201).json({ ...created, activo: Boolean(created.activo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/usuarios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const u = req.body;

    const stmt = db.prepare(`
      UPDATE usuarios SET
        nombre = COALESCE(?, nombre),
        usuario = COALESCE(?, usuario),
        rol = COALESCE(?, rol),
        activo = COALESCE(?, activo),
        email = COALESCE(?, email),
        telefono = COALESCE(?, telefono)
      WHERE id = ?
    `);

    stmt.run(
      u.nombre || null, u.usuario || null, u.rol || null,
      u.activo !== undefined ? (u.activo ? 1 : 0) : null,
      u.email || null, u.telefono || null, id
    );

    const updated = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    res.json({ ...updated, activo: Boolean(updated.activo) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/usuarios/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT activo FROM usuarios WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Usuario no encontrado' });

    const newStatus = current.activo === 1 ? 0 : 1;
    db.prepare('UPDATE usuarios SET activo = ? WHERE id = ?').run(newStatus, id);
    res.json({ success: true, activo: Boolean(newStatus) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/usuarios/:id/reset-password', (req, res) => {
  try {
    const { id } = req.params;
    const { new_password = 'reset1234' } = req.body;

    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(new_password, id);
    res.json({ success: true, message: `Contraseña restablecida exitosamente` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// INTERACCIONES, ENCARGOS, RECLAMOS
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
    const vehiculos = db.prepare('SELECT * FROM vehiculos').all().map(formatVehiculo);

    res.json(rows.map(p => ({
      ...p,
      es_cero_km: Boolean(p.es_cero_km),
      cliente: clientes.find(c => c.id === p.cliente_id),
      vehiculo_coincidente: p.vehiculo_coincidente_id ? vehiculos.find(v => v.id === p.vehiculo_coincidente_id) : undefined
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

    db.prepare(`
      INSERT INTO reclamos_cobranza (
        id, cuota_id, cliente_id, fecha_contacto, tipo_gestion, resultado_gestion,
        fecha_compromiso_pago, monto_prometido, detalle_reclamo, atendido_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, r.cuota_id, r.cliente_id, r.fecha_contacto || new Date().toISOString(),
      r.tipo_gestion, r.resultado_gestion, r.fecha_compromiso_pago || null,
      r.monto_prometido || null, r.detalle_reclamo, r.atendido_por || null
    );

    const created = db.prepare('SELECT * FROM reclamos_cobranza WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// RESPALDOS DE BASE DE DATOS LOCAL Y GOOGLE DRIVE
// -----------------------------------------------------------------------------
router.post('/backup', async (req, res) => {
  try {
    const { target_path } = req.body || {};
    if (target_path && (target_path.trim().startsWith('http://') || target_path.trim().startsWith('https://'))) {
      return res.status(400).json({
        error: 'La ruta ingresada es una dirección web URL. Debe indicar una ruta de disco local (ej: G:\\Mi unidad\\Backups) o presionar "Descargar Copia de Seguridad Directa".'
      });
    }

    const defaultBackupDir = path.resolve(process.cwd(), 'backups');
    const destDir = (target_path && target_path.trim()) ? target_path.trim() : defaultBackupDir;

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    const filename = `crm_backup_${yyyy}-${mm}-${dd}_${hh}${min}.db`;
    const destFilePath = path.join(destDir, filename);
    const dbSourcePath = path.resolve(process.cwd(), 'crm_local.db');

    try {
      await db.backup(destFilePath);
    } catch (e) {
      fs.copyFileSync(dbSourcePath, destFilePath);
    }

    const stats = fs.statSync(destFilePath);
    res.json({
      success: true,
      filename,
      filepath: destFilePath,
      size_kb: (stats.size / 1024).toFixed(1),
      timestamp: now.toISOString(),
      mensaje: `Resguardo generado exitosamente en ${destFilePath}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/backup/download', (req, res) => {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const filename = `crm_backup_${yyyy}-${mm}-${dd}.db`;
    const dbSourcePath = path.resolve(process.cwd(), 'crm_local.db');

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.download(dbSourcePath, filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/backup/snapshot', async (req, res) => {
  try {
    const snapshotDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const filename = `snapshot_${yyyy}-${mm}-${dd}_${hh}${min}${ss}.db`;
    const destFilePath = path.join(snapshotDir, filename);
    const dbSourcePath = path.resolve(process.cwd(), 'crm_local.db');

    try {
      await db.backup(destFilePath);
    } catch (e) {
      fs.copyFileSync(dbSourcePath, destFilePath);
    }

    const stats = fs.statSync(destFilePath);
    res.json({
      success: true,
      filename,
      filepath: destFilePath,
      size_kb: (stats.size / 1024).toFixed(1),
      timestamp: now.toISOString(),
      mensaje: `Punto de restauración local generado exitosamente en backups/${filename}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/import/json', (req, res) => {
  try {
    const { data } = req.body || {};
    if (!data) return res.status(400).json({ error: 'No se enviaron datos para importar.' });

    const clientes = data.clientes || [];
    const inventario = data.inventario || [];

    let countClientes = 0;
    let countVehiculos = 0;

    const stmtCli = db.prepare(`
      INSERT INTO clientes (id, nombre, apellido, dni, telefono, email, localidad, provincia, domicilio_calle, domicilio_numero, codigo_postal, tipo_documento, compro_credito, monto_credito, deja_auto_permuta, auto_permuta_detalle, tipo_cliente, notas, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET nombre=excluded.nombre, telefono=excluded.telefono, email=excluded.email
    `);

    const stmtVeh = db.prepare(`
      INSERT INTO vehiculos (id, patente, marca, modelo, version, anio, precio_venta, costo_toma, estado, fecha_ingreso, kilometraje, es_cero_km, moneda, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET marca=excluded.marca, modelo=excluded.modelo, precio_venta=excluded.precio_venta
    `);

    db.transaction(() => {
      clientes.forEach((c) => {
        const id = c.id || ('c_' + Date.now() + Math.random().toString(36).substring(2, 5));
        stmtCli.run(
          id, c.nombre || 'Cliente Importado', c.apellido || null, c.dni || c.numero_documento || null,
          c.telefono || '0', c.email || null, c.localidad || null, c.provincia || null,
          c.domicilio_calle || null, c.domicilio_numero || null, c.codigo_postal || null,
          c.tipo_documento || 'DNI', c.compro_credito ? 1 : 0, c.monto_credito || 0,
          c.deja_auto_permuta ? 1 : 0, c.auto_permuta_detalle || null, c.tipo_cliente || 'Prospecto',
          c.notas || null, c.created_at || new Date().toISOString()
        );
        countClientes++;
      });

      inventario.forEach((v) => {
        const id = v.id || ('v_' + Date.now() + Math.random().toString(36).substring(2, 5));
        stmtVeh.run(
          id, v.patente || null, v.marca || 'Usado', v.modelo || 'Unidad', v.version || null,
          v.anio || new Date().getFullYear(), v.precio_venta ?? v.precio_lista ?? 0,
          v.costo_toma ?? v.costo_compra ?? 0, v.estado || 'Disponible',
          v.fecha_ingreso || v.created_at || new Date().toISOString(), v.kilometraje || 0,
          v.es_cero_km ? 1 : 0, v.moneda || 'USD', v.observaciones || null
        );
        countVehiculos++;
      });
    })();

    res.json({
      success: true,
      mensaje: `Restauración de JSON efectuada: ${countClientes} clientes y ${countVehiculos} vehículos actualizados/guardados en SQLite.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
