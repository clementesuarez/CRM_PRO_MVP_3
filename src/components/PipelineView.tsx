import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  PlusCircle, 
  Search, 
  Car, 
  DollarSign, 
  Calendar, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Zap,
  LayoutGrid,
  List,
  Edit3
} from 'lucide-react';
import { EstadoPresupuesto, Presupuesto } from '../types/crm';
import { formatCurrency } from '../utils/formatters';
import { InteractionModal } from './InteractionModal';
import { DealClosureModal } from './DealClosureModal';
import { WhatsAppModal } from './WhatsAppModal';
import { flexSearchMatch } from '../utils/searchHelper';

interface PipelineViewProps {
  presupuestos: Presupuesto[];
  onOpenQuotation: () => void;
  onEditPresupuesto?: (presupuesto: Presupuesto) => void;
  onSaveInteraction: (data: { cliente_id: string; tipo: any; nota: string; accion_siguiente?: string; proximo_contacto?: string }) => Promise<void>;
  onUpdateEstadoPresupuesto: (id: string, estado: EstadoPresupuesto, motivoPerdida?: any) => Promise<void>;
}

const COLUMNAS: { id: string; label: string; color: string; badge: string }[] = [
  { id: 'borrador', label: 'Nuevo / Borrador', color: 'border-blue-500/50 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-300' },
  { id: 'enviado', label: 'En Seguimiento / Cotizado', color: 'border-purple-500/50 bg-purple-500/5', badge: 'bg-purple-500/20 text-purple-300' },
  { id: 'ganado', label: 'Ganado (Vendido)', color: 'border-emerald-500/50 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'perdido', label: 'Perdido', color: 'border-rose-500/50 bg-rose-500/5', badge: 'bg-rose-500/20 text-rose-300' },
];

export const PipelineView: React.FC<PipelineViewProps> = ({
  presupuestos,
  onOpenQuotation,
  onEditPresupuesto,
  onSaveInteraction,
  onUpdateEstadoPresupuesto,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Interaction Modal State
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [activeClienteForInteraction, setActiveClienteForInteraction] = useState<{ id: string; nombre: string } | null>(null);

  // Closure Modal State
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [activePresupuestoForClosure, setActivePresupuestoForClosure] = useState<Presupuesto | null>(null);
  const [targetClosureEstado, setTargetClosureEstado] = useState<EstadoPresupuesto>('Ganado');

  // WhatsApp Modal State
  const [wspModalOpen, setWspModalOpen] = useState(false);
  const [wspTargetCliente, setWspTargetCliente] = useState<{ nombre: string; telefono: string; vehiculo: string; precio: string } | null>(null);

  const filteredPresupuestos = presupuestos.filter((p) => {
    const fullSearchText = `${p.cliente?.nombre || ''} ${p.cliente?.telefono || ''} ${p.vehiculo?.marca || ''} ${p.vehiculo?.modelo || ''} ${p.vehiculo?.patente || ''}`;
    const matchesSearch = flexSearchMatch(fullSearchText, searchTerm);

    const matchesFilter = selectedEstadoFilter === 'todos' || p.estado.toLowerCase() === selectedEstadoFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const handleOpenWhatsAppModal = (telefono: string, nombreCliente: string, vehiculoStr?: string, precioStr?: string) => {
    setWspTargetCliente({
      nombre: nombreCliente,
      telefono: telefono,
      vehiculo: vehiculoStr || 'el vehículo de tu interés',
      precio: precioStr || '',
    });
    setWspModalOpen(true);
  };

  const handleOpenInteractionModal = (clienteId: string, clienteNombre: string) => {
    setActiveClienteForInteraction({ id: clienteId, nombre: clienteNombre });
    setInteractionModalOpen(true);
  };

  const handleTriggerClosure = (presupuesto: Presupuesto, nuevoEstadoStr: string) => {
    let targetState: EstadoPresupuesto = 'Borrador';
    if (nuevoEstadoStr === 'ganado' || nuevoEstadoStr === 'Ganado') targetState = 'Ganado';
    else if (nuevoEstadoStr === 'perdido' || nuevoEstadoStr === 'Perdido') targetState = 'Perdido';
    else if (nuevoEstadoStr === 'enviado' || nuevoEstadoStr === 'Enviado') targetState = 'Enviado';
    else if (nuevoEstadoStr === 'No Responde llamado') targetState = 'No Responde llamado';

    if (targetState === 'Ganado' || targetState === 'Perdido') {
      setActivePresupuestoForClosure(presupuesto);
      setTargetClosureEstado(targetState);
      setClosureModalOpen(true);
    } else {
      onUpdateEstadoPresupuesto(presupuesto.id, targetState);
    }
  };

  const visibleCols = selectedEstadoFilter === 'todos' 
    ? COLUMNAS 
    : COLUMNAS.filter(col => col.id.toLowerCase() === selectedEstadoFilter.toLowerCase());

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Filter & Toolbar Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 glass-panel p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Predictive Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar (ej: 'benitez', 'hilux', 'AF123')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
            />
          </div>

          {/* Column Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => setSelectedEstadoFilter('todos')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                selectedEstadoFilter === 'todos' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({presupuestos.length})
            </button>
            {COLUMNAS.map(col => {
              const count = presupuestos.filter(p => p.estado.toLowerCase() === col.id.toLowerCase()).length;
              return (
                <button
                  key={col.id}
                  onClick={() => setSelectedEstadoFilter(col.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                    selectedEstadoFilter === col.id 
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{col.label.split('/')[0]}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded-full text-slate-300 font-mono">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode Toggle & Add Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'kanban' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Vista Kanban"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Vista Lista"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            onClick={onOpenQuotation}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">+ Cotización</span>
          </button>
        </div>
      </div>

      {/* Mobile Hint for Kanban Swipe */}
      {viewMode === 'kanban' && visibleCols.length > 1 && (
        <div className="sm:hidden text-[11px] text-slate-400 flex items-center justify-between px-1">
          <span>👈 Desliza para ver más columnas 👉</span>
          <span className="font-mono text-[10px] text-cyan-400">Total: {filteredPresupuestos.length} ops</span>
        </div>
      )}

      {/* Main Kanban / List View */}
      {viewMode === 'kanban' ? (
        <div className={
          visibleCols.length === 1 
            ? 'grid grid-cols-1 max-w-2xl mx-auto w-full gap-4 items-start' 
            : 'flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-4 scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:pb-0 sm:overflow-visible items-start'
        }>
          {visibleCols.map((col) => {
            const colItems = filteredPresupuestos.filter(p => p.estado.toLowerCase() === col.id.toLowerCase());
            return (
              <div 
                key={col.id} 
                className={`rounded-2xl border ${col.color} p-3 flex flex-col min-h-[480px] ${
                  visibleCols.length > 1 ? 'w-[88vw] max-w-[340px] shrink-0 snap-center sm:w-auto' : 'w-full'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-100">{col.label}</span>
                    <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold ${col.badge}`}>
                      {colItems.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                  {colItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      Sin oportunidades en esta columna
                    </div>
                  ) : (
                    colItems.map((p) => (
                      <div
                        key={p.id}
                        className="glass-card p-3 sm:p-3.5 rounded-xl space-y-3 transition duration-150 relative group"
                      >
                        {/* Card Top: Cliente & Date */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-cyan-300 transition truncate">
                              {p.cliente?.nombre || 'Cliente sin nombre'}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                              📞 {p.cliente?.telefono}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md shrink-0 font-mono">
                            {new Date(p.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Card Center: Vehicle info / Itemized breakdown */}
                        {p.vehiculos_cotizados && p.vehiculos_cotizados.length > 0 ? (
                          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 gap-2">
                              <span className="flex items-center gap-1 text-slate-300 truncate">
                                <Car className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                {p.vehiculos_cotizados.length} {p.vehiculos_cotizados.length === 1 ? 'Auto' : 'Autos'}
                              </span>
                              <span className="font-extrabold text-emerald-400 font-mono shrink-0 whitespace-nowrap">
                                {formatCurrency(p.precio_ofrecido, p.moneda)}
                              </span>
                            </div>
                            <div className="space-y-1 pt-0.5">
                              {p.vehiculos_cotizados.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300 gap-1">
                                  <span className="truncate font-medium flex-1">{item.marca_modelo}</span>
                                  <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
                                    <span className={`px-1 py-0.2 rounded font-semibold ${
                                      item.forma_pago === 'Permuta' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 
                                      item.forma_pago === 'Financiado' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 
                                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}>
                                      {item.forma_pago || 'Efectivo'}
                                    </span>
                                    <span className="font-bold text-emerald-400 whitespace-nowrap">
                                      {formatCurrency(item.precio_individual, p.moneda)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : p.vehiculo ? (
                          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Car className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="font-medium text-slate-200 truncate">
                                {p.vehiculo.marca} {p.vehiculo.modelo}
                              </span>
                            </div>
                            <span className="font-bold text-emerald-400 font-mono shrink-0 whitespace-nowrap">
                              {formatCurrency(p.precio_ofrecido, p.moneda)}
                            </span>
                          </div>
                        ) : null}

                        {/* Trade-in badge if present */}
                        {p.permuta && (
                          <div className="bg-amber-950/30 border border-amber-500/30 px-2.5 py-1.5 rounded-lg text-[11px] text-amber-300 flex items-center justify-between font-mono gap-2">
                            <span className="truncate">🔄 Toma: <strong>{p.permuta.marca_modelo}</strong></span>
                            <span className="font-bold text-amber-400 shrink-0 whitespace-nowrap">
                              {formatCurrency(p.permuta.valor_tasacion, p.moneda)}
                            </span>
                          </div>
                        )}

                        {/* Loss reason if lost */}
                        {p.motivo_perdida && (
                          <div className="bg-rose-950/40 border border-rose-500/30 px-2.5 py-1 rounded-md text-[11px] text-rose-300">
                            Motivo: <strong>{p.motivo_perdida}</strong>
                          </div>
                        )}

                        {/* RESPONSIVE 2-ROW ACTION BAR */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          {/* Row 1: Action Shortcuts */}
                          <div className="grid grid-cols-4 gap-1.5">
                            {/* 1. Pop-up WhatsApp button */}
                            <button
                              onClick={() => handleOpenWhatsAppModal(
                                p.cliente?.telefono || '', 
                                p.cliente?.nombre || '', 
                                p.vehiculo ? `${p.vehiculo.marca} ${p.vehiculo.modelo}` : '',
                                formatCurrency(p.precio_ofrecido, p.moneda)
                              )}
                              className="py-1.5 px-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-slate-950 transition border border-green-500/30 flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-bold"
                              title="Abrir Pop-up de WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                              WSP
                            </button>

                            {/* 2. Direct Call button */}
                            <a
                              href={`tel:${p.cliente?.telefono}`}
                              className="py-1.5 px-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition border border-cyan-500/30 flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-bold"
                              title="Llamar directamente"
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                            </a>

                            {/* 3. Quick +Nota button */}
                            <button
                              onClick={() => handleOpenInteractionModal(p.cliente_id, p.cliente?.nombre || 'Cliente')}
                              className="py-1.5 px-1 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500 hover:text-white transition border border-purple-500/30 flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-bold"
                              title="Registrar contacto y agendar fecha"
                            >
                              +Nota
                            </button>

                            {/* 4. Edit Draft Button */}
                            <button
                              onClick={() => onEditPresupuesto && onEditPresupuesto(p)}
                              className="py-1.5 px-1 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition border border-amber-500/30 flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-bold"
                              title="Editar / Modificar Borrador"
                            >
                              <Edit3 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </div>

                          {/* Row 2: State Selector Dropdown (Full Width) */}
                          <div>
                            <select
                              value={p.estado.toLowerCase()}
                              onChange={(e) => handleTriggerClosure(p, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
                            >
                              <option value="borrador">Borrador / Nuevo</option>
                              <option value="enviado">En Seguimiento</option>
                              <option value="ganado">✓ Ganado (Vendido)</option>
                              <option value="perdido">✗ Perdido</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Vehículo</th>
                  <th className="p-3.5">Monto Financiado</th>
                  <th className="p-3.5">Permuta</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Acciones Rápida (1-Click)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPresupuestos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/60 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100">{p.cliente?.nombre}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{p.cliente?.telefono}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-cyan-300">
                        {p.vehiculo ? `${p.vehiculo.marca} ${p.vehiculo.modelo}` : 'N/A'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-emerald-400">{formatCurrency(p.precio_ofrecido, p.moneda)}</div>
                      <div className="text-slate-400 text-[10px]">Antic: {formatCurrency(p.anticipo, p.moneda)}</div>
                    </td>
                    <td className="p-3.5">
                      {p.permuta ? (
                        <span className="bg-amber-950/40 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]">
                          {p.permuta.marca_modelo} ({formatCurrency(p.permuta.valor_tasacion, p.moneda)})
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={p.estado.toLowerCase()}
                        onChange={(e) => handleTriggerClosure(p, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1"
                      >
                        <option value="borrador">Nuevo / Borrador</option>
                        <option value="enviado">En Seguimiento</option>
                        <option value="ganado">✓ Ganado</option>
                        <option value="perdido">✗ Perdido</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditPresupuesto && onEditPresupuesto(p)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 font-bold transition flex items-center gap-1 text-xs"
                          title="Editar Borrador"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => handleOpenWhatsAppModal(
                            p.cliente?.telefono || '', 
                            p.cliente?.nombre || '', 
                            p.vehiculo ? `${p.vehiculo.marca} ${p.vehiculo.modelo}` : '',
                            formatCurrency(p.precio_ofrecido, p.moneda)
                          )}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-slate-950 font-bold transition flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                        <button
                          onClick={() => handleOpenInteractionModal(p.cliente_id, p.cliente?.nombre || 'Cliente')}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500 hover:text-white font-bold transition"
                        >
                          + Nota
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interaction Modal */}
      {activeClienteForInteraction && (
        <InteractionModal
          isOpen={interactionModalOpen}
          onClose={() => setInteractionModalOpen(false)}
          clienteNombre={activeClienteForInteraction.nombre}
          clienteId={activeClienteForInteraction.id}
          onSave={async (data) => {
            await onSaveInteraction({
              cliente_id: activeClienteForInteraction.id,
              ...data,
            });
          }}
        />
      )}

      {/* Closure Automation Modal */}
      {activePresupuestoForClosure && (
        <DealClosureModal
          isOpen={closureModalOpen}
          onClose={() => setClosureModalOpen(false)}
          presupuesto={activePresupuestoForClosure}
          targetEstado={targetClosureEstado}
          onConfirm={onUpdateEstadoPresupuesto}
        />
      )}

      {/* WhatsApp Modal */}
      {wspTargetCliente && (
        <WhatsAppModal
          isOpen={wspModalOpen}
          onClose={() => setWspModalOpen(false)}
          clienteNombre={wspTargetCliente.nombre}
          clienteTelefono={wspTargetCliente.telefono}
          vehiculoNombre={wspTargetCliente.vehiculo}
          precioFormatted={wspTargetCliente.precio}
          defaultTemplateType="cotizacion"
        />
      )}
    </div>
  );
};
