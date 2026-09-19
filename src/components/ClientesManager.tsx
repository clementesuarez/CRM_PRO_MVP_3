import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MessageSquare, 
  Tag, 
  Calendar, 
  X,
  UserCheck,
  Zap,
  Filter,
  PlusCircle,
  Edit3,
  MapPin,
  FileText,
  CreditCard,
  Building2,
  Check,
  User,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  CheckSquare,
  History,
  Send,
  DollarSign,
  Scan,
  Sparkles
} from 'lucide-react';
import { 
  Cliente, 
  TipoCliente, 
  TipoDocumento, 
  PROVINCIAS_ARGENTINA, 
  getClienteFullName,
  Interaccion,
  TipoInteraccion
} from '../types/crm';
import { WhatsAppModal } from './WhatsAppModal';
import { DniScannerModal } from './DniScannerModal';
import { DniParsedResult, formatDni } from '../utils/dniParser';
import { flexSearchMatch } from '../utils/searchHelper';
import { dataService } from '../services/dataService';

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

interface ClientesManagerProps {
  clientes: Cliente[];
  interacciones?: Interaccion[];
  selectedClienteIdForModal?: string | null;
  onClearSelectedClienteId?: () => void;
  onAddCliente: (cliente: Omit<Cliente, 'id' | 'created_at'>) => Promise<void>;
  onUpdateCliente?: (cliente: Cliente) => Promise<void>;
  onStartQuotationForClient?: (clienteId: string) => void;
  onSaveInteraction?: (data: { 
    cliente_id: string; 
    tipo: TipoInteraccion; 
    nota: string; 
    accion_siguiente?: string; 
    proximo_contacto?: string 
  }) => Promise<void>;
}

export const ClientesManager: React.FC<ClientesManagerProps> = ({
  clientes,
  interacciones = [],
  selectedClienteIdForModal,
  onClearSelectedClienteId,
  onAddCliente,
  onUpdateCliente,
  onStartQuotationForClient,
  onSaveInteraction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'tabla' | 'tarjetas'>('tabla');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'ficha' | 'historial' | 'pagares'>('ficha');
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clientCuotas, setClientCuotas] = useState<any[]>([]);
  const [clientPrestamos, setClientPrestamos] = useState<any[]>([]);

  // Express Pagaré Editing Modal inside Customer File
  const [editingCuotaFromProfile, setEditingCuotaFromProfile] = useState<any | null>(null);
  const [profileEditForm, setProfileEditForm] = useState({
    numero_pagare: '',
    fecha_vencimiento: '',
    monto_cuota: 0,
    estado: 'Pendiente' as any,
    observaciones: '',
    comprobante_pago: '',
    fecha_pago: '',
    monto_pagado: 0
  });

  useEffect(() => {
    if (selectedClienteIdForModal) {
      const target = clientes.find(c => c.id === selectedClienteIdForModal);
      if (target) {
        handleOpenEdit(target, 'ficha');
      }
    }
  }, [selectedClienteIdForModal, clientes]);

  useEffect(() => {
    if (editingCliente) {
      loadClientLoans(editingCliente.id);
    }
  }, [editingCliente]);

  const loadClientLoans = async (clienteId: string) => {
    try {
      const [allCuotas, allPrestamos] = await Promise.all([
        dataService.getCuotasPagares(),
        dataService.getPrestamosPagares()
      ]);
      setClientPrestamos(allPrestamos.filter((p: any) => p.cliente_id === clienteId));
      setClientCuotas(allCuotas.filter((c: any) => c.cliente_id === clienteId || c.prestamo?.cliente_id === clienteId));
    } catch (err) {
      console.error('Error cargando pagarés del cliente:', err);
    }
  };

  // Form State
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F' | 'X' | string>('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [numeroTramite, setNumeroTramite] = useState('');
  const [domicilioCalle, setDomicilioCalle] = useState('');
  const [domicilioNumero, setDomicilioNumero] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [provincia, setProvincia] = useState<string>(PROVINCIAS_ARGENTINA[0]);
  const [codigoPostal, setCodigoPostal] = useState('');
  const [comproCredito, setComproCredito] = useState(false);
  const [montoCredito, setMontoCredito] = useState<number>(0);
  const [dejaAutoPermuta, setDejaAutoPermuta] = useState(false);
  const [autoPermutaDetalle, setAutoPermutaDetalle] = useState('');
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('Prospecto');
  const [notas, setNotas] = useState('');

  // Scanner Modal & Mode State
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [isDniManualMode, setIsDniManualMode] = useState(false);

  // Inline New Interaction Form State in Modal
  const [newIntTipo, setNewIntTipo] = useState<TipoInteraccion>('Vino al salón');
  const [newIntNota, setNewIntNota] = useState('');
  const [newIntAccion, setNewIntAccion] = useState('Seguimiento de consulta');
  const [newIntProximo, setNewIntProximo] = useState('');
  const [savingInteraction, setSavingInteraction] = useState(false);

  const [loading, setLoading] = useState(false);

  // WhatsApp modal state
  const [wspModalOpen, setWspModalOpen] = useState(false);
  const [activeClienteForWsp, setActiveClienteForWsp] = useState<Cliente | null>(null);

  const resetForm = () => {
    setEditingCliente(null);
    setNombre('');
    setApellido('');
    setTelefono('');
    setEmail('');
    setTipoDocumento('DNI');
    setNumeroDocumento('');
    setSexo('');
    setFechaNacimiento('');
    setNumeroTramite('');
    setIsDniManualMode(false);
    setDomicilioCalle('');
    setDomicilioNumero('');
    setLocalidad('');
    setProvincia(PROVINCIAS_ARGENTINA[0]);
    setCodigoPostal('');
    setComproCredito(false);
    setMontoCredito(0);
    setDejaAutoPermuta(false);
    setAutoPermutaDetalle('');
    setTipoCliente('Prospecto');
    setNotas('');
    setModalTab('ficha');
    setNewIntNota('');
    setNewIntProximo('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Cliente, initialTab: 'ficha' | 'historial' = 'ficha') => {
    setEditingCliente(c);
    setNombre(c.nombre || '');
    setApellido(c.apellido || '');
    setTelefono(c.telefono || '');
    setEmail(c.email || '');
    setTipoDocumento(c.tipo_documento || 'DNI');
    setNumeroDocumento(c.numero_documento || '');
    setSexo(c.sexo || '');
    setFechaNacimiento(c.fecha_nacimiento || '');
    setNumeroTramite(c.numero_tramite || '');
    setIsDniManualMode(true);
    setDomicilioCalle(c.domicilio_calle || '');
    setDomicilioNumero(c.domicilio_numero || '');
    setLocalidad(c.localidad || '');
    setProvincia(c.provincia || PROVINCIAS_ARGENTINA[0]);
    setCodigoPostal(c.codigo_postal || '');
    setComproCredito(Boolean(c.compro_credito));
    setMontoCredito(c.monto_credito || 0);
    setDejaAutoPermuta(Boolean(c.deja_auto_permuta));
    setAutoPermutaDetalle(c.auto_permuta_detalle || '');
    setTipoCliente(c.tipo_cliente || 'Prospecto');
    setNotas(c.notas || '');
    setModalTab(initialTab);
    setNewIntNota('');
    setNewIntProximo('');
    setModalOpen(true);
  };

  const handleDniScanned = (data: DniParsedResult) => {
    setNombre(data.nombre);
    setApellido(data.apellido);
    setTipoDocumento('DNI');
    setNumeroDocumento(data.documento_formateado || data.numero_documento);
    if (data.sexo) setSexo(data.sexo);
    if (data.fecha_nacimiento) setFechaNacimiento(data.fecha_nacimiento);
    if (data.numero_tramite) setNumeroTramite(data.numero_tramite);
    setIsDniManualMode(false);
    setModalOpen(true);
  };

  const handleAddInlineInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCliente || !newIntNota.trim()) return;
    setSavingInteraction(true);
    try {
      if (onSaveInteraction) {
        await onSaveInteraction({
          cliente_id: editingCliente.id,
          tipo: newIntTipo,
          nota: newIntNota,
          accion_siguiente: newIntAccion,
          proximo_contacto: newIntProximo ? new Date(newIntProximo).toISOString() : undefined,
        });
      }
      setNewIntNota('');
      setNewIntProximo('');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingInteraction(false);
    }
  };

  const filteredClientes = clientes.filter((c) => {
    const fullSearchText = `
      ${c.nombre} ${c.apellido || ''} ${c.telefono} ${c.email || ''} 
      ${c.tipo_documento || ''} ${c.numero_documento || ''} 
      ${c.domicilio_calle || ''} ${c.localidad || ''} ${c.provincia || ''} ${c.auto_permuta_detalle || ''} ${c.notas || ''}
    `;
    const matchSearch = flexSearchMatch(fullSearchText, searchTerm);
    const matchTipo = filterTipo === 'todos' || c.tipo_cliente === filterTipo;
    return matchSearch && matchTipo;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono) {
      alert('Por favor completa los campos obligatorios (Nombre y Teléfono).');
      return;
    }
    setLoading(true);

    const payload = {
      nombre: nombre.trim(),
      apellido: apellido.trim() || undefined,
      telefono: telefono.trim(),
      email: email.trim() || undefined,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento.trim() || undefined,
      sexo: (sexo as any) || undefined,
      fecha_nacimiento: fechaNacimiento || undefined,
      numero_tramite: numeroTramite.trim() || undefined,
      domicilio_calle: domicilioCalle.trim() || undefined,
      domicilio_numero: domicilioNumero.trim() || undefined,
      localidad: localidad.trim() || undefined,
      provincia,
      codigo_postal: codigoPostal.trim() || undefined,
      compro_credito: comproCredito,
      monto_credito: comproCredito ? Number(montoCredito) : 0,
      deja_auto_permuta: dejaAutoPermuta,
      auto_permuta_detalle: dejaAutoPermuta ? autoPermutaDetalle.trim() : undefined,
      tipo_cliente: tipoCliente,
      notas: notas.trim() || undefined,
    };

    try {
      if (editingCliente && onUpdateCliente) {
        await onUpdateCliente({
          ...editingCliente,
          ...payload,
        });
      } else {
        await onAddCliente(payload);
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTipoBadge = (tipo?: TipoCliente) => {
    switch (tipo) {
      case 'Comprador':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">Comprador</span>;
      case 'No compro':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">No Compró</span>;
      case 'No califica como comprador':
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">No Califica</span>;
      case 'Prospecto':
      default:
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">Prospecto</span>;
    }
  };

  const getClientInteractions = (clienteId: string) => {
    return interacciones.filter(i => i.cliente_id === clienteId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyan-400" />
            Base de Datos Comercial de Clientes & Compradores
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión completa de contactos, DNI/CUIT, localización geográfica en las 24 provincias y registro de interacciones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setScannerModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <Scan className="w-4 h-4 text-cyan-400" />
            <span>Escanear DNI (PDF417)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Búsqueda predictiva (ej: 'benitez', 'DNI 321', 'La Plata', '115544')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category Filter Select */}
          <div>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="todos">Categoría: Todos los Clientes</option>
              <option value="Prospecto">Prospectos</option>
              <option value="Comprador">Compradores</option>
              <option value="No compro">No Compró</option>
              <option value="No califica como comprador">No Califica</option>
            </select>
          </div>

          {/* Responsive View Mode Toggle */}
          <div className="flex items-center justify-end gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('tabla')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                viewMode === 'tabla' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista Tabla Completa"
            >
              <TableIcon className="w-4 h-4" />
              <span>Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('tarjetas')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                viewMode === 'tarjetas' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista Tarjetas Responsive"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Tarjetas</span>
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] mr-1">Filtrar Rápido:</span>
            {['todos', 'Prospecto', 'Comprador', 'No compro', 'No califica como comprador'].map((cat) => {
              const count = cat === 'todos' 
                ? clientes.length 
                : clientes.filter(c => c.tipo_cliente === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterTipo(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    filterTipo === cat
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{cat === 'todos' ? 'Todos' : cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filterTipo === cat ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-cyan-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Mostrando <strong className="text-cyan-400">{filteredClientes.length}</strong> de {clientes.length} clientes
          </div>
        </div>
      </div>

      {/* RENDER VIEW 1: TABLE VIEW */}
      {viewMode === 'tabla' ? (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1250px] text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4 min-w-[230px]">Cliente (Nombre & Apellido)</th>
                  <th className="p-4 min-w-[130px]">Documento</th>
                  <th className="p-4 min-w-[190px]">Contacto (WSP & Email)</th>
                  <th className="p-4 min-w-[180px]">Domicilio & Provincia</th>
                  <th className="p-4 min-w-[180px]">Financiación / Crédito</th>
                  <th className="p-4 min-w-[160px]">Categoría & Historial</th>
                  <th className="p-4 text-right min-w-[290px]">Acciones Comerciales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                      No se encontraron clientes que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((c) => {
                    const clientInts = getClientInteractions(c.id);
                    return (
                      <tr key={c.id} className="hover:bg-slate-900/60 transition">
                        <td className="p-4 min-w-[230px]">
                          <div className="font-extrabold text-slate-100 text-sm">
                            {getClienteFullName(c)}
                          </div>
                          {c.notas && (
                            <div className="text-[11px] text-slate-400 max-w-xs truncate mt-0.5" title={c.notas}>
                              📝 {c.notas}
                            </div>
                          )}
                        </td>

                        <td className="p-4 min-w-[130px] font-mono text-slate-300">
                          {c.numero_documento ? (
                            <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-[11px] font-semibold">
                              <strong className="text-cyan-400">{c.tipo_documento || 'DNI'}</strong>: {c.numero_documento}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        <td className="p-4 min-w-[190px] space-y-1 font-mono">
                          <div className="text-cyan-300 font-bold flex items-center gap-1">📞 {c.telefono}</div>
                          {c.email && <div className="text-slate-400 text-[11px] truncate max-w-[170px]">✉️ {c.email}</div>}
                        </td>

                        <td className="p-4 min-w-[180px] text-slate-300">
                          {c.domicilio_calle || c.localidad || c.provincia ? (
                            <div>
                              <div className="font-medium">
                                {c.domicilio_calle ? `${c.domicilio_calle} ${c.domicilio_numero || ''}` : ''}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-[170px]">
                                <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                                {c.localidad ? `${c.localidad}, ` : ''}
                                {c.provincia ? c.provincia.split('–')[0].trim() : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        <td className="p-4 min-w-[180px] space-y-1">
                          {c.compro_credito ? (
                            <div className="bg-purple-950/40 border border-purple-500/30 text-purple-300 px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                              <CreditCard className="w-3.5 h-3.5" />
                              Crédito: ${c.monto_credito?.toLocaleString()}
                            </div>
                          ) : (
                            <div className="text-slate-500 text-[11px]">Contado / Sin Crédito</div>
                          )}

                          {(c.deja_auto_permuta || c.auto_permuta_detalle) && (
                            <div className="bg-amber-950/40 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md text-[10px] font-medium max-w-xs truncate">
                              🔄 Permuta: {c.auto_permuta_detalle || 'Entregó vehículo'}
                            </div>
                          )}
                        </td>

                        <td className="p-4 min-w-[160px] space-y-1.5">
                          <div>{getTipoBadge(c.tipo_cliente)}</div>
                          <button
                            onClick={() => handleOpenEdit(c, 'historial')}
                            className="text-[11px] text-cyan-300 font-bold bg-cyan-950/60 hover:bg-cyan-500 hover:text-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition flex items-center gap-1.5"
                          >
                            <History className="w-3.5 h-3.5" /> {clientInts.length} Interacciones
                          </button>
                        </td>

                        <td className="p-4 min-w-[290px] text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(c, 'ficha')}
                              className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 font-bold transition flex items-center gap-1.5 text-xs shadow-sm"
                              title="Ver Ficha Completa o Editar Cliente"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Ficha
                            </button>

                            <button
                              onClick={() => onStartQuotationForClient && onStartQuotationForClient(c.id)}
                              className="px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950 font-black transition flex items-center gap-1.5 text-xs shadow-sm"
                              title="Generar cotización para este cliente"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              + Cotizar
                            </button>

                            <button
                              onClick={() => {
                                setActiveClienteForWsp(c);
                                setWspModalOpen(true);
                              }}
                              className="px-3 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/40 hover:bg-green-500 hover:text-slate-950 font-bold transition flex items-center gap-1.5 text-xs shadow-sm"
                              title="Enviar mensaje por WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              WSP
                            </button>
                          </div>
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
        /* RENDER VIEW 2: RESPONSIVE CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((c) => {
            const clientInts = getClientInteractions(c.id);
            return (
              <div key={c.id} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3.5 hover:border-slate-700 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-base">{getClienteFullName(c)}</h3>
                    <div className="text-xs text-cyan-300 font-mono font-bold mt-0.5">📞 {c.telefono}</div>
                  </div>
                  <div>{getTipoBadge(c.tipo_cliente)}</div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {c.numero_documento && (
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">{c.tipo_documento || 'DNI'}:</span>
                      <strong>{c.numero_documento}</strong>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="truncate max-w-[160px]">{c.email}</span>
                    </div>
                  )}
                  {(c.localidad || c.provincia) && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ubicación:</span>
                      <span className="truncate max-w-[160px] text-right font-medium text-slate-200">
                        {c.localidad ? `${c.localidad}, ` : ''}{c.provincia ? c.provincia.split('–')[0].trim() : ''}
                      </span>
                    </div>
                  )}
                  {c.compro_credito && (
                    <div className="flex justify-between text-purple-300 font-bold">
                      <span>Crédito Prendario:</span>
                      <span>${c.monto_credito?.toLocaleString()}</span>
                    </div>
                  )}
                  {c.notas && (
                    <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-900">
                      📝 {c.notas}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleOpenEdit(c, 'historial')}
                    className="text-xs text-cyan-400 font-bold flex items-center gap-1 hover:underline"
                  >
                    <History className="w-3.5 h-3.5" /> {clientInts.length} Interacciones
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(c, 'ficha')}
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 font-bold transition text-xs"
                      title="Ficha Completa"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onStartQuotationForClient && onStartQuotationForClient(c.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 font-bold transition text-xs flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> + Cotizar
                    </button>
                    <button
                      onClick={() => {
                        setActiveClienteForWsp(c);
                        setWspModalOpen(true);
                      }}
                      className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-slate-950 font-bold transition text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL CLIENT PROFILE MODAL WITH HISTORIAL DE INTERACCIONES TAB */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header Sticky & Pinned */}
            <div className="shrink-0 p-5 pb-3 border-b border-slate-800 bg-slate-900/95 z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-extrabold">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-100">
                      {editingCliente ? `Ficha Comercial & Historial: ${getClienteFullName(editingCliente)}` : 'Registrar Nuevo Cliente'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gestión integral del comprador, historial de contactos y seguimiento de ventas
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setModalOpen(false);
                    if (onClearSelectedClienteId) onClearSelectedClienteId();
                  }} 
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Navigation Tabs */}
              {editingCliente && (
                <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setModalTab('ficha')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                      modalTab === 'ficha' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    1. Ficha Comercial & Datos
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab('historial')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                      modalTab === 'historial' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    2. Interacciones ({getClientInteractions(editingCliente.id).length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab('pagares')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                      modalTab === 'pagares' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    3. Créditos & Pagarés ({clientCuotas.length})
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

            {/* TAB 1: FICHA FORM */}
            {modalTab === 'ficha' && (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                {/* SECTION 1: DATOS PERSONALES */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      1. Datos Personales & Documentación
                    </div>

                    <button
                      type="button"
                      onClick={() => setScannerModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold hover:bg-cyan-500 hover:text-slate-950 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>Escanear DNI (PDF417)</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Nombre *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Carlos"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Apellido</label>
                      <input
                        type="text"
                        placeholder="Ej: Rodríguez"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Tipo Documento</label>
                      <select
                        value={tipoDocumento}
                        onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="DNI">DNI</option>
                        <option value="CUIT">CUIT</option>
                        <option value="CUIL">CUIL</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Número Documento</label>
                      <input
                        type="text"
                        placeholder="Ej: 32.456.789 o 20-35444333-9"
                        value={numeroDocumento}
                        onChange={(e) => setNumeroDocumento(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Sexo (DNI)</label>
                      <select
                        value={sexo}
                        onChange={(e) => setSexo(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">No especificado</option>
                        <option value="M">Masculino (M)</option>
                        <option value="F">Femenino (F)</option>
                        <option value="X">No Binario (X)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Fecha Nacimiento</label>
                      <input
                        type="date"
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CONTACTO */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    2. Información de Contacto Directo
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Teléfono Móvil (WhatsApp) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 5491155443322"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        placeholder="ejemplo@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: DOMICILIO */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    3. Localización Geográfica (24 Provincias)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-300 mb-1">Calle / Domicilio</label>
                      <input
                        type="text"
                        placeholder="Ej: Av. Corrientes"
                        value={domicilioCalle}
                        onChange={(e) => setDomicilioCalle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Número</label>
                      <input
                        type="text"
                        placeholder="Ej: 1234"
                        value={domicilioNumero}
                        onChange={(e) => setDomicilioNumero(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Localidad</label>
                      <input
                        type="text"
                        placeholder="Ej: Palermo / La Plata"
                        value={localidad}
                        onChange={(e) => setLocalidad(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Provincia</label>
                      <select
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        {PROVINCIAS_ARGENTINA.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Código Postal</label>
                      <input
                        type="text"
                        placeholder="Ej: 1425"
                        value={codigoPostal}
                        onChange={(e) => setCodigoPostal(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: FINANCIACIÓN & CRÉDITO */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    4. Gestión Comercial & Financiación / Crédito
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Categoría del Cliente</label>
                      <select
                        value={tipoCliente}
                        onChange={(e) => setTipoCliente(e.target.value as TipoCliente)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Prospecto">Prospecto</option>
                        <option value="Comprador">Comprador</option>
                        <option value="No compro">No compró</option>
                        <option value="No califica como comprador">No califica como comprador</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">¿Compró con Crédito?</label>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setComproCredito(true)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                            comproCredito ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sí (Prendario)
                        </button>
                        <button
                          type="button"
                          onClick={() => setComproCredito(false)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                            !comproCredito ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          No (Contado)
                        </button>
                      </div>
                    </div>

                    {comproCredito && (
                      <div>
                        <label className="block font-semibold text-purple-300 mb-1">Monto Crédito ($)</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="Ej: 15000"
                          value={montoCredito}
                          onChange={(e) => setMontoCredito(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-purple-500/50 rounded-xl p-2.5 font-bold text-purple-300 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* PERMUTA VEHICLE TOGGLE */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="font-semibold text-slate-200 block">¿Entrega auto usado como parte de pago (Permuta)?</label>
                        <p className="text-[11px] text-slate-400">Vincular al cliente con su auto usado a entregar en la agencia</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 p-1 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => setDejaAutoPermuta(true)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                            dejaAutoPermuta ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sí (Entrega Permuta)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDejaAutoPermuta(false)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                            !dejaAutoPermuta ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {dejaAutoPermuta && (
                      <div>
                        <label className="block font-semibold text-amber-300 mb-1">Detalle del Auto Entregado en Permuta</label>
                        <input
                          type="text"
                          placeholder="Ej: Volkswagen Gol Trend 1.6 (2018) - Patente AC987ZZ - Tasación: $9.500 USD"
                          value={autoPermutaDetalle}
                          onChange={(e) => setAutoPermutaDetalle(e.target.value)}
                          className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-2.5 font-medium text-amber-300 focus:outline-none focus:border-amber-400 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 5: NOTAS */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Notas / Observaciones del Cliente</label>
                  <textarea
                    rows={2}
                    placeholder="Preferencia de unidades, historial de conversaciones..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl font-extrabold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {loading ? 'Guardando...' : editingCliente ? 'Guardar Cambios en Ficha' : 'Registrar Cliente'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: HISTORIAL DE INTERACCIONES */}
            {modalTab === 'historial' && editingCliente && (
              <div className="space-y-5 text-xs animate-fade-in">
                {/* Form to add a new interaction inline */}
                <form onSubmit={handleAddInlineInteraction} className="bg-slate-900/80 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                  <div className="font-bold text-cyan-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    Registrar Nueva Interacción / Nota Directa
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Canal de Contacto</label>
                      <select
                        value={newIntTipo}
                        onChange={(e) => setNewIntTipo(e.target.value as TipoInteraccion)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Vino al salón">Vino al salón</option>
                        <option value="Llamó">Llamó</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Mail">Mail</option>
                        <option value="No contesta">No contesta</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-400 mb-1">Próxima Acción Prometida</label>
                      <input
                        type="text"
                        value={newIntAccion}
                        onChange={(e) => setNewIntAccion(e.target.value)}
                        placeholder="Ej: Enviar propuesta de financiación o coordinar prueba"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-400 mb-1">Detalle de la Conversación / Nota *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Ej: El cliente consultó disponibilidad de entrega inmediata y acordó definir la operación antes del viernes..."
                      value={newIntNota}
                      onChange={(e) => setNewIntNota(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] text-slate-400">Agendar Próximo Contacto:</span>
                      <input
                        type="datetime-local"
                        value={newIntProximo}
                        onChange={(e) => setNewIntProximo(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingInteraction || !newIntNota.trim()}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition flex items-center gap-1.5 text-xs shadow-md shadow-cyan-500/20 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {savingInteraction ? 'Guardando...' : 'Guardar Interacción'}
                    </button>
                  </div>
                </form>

                {/* RESUMEN DE ESTADO FINANCIERO EN HISTORIAL DE INTERACCIONES */}
                {clientCuotas.length > 0 && (() => {
                  const cuotasPagadas = clientCuotas.filter(c => c.estado === 'Cobrado');
                  const cuotasPendientes = clientCuotas.filter(c => c.estado !== 'Cobrado');
                  const totalPagadoUSD = cuotasPagadas.filter(c => c.moneda === 'USD').reduce((sum, c) => sum + (c.monto_pagado || c.monto_cuota), 0);
                  const totalPagadoARS = cuotasPagadas.filter(c => c.moneda === 'ARS').reduce((sum, c) => sum + (c.monto_pagado || c.monto_cuota), 0);
                  const totalPendienteUSD = cuotasPendientes.filter(c => c.moneda === 'USD').reduce((sum, c) => sum + c.monto_cuota, 0);
                  const totalPendienteARS = cuotasPendientes.filter(c => c.moneda === 'ARS').reduce((sum, c) => sum + c.monto_cuota, 0);

                  return (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-bold text-white">Estado Financiero en Historial: </span>
                          <span className="text-emerald-300 font-medium">
                            {cuotasPagadas.length} de {clientCuotas.length} cuotas cobradas ({totalPagadoUSD > 0 ? `$${totalPagadoUSD.toLocaleString()} USD` : `$${totalPagadoARS.toLocaleString()} ARS`} cancelados)
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[11px] text-amber-300">
                        Saldo pendiente: {totalPendienteUSD > 0 ? `$${totalPendienteUSD.toLocaleString()} USD` : `$${totalPendienteARS.toLocaleString()} ARS`}
                      </div>
                    </div>
                  );
                })()}

                {/* Timeline List of Past Interactions */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2 uppercase tracking-wider">
                    <History className="w-4 h-4 text-cyan-400" />
                    Historial Completo de Contactos ({getClientInteractions(editingCliente.id).length}):
                  </h4>

                  {getClientInteractions(editingCliente.id).length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      Aún no hay interacciones registradas para este cliente. Utiliza el formulario superior para agregar la primera nota.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {getClientInteractions(editingCliente.id).map(item => (
                        <div key={item.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30">
                              {item.tipo}
                            </span>
                            <span className="text-slate-400 font-mono">
                              📅 {new Date(item.fecha_contacto).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>

                          <p className="text-slate-200 text-xs leading-relaxed font-medium">
                            {item.nota}
                          </p>

                          {item.proximo_contacto && (
                            <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30 font-semibold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Próximo seguimiento programado: {new Date(item.proximo_contacto).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CRÉDITOS Y PAGARÉS DEL CLIENTE */}
            {modalTab === 'pagares' && editingCliente && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" /> Estado Financiero & Pagarés Físicos
                    </h4>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Créditos otorgados y seguimiento integral de cobranza de {getClienteFullName(editingCliente)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg font-bold text-xs">
                      Total Pagarés: {clientCuotas.length}
                    </span>
                  </div>
                </div>

                {/* RESUMEN FINANCIERO Y DASHBOARD DE SEGUIMIENTO */}
                {clientCuotas.length > 0 && (() => {
                  const cuotasPagadas = clientCuotas.filter(c => c.estado === 'Cobrado');
                  const cuotasPendientes = clientCuotas.filter(c => c.estado === 'Pendiente');
                  const cuotasVencidas = clientCuotas.filter(c => c.estado === 'Vencido');

                  const totalPagadoARS = cuotasPagadas.filter(c => c.moneda === 'ARS').reduce((sum, c) => sum + (c.monto_pagado || c.monto_cuota), 0);
                  const totalPagadoUSD = cuotasPagadas.filter(c => c.moneda === 'USD').reduce((sum, c) => sum + (c.monto_pagado || c.monto_cuota), 0);

                  const totalDeudaPendienteARS = clientCuotas.filter(c => c.estado !== 'Cobrado' && c.moneda === 'ARS').reduce((sum, c) => sum + c.monto_cuota, 0);
                  const totalDeudaPendienteUSD = clientCuotas.filter(c => c.moneda === 'USD' && c.estado !== 'Cobrado').reduce((sum, c) => sum + c.monto_cuota, 0);

                  const prestamoPrincipal = clientPrestamos[0];
                  const montoTotalPrestado = prestamoPrincipal?.monto_total_prestado || (clientCuotas.reduce((s, c) => s + c.monto_cuota, 0));
                  const cantidadCuotasTotal = prestamoPrincipal?.cantidad_cuotas || clientCuotas.length;

                  // Calculate Cuota Pura (Capital) vs Interes
                  const cuotaPuraEstimada = Math.round(montoTotalPrestado / (cantidadCuotasTotal || 1));
                  const cuotaTotalEjemplo = clientCuotas[0]?.monto_cuota || 0;
                  const interesEstimado = Math.max(0, cuotaTotalEjemplo - cuotaPuraEstimada);
                  const monedaSimbolo = clientCuotas[0]?.moneda === 'ARS' ? 'ARS ($)' : 'USD ($)';
                  const porcentajePagado = Math.round((cuotasPagadas.length / clientCuotas.length) * 100);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 shadow-inner">
                      {/* CARD 1: PAGADO / CANCELADO */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                        <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
                          <span className="flex items-center gap-1.5">✓ Pagado / Cancelado</span>
                          <span className="bg-emerald-950 px-2 py-0.5 rounded text-[10px] border border-emerald-500/30 font-mono">{porcentajePagado}%</span>
                        </div>
                        <div className="text-base font-black text-emerald-300 font-mono">
                          {totalPagadoUSD > 0 && <div>${totalPagadoUSD.toLocaleString('es-AR')} USD</div>}
                          {totalPagadoARS > 0 && <div>${totalPagadoARS.toLocaleString('es-AR')} ARS</div>}
                          {totalPagadoUSD === 0 && totalPagadoARS === 0 && <div>$0</div>}
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold">
                          {cuotasPagadas.length} de {clientCuotas.length} cuotas cobradas
                        </div>
                      </div>

                      {/* CARD 2: PENDIENTE / SALDO */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-500/30 space-y-1">
                        <div className="flex items-center justify-between text-amber-400 font-bold text-xs">
                          <span className="flex items-center gap-1.5">⌛ Saldo Adeudado</span>
                          <span className="bg-amber-950 px-2 py-0.5 rounded text-[10px] border border-amber-500/30 font-mono">{cuotasPendientes.length + cuotasVencidas.length} cuotas</span>
                        </div>
                        <div className="text-base font-black text-amber-300 font-mono">
                          {totalDeudaPendienteUSD > 0 && <div>${totalDeudaPendienteUSD.toLocaleString('es-AR')} USD</div>}
                          {totalDeudaPendienteARS > 0 && <div>${totalDeudaPendienteARS.toLocaleString('es-AR')} ARS</div>}
                          {totalDeudaPendienteUSD === 0 && totalDeudaPendienteARS === 0 && <div>$0 (Al día)</div>}
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold">
                          {cuotasVencidas.length > 0 ? (
                            <span className="text-red-400 font-bold">⚠️ {cuotasVencidas.length} cuota(s) en mora</span>
                          ) : (
                            <span className="text-emerald-400">✓ Sin mora registrada</span>
                          )}
                        </div>
                      </div>

                      {/* CARD 3: ESTRUCTURA DE CUOTA (PURAS VS INTERÉS) */}
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-cyan-500/30 space-y-1 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between text-cyan-400 font-bold text-xs">
                          <span>Estructura Cuota Mensual</span>
                          <span className="text-slate-300 font-mono text-[10px]">{monedaSimbolo}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">Cuota Pura</span>
                            <span className="font-mono font-bold text-cyan-300 text-[11px]">${cuotaPuraEstimada.toLocaleString('es-AR')}</span>
                          </div>
                          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">Interés</span>
                            <span className="font-mono font-bold text-indigo-300 text-[11px]">${interesEstimado.toLocaleString('es-AR')}</span>
                          </div>
                          <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                            <span className="block text-[9px] font-bold text-emerald-400 uppercase">Total</span>
                            <span className="font-mono font-bold text-emerald-400 text-[11px]">${cuotaTotalEjemplo.toLocaleString('es-AR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {clientCuotas.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500">
                    <CreditCard className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-slate-300">Este cliente no posee préstamos activos o pagarés registrados.</p>
                    <p className="text-slate-400 text-xs mt-1">Puedes otorgar un crédito desde la pestaña Pagarés del menú principal.</p>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Pagaré Nº</th>
                          <th className="py-2.5 px-3">Cuota</th>
                          <th className="py-2.5 px-3">Fecha Otorgamiento</th>
                          <th className="py-2.5 px-3">Fecha Vencimiento</th>
                          <th className="py-2.5 px-3">Monto & Desglose (Pura / Interés)</th>
                          <th className="py-2.5 px-3">Estado / Forma de Pago</th>
                          <th className="py-2.5 px-3 text-right">Editar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {clientCuotas.map((c) => {
                          const montoPrestadoTotal = c.prestamo?.monto_total_prestado || (c.monto_cuota * 12);
                          const cantCuotasTotal = c.prestamo?.cantidad_cuotas || 12;
                          const cuotaPura = Math.round(montoPrestadoTotal / cantCuotasTotal);
                          const interes = Math.max(0, c.monto_cuota - cuotaPura);

                          return (
                            <tr key={c.id} className="hover:bg-slate-900/40">
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">
                                {c.numero_pagare || `PAG-${String(c.numero_cuota).padStart(4, '0')}`}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-300">
                                Cuota {c.numero_cuota} de {cantCuotasTotal}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-300">
                                {formatDateAR(c.prestamo?.fecha_otorgamiento)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-200 font-mono font-bold">
                                {formatDateAR(c.fecha_vencimiento)}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-black text-emerald-400 flex items-center gap-1">
                                  <span className="text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                                    {c.moneda === 'ARS' ? 'ARS ($)' : 'USD ($)'}
                                  </span>
                                  <span>{c.monto_cuota?.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 space-x-1.5 mt-0.5 font-normal">
                                  <span>Pura: <strong className="text-cyan-300 font-mono">${cuotaPura.toLocaleString('es-AR')}</strong></span>
                                  <span>Int: <strong className="text-indigo-300 font-mono">${interes.toLocaleString('es-AR')}</strong></span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                {c.estado === 'Cobrado' ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                                      ✓ Cobrado
                                    </span>
                                    {c.fecha_pago && (
                                      <div className="text-[10px] text-slate-300 font-mono">
                                        📅 Pago: {formatDateAR(c.fecha_pago)}
                                      </div>
                                    )}
                                    {c.comprobante_pago && (
                                      <div className="text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold truncate max-w-[160px]" title={c.comprobante_pago}>
                                        💳 {c.comprobante_pago}
                                      </div>
                                    )}
                                  </div>
                                ) : c.estado === 'Vencido' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-bold animate-pulse">
                                    ⚠ Vencido en Mora
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                                    Pendiente
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCuotaFromProfile(c);
                                    setProfileEditForm({
                                      numero_pagare: c.numero_pagare || `PAG-${String(c.numero_cuota).padStart(4, '0')}`,
                                      fecha_vencimiento: c.fecha_vencimiento.split('T')[0],
                                      monto_cuota: c.monto_cuota || 0,
                                      estado: c.estado || 'Pendiente',
                                      observaciones: c.observaciones || '',
                                      comprobante_pago: c.comprobante_pago || '',
                                      fecha_pago: c.fecha_pago ? c.fecha_pago.split('T')[0] : '',
                                      monto_pagado: c.monto_pagado || c.monto_cuota || 0
                                    });
                                  }}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 rounded-lg transition font-bold text-[11px] cursor-pointer"
                                >
                                  ✏️ Editar Pagaré
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPRESS PARA EDITAR PAGARÉ DESDE LA FICHA DEL CLIENTE */}
      {editingCuotaFromProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              ✏️ Editar Pagaré (Cuota {editingCuotaFromProfile.numero_cuota})
            </h3>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await dataService.updateCuotaDetails(editingCuotaFromProfile.id, {
                    numero_pagare: profileEditForm.numero_pagare,
                    fecha_vencimiento: profileEditForm.fecha_vencimiento,
                    monto_cuota: Number(profileEditForm.monto_cuota),
                    estado: profileEditForm.estado,
                    observaciones: profileEditForm.observaciones,
                    comprobante_pago: profileEditForm.comprobante_pago,
                    fecha_pago: profileEditForm.fecha_pago || (profileEditForm.estado === 'Cobrado' ? new Date().toISOString() : undefined),
                    monto_pagado: profileEditForm.monto_pagado ? Number(profileEditForm.monto_pagado) : Number(profileEditForm.monto_cuota)
                  });
                  setEditingCuotaFromProfile(null);
                  if (editingCliente) {
                    await loadClientLoans(editingCliente.id);
                  }
                } catch (err) {
                  console.error('Error guardando cambios del pagaré:', err);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nº Pagaré Físico (Registro Argentina)</label>
                <input
                  type="text"
                  required
                  value={profileEditForm.numero_pagare}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, numero_pagare: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Monto del Pagaré</label>
                <input
                  type="number"
                  required
                  value={profileEditForm.monto_cuota}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, monto_cuota: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  required
                  value={profileEditForm.fecha_vencimiento}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, fecha_vencimiento: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Estado / Semáforo</label>
                <select
                  value={profileEditForm.estado}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, estado: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold text-xs"
                >
                  <option value="Pendiente">Pendiente (A vencer)</option>
                  <option value="Vencido">Vencido en Mora (Semáforo Rojo)</option>
                  <option value="Cobrado">Cobrado (Semáforo Verde)</option>
                </select>
              </div>

              {profileEditForm.estado === 'Cobrado' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-3">
                  <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    💳 Datos del Recibo / Forma de Pago
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Forma de Pago / Comprobante</label>
                    <input
                      type="text"
                      placeholder="Ej: Transferencia Banco Galicia, Efectivo REC-9942"
                      value={profileEditForm.comprobante_pago}
                      onChange={(e) => setProfileEditForm({ ...profileEditForm, comprobante_pago: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Fecha de Pago</label>
                      <input
                        type="date"
                        value={profileEditForm.fecha_pago}
                        onChange={(e) => setProfileEditForm({ ...profileEditForm, fecha_pago: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Monto Pagado</label>
                      <input
                        type="number"
                        value={profileEditForm.monto_pagado}
                        onChange={(e) => setProfileEditForm({ ...profileEditForm, monto_pagado: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Notas de cobro o refinanciación..."
                  value={profileEditForm.observaciones}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, observaciones: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCuotaFromProfile(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP POPUP */}
      {activeClienteForWsp && (
        <WhatsAppModal
          isOpen={wspModalOpen}
          onClose={() => setWspModalOpen(false)}
          clienteNombre={getClienteFullName(activeClienteForWsp)}
          clienteTelefono={activeClienteForWsp.telefono}
          defaultTemplateType="cotizacion"
        />
      )}

      {/* DNI PDF417 SCANNER MODAL */}
      <DniScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScanSuccess={handleDniScanned}
        onManualModeToggle={() => {
          setIsDniManualMode(true);
          setModalOpen(true);
        }}
      />
    </div>
  );
};
