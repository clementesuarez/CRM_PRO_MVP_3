import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EstadoPresupuesto, MotivoPerdida, Presupuesto } from '../types/crm';

interface DealClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  presupuesto: Presupuesto | null;
  targetEstado: EstadoPresupuesto;
  onConfirm: (presupuestoId: string, nuevoEstado: EstadoPresupuesto, motivoPerdida?: MotivoPerdida) => Promise<void>;
}

const MOTIVOS: MotivoPerdida[] = [
  'Precio alto',
  'Financiación inviable',
  'Tasación baja',
  'Sin stock',
  'Compró en otra agencia',
  'Otro',
];

export const DealClosureModal: React.FC<DealClosureModalProps> = ({
  isOpen,
  onClose,
  presupuesto,
  targetEstado,
  onConfirm,
}) => {
  const [selectedMotivo, setSelectedMotivo] = useState<MotivoPerdida>('Precio alto');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !presupuesto) return null;

  const isGanado = targetEstado.toLowerCase() === 'ganado';

  const handleExecute = async () => {
    setLoading(true);
    try {
      if (isGanado) {
        // Trigger celebratory confetti effect
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b'],
        });
      }

      await onConfirm(
        presupuesto.id,
        targetEstado,
        !isGanado ? selectedMotivo : undefined
      );

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className={`glass-panel w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
        isGanado ? 'border-emerald-500/40 bg-slate-900/95' : 'border-rose-500/40 bg-slate-900/95'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isGanado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isGanado ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {isGanado ? '🎉 ¡Cierre de Venta (Ganado)!' : 'Marcar Oportunidad como Perdida'}
              </h3>
              <p className="text-xs text-slate-400">
                Cliente: <span className="text-slate-200 font-semibold">{presupuesto.cliente?.nombre || 'Cliente'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        {isGanado ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-2">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Automatizaciones Operativas Activadas:
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                <li>
                  El vehículo <span className="font-bold text-white">{presupuesto.vehiculo?.marca} {presupuesto.vehiculo?.modelo}</span> pasará a estado <span className="text-emerald-400 font-bold">'vendido'</span> en inventario.
                </li>
                {presupuesto.permuta ? (
                  <li>
                    Se registrará automáticamente el usado en permuta <span className="font-bold text-cyan-300">{presupuesto.permuta.marca_modelo} ({presupuesto.permuta.anio})</span> en el inventario bajo el estado <span className="text-amber-400 font-bold">'reacondicionamiento'</span> con costo de toma de <span className="font-bold text-emerald-400">${presupuesto.permuta.valor_tasacion.toLocaleString()} USD</span>.
                  </li>
                ) : (
                  <li>No se registraron permutas para este presupuesto.</li>
                )}
                <li>El cliente será categorizado como comprador activo para posventa.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Por favor, selecciona el motivo principal por el cual no se concretó la venta para enriquecer los informes de pérdida del salón:
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-rose-400" />
                Motivo de Pérdida Obligatorio:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {MOTIVOS.map((m) => (
                  <label
                    key={m}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs font-medium transition ${
                      selectedMotivo === m
                        ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="motivo"
                      value={m}
                      checked={selectedMotivo === m}
                      onChange={() => setSelectedMotivo(m)}
                      className="accent-rose-500"
                    />
                    {m}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50 ${
              isGanado
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
                : 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/20'
            }`}
          >
            {loading ? 'Procesando...' : (
              <>
                Confirmar {isGanado ? 'Cierre Ganado' : 'Marcar Perdido'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
