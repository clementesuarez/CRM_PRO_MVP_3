import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, MessageSquare, Sparkles, FileText, User } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteNombre: string;
  clienteTelefono: string;
  vehiculoNombre?: string;
  precioFormatted?: string;
  defaultTemplateType?: 'cotizacion' | 'seguimiento' | 'nuevo_stock' | 'service' | 'general';
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

  // Generate pre-filled template text
  useEffect(() => {
    let text = '';
    const cleanNombre = clienteNombre || 'Estimado/a';

    switch (templateType) {
      case 'cotizacion':
        text = `Hola ${cleanNombre}, te escribo de la agencia respecto al *${vehiculoNombre}* ${precioFormatted ? `(Valor: ${precioFormatted})` : ''}.\n\n¿Te gustaría que te envíe los detalles de financiación y tomar tu usado en permuta? 🚗✨`;
        break;
      case 'seguimiento':
        text = `Hola ${cleanNombre}, ¿cómo estás? Te contacto para hacer seguimiento de tu consulta por el *${vehiculoNombre}*. ¡Quedo a tu disposición si querés pasar por el salón a probar la unidad! 🔑`;
        break;
      case 'nuevo_stock':
        text = `Hola ${cleanNombre}, ¡ingresó una nueva unidad a nuestro stock que puede interesarte! 🚀 *${vehiculoNombre}*. ¿Querés que te comparta fotos y ficha técnica?`;
        break;
      case 'service':
        text = `Hola ${cleanNombre}, ¡esperamos que estés disfrutando tu vehículo! 🚗 Te recordamos que está próximo el service de mantenimiento preventivo. ¿Te coordinamos un turno en el taller oficial?`;
        break;
      default:
        text = `Hola ${cleanNombre}, te escribo de la agencia para ponerme a tu disposición. ¿En qué te podemos asesorar hoy?`;
        break;
    }

    setMensajeText(text);
  }, [templateType, clienteNombre, vehiculoNombre, precioFormatted]);

  if (!isOpen) return null;

  const handleSendWhatsApp = () => {
    const cleanPhone = clienteTelefono.replace(/\D/g, '');
    const encoded = encodeURIComponent(mensajeText);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    onClose();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(mensajeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-green-500/40 p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-green-500/20 text-green-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">Armar Mensaje de WhatsApp</h3>
              <p className="text-xs text-slate-400">Para: <span className="text-cyan-300 font-bold">{clienteNombre}</span> ({clienteTelefono})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Template Selector Buttons */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Plantillas Rápidas
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'cotizacion', label: '📊 Cotización' },
              { id: 'seguimiento', label: '🤝 Seguimiento' },
              { id: 'nuevo_stock', label: '🚘 Nuevo Stock' },
              { id: 'service', label: '🔧 Service' },
              { id: 'general', label: '💬 Saludo' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateType(t.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  templateType === t.id
                    ? 'bg-green-500 text-slate-950 shadow-md shadow-green-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customizable Editable Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Personalizar Mensaje a Enviar
          </label>
          <textarea
            rows={5}
            value={mensajeText}
            onChange={(e) => setMensajeText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 font-sans focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Texto Copiado!' : 'Copiar Texto'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-green-500 text-slate-950 hover:bg-green-400 transition flex items-center gap-2 shadow-lg shadow-green-500/20 active:scale-95"
            >
              <Send className="w-4 h-4" />
              Abrir WhatsApp Ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
