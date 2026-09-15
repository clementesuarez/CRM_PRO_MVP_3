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
import { RefreshCw, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const { currentRole, can } = useAuth();
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
  
  // New Ultra-Speed UX Modals
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [vehicleMatchmakerOpen, setVehicleMatchmakerOpen] = useState(false);
  const [wspModalData, setWspModalData] = useState<{ open: boolean; phone: string; name: string; vehicle: string; price: string }>({ open: false, phone: '', name: '', vehicle: '', price: '' });

  // Interaction Modal State
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [activeInteractionTarget, setActiveInteractionTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [selectedClienteIdForModal, setSelectedClienteIdForModal] = useState<string | null>(null);

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
      console.error('Error loading CRM data:', err);
      setError('Error de carga. Asegúrate de verificar tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentRole]);

  // Guard reactivo de pestañas restringidas según matriz RBAC
  useEffect(() => {
    if (activeTab === 'pagares' && !can('gestionar_pagares')) {
      setActiveTab('pipeline');
    }
    if (activeTab === 'admin' && !can('gestionar_usuarios') && !can('consola_superadmin')) {
      setActiveTab('pipeline');
    }
  }, [currentRole, activeTab, can]);

  const handleDeleteVehiculo = async (id: string) => {
    if (!window.confirm('¿Confirmas que deseas eliminar esta unidad del stock?')) return;
    try {
      const ok = await dataService.deleteVehiculo(id);
      if (ok) {
        setInventario((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (err) {
      console.error('Error al eliminar vehículo:', err);
      alert('No se pudo eliminar el vehículo.');
    }
  };

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
    motivoPerdida?: MotivoPerdida
  ) => {
    await dataService.updateEstadoPresupuesto(id, estado, motivoPerdida);
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

  const handleImportData = async (data: { clientes?: Cliente[]; inventario?: Inventario[] }) => {
    await dataService.importData(data);
    await loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuotation={handleOpenNewQuotation}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenVehicleMatchmaker={() => setVehicleMatchmakerOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
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
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 hover:bg-cyan-400"
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
                selectedClienteIdForModal={selectedClienteIdForModal}
                onClearSelectedClienteId={() => setSelectedClienteIdForModal(null)}
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
                onDeleteVehiculo={handleDeleteVehiculo}
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
                onViewClientProfile={(clienteId) => {
                  setSelectedClienteIdForModal(clienteId);
                  setActiveTab('clientes');
                }}
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

      {/* Status Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 px-4 lg:px-8 py-3 text-xs text-slate-400 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-200">Servidor Local & Cloud: <span className="text-emerald-400 font-mono">ONLINE / ACTIVO</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Puerto HTTP: <strong className="text-cyan-400 font-mono">5173</strong></span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Base de Datos Comercial: <strong className="text-cyan-300">Sincronizada ({clientes.length} Clientes)</strong></span>
            <span>•</span>
            <span>Resguardo de Backup: <strong className="text-purple-300">Administración OK</strong></span>
          </div>
        </div>
      </footer>

      {/* GLOBAL QUOTATION & TRADE-IN MODAL */}
      <QuotationBuilder
        isOpen={quotationModalOpen}
        onClose={() => setQuotationModalOpen(false)}
        clientes={clientes}
        inventario={inventario}
        presupuestoToEdit={presupuestoToEdit}
        onSaveQuotation={handleSaveQuotation}
      />

      {/* GLOBAL INTERACTION & FOLLOW-UP MODAL */}
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

      {/* ULTRA-SPEED COMMAND PALETTE (CTRL + K) */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        clientes={clientes}
        inventario={inventario}
        presupuestos={presupuestos}
        onOpenQuotation={handleOpenNewQuotation}
      />

      {/* VEHICLE MATCHMAKER MODAL */}
      <VehicleMatchmakerModal
        isOpen={vehicleMatchmakerOpen}
        onClose={() => setVehicleMatchmakerOpen(false)}
        clientes={clientes}
        inventario={inventario}
        onStartQuotationForClientAndVehicle={(clienteId, vehiculoId) => {
          setPresupuestoToEdit(null);
          setQuotationModalOpen(true);
        }}
        onSendWhatsAppProposal={(phone, name, vehicle, price) => {
          setWspModalData({ open: true, phone, name, vehicle, price });
        }}
      />

      {/* WSP PROPOSAL MODAL */}
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
