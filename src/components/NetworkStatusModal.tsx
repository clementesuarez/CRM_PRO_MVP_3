import React, { useState } from 'react';
import { X, Globe, Database, Zap, Copy, Check, ShieldCheck, Laptop, Smartphone, Info } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface NetworkStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'supabase' | 'lan';
}

export const NetworkStatusModal: React.FC<NetworkStatusModalProps> = ({
  isOpen,
  onClose,
  type,
}) => {
  const [copied, setCopied] = useState(false);

  // Get current hostname or IP
  const currentHost = window.location.hostname;
  const currentPort = window.location.port || '5173';
  const localNetworkUrl = `http://${currentHost === 'localhost' ? '192.168.1.73' : currentHost}:${currentPort}/`;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(localNetworkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-700/80 p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              type === 'supabase' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              {type === 'supabase' ? <Database className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">
                {type === 'supabase' ? 'Conexión Base de Datos' : 'Red Local Agencia (LAN Multi-PC)'}
              </h3>
              <p className="text-xs text-slate-400">
                {type === 'supabase' ? 'Estado del backend y almacenamiento' : 'Conectar múltiples dispositivos en la misma Wi-Fi'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {type === 'supabase' ? (
          /* SUPABASE & STORAGE MODAL CONTENT */
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-300">Modo de Almacenamiento:</span>
                {isSupabaseConfigured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Supabase PostgreSQL (Cloud)
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Zap className="w-4 h-4" /> LocalStorage Híbrido ($0 Cost)
                  </span>
                )}
              </div>
              <p className="text-slate-400">
                {isSupabaseConfigured
                  ? 'La aplicación está conectada en tiempo real con tu proyecto Supabase Cloud.'
                  : 'Modo sin costo activo. Todos los clientes, vehículos y presupuestos se guardan en tu navegador en tiempo real.'}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200">Variables de Entorno (`.env.local`):</span>
              <p className="text-slate-400 font-mono text-[11px]">
                VITE_SUPABASE_URL=https://tu-proyecto.supabase.co<br />
                VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
              </p>
              <p className="text-[11px] text-slate-500">
                Configura estas claves en tu archivo <code className="text-cyan-300">.env.local</code> para activar la base de datos cloud automáticamente.
              </p>
            </div>
          </div>
        ) : (
          /* LAN MULTI-PC CONTENT */
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 space-y-2">
              <div className="font-bold flex items-center gap-2 text-cyan-300">
                <Laptop className="w-4 h-4" />
                <span>¿Cómo usar el CRM desde otras PCs o celulares en la agencia?</span>
              </div>
              <p className="text-slate-300">
                Asegúrate de que los dispositivos estén conectados al **mismo Wi-Fi / Red Cableada** de la agencia e ingresa esta dirección en su navegador:
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <div className="font-mono font-bold text-cyan-400 text-sm truncate">
                {localNetworkUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar URL'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Escritorio Vendedores</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Celulares / Tablets Playa</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
