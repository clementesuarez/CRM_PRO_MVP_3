import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Car, 
  User, 
  CheckCircle, 
  MessageSquare, 
  PlusCircle, 
  ArrowRight,
  Filter,
  DollarSign
} from 'lucide-react';
import { Cliente, Inventario } from '../types/crm';
import { formatCurrency } from '../utils/formatters';

interface VehicleMatchmakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  inventario: Inventario[];
  onStartQuotationForClientAndVehicle?: (clienteId: string, vehiculoId: string) => void;
  onSendWhatsAppProposal?: (clienteTelefono: string, clienteNombre: string, vehiculoNombre: string, precioFormatted: string) => void;
}

export const VehicleMatchmakerModal: React.FC<VehicleMatchmakerModalProps> = ({
  isOpen,
  onClose,
  clientes,
  inventario,
  onStartQuotationForClientAndVehicle,
  onSendWhatsAppProposal,
}) => {
  const [selectedClienteId, setSelectedClienteId] = useState<string>(clientes[0]?.id || '');
  const [targetType, setTargetType] = useState<string>('todos');
  const [maxBudget, setMaxBudget] = useState<number>(50000);

  if (!isOpen) return null;

  const selectedCliente = clientes.find(c => c.id === selectedClienteId) || clientes[0];

  // Smart matching algorithm
  const stockDisponible = inventario.filter(v => v.estado.toLowerCase() === 'disponible');

  const matchedVehicles = stockDisponible.filter(v => {
    const matchType = targetType === 'todos' || (v.tipo_vehiculo || '').toLowerCase().includes(targetType.toLowerCase());
    const matchPrice = maxBudget === 0 || v.precio_lista <= maxBudget;
    return matchType && matchPrice;
  }).sort((a, b) => a.precio_lista - b.precio_lista);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 p-5 sm:p-6 shadow-2xl space-y-5 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                Emparejador Inteligente de Stock (Vehicle Matchmaker)
              </h3>
              <p className="text-xs text-slate-400">
                Sugerencias de vehículos en salón según presupuesto y preferencia del comprador
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Seleccionar Comprador</label>
              <select
                value={selectedClienteId}
                onChange={(e) => setSelectedClienteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
              >
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellido || ''} ({c.telefono})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Preferencia / Tipo de Carrocería</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="todos">Todos los Tipos de Carrocería</option>
                <option value="Pick-up">Pick-up / Camioneta</option>
                <option value="SUV">SUV / Crossover</option>
                <option value="Sedán">Sedán</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Motocicleta">Motocicleta / Cuatriciclo</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-amber-400 mb-1">Presupuesto Máximo ($ USD)</label>
              <input
                type="number"
                step={1000}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-2.5 text-slate-100 font-extrabold text-amber-400 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Matches Header */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-cyan-400" />
              Unidades Recomendadas para <strong className="text-cyan-300">{selectedCliente?.nombre} {selectedCliente?.apellido || ''}</strong> ({matchedVehicles.length})
            </span>
            {selectedCliente?.deja_auto_permuta && (
              <span className="bg-amber-950/60 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                🔄 Permuta registrada en cliente: {selectedCliente.auto_permuta_detalle || 'Sí'}
              </span>
            )}
          </div>

          {/* Matches List */}
          <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
            {matchedVehicles.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No hay unidades disponibles en stock que coincidan con esos criterios.
              </div>
            ) : (
              matchedVehicles.map(v => (
                <div
                  key={v.id}
                  className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 hover:border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold shrink-0 mt-0.5">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-100 text-sm group-hover:text-amber-300 transition flex items-center gap-2">
                        {v.marca} {v.modelo} ({v.anio})
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {v.tipo_vehiculo || 'Auto'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                        <span>Patente: {v.patente || 'Sin Patente'}</span>
                        <span>• {v.es_cero_km ? '0KM' : `${v.kilometraje.toLocaleString()} km`}</span>
                        <span className="text-purple-300 font-semibold">{v.origen_stock || 'Propio'}</span>
                      </div>
                      {v.observaciones && (
                        <div className="text-[11px] text-slate-500 italic mt-1 truncate max-w-md">
                          "{v.observaciones}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400 font-mono">
                        {formatCurrency(v.precio_lista, v.moneda)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Costo: {formatCurrency(v.costo_compra, v.moneda)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onSendWhatsAppProposal && (
                        <button
                          onClick={() => {
                            onSendWhatsAppProposal(
                              selectedCliente.telefono,
                              selectedCliente.nombre,
                              `${v.marca} ${v.modelo}`,
                              formatCurrency(v.precio_lista, v.moneda)
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-slate-950 font-bold transition flex items-center gap-1 text-[11px]"
                          title="Enviar ficha técnica por WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WSP
                        </button>
                      )}

                      {onStartQuotationForClientAndVehicle && (
                        <button
                          onClick={() => {
                            onClose();
                            onStartQuotationForClientAndVehicle(selectedCliente.id, v.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold transition flex items-center gap-1 text-[11px] shadow-md shadow-amber-500/20"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Cotizar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-500 text-[11px]">Emparejamiento impulsado por AutoCRM PRO Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
