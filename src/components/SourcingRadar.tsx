import React, { useState, useEffect } from 'react';
import { PedidoEncargo, Cliente, Inventario, EstadoPedidoEncargo } from '../types/crm';
import { dataService } from '../services/dataService';
import { 
  Search, 
  Plus, 
  Car, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter, 
  Sparkles, 
  DollarSign, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const SourcingRadar: React.FC = () => {
  const [encargos, setEncargos] = useState<PedidoEncargo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEncargo, setNewEncargo] = useState({
    cliente_id: '',
    marca_buscada: '',
    modelo_buscado: '',
    anio_minimo: 2018,
    anio_maximo: 2026,
    presupuesto_maximo: 25000,
    moneda: 'USD' as 'USD' | 'ARS',
    es_cero_km: false,
    color_preferencia: '',
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [encargosData, clientesData, inventarioData] = await Promise.all([
        dataService.getPedidosEncargo(),
        dataService.getClientes(),
        dataService.getInventario()
      ]);
      setEncargos(encargosData);
      setClientes(clientesData);
      setInventario(inventarioData);
    } catch (err) {
      console.error('Error cargando datos de encargos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEncargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEncargo.cliente_id || !newEncargo.marca_buscada || !newEncargo.modelo_buscado) {
      alert('Por favor complete los campos obligatorios (Cliente, Marca y Modelo)');
      return;
    }

    try {
      await dataService.createPedidoEncargo({
        cliente_id: newEncargo.cliente_id,
        marca_buscada: newEncargo.marca_buscada,
        modelo_buscado: newEncargo.modelo_buscado,
        anio_minimo: Number(newEncargo.anio_minimo),
        anio_maximo: Number(newEncargo.anio_maximo),
        presupuesto_maximo: Number(newEncargo.presupuesto_maximo),
        moneda: newEncargo.moneda,
        es_cero_km: newEncargo.es_cero_km,
        color_preferencia: newEncargo.color_preferencia,
        estado: 'Buscando en Mercado',
        observaciones: newEncargo.observaciones,
        created_at: new Date().toISOString()
      });

      setIsModalOpen(false);
      setNewEncargo({
        cliente_id: '',
        marca_buscada: '',
        modelo_buscado: '',
        anio_minimo: 2018,
        anio_maximo: 2026,
        presupuesto_maximo: 25000,
        moneda: 'USD',
        es_cero_km: false,
        color_preferencia: '',
        observaciones: ''
      });
      await loadData();
    } catch (err) {
      console.error('Error al guardar encargo:', err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: EstadoPedidoEncargo) => {
    try {
      await dataService.updatePedidoEncargoEstado(id, newStatus);
      await loadData();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  const handleMatchWithInventory = async (encargoId: string, vehiculoId: string) => {
    try {
      await dataService.linkPedidoEncargoVehiculo(encargoId, vehiculoId);
      await loadData();
    } catch (err) {
      console.error('Error al vincular auto:', err);
    }
  };

  const filteredEncargos = encargos.filter(item => {
    const clienteName = item.cliente ? `${item.cliente.nombre} ${item.cliente.apellido || ''}`.toLowerCase() : '';
    const matchQuery = 
      clienteName.includes(searchTerm.toLowerCase()) ||
      item.marca_buscada.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.modelo_buscado.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'Todos') return matchQuery;
    return matchQuery && item.estado === statusFilter;
  });

  const getStatusBadge = (estado: EstadoPedidoEncargo) => {
    switch (estado) {
      case 'Buscando en Mercado':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"><Clock className="w-3.5 h-3.5" /> Buscando en Mercado</span>;
      case 'Unidad Localizada':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30"><Sparkles className="w-3.5 h-3.5" /> Unidad Localizada</span>;
      case 'En Negociación':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30"><AlertCircle className="w-3.5 h-3.5" /> En Negociación</span>;
      case 'Adquirido para Cliente':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><CheckCircle2 className="w-3.5 h-3.5" /> Adquirido</span>;
      case 'Operación Cancelada':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30"><XCircle className="w-3.5 h-3.5" /> Cancelada</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Car className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full font-bold border border-indigo-500/30 tracking-wide uppercase">
                Venta Potencial & Compras Especiales
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              🔍 Agenda de Vehículos por Encargo (Sourcing Radar)
            </h1>
            <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">
              Gestione los requerimientos de clientes cuyos vehículos deseados no están en stock inmediato. Rastree el estado de búsqueda en el mercado o adquiera la unidad sin perder la oportunidad comercial.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Registrar Nuevo Encargo
          </button>
        </div>

        {/* Counter KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block font-medium">Encargos Activos</span>
            <span className="text-2xl font-black text-amber-400">
              {encargos.filter(e => e.estado === 'Buscando en Mercado' || e.estado === 'Unidad Localizada' || e.estado === 'En Negociación').length}
            </span>
          </div>
          <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block font-medium">Buscando en Mercado</span>
            <span className="text-2xl font-black text-indigo-400">
              {encargos.filter(e => e.estado === 'Buscando en Mercado').length}
            </span>
          </div>
          <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block font-medium">Unidades Localizadas</span>
            <span className="text-2xl font-black text-blue-400">
              {encargos.filter(e => e.estado === 'Unidad Localizada').length}
            </span>
          </div>
          <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block font-medium">Adquiridos con Éxito</span>
            <span className="text-2xl font-black text-emerald-400">
              {encargos.filter(e => e.estado === 'Adquirido para Cliente').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/70 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <span className="text-xs text-slate-400 whitespace-nowrap">Estado:</span>
          {['Todos', 'Buscando en Mercado', 'Unidad Localizada', 'En Negociación', 'Adquirido para Cliente', 'Operación Cancelada'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Encargos Grid Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando agenda de encargos...</div>
      ) : filteredEncargos.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No hay encargos registrados</h3>
          <p className="text-slate-400 text-sm mb-4">No se encontraron pedidos de búsqueda con los filtros aplicados.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Crear Primer Encargo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEncargos.map((item) => {
            // Find potential matching vehicle in stock
            const stockMatches = inventario.filter(v => 
              v.marca.toLowerCase() === item.marca_buscada.toLowerCase() &&
              v.estado === 'Disponible'
            );

            return (
              <div 
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all rounded-2xl p-5 shadow-xl flex flex-col justify-between group"
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold text-white">
                          {item.cliente ? `${item.cliente.nombre} ${item.cliente.apellido || ''}` : 'Cliente Desconocido'}
                        </span>
                      </div>
                      {item.cliente?.telefono && (
                        <span className="text-xs text-slate-400 block ml-6">{item.cliente.telefono}</span>
                      )}
                    </div>
                    {getStatusBadge(item.estado)}
                  </div>

                  {/* Vehicle Request Box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 my-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehículo Buscado</span>
                      {item.es_cero_km ? (
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-500/30">0KM</span>
                      ) : (
                        <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium">Usado ({item.anio_minimo || 'Cualquier año'})</span>
                      )}
                    </div>
                    <h4 className="text-base font-extrabold text-white group-hover:text-indigo-400 transition-colors">
                      {item.marca_buscada} {item.modelo_buscado}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Presupuesto Máx.</span>
                        <span className="font-bold text-emerald-400">
                          {item.moneda === 'USD' ? 'USD $' : '$'} {item.presupuesto_maximo?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Preferencia Color</span>
                        <span className="font-semibold text-slate-300">{item.color_preferencia || 'Indiferente'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Observations */}
                  {item.observaciones && (
                    <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 mb-3">
                      "{item.observaciones}"
                    </p>
                  )}

                  {/* Salon Match Alert Banner */}
                  {stockMatches.length > 0 && item.estado !== 'Adquirido para Cliente' && (
                    <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> ¡Coincidencia en Salón ({stockMatches.length})!
                      </div>
                      {stockMatches.slice(0, 2).map((match) => (
                        <div key={match.id} className="flex items-center justify-between text-xs text-slate-200 py-1 border-t border-emerald-900/60">
                          <span>{match.marca} {match.modelo} ({match.anio})</span>
                          <button
                            onClick={() => handleMatchWithInventory(item.id, match.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            Vincular
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Registrado: {new Date(item.created_at).toLocaleDateString()}
                  </span>

                  <select
                    value={item.estado}
                    onChange={(e) => handleUpdateStatus(item.id, e.target.value as EstadoPedidoEncargo)}
                    className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Buscando en Mercado">Buscando en Mercado</option>
                    <option value="Unidad Localizada">Unidad Localizada</option>
                    <option value="En Negociación">En Negociación</option>
                    <option value="Adquirido para Cliente">Adquirido para Cliente</option>
                    <option value="Operación Cancelada">Operación Cancelada</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NUEVO ENCARGO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-400" /> Registrar Pedido por Encargo
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEncargo} className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cliente Solicitante *
                </label>
                <select
                  required
                  value={newEncargo.cliente_id}
                  onChange={(e) => setNewEncargo({ ...newEncargo, cliente_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Seleccione Cliente --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido || ''} ({c.telefono})
                    </option>
                  ))}
                </select>
              </div>

              {/* Marca & Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Marca Buscada *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Volkswagen, Toyota, Ford"
                    value={newEncargo.marca_buscada}
                    onChange={(e) => setNewEncargo({ ...newEncargo, marca_buscada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Modelo Buscado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Amarok V6, Hilux, Golf"
                    value={newEncargo.modelo_buscado}
                    onChange={(e) => setNewEncargo({ ...newEncargo, modelo_buscado: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Años & Presupuesto */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Año Mín.
                  </label>
                  <input
                    type="number"
                    value={newEncargo.anio_minimo}
                    onChange={(e) => setNewEncargo({ ...newEncargo, anio_minimo: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Año Máx.
                  </label>
                  <input
                    type="number"
                    value={newEncargo.anio_maximo}
                    onChange={(e) => setNewEncargo({ ...newEncargo, anio_maximo: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Moneda
                  </label>
                  <select
                    value={newEncargo.moneda}
                    onChange={(e) => setNewEncargo({ ...newEncargo, moneda: e.target.value as 'USD' | 'ARS' })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ARS">ARS ($)</option>
                  </select>
                </div>
              </div>

              {/* Presupuesto Máximo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Presupuesto Máximo de Compra
                </label>
                <input
                  type="number"
                  value={newEncargo.presupuesto_maximo}
                  onChange={(e) => setNewEncargo({ ...newEncargo, presupuesto_maximo: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Extras */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Color Preferido
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Negro, Blanco, Gris"
                    value={newEncargo.color_preferencia}
                    onChange={(e) => setNewEncargo({ ...newEncargo, color_preferencia: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEncargo.es_cero_km}
                      onChange={(e) => setNewEncargo({ ...newEncargo, es_cero_km: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    ¿Busca Unidad 0km?
                  </label>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Observaciones Comerciales
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles específicos del cliente, tiempo máximo de espera, etc."
                  value={newEncargo.observaciones}
                  onChange={(e) => setNewEncargo({ ...newEncargo, observaciones: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  Guardar Encargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
