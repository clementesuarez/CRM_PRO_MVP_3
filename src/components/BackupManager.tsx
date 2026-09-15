import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Lock, 
  ShieldCheck, 
  FileSpreadsheet, 
  AlertTriangle, 
  Check, 
  X, 
  KeyRound,
  Database
} from 'lucide-react';
import { Cliente, Inventario, Presupuesto, Permuta } from '../types/crm';

interface BackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  inventario: Inventario[];
  presupuestos: Presupuesto[];
  onImportData: (data: { clientes?: Cliente[]; inventario?: Inventario[] }) => Promise<void>;
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  isOpen,
  onClose,
  clientes,
  inventario,
  presupuestos,
  onImportData,
}) => {
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinError, setPinError] = useState('');
  const [importedStatus, setImportedStatus] = useState('');

  // Default security PIN (can be customized)
  const ADMIN_PIN = '1234';

  if (!isOpen) return null;

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthorized(true);
      setPinError('');
    } else {
      setPinError('Clave de seguridad incorrecta. Intenta nuevamente.');
    }
  };

  // Helper to convert objects array to downloadable CSV / Excel file
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

  const handleExportAll = () => {
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
      motivo_perdida: p.motivo_perdida || '',
      created_at: p.created_at
    })));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const dataRows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = values[i];
          });
          return obj;
        });

        // Determine if importing Clientes or Inventario based on CSV headers
        if (headers.includes('patente') || headers.includes('marca')) {
          await onImportData({ inventario: dataRows });
          setImportedStatus(`¡Se importaron ${dataRows.length} unidades al Inventario!`);
        } else if (headers.includes('nombre') || headers.includes('telefono')) {
          await onImportData({ clientes: dataRows });
          setImportedStatus(`¡Se importaron ${dataRows.length} clientes a la Base!`);
        } else {
          setImportedStatus('Formato CSV no reconocido.');
        }
      } catch (err) {
        console.error(err);
        setImportedStatus('Error al procesar el archivo CSV/Excel.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">Backup Excel & Clave de Seguridad</h3>
              <p className="text-xs text-slate-400">Exportar / Importar base de datos en formato Excel/CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthorized ? (
          /* AUTHENTICATION PIN PROMPT */
          <form onSubmit={handleAuthorize} className="space-y-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <Lock className="w-8 h-8 text-cyan-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-200">Acceso Protegido por Clave Administrador</h4>
              <p className="text-xs text-slate-400">
                Ingresa la clave de usuario para realizar copias de seguridad o importar datos
              </p>
              <p className="text-[11px] text-cyan-300 font-mono">Clave por defecto: 1234</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Clave de Seguridad (PIN)</label>
              <input
                type="password"
                required
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-lg font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
              {pinError && <p className="text-xs text-rose-400 mt-1">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-extrabold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 text-xs"
            >
              Desbloquear Backup
            </button>
          </form>
        ) : (
          /* AUTHORIZED EXPORT / IMPORT CONTROLS */
          <div className="space-y-5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Acceso Administrador Autorizado. Copias de seguridad listas.</span>
            </div>

            {/* Export Section */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                1. Exportar Copia de Seguridad en Excel (CSV)
              </h4>
              <p className="text-xs text-slate-400">
                Descarga archivos Excel compatibles con la información completa de Clientes ({clientes.length}), Inventario ({inventario.length}) y Presupuestos ({presupuestos.length}).
              </p>
              <button
                type="button"
                onClick={handleExportAll}
                className="w-full py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500 hover:text-slate-950 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar Todo a Excel (.CSV)
              </button>
            </div>

            {/* Import Section */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-400" />
                2. Importar Archivo Excel / CSV a la Base
              </h4>
              <p className="text-xs text-slate-400">
                Selecciona un archivo CSV o Excel exportado previamente para restaurar o cargar masivamente datos.
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500 hover:file:text-white cursor-pointer"
              />
              {importedStatus && (
                <p className="text-xs text-emerald-400 font-semibold">{importedStatus}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
