import { CuotaPagare, Cliente } from '../types/crm';
import { dataService } from './dataService';

export type WhatsAppProvider = 'meta_cloud' | 'ultramsg' | 'simulation';

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  metaPhoneId?: string;
  metaAccessToken?: string;
  metaBusinessId?: string;
  ultramsgInstanceId?: string;
  ultramsgToken?: string;
  enabledAutoLogging: boolean;
  defaultTemplate: string;
}

const CONFIG_STORAGE_KEY = 'crm_pro_whatsapp_config';

export const DEFAULT_WHATSAPP_TEMPLATE = 
  `Hola {nombre_cliente}, te saludamos de la Concesionaria. 🚗📜\n\n` +
  `Te enviamos un recordatorio sobre tu Pagaré *{numero_pagare}* ({numero_cuota}) por el monto de *{monto_formateado}*, con fecha de vencimiento el *{fecha_vencimiento}*.\n\n` +
  `Quedamos a tu entera disposición para coordinar el cobro o recibir tu comprobante. ¡Muchas gracias!`;

export const DEFAULT_OVERDUE_WHATSAPP_TEMPLATE = 
  `Hola {nombre_cliente}, te contactamos del área de administración y cobranzas de la Concesionaria. ⚠️📜\n\n` +
  `Te informamos que tu Pagaré *{numero_pagare}* ({numero_cuota}) por el monto de *{monto_formateado}*, registró fecha de vencimiento el *{fecha_vencimiento}* y figura actualmente impago con mora.\n\n` +
  `Te solicitamos por favor contactarte a la brevedad para regularizar el estado de tu cuenta o hacernos llegar el comprobante de transferencia correspondiente. ¡Muchas gracias!`;

export const DEFAULT_GENERAL_WHATSAPP_TEMPLATE =
  `Hola {nombre_cliente}, te saludamos de la Concesionaria respecto a tu plan de pagos y pagarés.\n\n` +
  `Quedamos a tu entera disposición para cualquier consulta o coordinación de tus cuotas. ¡Saludos cordiales!`;

export const getRecommendedTemplate = (cuota?: CuotaPagare | null): string => {
  if (!cuota) return DEFAULT_WHATSAPP_TEMPLATE;
  if (cuota.estado === 'Vencido') return DEFAULT_OVERDUE_WHATSAPP_TEMPLATE;
  if (cuota.fecha_vencimiento) {
    const cleanDateStr = String(cuota.fecha_vencimiento).split('T')[0];
    const dueDate = new Date(cleanDateStr + 'T23:59:59');
    if (dueDate < new Date()) {
      return DEFAULT_OVERDUE_WHATSAPP_TEMPLATE;
    }
  }
  return DEFAULT_WHATSAPP_TEMPLATE;
};

export const getWhatsAppConfig = (): WhatsAppConfig => {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo config WhatsApp:', err);
  }
  return {
    provider: 'simulation',
    metaPhoneId: '',
    metaAccessToken: '',
    ultramsgInstanceId: '',
    ultramsgToken: '',
    enabledAutoLogging: true,
    defaultTemplate: DEFAULT_WHATSAPP_TEMPLATE,
  };
};

export const saveWhatsAppConfig = (config: WhatsAppConfig): void => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error guardando config WhatsApp:', err);
  }
};

export const formatWhatsAppMessage = (
  template: string,
  cuota?: CuotaPagare | null,
  cliente?: Cliente | null,
  extraParams?: { vehiculo?: string; monto?: string }
): string => {
  if (!template) return '';
  const name = cliente ? `${cliente.nombre} ${cliente.apellido || ''}`.trim() : 'Cliente';
  const pagareNum = cuota?.numero_pagare || (cuota ? `PAG-${String(cuota.numero_cuota).padStart(4, '0')}` : '');
  
  // Format AR date cleanly
  let fechaVencStr = cuota?.fecha_vencimiento ? cuota.fecha_vencimiento.split('T')[0] : '-';
  const parts = fechaVencStr.split('-');
  if (parts.length === 3) fechaVencStr = `${parts[2]}/${parts[1]}/${parts[0]}`;

  const monedaText = cuota ? (cuota.moneda === 'ARS' ? 'ARS ($)' : 'USD ($)') : '';
  const montoText = extraParams?.monto || (cuota ? `${monedaText} ${cuota.monto_cuota.toLocaleString('es-AR')}` : '');
  const cuotaText = cuota ? `Cuota ${cuota.numero_cuota} de ${cuota.prestamo?.cantidad_cuotas || 12}` : '';
  const vehiculoText = extraParams?.vehiculo || 'el vehículo de tu interés';

  return template
    .replace(/\{nombre_cliente\}|\{\{nombre_cliente\}\}|\{\{cliente_nombre\}\}/g, name)
    .replace(/\{numero_pagare\}|\{\{numero_pagare\}\}|\{\{pagare_nro\}\}/g, pagareNum)
    .replace(/\{numero_cuota\}|\{\{numero_cuota\}\}|\{\{cuota_nro\}\}/g, cuotaText)
    .replace(/\{monto_formateado\}|\{\{monto_formateado\}\}|\{\{monto\}\}/g, montoText)
    .replace(/\{fecha_vencimiento\}|\{\{fecha_vencimiento\}\}|\{\{vencimiento\}\}/g, fechaVencStr)
    .replace(/\{estado_cuota\}|\{\{estado_cuota\}\}|\{\{estado\}\}/g, cuota?.estado || '')
    .replace(/\{vehiculo\}|\{\{vehiculo\}\}|\{\{vehiculo_nombre\}\}/g, vehiculoText);
};

export const buildWhatsAppWebUrl = (phone?: string, text?: string): string => {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const encodedText = encodeURIComponent(text || '');
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
};

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const sendWhatsAppMessageAPI = async (
  phone: string,
  message: string,
  config: WhatsAppConfig
): Promise<SendResult> => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) {
    return { success: false, error: 'Número de teléfono inválido o vacío' };
  }

  // Provider 1: Meta Cloud API (Official)
  if (config.provider === 'meta_cloud' && config.metaPhoneId && config.metaAccessToken) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${config.metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.metaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: message }
        })
      });

      const data = await response.json();
      if (response.ok && data.messages?.[0]?.id) {
        return { success: true, messageId: data.messages[0].id };
      }
      return { success: false, error: data.error?.message || 'Error en Meta Cloud API' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de red con Meta Cloud API' };
    }
  }

  // Provider 2: UltraMsg / Gateway API
  if (config.provider === 'ultramsg' && config.ultramsgInstanceId && config.ultramsgToken) {
    try {
      const response = await fetch(`https://api.ultramsg.com/${config.ultramsgInstanceId}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: config.ultramsgToken,
          to: cleanPhone,
          body: message
        })
      });

      const data = await response.json();
      if (data.sent === 'true' || data.id) {
        return { success: true, messageId: data.id || 'sent' };
      }
      return { success: false, error: data.error || 'Error en UltraMsg API' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error conectando con Gateway WhatsApp' };
    }
  }

  // Provider 3: Simulation / Sandbox (Default for local test)
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API network latency
  return { 
    success: true, 
    messageId: 'sim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) 
  };
};
