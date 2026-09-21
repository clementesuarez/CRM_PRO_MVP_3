import React, { useState, useEffect, useRef } from 'react';
import { PrestamoPagare, CuotaPagare, ReclamoCobranza, Cliente, EstadoCuota, TipoGestionCobranza, ResultadoGestionCobranza } from '../types/crm';
import { dataService } from '../services/dataService';
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  formatWhatsAppMessage,
  sendWhatsAppMessageAPI,
  buildWhatsAppWebUrl,
  WhatsAppConfig,
  DEFAULT_WHATSAPP_TEMPLATE,
  DEFAULT_OVERDUE_WHATSAPP_TEMPLATE,
  DEFAULT_GENERAL_WHATSAPP_TEMPLATE,
  getRecommendedTemplate
} from '../services/whatsappService';
import {
  FileText,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Plus,
  Search,
  TrendingUp,
  ShieldAlert,
  UserCheck,
  ArrowUpRight,
  Filter,
  FileCheck,
  Edit2,
  Tag,
  Users,
  List,
  Eye,
  ChevronRight,
  X,
  MessageSquare,
  Send,
  Loader2,
  Check,
  Copy,
  Settings,
  AlertCircle,
  CheckSquare,
  Square,
  Radio,
  Zap,
  Sparkles
} from 'lucide-react';

// Helper date formatter without UTC timezone offset shift
const formatDateAR = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

interface ClientPagareGroup {
  cliente_id: string;
  cliente: Cliente | null;
  cuotas: CuotaPagare[];
  totalCuotas: number;
  cuotasCobradas: number;
  cuotasVencidas: number;
  cuotasPendientes: number;
  totalMontoARS: number;
  totalCobradoARS: number;
  totalPendienteARS: number;
  totalMontoUSD: number;
  totalCobradoUSD: number;
  totalPendienteUSD: number;
  proximoVencimiento: string | null;
  tieneMora: boolean;
  monedaPrincipal: 'ARS' | 'USD';
}

export const PagaresManager: React.FC = () => {
  const [prestamos, setPrestamos] = useState<PrestamoPagare[]>([]);
  const [cuotas, setCuotas] = useState<CuotaPagare[]>([]);
  const [reclamos, setReclamos] = useState<ReclamoCobranza[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendario' | 'reclamos' | 'nuevo'>('calendario');

  // Filters & View Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'agrupada' | 'desglosada'>('agrupada');
  const [selectedGroupClientId, setSelectedGroupClientId] = useState<string | null>(null);


  // Edit Pagaré Modal State
  const [selectedCuotaForEdit, setSelectedCuotaForEdit] = useState<CuotaPagare | null>(null);
  const [editForm, setEditForm] = useState({
    fecha_vencimiento: '',
    numero_pagare: '',
    monto_cuota: 0,
    estado: 'Pendiente' as EstadoCuota,
    observaciones: '',
    comprobante_pago: '',
    fecha_pago: '',
    monto_pagado: 0
  });

  // Claim Modal State
  const [selectedCuotaForClaim, setSelectedCuotaForClaim] = useState<CuotaPagare | null>(null);
  const [claimForm, setClaimForm] = useState({
    tipo_gestion: 'Llamada Telefónica' as TipoGestionCobranza,
    resultado_gestion: 'Compromiso de Pago' as ResultadoGestionCobranza,
    fecha_compromiso_pago: '',
    monto_prometido: 0,
    detalle_reclamo: '',
    atendido_por: 'Administración Concesionaria'
  });

  // Payment Modal State
  const [selectedCuotaForPay, setSelectedCuotaForPay] = useState<CuotaPagare | null>(null);
  const [payForm, setPayForm] = useState({
    monto_pagado: 0,
    fecha_pago: new Date().toISOString().split('T')[0],
    comprobante_pago: '',
    observaciones: ''
  });

  // Mass WhatsApp Broadcast States
  const [selectedCuotaIds, setSelectedCuotaIds] = useState<string[]>([]);
  const [isMassWhatsAppOpen, setIsMassWhatsAppOpen] = useState(false);
  const [whatsAppConfig, setWhatsAppConfigState] = useState<WhatsAppConfig>(getWhatsAppConfig());
  const [customTemplate, setCustomTemplate] = useState<string>(whatsAppConfig.defaultTemplate || DEFAULT_WHATSAPP_TEMPLATE);
  const [massSendingStatus, setMassSendingStatus] = useState<'idle' | 'sending' | 'completed'>('idle');
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, successCount: 0, failCount: 0 });
  const [webQueueIndex, setWebQueueIndex] = useState(0);
  const [activeMassTab, setActiveMassTab] = useState<'envio' | 'config'>('envio');

  // Individual WhatsApp Message Modal State
  const [individualWspOpen, setIndividualWspOpen] = useState(false);
  const [cuotaForIndividualWsp, setCuotaForIndividualWsp] = useState<CuotaPagare | null>(null);
  const [individualWspText, setIndividualWspText] = useState('');
  const [individualTemplateType, setIndividualTemplateType] = useState<'vencido' | 'proximo' | 'general'>('proximo');
  const [individualCopied, setIndividualCopied] = useState(false);
  const individualTextareaRef = useRef<HTMLTextAreaElement>(null);

  // New Loan Form State
  const [newLoanForm, setNewLoanForm] = useState({
    cliente_id: '',
    monto_total_prestado: 5000000,
    moneda: 'ARS' as 'USD' | 'ARS',
    cantidad_cuotas: 12,
    tasa_interes_anual: 36,
    fecha_otorgamiento: new Date().toISOString().split('T')[0],
    numero_pagare_inicial: 'PAG-0001',
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prestamosData, cuotasData, reclamosData, clientesData] = await Promise.all([
        dataService.getPrestamosPagares(),
        dataService.getCuotasPagares(),
        dataService.getReclamosCobranza(),
        dataService.getClientes()
      ]);
      setPrestamos(prestamosData);
      setCuotas(cuotasData);
      setReclamos(reclamosData);
      setClientes(clientesData);
    } catch (err) {
      console.error('Error al cargar préstamos y pagarés:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if a cuota is overdue/past-due without relying on manually updated string in DB
  const isCuotaOverdue = (c: CuotaPagare): boolean => {
    if (!c || c.estado === 'Cobrado') return false;
    if (!c.fecha_vencimiento || typeof c.fecha_vencimiento !== 'string') return false;
    const cleanDateStr = String(c.fecha_vencimiento).split('T')[0];
    const dueDate = new Date(cleanDateStr + 'T23:59:59');
    const today = new Date();
    return dueDate < today;
  };

  const getDiasMora = (c: CuotaPagare): number => {
    if (!c || c.estado === 'Cobrado' || !c.fecha_vencimiento) return 0;
    const cleanDateStr = String(c.fecha_vencimiento).split('T')[0];
    const dueDate = new Date(cleanDateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate >= today) return 0;
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const isUpcomingCuota = (c: CuotaPagare): boolean => {
    if (!c || c.estado === 'Cobrado') return false;
    if (isCuotaOverdue(c)) return false;
    if (!c.fecha_vencimiento || typeof c.fecha_vencimiento !== 'string') return false;
    const cleanDateStr = String(c.fecha_vencimiento).split('T')[0];
    const dueDate = new Date(cleanDateStr + 'T23:59:59');
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const sortCuotasByPriority = (cuotasList: CuotaPagare[]): CuotaPagare[] => {
    return [...cuotasList].sort((a, b) => {
      const getPriority = (c: CuotaPagare) => {
        if (c.estado === 'Cobrado') return 4;
        if (isCuotaOverdue(c)) return 1;
        if (isUpcomingCuota(c)) return 2;
        return 3;
      };

      const prioA = getPriority(a);
      const prioB = getPriority(b);

      if (prioA !== prioB) {
        return prioA - prioB;
      }

      const numA = a.numero_cuota || (a as any).nro_cuota || 0;
      const numB = b.numero_cuota || (b as any).nro_cuota || 0;
      return numA - numB;
    });
  };

  // Financial Metrics breakdown
  const totalPrestadoARS = cuotas
    .filter(c => (c.moneda || 'USD') === 'ARS')
    .reduce((sum, c) => sum + (Number(c.monto_cuota) || 0), 0) ||
    prestamos.filter(p => p.moneda === 'ARS').reduce((sum, p) => sum + (Number(p.monto_total_prestado) || 0), 0);

  const totalCobradoARS = cuotas
    .filter(c => (c.moneda || 'USD') === 'ARS' && c.estado === 'Cobrado')
    .reduce((sum, c) => sum + (Number(c.monto_pagado || c.monto_cuota) || 0), 0);

  const totalPendienteARS = Math.max(0, totalPrestadoARS - totalCobradoARS);

  const totalPrestadoUSD = cuotas
    .filter(c => (c.moneda || 'USD') === 'USD')
    .reduce((sum, c) => sum + (Number(c.monto_cuota) || 0), 0) ||
    prestamos.filter(p => p.moneda === 'USD').reduce((sum, p) => sum + (Number(p.monto_total_prestado) || 0), 0);

  const totalCobradoUSD = cuotas
    .filter(c => (c.moneda || 'USD') === 'USD' && c.estado === 'Cobrado')
    .reduce((sum, c) => sum + (Number(c.monto_pagado || c.monto_cuota) || 0), 0);

  const totalPendienteUSD = Math.max(0, totalPrestadoUSD - totalCobradoUSD);

  const cuotasVencidasCount = cuotas.filter(c => isCuotaOverdue(c)).length;
  const morosidadPorcentaje = cuotas.length > 0 ? Math.round((cuotasVencidasCount / cuotas.length) * 100) : 0;

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoanForm.cliente_id || newLoanForm.monto_total_prestado <= 0) {
      alert('Por favor seleccione un cliente y un monto válido.');
      return;
    }

    try {
      await dataService.createPrestamoPagare({
        cliente_id: newLoanForm.cliente_id,
        monto_total_prestado: Number(newLoanForm.monto_total_prestado),
        moneda: newLoanForm.moneda,
        cantidad_cuotas: Number(newLoanForm.cantidad_cuotas),
        tasa_interes_anual: Number(newLoanForm.tasa_interes_anual),
        monto_cuota_promedio: Math.round((newLoanForm.monto_total_prestado * (1 + newLoanForm.tasa_interes_anual / 100)) / newLoanForm.cantidad_cuotas),
        fecha_otorgamiento: newLoanForm.fecha_otorgamiento,
        estado: 'Activo',
        observaciones: newLoanForm.observaciones,
        created_at: new Date().toISOString()
      }, newLoanForm.numero_pagare_inicial);

      alert('¡Crédito con Pagarés generado exitosamente con números de pagaré registrados y fecha de otorgamiento asignada!');
      setActiveTab('calendario');
      await loadData();
    } catch (err) {
      console.error('Error creando préstamo:', err);
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCuotaForPay) return;

    try {
      await dataService.updateCuotaPago(
        selectedCuotaForPay.id,
        payForm.monto_pagado || selectedCuotaForPay.monto_cuota,
        payForm.comprobante_pago,
        payForm.observaciones,
        payForm.fecha_pago
      );
      setSelectedCuotaForPay(null);
      await loadData();
    } catch (err) {
      console.error('Error al registrar pago:', err);
    }
  };

  const handleOpenIndividualWsp = (cuota: CuotaPagare) => {
    setCuotaForIndividualWsp(cuota);
    const isOverdue = isCuotaOverdue(cuota);
    const tType = isOverdue ? 'vencido' : 'proximo';
    setIndividualTemplateType(tType);
    const templateToUse = isOverdue ? DEFAULT_OVERDUE_WHATSAPP_TEMPLATE : DEFAULT_WHATSAPP_TEMPLATE;
    const formatted = formatWhatsAppMessage(templateToUse, cuota, cuota.cliente);
    setIndividualWspText(formatted);
    setIndividualWspOpen(true);
  };

  const handleSelectIndividualTemplate = (type: 'vencido' | 'proximo' | 'general') => {
    if (!cuotaForIndividualWsp) return;
    setIndividualTemplateType(type);
    let tmpl = DEFAULT_WHATSAPP_TEMPLATE;
    if (type === 'vencido') tmpl = DEFAULT_OVERDUE_WHATSAPP_TEMPLATE;
    if (type === 'general') tmpl = DEFAULT_GENERAL_WHATSAPP_TEMPLATE;
    setIndividualWspText(formatWhatsAppMessage(tmpl, cuotaForIndividualWsp, cuotaForIndividualWsp.cliente));
  };

  const insertTagInIndividual = (tag: string) => {
    const textarea = individualTextareaRef.current;
    if (!textarea || !cuotaForIndividualWsp) {
      setIndividualWspText(prev => prev + ' ' + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = individualWspText.substring(0, start);
    const after = individualWspText.substring(end);
    const valToInsert = formatWhatsAppMessage(tag, cuotaForIndividualWsp, cuotaForIndividualWsp.cliente);
    const newText = before + valToInsert + after;
    setIndividualWspText(newText);
    setTimeout(() => {
      textarea.focus();
      const pos = start + valToInsert.length;
      textarea.setSelectionRange(pos, pos);
    }, 50);
  };

  const handleSendIndividualWhatsApp = async () => {
    if (!cuotaForIndividualWsp) return;
    const phone = cuotaForIndividualWsp.cliente?.telefono || '';
    const url = buildWhatsAppWebUrl(phone, individualWspText);
    window.open(url, '_blank');

    const cid = cuotaForIndividualWsp.cliente_id || cuotaForIndividualWsp.prestamo?.cliente_id;
    if (cid && whatsAppConfig.enabledAutoLogging) {
      try {
        await dataService.createReclamoCobranza({
          cuota_id: cuotaForIndividualWsp.id,
          cliente_id: cid,
          fecha_contacto: new Date().toISOString(),
          tipo_gestion: 'Mensaje WhatsApp',
          resultado_gestion: 'Compromiso de Pago',
          detalle_reclamo: `📲 NOTIFICACIÓN WSP: Pagaré ${cuotaForIndividualWsp.numero_pagare || `Nº ${cuotaForIndividualWsp.numero_cuota}`}`,
          atendido_por: 'Administración'
        });
        await loadData();
      } catch (err) {
        console.error('Error guardando reclamo automático:', err);
      }
    }
    setIndividualWspOpen(false);
  };

  const handleCopyIndividualText = () => {
    navigator.clipboard.writeText(individualWspText);
    setIndividualCopied(true);
    setTimeout(() => setIndividualCopied(false), 2000);
  };

  const handleSendWhatsAppReminder = (cuota: CuotaPagare) => {
    handleOpenIndividualWsp(cuota);
  };



  // Toggle selection for mass WhatsApp dispatch
  const toggleSelectCuota = (id: string) => {
    setSelectedCuotaIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllOverdueCuotas = () => {
    const overdueIds = cuotas.filter(c => isCuotaOverdue(c)).map(c => c.id);
    setSelectedCuotaIds(prev => Array.from(new Set([...prev, ...overdueIds])));
  };

  const selectUpcomingCuotas = () => {
    const upcomingIds = cuotas.filter(c => isUpcomingCuota(c)).map(c => c.id);
    setSelectedCuotaIds(prev => Array.from(new Set([...prev, ...upcomingIds])));
  };

  const selectAllOverdueAndUpcoming = () => {
    const targetIds = cuotas.filter(c => isCuotaOverdue(c) || isUpcomingCuota(c)).map(c => c.id);
    setSelectedCuotaIds(targetIds);
  };

  const clearCuotaSelection = () => {
    setSelectedCuotaIds([]);
  };

  // Caret / Cursor-based tag insertion for dynamic WhatsApp message editor
  const templateTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertTagAtCursor = (tag: string) => {
    const textarea = templateTextareaRef.current;
    if (!textarea) {
      setCustomTemplate(prev => prev + ' ' + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = customTemplate;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + tag + after;
    setCustomTemplate(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + tag.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSaveWhatsAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveWhatsAppConfig(whatsAppConfig);
    alert('¡Configuración de Gateway WhatsApp guardada exitosamente!');
  };

  const selectedCuotasObjects = cuotas.filter(c => selectedCuotaIds.includes(c.id));

  const handleExecuteMassApiDispatch = async () => {
    if (selectedCuotasObjects.length === 0) return;
    setMassSendingStatus('sending');
    setSendProgress({ current: 0, total: selectedCuotasObjects.length, successCount: 0, failCount: 0 });

    let success = 0;
    let fail = 0;

    for (let i = 0; i < selectedCuotasObjects.length; i++) {
      const c = selectedCuotasObjects[i];
      const message = formatWhatsAppMessage(customTemplate, c, c.cliente);
      const phone = c.cliente?.telefono || '';

      const res = await sendWhatsAppMessageAPI(phone, message, whatsAppConfig);

      if (res.success) {
        success++;
        // Auto-log interaction for client
        const cid = c.cliente_id || c.prestamo?.cliente_id;
        if (cid && whatsAppConfig.enabledAutoLogging) {
          try {
            await dataService.createReclamoCobranza({
              cuota_id: c.id,
              cliente_id: cid,
              fecha_contacto: new Date().toISOString(),
              tipo_gestion: 'Mensaje WhatsApp',
              resultado_gestion: 'Compromiso de Pago',
              detalle_reclamo: `📲 ENVÍO MASIVO WHATSAPP: Recordatorio enviado para Pagaré ${c.numero_pagare || `Nº ${c.numero_cuota}`}`,
              atendido_por: 'Bot Automatizado CRM'
            });
          } catch (err) {
            console.error('Error guardando interacción masiva:', err);
          }
        }
      } else {
        fail++;
      }

      setSendProgress({
        current: i + 1,
        total: selectedCuotasObjects.length,
        successCount: success,
        failCount: fail
      });
    }

    setMassSendingStatus('completed');
    await loadData();
  };

  const handleSaveEditPagareDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCuotaForEdit || !editForm.fecha_vencimiento) {
      alert('Ingrese una fecha de vencimiento válida');
      return;
    }

    let finalEstado = editForm.estado;
    if (finalEstado !== 'Cobrado') {
      const cleanDateStr = String(editForm.fecha_vencimiento).split('T')[0];
      const dueDate = new Date(cleanDateStr + 'T23:59:59');
      const today = new Date();
      if (dueDate >= today && finalEstado === 'Vencido') {
        finalEstado = 'Pendiente';
      }
    }

    try {
      await dataService.updateCuotaDetails(selectedCuotaForEdit.id, {
        fecha_vencimiento: editForm.fecha_vencimiento,
        numero_pagare: editForm.numero_pagare,
        monto_cuota: Number(editForm.monto_cuota),
        estado: finalEstado,
        observaciones: editForm.observaciones,
        comprobante_pago: editForm.comprobante_pago,
        fecha_pago: editForm.fecha_pago || (finalEstado === 'Cobrado' ? new Date().toISOString() : undefined),
        monto_pagado: editForm.monto_pagado ? Number(editForm.monto_pagado) : Number(editForm.monto_cuota)
      });
      setSelectedCuotaForEdit(null);
      await loadData();
    } catch (err) {
      console.error('Error actualizando detalles del pagaré:', err);
    }
  };

  const openEditModalForCuota = (c: CuotaPagare) => {
    setSelectedCuotaForEdit(c);
    setEditForm({
      fecha_vencimiento: c.fecha_vencimiento ? String(c.fecha_vencimiento).split('T')[0] : '',
      numero_pagare: c.numero_pagare || `PAG-${String(c.numero_cuota).padStart(4, '0')}`,
      monto_cuota: c.monto_cuota || 0,
      estado: c.estado || 'Pendiente',
      observaciones: c.observaciones || '',
      comprobante_pago: c.comprobante_pago || '',
      fecha_pago: c.fecha_pago ? String(c.fecha_pago).split('T')[0] : '',
      monto_pagado: c.monto_pagado || c.monto_cuota || 0
    });
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCuotaForClaim || !claimForm.detalle_reclamo) {
      alert('Por favor ingrese el detalle del reclamo/atención.');
      return;
    }

    try {
      await dataService.createReclamoCobranza({
        cuota_id: selectedCuotaForClaim.id,
        cliente_id: selectedCuotaForClaim.cliente_id || selectedCuotaForClaim.prestamo?.cliente_id || '',
        fecha_contacto: new Date().toISOString(),
        tipo_gestion: claimForm.tipo_gestion,
        resultado_gestion: claimForm.resultado_gestion,
        fecha_compromiso_pago: claimForm.fecha_compromiso_pago || undefined,
        monto_prometido: claimForm.monto_prometido ? Number(claimForm.monto_prometido) : undefined,
        detalle_reclamo: claimForm.detalle_reclamo,
        atendido_por: claimForm.atendido_por
      });

      setSelectedCuotaForClaim(null);
      setClaimForm({
        tipo_gestion: 'Llamada Telefónica',
        resultado_gestion: 'Compromiso de Pago',
        fecha_compromiso_pago: '',
        monto_prometido: 0,
        detalle_reclamo: '',
        atendido_por: 'Administración Concesionaria'
      });
      await loadData();
    } catch (err) {
      console.error('Error registrando reclamo:', err);
    }
  };

  // Helper for Semaphore badge
  const getCuotaSemaphoreBadge = (cuota: CuotaPagare) => {
    if (cuota.estado === 'Cobrado') {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Cobrado
          </span>
          {cuota.fecha_pago && (
            <div className="text-[10px] text-slate-300 font-mono">
              📅 Pago: {formatDateAR(cuota.fecha_pago)}
            </div>
          )}
          {cuota.comprobante_pago && (
            <div className="text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold truncate max-w-[170px]" title={cuota.comprobante_pago}>
              💳 {cuota.comprobante_pago}
            </div>
          )}
        </div>
      );
    }
    if (isCuotaOverdue(cuota)) {
      const mora = getDiasMora(cuota);
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          ⚠️ Vencido {mora > 0 ? `(+${mora} ${mora === 1 ? 'día' : 'días'} de mora)` : 'en Mora'}
        </span>
      );
    }
    // Check if due within next 7 days without timezone bug
    if (!cuota.fecha_vencimiento || typeof cuota.fecha_vencimiento !== 'string') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <Calendar className="w-3.5 h-3.5" /> Pendiente
        </span>
      );
    }
    const cleanDateStr = String(cuota.fecha_vencimiento).split('T')[0];

    const dueDate = new Date(cleanDateStr + 'T23:59:59');
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays >= 0 && diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5" /> Vence en {diffDays} días
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        <Calendar className="w-3.5 h-3.5" /> Pendiente
      </span>
    );
  };

  // Group cuotas by client portfolio for clean UI
  const clientGroups: ClientPagareGroup[] = React.useMemo(() => {
    const map = new Map<string, CuotaPagare[]>();
    cuotas.forEach(c => {
      const cid = c.cliente_id || c.prestamo?.cliente_id || 'desconocido';
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push(c);
    });

    const groups: ClientPagareGroup[] = [];
    map.forEach((cList, cid) => {
      const sortedCuotas = sortCuotasByPriority(cList);
      const clientObj = cList[0]?.cliente || clientes.find(cli => cli.id === cid) || null;
      const totalCuotas = cList.length;
      const cuotasCobradas = cList.filter(c => c.estado === 'Cobrado').length;
      const cuotasVencidas = cList.filter(c => isCuotaOverdue(c)).length;
      const cuotasPendientes = totalCuotas - cuotasCobradas;

      let totalMontoARS = 0, totalCobradoARS = 0, totalPendienteARS = 0;
      let totalMontoUSD = 0, totalCobradoUSD = 0, totalPendienteUSD = 0;

      cList.forEach(c => {
        const mon = c.moneda || 'ARS';
        const mCuota = c.monto_cuota || 0;
        const mPagado = c.monto_pagado || mCuota;

        if (mon === 'ARS') {
          totalMontoARS += mCuota;
          if (c.estado === 'Cobrado') totalCobradoARS += mPagado;
          else totalPendienteARS += mCuota;
        } else {
          totalMontoUSD += mCuota;
          if (c.estado === 'Cobrado') totalCobradoUSD += mPagado;
          else totalPendienteUSD += mCuota;
        }
      });

      const pendingCuotas = cList.filter(c => c.estado !== 'Cobrado');
      let proximoVencimiento: string | null = null;
      if (pendingCuotas.length > 0) {
        pendingCuotas.sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());
        proximoVencimiento = pendingCuotas[0].fecha_vencimiento;
      }

      groups.push({
        cliente_id: cid,
        cliente: clientObj,
        cuotas: sortedCuotas,
        totalCuotas,
        cuotasCobradas,
        cuotasVencidas,
        cuotasPendientes,
        totalMontoARS,
        totalCobradoARS,
        totalPendienteARS,
        totalMontoUSD,
        totalCobradoUSD,
        totalPendienteUSD,
        proximoVencimiento,
        tieneMora: cuotasVencidas > 0,
        monedaPrincipal: totalMontoUSD > 0 ? 'USD' : 'ARS'
      });
    });

    // Sort: Clients with overdue Pagarés at top
    groups.sort((a, b) => {
      if (a.tieneMora && !b.tieneMora) return -1;
      if (!a.tieneMora && b.tieneMora) return 1;
      return 0;
    });

    return groups;
  }, [cuotas, clientes]);

  // Derive selectedGroupForModal dynamically from clientGroups to avoid re-render loops
  const selectedGroupForModal = React.useMemo(() => {
    if (!selectedGroupClientId) return null;
    return clientGroups.find(g => g.cliente_id === selectedGroupClientId) || null;
  }, [clientGroups, selectedGroupClientId]);

  // Smart opener for client's Ficha: prioritizes overdue cuotas
  const handleOpenClientFicha = (clienteId: string) => {
    setSelectedGroupClientId(clienteId);
    const grp = clientGroups.find(g => g.cliente_id === clienteId);
    if (grp) {
      const clientCuotaIds = grp.cuotas.map(c => c.id);
      const hasAnySelected = selectedCuotaIds.some(id => clientCuotaIds.includes(id));
      if (!hasAnySelected) {
        const overdue = grp.cuotas.filter(c => isCuotaOverdue(c)).map(c => c.id);
        if (overdue.length > 0) {
          setSelectedCuotaIds(prev => Array.from(new Set([...prev.filter(id => !clientCuotaIds.includes(id)), ...overdue])));
        } else {
          const upcoming = grp.cuotas.filter(c => isUpcomingCuota(c)).map(c => c.id);
          if (upcoming.length > 0) {
            setSelectedCuotaIds(prev => Array.from(new Set([...prev.filter(id => !clientCuotaIds.includes(id)), ...upcoming])));
          }
        }
      }
    }
  };


  const filteredClientGroups = React.useMemo(() => {
    return clientGroups.filter(g => {
      const name = g.cliente ? `${g.cliente.nombre} ${g.cliente.apellido || ''}`.toLowerCase() : '';
      const dni = g.cliente?.numero_documento ? g.cliente.numero_documento.toLowerCase() : '';
      const matchQuery = name.includes(searchTerm.toLowerCase()) || dni.includes(searchTerm.toLowerCase());

      if (statusFilter === 'Todos') return matchQuery;
      if (statusFilter === 'Vencidos') return matchQuery && g.tieneMora;
      if (statusFilter === 'Cobrados') return matchQuery && g.cuotasCobradas === g.totalCuotas;
      if (statusFilter === 'Pendientes') return matchQuery && g.cuotasPendientes > 0;
      return matchQuery;
    });
  }, [clientGroups, searchTerm, statusFilter]);

  const filteredCuotas = cuotas.filter(item => {
    const clienteName = item.cliente ? `${item.cliente.nombre} ${item.cliente.apellido || ''}`.toLowerCase() : '';
    const numeroPagare = item.numero_pagare ? item.numero_pagare.toLowerCase() : '';
    const matchQuery = clienteName.includes(searchTerm.toLowerCase()) || numeroPagare.includes(searchTerm.toLowerCase());

    if (statusFilter === 'Todos') return matchQuery;
    if (statusFilter === 'Vencidos') return matchQuery && isCuotaOverdue(item);
    if (statusFilter === 'Cobrados') return matchQuery && item.estado === 'Cobrado';
    if (statusFilter === 'Pendientes') return matchQuery && item.estado !== 'Cobrado' && !isCuotaOverdue(item);
    return matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <FileText className="w-64 h-64 text-emerald-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-bold border border-emerald-500/30 tracking-wide uppercase">
                Financiación Propia & Registro de Pagarés (Argentina)
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              📜 Gestión de Préstamos, Pagarés & Cobranzas
            </h1>
            <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">
              Asignación y edición de números de pagaré físico por cuota, fechas de vencimiento, montos, semáforo de morosidad y vinculación directa a la ficha de cada cliente.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('nuevo')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Registrar Nuevo Crédito
          </button>
        </div>

        {/* Dashboard Financial Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
          <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block font-medium">Total Prestado (ARS)</span>
            <span className="text-xl font-black text-emerald-400">
              ARS $ {totalPrestadoARS.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block font-medium">Total Prestado (USD)</span>
            <span className="text-xl font-black text-blue-400">
              USD $ {totalPrestadoUSD.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block font-medium">Saldo Pendiente ARS</span>
            <span className="text-xl font-black text-amber-400">
              ARS $ {totalPendienteARS.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block font-medium">Saldo Pendiente USD</span>
            <span className="text-xl font-black text-cyan-400">
              USD $ {totalPendienteUSD.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="bg-slate-950/60 backdrop-blur border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block font-medium">Morosidad (% Vencidos)</span>
            <span className={`text-xl font-black ${morosidadPorcentaje > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
              {morosidadPorcentaje}% ({cuotasVencidasCount} cuotas)
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('calendario')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'calendario'
            ? 'border-emerald-500 text-emerald-400'
            : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <Calendar className="w-4 h-4" /> Cronograma de Pagarés ({cuotas.length})
        </button>
        <button
          onClick={() => setActiveTab('reclamos')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'reclamos'
            ? 'border-emerald-500 text-emerald-400'
            : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <PhoneCall className="w-4 h-4" /> Historial de Reclamos & Cobranza ({reclamos.length})
        </button>
        <button
          onClick={() => setActiveTab('nuevo')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'nuevo'
            ? 'border-emerald-500 text-emerald-400'
            : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <Plus className="w-4 h-4" /> Nuevo crédito
        </button>
      </div>

      {/* TAB 1: CALENDARIO DE PAGARÉS */}
      {activeTab === 'calendario' && (
        <div className="space-y-4">
          {/* Quick Selection & Mass WhatsApp Broadcast Bar */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/60 border border-emerald-500/30 p-4 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mr-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" /> Atajos de Selección Rápida:
              </span>
              <button
                type="button"
                onClick={selectAllOverdueCuotas}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/50 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Haz clic para seleccionar automáticamente todas las cuotas vencidas e impagas"
              >
                🔴 Marcar Vencidos ({cuotas.filter(c => isCuotaOverdue(c)).length})
              </button>
              <button
                type="button"
                onClick={selectUpcomingCuotas}
                className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/50 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Haz clic para seleccionar cuotas que vencen en los próximos 7 días"
              >
                🟡 Próximos (&lt;= 7 días) ({cuotas.filter(c => isUpcomingCuota(c)).length})
              </button>
              <button
                type="button"
                onClick={selectAllOverdueAndUpcoming}
                className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/50 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Seleccionar Vencidos + Próximos a Vencer"
              >
                ⚡ Vencidos + Próximos
              </button>
              {selectedCuotaIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearCuotaSelection}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  ✖️ Desmarcar Todo ({selectedCuotaIds.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                ☑️ {selectedCuotaIds.length} Pagaré(s) Marcado(s)
              </span>

              <button
                type="button"
                disabled={selectedCuotaIds.length === 0}
                onClick={() => setIsMassWhatsAppOpen(true)}
                className={`flex items-center gap-2 text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer ${selectedCuotaIds.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25 animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'
                  }`}
              >
                <Send className="w-4 h-4" /> Enviar Recordatorios por WhatsApp ({selectedCuotaIds.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMassWhatsAppOpen(true);
                  setActiveMassTab('config');
                }}
                title="Configurar Gateway WhatsApp API"
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search, Status & View Mode Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente, DNI o Nº Pagaré..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/70 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Switcher Toggle */}
              <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 mr-2">
                <button
                  type="button"
                  onClick={() => setViewMode('agrupada')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'agrupada'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                  title="Vista Ordenada 1 Fila por Cliente"
                >
                  <Users className="w-3.5 h-3.5" /> Vista Agrupada por Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('desglosada')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'desglosada'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                  title="Vista Desglosada (Todas las Cuotas)"
                >
                  <List className="w-3.5 h-3.5" /> Lista Desglosada
                </button>
              </div>

              <div className="flex items-center gap-1">
                <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
                {['Todos', 'Vencidos', 'Pendientes', 'Cobrados'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${statusFilter === st
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VISTA 1: AGRUPADA POR CLIENTE (DEFAULT) */}
          {viewMode === 'agrupada' ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>💡 <strong>Tip UX:</strong> Hacé <strong>Doble Clic</strong> en la fila de un cliente o hacé clic en <strong className="text-emerald-400">Ver Pagarés 👁️</strong> para desglozar todo su plan de pagos y recibos.</span>
                <span className="font-mono text-emerald-400 font-bold shrink-0">{filteredClientGroups.length} cartera(s) activa(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Cliente / Cartera</th>
                      <th className="py-3.5 px-4">Progreso Plan Pagarés</th>
                      <th className="py-3.5 px-4">Moneda & Saldo Pendiente</th>
                      <th className="py-3.5 px-4">Próximo Vencimiento</th>
                      <th className="py-3.5 px-4">Alerta / Semáforo</th>
                      <th className="py-3.5 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">Cargando carteras de clientes...</td>
                      </tr>
                    ) : filteredClientGroups.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">No hay clientes financiados que coincidan con la búsqueda.</td>
                      </tr>
                    ) : (
                      filteredClientGroups.map((g) => {
                        const porcentajeCobrado = Math.round((g.cuotasCobradas / g.totalCuotas) * 100);
                        return (
                          <tr
                            key={g.cliente_id}
                            onDoubleClick={() => handleOpenClientFicha(g.cliente_id)}
                            title="Doble clic para ver todo el listado de pagarés de este cliente"
                            className={`hover:bg-slate-800/80 transition-colors cursor-pointer select-none ${g.tieneMora ? 'bg-red-950/20' : ''
                              }`}
                          >
                            <td className="py-4 px-4">
                              <div className="font-extrabold text-white text-base flex items-center gap-2">
                                <span>{g.cliente ? `${g.cliente.nombre} ${g.cliente.apellido || ''}` : 'Cliente Sin Nombre'}</span>
                                {g.cliente?.numero_documento && (
                                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-normal">
                                    DNI: {g.cliente.numero_documento}
                                  </span>
                                )}
                              </div>
                              {g.cliente?.telefono && (
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                  <PhoneCall className="w-3 h-3 text-indigo-400" /> {g.cliente.telefono}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-bold text-slate-200">
                                  {g.cuotasCobradas} de {g.totalCuotas} Pagarés Cancelados
                                </span>
                                <span className="font-mono font-extrabold text-emerald-400">{porcentajeCobrado}%</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full transition-all rounded-full ${porcentajeCobrado === 100
                                    ? 'bg-emerald-500'
                                    : g.tieneMora
                                      ? 'bg-gradient-to-r from-red-500 to-amber-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                    }`}
                                  style={{ width: `${porcentajeCobrado}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {g.totalMontoARS > 0 && (
                                <div>
                                  <div className="text-xs font-bold text-emerald-400">
                                    ARS $ {g.totalPendienteARS.toLocaleString('es-AR')} pend.
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Total: ARS $ {g.totalMontoARS.toLocaleString('es-AR')}
                                  </div>
                                </div>
                              )}
                              {g.totalMontoUSD > 0 && (
                                <div className="mt-1">
                                  <div className="text-xs font-bold text-blue-400">
                                    USD $ {g.totalPendienteUSD.toLocaleString('es-AR')} pend.
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Total: USD $ {g.totalMontoUSD.toLocaleString('es-AR')}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4 font-mono text-xs">
                              {g.proximoVencimiento ? (
                                <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 inline-block font-semibold text-slate-200">
                                  📅 {formatDateAR(g.proximoVencimiento)}
                                </div>
                              ) : (
                                <span className="text-emerald-400 font-bold">¡Crédito Completado!</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {g.tieneMora ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                                  <AlertTriangle className="w-4 h-4 text-red-400" />
                                  🔴 {g.cuotasVencidas} Pagaré(s) Vencido(s) en Mora
                                </span>
                              ) : g.cuotasCobradas === g.totalCuotas ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Al Día / Al 100%
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                  <Clock className="w-3.5 h-3.5 text-amber-400" /> 🟡 Cuotas al Día ({g.cuotasPendientes} pend)
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenClientFicha(g.cliente_id);
                                }}
                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                              >
                                <Eye className="w-4 h-4" /> Ver Pagarés ({g.totalCuotas}) <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VISTA 2: LISTA DESGLOSADA (TODAS LAS CUOTAS) */
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          checked={filteredCuotas.length > 0 && filteredCuotas.every(c => selectedCuotaIds.includes(c.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCuotaIds(prev => Array.from(new Set([...prev, ...filteredCuotas.map(c => c.id)])));
                            } else {
                              setSelectedCuotaIds(prev => prev.filter(id => !filteredCuotas.some(c => c.id === id)));
                            }
                          }}
                        />
                      </th>
                      <th className="py-3.5 px-4">Cliente Solicitante</th>
                      <th className="py-3.5 px-4">Nº Pagaré Físico & Cuota</th>
                      <th className="py-3.5 px-4">Fecha Otorgamiento</th>
                      <th className="py-3.5 px-4">Fecha Vencimiento</th>
                      <th className="py-3.5 px-4">Monto Cuota & Moneda</th>
                      <th className="py-3.5 px-4">Semáforo / Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">Cargando cronograma...</td>
                      </tr>
                    ) : filteredCuotas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">No hay pagarés que coincidan con la búsqueda.</td>
                      </tr>
                    ) : (
                      filteredCuotas.map((c) => (
                        <tr key={c.id} className={`hover:bg-slate-800/50 transition-colors ${selectedCuotaIds.includes(c.id) ? 'bg-emerald-950/30' : ''}`}>
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              className="accent-emerald-500 w-4 h-4 cursor-pointer"
                              checked={selectedCuotaIds.includes(c.id)}
                              onChange={() => toggleSelectCuota(c.id)}
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">
                              {c.cliente ? `${c.cliente.nombre} ${c.cliente.apellido || ''}` : 'Cliente Desconocido'}
                            </div>
                            {c.cliente?.telefono && (
                              <div className="text-xs text-slate-400">{c.cliente.telefono}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-indigo-400 flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                                <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                {c.numero_pagare || `PAG-${String(c.numero_cuota).padStart(4, '0')}`}
                              </span>
                              <button
                                onClick={() => openEditModalForCuota(c)}
                                title="Editar Número de Pagaré"
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">Cuota {c.numero_cuota} de {c.prestamo?.cantidad_cuotas || 12}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {formatDateAR(c.prestamo?.fecha_otorgamiento)}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                {formatDateAR(c.fecha_vencimiento)}
                              </span>
                              <button
                                onClick={() => openEditModalForCuota(c)}
                                title="Editar Fecha de Vencimiento"
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-amber-400 hover:text-amber-300 border border-amber-500/30 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-400">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-bold">
                                {c.moneda === 'ARS' ? 'ARS ($)' : 'USD ($)'}
                              </span>
                              <span>{c.monto_cuota?.toLocaleString('es-AR')}</span>
                              <button
                                onClick={() => openEditModalForCuota(c)}
                                title="Editar Monto de la Cuota"
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {c.prestamo?.monto_total_prestado && c.prestamo?.cantidad_cuotas && (
                              <div className="text-[10px] text-slate-400 space-x-1.5 font-normal mt-1">
                                <span>Pura: <strong className="text-cyan-300 font-mono">${Math.round(c.prestamo.monto_total_prestado / c.prestamo.cantidad_cuotas).toLocaleString('es-AR')}</strong></span>
                                <span>Int: <strong className="text-indigo-300 font-mono">${Math.max(0, c.monto_cuota - Math.round(c.prestamo.monto_total_prestado / c.prestamo.cantidad_cuotas)).toLocaleString('es-AR')}</strong></span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {getCuotaSemaphoreBadge(c)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModalForCuota(c)}
                                className="bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Editar Pagaré Completo"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Editar
                              </button>

                              {c.estado !== 'Cobrado' && (
                                <>
                                  <button
                                    onClick={() => handleSendWhatsAppReminder(c)}
                                    className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    title="Enviar Recordatorio por WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WSP
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedCuotaForPay(c);
                                      setPayForm({
                                        monto_pagado: c.monto_cuota,
                                        fecha_pago: new Date().toISOString().split('T')[0],
                                        comprobante_pago: '',
                                        observaciones: ''
                                      });
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" /> Cobrar
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedCuotaForClaim(c);
                                  setClaimForm({
                                    tipo_gestion: 'Llamada Telefónica',
                                    resultado_gestion: 'Compromiso de Pago',
                                    fecha_compromiso_pago: '',
                                    monto_prometido: c.monto_cuota,
                                    detalle_reclamo: '',
                                    atendido_por: 'Administración'
                                  });
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-indigo-400" /> Reclamo
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORIAL DE RECLAMOS */}
      {activeTab === 'reclamos' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-indigo-400" /> Bitácora de Llamadas & Gestiones de Cobranza
            </h3>
            {reclamos.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No hay reclamos o gestiones registradas aún.</div>
            ) : (
              <div className="space-y-3">
                {reclamos.map((r) => (
                  <div key={r.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                          {r.tipo_gestion}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                          {r.resultado_gestion}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(r.fecha_contacto).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        Cliente: {r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido || ''}` : 'Cliente ID: ' + r.cliente_id}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">"{r.detalle_reclamo}"</p>
                      {r.fecha_compromiso_pago && (
                        <div className="text-xs font-semibold text-amber-300 mt-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Compromiso de Pago para: {formatDateAR(r.fecha_compromiso_pago)} (${r.monto_prometido?.toLocaleString('es-AR')})
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
                      <span className="text-[11px] text-slate-500 block">Atendido por:</span>
                      <span className="text-xs font-semibold text-slate-300">{r.atendido_por}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: NUEVO CRÉDITO */}
      {activeTab === 'nuevo' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" /> Registrar Nuevo Crédito con Pagarés
          </h3>
          <form onSubmit={handleCreateLoan} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cliente Solicitante *</label>
              <select
                required
                value={newLoanForm.cliente_id}
                onChange={(e) => setNewLoanForm({ ...newLoanForm, cliente_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellido || ''} ({c.telefono})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monto Total *</label>
                <input
                  type="number"
                  required
                  value={newLoanForm.monto_total_prestado}
                  onChange={(e) => setNewLoanForm({ ...newLoanForm, monto_total_prestado: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Moneda</label>
                <select
                  value={newLoanForm.moneda}
                  onChange={(e) => setNewLoanForm({ ...newLoanForm, moneda: e.target.value as 'USD' | 'ARS' })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="ARS">ARS ($)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fecha Otorgamiento</label>
                <input
                  type="date"
                  required
                  value={newLoanForm.fecha_otorgamiento}
                  onChange={(e) => setNewLoanForm({ ...newLoanForm, fecha_otorgamiento: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cantidad de Pagarés (Cuotas)</label>
                <input
                  type="number"
                  value={newLoanForm.cantidad_cuotas}
                  onChange={(e) => setNewLoanForm({ ...newLoanForm, cantidad_cuotas: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tasa Interés Anual (%)</label>
                <input
                  type="number"
                  value={newLoanForm.tasa_interes_anual}
                  onChange={(e) => setNewLoanForm({ ...newLoanForm, tasa_interes_anual: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Prefijo / Nº Pagaré Inicial</label>
                <input
                  type="text"
                  placeholder="Ej: PAG-0001, 001-0001"
                  value={newLoanForm.numero_pagare_inicial}
                  onChange={(e) => setNewLoanForm({ ...newLoanForm, numero_pagare_inicial: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Observaciones & Garantías</label>
              <textarea
                rows={2}
                value={newLoanForm.observaciones}
                onChange={(e) => setNewLoanForm({ ...newLoanForm, observaciones: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg"
              >
                Generar Plan de Pagarés Numerados
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EDITAR COMPLETO DE PAGARÉ */}
      {selectedCuotaForEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-amber-400" /> Editar Pagaré Físico (Cuota {selectedCuotaForEdit.numero_cuota})
            </h3>
            <form onSubmit={handleSaveEditPagareDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nº Pagaré Físico (Registro Argentina)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: PAG-0003, 001-998822"
                  value={editForm.numero_pagare}
                  onChange={(e) => setEditForm({ ...editForm, numero_pagare: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Monto del Pagaré</label>
                <input
                  type="number"
                  required
                  value={editForm.monto_cuota}
                  onChange={(e) => setEditForm({ ...editForm, monto_cuota: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  required
                  value={editForm.fecha_vencimiento}
                  onChange={(e) => setEditForm({ ...editForm, fecha_vencimiento: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estado / Semáforo del Pagaré</label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value as EstadoCuota })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold"
                >
                  <option value="Pendiente">Pendiente (A vencer)</option>
                  <option value="Vencido">Vencido en Mora (Semáforo Rojo)</option>
                  <option value="Cobrado">Cobrado (Semáforo Verde)</option>
                </select>
              </div>

              {editForm.estado === 'Cobrado' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-3">
                  <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    💳 Datos del Recibo / Forma de Pago
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Pago / Comprobante</label>
                    <input
                      type="text"
                      placeholder="Ej: Transferencia Banco Galicia, Efectivo REC-9942"
                      value={editForm.comprobante_pago}
                      onChange={(e) => setEditForm({ ...editForm, comprobante_pago: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Pago</label>
                      <input
                        type="date"
                        value={editForm.fecha_pago}
                        onChange={(e) => setEditForm({ ...editForm, fecha_pago: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Monto Pagado</label>
                      <input
                        type="number"
                        value={editForm.monto_pagado}
                        onChange={(e) => setEditForm({ ...editForm, monto_pagado: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observaciones / Anotaciones</label>
                <textarea
                  rows={2}
                  placeholder="Anotaciones de vencimiento o acuerdo verbal..."
                  value={editForm.observaciones}
                  onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCuotaForEdit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Cambios en Pagaré
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO */}
      {selectedCuotaForPay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Registrar Cobro de Pagaré {selectedCuotaForPay.numero_pagare || `Nº ${selectedCuotaForPay.numero_cuota}`}
            </h3>
            <form onSubmit={handleRegisterPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monto Pagado ({selectedCuotaForPay.moneda === 'ARS' ? 'ARS $' : 'USD $'}) *</label>
                  <input
                    type="number"
                    required
                    value={payForm.monto_pagado}
                    onChange={(e) => setPayForm({ ...payForm, monto_pagado: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Pago *</label>
                  <input
                    type="date"
                    required
                    value={payForm.fecha_pago}
                    onChange={(e) => setPayForm({ ...payForm, fecha_pago: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">N.º Comprobante / Recibo / Forma de Pago *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: REC-00124 / Transf. Banco Galicia"
                  value={payForm.comprobante_pago}
                  onChange={(e) => setPayForm({ ...payForm, comprobante_pago: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={payForm.observaciones}
                  onChange={(e) => setPayForm({ ...payForm, observaciones: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCuotaForPay(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR RECLAMO */}
      {selectedCuotaForClaim && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-indigo-400" /> Registrar Reclamo (Pagaré {selectedCuotaForClaim.numero_pagare || `Nº ${selectedCuotaForClaim.numero_cuota}`})
            </h3>
            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vía de Gestión</label>
                  <select
                    value={claimForm.tipo_gestion}
                    onChange={(e) => setClaimForm({ ...claimForm, tipo_gestion: e.target.value as TipoGestionCobranza })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="Llamada Telefónica">Llamada Telefónica</option>
                    <option value="Mensaje WhatsApp">Mensaje WhatsApp</option>
                    <option value="Carta Documento">Carta Documento</option>
                    <option value="Visita Domiciliaria">Visita Domiciliaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Resultado</label>
                  <select
                    value={claimForm.resultado_gestion}
                    onChange={(e) => setClaimForm({ ...claimForm, resultado_gestion: e.target.value as ResultadoGestionCobranza })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="Compromiso de Pago">Compromiso de Pago</option>
                    <option value="No Contesta">No Contesta</option>
                    <option value="Promesa de Pago Incumplida">Promesa Incumplida</option>
                    <option value="Solicita Refinanciación">Solicita Refinanciación</option>
                    <option value="Derivado a Abogado">Derivado a Abogado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha Compromiso de Pago (Opcional)</label>
                <input
                  type="date"
                  value={claimForm.fecha_compromiso_pago}
                  onChange={(e) => setClaimForm({ ...claimForm, fecha_compromiso_pago: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detalle / Comentarios *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detalle de la conversación, motivo de demora, etc."
                  value={claimForm.detalle_reclamo}
                  onChange={(e) => setClaimForm({ ...claimForm, detalle_reclamo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCuotaForClaim(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Reclamo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL DETALLE DE PAGARÉS POR CLIENTE */}
      {selectedGroupForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded border border-emerald-500/30 uppercase">
                    Ficha Financiera de Pagarés por Cliente
                  </span>
                  {selectedGroupForModal.tieneMora && (
                    <span className="text-xs bg-red-500/20 text-red-300 font-bold px-2.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                      🔴 Alerta: Posee Mora Pendiente
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  👤 {selectedGroupForModal.cliente ? `${selectedGroupForModal.cliente.nombre} ${selectedGroupForModal.cliente.apellido || ''}` : 'Cliente'}
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-4 mt-1">
                  {selectedGroupForModal.cliente?.numero_documento && <span>🆔 Doc: {selectedGroupForModal.cliente.numero_documento}</span>}
                  {selectedGroupForModal.cliente?.telefono && <span>📞 Teléfono: {selectedGroupForModal.cliente.telefono}</span>}
                </div>
              </div>
              <button
                onClick={() => setSelectedGroupClientId(null)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Client KPI Summary Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Plan Total</span>
                <span className="text-lg font-bold text-white">
                  {selectedGroupForModal.totalCuotas} Pagarés
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Cancelados / Total</span>
                <span className="text-lg font-bold text-emerald-400">
                  {selectedGroupForModal.cuotasCobradas} de {selectedGroupForModal.totalCuotas} ({Math.round((selectedGroupForModal.cuotasCobradas / selectedGroupForModal.totalCuotas) * 100)}%)
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Saldo Pendiente</span>
                {selectedGroupForModal.totalPendienteARS > 0 && (
                  <span className="text-base font-bold text-amber-400 block">
                    ARS $ {selectedGroupForModal.totalPendienteARS.toLocaleString('es-AR')}
                  </span>
                )}
                {selectedGroupForModal.totalPendienteUSD > 0 && (
                  <span className="text-base font-bold text-cyan-400 block">
                    USD $ {selectedGroupForModal.totalPendienteUSD.toLocaleString('es-AR')}
                  </span>
                )}
                {selectedGroupForModal.totalPendienteARS === 0 && selectedGroupForModal.totalPendienteUSD === 0 && (
                  <span className="text-base font-bold text-emerald-400 block">$ 0 (Sin Deuda)</span>
                )}
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Pagarés Vencidos</span>
                <span className={`text-lg font-bold ${selectedGroupForModal.cuotasVencidas > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedGroupForModal.cuotasVencidas} cuota(s)
                </span>
              </div>
            </div>

            {/* Quick Selection Toolbar for this client */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Atajos para este Cliente:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const vIds = selectedGroupForModal.cuotas.filter(c => isCuotaOverdue(c)).map(c => c.id);
                    const clientIds = selectedGroupForModal.cuotas.map(c => c.id);
                    setSelectedCuotaIds(prev => Array.from(new Set([...prev.filter(id => !clientIds.includes(id)), ...vIds])));
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/40 font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Marcar sólo los pagarés vencidos de este cliente"
                >
                  🔴 Marcar Vencidos ({selectedGroupForModal.cuotas.filter(c => isCuotaOverdue(c)).length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const uIds = selectedGroupForModal.cuotas.filter(c => isUpcomingCuota(c)).map(c => c.id);
                    const clientIds = selectedGroupForModal.cuotas.map(c => c.id);
                    setSelectedCuotaIds(prev => Array.from(new Set([...prev.filter(id => !clientIds.includes(id)), ...uIds])));
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/40 font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Marcar sólo los pagarés próximos a vencer"
                >
                  🟡 Marcar Próximos ({selectedGroupForModal.cuotas.filter(c => isUpcomingCuota(c)).length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allPendingIds = selectedGroupForModal.cuotas.filter(c => c.estado !== 'Cobrado').map(c => c.id);
                    const clientIds = selectedGroupForModal.cuotas.map(c => c.id);
                    setSelectedCuotaIds(prev => Array.from(new Set([...prev.filter(id => !clientIds.includes(id)), ...allPendingIds])));
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/40 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  ☑️ Marcar Todos Impagos ({selectedGroupForModal.cuotas.filter(c => c.estado !== 'Cobrado').length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const clientIds = selectedGroupForModal.cuotas.map(c => c.id);
                    setSelectedCuotaIds(prev => prev.filter(id => !clientIds.includes(id)));
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  ✖️ Desmarcar
                </button>
              </div>

              <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/30">
                {selectedGroupForModal.cuotas.filter(c => selectedCuotaIds.includes(c.id)).length} de {selectedGroupForModal.cuotas.length} cuotas marcadas
              </div>
            </div>

            {/* Modal Scrollable Table of Cuotas for this client */}
            <div className="overflow-y-auto p-4 flex-1">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">
                      <input
                        type="checkbox"
                        className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        checked={selectedGroupForModal.cuotas.length > 0 && selectedGroupForModal.cuotas.every(c => selectedCuotaIds.includes(c.id))}
                        onChange={(e) => {
                          const gIds = selectedGroupForModal.cuotas.map(c => c.id);
                          if (e.target.checked) {
                            setSelectedCuotaIds(prev => Array.from(new Set([...prev, ...gIds])));
                          } else {
                            setSelectedCuotaIds(prev => prev.filter(id => !gIds.includes(id)));
                          }
                        }}
                      />
                    </th>
                    <th className="py-3 px-3">Cuota & Nº Pagaré</th>
                    <th className="py-3 px-3">Fecha Vencimiento</th>
                    <th className="py-3 px-3">Monto & Moneda</th>
                    <th className="py-3 px-3">Desglose (Pura / Int)</th>
                    <th className="py-3 px-3">Semáforo / Pago</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedGroupForModal.cuotas.map((c) => (
                    <tr key={c.id} className={`hover:bg-slate-800/60 transition-colors ${selectedCuotaIds.includes(c.id) ? 'bg-emerald-950/30' : ''}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          checked={selectedCuotaIds.includes(c.id)}
                          onChange={() => toggleSelectCuota(c.id)}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-indigo-400 flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30 text-xs">
                            <Tag className="w-3 h-3 text-indigo-400" />
                            {c.numero_pagare || `PAG-${String(c.numero_cuota).padStart(4, '0')}`}
                          </span>
                          <button
                            onClick={() => openEditModalForCuota(c)}
                            title="Editar Número de Pagaré"
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">Cuota N.º {c.numero_cuota}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
                            {formatDateAR(c.fecha_vencimiento)}
                          </span>
                          <button
                            onClick={() => openEditModalForCuota(c)}
                            title="Editar Fecha de Vencimiento"
                            className="p-1 hover:bg-slate-800 rounded text-amber-400 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-400">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {c.moneda === 'ARS' ? 'ARS' : 'USD'}
                          </span>
                          <span>${c.monto_cuota?.toLocaleString('es-AR')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {c.prestamo?.monto_total_prestado && c.prestamo?.cantidad_cuotas ? (
                          <div className="text-[11px] text-slate-300 space-x-2 font-normal">
                            <span>Pura: <strong className="text-cyan-300 font-mono">${Math.round(c.prestamo.monto_total_prestado / c.prestamo.cantidad_cuotas).toLocaleString('es-AR')}</strong></span>
                            <span>Int: <strong className="text-indigo-300 font-mono">${Math.max(0, c.monto_cuota - Math.round(c.prestamo.monto_total_prestado / c.prestamo.cantidad_cuotas)).toLocaleString('es-AR')}</strong></span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {getCuotaSemaphoreBadge(c)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModalForCuota(c)}
                            className="bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                            title="Editar Pagaré"
                          >
                            <Edit2 className="w-3 h-3" /> Editar
                          </button>

                          {c.estado !== 'Cobrado' && (
                            <>
                              <button
                                onClick={() => handleSendWhatsAppReminder(c)}
                                className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                                title="Enviar Recordatorio por WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-400" /> WSP
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCuotaForPay(c);
                                  setPayForm({
                                    monto_pagado: c.monto_cuota,
                                    fecha_pago: new Date().toISOString().split('T')[0],
                                    comprobante_pago: '',
                                    observaciones: ''
                                  });
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <DollarSign className="w-3 h-3" /> Cobrar
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setSelectedCuotaForClaim(c);
                              setClaimForm({
                                tipo_gestion: 'Llamada Telefónica',
                                resultado_gestion: 'Compromiso de Pago',
                                fecha_compromiso_pago: '',
                                monto_prometido: c.monto_cuota,
                                detalle_reclamo: '',
                                atendido_por: 'Administración'
                              });
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <PhoneCall className="w-3 h-3 text-indigo-400" /> Reclamo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer with Actions for Selected Cuotas */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                {selectedGroupForModal.cuotas.filter(c => selectedCuotaIds.includes(c.id)).length > 0 ? (
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    {selectedGroupForModal.cuotas.filter(c => selectedCuotaIds.includes(c.id)).length} cuota(s) de este cliente marcada(s)
                  </span>
                ) : (
                  <span className="text-slate-400 italic">
                    💡 Marca las casillas de las cuotas para enviar recordatorios por WhatsApp a este cliente.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedGroupForModal.cuotas.filter(c => selectedCuotaIds.includes(c.id)).length > 0 && (
                  <button
                    onClick={() => {
                      const clientMarkedIds = selectedGroupForModal.cuotas.filter(c => selectedCuotaIds.includes(c.id)).map(c => c.id);
                      setSelectedCuotaIds(clientMarkedIds);
                      setWebQueueIndex(0);
                      setIsMassWhatsAppOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg animate-pulse"
                  >
                    <Send className="w-4 h-4" /> Enviar WhatsApp a la Selección ({selectedGroupForModal.cuotas.filter(c => selectedCuotaIds.includes(c.id)).length})
                  </button>
                )}
                <button
                  onClick={() => setSelectedGroupClientId(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition"
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ENVÍO MASIVO POR WHATSAPP Y CONFIGURACIÓN GATEWAY */}
      {isMassWhatsAppOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <Send className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    Centro de Envío Masivo & Remitente WhatsApp
                  </h2>
                  <p className="text-xs text-slate-400">
                    Notificación masiva de pagarés a vencer y vencidos por API o Asistente Web
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMassWhatsAppOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-slate-800 bg-slate-900/80 px-5 shrink-0">
              <button
                onClick={() => setActiveMassTab('envio')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${activeMassTab === 'envio'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
                  }`}
              >
                <Send className="w-4 h-4" /> 🚀 Envío Masivo ({selectedCuotasObjects.length})
              </button>
              <button
                onClick={() => setActiveMassTab('config')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${activeMassTab === 'config'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
                  }`}
              >
                <Settings className="w-4 h-4" /> ⚙️ Configurar API Gateway
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 flex-1 space-y-6">
              {activeMassTab === 'envio' && (
                <div className="space-y-6">
                  {selectedCuotasObjects.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3">
                      <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                      <p className="text-slate-300 font-bold">No has seleccionado ninguna cuota o pagaré.</p>
                      <p className="text-xs text-slate-400">
                        Selecciona pagarés usando los casilleros de verificación en la tabla o los atajos rápidos de arriba.
                      </p>
                      <div className="flex justify-center gap-2 pt-2">
                        <button
                          onClick={() => { selectAllOverdueAndUpcoming(); }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                        >
                          Seleccionar Vencidos + Próximos
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Batch status summary bar */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Destinatarios Seleccionados</span>
                          <span className="text-lg font-black text-white">{selectedCuotasObjects.length} Clientes / Pagarés</span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Modo de Envío Activo</span>
                          <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                            {whatsAppConfig.provider === 'meta_cloud' && 'Meta Cloud API Directa'}
                            {whatsAppConfig.provider === 'ultramsg' && 'UltraMsg / Gateway Externa'}
                            {whatsAppConfig.provider === 'simulation' && 'Sandbox / Asistente Web 1-Clic'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Registro Histórico CRM</span>
                          <span className={`text-xs font-bold mt-1 block ${whatsAppConfig.enabledAutoLogging ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {whatsAppConfig.enabledAutoLogging ? '✓ Automático en CRM' : '✕ Desactivado'}
                          </span>
                        </div>
                      </div>

                      {/* Template Editor & Tag Insertion */}
                      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            ✍️ Plantilla Dinámica del Mensaje (Editable)
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomTemplate(DEFAULT_OVERDUE_WHATSAPP_TEMPLATE);
                                const u = { ...whatsAppConfig, defaultTemplate: DEFAULT_OVERDUE_WHATSAPP_TEMPLATE };
                                setWhatsAppConfigState(u);
                                saveWhatsAppConfig(u);
                              }}
                              className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/40 font-bold transition cursor-pointer"
                            >
                              🔴 Plantilla Mora Vencida
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomTemplate(DEFAULT_WHATSAPP_TEMPLATE);
                                const u = { ...whatsAppConfig, defaultTemplate: DEFAULT_WHATSAPP_TEMPLATE };
                                setWhatsAppConfigState(u);
                                saveWhatsAppConfig(u);
                              }}
                              className="text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/40 font-bold transition cursor-pointer"
                            >
                              🟡 Recordatorio Próximo
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomTemplate(DEFAULT_WHATSAPP_TEMPLATE);
                                const u = { ...whatsAppConfig, defaultTemplate: DEFAULT_WHATSAPP_TEMPLATE };
                                setWhatsAppConfigState(u);
                                saveWhatsAppConfig(u);
                              }}
                              className="text-[10px] font-semibold text-slate-400 hover:text-slate-200 underline cursor-pointer"
                            >
                              ↺ Restablecer
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] text-slate-400 mr-1">Insertar en cursor:</span>
                          {[
                            '{nombre_cliente}',
                            '{numero_pagare}',
                            '{numero_cuota}',
                            '{monto_formateado}',
                            '{fecha_vencimiento}'
                          ].map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => insertTagAtCursor(tag)}
                              className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 px-2 py-1 rounded transition cursor-pointer active:scale-95"
                              title={`Insertar ${tag} en el cursor`}
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                        <textarea
                          ref={templateTextareaRef}
                          rows={4}
                          value={customTemplate}
                          onChange={(e) => {
                            setCustomTemplate(e.target.value);
                            const updated = { ...whatsAppConfig, defaultTemplate: e.target.value };
                            setWhatsAppConfigState(updated);
                            saveWhatsAppConfig(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                        />
                      </div>

                      {/* Live Message Preview */}
                      {selectedCuotasObjects[0] && (
                        <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                            👁️ Vista Previa de Mensaje (Ejemplo: {selectedCuotasObjects[0].cliente ? `${selectedCuotasObjects[0].cliente.nombre} ${selectedCuotasObjects[0].cliente.apellido || ''}` : 'Cliente'})
                          </span>
                          <p className="text-xs text-slate-200 whitespace-pre-wrap font-sans bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                            {formatWhatsAppMessage(customTemplate, selectedCuotasObjects[0], selectedCuotasObjects[0].cliente)}
                          </p>
                        </div>
                      )}

                      {/* Dispatch Options & Execution Controls */}
                      <div className="space-y-4 pt-2 border-t border-slate-800">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              ⚡ Opción A: Envío Masivo Automático por API Gateway
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Envía todas las notificaciones en segundo plano sin abrir pestañas del navegador.
                            </p>
                          </div>
                          <button
                            onClick={handleExecuteMassApiDispatch}
                            disabled={massSendingStatus === 'sending'}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2 shrink-0"
                          >
                            {massSendingStatus === 'sending' ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                Enviando... ({sendProgress.current}/{sendProgress.total})
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Iniciar Envío por API ({selectedCuotasObjects.length})
                              </>
                            )}
                          </button>
                        </div>

                        {/* Progress Bar if Sending */}
                        {massSendingStatus === 'sending' && (
                          <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-300">
                              <span>Progreso del Envío Masivo</span>
                              <span className="text-emerald-400 font-mono">
                                {Math.round((sendProgress.current / sendProgress.total) * 100)}% ({sendProgress.current} de {sendProgress.total})
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full transition-all duration-300"
                                style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                              <span className="text-emerald-400">✓ Exitosos: {sendProgress.successCount}</span>
                              <span className="text-red-400">✕ Fallidos: {sendProgress.failCount}</span>
                            </div>
                          </div>
                        )}

                        {massSendingStatus === 'completed' && (
                          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center space-y-1">
                            <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                            <h4 className="text-sm font-bold text-emerald-300">¡Envío Masivo Completado!</h4>
                            <p className="text-xs text-slate-300">
                              Se procesaron {sendProgress.total} recordatorios: <strong className="text-emerald-400">{sendProgress.successCount} exitosos</strong> y <strong className="text-red-400">{sendProgress.failCount} fallidos</strong>.
                            </p>
                          </div>
                        )}

                        {/* Interactive Queue for WhatsApp Web Direct dispatch */}
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                💬 Opción B: Asistente 1-Clic WhatsApp Web (Secuencia Gratuita)
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Abre el chat oficial de WhatsApp Web para cada cliente secuencialmente.
                              </p>
                            </div>
                            <span className="text-xs font-mono font-bold bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg text-emerald-400">
                              {webQueueIndex + 1} de {selectedCuotasObjects.length}
                            </span>
                          </div>

                          {selectedCuotasObjects[webQueueIndex] && (
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
                              <div className="text-xs space-y-0.5">
                                <div className="font-bold text-white text-sm">
                                  👤 {selectedCuotasObjects[webQueueIndex].cliente ? `${selectedCuotasObjects[webQueueIndex].cliente.nombre} ${selectedCuotasObjects[webQueueIndex].cliente.apellido || ''}` : 'Cliente'}
                                </div>
                                <div className="text-slate-400">
                                  📞 Teléfono: <strong className="text-slate-200">{selectedCuotasObjects[webQueueIndex].cliente?.telefono || 'Sin registrar'}</strong> | Pagaré: <strong className="text-indigo-400">{selectedCuotasObjects[webQueueIndex].numero_pagare || `Cuota ${selectedCuotasObjects[webQueueIndex].numero_cuota}`}</strong>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={webQueueIndex === 0}
                                  onClick={() => setWebQueueIndex(prev => Math.max(0, prev - 1))}
                                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-40 cursor-pointer"
                                >
                                  Anterior
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const item = selectedCuotasObjects[webQueueIndex];
                                    if (item) {
                                      const text = formatWhatsAppMessage(customTemplate, item, item.cliente);
                                      const phone = item.cliente?.telefono || '';
                                      const url = buildWhatsAppWebUrl(phone, text);
                                      window.open(url, '_blank');

                                      // Auto-log interaction
                                      const cid = item.cliente_id || item.prestamo?.cliente_id;
                                      if (cid && whatsAppConfig.enabledAutoLogging) {
                                        try {
                                          await dataService.createReclamoCobranza({
                                            cuota_id: item.id,
                                            cliente_id: cid,
                                            fecha_contacto: new Date().toISOString(),
                                            tipo_gestion: 'Mensaje WhatsApp',
                                            resultado_gestion: 'Compromiso de Pago',
                                            detalle_reclamo: `📲 RECORDATORIO WSP WEB (1-CLIC): Pagaré ${item.numero_pagare || `Nº ${item.numero_cuota}`}`,
                                            atendido_por: 'Administración'
                                          });
                                          await loadData();
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }

                                      if (webQueueIndex < selectedCuotasObjects.length - 1) {
                                        setWebQueueIndex(prev => prev + 1);
                                      }
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" /> Abrir Chat & Siguiente
                                </button>
                                <button
                                  type="button"
                                  disabled={webQueueIndex >= selectedCuotasObjects.length - 1}
                                  onClick={() => setWebQueueIndex(prev => Math.min(selectedCuotasObjects.length - 1, prev + 1))}
                                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-40 cursor-pointer"
                                >
                                  Saltar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeMassTab === 'config' && (
                <form onSubmit={handleSaveWhatsAppConfig} className="space-y-5 max-w-2xl">
                  {/* Explanatory Guide Banner */}
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
                    <div className="font-bold text-xs text-indigo-300 flex items-center gap-2">
                      💡 ¿Cómo funciona el Remitente de WhatsApp?
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
                      <p>
                        • <strong className="text-emerald-400">Modo Simulación / Web (Gratuito - Recomendado por defecto)</strong>: No requiere pagos ni claves API. Al enviar recordatorios, el sistema abre la ventana oficial de WhatsApp Web con el mensaje precargado listo para presionar Enter.
                      </p>
                      <p>
                        • <strong className="text-indigo-400">Meta Cloud API (Oficial) / Gateway Externa</strong>: Si la empresa dispone de una cuenta empresarial de WhatsApp API (Meta u UltraMsg), ingresa tu Token e ID para que el CRM despache mensajes masivos 100% automáticos en segundo plano.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-200">
                      Proveedor / Gateway de WhatsApp
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setWhatsAppConfigState({ ...whatsAppConfig, provider: 'meta_cloud' })}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${whatsAppConfig.provider === 'meta_cloud'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                      >
                        <Radio className={`w-4 h-4 mb-1 ${whatsAppConfig.provider === 'meta_cloud' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div className="font-bold text-xs">Meta Cloud API</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">API oficial de Meta / WhatsApp Business</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWhatsAppConfigState({ ...whatsAppConfig, provider: 'ultramsg' })}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${whatsAppConfig.provider === 'ultramsg'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                      >
                        <Radio className={`w-4 h-4 mb-1 ${whatsAppConfig.provider === 'ultramsg' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div className="font-bold text-xs">UltraMsg Gateway</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Servidor o gateway de API externa</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWhatsAppConfigState({ ...whatsAppConfig, provider: 'simulation' })}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${whatsAppConfig.provider === 'simulation'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                      >
                        <Radio className={`w-4 h-4 mb-1 ${whatsAppConfig.provider === 'simulation' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div className="font-bold text-xs">Modo Simulación / Web</div>
                        <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Gratuito (Sin costo de API)</div>
                      </button>
                    </div>
                  </div>

                  {whatsAppConfig.provider === 'meta_cloud' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Meta Access Token *</label>
                        <input
                          type="password"
                          placeholder="EAABw..."
                          value={whatsAppConfig.metaAccessToken || ''}
                          onChange={(e) => setWhatsAppConfigState({ ...whatsAppConfig, metaAccessToken: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Meta Phone Number ID *</label>
                        <input
                          type="text"
                          placeholder="Ej: 1098273645"
                          value={whatsAppConfig.metaPhoneId || ''}
                          onChange={(e) => setWhatsAppConfigState({ ...whatsAppConfig, metaPhoneId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {whatsAppConfig.provider === 'ultramsg' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">UltraMsg Instance ID *</label>
                        <input
                          type="text"
                          placeholder="instance1234"
                          value={whatsAppConfig.ultramsgInstanceId || ''}
                          onChange={(e) => setWhatsAppConfigState({ ...whatsAppConfig, ultramsgInstanceId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">UltraMsg Token *</label>
                        <input
                          type="password"
                          placeholder="token..."
                          value={whatsAppConfig.ultramsgToken || ''}
                          onChange={(e) => setWhatsAppConfigState({ ...whatsAppConfig, ultramsgToken: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-white">Registro Automático en CRM</div>
                      <div className="text-[11px] text-slate-400">Crear una entrada de reclamo/gestión cada vez que se envía un recordatorio</div>
                    </div>
                    <input
                      type="checkbox"
                      className="accent-emerald-500 w-5 h-5 cursor-pointer"
                      checked={whatsAppConfig.enabledAutoLogging}
                      onChange={(e) => setWhatsAppConfigState({ ...whatsAppConfig, enabledAutoLogging: e.target.checked })}
                    />
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Guardar Configuración WhatsApp
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL INDIVIDUAL PARA REDACTAR Y EDITAR MENSAJE DE WHATSAPP */}
      {individualWspOpen && cuotaForIndividualWsp && (
        <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] my-auto overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shrink-0">
                  <MessageSquare className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Redactar Mensaje de WhatsApp
                  </h3>
                  <p className="text-xs text-slate-400">
                    Destinatario: <strong className="text-emerald-400">{cuotaForIndividualWsp.cliente ? `${cuotaForIndividualWsp.cliente.nombre} ${cuotaForIndividualWsp.cliente.apellido || ''}` : 'Cliente'}</strong>
                    {cuotaForIndividualWsp.cliente?.telefono ? ` (${cuotaForIndividualWsp.cliente.telefono})` : ' (Sin Teléfono)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIndividualWspOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 text-xs">
              {/* Context Summary Badge */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pagaré & Cuota</span>
                  <span className="font-mono font-bold text-indigo-400 text-sm">
                    {cuotaForIndividualWsp.numero_pagare || `PAG-${String(cuotaForIndividualWsp.numero_cuota).padStart(4, '0')}`} (Cuota {cuotaForIndividualWsp.numero_cuota})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monto a Cobrar</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {cuotaForIndividualWsp.moneda === 'ARS' ? 'ARS' : 'USD'} ${cuotaForIndividualWsp.monto_cuota.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estado</span>
                  {getCuotaSemaphoreBadge(cuotaForIndividualWsp)}
                </div>
              </div>

              {/* Template Selector Buttons */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center justify-between">
                  <span>Plantillas Rápidas:</span>
                  <span className="text-[11px] text-slate-400 font-normal">Cambia el estilo del mensaje con 1 clic</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectIndividualTemplate('vencido')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${individualTemplateType === 'vencido'
                      ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    🔴 Reclamo Mora
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectIndividualTemplate('proximo')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${individualTemplateType === 'proximo'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    🟡 Próximo a Vencer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectIndividualTemplate('general')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${individualTemplateType === 'general'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    🤝 Aviso General
                  </button>
                </div>
              </div>

              {/* Tag Insertion Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block font-semibold">
                  Haz clic en un dato para insertarlo en el texto:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '{nombre_cliente}',
                    '{numero_pagare}',
                    '{numero_cuota}',
                    '{monto_formateado}',
                    '{fecha_vencimiento}'
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTagInIndividual(tag)}
                      className="text-[10px] font-mono bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-700 px-2 py-1 rounded-lg transition cursor-pointer active:scale-95"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1">
                <label className="font-bold text-slate-200 block">
                  Editar Mensaje Personalizado:
                </label>
                <textarea
                  ref={individualTextareaRef}
                  rows={6}
                  value={individualWspText}
                  onChange={(e) => {
                    setIndividualWspText(e.target.value);
                    setIndividualTemplateType('custom' as any);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  👁️ Vista Previa en WhatsApp:
                </span>
                <p className="text-xs text-slate-200 whitespace-pre-wrap font-sans bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                  {individualWspText}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleCopyIndividualText}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                {individualCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {individualCopied ? '¡Texto Copiado!' : 'Copiar Texto'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIndividualWspOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendIndividualWhatsApp}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Abrir WhatsApp & Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
