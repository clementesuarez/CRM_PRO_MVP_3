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
import { dataService } from '../services/dataService';
import { formatCSVCell, generateCSV, downloadCSVBlob, parseCSVText } from '../utils/csvHelper';

interface BackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  inventario: Inventario[];
  presupuestos: Presupuesto[];
  onImportData: (data: { clientes?: Cliente[]; inventario?: Inventario[]; pagares?: any[] }) => Promise<void>;
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

  // Helper to convert objects array to downloadable CSV / Excel file (BOM + ; + =""VALOR"")
  const exportObjectsToCSV = (filename: string, rows: object[]) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvRows = rows.map(row =>
      headers.map(h => {
        const val = (row as any)[h];
        const isId = /telefono|dni|documento|id|cuota/i.test(h);
        return formatCSVCell(val, isId);
      })
    );
    const content = generateCSV(headers, csvRows);
    downloadCSVBlob(filename, content);
  };

  const handleExportAll = async () => {
    exportObjectsToCSV('Backup_Clientes_Agencia', clientes.map(c => ({
      id: c.id,
      nombre: c.nombre,
      apellido: c.apellido || '',
      tipo_documento: c.tipo_documento || 'DNI',
      numero_documento: c.numero_documento || (c as any).dni || '',
      telefono: c.telefono,
      email: c.email || '',
      localidad: c.localidad || '',
      provincia: c.provincia || '',
      domicilio_calle: c.domicilio_calle || '',
      domicilio_numero: c.domicilio_numero || '',
      codigo_postal: c.codigo_postal || '',
      compro_credito: c.compro_credito ? 'Sí' : 'No',
      monto_credito: c.monto_credito || 0,
      deja_auto_permuta: c.deja_auto_permuta ? 'Sí' : 'No',
      auto_permuta_detalle: c.auto_permuta_detalle || '',
      tipo_cliente: c.tipo_cliente,
      notas: c.notas || '',
      created_at: c.created_at
    })));

    exportObjectsToCSV('Backup_Inventario_Agencia', inventario);

    exportObjectsToCSV('Backup_Presupuestos_Agencia', presupuestos.map(p => {
      const c = p.cliente;
      return {
        id: p.id,
        cliente: c ? `${c.nombre} ${c.apellido || ''}`.trim() : 'Sin cliente',
        vehiculo: p.vehiculo ? `${p.vehiculo.marca} ${p.vehiculo.modelo}` : '',
        moneda: p.moneda,
        precio_ofrecido: p.precio_ofrecido,
        anticipo: p.anticipo,
        saldo_financiado: p.saldo_financiado,
        estado: p.estado,
        motivo_perdida: p.motivo_perdida || '',
        created_at: p.created_at
      };
    }));

    try {
      const cuotas = await dataService.getCuotasPagares();
      if (cuotas && cuotas.length > 0) {
        exportObjectsToCSV('Backup_Pagares_Agencia', cuotas.map((p: any) => {
          const c = p.cliente || clientes.find(cl => cl.id === (p.cliente_id || p.cliente?.id));
          return {
            ID: p.id,
            Cotizacion_ID: p.cotizacion_id || p.prestamo_id || '',
            Cliente_ID: p.cliente_id || c?.id || '',
            DNI: c?.numero_documento || (c as any)?.dni || '',
            Cliente_Nombre_Completo: c ? `${c.nombre} ${c.apellido || ''}`.trim() : 'Sin cliente',
            Nro_Cuota: p.numero_cuota ?? p.nro_cuota ?? 1,
            Monto: p.monto_cuota ?? p.monto ?? 0,
            Moneda: p.moneda || 'USD',
            Vencimiento: p.fecha_vencimiento || '',
            Fecha_Pago: p.estado === 'Cobrado' ? (p.fecha_pago || '') : '',
            Estado: p.estado
          };
        }));
      }
    } catch (err) {
      console.error('Error exportando pagarés:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const dataRows = parseCSVText(text);
        if (dataRows.length === 0) {
          setImportedStatus('El archivo CSV está vacío o sin datos válidos.');
          return;
        }

        const headers = Object.keys(dataRows[0]);
        if (headers.includes('patente') || headers.includes('marca')) {
          await onImportData({ inventario: dataRows as any });
          setImportedStatus(`¡Se importaron ${dataRows.length} unidades al Inventario!`);
        } else if (headers.includes('nombre') || headers.includes('telefono')) {
          await onImportData({ clientes: dataRows as any });
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
