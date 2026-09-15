import React, { useState } from 'react';
import { 
  Calculator, 
  X, 
  DollarSign, 
  MessageSquare, 
  Copy, 
  Check, 
  Sparkles, 
  Calendar, 
  Percent,
  ChevronRight
} from 'lucide-react';
import { TipoMoneda } from '../types/crm';
import { formatCurrency } from '../utils/formatters';

interface LoanCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMonto?: number;
  defaultMoneda?: TipoMoneda;
  clienteNombre?: string;
  vehiculoNombre?: string;
}

export const LoanCalculatorModal: React.FC<LoanCalculatorModalProps> = ({
  isOpen,
  onClose,
  defaultMonto = 15000,
  defaultMoneda = 'USD',
  clienteNombre = 'Cliente',
  vehiculoNombre = 'Vehículo',
}) => {
  const [montoFinanciar, setMontoFinanciar] = useState<number>(defaultMonto);
  const [moneda, setMoneda] = useState<TipoMoneda>(defaultMoneda);
  const [tasaInteresAnual, setTasaInteresAnual] = useState<number>(moneda === 'USD' ? 12 : 65);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Calculate monthly installments using standard French amortization formula
  const calcCuotaMensual = (plazoMeses: number) => {
    if (montoFinanciar <= 0) return 0;
    const i = (tasaInteresAnual / 100) / 12; // Monthly rate
    if (i === 0) return Math.round(montoFinanciar / plazoMeses);
    const cuota = montoFinanciar * (i * Math.pow(1 + i, plazoMeses)) / (Math.pow(1 + i, plazoMeses) - 1);
    return Math.round(cuota);
  };

  const cuota12 = calcCuotaMensual(12);
  const cuota24 = calcCuotaMensual(24);
  const cuota36 = calcCuotaMensual(36);
  const cuota48 = calcCuotaMensual(48);

  const getWhatsAppMessageText = () => {
    return `Hola ${clienteNombre}! 🚗 Le comparto la simulación de financiación directa rápida para la unidad *${vehiculoNombre}*:

💵 *Monto a Financiar*: ${formatCurrency(montoFinanciar, moneda)}
📈 *Tasa TNA Estimada*: ${tasaInteresAnual}% anual

📌 *Opciones de Cuotas Estimadas*:
• 12 Cuotas de: *${formatCurrency(cuota12, moneda)}* / mes
• 24 Cuotas de: *${formatCurrency(cuota24, moneda)}* / mes
• 36 Cuotas de: *${formatCurrency(cuota36, moneda)}* / mes
• 48 Cuotas de: *${formatCurrency(cuota48, moneda)}* / mes

_Quedo a su disposición para coordinar la entrega y avanzar._`;
  };

  const handleCopyWhatsApp = () => {
    const text = getWhatsAppMessageText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 p-5 sm:p-6 shadow-2xl space-y-5 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                Simulador de Cuotas & Financiación Directa
              </h3>
              <p className="text-xs text-slate-400">
                Calculadora instantánea de cuotas mensuales para respuesta rápida por WhatsApp
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
              <label className="block font-semibold text-slate-300 mb-1">Moneda</label>
              <select
                value={moneda}
                onChange={(e) => {
                  const m = e.target.value as TipoMoneda;
                  setMoneda(m);
                  setTasaInteresAnual(m === 'USD' ? 12 : 65);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="USD">USD (Dólares)</option>
                <option value="ARS">ARS ($ Pesos)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-emerald-400 mb-1">Monto Saldo a Financiar</label>
              <input
                type="number"
                min={0}
                value={montoFinanciar}
                onChange={(e) => setMontoFinanciar(Number(e.target.value))}
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl p-2.5 text-slate-100 font-extrabold text-emerald-400 font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tasa Anual (TNA %)</label>
              <input
                type="number"
                min={0}
                value={tasaInteresAnual}
                onChange={(e) => setTasaInteresAnual(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Cuotas Mensuales Estimadas:</span>
              <span className="text-emerald-400 font-mono font-extrabold">Saldo: {formatCurrency(montoFinanciar, moneda)}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">12 Cuotas</span>
                <span className="text-base font-black text-slate-100 font-mono block">
                  {formatCurrency(cuota12, moneda)}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5 block">/ mes</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-cyan-500/40 text-center bg-cyan-950/20">
                <span className="text-[10px] font-bold text-cyan-300 block mb-1">24 Cuotas ⭐</span>
                <span className="text-base font-black text-cyan-400 font-mono block">
                  {formatCurrency(cuota24, moneda)}
                </span>
                <span className="text-[9px] text-cyan-500/80 mt-0.5 block">/ mes</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">36 Cuotas</span>
                <span className="text-base font-black text-slate-100 font-mono block">
                  {formatCurrency(cuota36, moneda)}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5 block">/ mes</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">48 Cuotas</span>
                <span className="text-base font-black text-slate-100 font-mono block">
                  {formatCurrency(cuota48, moneda)}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5 block">/ mes</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Text Preview Box */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-green-400">
                <MessageSquare className="w-3.5 h-3.5" /> Vista Previa Mensaje para WhatsApp
              </span>
              <button
                onClick={handleCopyWhatsApp}
                className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500 hover:text-slate-950 font-bold transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '¡Copiado!' : 'Copiar Texto'}
              </button>
            </div>
            <pre className="text-[11px] text-slate-300 font-sans whitespace-pre-wrap leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 max-h-36 overflow-y-auto">
              {getWhatsAppMessageText()}
            </pre>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold text-xs"
          >
            Cerrar
          </button>
          <button
            onClick={handleCopyWhatsApp}
            className="px-5 py-2.5 rounded-xl font-extrabold bg-green-500 text-slate-950 hover:bg-green-400 transition shadow-lg shadow-green-500/20 active:scale-95 flex items-center gap-2 text-xs"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado al Portapapeles!' : 'Copiar Simulación para WSP'}
          </button>
        </div>
      </div>
    </div>
  );
};
