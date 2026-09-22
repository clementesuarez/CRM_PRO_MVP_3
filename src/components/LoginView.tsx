import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, KeyRound, ArrowRight, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [usuarioInput, setUsuarioInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Garantizar que la pantalla siempre arranque con los campos en blanco al montar
  useEffect(() => {
    setUsuarioInput('');
    setPasswordInput('');
    setErrorMsg('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Por favor ingresa usuario y contraseña.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await login(usuarioInput.trim(), passwordInput.trim());
      if (!result.success) {
        setErrorMsg(result.error || 'Credenciales inválidas. Verifica los datos ingresados.');
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión con la API de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-slate-900 to-blue-600/20 border border-cyan-500/40 shadow-xl shadow-cyan-500/10 mb-2">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            AutoCRM <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">PRO</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono font-bold">
              SQLite 3.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Sistema Comercial & Tablero Directivo para Agencia Automotor
          </p>
        </div>

        {/* Glass Card Container */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-900/80 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Inicio de Sesión de Personal
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Ingresa tus credenciales registradas en la base de datos local <span className="font-mono text-cyan-300">crm_local.db</span>
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/40 p-3.5 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Error de Autenticación</span>
                <span className="text-[11px] text-rose-300/90">{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Usuario o Email</span>
                <User className="w-3.5 h-3.5 text-slate-500" />
              </label>
              <input
                type="text"
                name="no_autofill_usuario_mvp"
                id="login_usuario_input"
                required
                autoFocus
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={usuarioInput}
                onChange={(e) => setUsuarioInput(e.target.value)}
                placeholder="ej: admin o clemente@autocrm.com"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Contraseña</span>
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              </label>
              <input
                type="password"
                name="no_autofill_password_mvp"
                id="login_password_input"
                required
                autoComplete="new-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-black bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 hover:from-cyan-400 hover:to-indigo-500 transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
            >
              {loading ? (
                <span>Validando credenciales en SQLite...</span>
              ) : (
                <>
                  <span>Ingresar al CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>Persistencia SQL en tiempo real & DB Local <strong className="text-slate-400 font-mono">crm_local.db</strong></span>
        </div>
      </div>
    </div>
  );
};
