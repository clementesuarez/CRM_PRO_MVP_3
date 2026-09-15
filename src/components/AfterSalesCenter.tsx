import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Wrench, 
  KeyRound, 
  UserX, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Filter,
  Sparkles,
  Phone,
  Edit3,
  User,
  Eye,
  X,
  FileText,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { Cliente, Interaccion, Presupuesto, Inventario } from '../types/crm';

interface AfterSalesCenterProps {
  clientes: Cliente[];
  presupuestos: Presupuesto[];
  interacciones: Interaccion[];
  inventario: Inventario[];
  onOpenInteractionModal: (clienteId: string, clienteNombre: string) => void;
  onStartQuotationForClient?: (clienteId: string) => void;
  onViewClientProfile?: (clienteId: string) => void;
}

export const AfterSalesCenter: React.FC<AfterSalesCenterProps> = ({
  clientes,
  presupuestos,
  interacciones,
  inventario,
  onOpenInteractionModal,
  onStartQuotationForClient,
  onViewClientProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'urgentes' | 'service' | 'renovacion' | 'reactivacion'>('urgentes');
  const [selectedNote, setSelectedNote] = useState<{ clienteNombre: string; clienteId: string; nota: string; tipo: string; accion?: string; fecha?: string } | null>(null);
  const [viewMode, setViewMode] = useState<'tabla' | 'tarjetas'>('tabla');

  // Compute 1. Urgentes (Hoy / Esta semana)
  const listUrgentes = useMemo(() => {
    const now = new Date();
    return interacciones.filter(i => {
      if (!i.proximo_contacto) return false;
      const targetDate = new Date(i.proximo_contacto);
      const diffDays = (targetDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7; // Due within 7 days or overdue
    });
  }, [interacciones]);

  // Compute 2. Service 1 Año (Mes 11 a 13 post-entrega)
  const listService1Anio = useMemo(() => {
    const now = new Date();
    return presupuestos.filter(p => {
      if (p.estado.toLowerCase() !== 'ganado') return false;
      const dateGanado = new Date(p.created_at);
      const monthsDiff = (now.getFullYear() - dateGanado.getFullYear()) * 12 + (now.getMonth() - dateGanado.getMonth());
      return monthsDiff >= 11 && monthsDiff <= 13;
    });
  }, [presupuestos]);

  // Compute 3. Plan Renovación 2 Años (Mes 18 a 24 post-entrega)
  const listRenovacion2Anios = useMemo(() => {
    const now = new Date();
    return presupuestos.filter(p => {
      if (p.estado.toLowerCase() !== 'ganado') return false;
      const dateGanado = new Date(p.created_at);
      const monthsDiff = (now.getFullYear() - dateGanado.getFullYear()) * 12 + (now.getMonth() - dateGanado.getMonth());
      return monthsDiff >= 18 && monthsDiff <= 24;
    });
  }, [presupuestos]);

  // Compute 4. Reactivación de No Compradores (Presupuestos perdidos)
  const listReactivacion = useMemo(() => {
    return presupuestos.filter(p => p.estado.toLowerCase() === 'perdido');
  }, [presupuestos]);

  const latestStockVehicle = inventario.find(v => v.estado.toLowerCase() === 'disponible');

  const handleSendWhatsAppCampaign = (clienteId: string, telefono: string, clienteNombre: string, campaignType: string) => {
    const cleanPhone = telefono.replace(/\D/g, '');
    let msg = '';

    if (campaignType === 'service') {
      msg = `Hola ${clienteNombre}, ¡esperamos que estés disfrutando tu vehículo! 🚗 Te escribimos de la agencia para recordarte que está próximo tu Service Oficial de 1 Año/10.000km. ¿Te gustaría coordinar un turno con nuestro taller oficial?`;
    } else if (campaignType === 'renovacion') {
      msg = `Hola ${clienteNombre}, ¡esperamos que andes muy bien! 🔑 Tu vehículo ya va a cumplir 2 años desde que lo entregamos y tenemos un Plan de Renovación Llave contra Llave con excelentes bonificaciones para vos. ¿Te gustaría conocer la propuesta?`;
    } else if (campaignType === 'reactivacion') {
      const vehStr = latestStockVehicle ? `${latestStockVehicle.marca} ${latestStockVehicle.modelo}` : 'nuevas unidades';
      msg = `Hola ${clienteNombre}, te contacto de la agencia porque ingresó a nuestro stock una unidad que puede interesarte: ${vehStr}. ¿Querés que te pase la ficha técnica y precio?`;
    } else {
      msg = `Hola ${clienteNombre}, te escribo de la agencia para hacer seguimiento de tu consulta. ¿Cómo venís con tu búsqueda de vehículo?`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    if (clienteId) {
      onOpenInteractionModal(clienteId, clienteNombre);
    }
  };

  const tabs = [
    { id: 'urgentes', label: 'Urgentes (Hoy / Esta Semana)', icon: AlertCircle, count: listUrgentes.length, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    { id: 'service', label: 'Service 1 Año (Mes 11-13)', icon: Wrench, count: listService1Anio.length, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
    { id: 'renovacion', label: 'Plan Renovación 2 Años (Mes 18-24)', icon: KeyRound, count: listRenovacion2Anios.length, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    { id: 'reactivacion', label: 'Reactivación de No Compradores', icon: UserX, count: listReactivacion.length, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            Centro de Posventa & Campañas Automatizadas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Segmentación inteligente por antigüedad de compra, envíos directos de campañas y registro inmediato de resultados
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                isSelected 
                  ? `${t.color} border-cyan-500 shadow-xl shadow-cyan-950 scale-[1.02]` 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5" />
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-900 border border-slate-700">
                  {t.count}
                </span>
              </div>
              <div className="font-bold text-xs text-slate-100">{t.label}</div>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT TABLES */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-4">
        {activeTab === 'urgentes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Contactos y Seguimientos Programados para esta Semana
            </h3>
            {listUrgentes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                🎉 No hay seguimientos pendientes o vencidos para esta semana.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Canal</th>
                      <th className="p-3">Próximo Contacto</th>
                      <th className="p-3">Acción a Generar</th>
                      <th className="p-3">Comentario / Nota</th>
                      <th className="p-3 text-right">Acción & Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {listUrgentes.map(item => (
                      <tr key={item.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-slate-100">
                          <button
                            onClick={() => onOpenInteractionModal(item.cliente_id, item.cliente?.nombre || 'Cliente')}
                            className="hover:text-cyan-300 underline underline-offset-2 text-left"
                          >
                            {item.cliente?.nombre || 'Cliente'}
                          </button>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[11px]">
                            {item.tipo}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-amber-400 font-bold">
                          {item.proximo_contacto ? new Date(item.proximo_contacto).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : 'Sin fecha'}
                        </td>
                        <td className="p-3">
                          <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {item.accion_siguiente || 'Seguimiento general'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 max-w-md">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-200">{item.nota}</span>
                            {item.nota && item.nota.length > 30 && (
                              <button
                                onClick={() => setSelectedNote({
                                  clienteNombre: item.cliente?.nombre || 'Cliente',
                                  clienteId: item.cliente_id,
                                  nota: item.nota,
                                  tipo: item.tipo,
                                  accion: item.accion_siguiente,
                                  fecha: item.proximo_contacto
                                })}
                                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1 w-fit"
                              >
                                <Eye className="w-3 h-3" /> Ver Nota Completa
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onViewClientProfile && (
                              <button
                                onClick={() => onViewClientProfile(item.cliente_id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold transition inline-flex items-center gap-1 text-xs"
                                title="Ver Ficha Completa del Cliente"
                              >
                                <User className="w-3.5 h-3.5 text-cyan-400" /> Ficha
                              </button>
                            )}
                            <button
                              onClick={() => onOpenInteractionModal(item.cliente_id, item.cliente?.nombre || 'Cliente')}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 font-bold transition inline-flex items-center gap-1 text-xs"
                              title="Registrar Resultado / Seguimiento"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Registrar Resultado
                            </button>

                            <button
                              onClick={() => handleSendWhatsAppCampaign(item.cliente_id, item.cliente?.telefono || '', item.cliente?.nombre || '', 'urgente')}
                              className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-slate-950 font-bold transition inline-flex items-center gap-1 text-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Enviar WSP
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'service' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              Compradores cumpliendo 1 Año de Entrega (Revisión & Mantenimiento)
            </h3>
            {listService1Anio.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Sin compradores en el rango de 11 a 13 meses de antigüedad.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Comprador</th>
                      <th className="p-3">Vehículo Adquirido</th>
                      <th className="p-3">Fecha Entrega</th>
                      <th className="p-3 text-right">Acción & Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {listService1Anio.map(p => (
                      <tr key={p.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-slate-100">
                          <button
                            onClick={() => onOpenInteractionModal(p.cliente_id, p.cliente?.nombre || 'Cliente')}
                            className="hover:text-cyan-300 underline underline-offset-2 text-left"
                          >
                            {p.cliente?.nombre}
                          </button>
                        </td>
                        <td className="p-3 text-cyan-300 font-medium">{p.vehiculo?.marca} {p.vehiculo?.modelo}</td>
                        <td className="p-3 text-slate-400 font-mono">
                          {new Date(p.created_at).toLocaleDateString('es-AR')}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenInteractionModal(p.cliente_id, p.cliente?.nombre || 'Cliente')}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 font-bold transition inline-flex items-center gap-1 text-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Registrar Resultado
                            </button>
                            <button
                              onClick={() => handleSendWhatsAppCampaign(p.cliente_id, p.cliente?.telefono || '', p.cliente?.nombre || '', 'service')}
                              className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-slate-950 font-bold transition inline-flex items-center gap-1 text-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Enviar Service
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'renovacion' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              Plan Renovación 2 Años (Oportunidad Cambio Unidad Llave contra Llave)
            </h3>
            {listRenovacion2Anios.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Sin compradores en la ventana de renovación de 18 a 24 meses.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Vehículo Actual</th>
                      <th className="p-3">Meses transcurridos</th>
                      <th className="p-3 text-right">Ofrecer Plan Renovación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {listRenovacion2Anios.map(p => (
                      <tr key={p.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-slate-100">
                          <button
                            onClick={() => onOpenInteractionModal(p.cliente_id, p.cliente?.nombre || 'Cliente')}
                            className="hover:text-cyan-300 underline underline-offset-2 text-left"
                          >
                            {p.cliente?.nombre}
                          </button>
                        </td>
                        <td className="p-3 text-emerald-300 font-medium">{p.vehiculo?.marca} {p.vehiculo?.modelo}</td>
                        <td className="p-3 text-slate-400 font-mono">~ 20 Meses</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onStartQuotationForClient && (
                              <button
                                onClick={() => onStartQuotationForClient(p.cliente_id)}
                                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 font-bold transition inline-flex items-center gap-1 text-xs"
                              >
                                <Sparkles className="w-3.5 h-3.5" /> + Cotizar Cambio
                              </button>
                            )}
                            <button
                              onClick={() => handleSendWhatsAppCampaign(p.cliente_id, p.cliente?.telefono || '', p.cliente?.nombre || '', 'renovacion')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 font-bold transition inline-flex items-center gap-1 text-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Enviar Llave por Llave
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reactivacion' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <UserX className="w-4 h-4 text-purple-400" />
              Reactivación de No Compradores (Presupuestos Caídos / Pérdidas)
            </h3>
            {listReactivacion.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Sin prospectos caídos en el historial.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Prospecto</th>
                      <th className="p-3">Vehículo Consultado</th>
                      <th className="p-3">Motivo de Pérdida</th>
                      <th className="p-3 text-right">Re-contactar & Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {listReactivacion.map(p => (
                      <tr key={p.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-slate-100">
                          <button
                            onClick={() => onOpenInteractionModal(p.cliente_id, p.cliente?.nombre || 'Cliente')}
                            className="hover:text-cyan-300 underline underline-offset-2 text-left"
                          >
                            {p.cliente?.nombre}
                          </button>
                        </td>
                        <td className="p-3 text-purple-300 font-medium">{p.vehiculo?.marca} {p.vehiculo?.modelo}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-500/30 font-semibold">
                            {p.motivo_perdida || 'Sin especificar'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onViewClientProfile && (
                              <button
                                onClick={() => onViewClientProfile(p.cliente_id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold transition inline-flex items-center gap-1 text-xs"
                              >
                                <User className="w-3.5 h-3.5 text-cyan-400" /> Ficha
                              </button>
                            )}
                            <button
                              onClick={() => onOpenInteractionModal(p.cliente_id, p.cliente?.nombre || 'Cliente')}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 font-bold transition inline-flex items-center gap-1 text-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Registrar Resultado
                            </button>
                            <button
                              onClick={() => handleSendWhatsAppCampaign(p.cliente_id, p.cliente?.telefono || '', p.cliente?.nombre || '', 'reactivacion')}
                              className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500 hover:text-white font-bold transition inline-flex items-center gap-1 text-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Ofrecer Nuevo Ingreso
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULL NOTE & COMMENTS POPUP MODAL */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-cyan-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <FileText className="w-5 h-5" />
                Comentario & Nota Completa de Posventa
              </div>
              <button onClick={() => setSelectedNote(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1 font-semibold">Cliente:</div>
              <div className="text-base font-extrabold text-slate-100">{selectedNote.clienteNombre}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-xs font-semibold">{selectedNote.tipo}</span>
                {selectedNote.accion && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-xs font-semibold">{selectedNote.accion}</span>
                )}
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {selectedNote.nota}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              {onViewClientProfile && (
                <button
                  onClick={() => {
                    const id = selectedNote.clienteId;
                    setSelectedNote(null);
                    onViewClientProfile(id);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <User className="w-4 h-4 text-cyan-400" /> Ver Ficha Completa Cliente
                </button>
              )}
              <button
                onClick={() => {
                  const id = selectedNote.clienteId;
                  const name = selectedNote.clienteNombre;
                  setSelectedNote(null);
                  onOpenInteractionModal(id, name);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-extrabold text-xs flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Registrar Nuevo Resultado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

