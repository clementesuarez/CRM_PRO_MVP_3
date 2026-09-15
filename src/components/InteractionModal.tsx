import React, { useState } from 'react';
import { X, Calendar, Phone, Users, PhoneOff, MessageSquare, Mail, Tag, CheckSquare, Clock, Zap } from 'lucide-react';
import { TipoInteraccion } from '../types/crm';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteNombre: string;
  clienteId: string;
  onSave: (data: { 
    tipo: TipoInteraccion; 
    nota: string; 
    accion_siguiente?: string; 
    proximo_contacto?: string 
  }) => Promise<void>;
}

const ACCIONES_SUGERIDAS = [
  'Enviar ficha técnica y fotos por WSP',
  'Pasar tasación de auto usado en permuta',
  'Enviar propuesta de crédito / financiación',
  'Coordinar Test Drive / Prueba de manejo',
  'Volver a llamar por decisión final',
  'Revisar ingreso de nuevo stock',
  'Sin acción pendiente'
];

export const InteractionModal: React.FC<InteractionModalProps> = ({
  isOpen,
  onClose,
  clienteNombre,
  onSave,
}) => {
  const [tipo, setTipo] = useState<TipoInteraccion>('Vino al salón');
  const [nota, setNota] = useState('');
  const [accionSiguiente, setAccionSiguiente] = useState(ACCIONES_SUGERIDAS[0]);
  const [proximoContacto, setProximoContacto] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nota.trim()) return;
    setLoading(true);
    try {
      await onSave({
        tipo,
        nota,
        accion_siguiente: accionSiguiente,
        proximo_contacto: proximoContacto ? new Date(proximoContacto).toISOString() : undefined,
      });
      setNota('');
      setProximoContacto('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for quick date scheduling
  const setQuickDate = (daysFromNow: number, hour: number = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);
    // Format YYYY-MM-DDTHH:mm for datetime-local input
    const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setProximoContacto(isoStr);
  };

  const tipos: { label: TipoInteraccion; icon: any; color: string }[] = [
    { label: 'Vino al salón', icon: Users, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { label: 'Llamó', icon: Phone, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
    { label: 'No contesta', icon: PhoneOff, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-500/10 text-green-400 border-green-500/30' },
    { label: 'Mail', icon: Mail, color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 p-6 shadow-2xl space-y-5 my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
              Registrar Contacto & Agendar Acción
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Cliente: <span className="text-cyan-300 font-bold">{clienteNombre}</span></p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Canal de Contacto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Resultado / Canal de Contacto
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tipos.map((t) => {
                const Icon = t.icon;
                const isSelected = tipo === t.label;
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setTipo(t.label)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-medium transition ${
                      isSelected 
                        ? `${t.color} border-cyan-500 shadow-md shadow-cyan-950 scale-[1.02]` 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Comentario / Nota */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              2. Comentario / Nota del Contacto *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Escribe aquí los detalles conversados (ej: Probó el auto en salón, le gustó el estado, pide propuesta de financiación a 24 meses...)"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* 3. Acción a Generar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              3. Acción Siguiente a Generar (Compromiso)
            </label>
            <select
              value={accionSiguiente}
              onChange={(e) => setAccionSiguiente(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {ACCIONES_SUGERIDAS.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* 4. Fecha de Próximo Contacto & Botones Rápidos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                4. Agendar Nueva Fecha de Contacto
              </label>
            </div>

            <input
              type="datetime-local"
              value={proximoContacto}
              onChange={(e) => setProximoContacto(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 mb-2"
            />

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setQuickDate(1, 10)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 font-semibold hover:bg-slate-800"
              >
                ⚡ Mañana 10:00 hs
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(3, 11)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 font-semibold hover:bg-slate-800"
              >
                📅 En 3 Días
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7, 10)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 font-semibold hover:bg-slate-800"
              >
                📆 En 1 Semana
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-extrabold bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar y Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
