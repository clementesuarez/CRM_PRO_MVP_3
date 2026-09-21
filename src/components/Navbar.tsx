import React, { useState } from 'react';
import { 
  Car, 
  LayoutDashboard, 
  Kanban, 
  Wrench, 
  Package, 
  PlusCircle, 
  Users, 
  ShieldCheck,
  Zap, 
  Database, 
  Globe,
  Search,
  FileText,
  UserCheck,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, ROLE_LABELS } from '../types/auth';

export type TabType = 'pipeline' | 'clientes' | 'inventory' | 'aftersales' | 'dashboard' | 'admin' | 'encargos' | 'pagares';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQuotation: () => void;
  onOpenCommandPalette?: () => void;
  onOpenVehicleMatchmaker?: () => void;
  onOpenLoanCalculator?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuotation,
  onOpenCommandPalette,
  onOpenVehicleMatchmaker,
  onOpenLoanCalculator,
}) => {
  const { currentRole, setRole, can, currentUser, logout, isAuthenticated } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // If role is changed to vendedor and current tab is restricted, redirect to pipeline
  const handleRoleChange = (role: UserRole) => {
    if (setRole) setRole(role);
    setShowRoleMenu(false);
    if (role === 'vendedor' && (activeTab === 'pagares' || activeTab === 'admin' || activeTab === 'dashboard')) {
      setActiveTab('pipeline');
    }
  };

  const currentRoleMeta = ROLE_LABELS[currentRole];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-2.5 sm:px-4 lg:px-6 py-2 shadow-xl">
      <div className="max-w-[1700px] mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 lg:gap-3">
        
        {/* Top Header Row on Mobile: Brand & Quick Action Shortcuts */}
        <div className="flex items-center justify-between gap-2 w-full lg:w-auto shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 shrink-0">
              <Car className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-100 flex items-center gap-1.5 leading-none">
                AutoCRM <span className="text-cyan-400 font-extrabold text-[10px] sm:text-xs">PRO MVP 3</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">RBAC (3 Roles) + Catálogo Predictivo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Interactive Role Switcher Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold shadow-sm transition active:scale-95 ${currentRoleMeta.color}`}
                title="Cambiar rol activo para probar permisos RBAC"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{currentRoleMeta.badge}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* Role Switcher Menu */}
              {showRoleMenu && (
                <div className="absolute left-0 lg:right-0 lg:left-auto mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulador RBAC (Control de Acceso)
                  </div>
                  <div className="space-y-1 mt-1">
                    {(['vendedor', 'admin', 'superadmin'] as UserRole[]).map((r) => {
                      const meta = ROLE_LABELS[r];
                      const isSelected = currentRole === r;
                      return (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex flex-col ${
                            isSelected
                              ? 'bg-slate-800 border border-slate-700 text-white font-bold'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{meta.label}</span>
                            {isSelected && <span className="text-[10px] text-cyan-400 font-bold">Activo</span>}
                          </div>
                          <span className="text-[11px] text-slate-400 font-normal mt-0.5">{meta.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Cotización Button */}
            <button
              onClick={onOpenQuotation}
              className="lg:hidden flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs px-2.5 py-1.5 rounded-xl shadow-lg active:scale-95 transition shrink-0"
              title="Nueva Cotización"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Cotizar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Scrollable on Mobile) */}
        <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 p-1 rounded-2xl overflow-x-auto max-w-full justify-start lg:justify-center scrollbar-none shadow-inner shrink-0">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'pipeline'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Kanban className="w-3.5 h-3.5 shrink-0" />
            <span>Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'clientes'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Clientes</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Inventario</span>
          </button>

          <button
            onClick={() => setActiveTab('encargos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'encargos'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>Encargos</span>
          </button>

          {/* Tab Pagarés: Solo visible para admin y superadmin */}
          {can('gestionar_pagares') && (
            <button
              onClick={() => setActiveTab('pagares')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'pagares'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Pagarés</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('aftersales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'aftersales'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span>Posventa</span>
          </button>

          {/* Tab Dashboard: Solo visible para admin y superadmin */}
          {(currentRole === 'admin' || currentRole === 'superadmin') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span>Dashboard</span>
            </button>
          )}

          {/* Tab Admin: Solo visible para admin y superadmin */}
          {(can('gestionar_usuarios') || can('consola_superadmin')) && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{currentRole === 'superadmin' ? 'Dev & Admin' : 'Admin'}</span>
            </button>
          )}
        </nav>

        {/* Right Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2 justify-end shrink-0">
          {currentUser && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/30">
                {currentUser.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-200 text-[11px] leading-tight">{currentUser.nombre}</span>
                <span className="text-[9px] text-slate-400 font-mono leading-none">{currentUser.rol}</span>
              </div>
            </div>
          )}

          {onOpenVehicleMatchmaker && (
            <button
              onClick={onOpenVehicleMatchmaker}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition flex items-center gap-1"
              title="Matchmaker: Emparejar comprador con autos en stock"
            >
              <Globe className="w-4 h-4" />
              <span>Matchmaker</span>
            </button>
          )}

          <button
            onClick={onOpenQuotation}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Cotización</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-500/30 hover:bg-rose-900/60 transition font-bold text-xs shrink-0"
              title="Cerrar Sesión Activa"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
