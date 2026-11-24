import React from 'react';
import {
  Building2,
  Lock,
  ShieldCheck,
  AlertCircle,
  X,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { setSesionActiva, SesionUsuario } from '../services/storage';

interface DirectionAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (sesion: SesionUsuario) => void;
  firebaseUser?: User | null;
  isGoogleAdmin?: boolean;
  onGoogleSignIn?: () => Promise<void> | void;
  onGoogleSignOut?: () => Promise<void> | void;
  authLoading?: boolean;
  authError?: string | null;
}

export const DirectionAuthModal: React.FC<DirectionAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  firebaseUser,
  isGoogleAdmin = false,
  onGoogleSignIn,
  onGoogleSignOut,
  authLoading = false,
  authError = null
}) => {
  if (!isOpen) return null;

  const handleEnterDirection = () => {
    if (!firebaseUser?.emailVerified || !isGoogleAdmin) return;
    const sesionDir: SesionUsuario = {
      tipo: 'docente',
      nombre: firebaseUser.displayName
        ? `${firebaseUser.displayName} (Dirección)`
        : `${firebaseUser.email || 'Dirección Académica CETis 7'}`
    };
    setSesionActiva(sesionDir);
    onAuthSuccess(sesionDir);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dir-auth-title"
      >
        <div className="bg-[#721B32] text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between border-b border-[#5a1527] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono-code uppercase tracking-wider text-amber-200 font-semibold block truncate">
                SEP · SEMS · DGETI CDMX
              </span>
              <h2 id="dir-auth-title" className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Acceso a Dirección Académica
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl text-xs text-stone-700 leading-relaxed flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#721B32] shrink-0 mt-0.5" />
            <div>
              <strong>Área Restringida Institucional (Firebase Auth):</strong> El acceso a Dirección Académica requiere autenticación verificada con una cuenta Google autorizada en la colección institucional de administradores.
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{authError}</div>
            </div>
          )}

          {firebaseUser?.emailVerified ? (
            isGoogleAdmin ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Administrador Verificado: {firebaseUser.email}</span>
                </div>
                <p className="text-emerald-800">
                  Tu cuenta tiene permisos administrativos activos en Cloud Firestore.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cuenta sin privilegios de Dirección</span>
                </div>
                <p>
                  La sesión actual (<strong>{firebaseUser.email}</strong>) no está registrada como cuenta directiva en Firebase. Cambia a la cuenta institucional autorizada.
                </p>
                {onGoogleSignOut && (
                  <button
                    type="button"
                    onClick={onGoogleSignOut}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cambiar cuenta de Google</span>
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950">
              Inicia sesión con la cuenta de Google institucional autorizada para habilitar el tablero de Dirección.
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {firebaseUser?.emailVerified && isGoogleAdmin ? (
              <button
                type="button"
                onClick={handleEnterDirection}
                className="w-full sm:flex-1 py-2.5 text-xs font-bold text-white bg-[#721B32] hover:bg-[#5b1528] rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Entrar a Dirección</span>
              </button>
            ) : (
              onGoogleSignIn && (
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => void onGoogleSignIn()}
                  className="w-full sm:flex-1 py-2.5 text-xs font-bold text-white bg-[#721B32] hover:bg-[#5b1528] disabled:opacity-60 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>{authLoading ? 'Conectando...' : 'Autenticar con Google'}</span>
                </button>
              )
            )}
          </div>
        </div>

        <div className="bg-stone-100 px-5 py-2.5 border-t border-stone-200 text-center text-[10px] text-stone-500 font-mono-code">
          CETis No. 7 &quot;Miguel Lerdo de Tejada&quot; · Cuautepec, CDMX
        </div>
      </div>
    </div>
  );
};
