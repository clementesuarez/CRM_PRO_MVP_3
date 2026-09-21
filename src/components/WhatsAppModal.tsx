import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, MessageSquare } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteNombre: string;
  clienteTelefono: string;
  vehiculoNombre?: string;
  precioFormatted?: string;
  defaultTemplateType?: 'cotizacion' | 'seguimiento' | 'nuevo_stock' | 'service' | 'general';
}

// Normaliza el texto monetario para evitar "$ USD"
function cleanPrecioFormat(raw: string): string {
  if (!raw || !raw.trim()) return '';
  const str = raw.trim();

  const isUSD = /usd|dolar|u\$s/i.test(str);
  // Extraer números y puntos de miles
  const digitsOnly = str.replace(/[^\d.,]/g, '').trim();

  if (isUSD) {
    return `USD ${digitsOnly}`;
  }
  return `$ ${digitsOnly}`;
}

// Sanitiza el teléfono al formato internacional de WhatsApp en Argentina (549...)
function sanitizeArgentinePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';

  // Si arranca con 549
  if (cleaned.startsWith('549')) return cleaned;

  // Si arranca con 54 pero sin el 9 (ej: 5411...)
  if (cleaned.startsWith('54')) {
    const after54 = cleaned.slice(2);
    const without15 = after54.startsWith('15') ? after54.slice(2) : after54;
    return `549${without15}`;
  }

  // Si empieza con 0 (ej: 011... o 0351...)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  // Si tiene el 15 local después del código de área o al inicio (ej: 1544332211)
  if (cleaned.startsWith('15')) {
    cleaned = cleaned.slice(2);
  }

  return `549${cleaned}`;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  clienteNombre,
  clienteTelefono,
  vehiculoNombre = 'el vehículo de tu interés',
  precioFormatted = '',
  defaultTemplateType = 'cotizacion',
}) => {
  const [templateType, setTemplateType] = useState(defaultTemplateType);
  const [mensajeText, setMensajeText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let text = '';
    const cleanNombre = clienteNombre?.trim() || 'Estimado/a';
    const precioLimpio = cleanPrecioFormat(precioFormatted);

    switch (templateType) {
      case 'cotizacion':
        text = `Hola ${cleanNombre}, te escribo de la agencia respecto al *${vehiculoNombre}*${precioLimpio ? ` (Valor: *${precioLimpio}*)` : ''}.\n\n¿Te gustaría que te envíe los detalles del plan de financiación o la tasación de tu usado en permuta? 🚗✨`;
        break;
      case 'seguimiento':
        text = `Hola ${cleanNombre}, ¿cómo estás? Te contacto para hacer seguimiento sobre el *${vehiculoNombre}* que estuvimos viendo.\n\n¿Querés que coordinemos para que pases por el salón a probarlo? 🔑`;
        break;
      case 'nuevo_stock':
        text = `Hola ${cleanNombre}, acaba de ingresar una unidad destacada a nuestro stock: *${vehiculoNombre}*${precioLimpio ? ` (${precioLimpio})` : ''}.\n\n¿Te comparto fotos y ficha técnica detallada? 🚀`;
        break;
      case 'service':
        text = `Hola ${cleanNombre}, ¡esperamos que estés disfrutando tu unidad! 🚗 Te recordamos que según kilometraje corresponde el service de mantenimiento preventivo. ¿Te gustaría coordinar un turno en taller?`;
        break;
      default:
        text = `Hola ${cleanNombre}, te escribo del equipo de ventas de la agencia para ponerme a tu entera disposición. ¿En qué vehículo te podemos asesorar hoy?`;
        break;
    }

    setMensajeText(text);
  }, [templateType, clienteNombre, vehiculoNombre, precioFormatted]);

  if (!isOpen) return null;

  const handleSendWhatsApp = () => {
    const finalPhone = sanitizeArgentinePhone(clienteTelefono);
    const encoded = encodeURIComponent(mensajeText);
    window.open(`https://wa.me/${finalPhone}?text=${encoded}`, '_blank');
    onClose();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(mensajeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-emerald-500/40 p-6 shadow-2xl space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">Mensaje de WhatsApp</h3>
              <p className="text-xs text-slate-400">
                Destinatario: <span className="text-cyan-300 font-bold">{clienteNombre || 'Cliente'}</span> ({clienteTelefono})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Plantillas */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Seleccionar Plantilla
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'cotizacion', label: '📊 Cotización' },
              { id: 'seguimiento', label: '🤝 Seguimiento' },
              { id: 'nuevo_stock', label: '🚘 Nuevo Stock' },
              { id: 'service', label: '🔧 Posventa' },
              { id: 'general', label: '💬 Saludo' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateType(t.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${templateType === t.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vista previa editable */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Texto del Mensaje (Editable)
          </label>
          <textarea
            rows={5}
            value={mensajeText}
            onChange={(e) => setMensajeText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 font-sans focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Send className="w-4 h-4" />
              Abrir WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};