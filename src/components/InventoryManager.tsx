import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Tag, 
  AlertCircle,
  X,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  Edit3,
  FileCode,
  User,
  Phone,
  CreditCard,
  DollarSign,
  Layers,
  Check,
  Eye,
  MessageSquare,
  ShoppingBag,
  ExternalLink,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { Cliente, EstadoVehiculo, Inventario, OrigenStock, TipoMoneda, TipoVehiculo } from '../types/crm';
import { flexSearchMatch } from '../utils/searchHelper';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { VehicleAutocomplete } from './VehicleAutocomplete';
import { CatalogoVehiculoItem } from '../data/catalogoVehicular';

interface InventoryManagerProps {
  inventario: Inventario[];
  clientes?: Cliente[];
  onAddVehiculo: (vehiculo: Omit<Inventario, 'id' | 'created_at'>) => Promise<void>;
  onUpdateVehiculo?: (vehiculo: Inventario) => Promise<void>;
  onDeleteVehiculo?: (id: string) => Promise<void>;
  onUpdateEstadoVehiculo: (id: string, estado: EstadoVehiculo) => Promise<void>;
  onStartQuotationForVehicle?: (vehicleId: string) => void;
}

const TIPOS_VEHICULO: TipoVehiculo[] = [
  'Sedán',
  'Hatchback',
  'SUV / Crossover',
  'Pick-up / Camioneta',
  'Coupe / Deportivo',
  'Monovolumen / Utilitario',
  'Motocicleta / Cuatriciclo',
  'Otro',
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventario,
  clientes = [],
  onAddVehiculo,
  onUpdateVehiculo,
  onDeleteVehiculo,
  onUpdateEstadoVehiculo,
  onStartQuotationForVehicle,
}) => {
  const { can, currentRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterOrigen, setFilterOrigen] = useState<string>('todos');
  
  // Advanced Filters (Rango de Precio, Kilometraje, Año)
  const [minPrecio, setMinPrecio] = useState<string>('');
  const [maxPrecio, setMaxPrecio] = useState<string>('');
  const [minAnio, setMinAnio] = useState<string>('');
  const [maxAnio, setMaxAnio] = useState<string>('');
  const [maxKm, setMaxKm] = useState<string>('');
  const [filterCondicion, setFilterCondicion] = useState<'todos' | '0km' | 'usado'>('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Inventario | null>(null);
  const [viewingVehiculo, setViewingVehiculo] = useState<Inventario | null>(null);

  // Form State
  const [catalogoId, setCatalogoId] = useState<number | undefined>(undefined);
  const [version, setVersion] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [patente, setPatente] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>('Pick-up / Camioneta');
  const [numeroChasis, setNumeroChasis] = useState('');
  const [numeroMotor, setNumeroMotor] = useState('');
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [kilometraje, setKilometraje] = useState<number>(0);
  const [esCeroKm, setEsCeroKm] = useState(false);
  const [moneda, setMoneda] = useState<TipoMoneda>('USD');
  const [precioLista, setPrecioLista] = useState<number>(20000);
  const [costoCompra, setCostoCompra] = useState<number>(16000);
  const [origenStock, setOrigenStock] = useState<OrigenStock>('Propio');
  
  // Vendedor / Propietario Anterior
  const [compradoAClienteId, setCompradoAClienteId] = useState<string>('');
  const [duenoConsignaNombre, setDuenoConsignaNombre] = useState('');
  const [duenoConsignaTelefono, setDuenoConsignaTelefono] = useState('');
  const [duenoConsignaDocumento, setDuenoConsignaDocumento] = useState('');
  const [origenTransaccion, setOrigenTransaccion] = useState<'Compra Directa a Cliente' | 'Toma en Permuta por Venta' | 'Consignación' | 'Stock Propio 0km/Usado'>('Stock Propio 0km/Usado');
  const [esSoloCompra, setEsSoloCompra] = useState(false);
  const [fechaCompra, setFechaCompra] = useState<string>(new Date().toISOString().split('T')[0]);

  const [estado, setEstado] = useState<EstadoVehiculo>('Disponible');
  const [observaciones, setObservaciones] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSelectCatalogo = (item: CatalogoVehiculoItem) => {
    setMarca(item.marca);
    setModelo(item.modelo);
    setVersion(item.version_completa);
    setCatalogoId(item.id);
    if (item.tipo) {
      setTipoVehiculo(item.tipo);
    }
    if (item.anios_disponibles && item.anios_disponibles.length > 0) {
      setAnio(item.anios_disponibles[item.anios_disponibles.length - 1]);
    }
  };

  const resetForm = () => {
    setEditingVehiculo(null);
    setCatalogoId(undefined);
    setVersion('');
    setIsManualMode(false);
    setPatente('');
    setMarca('');
    setModelo('');
    setTipoVehiculo('Pick-up / Camioneta');
    setNumeroChasis('');
    setNumeroMotor('');
    setAnio(new Date().getFullYear());
    setKilometraje(0);
    setEsCeroKm(false);
    setMoneda('USD');
    setPrecioLista(20000);
    setCostoCompra(16000);
    setOrigenStock('Propio');
    setCompradoAClienteId('');
    setDuenoConsignaNombre('');
    setDuenoConsignaTelefono('');
    setDuenoConsignaDocumento('');
    setOrigenTransaccion('Stock Propio 0km/Usado');
    setEsSoloCompra(false);
    setFechaCompra(new Date().toISOString().split('T')[0]);
    setEstado('Disponible');
    setObservaciones('');
  };

  const handleOpenAdd = (presetOrigin?: 'Compra Directa' | 'Consignación') => {
    resetForm();
    if (presetOrigin === 'Compra Directa') {
      setOrigenStock('Compra Directa');
      setOrigenTransaccion('Compra Directa a Cliente');
      setEsSoloCompra(true);
      setEsCeroKm(false);
    } else if (presetOrigin === 'Consignación') {
      setOrigenStock('Consignación');
      setOrigenTransaccion('Consignación');
    }
    setModalOpen(true);
  };

  const handleOpenEdit = (v: Inventario) => {
    setEditingVehiculo(v);
    setIsManualMode(true);
    setPatente(v.patente || '');
    setMarca(v.marca || '');
    setModelo(v.modelo || '');
    setVersion(v.version || '');
    setCatalogoId(v.catalogo_id);
    setTipoVehiculo(v.tipo_vehiculo || 'Pick-up / Camioneta');
    setNumeroChasis(v.numero_chasis || '');
    setNumeroMotor(v.numero_motor || '');
    setAnio(v.anio || new Date().getFullYear());
    setKilometraje(v.kilometraje || 0);
    setEsCeroKm(Boolean(v.es_cero_km));
    setMoneda(v.moneda || 'USD');
    setPrecioLista(v.precio_lista || 0);
    setCostoCompra(v.costo_compra || 0);
    setOrigenStock(v.origen_stock || 'Propio');
    setCompradoAClienteId(v.comprado_a_cliente_id || '');
    setDuenoConsignaNombre(v.dueno_consigna_nombre || '');
    setDuenoConsignaTelefono(v.dueno_consigna_telefono || '');
    setDuenoConsignaDocumento(v.dueno_consigna_documento || '');
    setOrigenTransaccion(v.origen_transaccion || (v.origen_stock === 'Consignación' ? 'Consignación' : 'Stock Propio 0km/Usado'));
    setEsSoloCompra(Boolean(v.es_solo_compra));
    setFechaCompra(v.fecha_compra || new Date().toISOString().split('T')[0]);
    setEstado((v.estado || 'disponible').toLowerCase() as EstadoVehiculo);
    setObservaciones(v.observaciones || '');
    setModalOpen(true);
  };

  const handleSelectVendorClient = (clienteId: string) => {
    setCompradoAClienteId(clienteId);
    if (!clienteId) return;
    const c = clientes.find(item => item.id === clienteId);
    if (c) {
      setDuenoConsignaNombre(`${c.nombre} ${c.apellido || ''}`.trim());
      setDuenoConsignaTelefono(c.telefono || '');
      setDuenoConsignaDocumento(c.numero_documento || '');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterEstado('todos');
    setFilterOrigen('todos');
    setMinPrecio('');
    setMaxPrecio('');
    setMinAnio('');
    setMaxAnio('');
    setMaxKm('');
    setFilterCondicion('todos');
  };

  const filtered = inventario.filter(v => {
    const fullSearchText = `
      ${v.marca} ${v.modelo} ${v.version || ''} ${v.patente || ''} ${v.tipo_vehiculo || ''} 
      ${v.numero_chasis || ''} ${v.numero_motor || ''} ${v.dueno_consigna_nombre || ''} ${v.observaciones || ''}
      ${v.origen_transaccion || ''} ${v.anio}
    `;
    const matchSearch = flexSearchMatch(fullSearchText, searchTerm);
    const matchState = filterEstado === 'todos' || v.estado.toLowerCase() === filterEstado.toLowerCase();
    const matchOrigen = filterOrigen === 'todos' || (v.origen_stock || 'Propio').toLowerCase() === filterOrigen.toLowerCase();
    
    // Price Filter
    const matchPriceMin = !minPrecio || v.precio_lista >= Number(minPrecio);
    const matchPriceMax = !maxPrecio || v.precio_lista <= Number(maxPrecio);
    
    // Year Filter
    const matchAnioMin = !minAnio || v.anio >= Number(minAnio);
    const matchAnioMax = !maxAnio || v.anio <= Number(maxAnio);
    
    // Kilometraje Filter
    const matchKm = !maxKm || v.kilometraje <= Number(maxKm);
    
    // Condicion Filter (0KM vs Usado)
    const matchCondicion = filterCondicion === 'todos' || (filterCondicion === '0km' ? v.es_cero_km : !v.es_cero_km);

    return matchSearch && matchState && matchOrigen && matchPriceMin && matchPriceMax && matchAnioMin && matchAnioMax && matchKm && matchCondicion;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marca || !modelo) {
      alert('Por favor completa la Marca y el Modelo del vehículo.');
      return;
    }
    setLoading(true);

    const payload = {
      patente: patente.toUpperCase().trim(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      version: version.trim() || undefined,
      catalogo_id: catalogoId,
      tipo_vehiculo: tipoVehiculo,
      numero_chasis: numeroChasis.toUpperCase().trim(),
      numero_motor: numeroMotor.toUpperCase().trim(),
      anio: Number(anio),
      kilometraje: esCeroKm ? 0 : Number(kilometraje),
      es_cero_km: esCeroKm,
      moneda,
      precio_lista: Number(precioLista),
      costo_compra: Number(costoCompra),
      origen_stock: origenStock,
      comprado_a_cliente_id: compradoAClienteId || undefined,
      dueno_consigna_nombre: duenoConsignaNombre.trim() || undefined,
      dueno_consigna_telefono: duenoConsignaTelefono.trim() || undefined,
      dueno_consigna_documento: duenoConsignaDocumento.trim() || undefined,
      origen_transaccion: origenTransaccion,
      es_solo_compra: esSoloCompra,
      fecha_compra: fechaCompra,
      estado,
      observaciones: observaciones.trim() || undefined,
    };

    try {
      if (editingVehiculo && onUpdateVehiculo) {
        await onUpdateVehiculo({
          ...editingVehiculo,
          ...payload,
        });
      } else {
        await onAddVehiculo(payload);
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al guardar la unidad.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-6">
      {/* HEADER BAR RESPONSIVE */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
              <Car className="w-6 h-6 text-cyan-400 shrink-0" />
              Gestión de Inventario & Stock del Salón
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Total de unidades en salón: <strong className="text-cyan-400 font-mono">{inventario.length}</strong> | 
            Fichas técnicas, consignaciones y compras a clientes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* BOTÓN REGISTRAR COMPRA DIRECTA */}
          <button
            onClick={() => handleOpenAdd('Compra Directa')}
            className="px-4 py-2.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500 hover:text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10"
            title="Registrar una compra de vehículo usado a un cliente sin venta asociada"
          >
            <ShoppingBag className="w-4 h-4 text-purple-400" />
            + Registrar Compra Directa
          </button>

          {/* BOTÓN INGRESAR NUEVO VEHÍCULO */}
          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Ingresar Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Predictive Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Búsqueda predictiva (ej: 'hilux 2022', 'AF123', 'consigna')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Origen */}
          <div>
            <select
              value={filterOrigen}
              onChange={(e) => setFilterOrigen(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="todos">Origen: Todos</option>
              <option value="propio">Stock Propio</option>
              <option value="compra directa">Compra Directa</option>
              <option value="consignación">Consignación</option>
              <option value="permuta">Permuta</option>
            </select>
          </div>

          {/* Filter Estado */}
          <div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="todos">Estado: Todos</option>
              <option value="disponible">Disponible</option>
              <option value="reacondicionamiento">Reacondicionamiento</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>
          </div>

          {/* Toggle Advanced Filters Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                showAdvancedFilters || minPrecio || maxPrecio || minAnio || maxAnio || maxKm || filterCondicion !== 'todos'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-950 border-slate-700/80 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {showAdvancedFilters ? 'Ocultar Filtros' : '🎛️ Filtros Avanzados'}
            </button>
          </div>
        </div>

        {/* EXPANDABLE ADVANCED FILTERS PANEL */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 animate-fade-in text-xs">
            {/* Rango de Precio Min */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Precio Mínimo ($)</label>
              <input
                type="number"
                placeholder="Ej: 10000"
                value={minPrecio}
                onChange={(e) => setMinPrecio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Rango de Precio Max */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Precio Máximo ($)</label>
              <input
                type="number"
                placeholder="Ej: 35000"
                value={maxPrecio}
                onChange={(e) => setMaxPrecio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Año Desde */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Año Desde</label>
              <input
                type="number"
                placeholder="Ej: 2018"
                value={minAnio}
                onChange={(e) => setMinAnio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Año Hasta */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Año Hasta</label>
              <input
                type="number"
                placeholder="Ej: 2026"
                value={maxAnio}
                onChange={(e) => setMaxAnio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Kilometraje Máximo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">KM Máximo</label>
              <input
                type="number"
                placeholder="Ej: 80000"
                value={maxKm}
                onChange={(e) => setMaxKm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Condición 0KM vs Usado */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Condición</label>
              <select
                value={filterCondicion}
                onChange={(e) => setFilterCondicion(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="todos">0KM y Usados</option>
                <option value="0km">Solo 0KM</option>
                <option value="usado">Solo Usados</option>
              </select>
            </div>

            {/* Quick Presets & Reset */}
            <div className="sm:col-span-2 lg:col-span-6 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-semibold">Filtros rápidos:</span>
                <button
                  type="button"
                  onClick={() => { setFilterCondicion('0km'); setMaxKm('0'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 font-bold"
                >
                  🚀 Solo 0KM
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterCondicion('usado'); setMaxKm('50000'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 font-bold"
                >
                  🚗 Usados &lt; 50.000 KM
                </button>
                <button
                  type="button"
                  onClick={() => { setMinAnio('2020'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 font-bold"
                >
                  📅 Año 2020+
                </button>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/60 font-bold text-[11px] transition flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Limpiar Todos los Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLE RESPONSIVE CONTAINER */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Vehículo & Tipo</th>
                <th className="p-3.5">Patente & Chasis/Motor</th>
                <th className="p-3.5">Año / Kilometraje</th>
                <th className="p-3.5">Origen & Operación</th>
                <th className="p-3.5">Precio Lista Venta</th>
                {can('ver_costos') && <th className="p-3.5">Costo Toma</th>}
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={can('ver_costos') ? 8 : 7} className="p-8 text-center text-slate-500">
                    No se encontraron vehículos registrados con esos filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr
                    key={v.id}
                    onDoubleClick={() => setViewingVehiculo(v)}
                    className="hover:bg-slate-900/60 transition group cursor-pointer"
                    title="Doble clic para ver Ficha Completa del Vehículo"
                  >
                    {/* Vehículo & Tipo */}
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-100 text-sm flex items-center gap-1.5">
                        {v.marca} {v.modelo}
                        {v.version && !v.modelo.toLowerCase().includes(v.version.toLowerCase()) && (
                          <span className="text-xs font-normal text-slate-300">({v.version})</span>
                        )}
                        {v.es_cero_km && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono px-1.5 py-0.2 rounded border border-cyan-500/40">
                            0KM
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-300">
                          {v.tipo_vehiculo || 'Auto'}
                        </span>
                        {v.observaciones && (
                          <span className="truncate max-w-[180px] text-slate-500" title={v.observaciones}>
                            📝 {v.observaciones}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Patente & Chasis/Motor */}
                    <td className="p-3.5 font-mono text-[11px]">
                      <div className="font-bold text-slate-200">
                        {v.patente ? `🚘 ${v.patente}` : 'Sin Patente'}
                      </div>
                      {v.numero_chasis && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={`Chasis: ${v.numero_chasis}`}>
                          CH: {v.numero_chasis}
                        </div>
                      )}
                    </td>

                    {/* Año / KM */}
                    <td className="p-3.5 font-mono text-slate-300">
                      <div className="font-bold">{v.anio}</div>
                      <div className="text-[11px] text-slate-400">
                        {v.es_cero_km ? 'Nuevo 0km' : `${v.kilometraje.toLocaleString()} km`}
                      </div>
                    </td>

                    {/* Origen & Operación */}
                    <td className="p-3.5">
                      {v.origen_stock === 'Consignación' ? (
                        <div className="space-y-0.5">
                          <span className="bg-purple-950/50 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded text-[10px] font-extrabold inline-block">
                            🔑 Consignación
                          </span>
                          {v.dueno_consigna_nombre && (
                            <div className="text-[10px] text-purple-400 font-medium truncate max-w-[130px]" title={v.dueno_consigna_nombre}>
                              Dueño: {v.dueno_consigna_nombre}
                            </div>
                          )}
                        </div>
                      ) : v.origen_stock === 'Compra Directa' || v.origen_transaccion === 'Compra Directa a Cliente' ? (
                        <div className="space-y-0.5">
                          <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded text-[10px] font-extrabold inline-block">
                            🤝 Compra Directa
                          </span>
                          {v.dueno_consigna_nombre && (
                            <div className="text-[10px] text-indigo-400 font-medium truncate max-w-[130px]">
                              Vendedor: {v.dueno_consigna_nombre}
                            </div>
                          )}
                        </div>
                      ) : v.origen_stock === 'Permuta' || v.origen_transaccion === 'Toma en Permuta por Venta' ? (
                        <div className="space-y-0.5">
                          <span className="bg-amber-950/50 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-extrabold inline-block">
                            🔄 Permuta
                          </span>
                          {v.dueno_consigna_nombre && (
                            <div className="text-[10px] text-amber-400 font-medium truncate max-w-[130px]">
                              Cliente: {v.dueno_consigna_nombre}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Stock Propio
                        </span>
                      )}
                    </td>

                    {/* Precio Lista (Formateado sin $ si es USD) */}
                    <td className="p-3.5">
                      <span className="font-extrabold text-emerald-400 font-mono text-sm">
                        {formatCurrency(v.precio_lista, v.moneda)}
                      </span>
                    </td>

                    {/* Costo Toma: Solo visible para usuarios con permiso 'ver_costos' */}
                    {can('ver_costos') && (
                      <td className="p-3.5">
                        <span className="font-bold text-slate-400 font-mono text-xs">
                          {formatCurrency(v.costo_compra, v.moneda)}
                        </span>
                      </td>
                    )}

                    {/* Estado Selector */}
                    <td className="p-3.5">
                      <select
                        value={(v.estado || 'disponible').toLowerCase()}
                        onChange={(e) => onUpdateEstadoVehiculo(v.id, e.target.value.toLowerCase() as EstadoVehiculo)}
                        className={`text-xs rounded-lg px-2 py-1 font-bold focus:outline-none ${
                          (v.estado || '').toLowerCase() === 'disponible' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' :
                          (v.estado || '').toLowerCase() === 'reacondicionamiento' ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30' :
                          (v.estado || '').toLowerCase() === 'reservado' ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' :
                          (v.estado || '').toLowerCase() === 'vendido' ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <option value="disponible">Disponible</option>
                        <option value="reacondicionamiento">Reacondicionamiento</option>
                        <option value="reservado">Reservado</option>
                        <option value="vendido">Vendido</option>
                      </select>
                    </td>

                    {/* Acciones */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver Ficha Modal */}
                        <button
                          onClick={() => setViewingVehiculo(v)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-cyan-500 hover:text-slate-950 font-bold transition flex items-center gap-1 text-xs"
                          title="Ver Ficha Completa de Stock y Vendedor"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ficha
                        </button>

                        {/* Editar Button */}
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="px-2 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition"
                          title="Editar Datos de Ficha"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Eliminar Button (Solo Admin / SuperAdmin) */}
                        {can('eliminar_vehiculo') && onDeleteVehiculo && (
                          <button
                            onClick={() => onDeleteVehiculo(v.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                            title="Eliminar vehículo del stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Cotizar Button */}
                        {(v.estado || '').toLowerCase() === 'disponible' && (
                          <button
                            onClick={() => onStartQuotationForVehicle && onStartQuotationForVehicle(v.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 font-bold transition flex items-center gap-1 text-xs"
                            title="Generar propuesta de cotización"
                          >
                            + Cotizar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED FICHA DE STOCK VIEW MODAL */}
      {viewingVehiculo && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-fade-in overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[92vh] my-auto bg-slate-950/95 overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 font-extrabold shrink-0">
                  <Car className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-100">
                      {viewingVehiculo.marca} {viewingVehiculo.modelo} ({viewingVehiculo.anio})
                    </h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold capitalize ${
                      (viewingVehiculo.estado || '').toLowerCase() === 'disponible' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      (viewingVehiculo.estado || '').toLowerCase() === 'reservado' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      (viewingVehiculo.estado || '').toLowerCase() === 'reacondicionamiento' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      (viewingVehiculo.estado || '').toLowerCase() === 'vendido' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {viewingVehiculo.estado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Patente: <strong className="text-slate-200">{viewingVehiculo.patente || 'Sin Patente'}</strong> | 
                    Categoría: <strong className="text-slate-200">{viewingVehiculo.tipo_vehiculo || 'Auto'}</strong>
                  </p>
                </div>
              </div>

              <button onClick={() => setViewingVehiculo(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-4 text-xs">
              {/* SECTION 1: ESTRUCTURA COMERCIAL & MARGEN */}
              <div className={`grid grid-cols-1 ${can('ver_costos') ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800`}>
                <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Precio de Lista (Venta)</span>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {formatCurrency(viewingVehiculo.precio_lista, viewingVehiculo.moneda)}
                  </div>
                </div>

                {can('ver_costos') && (
                  <>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">Costo de Toma / Compra</span>
                      <div className="text-xl font-black text-slate-200 font-mono">
                        {formatCurrency(viewingVehiculo.costo_compra, viewingVehiculo.moneda)}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/30">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">Margen Bruto Estimado</span>
                      <div className="text-xl font-black text-cyan-400 font-mono">
                        {formatCurrency(viewingVehiculo.precio_lista - viewingVehiculo.costo_compra, viewingVehiculo.moneda)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* SECTION 2: DATOS DEL VENDEDOR / PROPIETARIO ANTERIOR Y ORIGEN */}
              <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <div className="font-extrabold text-indigo-300 text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    👤 Datos del Vendedor / Propietario Anterior & Origen de Compra
                  </div>
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                    {viewingVehiculo.origen_transaccion || viewingVehiculo.origen_stock || 'Stock Propio'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Nombre del Vendedor / Dueño:</span>
                    <span className="font-bold text-slate-100 text-sm">
                      {viewingVehiculo.dueno_consigna_nombre || 'Agencia / Stock Directo'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Teléfono / WhatsApp:</span>
                    {viewingVehiculo.dueno_consigna_telefono ? (
                      <a
                        href={`https://wa.me/${viewingVehiculo.dueno_consigna_telefono}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-green-400 font-mono flex items-center gap-1 hover:underline text-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {viewingVehiculo.dueno_consigna_telefono}
                      </a>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">DNI / CUIT del Vendedor:</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {viewingVehiculo.dueno_consigna_documento || 'No registrado'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Fecha de Compra/Toma: <strong className="text-slate-200 font-mono">{viewingVehiculo.fecha_compra || 'No informada'}</strong></span>
                  {viewingVehiculo.es_solo_compra && (
                    <span className="bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded font-bold border border-purple-500/30">
                      Operación Solo Compra Directa (Sin Venta)
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION 3: FICHA TÉCNICA */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-2">
                  <FileCode className="w-4 h-4" />
                  Documentación Técnica y Números de Serie
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">N° de Chasis / Cuadro</span>
                    <span className="font-bold text-slate-200 text-[11px] truncate block" title={viewingVehiculo.numero_chasis}>
                      {viewingVehiculo.numero_chasis || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">N° de Motor</span>
                    <span className="font-bold text-slate-200 text-[11px] truncate block" title={viewingVehiculo.numero_motor}>
                      {viewingVehiculo.numero_motor || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Kilometraje Real</span>
                    <span className="font-bold text-slate-200 text-[11px]">
                      {viewingVehiculo.es_cero_km ? '0 KM (Nuevo)' : `${viewingVehiculo.kilometraje.toLocaleString()} km`}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Año Modelo</span>
                    <span className="font-bold text-slate-200 text-[11px]">{viewingVehiculo.anio}</span>
                  </div>
                </div>
              </div>

              {/* OBSERVACIONES */}
              {viewingVehiculo.observaciones && (
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Observaciones / Detalles de Equipamiento:</span>
                  <p className="text-slate-200 italic">{viewingVehiculo.observaciones}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            {/* Footer */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border-t border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setViewingVehiculo(null);
                  handleOpenEdit(viewingVehiculo);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 font-bold transition flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                Editar Ficha
              </button>

              <div className="flex items-center gap-2">
                {viewingVehiculo.estado === 'Disponible' && onStartQuotationForVehicle && (
                  <button
                    onClick={() => {
                      const id = viewingVehiculo.id;
                      setViewingVehiculo(null);
                      onStartQuotationForVehicle(id);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition shadow-lg text-xs cursor-pointer"
                  >
                    + Generar Cotización
                  </button>
                )}

                <button
                  onClick={() => setViewingVehiculo(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer"
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL VEHICLE FORM MODAL (ADD & EDIT) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-fade-in overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[92vh] my-auto bg-slate-950/95 overflow-hidden">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-extrabold shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-100">
                    {editingVehiculo ? `Ficha de Stock: ${editingVehiculo.marca} ${editingVehiculo.modelo}` : 'Ingresar Vehículo al Stock / Operación de Compra'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Carga completa de datos técnicos, valores comerciales y vinculación del vendedor / propietario anterior
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalOpen(false)} 
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Scrollable Form Body */}
              <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-5 text-xs">
                {/* SECTION 1: IDENTIFICACIÓN BÁSICA */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Car className="w-4 h-4" />
                  1. Identificación del Vehículo
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Marca *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Toyota"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Modelo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Hilux"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Versión / Acabado</label>
                    <input
                      type="text"
                      placeholder="Ej: 2.8 TDI SRX 4x4 AT"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Patente / Dominio</label>
                    <input
                      type="text"
                      placeholder="Ej: AF123JK"
                      value={patente}
                      onChange={(e) => setPatente(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tipo de Vehículo</label>
                    <select
                      value={tipoVehiculo}
                      onChange={(e) => setTipoVehiculo(e.target.value as TipoVehiculo)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      {TIPOS_VEHICULO.map(tp => (
                        <option key={tp} value={tp}>{tp}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Año Fabricación</label>
                    <input
                      type="number"
                      value={anio}
                      onChange={(e) => setAnio(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Kilometraje</label>
                    <input
                      type="number"
                      disabled={esCeroKm}
                      value={kilometraje}
                      onChange={(e) => setKilometraje(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-700 h-[42px]">
                    <input
                      type="checkbox"
                      id="zerokm_modal"
                      checked={esCeroKm}
                      onChange={(e) => setEsCeroKm(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                    <label htmlFor="zerokm_modal" className="font-bold text-slate-200 cursor-pointer text-xs">
                      ¿Es 0KM?
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DOCUMENTACIÓN TÉCNICA */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" />
                  2. Documentación Técnica (Chasis / Cuadro & Motor)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">N° de Chasis / Cuadro</label>
                    <input
                      type="text"
                      placeholder="Ej: 8AJFA8CB900123456"
                      value={numeroChasis}
                      onChange={(e) => setNumeroChasis(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">N° de Motor</label>
                    <input
                      type="text"
                      placeholder="Ej: 1GD5678901"
                      value={numeroMotor}
                      onChange={(e) => setNumeroMotor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: VALORES COMERCIALES (SIN SÍMBOLO $ SI ES USD) */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  3. Estructura de Precios & Moneda
                </div>

                <div className={`grid grid-cols-1 ${can('ver_costos') ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Moneda de Comercialización</label>
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value as TipoMoneda)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="USD">USD (Dólares)</option>
                      <option value="ARS">ARS ($ Pesos)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-emerald-400 mb-1">Precio de Lista Venta</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-500 text-xs font-mono">
                        {moneda === 'USD' ? 'USD' : '$ ARS'}
                      </span>
                      <input
                        type="number"
                        required
                        min={0}
                        value={precioLista}
                        onChange={(e) => setPrecioLista(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl pl-16 pr-3 py-2.5 font-extrabold text-emerald-400 focus:outline-none focus:border-emerald-400 font-mono"
                      />
                    </div>
                  </div>

                  {can('ver_costos') && (
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Costo de Toma / Compra {!can('editar_costos') && <span className="text-rose-400 text-[10px]">(Solo Lectura)</span>}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs font-mono">
                          {moneda === 'USD' ? 'USD' : '$ ARS'}
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={costoCompra}
                          disabled={!can('editar_costos')}
                          onChange={(e) => setCostoCompra(Number(e.target.value))}
                          className={`w-full bg-slate-950 border border-slate-700 rounded-xl pl-16 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono ${
                            !can('editar_costos') ? 'opacity-60 cursor-not-allowed bg-slate-900' : ''
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: ORIGEN DE LA UNIDAD & DATOS DEL VENDEDOR/PROPIETARIO */}
              <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/30 space-y-4">
                <div className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-400" />
                    4. Origen de la Unidad & Datos del Vendedor / Dueño Anterior
                  </span>
                  <span className="text-[10px] text-slate-400">Vincular con Cliente Comprador / Vendedor</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tipo de Operación / Origen:</label>
                    <select
                      value={origenTransaccion}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setOrigenTransaccion(val);
                        if (val === 'Compra Directa a Cliente') {
                          setOrigenStock('Compra Directa');
                          setEsSoloCompra(true);
                        } else if (val === 'Consignación') {
                          setOrigenStock('Consignación');
                          setEsSoloCompra(false);
                        } else if (val === 'Toma en Permuta por Venta') {
                          setOrigenStock('Permuta');
                          setEsSoloCompra(false);
                        } else {
                          setOrigenStock('Propio');
                          setEsSoloCompra(false);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-bold focus:outline-none focus:border-indigo-400"
                    >
                      <option value="Stock Propio 0km/Usado">Stock Propio (0km o Compra General)</option>
                      <option value="Compra Directa a Cliente">🤝 Compra Directa a Cliente (Solo Compra)</option>
                      <option value="Toma en Permuta por Venta">🔄 Toma en Permuta por Venta</option>
                      <option value="Consignación">🔑 Consignación de Cliente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-indigo-300 mb-1">Seleccionar Cliente Registrado (Vendedor):</label>
                    <select
                      value={compradoAClienteId}
                      onChange={(e) => handleSelectVendorClient(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl p-2.5 text-slate-100 font-medium focus:outline-none focus:border-indigo-400"
                    >
                      <option value="">-- Cliente No Registrado (Ingreso Manual) --</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.apellido || ''} ({c.telefono})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-bold text-slate-300 text-[11px]">Detalles del Propietario Anterior / Vendedor:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Nombre Completo del Vendedor</label>
                      <input
                        type="text"
                        placeholder="Ej: Esteban Fernández"
                        value={duenoConsignaNombre}
                        onChange={(e) => setDuenoConsignaNombre(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Teléfono de Contacto</label>
                      <input
                        type="text"
                        placeholder="Ej: 5491133221100"
                        value={duenoConsignaTelefono}
                        onChange={(e) => setDuenoConsignaTelefono(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-slate-100 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">DNI / CUIT del Vendedor</label>
                      <input
                        type="text"
                        placeholder="Ej: 20-35444333-9"
                        value={duenoConsignaDocumento}
                        onChange={(e) => setDuenoConsignaDocumento(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-slate-100 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Fecha de Ingreso / Compra</label>
                      <input
                        type="date"
                        value={fechaCompra}
                        onChange={(e) => setFechaCompra(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-indigo-400 font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        id="solocompra_cb"
                        checked={esSoloCompra}
                        onChange={(e) => setEsSoloCompra(e.target.checked)}
                        className="w-4 h-4 accent-purple-500 rounded"
                      />
                      <label htmlFor="solocompra_cb" className="font-bold text-slate-200 cursor-pointer text-xs">
                        Marcar como Operación de Solo Compra Directa (Sin Venta)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: ESTADO Y OBSERVACIONES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Estado de Comercialización</label>
                  <select
                    value={(estado || 'disponible').toLowerCase()}
                    onChange={(e) => setEstado(e.target.value.toLowerCase() as EstadoVehiculo)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="reacondicionamiento">Reacondicionamiento</option>
                    <option value="reservado">Reservado</option>
                    <option value="vendido">Vendido</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Observaciones Principales</label>
                  <textarea
                    rows={2}
                    placeholder="Detalles de mantenimiento, equipamiento o versión..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white transition cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-extrabold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Guardando...' : editingVehiculo ? 'Guardar Cambios en Ficha' : 'Guardar Unidad en Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
