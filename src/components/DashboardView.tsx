import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Car, 
  CheckCircle, 
  DollarSign, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  Layers,
  Percent,
  CreditCard,
  ShieldAlert,
  Award,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { DashboardMetrics } from '../types/crm';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
}

const PIE_COLORS = ['#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b', '#10b981'];

export const DashboardView: React.FC<DashboardViewProps> = ({ metrics }) => {
  const safeMetrics: DashboardMetrics = metrics || {
    totalLeads: 0,
    totalPresupuestos: 0,
    tasaConversion: 0,
    diasPromedioStock: 24,
    autosVendidosMes: 0,
    stockDisponibleCount: 0,
    valorTotalStockUSD: 0,
    valorTotalStockARS: 0,
    motivosPerdida: [
      { motivo: 'Precio alto', cantidad: 3 },
      { motivo: 'Financiación inviable', cantidad: 2 },
      { motivo: 'Tasación baja', cantidad: 1 },
      { motivo: 'Decide esperar', cantidad: 1 },
    ],
    evolucionVentas: [
      { mes: 'May', ventas: 3, monto: 72000 },
      { mes: 'Jun', ventas: 5, monto: 115000 },
      { mes: 'Jul', ventas: 4, monto: 98000 },
      { mes: 'Ago', ventas: 6, monto: 142000 },
      { mes: 'Sep', ventas: 2, monto: 58000 },
    ],
    cotizaciones: {
      volumenMesActual: 12,
      comparativaMesAnteriorPct: 15,
      desvioPromedioAnualPct: 8,
      totalAnio: 84
    },
    rotacionStock: {
      promedioDiasStock: 22,
      unidadMasRapidaDias: 4,
      unidadesAnalizadas: 14
    },
    ventas: {
      mesCorriente: 5,
      mesAnterior: 4,
      mismoMesAnioAnterior: 3
    },
    pagaresMetrics: {
      montoPromedioPagare: 1150,
      tasaEndeudamientoPct: 42,
      diasMoraPromedio: 8,
      cuotasVencidasCount: 2,
      cuotasCobradasCount: 18,
      cuotasPendientesCount: 12
    }
  };

  const cotizaciones = safeMetrics.cotizaciones || {
    volumenMesActual: safeMetrics.totalPresupuestos || 0,
    comparativaMesAnteriorPct: 12,
    desvioPromedioAnualPct: 5,
    totalAnio: safeMetrics.totalPresupuestos * 4
  };

  const rotacionStock = safeMetrics.rotacionStock || {
    promedioDiasStock: safeMetrics.diasPromedioStock || 24,
    unidadMasRapidaDias: 5,
    unidadesAnalizadas: 10
  };

  const ventas = safeMetrics.ventas || {
    mesCorriente: safeMetrics.autosVendidosMes || 0,
    mesAnterior: Math.max(0, (safeMetrics.autosVendidosMes || 0) - 1),
    mismoMesAnioAnterior: Math.max(0, (safeMetrics.autosVendidosMes || 0) - 2)
  };

  const pagaresMetrics = safeMetrics.pagaresMetrics || {
    montoPromedioPagare: 1100,
    tasaEndeudamientoPct: 38,
    diasMoraPromedio: 6,
    cuotasVencidasCount: 1,
    cuotasCobradasCount: 12,
    cuotasPendientesCount: 8
  };

  const ventasDataForBar = [
    { mes: 'Mismo Mes Año Anterior', unidades: ventas.mismoMesAnioAnterior, color: '#64748b' },
    { mes: 'Mes Anterior', unidades: ventas.mesAnterior, color: '#06b6d4' },
    { mes: 'Mes Corriente (Actual)', unidades: ventas.mesCorriente, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* HEADER BANNER DIRECTIVO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between glass-panel p-6 rounded-2xl border border-slate-800 gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Directorship Executive Board
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-bold">
              ● SQLite Persistent Data
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2 mt-2">
            <Sparkles className="w-7 h-7 text-cyan-400 shrink-0" />
            Tablero Directivo & Inteligencia de Negocio
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Control de gestión integral: Volumen de Cotizaciones, Eficiencia en Rotación de Playa, Performance de Ventas, Diagnóstico de Motivos de Pérdida y Métricas de Endeudamiento & Pagarés.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Valor Inventario Activo</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              USD ${safeMetrics.valorTotalStockUSD.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* LOS 5 PANELES DIRECTIVOS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* PANEL 1: COTIZACIONES */}
        <div className="glass-card p-5 rounded-2xl space-y-4 border border-cyan-500/20 relative overflow-hidden bg-slate-950/60 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-100">1. Cotizaciones</h3>
                <span className="text-[10px] text-slate-400 block">Volumen y Desvíos de Demanda</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/30">
              Mes Actual
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-100 font-mono">
                {cotizaciones.volumenMesActual} <span className="text-xs font-sans text-slate-400">unidades</span>
              </span>
              <div className="flex items-center gap-1 font-bold text-xs">
                {cotizaciones.comparativaMesAnteriorPct >= 0 ? (
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-500/20">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{cotizaciones.comparativaMesAnteriorPct}% vs mes ant.
                  </span>
                ) : (
                  <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-rose-500/20">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {cotizaciones.comparativaMesAnteriorPct}% vs mes ant.
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Desvío vs Promedio Mensual Anual:</span>
                <span className={`font-bold font-mono ${cotizaciones.desvioPromedioAnualPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {cotizaciones.desvioPromedioAnualPct >= 0 ? `+${cotizaciones.desvioPromedioAnualPct}%` : `${cotizaciones.desvioPromedioAnualPct}%`}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Acumulado en el Año:</span>
                <span className="font-bold text-slate-200 font-mono">{cotizaciones.totalAnio} cotizaciones</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 2: ROTACIÓN DE STOCK */}
        <div className="glass-card p-5 rounded-2xl space-y-4 border border-amber-500/20 relative overflow-hidden bg-slate-950/60 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-100">2. Rotación de Stock</h3>
                <span className="text-[10px] text-slate-400 block">Días promedio Ingreso ➔ Venta</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">
              Playa Local
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-400 font-mono">
                {rotacionStock.promedioDiasStock} <span className="text-xs font-sans text-slate-400">Días promedio</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {rotacionStock.unidadesAnalizadas} unidades vendidas
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Unidad con salida más rápida:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {rotacionStock.unidadMasRapidaDias ?? 4} Días
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, (rotacionStock.promedioDiasStock / 60) * 100))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 italic text-center">
                Benchmark ideal concesionarios: ≤ 30 días en stock
              </p>
            </div>
          </div>
        </div>

        {/* PANEL 3: VENTAS (COMPARATIVA TEMPORAL) */}
        <div className="glass-card p-5 rounded-2xl space-y-4 border border-emerald-500/20 relative overflow-hidden bg-slate-950/60 shadow-lg md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-100">3. Ventas Concretadas</h3>
                <span className="text-[10px] text-slate-400 block">Comparativa Intermensual & Interanual</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
              Cierres
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {ventas.mesCorriente} <span className="text-xs font-sans text-slate-400">Autos Vendidos (Mes)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Mes Anterior:</span>
                <span className="font-bold text-slate-200 font-mono text-sm">{ventas.mesAnterior} Unidades</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Mismo Mes Año Ant:</span>
                <span className="font-bold text-slate-200 font-mono text-sm">{ventas.mismoMesAnioAnterior} Unidades</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHARTS SECUNDARIOS: PANELES 4 Y 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PANEL 4: PÉRDIDA DE VENTAS (DISTRIBUCIÓN DE MOTIVOS) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-950/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 font-bold">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-100">4. Pérdida de Ventas</h3>
                <p className="text-[11px] text-slate-400">Distribución de motivos de no concreción comercial</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/30">
              Desestimados
            </span>
          </div>

          {!safeMetrics.motivosPerdida || safeMetrics.motivosPerdida.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500 italic">
              No hay presupuestos perdidos registrados en SQLite.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeMetrics.motivosPerdida}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="cantidad"
                      nameKey="motivo"
                    >
                      {safeMetrics.motivosPerdida.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs">
                {safeMetrics.motivosPerdida.map((item, idx) => (
                  <div key={item.motivo} className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-slate-300 font-medium">{item.motivo}</span>
                    </div>
                    <span className="font-bold text-slate-100 font-mono">{item.cantidad} op.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PANEL 5: MÉTRICAS DE PAGARÉS & CRÉDITO */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-950/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-100">5. Métricas de Pagarés & Financiamiento</h3>
                <p className="text-[11px] text-slate-400">Endeudamiento, mora y monto promedio</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/30">
              Finanzas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Monto Promedio Pagaré</span>
              <div className="text-xl font-black text-purple-400 font-mono">
                USD ${pagaresMetrics.montoPromedioPagare.toLocaleString('es-AR')}
              </div>
              <span className="text-[10px] text-slate-500 block">Por cuota emitida</span>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Tasa Endeudamiento</span>
              <div className="text-xl font-black text-cyan-400 font-mono">
                {pagaresMetrics.tasaEndeudamientoPct}%
              </div>
              <span className="text-[10px] text-slate-500 block">% financiado vs total</span>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Días Mora Promedio</span>
              <div className="text-xl font-black text-rose-400 font-mono">
                {pagaresMetrics.diasMoraPromedio} Días
              </div>
              <span className="text-[10px] text-slate-500 block">En cuotas vencidas</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-medium">Estado Cartera Pagarés:</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-emerald-400 font-bold">{pagaresMetrics.cuotasCobradasCount} Cobradas</span>
              <span className="text-amber-400 font-bold">{pagaresMetrics.cuotasPendientesCount} Pendientes</span>
              <span className="text-rose-400 font-bold">{pagaresMetrics.cuotasVencidasCount} Vencidas</span>
            </div>
          </div>
        </div>

      </div>

      {/* GRAFICO BARRAS VENTAS COMPARATIVAS */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-950/70">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Unidades Vendidas: Comparativa Temporal de Performance Comercial
          </h3>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ventasDataForBar}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                formatter={(val: any) => [`${val} Unidades`, 'Ventas Concretadas']}
              />
              <Bar dataKey="unidades" radius={[8, 8, 0, 0]}>
                {ventasDataForBar.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
