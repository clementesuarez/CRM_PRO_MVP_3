export type TipoCliente = 
  | 'Prospecto' 
  | 'Comprador' 
  | 'No compro' 
  | 'No califica como comprador' 
  | 'Otro';

export type EstadoVehiculo = 
  | 'Disponible' 
  | 'Reservado' 
  | 'Vendido' 
  | 'Reacondicionamiento'
  | 'disponible'
  | 'reservado'
  | 'vendido'
  | 'reacondicionamiento';

export type EstadoPresupuesto = 
  | 'Borrador' 
  | 'Enviado' 
  | 'Ganado' 
  | 'Perdido' 
  | 'No Responde llamado'
  | 'borrador'
  | 'enviado'
  | 'ganado'
  | 'perdido';

export type MotivoPerdida = 
  | 'Precio alto' 
  | 'Financiación inviable' 
  | 'Tasación baja' 
  | 'Sin stock' 
  | 'Compró en otra agencia'
  | 'Decide esperar' 
  | 'Otro';

export type TipoInteraccion = 
  | 'Llamó' 
  | 'Vino al salón' 
  | 'No contesta' 
  | 'WhatsApp' 
  | 'Mail' 
  | 'MercadoLibre' 
  | 'Cobro Pagaré'
  | 'Otro';

export type TipoMoneda = 'USD' | 'ARS';

export type TipoDocumento = 'DNI' | 'CUIT' | 'CUIL' | 'Pasaporte';

export const PROVINCIAS_ARGENTINA = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
  'Ciudad Autónoma de Buenos Aires (CABA)'
] as const;

export type ProvinciaArgentina = typeof PROVINCIAS_ARGENTINA[number];

export interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  telefono: string;
  email?: string;
  tipo_documento?: TipoDocumento;
  numero_documento?: string;
  domicilio_calle?: string;
  domicilio_numero?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  compro_credito?: boolean;
  monto_credito?: number;
  deja_auto_permuta?: boolean;
  auto_permuta_detalle?: string;
  tipo_cliente: TipoCliente;
  sexo?: 'M' | 'F' | 'X' | string;
  fecha_nacimiento?: string;
  numero_tramite?: string;
  notas?: string;
  ultimo_contacto?: string;
  created_at: string;
}

export const getClienteFullName = (c?: Partial<Cliente> | null): string => {
  if (!c) return 'Cliente sin nombre';
  const name = `${c.nombre || ''} ${c.apellido || ''}`.trim();
  return name || 'Cliente sin nombre';
};

export type TipoVehiculo = 
  | 'Sedán' 
  | 'Hatchback' 
  | 'SUV / Crossover' 
  | 'Pick-up / Camioneta' 
  | 'Coupe / Deportivo' 
  | 'Monovolumen / Utilitario' 
  | 'Motocicleta / Cuatriciclo' 
  | 'Otro';

export type OrigenStock = 'Propio' | 'Consignación' | 'Compra Directa' | 'Permuta';

export interface Inventario {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  tipo_vehiculo?: TipoVehiculo;
  numero_chasis?: string;
  numero_motor?: string;
  anio: number;
  kilometraje: number;
  es_cero_km: boolean;
  moneda: TipoMoneda;
  precio_lista: number;
  catalogo_id?: number;
  version?: string;
  costo_compra: number;
  origen_stock?: OrigenStock;
  // Datos del Vendedor / Propietario Anterior (Toma / Compra a Cliente / Consignación)
  comprado_a_cliente_id?: string;
  dueno_consigna_nombre?: string;
  dueno_consigna_telefono?: string;
  dueno_consigna_documento?: string;
  origen_transaccion?: 'Compra Directa a Cliente' | 'Toma en Permuta por Venta' | 'Consignación' | 'Stock Propio 0km/Usado';
  es_solo_compra?: boolean;
  fecha_compra?: string;
  fecha_ingreso?: string;
  fecha_venta?: string;
  motivo_perdida?: MotivoPerdida;
  precio_venta?: number;
  costo_toma?: number;
  estado: EstadoVehiculo;
  observaciones?: string;
  created_at: string;
}

export interface Permuta {
  id: string;
  presupuesto_id: string;
  patente?: string;
  marca?: string;
  modelo?: string;
  version?: string;
  marca_modelo: string;
  anio: number;
  kilometraje: number;
  moneda: TipoMoneda;
  valor_tasacion: number;
  observaciones?: string;
  created_at?: string;
}

export interface PresupuestoVehiculoItem {
  vehiculo_id: string;
  marca_modelo: string;
  precio_individual: number;
  forma_pago: 'Efectivo' | 'Permuta' | 'Financiado';
}

export interface Presupuesto {
  id: string;
  cliente_id: string;
  vehiculo_id?: string;
  vehiculos_cotizados?: PresupuestoVehiculoItem[];
  moneda: TipoMoneda;
  precio_ofrecido: number;
  anticipo: number;
  saldo_financiado: number;
  estado: EstadoPresupuesto;
  motivo_perdida?: MotivoPerdida;
  created_at: string;
  cliente?: Cliente;
  vehiculo?: Inventario;
  permuta?: Permuta;
}

export interface Interaccion {
  id: string;
  cliente_id: string;
  tipo: TipoInteraccion;
  nota: string;
  accion_siguiente?: string;
  fecha_contacto: string;
  proximo_contacto?: string;
  cliente?: Cliente;
}

export interface DashboardMetrics {
  totalLeads: number;
  totalPresupuestos: number;
  tasaConversion: number;
  diasPromedioStock: number;
  autosVendidosMes: number;
  stockDisponibleCount: number;
  valorTotalStockUSD: number;
  valorTotalStockARS: number;
  motivosPerdida: { motivo: string; cantidad: number }[];
  evolucionVentas: { mes: string; ventas: number; monto: number }[];

  // 5 Paneles del Tablero Directivo:
  cotizaciones: {
    volumenMesActual: number;
    comparativaMesAnteriorPct: number;
    desvioPromedioAnualPct: number;
    totalAnio: number;
  };
  rotacionStock: {
    promedioDiasStock: number;
    unidadMasRapidaDias?: number;
    unidadesAnalizadas: number;
  };
  ventas: {
    mesCorriente: number;
    mesAnterior: number;
    mismoMesAnioAnterior: number;
  };
  pagaresMetrics: {
    montoPromedioPagare: number;
    tasaEndeudamientoPct: number;
    diasMoraPromedio: number;
    cuotasVencidasCount: number;
    cuotasCobradasCount: number;
    cuotasPendientesCount: number;
  };
}

export interface PlantillaWhatsApp {
  id: string;
  modulo: 'clientes' | 'pagares';
  codigo: string;
  titulo: string;
  contenido: string;
  created_at?: string;
  updated_at?: string;
}

// ----------------------------------------------------------------------------
// ENCARGOS / RADAR DE BÚSQUEDA DE VEHÍCULOS
// ----------------------------------------------------------------------------
export type EstadoPedidoEncargo = 
  | 'Buscando en Mercado' 
  | 'Unidad Localizada' 
  | 'En Negociación' 
  | 'Adquirido para Cliente' 
  | 'Operación Cancelada';

export interface PedidoEncargo {
  id: string;
  cliente_id: string;
  marca_buscada: string;
  modelo_buscado: string;
  anio_minimo?: number;
  anio_maximo?: number;
  presupuesto_maximo: number;
  moneda: TipoMoneda;
  es_cero_km?: boolean;
  color_preferencia?: string;
  estado: EstadoPedidoEncargo;
  vehiculo_coincidente_id?: string;
  observaciones?: string;
  created_at: string;
  cliente?: Cliente;
  vehiculo_coincidente?: Inventario;
}

// ----------------------------------------------------------------------------
// PRÉSTAMOS, PAGARÉS Y COBRANZAS
// ----------------------------------------------------------------------------
export type EstadoPrestamo = 'Activo' | 'Finalizado' | 'En Legales' | 'Refinanciado';

export type EstadoCuota = 'Pendiente' | 'Cobrado' | 'Parcialmente Cobrado' | 'Vencido';

export type TipoGestionCobranza = 
  | 'Llamada Telefónica' 
  | 'Mensaje WhatsApp' 
  | 'Carta Documento' 
  | 'Visita Domiciliaria' 
  | 'Reunión en Concesionaria';

export type ResultadoGestionCobranza = 
  | 'Compromiso de Pago' 
  | 'No Contesta' 
  | 'Número Inexistente' 
  | 'Promesa de Pago Incumplida' 
  | 'Solicita Refinanciación' 
  | 'Derivado a Abogado';

export interface PrestamoPagare {
  id: string;
  cliente_id: string;
  vehiculo_id?: string;
  presupuesto_id?: string;
  monto_total_prestado: number;
  moneda: TipoMoneda;
  cantidad_cuotas: number;
  tasa_interes_anual: number;
  monto_cuota_promedio: number;
  fecha_otorgamiento: string;
  estado: EstadoPrestamo;
  observaciones?: string;
  created_at: string;
  cliente?: Cliente;
  vehiculo?: Inventario;
  cuotas?: CuotaPagare[];
}

export interface CuotaPagare {
  id: string;
  prestamo_id: string;
  cliente_id?: string;
  numero_cuota: number;
  numero_pagare?: string;
  monto_cuota: number;
  monto_capital?: number;
  monto_interes?: number;
  moneda: TipoMoneda;
  fecha_vencimiento: string;
  estado: EstadoCuota;
  monto_pagado?: number;
  fecha_pago?: string;
  comprobante_pago?: string;
  observaciones?: string;
  created_at: string;
  prestamo?: PrestamoPagare;
  cliente?: Cliente;
  reclamos?: ReclamoCobranza[];
}

export interface ReclamoCobranza {
  id: string;
  cuota_id: string;
  cliente_id: string;
  fecha_contacto: string;
  tipo_gestion: TipoGestionCobranza;
  resultado_gestion: ResultadoGestionCobranza;
  fecha_compromiso_pago?: string;
  monto_prometido?: number;
  detalle_reclamo: string;
  atendido_por?: string;
  cliente?: Cliente;
}

