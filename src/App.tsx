import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { 
  getEstudianteActivoNC, 
  setEstudianteActivoNC, 
  getProgresoVirtual, 
  saveProgresoVirtual, 
  getSesionActiva,
  setSesionActiva,
  cerrarSesion,
  subscribeDbStore,
  getDbStoreSnapshot,
  connectOnlineDatabase,
  disconnectOnlineDatabase,
  registrarAccesoGoogleEnNube,
  SesionUsuario
} from './services/storage';
import {
  onFirebaseAuthChange,
  signInWithGooglePopup,
  signOutFirebase,
  checkIsFirebaseAdmin,
  FIREBASE_PROJECT_ID
} from './services/firebase';
import type { User } from 'firebase/auth';
import { Estudiante, ProgresoVirtual, EvaluacionVocacional } from './types';
import { Header, MainNavTab } from './components/Header';
import { StudentProfileBanner } from './components/StudentProfileBanner';
import { VocationalDiagnostic } from './components/VocationalDiagnostic';
import { SpecialtyModules } from './components/SpecialtyModules';
import { DigitalPassQR } from './components/DigitalPassQR';
import { AcademicDirection } from './components/AcademicDirection';
import { MandatoryRegistrationGate } from './components/MandatoryRegistrationGate';
import { WelcomeTutorialModal } from './components/WelcomeTutorialModal';
import { DirectionAuthModal } from './components/DirectionAuthModal';
import { HelpFaqModal } from './components/HelpFaqModal';
import { Compass, CheckCircle, ArrowRight, Sparkles, HelpCircle, WifiOff, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const dbSnapshot = useSyncExternalStore(subscribeDbStore, getDbStoreSnapshot);

  const [activeTab, setActiveTab] = useState<MainNavTab>('vocacional');
  const [sesionActiva, setSesionActivaState] = useState<SesionUsuario | null>(() => getSesionActiva());
  const [estudianteActivoNC, setEstudianteActivoNCState] = useState<string>(() => getEstudianteActivoNC());
  const [mostrarTutorial, setMostrarTutorial] = useState<boolean>(false);
  const [mostrarModalDirAuth, setMostrarModalDirAuth] = useState<boolean>(false);
  const [mostrarHelpModal, setMostrarHelpModal] = useState<boolean>(false);
  const [helpDefaultTab, setHelpDefaultTab] = useState<'fundamentacion' | 'docentes' | 'alumnos'>('docentes');

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isGoogleAdmin, setIsGoogleAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncActionError, setSyncActionError] = useState<string | null>(null);

  const handleOpenHelp = (tab: 'fundamentacion' | 'docentes' | 'alumnos' = 'docentes') => {
    setHelpDefaultTab(tab);
    setMostrarHelpModal(true);
  };

  // Live reactive student state strictly from Firestore onSnapshot mirror
  const estudiantes = dbSnapshot.estudiantes;
  const estudianteActual = useMemo(() => {
    if (estudiantes.length === 0) return null;
    return estudiantes.find(e => e.num_control === estudianteActivoNC) || estudiantes[0];
  }, [estudiantes, estudianteActivoNC]);

  const progresoActual: ProgresoVirtual = useMemo(() => {
    if (estudianteActual && dbSnapshot.progresos[estudianteActual.num_control]) {
      return dbSnapshot.progresos[estudianteActual.num_control];
    }
    return getProgresoVirtual(estudianteActual?.num_control || '');
  }, [estudianteActual?.num_control, dbSnapshot.progresos]);

  const evaluacionActual: EvaluacionVocacional | null = useMemo(() => {
    if (!estudianteActual) return null;
    return dbSnapshot.evaluaciones[estudianteActual.num_control] || null;
  }, [estudianteActual?.num_control, dbSnapshot.evaluaciones]);

  // Listen to Firebase Auth state and connect online-only Firestore listeners
  useEffect(() => {
    let active = true;
    const unsubscribe = onFirebaseAuthChange(user => {
      if (!active) return;
      setFirebaseUser(user);
      if (user && user.emailVerified) {
        void (async () => {
          const adminFlag = await checkIsFirebaseAdmin(user);
          if (!active) return;
          setIsGoogleAdmin(adminFlag);
          const currentSes = getSesionActiva();
          if (currentSes?.tipo === 'docente' && !adminFlag) {
            cerrarSesion();
            setSesionActivaState(null);
          }
          await connectOnlineDatabase(user, adminFlag);
          void registrarAccesoGoogleEnNube(user, adminFlag, 'sesion_activa');
        })();
      } else {
        setIsGoogleAdmin(false);
        disconnectOnlineDatabase();
        cerrarSesion();
        setSesionActivaState(null);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Ensure viewport scrolls cleanly to top when entering main app or changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [Boolean(sesionActiva), activeTab]);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    setSyncActionError(null);
    try {
      const user = await signInWithGooglePopup();
      if (!user) {
        setAuthError(
          'No se completó el acceso con Google (la ventana emergente se cerró o fue cancelada). Intenta nuevamente y selecciona tu cuenta.'
        );
        return;
      }
      if (!user.emailVerified) {
        setAuthError('Tu cuenta de Google no tiene correo verificado. Verifica tu correo para continuar.');
        return;
      }

      const adminFlag = await checkIsFirebaseAdmin(user);
      setIsGoogleAdmin(adminFlag);
      await connectOnlineDatabase(user, adminFlag);
      void registrarAccesoGoogleEnNube(user, adminFlag, 'login_interactivo');

      if (!getSesionActiva()) {
        if (adminFlag) {
          const sesionDir: SesionUsuario = {
            tipo: 'docente',
            nombre: user.displayName ? `${user.displayName} (Dirección)` : `${user.email || 'Dirección Académica CETis 7'}`
          };
          setSesionActiva(sesionDir);
          setSesionActivaState(sesionDir);
          setActiveTab('direccion');
          setMostrarTutorial(false);
        } else {
          const snapshotNow = getDbStoreSnapshot();
          const ownedStudents = snapshotNow.estudiantes.filter(e => e.ownerUid === user.uid);
          if (ownedStudents.length === 1) {
            handleAccessGranted(ownedStudents[0]);
          }
        }
      }
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      if (code === 'auth/popup-blocked') {
        setAuthError('El navegador bloqueó la ventana emergente de Google. Permite ventanas emergentes (popups) para este sitio e intenta de nuevo.');
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `El dominio "${currentHost}" no está autorizado en el proyecto Firebase activo "${FIREBASE_PROJECT_ID}". Agrégalo en Firebase Console -> Proyecto ${FIREBASE_PROJECT_ID} -> Authentication -> Configuración -> Dominios autorizados.`
        );
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError(
          `El proveedor de Google Auth no está habilitado en el proyecto Firebase "${FIREBASE_PROJECT_ID}". Actívalo en Authentication -> Método de acceso -> Google.`
        );
      } else {
        setAuthError(error instanceof Error ? error.message : 'No se pudo completar la autenticación con Google.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEnterAsGoogleAdmin = () => {
    if (!firebaseUser || !firebaseUser.emailVerified || !isGoogleAdmin) return;
    const sesionDir: SesionUsuario = {
      tipo: 'docente',
      nombre: firebaseUser.displayName ? `${firebaseUser.displayName} (Dirección)` : `${firebaseUser.email || 'Dirección Académica CETis 7'}`
    };
    handleAccessGranted(undefined, sesionDir);
  };

  const handleGoogleSignOut = async () => {
    await signOutFirebase();
    disconnectOnlineDatabase();
    cerrarSesion();
    setSesionActivaState(null);
    setFirebaseUser(null);
    setIsGoogleAdmin(false);
    setAuthError(null);
    setSyncActionError(null);
  };

  // If active session belongs to an alumno and Firestore finished loading with 0 alumnos, clear session
  useEffect(() => {
    if (dbSnapshot.ready && sesionActiva?.tipo === 'alumno' && estudiantes.length === 0) {
      cerrarSesion();
      setSesionActivaState(null);
    }
  }, [dbSnapshot.ready, sesionActiva?.tipo, estudiantes.length]);

  const handleCambiarEstudiante = (nc: string) => {
    if (!nc) return;
    setEstudianteActivoNC(nc);
    setEstudianteActivoNCState(nc);
  };

  const handleUpdateProgreso = async (nuevoProgreso: ProgresoVirtual) => {
    setSyncActionError(null);
    if (!nuevoProgreso.num_control || !nuevoProgreso.num_control.trim()) {
      return;
    }
    const res = await saveProgresoVirtual(nuevoProgreso);
    if (!res.success && res.error) {
      setSyncActionError(res.error);
    }
  };

  const handleCompletarEvaluacionVocacional = async (_evaluacion: EvaluacionVocacional) => {
    if (progresoActual.estatus_fase_virtual !== 'COMPLETADO' || isGoogleAdmin) {
      const updated = { ...progresoActual, test_vocacional_completado: true };
      await handleUpdateProgreso(updated);
    }
  };

  const handleAccessGranted = (estudiante?: Estudiante, sesion?: SesionUsuario) => {
    if (estudiante) {
      handleCambiarEstudiante(estudiante.num_control);
      const ses: SesionUsuario = {
        tipo: 'alumno',
        num_control: estudiante.num_control,
        nombre: estudiante.nombre_completo
      };
      setSesionActiva(ses);
      setSesionActivaState(ses);
      setActiveTab('vocacional');
      setMostrarTutorial(false);
    } else if (sesion) {
      setSesionActiva(sesion);
      setSesionActivaState(sesion);
      if (sesion.tipo === 'docente') {
        setActiveTab('direccion');
      }
      setMostrarTutorial(false);
    }
  };

  const handleCerrarSesion = () => {
    cerrarSesion();
    setSesionActivaState(null);
  };

  const handleNavTabChange = (tab: MainNavTab) => {
    if (tab === 'direccion' && sesionActiva?.tipo !== 'docente') {
      setMostrarModalDirAuth(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleAuthDirSuccess = (sesion: SesionUsuario) => {
    setSesionActivaState(sesion);
    setActiveTab('direccion');
    setMostrarModalDirAuth(false);
  };

  // IF NO ACTIVE SESSION: Show Responsive Registration & Authentication Gate
  if (!sesionActiva) {
    return (
      <>
        <MandatoryRegistrationGate 
          onAccessGranted={handleAccessGranted} 
          onOpenTutorial={() => setMostrarTutorial(true)}
          firebaseUser={firebaseUser}
          isGoogleAdmin={isGoogleAdmin}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          onEnterAsGoogleAdmin={handleEnterAsGoogleAdmin}
          authLoading={authLoading}
          authError={authError}
        />
        <WelcomeTutorialModal
          isOpen={mostrarTutorial}
          onClose={() => setMostrarTutorial(false)}
          onNavigateToRegistro={() => {
            setMostrarTutorial(false);
          }}
          isRegistered={false}
          nombreEstudiante="Nuevo Alumno"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans">
      {/* Header with Top Bar Contract */}
      <Header 
        activeTab={activeTab} 
        onTabChange={handleNavTabChange} 
        sesionActiva={sesionActiva}
        onCerrarSesion={handleCerrarSesion}
        onOpenTutorial={() => setMostrarTutorial(true)}
        onOpenHelpFaq={(tab) => handleOpenHelp(tab)}
        firebaseUser={firebaseUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        authLoading={authLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        {/* Online-Only Firebase Connection / Error Status Banner */}
        {(!dbSnapshot.online || dbSnapshot.syncError || syncActionError) && (
          <div className="no-print mb-4 p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-950 flex items-start gap-2.5 text-xs shadow-xs">
            {!dbSnapshot.online ? (
              <WifiOff className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <strong className="block font-bold">
                {!dbSnapshot.online
                  ? 'Sin conexión a Internet — Modo Offline Deshabilitado'
                  : 'Error de sincronización con Base Única Firebase'}
              </strong>
              <span>{syncActionError || dbSnapshot.syncError || 'Conéctate a Internet para continuar trabajando en tiempo real con Firebase Firestore.'}</span>
            </div>
          </div>
        )}

        {firebaseUser?.emailVerified && dbSnapshot.loading && !dbSnapshot.ready && (
          <div className="no-print mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-700 shrink-0" />
            <span>Cargando datos en tiempo real desde Firebase Firestore...</span>
          </div>
        )}

        {/* Institutional Welcome & Hero kicker */}
        <div className="no-print mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-[#721B32] uppercase tracking-wider mb-1">
                <span>Feria de Especialidades 2026</span>
                <span className="text-stone-300">·</span>
                <span>Orientación Vocacional Integral · DGETI</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight font-serif-institutional">
                CETis No. 7 "Miguel Lerdo de Tejada"
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
                Plataforma oficial para la elección informada de trayectoria técnica: Test Vocacional de 40 reactivos, exploración de las 4 Especialidades y generación de tu Constancia Digital QR firmada por tu tutor.
              </p>
            </div>

            {/* Quick Flow Pills / Breadcrumbs & Tutorial & Ayuda Triggers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenHelp('fundamentacion')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#721B32] hover:bg-[#5b1528] text-white font-bold text-xs border border-[#5b1528] shadow-2xs transition-all cursor-pointer hover:scale-102"
                title="Fundamentación y FAQs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
                <span>Ayuda & FAQ</span>
              </button>

              <button
                onClick={() => setMostrarTutorial(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs border border-amber-500 shadow-2xs transition-all cursor-pointer hover:scale-102"
                title="Abrir la guía ilustrada del proceso vocacional"
              >
                <Sparkles className="w-3.5 h-3.5 fill-stone-950 text-stone-950" />
                <span>¿Cómo funciona? (Tutorial)</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs font-mono-code text-stone-500 bg-white p-2 rounded-lg border border-stone-200 flex-wrap">
                <span className={activeTab === 'vocacional' ? 'text-[#721B32] font-bold' : ''}>1. Test</span>
                <span>→</span>
                <span className={activeTab === 'modulos' ? 'text-[#721B32] font-bold' : ''}>2. Especialidades</span>
                <span>→</span>
                <span className={activeTab === 'pase_qr' ? 'text-[#721B32] font-bold' : ''}>3. Constancia QR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Profile & Live Progress Bar (Only shown in student workflows) */}
        {activeTab !== 'direccion' && (
          estudianteActual ? (
            <div className="no-print">
              <StudentProfileBanner
                estudiante={estudianteActual}
                progreso={progresoActual}
                evaluacion={evaluacionActual}
                onCambiarEstudiante={handleCambiarEstudiante}
                onVerPaseQR={() => setActiveTab('pase_qr')}
                onStudentUpdated={(updated) => handleCambiarEstudiante(updated.num_control)}
                onCerrarSesion={handleCerrarSesion}
              />
            </div>
          ) : (
            <div className="no-print bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Padrón de Alumnos Actualmente en Cero</h4>
                  <p className="text-xs text-amber-900/80">
                    No hay alumnos registrados en este momento en la base única de Firebase. Puedes acudir a Dirección o registrar un alumno.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleNavTabChange('direccion')}
                className="px-3.5 py-2 text-xs font-bold text-white bg-[#721B32] hover:bg-[#5b1528] rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Ir a Dirección Académica
              </button>
            </div>
          )
        )}

        {/* TAB 1: Test Vocacional Dual (Aptitud vs Interés) */}
        {activeTab === 'vocacional' && (
          estudianteActual ? (
            <div className="space-y-6">
              <VocationalDiagnostic
                numControl={estudianteActual.num_control}
                evaluacionExistente={evaluacionActual}
                onCompletar={handleCompletarEvaluacionVocacional}
              />

              {evaluacionActual && (
                <div className="no-print bg-white p-5 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">¿Listo para explorar la oferta académica?</h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Conoce a fondo las 4 especialidades del CETis 7 y responde sus cuestionarios de lectura para avanzar hacia tu Pase Digital QR.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('modulos')}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-[#721B32] hover:bg-[#5b1528] rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shadow-2xs"
                  >
                    Continuar a Especialidades (Paso 2)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <Compass className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">No hay alumno seleccionado</h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                El test vocacional dual requiere un alumno registrado para guardar sus aptitudes e intereses en Firebase.
              </p>
              <button
                onClick={() => handleNavTabChange('direccion')}
                className="px-4 py-2 text-xs font-bold text-white bg-[#721B32] hover:bg-[#5b1528] rounded-xl cursor-pointer"
              >
                Abrir Dirección Académica
              </button>
            </div>
          )
        )}

        {/* TAB 2: Módulos de Especialidad (4 Carreras) */}
        {activeTab === 'modulos' && (
          <div className="space-y-6">
            <SpecialtyModules
              progreso={progresoActual}
              onUpdateProgreso={handleUpdateProgreso}
              sugeridaId={evaluacionActual?.carrera_sugerida}
              onNavigateToDirection={() => handleNavTabChange('direccion')}
              sesionActiva={sesionActiva}
            />

            {progresoActual.porcentaje_virtual >= 100 && (
              <div className="no-print bg-emerald-50 border border-emerald-200 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-emerald-800 font-bold">100% del Recorrido Vocacional Concluido</span>
                    <h4 className="text-base font-bold text-emerald-950">Tu Constancia / Pase Digital QR ya está generada</h4>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('pase_qr')}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#721B32] hover:bg-[#5b1528] rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  Ver Constancia Digital QR Oficial
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Constancia / Pase Digital QR */}
        {activeTab === 'pase_qr' && (
          <DigitalPassQR
            estudiante={estudianteActual}
            evaluacion={evaluacionActual}
            progreso={progresoActual}
            onStudentUpdated={(updated) => handleCambiarEstudiante(updated.num_control)}
          />
        )}

        {/* TAB 4: Dirección & Subdirección Académica */}
        {activeTab === 'direccion' && isGoogleAdmin && (
          <AcademicDirection />
        )}
      </main>

      {/* Official Institutional Footer */}
      <footer className="no-print bg-white border-t border-stone-200 py-6 mt-12 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="font-bold text-stone-900">
              Centro de Estudios Tecnológicos industrial y de servicios No. 7 "Miguel Lerdo de Tejada"
            </div>
            <div className="text-stone-500">
              DGETI · SEMS · Secretaría de Educación Pública · Av. Luis Espinoza s/n (entre Av. Benito Juárez y Solidaridad, frente al antiguo Museo del Drenaje Profundo), Colonia Solidaridad Nacional, Alcaldía Gustavo A. Madero, Ciudad de México, C.P. 07268 · Teléfono: 55 5039 2650.
            </div>
          </div>
          <div className="font-mono-code text-[11px] text-stone-500">
            Feria de Especialidades e Innovación Tecnológica 2026
          </div>
        </div>
      </footer>

      {/* Welcome Tutorial Modal (4 Phases interactive guide for 12-15 year olds) */}
      <WelcomeTutorialModal
        isOpen={mostrarTutorial}
        onClose={() => setMostrarTutorial(false)}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setMostrarTutorial(false);
        }}
        onNavigateToRegistro={() => {
          handleCerrarSesion();
          setMostrarTutorial(false);
        }}
        isRegistered={Boolean(sesionActiva && sesionActiva.tipo === 'alumno')}
        nombreEstudiante={estudianteActual?.nombre_completo ? estudianteActual.nombre_completo.split(' ')[0] : 'Estudiante'}
      />

      {/* Direction & Subdirection Google Admin Authentication Modal */}
      <DirectionAuthModal
        isOpen={mostrarModalDirAuth}
        onClose={() => setMostrarModalDirAuth(false)}
        onAuthSuccess={handleAuthDirSuccess}
        firebaseUser={firebaseUser}
        isGoogleAdmin={isGoogleAdmin}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        authLoading={authLoading}
        authError={authError}
      />

      {/* Help & FAQ Center Modal */}
      <HelpFaqModal
        isOpen={mostrarHelpModal}
        onClose={() => setMostrarHelpModal(false)}
        defaultTab={helpDefaultTab}
      />
    </div>
  );
}
