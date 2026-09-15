import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { 
  Cliente, 
  Inventario, 
  Presupuesto, 
  Permuta, 
  Interaccion, 
  EstadoPresupuesto, 
  MotivoPerdida,
  DashboardMetrics,
  TipoMoneda,
  PresupuestoVehiculoItem,
  PedidoEncargo,
  EstadoPedidoEncargo,
  PrestamoPagare,
  CuotaPagare,
  EstadoCuota,
  ReclamoCobranza
} from '../types/crm';
import { UserRole } from '../types/auth';
import { getActiveRoleSync } from '../context/AuthContext';

// Mock Seed Data
const MOCK_CLIENTES: Cliente[] = [
  { 
    id: 'c1', 
    nombre: 'Carlos', 
    apellido: 'Rodríguez', 
    telefono: '5491155443322', 
    email: 'crodriguez@email.com', 
    tipo_documento: 'DNI', 
    numero_documento: '32.145.890', 
    domicilio_calle: 'Av. Corrientes', 
    domicilio_numero: '2450', 
    localidad: 'Balvanera', 
    provincia: 'Ciudad Autónoma de Buenos Aires (CABA)', 
    codigo_postal: 'C1046', 
    compro_credito: true, 
    monto_credito: 16000, 
    deja_auto_permuta: true,
    auto_permuta_detalle: 'Volkswagen Gol Trend 1.6 (2018) - Patente AC987ZZ - Tasación: USD 9.500',
    tipo_cliente: 'Prospecto', 
    notas: 'Interesado en Hilux 4x4 o camioneta con entrega de Gol 2018', 
    created_at: '2026-09-01T10:00:00Z' 
  },
  { 
    id: 'c2', 
    nombre: 'Lucía', 
    apellido: 'Benítez', 
    telefono: '5491166778899', 
    email: 'lbenitez@email.com', 
    tipo_documento: 'DNI', 
    numero_documento: '38.990.112', 
    domicilio_calle: 'Calle 7', 
    domicilio_numero: '512', 
    localidad: 'La Plata', 
    provincia: 'Buenos Aires', 
    codigo_postal: '1900', 
    compro_credito: false, 
    monto_credito: 0, 
    tipo_cliente: 'No compro', 
    notas: 'Buscaba 208 GT pero la tasación de su usado le pareció baja', 
    created_at: '2026-07-20T14:30:00Z' 
  },
  { 
    id: 'c3', 
    nombre: 'Esteban', 
    apellido: 'Fernández', 
    telefono: '5491133221100', 
    email: 'efernandez@email.com', 
    tipo_documento: 'CUIT', 
    numero_documento: '20-35444333-9', 
    domicilio_calle: 'Av. Colón', 
    domicilio_numero: '1280', 
    localidad: 'Córdoba Capital', 
    provincia: 'Córdoba', 
    codigo_postal: '5000', 
    compro_credito: true, 
    monto_credito: 22500, 
    tipo_cliente: 'Prospecto', 
    notas: 'Consulta por Amarok V6. Quiere financiar USD 22.500', 
    created_at: '2026-09-06T11:20:00Z' 
  },
  { 
    id: 'c4', 
    nombre: 'El Memens', 
    apellido: 'Comercial', 
    telefono: '5491166399875', 
    email: 'elmemens@email.com', 
    tipo_documento: 'DNI', 
    numero_documento: '29.888.777', 
    domicilio_calle: 'Mitre', 
    domicilio_numero: '450', 
    localidad: 'Rosario', 
    provincia: 'Santa Fe', 
    codigo_postal: '2000', 
    compro_credito: false, 
    monto_credito: 0, 
    tipo_cliente: 'Prospecto', 
    notas: 'Borrador iniciado', 
    created_at: '2026-09-08T08:00:00Z' 
  },
  { 
    id: 'c5', 
    nombre: 'Roberto', 
    apellido: 'Rossi', 
    telefono: '5491188990011', 
    email: 'rrossi@email.com', 
    tipo_documento: 'DNI', 
    numero_documento: '25.666.111', 
    domicilio_calle: 'Bv. Chacabuco', 
    domicilio_numero: '890', 
    localidad: 'Córdoba', 
    provincia: 'Córdoba', 
    codigo_postal: '5000', 
    compro_credito: true, 
    monto_credito: 10000, 
    tipo_cliente: 'Comprador', 
    notas: 'Compró Corolla en Marzo 2025 con crédito prendario', 
    created_at: '2025-03-12T09:15:00Z' 
  },
];

const MOCK_INVENTARIO: Inventario[] = [
  { 
    id: 'v1', 
    patente: 'AF123JK', 
    marca: 'Toyota', 
    modelo: 'Hilux SRX 4x4 AT', 
    tipo_vehiculo: 'Pick-up / Camioneta',
    numero_chasis: '8AJFA8CB900123456',
    numero_motor: '1GD5678901',
    anio: 2022, 
    kilometraje: 42000, 
    es_cero_km: false, 
    moneda: 'USD', 
    precio_lista: 36500, 
    costo_compra: 31000, 
    origen_stock: 'Compra Directa',
    origen_transaccion: 'Compra Directa a Cliente',
    es_solo_compra: true,
    comprado_a_cliente_id: 'c1',
    dueno_consigna_nombre: 'Carlos Rodríguez',
    dueno_consigna_telefono: '5491155443322',
    dueno_consigna_documento: '30.123.456',
    fecha_compra: '2026-07-28',
    estado: 'Disponible', 
    observaciones: 'Excelente estado, service oficial Toyota al día. Adquirido por compra directa.', 
    created_at: '2026-08-01T10:00:00Z' 
  },
  { 
    id: 'v2', 
    patente: 'AG999ZZ', 
    marca: 'Volkswagen', 
    modelo: 'Amarok V6 Extreme', 
    tipo_vehiculo: 'Pick-up / Camioneta',
    numero_chasis: 'WVWZZZ2HZH8901234',
    numero_motor: 'DDX123456',
    anio: 2024, 
    kilometraje: 15000, 
    es_cero_km: false, 
    moneda: 'USD', 
    precio_lista: 48000, 
    costo_compra: 42000, 
    origen_stock: 'Compra Directa',
    origen_transaccion: 'Compra Directa a Cliente',
    es_solo_compra: true,
    comprado_a_cliente_id: 'c3',
    dueno_consigna_nombre: 'Esteban Fernández',
    dueno_consigna_telefono: '5491133221100',
    dueno_consigna_documento: '20-35444333-9',
    fecha_compra: '2026-08-15',
    estado: 'Disponible', 
    observaciones: 'Unidad Usada comprada directamente a cliente Esteban Fernández (Operación Solo Compra sin venta).', 
    created_at: '2026-08-20T10:00:00Z' 
  },
  { 
    id: 'v3', 
    patente: 'AE456LM', 
    marca: 'Peugeot', 
    modelo: '208 GT T200', 
    tipo_vehiculo: 'Hatchback',
    numero_chasis: '8ADCCB123456789',
    numero_motor: 'T200987654',
    anio: 2023, 
    kilometraje: 18500, 
    es_cero_km: false, 
    moneda: 'USD', 
    precio_lista: 21500, 
    costo_compra: 18000, 
    origen_stock: 'Consignación',
    origen_transaccion: 'Consignación',
    comprado_a_cliente_id: 'c2',
    dueno_consigna_nombre: 'Mariana Gómez',
    dueno_consigna_telefono: '5491144332211',
    dueno_consigna_documento: '34.567.890',
    fecha_compra: '2026-08-10',
    estado: 'Disponible', 
    observaciones: 'Techo panorámico, único dueño, consignación cliente VIP', 
    created_at: '2026-08-10T10:00:00Z' 
  },
  { 
    id: 'v4', 
    patente: 'AD789OP', 
    marca: 'Ford', 
    modelo: 'Ranger Limited 3.2', 
    tipo_vehiculo: 'Pick-up / Camioneta',
    numero_chasis: '8AF234567890123',
    numero_motor: 'PUMA32001',
    anio: 2021, 
    kilometraje: 65000, 
    es_cero_km: false, 
    moneda: 'USD', 
    precio_lista: 31000, 
    costo_compra: 26000, 
    origen_stock: 'Propio',
    origen_transaccion: 'Stock Propio 0km/Usado',
    estado: 'Reservado', 
    observaciones: 'Reservado con seña', 
    created_at: '2026-07-15T10:00:00Z' 
  },
  { 
    id: 'v5', 
    patente: 'AA321XY', 
    marca: 'Toyota', 
    modelo: 'Corolla SEG Hybrid', 
    tipo_vehiculo: 'Sedán',
    numero_chasis: '9BRBL3HE1234567',
    numero_motor: '2ZR554433',
    anio: 2020, 
    kilometraje: 55000, 
    es_cero_km: false, 
    moneda: 'USD', 
    precio_lista: 22000, 
    costo_compra: 18500, 
    origen_stock: 'Propio',
    origen_transaccion: 'Stock Propio 0km/Usado',
    comprado_a_cliente_id: 'c5',
    dueno_consigna_nombre: 'Roberto Rossi',
    dueno_consigna_telefono: '5491188550011',
    estado: 'Vendido', 
    observaciones: 'Vendido a Roberto Rossi', 
    created_at: '2025-03-01T10:00:00Z' 
  },
  { 
    id: 'v6', 
    patente: 'AC654BN', 
    marca: 'Chevrolet', 
    modelo: 'Cruze LTZ Sedan', 
    tipo_vehiculo: 'Sedán',
    numero_chasis: '8AGCA5678901234',
    numero_motor: 'LE212345',
    anio: 2019, 
    kilometraje: 72000, 
    es_cero_km: false, 
    moneda: 'USD', 
    precio_lista: 16500, 
    costo_compra: 14000, 
    origen_stock: 'Permuta',
    origen_transaccion: 'Toma en Permuta por Venta',
    comprado_a_cliente_id: 'c1',
    dueno_consigna_nombre: 'Carlos Rodríguez',
    dueno_consigna_telefono: '5491155443322',
    dueno_consigna_documento: '30.123.456',
    fecha_compra: '2026-08-01',
    estado: 'Reacondicionamiento', 
    observaciones: 'Ingresado por permuta de Carlos Rodríguez, detalla chapa guardabarros', 
    created_at: '2026-09-02T10:00:00Z' 
  },
];

const MOCK_PRESUPUESTOS: Presupuesto[] = [
  { id: 'p1', cliente_id: 'c1', vehiculo_id: 'v1', moneda: 'USD', precio_ofrecido: 36000, anticipo: 20000, saldo_financiado: 16000, estado: 'Enviado', created_at: '2026-09-05T12:00:00Z' },
  { id: 'p2', cliente_id: 'c3', vehiculo_id: 'v2', moneda: 'USD', precio_ofrecido: 47500, anticipo: 25000, saldo_financiado: 22500, estado: 'Borrador', created_at: '2026-09-07T09:30:00Z' },
  { id: 'p3', cliente_id: 'c5', vehiculo_id: 'v5', moneda: 'USD', precio_ofrecido: 22000, anticipo: 12000, saldo_financiado: 10000, estado: 'Ganado', created_at: '2025-03-12T15:00:00Z' },
  { id: 'p4', cliente_id: 'c4', vehiculo_id: 'v3', moneda: 'USD', precio_ofrecido: 21500, anticipo: 10000, saldo_financiado: 11500, estado: 'Perdido', motivo_perdida: 'Tasación baja', created_at: '2026-07-22T11:00:00Z' },
];

const MOCK_PERMUTAS: Permuta[] = [
  { id: 'pm1', presupuesto_id: 'p1', patente: 'AC987ZZ', marca_modelo: 'Volkswagen Gol Trend 1.6', anio: 2018, kilometraje: 85000, moneda: 'USD', valor_tasacion: 9500, observaciones: 'Buen estado general, cubiertas 70%' },
];

const MOCK_INTERACCIONES: Interaccion[] = [
  { id: 'i1', cliente_id: 'c1', tipo: 'Vino al salón', nota: 'Probó la Hilux. Le gustó el estado. Pidió presupuesto con financiación a 24 meses.', fecha_contacto: '2026-09-05T11:00:00Z', proximo_contacto: '2026-09-08T15:00:00Z' },
  { id: 'i2', cliente_id: 'c3', tipo: 'Llamó', nota: 'Consulta por Amarok V6 0km. Quiere entregar Ford Focus 2017 en parte de pago.', fecha_contacto: '2026-09-07T09:15:00Z', proximo_contacto: '2026-09-09T11:20:00Z' },
  { id: 'i3', cliente_id: 'c4', tipo: 'No contesta', nota: 'Se envió whatsapp con re-tasación mejorada.', fecha_contacto: '2026-08-01T10:00:00Z', proximo_contacto: '2026-09-10T10:00:00Z' },
];

const MOCK_PEDIDOS_ENCARGO: PedidoEncargo[] = [
  {
    id: 'enc_1',
    cliente_id: 'c1',
    marca_buscada: 'Toyota',
    modelo_buscado: 'Hilux SRV 4x4 Manual',
    anio_minimo: 2020,
    anio_maximo: 2024,
    presupuesto_maximo: 35000,
    moneda: 'USD',
    es_cero_km: false,
    color_preferencia: 'Blanco / Gris Plata',
    estado: 'Buscando en Mercado',
    observaciones: 'Cliente listo para abonar seña inmediata si se ubica unidad con menos de 70.000km',
    created_at: '2026-09-03T10:00:00Z'
  },
  {
    id: 'enc_2',
    cliente_id: 'c2',
    marca_buscada: 'Peugeot',
    modelo_buscado: '208 GT T200',
    anio_minimo: 2023,
    anio_maximo: 2026,
    presupuesto_maximo: 24000,
    moneda: 'USD',
    es_cero_km: true,
    color_preferencia: 'Negro Perla',
    estado: 'Unidad Localizada',
    observaciones: 'Unidad localizada en concesionario colega de CABA.',
    created_at: '2026-08-25T14:20:00Z'
  }
];

const MOCK_PRESTAMOS_PAGARES: PrestamoPagare[] = [
  {
    id: 'prest_1',
    cliente_id: 'c5',
    vehiculo_id: 'v5',
    presupuesto_id: 'p3',
    monto_total_prestado: 10000,
    moneda: 'USD',
    cantidad_cuotas: 10,
    tasa_interes_anual: 12,
    monto_cuota_promedio: 1100,
    fecha_otorgamiento: '2025-03-12',
    estado: 'Activo',
    observaciones: 'Crédito con 10 pagarés firmados por el comprador Roberto Rossi',
    created_at: '2025-03-12T15:00:00Z'
  }
];

const MOCK_CUOTAS_PAGARES: CuotaPagare[] = [
  {
    id: 'cuota_1',
    prestamo_id: 'prest_1',
    numero_cuota: 1,
    numero_pagare: 'PAG-0001',
    monto_cuota: 1100,
    moneda: 'USD',
    fecha_vencimiento: '2025-04-12',
    estado: 'Cobrado',
    monto_pagado: 1100,
    fecha_pago: '2025-04-10T11:00:00Z',
    comprobante_pago: 'REC-00124',
    created_at: '2025-03-12T15:00:00Z'
  },
  {
    id: 'cuota_2',
    prestamo_id: 'prest_1',
    numero_cuota: 2,
    numero_pagare: 'PAG-0002',
    monto_cuota: 1100,
    moneda: 'USD',
    fecha_vencimiento: '2025-05-12',
    estado: 'Cobrado',
    monto_pagado: 1100,
    fecha_pago: '2025-05-11T16:00:00Z',
    comprobante_pago: 'REC-00155',
    created_at: '2025-03-12T15:00:00Z'
  },
  {
    id: 'cuota_3',
    prestamo_id: 'prest_1',
    numero_cuota: 3,
    numero_pagare: 'PAG-0003',
    monto_cuota: 1100,
    moneda: 'USD',
    fecha_vencimiento: '2026-09-10',
    estado: 'Vencido',
    created_at: '2025-03-12T15:00:00Z'
  },
  {
    id: 'cuota_4',
    prestamo_id: 'prest_1',
    numero_cuota: 4,
    numero_pagare: 'PAG-0004',
    monto_cuota: 1100,
    moneda: 'USD',
    fecha_vencimiento: '2026-09-18',
    estado: 'Pendiente',
    created_at: '2025-03-12T15:00:00Z'
  }
];

const MOCK_RECLAMOS_COBRANZA: ReclamoCobranza[] = [
  {
    id: 'rec_1',
    cuota_id: 'cuota_3',
    cliente_id: 'c5',
    fecha_contacto: '2026-09-12T10:30:00Z',
    tipo_gestion: 'Llamada Telefónica',
    resultado_gestion: 'Compromiso de Pago',
    fecha_compromiso_pago: '2026-09-16',
    monto_prometido: 1100,
    detalle_reclamo: 'Cliente indica que estuvo de viaje. Se compromete a abonar en salón el 16 de Septiembre.',
    atendido_por: 'Laura - Administración'
  }
];

const STORAGE_KEYS = {
  CLIENTES: 'agencia_crm_clientes',
  INVENTARIO: 'agencia_crm_inventario',
  PRESUPUESTOS: 'agencia_crm_presupuestos',
  PERMUTAS: 'agencia_crm_permutas',
  INTERACCIONES: 'agencia_crm_interacciones',
  PEDIDOS_ENCARGO: 'agencia_crm_pedidos_encargo',
  PRESTAMOS_PAGARES: 'agencia_crm_prestamos_pagares',
  CUOTAS_PAGARES: 'agencia_crm_cuotas_pagares',
  RECLAMOS_COBRANZA: 'agencia_crm_reclamos_cobranza',
};

const getLocal = <T>(key: string, seed: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
};

const setLocal = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const dataService = {
  // CLIENTES
  async getClientes(): Promise<Cliente[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as Cliente[];
    }
    return getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
  },

  async createCliente(cliente: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente> {
    const newCliente: Cliente = {
      ...cliente,
      id: 'c_' + Date.now(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clientes').insert([cliente]).select().single();
      if (!error && data) return data as Cliente;
    }

    const current = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const updated = [newCliente, ...current];
    setLocal(STORAGE_KEYS.CLIENTES, updated);
    return newCliente;
  },

  async updateCliente(cliente: Cliente): Promise<Cliente> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', cliente.id)
        .select()
        .single();
      if (!error && data) return data as Cliente;
    }

    const current = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const updated = current.map(c => c.id === cliente.id ? { ...c, ...cliente } : c);
    setLocal(STORAGE_KEYS.CLIENTES, updated);
    return cliente;
  },

  // INVENTARIO
  async getInventario(rol: UserRole = getActiveRoleSync()): Promise<Inventario[]> {
    let list: Inventario[] = [];

    if (isSupabaseConfigured && supabase) {
      if (rol === 'vendedor') {
        // En Supabase, el vendedor consulta la vista segura sin costo_compra
        const { data, error } = await supabase.from('vista_inventario_comercial').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          list = data.map((item: any) => ({
            ...item,
            costo_compra: 0, // Inaccesible para vendedores
          })) as Inventario[];
        }
      } else {
        const { data, error } = await supabase.from('inventario').select('*').order('created_at', { ascending: false });
        if (!error && data) list = data as Inventario[];
      }
    } else {
      list = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);
    }

    // RBAC: Si el rol activo es vendedor, ofuscar costo_compra a nivel de servicio
    if (rol === 'vendedor') {
      return list.map((item) => ({
        ...item,
        costo_compra: 0,
      }));
    }

    return list;
  },

  async createVehiculo(vehiculo: Omit<Inventario, 'id' | 'created_at'>): Promise<Inventario> {
    const newVehiculo: Inventario = {
      ...vehiculo,
      id: 'v_' + Date.now(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('inventario').insert([vehiculo]).select().single();
      if (!error && data) return data as Inventario;
    }

    const current = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);
    const updated = [newVehiculo, ...current];
    setLocal(STORAGE_KEYS.INVENTARIO, updated);
    return newVehiculo;
  },

  async updateVehiculo(vehiculo: Inventario, rol: UserRole = getActiveRoleSync()): Promise<Inventario> {
    const current = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);
    const existing = current.find(item => item.id === vehiculo.id);

    // Integridad RBAC: Un vendedor jamás puede pisar el costo de compra real
    const safeVehiculo: Inventario = {
      ...vehiculo,
      costo_compra: (rol === 'vendedor' && existing) ? existing.costo_compra : vehiculo.costo_compra,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inventario')
        .update(safeVehiculo)
        .eq('id', safeVehiculo.id)
        .select()
        .single();
      if (!error && data) return data as Inventario;
    }

    const updated = current.map(item => item.id === safeVehiculo.id ? safeVehiculo : item);
    setLocal(STORAGE_KEYS.INVENTARIO, updated);
    return safeVehiculo;
  },

  async deleteVehiculo(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('inventario').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar vehículo en Supabase:', error);
        return false;
      }
    }
    const current = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);
    const updated = current.filter(item => item.id !== id);
    setLocal(STORAGE_KEYS.INVENTARIO, updated);
    return true;
  },

  async updateEstadoVehiculo(id: string, estado: Inventario['estado']): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('inventario').update({ estado }).eq('id', id);
      return;
    }
    const current = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);
    const updated = current.map(item => item.id === id ? { ...item, estado } : item);
    setLocal(STORAGE_KEYS.INVENTARIO, updated);
  },

  // PRESUPUESTOS
  async getPresupuestos(rol: UserRole = getActiveRoleSync()): Promise<Presupuesto[]> {
    let presupuestosList: Presupuesto[] = [];

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('presupuestos')
        .select(`
          *,
          cliente:clientes(*),
          vehiculo:inventario(*),
          permuta:permutas(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        presupuestosList = data.map((p: any) => ({
          ...p,
          permuta: Array.isArray(p.permuta) && p.permuta.length > 0 ? p.permuta[0] : p.permuta || undefined
        })) as Presupuesto[];
      }
    } else {
      const rawList = getLocal<Presupuesto[]>(STORAGE_KEYS.PRESUPUESTOS, MOCK_PRESUPUESTOS);
      const clientesList = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
      const inventarioList = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);
      const permutasList = getLocal<Permuta[]>(STORAGE_KEYS.PERMUTAS, MOCK_PERMUTAS);

      presupuestosList = rawList.map(p => ({
        ...p,
        cliente: clientesList.find(c => c.id === p.cliente_id),
        vehiculo: inventarioList.find(v => v.id === p.vehiculo_id),
        permuta: permutasList.find(pm => pm.presupuesto_id === p.id),
      }));
    }

    // RBAC: Si el rol es vendedor, ofuscar el costo_compra en el vehículo incrustado
    if (rol === 'vendedor') {
      return presupuestosList.map(p => ({
        ...p,
        vehiculo: p.vehiculo ? { ...p.vehiculo, costo_compra: 0 } : undefined,
      }));
    }

    return presupuestosList;
  },

  async createPresupuesto(
    data: {
      id?: string;
      cliente_id: string;
      vehiculo_id?: string;
      vehiculos_cotizados?: PresupuestoVehiculoItem[];
      moneda: TipoMoneda;
      precio_ofrecido: number;
      anticipo: number;
      saldo_financiado: number;
      estado: EstadoPresupuesto;
    },
    permutaData?: Omit<Permuta, 'id' | 'presupuesto_id' | 'created_at'>
  ): Promise<Presupuesto> {
    const isEdit = Boolean(data.id);
    const targetId = data.id || ('p_' + Date.now());
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      if (isEdit) {
        const { data: pres, error: presErr } = await supabase
          .from('presupuestos')
          .update({
            cliente_id: data.cliente_id,
            vehiculo_id: data.vehiculo_id,
            vehiculos_cotizados: data.vehiculos_cotizados || null,
            moneda: data.moneda,
            precio_ofrecido: data.precio_ofrecido,
            anticipo: data.anticipo,
            saldo_financiado: data.saldo_financiado,
            estado: data.estado
          })
          .eq('id', targetId)
          .select()
          .single();

        if (!presErr && pres) {
          if (permutaData) {
            await supabase.from('permutas').delete().eq('presupuesto_id', targetId);
            await supabase.from('permutas').insert([{ ...permutaData, presupuesto_id: targetId }]);
          }
          return pres as Presupuesto;
        }
      } else {
        const { data: pres, error: presErr } = await supabase
          .from('presupuestos')
          .insert([{
            cliente_id: data.cliente_id,
            vehiculo_id: data.vehiculo_id,
            vehiculos_cotizados: data.vehiculos_cotizados || null,
            moneda: data.moneda,
            precio_ofrecido: data.precio_ofrecido,
            anticipo: data.anticipo,
            saldo_financiado: data.saldo_financiado,
            estado: data.estado
          }])
          .select()
          .single();

        if (!presErr && pres) {
          if (permutaData) {
            await supabase.from('permutas').insert([{ ...permutaData, presupuesto_id: pres.id }]);
          }
          return pres as Presupuesto;
        }
      }
    }

    // LocalStorage Fallback
    const presupuestos = getLocal<Presupuesto[]>(STORAGE_KEYS.PRESUPUESTOS, MOCK_PRESUPUESTOS);
    let updatedPresupuesto: Presupuesto;

    if (isEdit) {
      const idx = presupuestos.findIndex(p => p.id === targetId);
      if (idx !== -1) {
        updatedPresupuesto = {
          ...presupuestos[idx],
          ...data,
          id: targetId,
        };
        presupuestos[idx] = updatedPresupuesto;
      } else {
        updatedPresupuesto = { id: targetId, created_at: now, ...data } as Presupuesto;
        presupuestos.unshift(updatedPresupuesto);
      }
      setLocal(STORAGE_KEYS.PRESUPUESTOS, presupuestos);
    } else {
      updatedPresupuesto = {
        id: targetId,
        created_at: now,
        ...data,
      } as Presupuesto;
      setLocal(STORAGE_KEYS.PRESUPUESTOS, [updatedPresupuesto, ...presupuestos]);
    }

    if (permutaData) {
      const permutas = getLocal<Permuta[]>(STORAGE_KEYS.PERMUTAS, MOCK_PERMUTAS);
      const permutaIdx = permutas.findIndex(pm => pm.presupuesto_id === targetId);
      const newPermutaObj: Permuta = {
        id: permutaIdx !== -1 ? permutas[permutaIdx].id : ('pm_' + Date.now()),
        presupuesto_id: targetId,
        ...permutaData,
        created_at: now,
      };
      if (permutaIdx !== -1) {
        permutas[permutaIdx] = newPermutaObj;
      } else {
        permutas.unshift(newPermutaObj);
      }
      setLocal(STORAGE_KEYS.PERMUTAS, permutas);
    }

    return updatedPresupuesto;
  },

  async updateEstadoPresupuesto(
    presupuestoId: string, 
    nuevoEstado: EstadoPresupuesto, 
    motivoPerdida?: MotivoPerdida
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const payload: any = { estado: nuevoEstado };
      if (nuevoEstado.toLowerCase() === 'perdido' && motivoPerdida) {
        payload.motivo_perdida = motivoPerdida;
      }
      await supabase.from('presupuestos').update(payload).eq('id', presupuestoId);
      return;
    }

    const presupuestos = getLocal<Presupuesto[]>(STORAGE_KEYS.PRESUPUESTOS, MOCK_PRESUPUESTOS);
    const inventario = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const permutas = getLocal<Permuta[]>(STORAGE_KEYS.PERMUTAS, MOCK_PERMUTAS);

    const presIndex = presupuestos.findIndex(p => p.id === presupuestoId);
    if (presIndex === -1) return;

    const presTarget = presupuestos[presIndex];
    presTarget.estado = nuevoEstado;
    if (motivoPerdida) {
      presTarget.motivo_perdida = motivoPerdida;
    }

    const isGanado = nuevoEstado.toLowerCase() === 'ganado';
    const isPerdido = nuevoEstado.toLowerCase() === 'perdido';

    if (isGanado) {
      if (presTarget.vehiculo_id) {
        const vehIndex = inventario.findIndex(v => v.id === presTarget.vehiculo_id);
        if (vehIndex !== -1) {
          inventario[vehIndex].estado = 'Vendido';
        }
      }

      const cliIndex = clientes.findIndex(c => c.id === presTarget.cliente_id);
      if (cliIndex !== -1) {
        clientes[cliIndex].tipo_cliente = 'Comprador';
      }

      const permutaAsociada = permutas.find(pm => pm.presupuesto_id === presupuestoId);
      if (permutaAsociada) {
        const parts = permutaAsociada.marca_modelo.split(' ');
        const marca = parts[0] || 'Usado';
        const modelo = parts.slice(1).join(' ') || 'Permuta';

        const nuevaUnidad: Inventario = {
          id: 'v_' + Date.now(),
          patente: permutaAsociada.patente?.toUpperCase() || ('PER-' + Math.floor(Math.random()*1000)),
          marca,
          modelo,
          anio: permutaAsociada.anio,
          kilometraje: permutaAsociada.kilometraje,
          es_cero_km: false,
          moneda: permutaAsociada.moneda || 'USD',
          precio_lista: Math.round(permutaAsociada.valor_tasacion * 1.15),
          costo_compra: permutaAsociada.valor_tasacion,
          estado: 'Reacondicionamiento',
          observaciones: `Ingresado por permuta de presupuesto #${presupuestoId}. Notas: ${permutaAsociada.observaciones || 'Sin notas'}`,
          created_at: new Date().toISOString(),
        };
        inventario.unshift(nuevaUnidad);
      }
    } else if (isPerdido) {
      const cliIndex = clientes.findIndex(c => c.id === presTarget.cliente_id);
      if (cliIndex !== -1) {
        clientes[cliIndex].tipo_cliente = 'No compro';
      }
    }

    setLocal(STORAGE_KEYS.PRESUPUESTOS, [...presupuestos]);
    setLocal(STORAGE_KEYS.INVENTARIO, [...inventario]);
    setLocal(STORAGE_KEYS.CLIENTES, [...clientes]);
  },

  // INTERACCIONES
  async getInteracciones(): Promise<Interaccion[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('interacciones')
        .select(`*, cliente:clientes(*)`)
        .order('fecha_contacto', { ascending: false });
      if (!error && data) return data as Interaccion[];
    }

    const interacciones = getLocal<Interaccion[]>(STORAGE_KEYS.INTERACCIONES, MOCK_INTERACCIONES);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);

    return interacciones.map(i => ({
      ...i,
      cliente: clientes.find(c => c.id === i.cliente_id)
    }));
  },

  async createInteraccion(interaccion: Omit<Interaccion, 'id' | 'fecha_contacto'>): Promise<Interaccion> {
    const now = new Date().toISOString();
    const newInteraccion: Interaccion = {
      ...interaccion,
      id: 'i_' + Date.now(),
      fecha_contacto: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('interacciones').insert([{
        cliente_id: interaccion.cliente_id,
        tipo: interaccion.tipo,
        nota: interaccion.nota,
        proximo_contacto: interaccion.proximo_contacto || null
      }]).select().single();

      if (!error && data) return data as Interaccion;
    }

    const list = getLocal<Interaccion[]>(STORAGE_KEYS.INTERACCIONES, MOCK_INTERACCIONES);
    const updated = [newInteraccion, ...list];
    setLocal(STORAGE_KEYS.INTERACCIONES, updated);

    // Sync client's last contact timestamp & latest note
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const cliIdx = clientes.findIndex(c => c.id === interaccion.cliente_id);
    if (cliIdx !== -1) {
      clientes[cliIdx].ultimo_contacto = now;
      if (interaccion.nota) {
        clientes[cliIdx].notas = `[${new Date().toLocaleDateString('es-AR')}] ${interaccion.nota}`;
      }
      setLocal(STORAGE_KEYS.CLIENTES, clientes);
    }

    return newInteraccion;
  },

  // IMPORT / RESTORE BACKUP
  async importData(data: { clientes?: Cliente[]; inventario?: Inventario[] }): Promise<void> {
    if (data.clientes) {
      const current = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
      setLocal(STORAGE_KEYS.CLIENTES, [...data.clientes, ...current]);
    }
    if (data.inventario) {
      const current = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);
      setLocal(STORAGE_KEYS.INVENTARIO, [...data.inventario, ...current]);
    }
  },

  // DASHBOARD METRICS
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const clientes = await this.getClientes();
    const inventario = await this.getInventario();
    const presupuestos = await this.getPresupuestos();

    const totalLeads = clientes.length;
    const totalPresupuestos = presupuestos.length;
    const ganados = presupuestos.filter(p => p.estado.toLowerCase() === 'ganado').length;
    const perdidos = presupuestos.filter(p => p.estado.toLowerCase() === 'perdido').length;
    
    const tasaConversion = (ganados + perdidos) > 0 
      ? Math.round((ganados / (ganados + perdidos)) * 100) 
      : 0;

    const stockDisponible = inventario.filter(v => v.estado.toLowerCase() === 'disponible');
    const valorTotalStockUSD = stockDisponible.filter(v => v.moneda === 'USD' || !v.moneda).reduce((sum, v) => sum + (v.precio_lista || 0), 0);
    const valorTotalStockARS = stockDisponible.filter(v => v.moneda === 'ARS').reduce((sum, v) => sum + (v.precio_lista || 0), 0);

    const motivosMap: Record<string, number> = {};
    presupuestos.forEach(p => {
      if (p.estado.toLowerCase() === 'perdido' && p.motivo_perdida) {
        motivosMap[p.motivo_perdida] = (motivosMap[p.motivo_perdida] || 0) + 1;
      }
    });

    const motivosPerdida = Object.entries(motivosMap).map(([motivo, cantidad]) => ({
      motivo,
      cantidad,
    }));

    return {
      totalLeads,
      totalPresupuestos,
      tasaConversion,
      diasPromedioStock: 24,
      autosVendidosMes: ganados,
      stockDisponibleCount: stockDisponible.length,
      valorTotalStockUSD,
      valorTotalStockARS,
      motivosPerdida,
      evolucionVentas: [
        { mes: 'May', ventas: 3, monto: 72000 },
        { mes: 'Jun', ventas: 5, monto: 115000 },
        { mes: 'Jul', ventas: 4, monto: 98000 },
        { mes: 'Ago', ventas: 6, monto: 142000 },
        { mes: 'Sep', ventas: ganados || 2, monto: 58000 },
      ]
    };
  },

  // --------------------------------------------------------------------------
  // PEDIDOS POR ENCARGO (RADAR DE VENTA POTENCIAL)
  // --------------------------------------------------------------------------
  async getPedidosEncargo(): Promise<PedidoEncargo[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('pedidos_encargo').select('*, cliente:clientes(*), vehiculo_coincidente:inventario(*)').order('created_at', { ascending: false });
      if (!error && data) return data as PedidoEncargo[];
    }
    const list = getLocal<PedidoEncargo[]>(STORAGE_KEYS.PEDIDOS_ENCARGO, MOCK_PEDIDOS_ENCARGO);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const inventario = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);

    return list.map(item => ({
      ...item,
      cliente: clientes.find(c => c.id === item.cliente_id),
      vehiculo_coincidente: item.vehiculo_coincidente_id ? inventario.find(v => v.id === item.vehiculo_coincidente_id) : undefined
    }));
  },

  async createPedidoEncargo(encargo: Omit<PedidoEncargo, 'id'>): Promise<PedidoEncargo> {
    const newEncargo: PedidoEncargo = {
      ...encargo,
      id: 'enc_' + Date.now(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('pedidos_encargo').insert([encargo]).select().single();
      if (!error && data) return data as PedidoEncargo;
    }

    const list = getLocal<PedidoEncargo[]>(STORAGE_KEYS.PEDIDOS_ENCARGO, MOCK_PEDIDOS_ENCARGO);
    const updated = [newEncargo, ...list];
    setLocal(STORAGE_KEYS.PEDIDOS_ENCARGO, updated);
    return newEncargo;
  },

  async updatePedidoEncargoEstado(id: string, estado: EstadoPedidoEncargo): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('pedidos_encargo').update({ estado }).eq('id', id);
    }
    const list = getLocal<PedidoEncargo[]>(STORAGE_KEYS.PEDIDOS_ENCARGO, MOCK_PEDIDOS_ENCARGO);
    const updated = list.map(e => e.id === id ? { ...e, estado } : e);
    setLocal(STORAGE_KEYS.PEDIDOS_ENCARGO, updated);
  },

  async linkPedidoEncargoVehiculo(encargoId: string, vehiculoId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('pedidos_encargo').update({ 
        vehiculo_coincidente_id: vehiculoId, 
        estado: 'Unidad Localizada' 
      }).eq('id', encargoId);
    }
    const list = getLocal<PedidoEncargo[]>(STORAGE_KEYS.PEDIDOS_ENCARGO, MOCK_PEDIDOS_ENCARGO);
    const updated = list.map(e => e.id === encargoId ? { ...e, vehiculo_coincidente_id: vehiculoId, estado: 'Unidad Localizada' as EstadoPedidoEncargo } : e);
    setLocal(STORAGE_KEYS.PEDIDOS_ENCARGO, updated);
  },

  // --------------------------------------------------------------------------
  // PRÉSTAMOS, PAGARÉS Y COBRANZAS
  // --------------------------------------------------------------------------
  async getPrestamosPagares(rol: UserRole = getActiveRoleSync()): Promise<PrestamoPagare[]> {
    if (rol === 'vendedor') return []; // Bloqueado estrictamente para vendedores

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('prestamos_pagares').select('*, cliente:clientes(*), vehiculo:inventario(*)').order('created_at', { ascending: false });
      if (!error && data) return data as PrestamoPagare[];
    }
    const list = getLocal<PrestamoPagare[]>(STORAGE_KEYS.PRESTAMOS_PAGARES, MOCK_PRESTAMOS_PAGARES);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);
    const inventario = getLocal<Inventario[]>(STORAGE_KEYS.INVENTARIO, MOCK_INVENTARIO);

    return list.map(item => ({
      ...item,
      cliente: clientes.find(c => c.id === item.cliente_id),
      vehiculo: item.vehiculo_id ? inventario.find(v => v.id === item.vehiculo_id) : undefined
    }));
  },

  async createPrestamoPagare(prestamo: Omit<PrestamoPagare, 'id'>, numeroPagareInicial: string = 'PAG-0001'): Promise<PrestamoPagare> {
    const prestamoId = 'prest_' + Date.now();
    const newPrestamo: PrestamoPagare = {
      ...prestamo,
      id: prestamoId,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('prestamos_pagares').insert([prestamo]).select().single();
      if (!error && data) {
        // Auto-generate installment due dates
        const cuotasList = [];
        const montoCuota = prestamo.monto_cuota_promedio;
        const fechaInicio = new Date(prestamo.fecha_otorgamiento || new Date());
        for (let i = 1; i <= prestamo.cantidad_cuotas; i++) {
          const fechaVenc = new Date(fechaInicio);
          fechaVenc.setMonth(fechaVenc.getMonth() + i);
          cuotasList.push({
            prestamo_id: data.id,
            numero_cuota: i,
            numero_pagare: `${numeroPagareInicial.replace(/\d+$/, '')}${String(i).padStart(4, '0')}`,
            monto_cuota: montoCuota,
            moneda: prestamo.moneda,
            fecha_vencimiento: fechaVenc.toISOString().split('T')[0],
            estado: 'Pendiente'
          });
        }
        await supabase.from('cuotas_pagares').insert(cuotasList);
        return data as PrestamoPagare;
      }
    }

    // Local Storage Fallback with automatic installment generation
    const currentPrestamos = getLocal<PrestamoPagare[]>(STORAGE_KEYS.PRESTAMOS_PAGARES, MOCK_PRESTAMOS_PAGARES);
    setLocal(STORAGE_KEYS.PRESTAMOS_PAGARES, [newPrestamo, ...currentPrestamos]);

    const currentCuotas = getLocal<CuotaPagare[]>(STORAGE_KEYS.CUOTAS_PAGARES, MOCK_CUOTAS_PAGARES);
    const generatedCuotas: CuotaPagare[] = [];
    const fechaInicio = new Date(prestamo.fecha_otorgamiento || new Date());

    // Extract prefix if any
    const prefix = numeroPagareInicial.replace(/\d+$/, '') || 'PAG-';

    for (let i = 1; i <= prestamo.cantidad_cuotas; i++) {
      const fechaVenc = new Date(fechaInicio);
      fechaVenc.setMonth(fechaVenc.getMonth() + i);
      generatedCuotas.push({
        id: `cuota_${prestamoId}_${i}`,
        prestamo_id: prestamoId,
        numero_cuota: i,
        numero_pagare: `${prefix}${String(i).padStart(4, '0')}`,
        monto_cuota: prestamo.monto_cuota_promedio,
        moneda: prestamo.moneda,
        fecha_vencimiento: fechaVenc.toISOString().split('T')[0],
        estado: 'Pendiente',
        created_at: new Date().toISOString()
      });
    }

    setLocal(STORAGE_KEYS.CUOTAS_PAGARES, [...generatedCuotas, ...currentCuotas]);
    return newPrestamo;
  },

  async getCuotasPagares(rol: UserRole = getActiveRoleSync()): Promise<CuotaPagare[]> {
    if (rol === 'vendedor') return []; // Bloqueado estrictamente para vendedores

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('cuotas_pagares').select('*, prestamo:prestamos_pagares(*, cliente:clientes(*))').order('fecha_vencimiento', { ascending: true });
      if (!error && data) return data as CuotaPagare[];
    }

    const cuotas = getLocal<CuotaPagare[]>(STORAGE_KEYS.CUOTAS_PAGARES, MOCK_CUOTAS_PAGARES);
    const prestamos = getLocal<PrestamoPagare[]>(STORAGE_KEYS.PRESTAMOS_PAGARES, MOCK_PRESTAMOS_PAGARES);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);

    return cuotas.map(c => {
      const p = prestamos.find(pr => pr.id === c.prestamo_id);
      const cli = p ? clientes.find(cl => cl.id === p.cliente_id) : undefined;
      return {
        ...c,
        prestamo: p,
        cliente: cli,
        cliente_id: p ? p.cliente_id : ''
      };
    });
  },

  async updateCuotaPago(cuotaId: string, montoPagado: number, comprobante?: string, observaciones?: string, fechaPagoCustom?: string): Promise<void> {
    const fechaPago = fechaPagoCustom ? (fechaPagoCustom.includes('T') ? fechaPagoCustom : `${fechaPagoCustom}T12:00:00`) : new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      await supabase.from('cuotas_pagares').update({
        estado: 'Cobrado',
        monto_pagado: montoPagado,
        fecha_pago: fechaPago,
        comprobante_pago: comprobante,
        observaciones: observaciones
      }).eq('id', cuotaId);
    }

    const list = getLocal<CuotaPagare[]>(STORAGE_KEYS.CUOTAS_PAGARES, MOCK_CUOTAS_PAGARES);
    const updated = list.map(c => c.id === cuotaId ? {
      ...c,
      estado: 'Cobrado' as const,
      monto_pagado: montoPagado,
      fecha_pago: fechaPago,
      comprobante_pago: comprobante,
      observaciones: observaciones
    } : c);
    setLocal(STORAGE_KEYS.CUOTAS_PAGARES, updated);

    // Auto-log interaction entry in client history
    const targetCuota = updated.find(c => c.id === cuotaId);
    if (targetCuota) {
      const prestamos = getLocal<PrestamoPagare[]>(STORAGE_KEYS.PRESTAMOS_PAGARES, MOCK_PRESTAMOS_PAGARES);
      const prest = prestamos.find(p => p.id === targetCuota.prestamo_id);
      const clienteId = targetCuota.cliente_id || prest?.cliente_id;
      if (clienteId) {
        const interacciones = getLocal<Interaccion[]>(STORAGE_KEYS.INTERACCIONES, MOCK_INTERACCIONES);
        const montoText = `${targetCuota.moneda === 'ARS' ? '$' : 'USD $'}${montoPagado.toLocaleString('es-AR')}`;
        const compText = comprobante ? ` (Forma/Comprobante: ${comprobante})` : '';
        const newInt: Interaccion = {
          id: 'int_cobro_' + Date.now(),
          cliente_id: clienteId,
          tipo: 'Cobro Pagaré' as any,
          nota: `💰 COBRO DE PAGARÉ REGISTRADO: ${targetCuota.numero_pagare || `PAG-${String(targetCuota.numero_cuota).padStart(4, '0')}`} (Cuota ${targetCuota.numero_cuota}) cobrado exitosamente por ${montoText}.${compText}`,
          fecha_contacto: new Date().toISOString(),
        };
        setLocal(STORAGE_KEYS.INTERACCIONES, [newInt, ...interacciones]);
      }
    }
  },

  async updateCuotaDetails(
    cuotaId: string, 
    data: { 
      fecha_vencimiento?: string; 
      numero_pagare?: string; 
      monto_cuota?: number; 
      observaciones?: string; 
      estado?: EstadoCuota;
      comprobante_pago?: string;
      fecha_pago?: string;
      monto_pagado?: number;
    }
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('cuotas_pagares').update(data).eq('id', cuotaId);
    }

    const list = getLocal<CuotaPagare[]>(STORAGE_KEYS.CUOTAS_PAGARES, MOCK_CUOTAS_PAGARES);
    const updated = list.map(c => c.id === cuotaId ? { ...c, ...data } : c);
    setLocal(STORAGE_KEYS.CUOTAS_PAGARES, updated);

    // Auto-log interaction if state became Cobrado
    if (data.estado === 'Cobrado') {
      const targetCuota = updated.find(c => c.id === cuotaId);
      if (targetCuota) {
        const prestamos = getLocal<PrestamoPagare[]>(STORAGE_KEYS.PRESTAMOS_PAGARES, MOCK_PRESTAMOS_PAGARES);
        const prest = prestamos.find(p => p.id === targetCuota.prestamo_id);
        const clienteId = targetCuota.cliente_id || prest?.cliente_id;
        if (clienteId) {
          const interacciones = getLocal<Interaccion[]>(STORAGE_KEYS.INTERACCIONES, MOCK_INTERACCIONES);
          const montoText = `${targetCuota.moneda === 'ARS' ? '$' : 'USD $'}${ (targetCuota.monto_pagado || targetCuota.monto_cuota).toLocaleString('es-AR')}`;
          const compText = targetCuota.comprobante_pago ? ` (Forma/Comprobante: ${targetCuota.comprobante_pago})` : '';
          const newInt: Interaccion = {
            id: 'int_cobro_' + Date.now(),
            cliente_id: clienteId,
            tipo: 'Cobro Pagaré' as any,
            nota: `💰 COBRO DE PAGARÉ REGISTRADO: ${targetCuota.numero_pagare || `PAG-${String(targetCuota.numero_cuota).padStart(4, '0')}`} (Cuota ${targetCuota.numero_cuota}) cobrado exitosamente por ${montoText}.${compText}`,
            fecha_contacto: new Date().toISOString(),
          };
          setLocal(STORAGE_KEYS.INTERACCIONES, [newInt, ...interacciones]);
        }
      }
    }
  },

  async updateCuotaFechaVencimiento(cuotaId: string, nuevaFechaVencimiento: string, numeroPagare?: string): Promise<void> {
    return this.updateCuotaDetails(cuotaId, {
      fecha_vencimiento: nuevaFechaVencimiento,
      ...(numeroPagare ? { numero_pagare: numeroPagare } : {})
    });
  },

  async getReclamosCobranza(): Promise<ReclamoCobranza[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('reclamos_cobranza').select('*, cliente:clientes(*)').order('fecha_contacto', { ascending: false });
      if (!error && data) return data as ReclamoCobranza[];
    }
    const reclamos = getLocal<ReclamoCobranza[]>(STORAGE_KEYS.RECLAMOS_COBRANZA, MOCK_RECLAMOS_COBRANZA);
    const clientes = getLocal<Cliente[]>(STORAGE_KEYS.CLIENTES, MOCK_CLIENTES);

    return reclamos.map(r => ({
      ...r,
      cliente: clientes.find(c => c.id === r.cliente_id)
    }));
  },

  async createReclamoCobranza(reclamo: Omit<ReclamoCobranza, 'id'>): Promise<ReclamoCobranza> {
    const newReclamo: ReclamoCobranza = {
      ...reclamo,
      id: 'rec_' + Date.now()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('reclamos_cobranza').insert([reclamo]).select().single();
      if (!error && data) return data as ReclamoCobranza;
    }

    const list = getLocal<ReclamoCobranza[]>(STORAGE_KEYS.RECLAMOS_COBRANZA, MOCK_RECLAMOS_COBRANZA);
    const updated = [newReclamo, ...list];
    setLocal(STORAGE_KEYS.RECLAMOS_COBRANZA, updated);
    return newReclamo;
  },

  // HERRAMIENTAS DE DIAGNÓSTICO SUPERADMIN
  async testSupabaseDiagnostic(): Promise<{
    configured: boolean;
    connected: boolean;
    latencyMs: number;
    tables: { name: string; status: 'ok' | 'error' | 'not_found'; count?: number; error?: string }[];
    supabaseUrl?: string;
  }> {
    const start = performance.now();
    const envObj = (import.meta as any).env || {};
    const supabaseUrl = envObj.VITE_SUPABASE_URL || '';

    if (!isSupabaseConfigured || !supabase) {
      return {
        configured: false,
        connected: false,
        latencyMs: 0,
        tables: [
          { name: 'clientes', status: 'not_found', error: 'Modo Offline / LocalStorage activo' },
          { name: 'inventario', status: 'not_found', error: 'Modo Offline / LocalStorage activo' },
          { name: 'presupuestos', status: 'not_found', error: 'Modo Offline / LocalStorage activo' },
          { name: 'cuotas_pagares', status: 'not_found', error: 'Modo Offline / LocalStorage activo' },
          { name: 'catalogo_vehiculos', status: 'not_found', error: 'Modo Offline / LocalStorage activo' },
          { name: 'perfiles_usuarios', status: 'not_found', error: 'Modo Offline / LocalStorage activo' }
        ],
        supabaseUrl: supabaseUrl || 'No configurada (Falta .env)'
      };
    }

    try {
      const tablesToCheck = ['clientes', 'inventario', 'presupuestos', 'cuotas_pagares', 'catalogo_vehiculos', 'perfiles_usuarios'];
      const tableResults: { name: string; status: 'ok' | 'error' | 'not_found'; count?: number; error?: string }[] = [];

      for (const t of tablesToCheck) {
        try {
          const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
          if (error) {
            tableResults.push({ name: t, status: 'error', error: error.message });
          } else {
            tableResults.push({ name: t, status: 'ok', count: count ?? 0 });
          }
        } catch (e: any) {
          tableResults.push({ name: t, status: 'error', error: e?.message || 'Error al consultar tabla' });
        }
      }

      const latencyMs = Math.round(performance.now() - start);

      return {
        configured: true,
        connected: true,
        latencyMs,
        tables: tableResults,
        supabaseUrl
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        configured: true,
        connected: false,
        latencyMs,
        tables: [],
        supabaseUrl
      };
    }
  }
};

