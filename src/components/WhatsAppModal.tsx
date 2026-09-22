import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Copy, Check, MessageSquare, Save, Sparkles } from 'lucide-react';
import { dataService } from '../services/dataService';
import { PlantillaWhatsApp } from '../types/crm';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteNombre: string;
  clienteTelefono: string;
  vehiculoNombre?: string;
  precioFormatted?: string;
  defaultTemplateType?: 'cotizacion' | 'seguimiento' | 'nuevo_stock' | 'service' | 'general';
}

function cleanPrecioFormat(raw: string): string {
  if (!raw || !raw.trim()) return '';
  const str = raw.trim();

  const isUSD = /usd|dolar|u\$s/i.test(str);
  const digitsOnly = str.replace(/[^\d.,]/g, '').trim();

  if (isUSD) {
    return `USD ${digitsOnly}`;
  }
  return `$ ${digitsOnly}`;
}

function sanitizeArgentinePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('549')) return cleaned;

  if (cleaned.startsWith('54')) {
    const after54 = cleaned.slice(2);
    const without15 = after54.startsWith('15') ? after54.slice(2) : after54;
    return `549${without15}`;
  }

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.startsWith('15')) {
    cleaned = cleaned.slice(2);
  }

  return `549${cleaned}`;
}

const DEFAULT_CLIENTE_TEMPLATES: Record<string, { titulo: string; contenido: string }> = {
  cotizacion: {
    titulo: '📊 Cotización',
    contenido: 'Hola {nombre_cliente}, te escribo de la agencia respecto al *{vehiculo}*{monto_formateado}.\n\n¿Te gustaría que te envíe los detalles del plan de financiación o la tasación de tu usado en permuta? 🚗✨'
  },
  seguimiento: {
    titulo: '🤝 Seguimiento',
    contenido: 'Hola {nombre_cliente}, ¿cómo estás? Te contacto para hacer seguimiento sobre el *{vehiculo}* que estuvimos viendo.\n\n¿Querés que coordinemos para que pases por el salón a probarlo? 🔑'
  },
  nuevo_stock: {
    titulo: '🚘 Nuevo Stock',
    contenido: 'Hola {nombre_cliente}, acaba de ingresar una unidad destacada a nuestro stock: *{vehiculo}*{monto_formateado}.\n\n¿Te comparto fotos y ficha técnica detallada? 🚀'
  },
  service: {
    titulo: '🔧 Posventa',
    contenido: 'Hola {nombre_cliente}, ¡esperamos que estés disfrutando tu unidad! 🚗 Te recordamos que según kilometraje corresponde el service de mantenimiento preventivo. ¿Te gustaría coordinar un turno en taller?'
  },
  general: {
    titulo: '💬 Saludo General',
    contenido: 'Hola {nombre_cliente}, te escribo del equipo de ventas de la agencia para ponerme a tu entera disposición. ¿En qué vehículo te podemos asesorar hoy?'
  }
};

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
  const [rawTemplate, setRawTemplate] = useState('');
  const [mensajeText, setMensajeText] = useState('');
  const [dbPlantillas, setDbPlantillas] = useState<PlantillaWhatsApp[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load DB plantillas when modal opens
  useEffect(() => {
    if (isOpen) {
      dataService.getPlantillasWsp().then((list) => {
        if (list && list.length > 0) {
          setDbPlantillas(list);
        }
      }).catch(err => console.error('Error cargando plantillas DB:', err));
    }
  }, [isOpen]);

  // Update template content when templateType changes or DB plantillas update
  useEffect(() => {
    const dbMatch = dbPlantillas.find(p => p.codigo === templateType);
    let templateStr = '';
    if (dbMatch && dbMatch.contenido) {
      templateStr = dbMatch.contenido;
    } else if (DEFAULT_CLIENTE_TEMPLATES[templateType]) {
      templateStr = DEFAULT_CLIENTE_TEMPLATES[templateType].contenido;
    } else {
      templateStr = DEFAULT_CLIENTE_TEMPLATES['general'].contenido;
    }
    setRawTemplate(templateStr);
  }, [templateType, dbPlantillas]);

  // Compute live processed message text from rawTemplate & context variables
  useEffect(() => {
    const cleanNombre = clienteNombre?.trim() || 'Estimado/a';
    const precioLimpio = cleanPrecioFormat(precioFormatted);
    const montoText = precioLimpio ? ` (Valor: *${precioLimpio}*)` : '';

    let text = rawTemplate
      .replace(/\{nombre_cliente\}|\{\{nombre_cliente\}\}|\{nombre\}|\{\{nombre\}\}/g, cleanNombre)
      .replace(/\{vehiculo\}|\{\{vehiculo\}\}|\{vehiculo_nombre\}|\{\{vehiculo_nombre\}\}/g, vehiculoNombre)
      .replace(/\{monto_formateado\}|\{\{monto_formateado\}\}|\{precio\}|\{\{precio\}\}/g, montoText);

    setMensajeText(text);
  }, [rawTemplate, clienteNombre, vehiculoNombre, precioFormatted]);

  if (!isOpen) return null;

  const insertTagAtCursor = (tag: string) => {
    if (!textareaRef.current) {
      setRawTemplate(prev => prev + ' ' + tag);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const newText = rawTemplate.substring(0, start) + tag + rawTemplate.substring(end);
    setRawTemplate(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleSaveTemplateToDB = async () => {
    setIsSaving(true);
    setSaveStatus('');
    try {
      const def = DEFAULT_CLIENTE_TEMPLATES[templateType];
      const res = await dataService.savePlantillaWsp({
        modulo: 'clientes',
        codigo: templateType,
        titulo: def ? def.titulo : templateType,
        contenido: rawTemplate
      });
      if (res && res.plantillas) {
        setDbPlantillas(res.plantillas);
      }
      setSaveStatus('¡Guardado en SQLite!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Error al guardar plantilla:', err);
      setSaveStatus('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

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
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-emerald-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">

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

        {/* Tag Insertions */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Plantilla Base (Editable con variables)
            </label>
            <div className="flex items-center gap-2">
              {saveStatus && <span className="text-[10px] text-emerald-400 font-bold">{saveStatus}</span>}
              <button
                type="button"
                onClick={handleSaveTemplateToDB}
                disabled={isSaving}
                className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold hover:bg-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
                title="Guardar esta plantilla en la base de datos SQLite"
              >
                <Save className="w-3 h-3" />
                Guardar Plantilla
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 items-center bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 mr-1 font-semibold">Insertar tag:</span>
            {['{nombre_cliente}', '{vehiculo}', '{monto_formateado}'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => insertTagAtCursor(tag)}
                className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 px-2 py-0.5 rounded transition cursor-pointer active:scale-95"
              >
                + {tag}
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            rows={4}
            value={rawTemplate}
            onChange={(e) => setRawTemplate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 font-sans focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed"
          />
        </div>

        {/* Live processed preview */}
        <div>
          <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            👁️ Vista Previa del Mensaje Final
          </label>
          <div className="w-full bg-slate-950/90 border border-emerald-500/30 rounded-xl p-3 text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
            {mensajeText}
          </div>
        </div>

        {/* Actions */}
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