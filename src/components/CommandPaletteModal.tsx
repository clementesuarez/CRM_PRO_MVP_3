import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  User, 
  Car, 
  FileText, 
  PlusCircle, 
  Calculator, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { Cliente, Inventario, Presupuesto } from '../types/crm';
import { flexSearchMatch } from '../utils/searchHelper';
import { formatCurrency } from '../utils/formatters';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  inventario: Inventario[];
  presupuestos: Presupuesto[];
  onSelectCliente?: (c: Cliente) => void;
  onSelectVehiculo?: (v: Inventario) => void;
  onOpenQuotation?: () => void;
  onOpenAddVehiculo?: () => void;
  onOpenAddCliente?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  clientes,
  inventario,
  presupuestos,
  onSelectCliente,
  onSelectVehiculo,
  onOpenQuotation,
  onOpenAddVehiculo,
  onOpenAddCliente,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter clients
  const matchedClientes = query.trim()
    ? clientes.filter(c => flexSearchMatch(`${c.nombre} ${c.apellido || ''} ${c.telefono} ${c.numero_documento || ''}`, query)).slice(0, 4)
    : clientes.slice(0, 3);

  // Filter vehicles
  const matchedVehiculos = query.trim()
    ? inventario.filter(v => flexSearchMatch(`${v.marca} ${v.modelo} ${v.patente || ''} ${v.tipo_vehiculo || ''}`, query)).slice(0, 4)
    : inventario.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md p-4 pt-16 sm:pt-24 animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden space-y-0">
        
        {/* Search Bar Input */}
        <div className="relative border-b border-slate-800 p-4 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Escribe para buscar cliente, patente, vehículo o acción rápida (Ctrl+K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Quick Actions Shortcuts */}
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Acciones Rápidas del CRM
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenQuotation) onOpenQuotation();
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 font-bold transition flex items-center gap-2 text-left"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Nueva Cotización</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenAddVehiculo) onOpenAddVehiculo();
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-500/20 border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-purple-300 font-bold transition flex items-center gap-2 text-left"
              >
                <Package className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">+ Cargar Vehículo</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenAddCliente) onOpenAddCliente();
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 font-bold transition flex items-center gap-2 text-left"
              >
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">+ Nuevo Cliente</span>
              </button>
            </div>
          </div>

          {/* Matched Clients */}
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Base de Clientes ({matchedClientes.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {matchedClientes.map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    onClose();
                    if (onSelectCliente) onSelectCliente(c);
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition">
                        {c.nombre} {c.apellido || ''}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        📞 {c.telefono} {c.localidad ? `• ${c.localidad}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 flex items-center gap-1 font-bold">
                    Ver Ficha <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Matched Vehicles */}
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-cyan-400" /> Inventario & Stock ({matchedVehiculos.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {matchedVehiculos.map(v => (
                <div
                  key={v.id}
                  onClick={() => {
                    onClose();
                    if (onSelectVehiculo) onSelectVehiculo(v);
                  }}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-300 font-bold">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-purple-300 transition">
                        {v.marca} {v.modelo} ({v.anio})
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Patente: {v.patente || 'Sin Patente'} • {v.es_cero_km ? '0KM' : `${v.kilometraje.toLocaleString()} km`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-emerald-400 font-mono">
                      {formatCurrency(v.precio_lista, v.moneda)}
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover:text-purple-300 flex items-center gap-1 font-bold justify-end">
                      Ficha <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Consejo: Presiona <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300">Ctrl + K</kbd> en cualquier momento</span>
          <span className="font-bold text-cyan-400">AutoCRM PRO</span>
        </div>
      </div>
    </div>
  );
};
