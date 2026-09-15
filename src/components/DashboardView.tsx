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
  ArrowUpRight
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
  metrics: DashboardMetrics;
}

const COLORS = ['#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'];

export const DashboardView: React.FC<DashboardViewProps> = ({ metrics }) => {
  const safeMetrics = metrics || {
    totalLeads: 0,
    totalPresupuestos: 0,
    tasaConversion: 0,
    diasPromedioStock: 0,
    autosVendidosMes: 0,
    stockDisponibleCount: 0,
    valorTotalStockUSD: 0,
    valorTotalStockARS: 0,
    motivosPerdida: [],
    evolucionVentas: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            Panel de Control & Analytics del Salón
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Métricas operativas en tiempo real de ventas, rotación de inventario y motivos de no compra
          </p>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tasa de Conversión */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa de Conversión</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-100">{safeMetrics.tasaConversion}%</div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">{safeMetrics.autosVendidosMes} ganados</span> de {safeMetrics.totalPresupuestos} cotizaciones
            </p>
          </div>
        </div>

        {/* KPI 2: Tiempo Medio en Stock */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rotación en Stock</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-100">{safeMetrics.diasPromedioStock} Días</div>
            <p className="text-[11px] text-slate-400 mt-1">Tiempo promedio de unidad en playa</p>
          </div>
        </div>

        {/* KPI 3: Autos Vendidos Mes */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Autos Vendidos (Mes)</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-100">{safeMetrics.autosVendidosMes} Unidades</div>
            <p className="text-[11px] text-slate-400 mt-1">Cierres concretados exitosamente</p>
          </div>
        </div>

        {/* KPI 4: Stock Disponible & Valor */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Disponible</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400">{safeMetrics.stockDisponibleCount} Unidades</div>
            <p className="text-[11px] text-slate-300 font-bold mt-1">
              Valor: ${(safeMetrics.valorTotalStockUSD || 0).toLocaleString()} USD
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: EVOLUCIÓN DE VENTAS */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Evolución de Ventas ($ USD por Mes)
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeMetrics.evolucionVentas || []}>
                <defs>
                  <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, 'Monto Total']}
                />
                <Area type="monotone" dataKey="monto" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorMonto)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: MOTIVOS DE NO COMPRA */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-rose-400" />
              Motivos de No Compra (Oportunidades Perdidas)
            </h3>
          </div>

          {!safeMetrics.motivosPerdida || safeMetrics.motivosPerdida.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No hay datos registrados de presupuestos perdidos aún.
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeMetrics.motivosPerdida}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="cantidad"
                    nameKey="motivo"
                    label={({ motivo, percent }) => `${motivo} ${(percent * 100).toFixed(0)}%`}
                  >
                    {safeMetrics.motivosPerdida.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
