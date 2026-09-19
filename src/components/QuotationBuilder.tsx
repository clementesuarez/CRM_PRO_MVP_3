import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Car,
  User,
  DollarSign,
  ArrowRight,
  Check,
  Copy,
  RefreshCw,
  FileText,
  Plus,
  ShieldCheck,
  Printer,
  Sparkles,
  MessageSquare,
  Edit3,
  Lock,
  Scan
} from 'lucide-react';
import { Cliente, Inventario, Permuta, Presupuesto, PresupuestoVehiculoItem, TipoMoneda } from '../types/crm';
import { WhatsAppModal } from './WhatsAppModal';
import { VehicleAutocomplete } from './VehicleAutocomplete';
import { DniScannerModal } from './DniScannerModal';
import { DniParsedResult } from '../utils/dniParser';
import { CatalogoVehiculoItem } from '../data/catalogoVehicular';
import { flexSearchMatch } from '../utils/searchHelper';

interface QuotationBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  inventario: Inventario[];
  presupuestoToEdit?: Presupuesto | null;
  onSaveQuotation: (
    presupuesto: {
      id?: string;
      cliente_id: string;
      vehiculo_id?: string;
      vehiculos_cotizados?: PresupuestoVehiculoItem[];
      moneda: TipoMoneda;
      precio_ofrecido: number;
      anticipo: number;
      saldo_financiado: number;
      estado: 'Borrador' | 'Enviado';
    },
    permuta?: Omit<Permuta, 'id' | 'presupuesto_id'>,
    nuevoCliente?: Omit<Cliente, 'id' | 'created_at'>
  ) => Promise<Presupuesto>;
}

interface ItemizedCostState {
  precio_individual: number;
  forma_pago: 'Efectivo' | 'Permuta' | 'Financiado';
}

export const QuotationBuilder: React.FC<QuotationBuilderProps> = ({
  isOpen,
  onClose,
  clientes,
  inventario,
  presupuestoToEdit,
  onSaveQuotation,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Cliente State
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [isNewCliente, setIsNewCliente] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newDocumento, setNewDocumento] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLocalidad, setNewLocalidad] = useState('');
  const [clientScannerOpen, setClientScannerOpen] = useState(false);

  const handleClientDniScanned = (data: DniParsedResult) => {
    setNewNombre(data.nombre);
    setNewApellido(data.apellido);
    setNewDocumento(data.documento_formateado || data.numero_documento);
    setIsNewCliente(true);
  };

  // Stock Multi-Vehicle State
  const [vehiculoSearch, setVehiculoSearch] = useState('');
  const [selectedVehiculoIds, setSelectedVehiculoIds] = useState<string[]>([]);
  const [itemizedDetails, setItemizedDetails] = useState<Record<string, ItemizedCostState>>({});

  // Currency & Financial Breakdown State
  const [moneda, setMoneda] = useState<TipoMoneda>('USD');
  const [precioOfrecido, setPrecioOfrecido] = useState<number>(0);
  const [anticipo, setAnticipo] = useState<number>(0);

  // Permuta (Trade-in) State
  const [hasPermuta, setHasPermuta] = useState(false);
  const [permutaManualMode, setPermutaManualMode] = useState(false);
  const [permutaPatente, setPermutaPatente] = useState('');
  const [permutaMarca, setPermutaMarca] = useState('');
  const [permutaModelo, setPermutaModelo] = useState('');
  const [permutaVersion, setPermutaVersion] = useState('');
  const [permutaMarcaModelo, setPermutaMarcaModelo] = useState('');
  const [permutaAnio, setPermutaAnio] = useState<number>(new Date().getFullYear() - 5);
  const [permutaKm, setPermutaKm] = useState<number>(80000);
  const [permutaValorTasacion, setPermutaValorTasacion] = useState<number>(0);
  const [permutaNotas, setPermutaNotas] = useState('');
  const [showCatalogoQuoteSelector, setShowCatalogoQuoteSelector] = useState(false);

  // Export & WhatsApp Modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [savedPresupuesto, setSavedPresupuesto] = useState<Presupuesto | null>(null);
  const [wspModalOpen, setWspModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Strict available vehicles filter: exclude Vendido and Reacondicionamiento
  const availableVehicles = useMemo(() => {
    return inventario.filter(v => {
      const est = (v.estado || '').toLowerCase();
      return est === 'disponible' || est === 'reservado';
    });
  }, [inventario]);

  // Pre-fill fields when editing an existing quotation draft
  useEffect(() => {
    if (isOpen && presupuestoToEdit) {
      setSelectedClienteId(presupuestoToEdit.cliente_id);

      if (presupuestoToEdit.vehiculos_cotizados && presupuestoToEdit.vehiculos_cotizados.length > 0) {
        const ids = presupuestoToEdit.vehiculos_cotizados.map(i => i.vehiculo_id);
        setSelectedVehiculoIds(ids);
        const detailsMap: Record<string, ItemizedCostState> = {};
        presupuestoToEdit.vehiculos_cotizados.forEach(item => {
          detailsMap[item.vehiculo_id] = {
            precio_individual: item.precio_individual,
            forma_pago: item.forma_pago || 'Efectivo',
          };
        });
        setItemizedDetails(detailsMap);
      } else if (presupuestoToEdit.vehiculo_id) {
        setSelectedVehiculoIds([presupuestoToEdit.vehiculo_id]);
        setItemizedDetails({
          [presupuestoToEdit.vehiculo_id]: {
            precio_individual: presupuestoToEdit.precio_ofrecido,
            forma_pago: presupuestoToEdit.permuta ? 'Permuta' : 'Efectivo',
          }
        });
      }

      setMoneda(presupuestoToEdit.moneda || 'USD');
      setPrecioOfrecido(presupuestoToEdit.precio_ofrecido);
      setAnticipo(presupuestoToEdit.anticipo);

      if (presupuestoToEdit.permuta) {
        setHasPermuta(true);
        setPermutaPatente(presupuestoToEdit.permuta.patente || '');
        setPermutaMarca(presupuestoToEdit.permuta.marca || '');
        setPermutaModelo(presupuestoToEdit.permuta.modelo || '');
        setPermutaVersion(presupuestoToEdit.permuta.version || '');
        setPermutaMarcaModelo(presupuestoToEdit.permuta.marca_modelo || '');
        setPermutaAnio(presupuestoToEdit.permuta.anio);
        setPermutaKm(presupuestoToEdit.permuta.kilometraje);
        setPermutaValorTasacion(presupuestoToEdit.permuta.valor_tasacion);
        setPermutaNotas(presupuestoToEdit.permuta.observaciones || '');
      } else {
        setHasPermuta(false);
        setPermutaMarca('');
        setPermutaModelo('');
        setPermutaVersion('');
        setPermutaMarcaModelo('');
      }
    } else if (isOpen && !presupuestoToEdit) {
      // Reset form for new quote
      setSelectedClienteId('');
      setSelectedVehiculoIds([]);
      setItemizedDetails({});
      setPrecioOfrecido(0);
      setAnticipo(0);
      setHasPermuta(false);
      setPermutaMarca('');
      setPermutaModelo('');
      setPermutaVersion('');
      setPermutaMarcaModelo('');
      setNewNombre('');
      setNewApellido('');
      setNewDocumento('');
      setNewTelefono('');
      setNewEmail('');
      setNewLocalidad('');
      setIsNewCliente(false);
    }
  }, [isOpen, presupuestoToEdit]);

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => {
      const fullText = `${c.nombre} ${c.apellido || ''} ${c.numero_documento || ''} ${c.telefono} ${c.email || ''}`;
      return flexSearchMatch(fullText, clienteSearch);
    });
  }, [clientes, clienteSearch]);

  const filteredVehicles = useMemo(() => {
    return availableVehicles.filter(v => {
      const fullText = `${v.marca} ${v.modelo} ${v.patente || ''} ${v.anio} ${v.observaciones || ''}`;
      return flexSearchMatch(fullText, vehiculoSearch);
    });
  }, [availableVehicles, vehiculoSearch]);

  const selectedVehicles = useMemo(() => {
    return availableVehicles.filter(v => selectedVehiculoIds.includes(v.id));
  }, [availableVehicles, selectedVehiculoIds]);

  // Security Enforcement: Lock quotation currency strictly to vehicle inventory currency
  useEffect(() => {
    if (selectedVehicles.length > 0 && selectedVehicles[0].moneda) {
      setMoneda(selectedVehicles[0].moneda);
    }
  }, [selectedVehicles]);

  const selectedCliente = clientes.find(c => c.id === selectedClienteId);

  const handleToggleVehiculo = (vehiculo: Inventario) => {
    const isSelected = selectedVehiculoIds.includes(vehiculo.id);
    let nextIds: string[];

    if (isSelected) {
      nextIds = selectedVehiculoIds.filter(id => id !== vehiculo.id);
    } else {
      nextIds = [...selectedVehiculoIds, vehiculo.id];
    }
    setSelectedVehiculoIds(nextIds);

    const nextDetails = { ...itemizedDetails };
    if (!isSelected) {
      nextDetails[vehiculo.id] = {
        precio_individual: vehiculo.precio_lista,
        forma_pago: hasPermuta ? 'Permuta' : 'Efectivo',
      };
    } else {
      delete nextDetails[vehiculo.id];
    }
    setItemizedDetails(nextDetails);

    const nextVehicles = availableVehicles.filter(v => nextIds.includes(v.id));
    const totalPrice = nextVehicles.reduce((sum, v) => {
      const p = nextDetails[v.id]?.precio_individual ?? v.precio_lista;
      return sum + p;
    }, 0);

    setPrecioOfrecido(totalPrice);
    setAnticipo(Math.round(totalPrice * 0.4));
    if (nextVehicles.length > 0 && nextVehicles[0].moneda) {
      setMoneda(nextVehicles[0].moneda);
    }
  };

  const handleUpdateItemizedCost = (
    vId: string,
    newPrecio?: number,
    newForma?: 'Efectivo' | 'Permuta' | 'Financiado'
  ) => {
    setItemizedDetails(prev => {
      const current = prev[vId] || { precio_individual: 0, forma_pago: 'Efectivo' };
      const updated: ItemizedCostState = {
        precio_individual: newPrecio !== undefined ? newPrecio : current.precio_individual,
        forma_pago: newForma !== undefined ? newForma : current.forma_pago,
      };
      const nextState = { ...prev, [vId]: updated };

      // Recalculate sum of individual costs
      const totalSum = selectedVehicles.reduce((sum, v) => {
        const itemP = nextState[v.id]?.precio_individual ?? v.precio_lista;
        return sum + itemP;
      }, 0);

      setPrecioOfrecido(totalSum);
      setAnticipo(Math.round(totalSum * 0.4));

      // Auto turn on hasPermuta if any vehicle is selected with Permuta mode
      const anyPermuta = Object.values(nextState).some(item => item.forma_pago === 'Permuta');
      if (anyPermuta && !hasPermuta) {
        setHasPermuta(true);
      }

      return nextState;
    });
  };

  const saldoFinanciado = Math.max(
    0,
    precioOfrecido - anticipo - (hasPermuta ? permutaValorTasacion : 0)
  );

  if (!isOpen) return null;

  const handleSave = async (estadoTarget: 'Borrador' | 'Enviado') => {
    if (!isNewCliente && !selectedClienteId) {
      alert('Por favor selecciona un cliente existente o crea uno nuevo.');
      return;
    }
    if (isNewCliente && (!newNombre || !newTelefono)) {
      alert('Por favor completa el nombre y teléfono del nuevo cliente.');
      return;
    }
    if (selectedVehiculoIds.length === 0) {
      alert('Por favor selecciona al menos un vehículo de stock.');
      return;
    }

    setLoading(true);

    try {
      let nuevoClienteObj = undefined;
      if (isNewCliente) {
        nuevoClienteObj = {
          nombre: newNombre.trim(),
          apellido: newApellido.trim() || undefined,
          telefono: newTelefono.trim(),
          email: newEmail.trim() || undefined,
          numero_documento: newDocumento.trim() || undefined,
          localidad: newLocalidad.trim() || undefined,
          tipo_cliente: 'Prospecto' as const,
        };
      }

      let permutaObj = undefined;
      if (hasPermuta) {
        permutaObj = {
          patente: permutaPatente.toUpperCase().trim() || undefined,
          marca: permutaMarca.trim() || undefined,
          modelo: permutaModelo.trim() || undefined,
          version: permutaVersion.trim() || undefined,
          marca_modelo: `${permutaMarca} ${permutaModelo} ${permutaVersion}`.trim() || permutaMarcaModelo.trim(),
          anio: Number(permutaAnio),
          kilometraje: Number(permutaKm),
          moneda,
          valor_tasacion: Number(permutaValorTasacion),
          observaciones: permutaNotas.trim() || undefined,
        };
      }

      const vehiculosCotizadosPayload: PresupuestoVehiculoItem[] = selectedVehicles.map(v => {
        const detail = itemizedDetails[v.id] || { precio_individual: v.precio_lista, forma_pago: 'Efectivo' };
        return {
          vehiculo_id: v.id,
          marca_modelo: `${v.marca} ${v.modelo}`,
          precio_individual: Number(detail.precio_individual),
          forma_pago: detail.forma_pago,
        };
      });

      const result = await onSaveQuotation(
        {
          id: presupuestoToEdit?.id,
          cliente_id: selectedClienteId,
          vehiculo_id: selectedVehiculoIds[0],
          vehiculos_cotizados: vehiculosCotizadosPayload,
          moneda,
          precio_ofrecido: Number(precioOfrecido),
          anticipo: Number(anticipo),
          saldo_financiado: Number(saldoFinanciado),
          estado: estadoTarget,
        },
        permutaObj,
        nuevoClienteObj
      );

      setSavedPresupuesto(result);
      setExportModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppSummaryText = () => {
    const clienteName = isNewCliente ? newNombre : selectedCliente?.nombre;
    const currSymbol = moneda === 'USD' ? '$ USD' : '$ ARS';

    const itemsFormatted = selectedVehicles.map(v => {
      const detail = itemizedDetails[v.id] || { precio_individual: v.precio_lista, forma_pago: 'Efectivo' };
      return `🚗 *${v.marca} ${v.modelo} (${v.anio})*\n   • Monto Cotizado: ${detail.precio_individual.toLocaleString()} ${currSymbol}\n   • Forma de Pago: ${detail.forma_pago}`;
    }).join('\n\n');

    return `📌 *PRESUPUESTO AGENCIA AUTOMOTOR*
----------------------------------------
👤 *Cliente:* ${clienteName}

🚘 *DETALLE DE VEHÍCULO(S) COTIZADO(S):*
${itemsFormatted || '• Vehículo Cotizado'}

----------------------------------------
💰 *PRECIO TOTAL OFRECIDO:* ${precioOfrecido.toLocaleString()} ${currSymbol}
💵 *Anticipo en Efectivo:* ${anticipo.toLocaleString()} ${currSymbol}
${hasPermuta ? `🔄 *Toma Usado (${permutaMarcaModelo}):* ${permutaValorTasacion.toLocaleString()} ${currSymbol}\n` : ''}🏦 *SALDO FINAL A FINANCIAR:* ${saldoFinanciado.toLocaleString()} ${currSymbol}
----------------------------------------
_Cotización válida por 7 días. ¡Consultanos por entrega inmediata!_`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateWhatsAppSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700/80 p-6 shadow-2xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black">
              {presupuestoToEdit ? <Edit3 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100">
                {presupuestoToEdit ? 'Editar Cotización / Borrador' : 'Cotizador Rápido & Permuta'}
              </h2>
              <p className="text-xs text-slate-400">
                {presupuestoToEdit ? `Modificando presupuesto para ${selectedCliente?.nombre || 'Cliente'}` : 'Genera una propuesta comercial profesional en menos de 1 minuto'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${step === 1 ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/30 flex items-center justify-center text-[10px]">1</span>
            Cliente & Auto(s) en Stock ({selectedVehiculoIds.length})
          </button>

          <div className="h-0.5 w-8 bg-slate-800"></div>

          <button
            onClick={() => {
              if (selectedVehiculoIds.length > 0) setStep(2);
            }}
            disabled={selectedVehiculoIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${step === 2 ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 disabled:opacity-40'
              }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/30 flex items-center justify-center text-[10px]">2</span>
            Costos por Auto & Estructura Financiera
          </button>
        </div>

        {/* STEP 1: CLIENTE & VEHÍCULOS */}
        {step === 1 && (
          <div className="space-y-6">
            {/* SECCIÓN CLIENTE */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  1. Selección de Cliente
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setClientScannerOpen(true)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                    title="Escanear DNI argentino (Lector USB o Cámara)"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    Escanear DNI
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewCliente(!isNewCliente)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-4"
                  >
                    {isNewCliente ? '← Elegir Cliente Existente' : '+ Carga Manual'}
                  </button>
                </div>
              </div>

              {isNewCliente ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Nombre *</label>
                    <input
                      type="text"
                      placeholder="Ej: Carlos"
                      value={newNombre}
                      onChange={(e) => setNewNombre(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Apellido</label>
                    <input
                      type="text"
                      placeholder="Ej: Rodríguez"
                      value={newApellido}
                      onChange={(e) => setNewApellido(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">DNI / CUIT</label>
                    <input
                      type="text"
                      placeholder="Ej: 34567890"
                      value={newDocumento}
                      onChange={(e) => setNewDocumento(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Teléfono (WhatsApp) *</label>
                    <input
                      type="text"
                      placeholder="Ej: +54 9 11 9988-7766"
                      value={newTelefono}
                      onChange={(e) => setNewTelefono(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Email (Opcional)</label>
                    <input
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Localidad / Ciudad</label>
                    <input
                      type="text"
                      placeholder="Ej: Ramos Mejía, BA"
                      value={newLocalidad}
                      onChange={(e) => setNewLocalidad(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Búsqueda predictiva (ej: 'benitez', '115544', 'carlos')..."
                      value={clienteSearch}
                      onChange={(e) => setClienteSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {filteredClientes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedClienteId(c.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition text-xs ${selectedClienteId === c.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                      >
                        <div>
                          <div className="font-bold">{c.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{c.telefono}</div>
                        </div>
                        {selectedClienteId === c.id && <Check className="w-4 h-4 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN VEHÍCULOS EN STOCK (MULTI-SELECCIÓN) */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Car className="w-4 h-4 text-cyan-400" />
                  2. Selección de Auto(s) en Stock (Disponibles y Reservados)
                </label>
                <span className="text-[11px] text-cyan-300 font-bold">
                  Seleccionados: {selectedVehiculoIds.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Búsqueda predictiva en salón (ej: 'hilux', '208', 'AF123', 'amarok')..."
                    value={vehiculoSearch}
                    onChange={(e) => setVehiculoSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCatalogoQuoteSelector(!showCatalogoQuoteSelector)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    showCatalogoQuoteSelector
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showCatalogoQuoteSelector ? 'Ocultar Catálogo' : 'Catálogo DNRPA'}</span>
                </button>
              </div>

              {showCatalogoQuoteSelector && (
                <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-500/30 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Buscar modelo en Catálogo DNRPA para cotizar
                    </span>
                    <span className="text-[10px] text-slate-400">Agrega la unidad aunque no esté en el stock actual</span>
                  </div>
                  <VehicleAutocomplete
                    placeholder="Escribe para buscar en catálogo oficial (ej: Amarok V6, Hilux SRX, Cronos, 208 GT...)"
                    onSelect={(item) => {
                      const customId = 'cat_' + item.id + '_' + Date.now();
                      const customVehiculo: Inventario = {
                        id: customId,
                        patente: '0KM CATÁLOGO',
                        marca: item.marca,
                        modelo: item.modelo,
                        version: item.version_completa,
                        catalogo_id: item.id,
                        anio: item.anios_disponibles ? item.anios_disponibles[item.anios_disponibles.length - 1] : new Date().getFullYear(),
                        kilometraje: 0,
                        es_cero_km: true,
                        moneda: 'USD',
                        precio_lista: 22000,
                        costo_compra: 18000,
                        tipo_vehiculo: item.tipo,
                        estado: 'Disponible',
                        observaciones: `Cotizado desde catálogo oficial DNRPA: ${item.origen}`,
                        created_at: new Date().toISOString()
                      };
                      inventario.push(customVehiculo);
                      handleToggleVehiculo(customVehiculo);
                      setShowCatalogoQuoteSelector(false);
                    }}
                    onManualToggle={() => setShowCatalogoQuoteSelector(false)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredVehicles.length === 0 ? (
                  <div className="col-span-2 p-4 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                    <p className="text-xs text-slate-400">
                      No se encontraron autos en stock disponible con el término <span className="text-cyan-300 font-bold">"{vehiculoSearch}"</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const customId = 'temp_' + Date.now();
                        const parts = vehiculoSearch.split(' ');
                        const marca = parts[0] || 'Auto';
                        const modelo = parts.slice(1).join(' ') || 'Especial';

                        const customVehiculo: Inventario = {
                          id: customId,
                          patente: 'CONSULTA',
                          marca,
                          modelo,
                          anio: 2024,
                          kilometraje: 0,
                          es_cero_km: true,
                          moneda: 'USD',
                          precio_lista: 15000,
                          costo_compra: 10000,
                          estado: 'Disponible',
                          observaciones: 'Ingresado para cotización especial',
                          created_at: new Date().toISOString()
                        };
                        inventario.push(customVehiculo);
                        handleToggleVehiculo(customVehiculo);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500 hover:text-slate-950 transition"
                    >
                      + Usar "{vehiculoSearch || 'Vehículo Especial'}" para Cotizar
                    </button>
                  </div>
                ) : (
                  filteredVehicles.map((v) => {
                    const isSelected = selectedVehiculoIds.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleToggleVehiculo(v)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition text-xs ${isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              {v.marca} {v.modelo}
                              {v.es_cero_km && <span className="bg-cyan-400/20 text-cyan-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded">0KM</span>}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Año: {v.anio} | Km: {v.kilometraje.toLocaleString()} | Patente: <span className="font-mono">{v.patente || 'S/D'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-emerald-400 text-sm flex items-center justify-end gap-1 font-mono">
                            <span className="bg-slate-800 border border-slate-700 text-[10px] text-slate-300 px-1.5 py-0.5 rounded font-mono">
                              {v.moneda === 'USD' ? 'USD' : '$ ARS'}
                            </span>
                            <span>{v.precio_lista.toLocaleString()}</span>
                          </div>
                          {isSelected && <span className="text-[10px] text-cyan-400 font-bold">✓ Cotizado</span>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Next Step Action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={selectedVehiculoIds.length === 0 || (!isNewCliente && !selectedClienteId)}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-40"
              >
                Siguiente: Costos por Auto ({selectedVehiculoIds.length} Auto/s)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FINANCIERA & COSTOS POR AUTO */}
        {step === 2 && (
          <div className="space-y-6">

            {/* ITEMIZED VEHICLES BREAKDOWN & PAYMENT MODES */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-2 uppercase tracking-wider">
                  <Car className="w-4 h-4 text-cyan-400" />
                  Costos e Identificación de Forma de Pago por Auto ({selectedVehicles.length}):
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  + Agregar / Modificar Autos
                </button>
              </div>

              <div className="space-y-3">
                {selectedVehicles.map(v => {
                  const detail = itemizedDetails[v.id] || { precio_individual: v.precio_lista, forma_pago: 'Efectivo' };
                  return (
                    <div key={v.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                            <span>{v.marca} {v.modelo} ({v.anio})</span>
                            <span className="bg-cyan-500/20 text-cyan-300 font-mono text-[10px] px-2 py-0.5 rounded border border-cyan-500/30">
                              Patente: {v.patente || 'S/D'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Precio de Lista Orig: <span className="font-semibold text-slate-300 font-mono">{v.moneda === 'USD' ? 'USD ' : '$ '}{v.precio_lista.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Moneda & Individual Amount Input */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700">
                            <span className="text-[11px] font-extrabold text-cyan-400 font-mono">{v.moneda === 'USD' ? 'USD' : '$ ARS'}</span>
                            <input
                              type="number"
                              value={detail.precio_individual}
                              onChange={(e) => handleUpdateItemizedCost(v.id, Number(e.target.value), undefined)}
                              className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-emerald-400 focus:outline-none focus:border-cyan-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment mode selector for this vehicle */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                        <span className="text-[11px] font-semibold text-slate-400">Forma de Pago para este vehículo:</span>
                        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemizedCost(v.id, undefined, 'Efectivo')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${detail.forma_pago === 'Efectivo' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                              }`}
                          >
                            💵 Paga en Efectivo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemizedCost(v.id, undefined, 'Permuta')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${detail.forma_pago === 'Permuta' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                              }`}
                          >
                            🔄 Permuta
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemizedCost(v.id, undefined, 'Financiado')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${detail.forma_pago === 'Financiado' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                              }`}
                          >
                            🏦 Financiado
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CURRENCY SELECTOR & FINANCIAL INPUTS */}
            <div className="space-y-3">
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Moneda de Cotización Protegida por Seguridad
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Fijada automáticamente desde la Ficha de Inventario del vehículo para prevenir confusiones cambiarias ($ / USD).
                  </p>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs flex items-center gap-2 font-mono shadow-md shrink-0">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{moneda === 'USD' ? 'USD (Dólares Estadounidenses)' : '$ ARS (Pesos Argentinos)'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Precio Acordado Total
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-bold text-xs font-mono">{moneda === 'USD' ? 'USD' : '$ ARS'}</span>
                    <input
                      type="number"
                      value={precioOfrecido}
                      onChange={(e) => setPrecioOfrecido(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-14 pr-3 py-2.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Anticipo en Mano
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-bold text-xs font-mono">{moneda === 'USD' ? 'USD' : '$ ARS'}</span>
                    <input
                      type="number"
                      value={anticipo}
                      onChange={(e) => setAnticipo(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-14 pr-3 py-2.5 text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-cyan-500/40 text-right">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Saldo a Financiar Resultante
                  </label>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {moneda === 'USD' ? 'USD ' : '$ '}{saldoFinanciado.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* REACTIVE TRADE-IN TOGGLE (PERMUTA) */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">¿Entrega auto usado como permuta?</span>
                </div>

                <button
                  type="button"
                  onClick={() => setHasPermuta(!hasPermuta)}
                  className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${hasPermuta ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md"></span>
                </button>
              </div>

              {hasPermuta && (
                <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-fade-in">
                  {/* BÚSQUEDA DNRPA PARA UNIDAD EN PERMUTA */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Autocompletar Unidad en Permuta desde Catálogo DNRPA
                      </span>
                      <button
                        type="button"
                        onClick={() => setPermutaManualMode(!permutaManualMode)}
                        className="text-[10px] text-slate-400 hover:text-amber-300 underline font-medium cursor-pointer"
                      >
                        {permutaManualMode ? '⚡ Usar Catálogo Predictivo' : '✏️ Cargar manualmente'}
                      </button>
                    </div>

                    {!permutaManualMode ? (
                      <VehicleAutocomplete
                        placeholder="Buscar marca y modelo del usado (ej: Cronos 1.3, Gol Trend, Hilux...)"
                        onSelect={(item) => {
                          setPermutaMarca(item.marca);
                          setPermutaModelo(item.modelo);
                          setPermutaVersion(item.version_completa);
                          setPermutaMarcaModelo(`${item.marca} ${item.version_completa}`);
                          if (item.anios_disponibles && item.anios_disponibles.length > 0) {
                            setPermutaAnio(item.anios_disponibles[item.anios_disponibles.length - 1]);
                          }
                        }}
                        onManualToggle={() => setPermutaManualMode(true)}
                      />
                    ) : (
                      <div className="text-[10px] text-amber-300 font-medium">
                        ✏️ Modo manual activo: escribe la marca, modelo y versión directamente en los campos inferiores.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Marca Usado *</label>
                      <input
                        type="text"
                        placeholder="Ej: Volkswagen"
                        value={permutaMarca}
                        onChange={(e) => {
                          setPermutaMarca(e.target.value);
                          setPermutaMarcaModelo(`${e.target.value} ${permutaModelo} ${permutaVersion}`.trim());
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Modelo Usado *</label>
                      <input
                        type="text"
                        placeholder="Ej: Gol Trend"
                        value={permutaModelo}
                        onChange={(e) => {
                          setPermutaModelo(e.target.value);
                          setPermutaMarcaModelo(`${permutaMarca} ${e.target.value} ${permutaVersion}`.trim());
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Versión Usado</label>
                      <input
                        type="text"
                        placeholder="Ej: 1.6 MSI Trendline 5P"
                        value={permutaVersion}
                        onChange={(e) => {
                          setPermutaVersion(e.target.value);
                          setPermutaMarcaModelo(`${permutaMarca} ${permutaModelo} ${e.target.value}`.trim());
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Patente Usado</label>
                      <input
                        type="text"
                        placeholder="Ej: AB123CD"
                        value={permutaPatente}
                        onChange={(e) => setPermutaPatente(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Año Usado</label>
                      <input
                        type="number"
                        value={permutaAnio}
                        onChange={(e) => setPermutaAnio(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Kilometraje</label>
                      <input
                        type="number"
                        value={permutaKm}
                        onChange={(e) => setPermutaKm(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-300 mb-1">
                        Tasación de Toma ({moneda}) *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-amber-400 font-bold text-xs font-mono">${moneda}</span>
                        <input
                          type="number"
                          placeholder="Monto al que la agencia toma el vehículo"
                          value={permutaValorTasacion}
                          onChange={(e) => setPermutaValorTasacion(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-amber-500/50 rounded-xl pl-14 pr-3 py-2 text-sm font-extrabold text-amber-400 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Notas Mecánicas / Chapa</label>
                      <input
                        type="text"
                        placeholder="Ej: Rayón puerta trasera derecha, service hecho..."
                        value={permutaNotas}
                        onChange={(e) => setPermutaNotas(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                ← Volver a Paso 1
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave('Borrador')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                >
                  Guardar como Borrador
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave('Enviado')}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:from-cyan-400 hover:to-emerald-400 transition shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar y Exportar Presupuesto'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXPORT MODAL */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-cyan-500/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                ¡Presupuesto Guardado con Éxito!
              </h3>
              <button onClick={() => { setExportModalOpen(false); onClose(); }} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Copia el resumen o envíalo directamente por el Pop-up de WhatsApp:
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-200 whitespace-pre-wrap relative max-h-60 overflow-y-auto">
              {generateWhatsAppSummaryText()}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setWspModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500 hover:text-slate-950 transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                Pop-up WhatsApp
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                  {copied ? '¡Copiado!' : 'Copiar Texto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP MODAL POPUP */}
      <WhatsAppModal
        isOpen={wspModalOpen}
        onClose={() => setWspModalOpen(false)}
        clienteNombre={isNewCliente ? newNombre : selectedCliente?.nombre || 'Cliente'}
        clienteTelefono={isNewCliente ? newTelefono : selectedCliente?.telefono || ''}
        vehiculoNombre={selectedVehicles.map(v => `${v.marca} ${v.modelo}`).join(' + ')}
        precioFormatted={`${precioOfrecido.toLocaleString()} ${moneda}`}
        defaultTemplateType="cotizacion"
      />

      {/* DNI SCANNER MODAL */}
      <DniScannerModal
        isOpen={clientScannerOpen}
        onClose={() => setClientScannerOpen(false)}
        onScanSuccess={handleClientDniScanned}
        onManualModeToggle={() => {
          setClientScannerOpen(false);
          setIsNewCliente(true);
        }}
      />
    </div>
  );
};
