import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { PipelineView } from './components/PipelineView';
import { QuotationBuilder } from './components/QuotationBuilder';
import { AfterSalesCenter } from './components/AfterSalesCenter';
import { DashboardView } from './components/DashboardView';
import { InventoryManager } from './components/InventoryManager';
import { ClientesManager } from './components/ClientesManager';
import { AdminManager } from './components/AdminManager';
import { SourcingRadar } from './components/SourcingRadar';
import { PagaresManager } from './components/PagaresManager';
import { InteractionModal } from './components/InteractionModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { VehicleMatchmakerModal } from './components/VehicleMatchmakerModal';
import { LoanCalculatorModal } from './components/LoanCalculatorModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { dataService } from './services/dataService';
import { useAuth } from './context/AuthContext';
import {
  Cliente,
  Inventario,
  Presupuesto,
  Interaccion,
  DashboardMetrics,
  EstadoPresupuesto,
  MotivoPerdida
} from './types/crm';
import { LoginView } from './components/LoginView';
import { RefreshCw, AlertTriangle, Database } from 'lucide-react';

export const App: React.FC = () => {
  const { currentRole, can, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');

  // Data States
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [presupuestoToEdit, setPresupuestoToEdit] = useState<Presupuesto | null>(null);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [vehicleMatchmakerOpen, setVehicleMatchmakerOpen] = useState(false);
  const [loanCalculatorOpen, setLoanCalculatorOpen] = useState(false);

  const [wspModalData, setWspModalData] = useState<{
    open: boolean;
    phone: string;
    name: string;
    vehicle: string;
    price: string;
  }>({ open: false, phone: '', name: '', vehicle: '', price: '' });

  // Interaction Modal State
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [activeInteractionTarget, setActiveInteractionTarget] = useState<{ id: string; nombre: string } | null>(null);

  const handleOpenNewQuotation = () => {
    setPresupuestoToEdit(null);
    setQuotationModalOpen(true);
  };

  const handleEditPresupuesto = (p: Presupuesto) => {
    setPresupuestoToEdit(p);
    setQuotationModalOpen(true);
  };

  const handleOpenInteractionModal = (clienteId: string, clienteNombre: string) => {
    setActiveInteractionTarget({ id: clienteId, nombre: clienteNombre });
    setInteractionModalOpen(true);
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cliData, invData, presData, intData, metData] = await Promise.all([
        dataService.getClientes(),
        dataService.getInventario(currentRole),
        dataService.getPresupuestos(currentRole),
        dataService.getInteracciones(),
        dataService.getDashboardMetrics(),
      ]);

      setClientes(cliData);
      setInventario(invData);
      setPresupuestos(presData);
      setInteracciones(intData);
      setMetrics(metData);
    } catch (err: any) {
      console.error('Error al cargar datos locales:', err);
      setError('Error al consultar el servidor local SQLite. Asegúrate de que el backend Express esté iniciado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [currentRole, isAuthenticated]);

  // Guard reactivo de pestañas según permisos RBAC
  useEffect(() => {
    if (activeTab === 'pagares' && !can('gestionar_pagares')) {
      setActiveTab('pipeline');
    }
    if (activeTab === 'admin' && !can('gestionar_usuarios') && !can('consola_superadmin')) {
      setActiveTab('pipeline');
    }
    if (activeTab === 'dashboard' && currentRole === 'vendedor') {
      setActiveTab('pipeline');
    }
  }, [currentRole, activeTab, can]);

  const handleSaveQuotation = async (
    presupuestoData: any,
    permutaData?: any,
    nuevoClienteData?: any
  ): Promise<Presupuesto> => {
    let finalClienteId = presupuestoData.cliente_id;

    if (nuevoClienteData) {
      const createdCli = await dataService.createCliente(nuevoClienteData);
      finalClienteId = createdCli.id;
    }

    const result = await dataService.createPresupuesto(
      {
        ...presupuestoData,
        cliente_id: finalClienteId,
      },
      permutaData
    );

    await loadAllData();
    return result;
  };

  const handleUpdateEstadoPresupuesto = async (
    id: string,
    estado: EstadoPresupuesto,
    motivoPerdida?: MotivoPerdida,
    fechaVenta?: string
  ) => {
    await dataService.updateEstadoPresupuesto(id, estado, motivoPerdida, fechaVenta);
    await loadAllData();
  };

  const handleSaveInteraction = async (data: {
    cliente_id: string;
    tipo: any;
    nota: string;
    accion_siguiente?: string;
    proximo_contacto?: string;
  }) => {
    await dataService.createInteraccion(data);
    await loadAllData();
  };

  const handleAddCliente = async (cliente: Omit<Cliente, 'id' | 'created_at'>) => {
    await dataService.createCliente(cliente);
    await loadAllData();
  };

  const handleUpdateCliente = async (cliente: Cliente) => {
    await dataService.updateCliente(cliente);
    await loadAllData();
  };

  const handleAddVehiculo = async (vehiculo: Omit<Inventario, 'id' | 'created_at'>) => {
    await dataService.createVehiculo(vehiculo);
    await loadAllData();
  };

  const handleUpdateVehiculo = async (vehiculo: Inventario) => {
    await dataService.updateVehiculo(vehiculo);
    await loadAllData();
  };

  const handleUpdateEstadoVehiculo = async (id: string, estado: Inventario['estado']) => {
    await dataService.updateEstadoVehiculo(id, estado);
    await loadAllData();
  };

  const handleImportData = async (data: { clientes?: Cliente[]; inventario?: Inventario[]; pagares?: any[] }) => {
    await dataService.importData(data);
    await loadAllData();
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuotation={handleOpenNewQuotation}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenLoanCalculator={() => setLoanCalculatorOpen(true)}
        onOpenVehicleMatchmaker={() => setVehicleMatchmakerOpen(true)}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-6 pb-20 lg:pb-6 space-y-6">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-16 bg-slate-900/80 rounded-2xl border border-slate-800"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-96 bg-slate-900/60 rounded-2xl border border-slate-800/80"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 rounded-2xl border border-rose-500/40 text-center max-w-md mx-auto space-y-4 my-12">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-100">{error}</h3>
            <button
              onClick={loadAllData}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 hover:bg-cyan-400 transition"
            >
              <RefreshCw className="w-4 h-4" /> Reintentar Carga
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'pipeline' && (
              <PipelineView
                presupuestos={presupuestos}
                onOpenQuotation={handleOpenNewQuotation}
                onEditPresupuesto={handleEditPresupuesto}
                onSaveInteraction={handleSaveInteraction}
                onUpdateEstadoPresupuesto={handleUpdateEstadoPresupuesto}
              />
            )}

            {activeTab === 'clientes' && (
              <ClientesManager
                clientes={clientes}
                interacciones={interacciones}
                onAddCliente={handleAddCliente}
                onUpdateCliente={handleUpdateCliente}
                onStartQuotationForClient={handleOpenNewQuotation}
                onSaveInteraction={handleSaveInteraction}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryManager
                inventario={inventario}
                clientes={clientes}
                onAddVehiculo={handleAddVehiculo}
                onUpdateVehiculo={handleUpdateVehiculo}
                onUpdateEstadoVehiculo={handleUpdateEstadoVehiculo}
                onStartQuotationForVehicle={handleOpenNewQuotation}
              />
            )}

            {activeTab === 'aftersales' && (
              <AfterSalesCenter
                clientes={clientes}
                presupuestos={presupuestos}
                interacciones={interacciones}
                inventario={inventario}
                onOpenInteractionModal={handleOpenInteractionModal}
                onStartQuotationForClient={handleOpenNewQuotation}
                onViewClientProfile={() => setActiveTab('clientes')}
              />
            )}

            {activeTab === 'encargos' && (
              <SourcingRadar />
            )}

            {activeTab === 'pagares' && can('gestionar_pagares') && (
              <PagaresManager />
            )}

            {activeTab === 'dashboard' && metrics && (
              <DashboardView metrics={metrics} />
            )}

            {activeTab === 'admin' && (can('gestionar_usuarios') || can('consola_superadmin')) && (
              <AdminManager
                clientes={clientes}
                inventario={inventario}
                presupuestos={presupuestos}
                onImportData={handleImportData}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/90 px-4 lg:px-8 py-3 text-xs text-slate-400 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-200">
              Servidor Local SQLite: <span className="text-emerald-400 font-mono">crm_local.db (ONLINE)</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Puerto API: <strong className="text-cyan-400 font-mono">5000</strong></span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Base Local: <strong className="text-cyan-300 font-mono">{clientes.length} Clientes / {inventario.length} Unidades</strong></span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Database className="w-3.5 h-3.5" /> Modo WAL Activo
            </span>
          </div>
        </div>
      </footer>

      <QuotationBuilder
        isOpen={quotationModalOpen}
        onClose={() => setQuotationModalOpen(false)}
        clientes={clientes}
        inventario={inventario}
        presupuestoToEdit={presupuestoToEdit}
        onSaveQuotation={handleSaveQuotation}
      />

      <InteractionModal
        isOpen={interactionModalOpen}
        onClose={() => setInteractionModalOpen(false)}
        clienteId={activeInteractionTarget?.id || ''}
        clienteNombre={activeInteractionTarget?.nombre || ''}
        onSave={async (data) => {
          if (activeInteractionTarget) {
            await handleSaveInteraction({
              cliente_id: activeInteractionTarget.id,
              ...data
            });
          }
        }}
      />

      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        clientes={clientes}
        inventario={inventario}
        presupuestos={presupuestos}
        onOpenQuotation={handleOpenNewQuotation}
        onOpenLoanCalculator={() => setLoanCalculatorOpen(true)}
      />

      <VehicleMatchmakerModal
        isOpen={vehicleMatchmakerOpen}
        onClose={() => setVehicleMatchmakerOpen(false)}
        clientes={clientes}
        inventario={inventario}
        onStartQuotationForClientAndVehicle={() => {
          setPresupuestoToEdit(null);
          setQuotationModalOpen(true);
        }}
        onSendWhatsAppProposal={(phone, name, vehicle, price) => {
          setWspModalData({ open: true, phone, name, vehicle, price });
        }}
      />

      <LoanCalculatorModal
        isOpen={loanCalculatorOpen}
        onClose={() => setLoanCalculatorOpen(false)}
      />

      {wspModalData.open && (
        <WhatsAppModal
          isOpen={wspModalData.open}
          onClose={() => setWspModalData({ open: false, phone: '', name: '', vehicle: '', price: '' })}
          clienteNombre={wspModalData.name}
          clienteTelefono={wspModalData.phone}
          vehiculoNombre={wspModalData.vehicle}
          precioFormatted={wspModalData.price}
          defaultTemplateType="cotizacion"
        />
      )}
    </div>
  );
};

export default App;