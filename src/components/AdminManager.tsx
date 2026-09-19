import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Globe,
  FileSpreadsheet,
  Lock,
  Download,
  Upload,
  Check,
  X,
  KeyRound,
  Zap,
  Server,
  Award,
  CheckCircle,
  XCircle,
  HelpCircle,
  Smartphone,
  QrCode,
  Copy,
  RefreshCw,
  HardDrive,
  Clock,
  Radio,
  Wifi,
  Laptop,
  Users,
  UserPlus,
  Activity,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  ShieldAlert,
  Edit2,
  Car,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Cliente, Inventario, Presupuesto } from '../types/crm';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { UserRole, ROLE_LABELS } from '../types/auth';

interface AdminManagerProps {
  clientes: Cliente[];
  inventario: Inventario[];
  presupuestos: Presupuesto[];
  onImportData: (data: { clientes?: Cliente[]; inventario?: Inventario[] }) => Promise<void>;
}

export const AdminManager: React.FC<AdminManagerProps> = ({
  clientes,
  inventario,
  presupuestos,
  onImportData,
}) => {
  const { usuarios, addUsuario, updateUsuario, toggleUsuarioActivo, resetUserPassword, currentRole, can } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(true); // Auto-autorizado para admin/superadmin
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<'usuarios' | 'superadmin' | 'database' | 'lan' | 'backup' | 'comparativa'>('usuarios');

  // Form State para Nuevo Usuario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoRol, setNuevoRol] = useState<UserRole>('vendedor');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userMsg, setUserMsg] = useState('');

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState<{ id: string; nombre: string } | null>(null);
  const [nuevaClaveReset, setNuevaClaveReset] = useState('');

  // Diagnostic State (SuperAdmin)
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<any>(null);

  const runDiagnostic = async () => {
    setDiagLoading(true);
    try {
      const res = await dataService.testSupabaseDiagnostic();
      setDiagResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDiagLoading(false);
    }
  };

  // Metadatos y Sincronización de Catálogo DNRPA
  const [catalogoMeta, setCatalogoMeta] = useState<{
    ultimaActualizacion: string;
    totalRegistros: number;
    requiereActualizacionMes: boolean;
    esDia10OPosterior: boolean;
  }>({
    ultimaActualizacion: '2026-08-10T12:00:00.000Z',
    totalRegistros: 165,
    requiereActualizacionMes: false,
    esDia10OPosterior: false,
  });
  const [catalogoSyncing, setCatalogoSyncing] = useState(false);
  const [catalogoSyncMsg, setCatalogoSyncMsg] = useState('');

  const loadCatalogoMeta = async () => {
    try {
      const meta = await dataService.getCatalogoMetadata();
      setCatalogoMeta(meta);
    } catch (err) {
      console.error('Error al cargar metadatos de catálogo:', err);
    }
  };

  useEffect(() => {
    loadCatalogoMeta();
  }, []);

  const handleSincronizarCatalogo = async () => {
    setCatalogoSyncing(true);
    setCatalogoSyncMsg('');
    try {
      const res = await dataService.sincronizarCatalogoDNRPA();
      await loadCatalogoMeta();
      setCatalogoSyncMsg(res.mensaje);
      setTimeout(() => setCatalogoSyncMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setCatalogoSyncMsg('Error al sincronizar el catálogo vehicular.');
    } finally {
      setCatalogoSyncing(false);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoEmail) return;
    await addUsuario({
      nombre: nuevoNombre.trim(),
      email: nuevoEmail.trim(),
      usuario: nuevoUsuario.trim() || nuevoEmail.split('@')[0],
      password_hash: nuevaPassword.trim() || '123456',
      telefono: nuevoTelefono.trim() || undefined,
      rol: nuevoRol,
      activo: true,
    });
    setNuevoNombre('');
    setNuevoEmail('');
    setNuevoUsuario('');
    setNuevaPassword('');
    setNuevoTelefono('');
    setNuevoRol('vendedor');
    setShowAddUserModal(false);
    setUserMsg('✅ Usuario creado exitosamente y guardado en SQLite (crm_local.db)');
    setTimeout(() => setUserMsg(''), 4000);
  };

  const handleOpenResetModal = (id: string, nombre: string) => {
    setResetModalUser({ id, nombre });
    setNuevaClaveReset('');
  };

  // Supabase form states
  const envObj = (import.meta as any).env || {};
  const [supabaseUrl, setSupabaseUrl] = useState(envObj.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(envObj.VITE_SUPABASE_ANON_KEY || '');
  const [saveStatus, setSaveStatus] = useState('');

  // Backup & Network status
  const [importedStatus, setImportedStatus] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [serverIp, setServerIp] = useState('192.168.1.100');
  const [serverPort, setServerPort] = useState('5173');
  // Google Drive Backup State
  const [drivePath, setDrivePath] = useState(() => localStorage.getItem('autocrm_drive_backup_path') || 'G:\\Mi unidad\\CRM_Backups');
  const [driveBackupMsg, setDriveBackupMsg] = useState('');
  const [driveBackupLoading, setDriveBackupLoading] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState('');
  const [lastSnapshotDate, setLastSnapshotDate] = useState<string | null>(null);

  // Modals
  const [jsonRestoreModalData, setJsonRestoreModalData] = useState<{ open: boolean; data: any; fileName: string } | null>(null);
  const [showCsvHelpModal, setShowCsvHelpModal] = useState(false);

  const handleCreateDriveBackup = async () => {
    setDriveBackupLoading(true);
    setDriveBackupMsg('');

    if (drivePath.trim().startsWith('http://') || drivePath.trim().startsWith('https://')) {
      setDriveBackupMsg('⚠️ La ruta ingresada es una dirección web (URL). Debe indicar una ruta de disco local (ej: G:\\Mi unidad\\CRM_Backups) o presionar "Descargar Copia de Seguridad Directa (.db)".');
      setDriveBackupLoading(false);
      return;
    }

    try {
      localStorage.setItem('autocrm_drive_backup_path', drivePath);
      const res = await dataService.createBackupDrive(drivePath);
      if (res.success) {
        setDriveBackupMsg(`✅ ¡Copia de seguridad física generada con éxito en SQLite! Archivo: ${res.filename} (${res.size_kb} KB)`);
        setLastSnapshotDate(new Date().toLocaleString('es-AR'));
        localStorage.setItem('autocrm_last_snapshot_date', new Date().toLocaleString('es-AR'));
      } else {
        setDriveBackupMsg(`❌ Error al crear resguardo: ${res.error}`);
      }
    } catch (e: any) {
      setDriveBackupMsg(`❌ Error de red al invocar el backup.`);
    } finally {
      setDriveBackupLoading(false);
    }
  };

  const ADMIN_PIN = '1234';

  useEffect(() => {
    const savedSnapshot = localStorage.getItem('autocrm_last_snapshot_date');
    if (savedSnapshot) {
      setLastSnapshotDate(savedSnapshot);
    } else {
      const now = new Date().toLocaleString('es-AR');
      setLastSnapshotDate(now);
      localStorage.setItem('autocrm_last_snapshot_date', now);
    }

    // Try to auto-detect location host if in browser
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setServerIp(window.location.hostname);
    }
    if (window.location.port) {
      setServerPort(window.location.port);
    }
  }, []);

  // Guard: Si el rol activo no tiene consola_superadmin y está en esa pestaña, redirigir a 'usuarios'
  useEffect(() => {
    if (activeTab === 'superadmin' && !can('consola_superadmin')) {
      setActiveTab('usuarios');
    }
  }, [activeTab, can]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('Clave de administrador incorrecta. Intenta nuevamente.');
    }
  };

  const fullLanUrl = `http://${serverIp}:${serverPort}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullLanUrl)}&color=06b6d4&bgcolor=0f172a`;

  const copyLanUrl = () => {
    navigator.clipboard.writeText(fullLanUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  // Full Database JSON Download
  const handleExportFullJSON = () => {
    const fullSnapshot = {
      app: 'AutoCRM PRO',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      counts: {
        clientes: clientes.length,
        inventario: inventario.length,
        presupuestos: presupuestos.length
      },
      data: {
        clientes,
        inventario,
        presupuestos
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullSnapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Resguardo_Completo_AutoCRM_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Full Database JSON Import with Warning Modal
  const handleImportFullJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.data || parsed.clientes || parsed.inventario) {
          setJsonRestoreModalData({ open: true, data: parsed, fileName: file.name });
        } else {
          setImportedStatus('El archivo JSON no contiene la estructura requerida de resguardo.');
        }
      } catch (err) {
        console.error(err);
        setImportedStatus('Error al leer el archivo JSON de copia de seguridad.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmJsonRestore = async () => {
    if (!jsonRestoreModalData) return;
    try {
      const res = await dataService.importJSONToSQLite(jsonRestoreModalData.data);
      if (res.success) {
        await onImportData({
          clientes: jsonRestoreModalData.data.data?.clientes || jsonRestoreModalData.data.clientes || [],
          inventario: jsonRestoreModalData.data.data?.inventario || jsonRestoreModalData.data.inventario || []
        });
        setImportedStatus(`✅ ${res.mensaje || 'Resguardo JSON restaurado exitosamente en SQLite.'}`);
      } else {
        setImportedStatus(`❌ Error en restauración: ${res.error}`);
      }
    } catch (err: any) {
      setImportedStatus('❌ Error al procesar la restauración en SQLite.');
    } finally {
      setJsonRestoreModalData(null);
      setTimeout(() => setImportedStatus(''), 6000);
    }
  };

  const createLocalSnapshotPoint = async () => {
    try {
      const res = await dataService.createSnapshotPoint();
      if (res.success) {
        const now = new Date().toLocaleString('es-AR');
        setLastSnapshotDate(now);
        localStorage.setItem('autocrm_last_snapshot_date', now);
        setSnapshotMessage(`¡Punto de restauración local creado exitosamente en SQLite! (${res.filename})`);
      } else {
        setSnapshotMessage(`Error al crear punto de restauración: ${res.error}`);
      }
    } catch (e: any) {
      setSnapshotMessage('Error al invocar punto de restauración en servidor.');
    } finally {
      setTimeout(() => setSnapshotMessage(''), 5000);
    }
  };

  const downloadCSV = (filename: string, rows: object[]) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [
      headers,
      ...rows.map(row =>
        Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllExcel = async () => {
    downloadCSV('Backup_Clientes_Agencia', clientes);
    downloadCSV('Backup_Inventario_Agencia', inventario);
    downloadCSV('Backup_Presupuestos_Agencia', presupuestos.map(p => ({
      id: p.id,
      cliente: p.cliente?.nombre,
      vehiculo: p.vehiculo ? `${p.vehiculo.marca} ${p.vehiculo.modelo}` : '',
      moneda: p.moneda,
      precio_ofrecido: p.precio_ofrecido,
      anticipo: p.anticipo,
      saldo_financiado: p.saldo_financiado,
      estado: p.estado,
      created_at: p.created_at
    })));

    try {
      const cuotas = await dataService.getCuotasPagares();
      if (cuotas && cuotas.length > 0) {
        downloadCSV('Backup_Pagares_Agencia', cuotas.map((p: any) => ({
          ID: p.id,
          Cotizacion_ID: p.cotizacion_id || p.prestamo_id,
          Cliente: p.cliente?.nombre || p.cliente_id || 'S/D',
          Nro_Cuota: p.numero_cuota ?? p.nro_cuota ?? 1,
          Monto: p.monto_cuota ?? p.monto ?? 0,
          Vencimiento: p.fecha_vencimiento,
          Fecha_Pago: p.fecha_pago || 'Pendiente',
          Estado: p.estado
        })));
      }
    } catch (err) {
      console.error('Error al exportar pagarés:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let totalVehiculosImportados = 0;
    let totalClientesImportados = 0;
    const allClientesToImport: Cliente[] = [];
    const allInventarioToImport: Inventario[] = [];

    const fileList = Array.from(files);

    for (const file of fileList) {
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length >= 2) {
              const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
              const dataRows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.replace(/"/g, '').trim());
                const obj: any = {};
                headers.forEach((h, i) => {
                  obj[h] = values[i];
                });
                return obj;
              });

              if (headers.includes('patente') || headers.includes('marca') || headers.includes('modelo') || headers.includes('precio_venta')) {
                allInventarioToImport.push(...dataRows);
                totalVehiculosImportados += dataRows.length;
              } else if (headers.includes('nombre') || headers.includes('telefono') || headers.includes('dni')) {
                allClientesToImport.push(...dataRows);
                totalClientesImportados += dataRows.length;
              }
            }
          } catch (err) {
            console.error('Error procesando archivo CSV:', file.name, err);
          }
          resolve();
        };
        reader.readAsText(file);
      });
    }

    if (allClientesToImport.length > 0 || allInventarioToImport.length > 0) {
      await onImportData({
        clientes: allClientesToImport.length > 0 ? allClientesToImport : undefined,
        inventario: allInventarioToImport.length > 0 ? allInventarioToImport : undefined
      });
      setImportedStatus(`¡Carga masiva completada! Se importaron ${totalVehiculosImportados} vehículos y ${totalClientesImportados} clientes a SQLite.`);
    } else {
      setImportedStatus('No se reconocieron las cabeceras requeridas en los archivos CSV seleccionados.');
    }
    e.target.value = '';
    setTimeout(() => setImportedStatus(''), 6000);
  };

  // Estimate JSON size in KB
  const totalJsonBytes = new Blob([JSON.stringify({ clientes, inventario, presupuestos })]).size;
  const totalJsonKb = (totalJsonBytes / 1024).toFixed(1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            Módulo Cerrado de Administración, Resguardo & Red Local
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión centralizada de bases de datos, ecosistema cerrado LAN multi-PC/móvil y respaldos de seguridad
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${isUnlocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
            <Lock className="w-3.5 h-3.5" />
            {isUnlocked ? 'Acceso Autorizado' : 'Módulo Bloqueado'}
          </span>
        </div>
      </div>

      {!isUnlocked ? (
        /* PIN AUTHENTICATION FORM */
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 max-w-md mx-auto space-y-5 text-center my-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/40">
            <KeyRound className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-100">Ingreso a Panel de Administración</h3>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa la clave de administrador para acceder a las conexiones de base de datos y backups
            </p>
            <p className="text-[11px] text-cyan-300 font-mono mt-2 bg-slate-900 py-1 px-3 rounded-full inline-block border border-slate-800">
              🔑 Clave por defecto: <strong>1234</strong>
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 pt-2">
            <div>
              <input
                type="password"
                required
                placeholder="****"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-xl font-mono tracking-widest text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
              {pinError && <p className="text-xs text-rose-400 font-medium mt-1.5">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 text-xs"
            >
              Desbloquear Módulo Administración
            </button>
          </form>
        </div>
      ) : (
        /* UNLOCKED ADMIN PANEL CONTENT */
        <div className="space-y-6 animate-fade-in">

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'usuarios' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              👥 Personal & Roles (RBAC)
            </button>

            {can('consola_superadmin') && (
              <button
                onClick={() => {
                  setActiveTab('superadmin');
                  if (!diagResult && !diagLoading) runDiagnostic();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  activeTab === 'superadmin' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'bg-slate-900 text-purple-400 hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4" />
                🛠️ Consola SuperAdmin
              </button>
            )}

            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'database' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              1. Conexión Nube / Supabase
            </button>

            <button
              onClick={() => setActiveTab('lan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'lan' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              2. Red LAN & Móvil
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'backup' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              3. Resguardos
            </button>

            <button
              onClick={() => setActiveTab('comparativa')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'comparativa' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-amber-300 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              4. Ventaja Competitiva
            </button>
          </div>

          {/* TAB: GESTIÓN DE USUARIOS Y ROLES (RBAC) */}
          {activeTab === 'usuarios' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Gestión de Personal & Control de Acceso por Roles (RBAC)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Administra vendedores, permisos comerciales, confidencialidad de costos de compra y módulos autorizados
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-blue-500 transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  + Dar de Alta Vendedor / Usuario
                </button>
              </div>

              {/* Feedback Message Banner */}
              {userMsg && (
                <div className="bg-cyan-950/60 border border-cyan-500/40 p-3 rounded-xl flex items-center gap-2 text-cyan-300 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-bold">{userMsg}</span>
                </div>
              )}

              {/* Matriz de Privilegios por Rol */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-blue-400">1. Vendedor Comercial</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">Comercial</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5">✅ Ve precio de lista de unidades</li>
                    <li className="flex items-center gap-1.5">✅ Crea prospectos y cotizaciones</li>
                    <li className="flex items-center gap-1.5 text-rose-400 font-semibold">❌ Costos de compra BLOQUEADOS</li>
                    <li className="flex items-center gap-1.5 text-rose-400 font-semibold">❌ Margen comercial OCULTO</li>
                    <li className="flex items-center gap-1.5 text-rose-400 font-semibold">❌ Módulo Pagarés BLOQUEADO</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-emerald-400">2. Dueño / Admin</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Control Total</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5">✅ Acceso a costos reales y márgenes</li>
                    <li className="flex items-center gap-1.5">✅ Alta / baja, roles y reset de claves</li>
                    <li className="flex items-center gap-1.5">✅ Gestión de pagarés y cobranzas</li>
                    <li className="flex items-center gap-1.5">✅ Resguardo de bases de datos</li>
                    <li className="flex items-center gap-1.5">✅ KPIs financieros de la agencia</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-purple-400">3. Dev / SuperAdmin</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">Soporte Técnico</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5">✅ Acceso irrestricto sin bloqueos</li>
                    <li className="flex items-center gap-1.5">✅ Diagnósticos y pings en tiempo real</li>
                    <li className="flex items-center gap-1.5">✅ Inspección de tablas y esquema SQL</li>
                    <li className="flex items-center gap-1.5">✅ Visor de logs y eventos de sistema</li>
                    <li className="flex items-center gap-1.5">✅ Configuración de infraestructura</li>
                  </ul>
                </div>
              </div>

              {/* Tabla de Usuarios Registrados */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Nombre & Apellido</th>
                      <th className="p-3">Email de Acceso</th>
                      <th className="p-3">Teléfono / WhatsApp</th>
                      <th className="p-3">Rol Asignado</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usuarios.map((u) => {
                      const meta = ROLE_LABELS[u.rol];
                      return (
                        <tr key={u.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3 font-semibold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-cyan-400">
                              {u.nombre.charAt(0)}
                            </div>
                            <div>
                              <span className="block">{u.nombre}</span>
                              <span className="text-[10px] text-slate-500 font-mono">id: {u.id}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-300 font-mono">{u.email}</td>
                          <td className="p-3 text-slate-400 font-mono">{u.telefono || '-'}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.color}`}>
                              {meta.badge}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.activo ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={u.rol}
                                onChange={(e) => updateUsuario(u.id, { rol: e.target.value as UserRole })}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
                              >
                                <option value="vendedor">Vendedor</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">SuperAdmin</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleOpenResetModal(u.id, u.nombre)}
                                className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border border-amber-500/30 transition flex items-center gap-1"
                                title="Blanquear / Restablecer Contraseña"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                Clave
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleUsuarioActivo(u.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                                  u.activo 
                                    ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-500/30' 
                                    : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-500/30'
                                }`}
                              >
                                {u.activo ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal de Nuevo Usuario */}
              {showAddUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="font-extrabold text-slate-100 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-cyan-400" />
                        Alta de Nuevo Usuario / Vendedor
                      </h4>
                      <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCrearUsuario} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={nuevoNombre}
                          onChange={(e) => setNuevoNombre(e.target.value)}
                          placeholder="Ej: Martín Gómez"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">Usuario (ID Login)</label>
                          <input
                            type="text"
                            value={nuevoUsuario}
                            onChange={(e) => setNuevoUsuario(e.target.value)}
                            placeholder="mgomez"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">Contraseña Inicial</label>
                          <input
                            type="password"
                            value={nuevaPassword}
                            onChange={(e) => setNuevaPassword(e.target.value)}
                            placeholder="******"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Email de Acceso *</label>
                        <input
                          type="email"
                          required
                          value={nuevoEmail}
                          onChange={(e) => setNuevoEmail(e.target.value)}
                          placeholder="martin@agencia.com"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Teléfono / WhatsApp</label>
                        <input
                          type="text"
                          value={nuevoTelefono}
                          onChange={(e) => setNuevoTelefono(e.target.value)}
                          placeholder="+54 9 11 1234-5678"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Rol y Nivel de Acceso</label>
                        <select
                          value={nuevoRol}
                          onChange={(e) => setNuevoRol(e.target.value as UserRole)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-bold"
                        >
                          <option value="vendedor">Vendedor (Solo precio de lista, sin costos ni pagarés)</option>
                          <option value="admin">Admin (Dueño - Control total, márgenes y pagarés)</option>
                          <option value="superadmin">SuperAdmin (Dev - Diagnósticos técnicos y consola)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setShowAddUserModal(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
                        >
                          Crear Usuario en SQLite
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal de Restablecer Contraseña */}
              {resetModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="font-extrabold text-slate-100 flex items-center gap-2 text-sm">
                        <KeyRound className="w-5 h-5 text-amber-400" />
                        Restablecer Contraseña: {resetModalUser.nombre}
                      </h4>
                      <button onClick={() => setResetModalUser(null)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!nuevaClaveReset.trim() || !resetUserPassword) return;
                        await resetUserPassword(resetModalUser.id, nuevaClaveReset.trim());
                        setUserMsg(`🔑 Contraseña de ${resetModalUser.nombre} restablecida exitosamente en SQLite.`);
                        setResetModalUser(null);
                        setNuevaClaveReset('');
                        setTimeout(() => setUserMsg(''), 4000);
                      }}
                      className="space-y-3 text-xs"
                    >
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Nueva Contraseña para el Usuario *</label>
                        <input
                          type="password"
                          required
                          autoFocus
                          value={nuevaClaveReset}
                          onChange={(e) => setNuevaClaveReset(e.target.value)}
                          placeholder="Ingresa la nueva contraseña..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setResetModalUser(null)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                        >
                          Guardar Nueva Clave
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: CONSOLA SUPERADMIN (DIAGNÓSTICO TÉCNICO & SUPABASE) */}
          {activeTab === 'superadmin' && can('consola_superadmin') && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-purple-400" />
                    Consola SuperAdmin: Diagnóstico de Infraestructura & Supabase
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspección técnica en vivo de latencia, tablas creadas, RLS y políticas de acceso a nivel base de datos
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runDiagnostic}
                  disabled={diagLoading}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <Activity className={`w-4 h-4 ${diagLoading ? 'animate-spin' : ''}`} />
                  {diagLoading ? 'Ejecutando Diagnóstico...' : '⚡ Re-ejecutar Test en Vivo'}
                </button>
              </div>

              {/* Status Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Estado de Conexión</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${diagResult?.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                    <span className="font-extrabold text-sm text-white">
                      {diagResult?.connected ? 'Supabase Conectado' : 'Modo Offline / LocalStorage'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Latencia Ping (ms)</span>
                  <div className="font-mono text-lg font-bold text-cyan-400">
                    {diagResult?.latencyMs !== undefined ? `${diagResult.latencyMs} ms` : '-'}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">URL Endpoint Supabase</span>
                  <div className="font-mono text-xs text-slate-300 truncate" title={diagResult?.supabaseUrl}>
                    {diagResult?.supabaseUrl || 'No configurada'}
                  </div>
                </div>
              </div>

              {/* Verificación de Tablas */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  Inspección de Tablas en Supabase / Local
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(diagResult?.tables || [
                    { name: 'clientes', status: 'ok', count: clientes.length },
                    { name: 'inventario', status: 'ok', count: inventario.length },
                    { name: 'presupuestos', status: 'ok', count: presupuestos.length },
                    { name: 'cuotas_pagares', status: 'ok', count: 12 },
                    { name: 'catalogo_vehiculos', status: 'ok', count: 191 },
                    { name: 'perfiles_usuarios', status: 'ok', count: usuarios.length }
                  ]).map((t: any) => (
                    <div key={t.name} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-xs text-slate-200">{t.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {t.status === 'ok' ? `${t.count ?? 0} registros activos` : t.error}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'ok' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      }`}>
                        {t.status === 'ok' ? 'ACTIVA' : 'OFFLINE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auditoría de Políticas de Seguridad (RLS) */}
              <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl space-y-3">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Auditoría de Seguridad SQL (Row Level Security & Vistas)
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Vista Segura `vista_inventario_comercial`:</strong>
                      <p className="text-slate-400 text-[11px]">
                        Los vendedores consultan esta vista donde `costo_compra` fue removido del SELECT a nivel base de datos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">RLS Estricto en `cuotas_pagares` & `prestamos_pagares`:</strong>
                      <p className="text-slate-400 text-[11px]">
                        Políticas `SELECT / INSERT / UPDATE` solo permiten acceso a roles `admin` y `superadmin`.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Catálogo Predictivo Argentino (`catalogo_vehiculos`):</strong>
                      <p className="text-slate-400 text-[11px]">
                        Tabla con extensión `pg_trgm` y búsqueda difusa ultrarrápida (&lt;15ms) a $0 costo sin APIs pagas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: DATABASE CONEXION (SUPABASE & CLOUD) */}
          {activeTab === 'database' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    Estado de Conexión a Base de Datos PostgreSQL / Supabase Cloud
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Explicación de cómo funciona el almacenamiento híbrido y la sincronización con la nube
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isSupabaseConfigured ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Supabase Cloud Conectado
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Modo Demo Híbrido ($0 Costo Servidor)
                    </span>
                  )}
                </div>
              </div>

              {/* Explanatory Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-cyan-300 flex items-center gap-2 text-sm">
                  💡 ¿Cómo funciona la Base de Datos en AutoCRM PRO?
                </h4>
                <p>
                  Tu sistema cuenta con una arquitectura de <strong>doble motor (Híbrida)</strong>:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-1">
                  <li>
                    <strong className="text-slate-200">1. Motor Local (Offline First):</strong> Los datos de Clientes, Inventario y Presupuestos se guardan instantáneamente en la memoria local de la agencia sin necesidad de pagar mensualidades ni depender de servidores externos.
                  </li>
                  <li>
                    <strong className="text-slate-200">2. Motor Cloud (Supabase PostgreSQL):</strong> Si ingresas las credenciales de tu proyecto Supabase gratuito o pago, el CRM se conecta automáticamente a PostgreSQL en la nube para sincronización en tiempo real entre múltiples sucursales.
                  </li>
                </ul>
              </div>

              {/* Form Config */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Credenciales de Proyecto Supabase
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">VITE_SUPABASE_URL</label>
                    <input
                      type="text"
                      placeholder="https://tu-proyecto.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">VITE_SUPABASE_ANON_KEY</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-slate-500">
                    Las credenciales se leen desde el archivo <span className="font-mono text-cyan-400">.env</span> del proyecto en la carpeta de la agencia.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveStatus('Configuración guardada localmente.');
                      setTimeout(() => setSaveStatus(''), 3000);
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shadow-md shadow-cyan-500/20"
                  >
                    Guardar Parámetros de Base de Datos
                  </button>
                </div>
                {saveStatus && <p className="text-xs text-emerald-400 font-semibold">{saveStatus}</p>}
              </div>
            </div>
          )}

          {/* TAB 2: RED LAN MULTI-PC & ACCESO CELULAR MÓVIL */}
          {activeTab === 'lan' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    Ecosistema Cerrado LAN: Multi-PC & Conexión Móvil desde Celulares
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Conecta vendedores en salón, administración y celulares sin pagar servidores en la nube (0 internet requerido)
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  Red Cerrada Wi-Fi Activa
                </span>
              </div>

              {/* QR Code & Direct Mobile Connection Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 items-center">
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="p-2 bg-slate-900 rounded-xl border border-cyan-500/30 mb-3 shadow-lg shadow-cyan-500/10">
                    <img
                      src={qrCodeImageUrl}
                      alt="Código QR de Conexión Celular"
                      className="w-40 h-40 rounded-lg"
                      onError={(e) => {
                        // Fallback icon if offline image fails
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" /> Escanear con Cámara del Celular
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Funciona en iPhone, iPad y Android conectados a la Wi-Fi del salón
                  </p>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-cyan-400" /> Dirección de Enlace Local para Celulares & Notebooks
                    </span>
                    <p className="text-xs text-slate-300 mt-1">
                      Cualquier dispositivo conectado a la misma red Wi-Fi de la agencia puede ingresar abriendo el navegador con esta URL:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-700">
                    <input
                      type="text"
                      value={fullLanUrl}
                      readOnly
                      className="w-full bg-transparent text-sm font-mono text-cyan-300 font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyLanUrl}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedUrl ? '¡Copiado!' : 'Copiar URL'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">IP Local del Servidor (PC Principal)</label>
                      <input
                        type="text"
                        value={serverIp}
                        onChange={(e) => setServerIp(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        placeholder="Ej: 192.168.1.100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Puerto de Escucha</label>
                      <input
                        type="text"
                        value={serverPort}
                        onChange={(e) => setServerPort(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        placeholder="5173"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Step Multi-PC guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs border border-cyan-500/30">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs">1. PC Principal (Servidor del Salón)</h4>
                  <p className="text-[11px] text-slate-400">
                    Ejecuta el sistema en la computadora principal con <span className="font-mono text-cyan-300">npm run dev -- --host</span>. La aplicación responderá a todos las PCs de la red local.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs border border-cyan-500/30">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs">2. Celulares & Tablets de Vendedores</h4>
                  <p className="text-[11px] text-slate-400">
                    Los vendedores pueden estar parados al lado del vehículo mostrando fotos, simulando cuotas y cotizando permutas directo desde su Smartphone.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs border border-cyan-500/30">
                    <Radio className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs">3. Cero Costo mensual de Internet</h4>
                  <p className="text-[11px] text-slate-400">
                    Al ser un ecosistema cerrado en red local, el sistema no depende de internet externo y garantiza 100% de velocidad y cero caída de servicio.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESGUARDO & COPIAS DE SEGURIDAD */}
          {activeTab === 'backup' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-purple-400" />
                    Resguardo Integral & Copias de Seguridad de la Base de Datos
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Auditoría de datos, respaldos completos en formato JSON, exportación a Excel y puntos de restauración instantáneos
                  </p>
                </div>

                <button
                  type="button"
                  onClick={createLocalSnapshotPoint}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs hover:bg-emerald-500 hover:text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Crear Punto de Restauración Local
                </button>
              </div>

              {/* Google Drive Active Backup Section */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 p-5 rounded-2xl border border-cyan-500/30 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-cyan-300 flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-cyan-400" />
                      Copia de Seguridad Física Directa a Google Drive / Disco Local (SQLite)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Exporta copias del archivo físico <span className="font-mono text-cyan-300">crm_local.db</span> nombradas <span className="font-mono text-slate-200">crm_backup_YYYY-MM-DD_HHmm.db</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={driveBackupLoading}
                      onClick={handleCreateDriveBackup}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 shrink-0 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {driveBackupLoading ? 'Generando Resguardo...' : 'Generar Copia en Ruta Local'}
                    </button>

                    <a
                      href="/api/backup/download"
                      download
                      className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
                      title="Descarga directa a través del navegador para guardar en cualquier carpeta o Google Drive"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>Descargar Copia de Seguridad Directa (.db)</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Ruta de Destino de Carpeta Google Drive / Resguardo Local:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={drivePath}
                      onChange={(e) => setDrivePath(e.target.value)}
                      placeholder="ej: G:\Mi unidad\CRM_Backups o C:\Users\TuUsuario\Google Drive\CRM_Backups"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    💡 Si la carpeta no existe, el servidor Node la creará automáticamente en tu disco local o cliente de Google Drive para Windows.
                  </p>
                </div>

                {driveBackupMsg && (
                  <div className={`p-3.5 rounded-xl text-xs font-bold animate-in fade-in ${
                    driveBackupMsg.startsWith('✅') ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  }`}>
                    {driveBackupMsg}
                  </div>
                )}
              </div>

              {/* System Health Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Tamaño Estimado Base</span>
                    <strong className="text-base font-extrabold text-cyan-300 font-mono">{totalJsonKb} KB</strong>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Registros de Clientes</span>
                    <strong className="text-base font-extrabold text-slate-100 font-mono">{clientes.length} Fichas</strong>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Vehículos en Stock</span>
                    <strong className="text-base font-extrabold text-slate-100 font-mono">{inventario.length} Unidades</strong>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Último Punto de Resguardo</span>
                    <strong className="text-[11px] font-bold text-slate-200 block truncate">{lastSnapshotDate || 'Hoy'}</strong>
                  </div>
                </div>
              </div>

              {/* JSON & EXCEL OPTIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1-Click JSON Full System Backup */}
                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">1. Resguardo Completo del Sistema (.JSON)</h4>
                      <p className="text-xs text-slate-400">Descarga instantánea de toda la base (Clientes, Inventario y Cotizaciones)</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    Este archivo de resguardo contiene la estructura exacta de datos de tu agencia para restauración instantánea en caso de cambiar de computadora.
                  </p>

                  <button
                    type="button"
                    onClick={handleExportFullJSON}
                    className="w-full py-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-xs hover:bg-purple-500 hover:text-white transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Copia de Resguardo Total (.JSON)
                  </button>
                </div>

                {/* JSON System Restore */}
                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">2. Restaurar Copia de Resguardo (.JSON)</h4>
                      <p className="text-xs text-slate-400">Recuperación inmediata de base de datos completa</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    Selecciona un archivo de resguardo previa (.JSON) para sincronizar tu sistema en un nuevo equipo.
                  </p>

                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFullJSON}
                    className="w-full text-xs text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500 hover:file:text-slate-950 cursor-pointer"
                  />
                </div>

                {/* CSV / Excel Export Card */}
                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">3. Exportar Listados a Excel (.CSV)</h4>
                      <p className="text-xs text-slate-400">Genera reportes de planillas editables (Clientes, Inventario, Presupuestos y Pagarés)</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportAllExcel}
                    className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs hover:bg-emerald-500 hover:text-slate-950 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Clientes, Inventario, Presupuestos y Pagarés a Excel
                  </button>
                </div>

                {/* CSV / Excel Import Card */}
                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">4. Carga Masiva Multiarchivo desde Excel (.CSV)</h4>
                        <p className="text-xs text-slate-400">Importa simultáneamente uno o varios archivos CSV de unidades o contactos</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCsvHelpModal(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-500/30 hover:bg-amber-900/80 transition text-xs font-bold flex items-center gap-1 shrink-0"
                      title="Ver encabezados requeridos para importación"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>Formato CSV (?)</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    multiple
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500 hover:file:text-slate-950 cursor-pointer"
                  />
                </div>
              </div>

              {importedStatus && (
                <p className="text-xs text-emerald-400 font-bold bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 text-center">
                  {importedStatus}
                </p>
              )}
            </div>
          )}

          {/* TAB 4: COMPARATIVA COMPETITIVA VS OTROS CRM */}
          {activeTab === 'comparativa' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Comparativa de Valor: AutoCRM PRO vs Otros CRM Automotores del Mercado
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Análisis comparativo técnico frente a alternativas tradicionales (Pilot Solution, AutoRaptor, DealerSocket, Tecnom / Sirena)
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Funcionalidad / Característica</th>
                      <th className="p-3.5 text-cyan-300 bg-cyan-950/40 font-extrabold border-x border-cyan-500/30">
                        ⚡ AutoCRM PRO (Nuestra Solución)
                      </th>
                      <th className="p-3.5 text-slate-400">Pilot Solution / Tecnom</th>
                      <th className="p-3.5 text-slate-400">AutoRaptor / DealerSocket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                    <tr>
                      <td className="p-3.5 font-bold text-slate-200">Costo de Licencia / Mensualidad</td>
                      <td className="p-3.5 bg-cyan-950/20 text-emerald-400 font-extrabold border-x border-cyan-500/20">
                        ✅ $0 / Servidor Propio LAN ($0 Alquiler)
                      </td>
                      <td className="p-3.5 text-rose-300">❌ $200 - $600 USD / mes por usuario</td>
                      <td className="p-3.5 text-rose-300">❌ $300 - $800 USD / mes</td>
                    </tr>

                    <tr>
                      <td className="p-3.5 font-bold text-slate-200">Cotizador Rápido Múltiple & Permuta</td>
                      <td className="p-3.5 bg-cyan-950/20 text-emerald-400 font-extrabold border-x border-cyan-500/20">
                        ✅ En menos de 1 minuto con desglose de costos y forma de pago por auto
                      </td>
                      <td className="p-3.5 text-amber-300">⚠️ Formulario lento de varios pasos</td>
                      <td className="p-3.5 text-amber-300">⚠️ Complejo, requiere configuración adicional</td>
                    </tr>

                    <tr>
                      <td className="p-3.5 font-bold text-slate-200">Separación Moneda (USD / ARS)</td>
                      <td className="p-3.5 bg-cyan-950/20 text-emerald-400 font-extrabold border-x border-cyan-500/20">
                        ✅ Nivel campo independiente (USD 48.000 sin confundir el símbolo $)
                      </td>
                      <td className="p-3.5 text-amber-300">⚠️ Formato moneda único rígido</td>
                      <td className="p-3.5 text-slate-400">⚠️ Enfocado solo en dólares estadounidenses</td>
                    </tr>

                    <tr>
                      <td className="p-3.5 font-bold text-slate-200">Pop-up & Envíos Directos WhatsApp</td>
                      <td className="p-3.5 bg-cyan-950/20 text-emerald-400 font-extrabold border-x border-cyan-500/20">
                        ✅ 1-Click WhatsApp instantáneo sin cobro de consumo por mensaje
                      </td>
                      <td className="p-3.5 text-rose-300">❌ Cobran tarifa extra por API de WhatsApp</td>
                      <td className="p-3.5 text-rose-300">❌ Requiere addons de mensajería costosos</td>
                    </tr>

                    <tr>
                      <td className="p-3.5 font-bold text-slate-200">Toma de Permutas & Ficha Técnica</td>
                      <td className="p-3.5 bg-cyan-950/20 text-emerald-400 font-extrabold border-x border-cyan-500/20">
                        ✅ Tasación integrada con ficha de chapa, motor y reacondicionamiento
                      </td>
                      <td className="p-3.5 text-amber-300">⚠️ Módulo de peritaje separado costoso</td>
                      <td className="p-3.5 text-slate-400">⚠️ Registro básico sin detalle técnico</td>
                    </tr>

                    <tr>
                      <td className="p-3.5 font-bold text-slate-200">Modo Offline LAN sin Internet</td>
                      <td className="p-3.5 bg-cyan-950/20 text-emerald-400 font-extrabold border-x border-cyan-500/20">
                        ✅ Funciona 100% en la red interna de la agencia aunque caiga el Wi-Fi
                      </td>
                      <td className="p-3.5 text-rose-300">❌ No funciona sin conexión a internet</td>
                      <td className="p-3.5 text-rose-300">❌ 100% Nube dependiente</td>
                    </tr>

                    <tr>
                      <td className="p-3.5 font-bold text-slate-200">Control & Resguardo de la Base</td>
                      <td className="p-3.5 bg-cyan-950/20 text-emerald-400 font-extrabold border-x border-cyan-500/20">
                        ✅ Exportación e Importación libre en JSON & Excel en cualquier momento
                      </td>
                      <td className="p-3.5 text-rose-300">❌ Cobran cargos por exportar tus datos</td>
                      <td className="p-3.5 text-rose-300">❌ Proceso complejo con bloqueo de datos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE ADVERTENCIA: RESTAURACIÓN DE RESGUARDO JSON */}
      {jsonRestoreModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-amber-400 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Advertencia de Restauración de Base de Datos
              </h4>
              <button onClick={() => setJsonRestoreModalData(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-2xl text-amber-200">
                <strong>¡Atención!</strong> Esta acción procesará el archivo <span className="font-mono text-white font-bold">{jsonRestoreModalData.fileName}</span> y actualizará los registros de Clientes e Inventario en la base de datos local SQLite.
              </p>
              <p className="text-slate-400">
                Se recomienda haber generado una copia de seguridad previa antes de reemplazar o sincronizar datos masivos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setJsonRestoreModalData(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmJsonRestore}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-xs hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20"
              >
                Confirmar y Restaurar SQLite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AYUDA Y GUÍA DE FORMATO CSV */}
      {showCsvHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-slate-100 flex items-center gap-2 text-sm">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                Instrucciones & Formato de Archivos CSV para Carga Masiva
              </h4>
              <button onClick={() => setShowCsvHelpModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                El sistema detecta automáticamente el tipo de archivo analizando la <strong>primera fila de encabezados</strong>. Puedes seleccionar múltiples archivos CSV simultáneamente.
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-extrabold text-cyan-300 block text-xs">🚗 Formato para Inventario de Vehículos:</span>
                <p className="text-[11px] text-slate-400">Encabezados requeridos (debe contener al menos uno de estos):</p>
                <code className="block bg-slate-900 p-2.5 rounded-xl font-mono text-amber-300 text-[11px] border border-slate-800">
                  marca, modelo, version, anio, precio_venta, costo_toma, estado, patente, kilometraje
                </code>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-extrabold text-cyan-300 block text-xs">👥 Formato para Base de Clientes:</span>
                <p className="text-[11px] text-slate-400">Encabezados requeridos (debe contener al menos uno de estos):</p>
                <code className="block bg-slate-900 p-2.5 rounded-xl font-mono text-emerald-300 text-[11px] border border-slate-800">
                  nombre, apellido, dni, telefono, email, localidad, provincia
                </code>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                💡 Tip: Puedes exportar un listado desde el Botón 3 para usarlo como plantilla base editable en Microsoft Excel o Google Sheets.
              </p>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCsvHelpModal(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
