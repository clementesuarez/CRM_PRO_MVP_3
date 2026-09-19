import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  Camera, 
  Keyboard, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Smartphone, 
  User, 
  CreditCard,
  Calendar,
  ArrowRight,
  Upload,
  Edit3
} from 'lucide-react';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';
import { DniParsedResult, parseDniPdf417, formatDni } from '../utils/dniParser';

interface DniScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: DniParsedResult) => void;
  onManualModeToggle?: () => void;
}

export const DniScannerModal: React.FC<DniScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onManualModeToggle,
}) => {
  const [activeTab, setActiveTab] = useState<'gun' | 'camera'>('gun');
  const [rawInput, setRawInput] = useState('');
  const [scanResult, setScanResult] = useState<DniParsedResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraLoading, setCameraLoading] = useState(false);

  const gunInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Autofocus en el input para pistola de código de barras
  useEffect(() => {
    if (isOpen && activeTab === 'gun') {
      const timer = setTimeout(() => {
        gunInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  // Inicializar o resetear cuando abre/cierra
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setRawInput('');
      setScanResult(null);
      setErrorMsg(null);
    } else {
      // Enumerar cámaras disponibles
      enumerateCameras();
    }
  }, [isOpen]);

  // Manejo de la cámara cuando cambia la pestaña
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, selectedDeviceId]);

  const enumerateCameras = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        // Priorizar cámara trasera si existe en celulares
        const backCamera = videoInputs.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('trasera') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedDeviceId(backCamera ? backCamera.deviceId : videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Error al enumerar dispositivos de video:', err);
    }
  };

  const startCamera = async () => {
    setCameraLoading(true);
    setErrorMsg(null);
    try {
      if (!codeReaderRef.current) {
        // Instanciar lector con soporte para PDF_417 y QR
        const hints = new Map();
        const formats = [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE];
        hints.set(2, formats); // 2 = DecodeHintType.POSSIBLE_FORMATS
        codeReaderRef.current = new BrowserMultiFormatReader(hints);
      }

      const reader = codeReaderRef.current;
      const deviceId: string | null = selectedDeviceId || null;

      if (videoRef.current) {
        await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const text = result.getText();
              handleRawScannedText(text);
              stopCamera();
            }
          }
        );
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Error al iniciar cámara para escaneo PDF417:', err);
      setErrorMsg('No se pudo acceder a la cámara. Revisa los permisos o usa la pistola lectora / carga manual.');
      setIsCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (e) {
        // Ignore reset error
      }
      codeReaderRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleRawScannedText = (text: string) => {
    setErrorMsg(null);
    const parsed = parseDniPdf417(text);
    if (parsed.isValid) {
      setScanResult(parsed);
    } else {
      setErrorMsg(parsed.error || 'Código no reconocido. Asegúrate de escanear el código de barras PDF417 del dorso del DNI.');
    }
  };

  const handleGunKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rawInput.trim()) {
        handleRawScannedText(rawInput);
      }
    }
  };

  const handleConfirmAndApply = () => {
    if (scanResult && scanResult.isValid) {
      onScanSuccess(scanResult);
      onClose();
    }
  };

  const handleLoadDemo = (tipo: 'moderno' | 'clasico') => {
    let demoStr = '';
    if (tipo === 'moderno') {
      // Moderno: Trámite @ Apellido @ Nombre @ Sexo @ DNI @ Ejemplar @ F.Nac @ F.Emisión
      demoStr = '00123456789@GONZALEZ@MARTIN ALEJANDRO@M@34567890@A@15/04/1989@20/05/2021';
    } else {
      demoStr = 'RODRIGUEZ@CAROLINA PAOLA@F@32145890@B@10/11/1986@12/03/2019';
    }
    setRawInput(demoStr);
    handleRawScannedText(demoStr);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-100">
                  Escaneo de DNI Argentino (PDF417)
                </h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/40 font-mono">
                  Lectura de Documento (PDF417)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Captura rápida y autocompletado en milisegundos sin tipeo manual
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS SELECTOR: LECTOR FÍSICO VS CÁMARA */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('gun');
              setScanResult(null);
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'gun'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Pistola Lectora USB / Bluetooth (Recomendado)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setScanResult(null);
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'camera'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Cámara Celular / Webcam
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: PISTOLA LECTORA O TECLADO */}
          {activeTab === 'gun' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Escucha Activa: Listo para disparar la pistola lectora
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Autofocus Habilitado
                  </span>
                </div>

                <div className="relative">
                  <input
                    ref={gunInputRef}
                    type="text"
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    onKeyDown={handleGunKeyDown}
                    placeholder="Dispara la pistola lectora sobre el código del DNI o pega la ráfaga aquí..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  {rawInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawInput('');
                        setScanResult(null);
                        setErrorMsg(null);
                        gunInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-slate-400">
                    💡 La pistola USB/Bluetooth escribe directamente en este campo y presiona Enter automáticamente.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (rawInput.trim()) handleRawScannedText(rawInput);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                  >
                    Procesar Ráfaga
                  </button>
                </div>
              </div>

              {/* Botones de prueba / demo */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ¿Sin lector físico a mano? Prueba con ejemplos reales:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadDemo('moderno')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition cursor-pointer"
                  >
                    DNI Moderno Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadDemo('clasico')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition cursor-pointer"
                  >
                    DNI Clásico Demo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CÁMARA */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {videoDevices.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-slate-400 shrink-0 font-medium">Cámara:</label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                  >
                    {videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Cámara ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Overlay Guía de Escaneo */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  <div className="w-4/5 h-28 border-2 border-dashed border-cyan-400/80 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] relative flex items-center justify-center">
                    <span className="text-[11px] font-bold text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      Enfoca el código de barras PDF417 aquí
                    </span>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>
                  </div>
                </div>

                {cameraLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-xs text-cyan-400 gap-2 font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Iniciando cámara...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MENSAJE DE ERROR */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* RESULTADO DECODIFICADO PREVIEW */}
          {scanResult && scanResult.isValid && (
            <div className="bg-gradient-to-br from-slate-950 to-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  DNI Decodificado Exitosamente
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Ejemplar: <strong className="text-slate-200">{scanResult.ejemplar || 'A'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Número de DNI</span>
                  <strong className="text-white font-mono text-sm">{scanResult.documento_formateado}</strong>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Apellido</span>
                  <strong className="text-white font-semibold">{scanResult.apellido}</strong>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Nombres</span>
                  <strong className="text-white font-semibold">{scanResult.nombre}</strong>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Fecha Nacimiento</span>
                  <strong className="text-white font-mono">{scanResult.fecha_nacimiento_ar || '-'}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Sexo: <strong className="text-slate-200">{scanResult.sexo_descripcion || '-'}</strong> | Trámite: <span className="font-mono text-slate-300">{scanResult.numero_tramite || 'N/A'}</span>
                </span>

                <button
                  type="button"
                  onClick={handleConfirmAndApply}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Autocompletar Formulario</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div>
            {onManualModeToggle && (
              <button
                type="button"
                onClick={() => {
                  onManualModeToggle();
                  onClose();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Cargar manualmente sin DNI</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancelar
            </button>

            {scanResult && scanResult.isValid && (
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
              >
                Confirmar y Cargar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
