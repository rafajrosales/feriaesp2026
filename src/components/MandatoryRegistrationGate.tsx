import React, { useState, useSyncExternalStore } from 'react';
import { Estudiante, TutorLegal, GRUPOS_PRIMER_SEMESTRE } from '../types';
import {
  getDbStoreSnapshot,
  subscribeDbStore,
  getEstudianteByCURP,
  getEstudianteByNC,
  validarCURP,
  registrarNuevoEstudiante,
  setSesionActiva,
  setEstudianteActivoNC,
  SesionUsuario
} from '../services/storage';
import { cloudCheckCurpAvailable, cloudCheckNumControlAvailable } from '../services/firebase';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  Building2,
  Mail,
  Fingerprint,
  Check,
  KeyRound,
  ShieldCheck,
  WifiOff,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { COMIC_ASSETS } from '../assets/comicAssets';
import type { User } from 'firebase/auth';

interface MandatoryRegistrationGateProps {
  onAccessGranted: (estudiante?: Estudiante, sesion?: SesionUsuario) => void;
  onOpenTutorial?: () => void;
  firebaseUser?: User | null;
  isGoogleAdmin?: boolean;
  onGoogleSignIn?: () => Promise<void> | void;
  onGoogleSignOut?: () => Promise<void> | void;
  onEnterAsGoogleAdmin?: () => void;
  authLoading?: boolean;
  authError?: string | null;
}

export const MandatoryRegistrationGate: React.FC<MandatoryRegistrationGateProps> = ({
  onAccessGranted,
  onOpenTutorial,
  firebaseUser,
  isGoogleAdmin = false,
  onGoogleSignIn,
  onGoogleSignOut,
  onEnterAsGoogleAdmin,
  authLoading = false,
  authError = null
}) => {
  const dbSnapshot = useSyncExternalStore(subscribeDbStore, getDbStoreSnapshot);

  const [activeTab, setActiveTab] = useState<'registro' | 'login' | 'docente'>('registro');
  const [paso, setPaso] = useState<1 | 2>(1);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [curp, setCurp] = useState('');
  const [numControl, setNumControl] = useState('');
  const [grupo, setGrupo] = useState('1°A');
  const [telefonoAlumno, setTelefonoAlumno] = useState('');

  const [nombreTutor, setNombreTutor] = useState('');
  const [parentesco, setParentesco] = useState<'Padre' | 'Madre' | 'Tutor Legal'>('Padre');
  const [correoTutor, setCorreoTutor] = useState('');
  const [telefonoTutor, setTelefonoTutor] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loginQuery, setLoginQuery] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const isFirebaseVerified = Boolean(firebaseUser?.emailVerified);
  const isOnlineConnected = dbSnapshot.online && isFirebaseVerified && !dbSnapshot.syncError;
  const estudiantesRegistrados = dbSnapshot.estudiantes;
  const estudiantesPropiosGoogle = firebaseUser?.uid
    ? estudiantesRegistrados.filter(e => e.ownerUid === firebaseUser.uid)
    : [];

  const cleanCurp = curp.trim().toUpperCase();
  const estudianteExistenteConCurp = cleanCurp.length >= 10 ? getEstudianteByCURP(cleanCurp) : null;

  const handleAutocompletarPrueba = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const nombres = ['Mariana Lizbeth Soto García', 'Alan Fernando Morales Ríos', 'Jimena Paulina Castro Delgado', 'José Ángel Mendoza Ortiz'];
    const selectedNombre = nombres[Math.floor(Math.random() * nombres.length)];
    const initials = selectedNombre.split(' ').map(n => n[0]).join('').slice(0, 4).toUpperCase();

    setNombreCompleto(selectedNombre);
    setCurp(`${initials}090815HDFRLA${randomSuffix.toString().slice(0, 2)}`);
    setNumControl(`2631607001${randomSuffix}`);
    setGrupo('1°C');
    setTelefonoAlumno('55 3456 7890');
    setNombreTutor('Lic. Juan Manuel Soto');
    setParentesco('Padre');
    setCorreoTutor(`tutor.${selectedNombre.split(' ')[0].toLowerCase()}@gmail.com`);
    setTelefonoTutor('55 8765 4321');
    setErrorMsg(null);
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!dbSnapshot.online) {
      setErrorMsg('Sin conexión a Internet. Esta plataforma opera exclusivamente en línea con Firebase.');
      return;
    }

    if (!isFirebaseVerified) {
      setErrorMsg('Primero conecta tu cuenta de Google verificada en el recuadro azul superior para registrar tu matrícula en la base única de Firebase.');
      return;
    }

    if (!nombreCompleto.trim() || nombreCompleto.trim().length < 5) {
      setErrorMsg('Por favor escribe tu nombre completo con apellidos.');
      return;
    }

    const curpValid = validarCURP(curp);
    if (!curpValid.valido) {
      setErrorMsg(curpValid.mensaje || 'La CURP ingresada no es válida.');
      return;
    }

    if (!numControl.trim() || numControl.trim().length < 8) {
      setErrorMsg('El número de control escolar debe contener al menos 8 dígitos.');
      return;
    }

    setSubmitting(true);
    try {
      const [curpCheck, ncCheck] = await Promise.all([
        cloudCheckCurpAvailable(cleanCurp),
        cloudCheckNumControlAvailable(numControl.trim())
      ]);

      if (!curpCheck.available) {
        setErrorMsg(
          `Esta CURP ya está registrada en la base única de Firebase (Núm. Control: ${curpCheck.numControl || 'asignado'}). Si es tu matrícula, ingresa con la cuenta Google que usaste al registrarte.`
        );
        return;
      }

      if (!ncCheck.available) {
        setErrorMsg(`El Número de Control ${numControl.trim()} ya se encuentra registrado en Firebase.`);
        return;
      }

      setPaso(2);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al validar datos en Firebase.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isFirebaseVerified) {
      setErrorMsg('Tu cuenta de Google debe estar conectada para guardar en Firebase.');
      return;
    }

    if (!nombreTutor.trim()) {
      setErrorMsg('El nombre de tu padre, madre o tutor legal es obligatorio.');
      return;
    }

    if (!correoTutor.trim() || !correoTutor.includes('@')) {
      setErrorMsg('El correo electrónico del tutor es obligatorio para vincular la firma de autorización.');
      return;
    }

    const tutorObj: TutorLegal = {
      nombre_tutor: nombreTutor.trim(),
      parentesco,
      correo_tutor: correoTutor.trim().toLowerCase(),
      telefono_tutor: telefonoTutor.trim() || 'No proporcionado',
      verificado: false
    };

    const nuevoEstudiante: Estudiante = {
      num_control: numControl.trim(),
      nombre_completo: nombreCompleto.trim(),
      grupo,
      turno: 'MATUTINO',
      curp: curp.trim().toUpperCase(),
      correo_institucional: `${nombreCompleto.trim().toLowerCase().split(' ')[0]}.${numControl.trim().slice(-4)}@cetis7.edu.mx`,
      telefono_alumno: telefonoAlumno.trim(),
      tutor: tutorObj
    };

    setSubmitting(true);
    try {
      const result = await registrarNuevoEstudiante(nuevoEstudiante);
      if (!result.success) {
        setErrorMsg(result.error || 'Ocurrió un error al registrar el alumno en Firebase.');
        return;
      }

      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch {
        // safe ignore
      }

      setSuccessNotice(`¡Registro guardado en Firebase! Bienvenido al CETis No. 7, ${nuevoEstudiante.nombre_completo}.`);
      setTimeout(() => {
        onAccessGranted(result.estudiante);
      }, 350);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginExisting = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!isFirebaseVerified) {
      setLoginError('Conecta primero tu cuenta de Google para consultar tus matrículas en Firebase.');
      return;
    }

    const q = loginQuery.trim().toUpperCase();
    if (!q) {
      setLoginError('Por favor ingresa tu CURP o Número de Control.');
      return;
    }

    let student = getEstudianteByCURP(q);
    if (!student) {
      student = getEstudianteByNC(q);
    }

    if (!student) {
      setLoginError(
        `No se encontró esa matrícula vinculada a tu cuenta Google (${firebaseUser?.email}). Inicia sesión con el correo de Google usado en tu registro o regístrate en "1. Nuevo Registro".`
      );
      return;
    }

    setEstudianteActivoNC(student.num_control);
    setSesionActiva({
      tipo: 'alumno',
      num_control: student.num_control,
      nombre: student.nombre_completo
    });

    onAccessGranted(student, { tipo: 'alumno', num_control: student.num_control, nombre: student.nombre_completo });
  };

  const handleSelectQuickStudent = (student: Estudiante) => {
    setEstudianteActivoNC(student.num_control);
    setSesionActiva({
      tipo: 'alumno',
      num_control: student.num_control,
      nombre: student.nombre_completo
    });
    onAccessGranted(student, { tipo: 'alumno', num_control: student.num_control, nombre: student.nombre_completo });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-stone-100 text-stone-900 flex flex-col font-sans">
      <header className="bg-[#721B32] text-white text-[10px] sm:text-[11px] font-medium py-2 px-3 sm:px-6 lg:px-8 border-b border-[#5a1527] shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="font-bold tracking-wider shrink-0">GOBIERNO DE MÉXICO</span>
            <span className="opacity-50">|</span>
            <span className="opacity-90 truncate">SEP · SEMS · DGETI</span>
          </div>
          <span className="font-mono-code text-[10px] text-amber-200 font-semibold shrink-0">
            PLANTEL 007 · FERIA 2026
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {!dbSnapshot.online && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-300 rounded-xl text-xs text-red-950 flex items-center gap-2.5">
            <WifiOff className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <strong>Sin conexión a Internet:</strong> Esta aplicación requiere acceso en línea a la base única de Firebase (no opera offline). Reconecta tu red para continuar.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          <aside className="lg:col-span-5 space-y-4 min-w-0">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="relative h-28 sm:h-40 lg:h-48 w-full overflow-hidden bg-stone-900 border-b-2 border-[#721B32]">
                <img
                  src={COMIC_ASSETS.hero}
                  alt="Comunidad Estudiantil CETis No. 7"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#721B32] via-[#721B32]/70 to-black/35 flex flex-col justify-between p-3 sm:p-4 text-white">
                  <div className="flex items-center justify-between text-[10px] font-mono-code gap-2">
                    <span className="font-bold tracking-wider bg-black/50 px-2 py-0.5 rounded truncate">
                      SEP · DGETI CDMX
                    </span>
                    <span className="bg-amber-400 text-stone-950 px-2 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
                      FERIA 2026
                    </span>
                  </div>
                  <div>
                    <h1 className="text-base sm:text-xl font-black text-white tracking-tight font-serif-institutional leading-tight">
                      CETis No. 7 &quot;Miguel Lerdo de Tejada&quot;
                    </h1>
                    <p className="text-[11px] sm:text-xs text-amber-100 font-medium mt-0.5 line-clamp-2">
                      Orientación vocacional, recorrido por 4 especialidades técnicas y Pase Digital QR en Firebase.
                    </p>
                  </div>
                </div>
              </div>

              {onOpenTutorial && (
                <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-950">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold truncate sm:whitespace-normal">
                      ¿Primer ingreso? Consulta la guía de 3 pasos.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenTutorial}
                    className="shrink-0 px-3 py-1.5 bg-white hover:bg-amber-100 text-stone-900 font-bold rounded-lg border border-amber-400 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <span>Ver Tutorial</span>
                    <ArrowRight className="w-3 h-3 text-amber-700" />
                  </button>
                </div>
              )}

              <div className="hidden sm:block p-4 space-y-2.5 bg-stone-50/70">
                <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center justify-between">
                  <span>4 Especialidades Técnicas</span>
                  <span className="text-stone-400 font-normal normal-case">Test · Carreras · QR</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5">
                  {(['programacion', 'comercio', 'rrhh', 'cosmetologia'] as const).map(specId => {
                    const item = COMIC_ASSETS.especialidades[specId];
                    return (
                      <div key={specId} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                        <div className="h-16 w-full overflow-hidden bg-stone-100">
                          <img src={item.image} alt={item.badge} className="w-full h-full object-cover" />
                        </div>
                        <div className="px-2 py-1.5 text-center">
                          <span className="text-[11px] font-bold text-stone-900 block truncate">
                            {specId === 'programacion'
                              ? 'Programación'
                              : specId === 'comercio'
                              ? 'Comercio y Aduanas'
                              : specId === 'rrhh'
                              ? 'Recursos Humanos'
                              : 'Cosmetología'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden min-w-0 flex flex-col">
            {onGoogleSignIn && (
              <div className="bg-blue-50/90 border-b border-blue-200 px-3.5 py-3 sm:px-5 space-y-2">
                {isFirebaseVerified ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Conectado a Firebase: {firebaseUser?.email}</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        {dbSnapshot.loading
                          ? 'Sincronizando base de datos en tiempo real...'
                          : isGoogleAdmin
                          ? 'Cuenta con permisos de Dirección Académica listos para ingresar.'
                          : estudiantesPropiosGoogle.length > 0
                          ? `Tienes ${estudiantesPropiosGoogle.length} matrícula(s) vinculada(s) lista(s) para entrar.`
                          : 'Conexión en línea lista. Completa tu registro escolar abajo.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isGoogleAdmin && onEnterAsGoogleAdmin && (
                        <button
                          type="button"
                          onClick={onEnterAsGoogleAdmin}
                          className="px-3.5 py-2 rounded-lg bg-[#721B32] hover:bg-[#5b1528] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <span>Entrar a Dirección</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isGoogleAdmin && estudiantesPropiosGoogle.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectQuickStudent(estudiantesPropiosGoogle[0])}
                          className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <span>Entrar como {estudiantesPropiosGoogle[0].nombre_completo.split(' ')[0]}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onGoogleSignOut && (
                        <button
                          type="button"
                          onClick={() => void onGoogleSignOut()}
                          className="px-2.5 py-2 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-semibold text-xs cursor-pointer whitespace-nowrap"
                        >
                          Cambiar cuenta
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-[11px] sm:text-xs text-blue-950 leading-snug min-w-0">
                      <strong>Acceso Obligatorio en Línea (Firebase):</strong> Conecta tu cuenta Google para registrar tu matrícula, guardar tus evaluaciones o entrar como Dirección.
                    </div>
                    <button
                      type="button"
                      onClick={() => void onGoogleSignIn()}
                      disabled={authLoading || !dbSnapshot.online}
                      className="px-3.5 py-2 rounded-lg bg-[#721B32] hover:bg-[#5b1528] text-white font-bold text-xs shadow-2xs cursor-pointer shrink-0 transition-colors whitespace-nowrap disabled:opacity-60"
                    >
                      {authLoading ? 'Conectando...' : 'Conectar Cuenta Google'}
                    </button>
                  </div>
                )}

                {(authError || dbSnapshot.syncError) && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{authError || dbSnapshot.syncError}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('registro');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-3 px-2 sm:px-4 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'registro'
                    ? 'border-[#721B32] text-[#721B32] bg-white font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold">
                  <span className="sm:hidden">1. Registro</span>
                  <span className="hidden sm:inline">1. Nuevo Registro</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className={`flex-1 py-3 px-2 sm:px-4 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'login'
                    ? 'border-[#721B32] text-[#721B32] bg-white font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold">
                  <span className="sm:hidden">2. Ingresar</span>
                  <span className="hidden sm:inline">2. Ya Registrado</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('docente')}
                className={`py-3 px-3 sm:px-5 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'docente'
                    ? 'border-[#721B32] text-[#721B32] bg-white font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
                title="Acceso para personal académico"
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold">
                  <span className="sm:hidden">Docente</span>
                  <span className="hidden sm:inline">Dirección</span>
                </span>
              </button>
            </div>

            {activeTab === 'registro' && (
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
                <div className="flex items-center justify-between text-xs font-medium text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <div className={`flex items-center gap-2 min-w-0 ${paso === 1 ? 'text-[#721B32] font-bold' : 'text-stone-700'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0 font-bold ${paso === 1 ? 'bg-[#721B32]' : 'bg-emerald-600'}`}>
                      {paso > 1 ? '✓' : '1'}
                    </span>
                    <span className="text-xs truncate">
                      <span className="sm:hidden">1: Datos Alumno</span>
                      <span className="hidden sm:inline">Paso 1: Alumno (CURP y Grupo)</span>
                    </span>
                  </div>
                  <span className="text-stone-300 px-1 shrink-0">➔</span>
                  <div className={`flex items-center gap-2 min-w-0 ${paso === 2 ? 'text-[#721B32] font-bold' : 'text-stone-400'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0 font-bold ${paso === 2 ? 'bg-[#721B32]' : 'bg-stone-300'}`}>
                      2
                    </span>
                    <span className="text-xs truncate">
                      <span className="sm:hidden">2: Papá o Tutor</span>
                      <span className="hidden sm:inline">Paso 2: Papá o Tutor (Correo Obligatorio)</span>
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-900 flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed font-medium">{errorMsg}</div>
                  </div>
                )}

                {successNotice && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed font-semibold">{successNotice}</div>
                  </div>
                )}

                {paso === 1 && (
                  <form onSubmit={e => void handleNextStep(e)} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                      <span className="text-[11px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">
                        Datos Escolares del Alumno
                      </span>
                      <button
                        type="button"
                        onClick={handleAutocompletarPrueba}
                        className="text-xs font-bold text-[#721B32] hover:text-[#501323] flex items-center gap-1 bg-[#721B32]/10 hover:bg-[#721B32]/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>⚡ Llenar ejemplo rápido</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        Nombre Completo del Estudiante *
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        autoCapitalize="words"
                        placeholder="Ej. Mariana Guadalupe Sánchez Cruz"
                        value={nombreCompleto}
                        onChange={e => setNombreCompleto(e.target.value)}
                        className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#721B32] focus:outline-none bg-white font-medium shadow-2xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                          <Fingerprint className="w-4 h-4 text-[#721B32] shrink-0" />
                          <span>CURP Oficial (18 Caracteres) *</span>
                        </label>
                        <span className={`text-[11px] font-mono-code font-bold ${
                          cleanCurp.length === 18 ? 'text-emerald-700' : 'text-stone-400'
                        }`}>
                          {cleanCurp.length}/18
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={18}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="Ej. SACM090714HDFRLA01"
                        value={curp}
                        onChange={e => setCurp(e.target.value.toUpperCase())}
                        className={`w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-mono-code font-bold tracking-wider border rounded-xl focus:ring-2 focus:ring-[#721B32] focus:outline-none bg-white shadow-2xs ${
                          estudianteExistenteConCurp
                            ? 'border-red-400 bg-red-50/50 text-red-900'
                            : cleanCurp.length === 18
                            ? 'border-emerald-500 bg-emerald-50/30 text-stone-900'
                            : 'border-stone-300 text-stone-900'
                        }`}
                      />

                      {estudianteExistenteConCurp && (
                        <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <span>
                            ⚠️ La CURP ya está asignada a <strong>{estudianteExistenteConCurp.nombre_completo}</strong>.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectQuickStudent(estudianteExistenteConCurp)}
                            className="w-full sm:w-auto px-3 py-1.5 bg-red-800 text-white rounded-lg text-xs font-bold whitespace-nowrap hover:bg-red-900 cursor-pointer text-center"
                          >
                            Ingresar con esta cuenta
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-800 mb-1">
                          Número de Control Escolar *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          placeholder="Ej. 26316070010042"
                          value={numControl}
                          onChange={e => setNumControl(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-mono-code font-bold border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#721B32] focus:outline-none bg-white shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-800 mb-1">
                          Teléfono Celular del Alumno
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="Ej. 55 1234 5678"
                          value={telefonoAlumno}
                          onChange={e => setTelefonoAlumno(e.target.value)}
                          className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#721B32] focus:outline-none bg-white shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-stone-800">
                          Grupo de 1.° Semestre *
                        </label>
                        <span className="text-[11px] font-semibold text-[#721B32] bg-[#721B32]/10 px-2 py-0.5 rounded">
                          Turno Único Matutino
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {GRUPOS_PRIMER_SEMESTRE.map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGrupo(g)}
                            className={`py-2.5 text-xs font-mono-code font-bold rounded-xl border text-center transition-all cursor-pointer ${
                              grupo === g
                                ? 'bg-[#721B32] text-white border-[#721B32] shadow-xs ring-2 ring-[#721B32]/30'
                                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-200">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 sm:py-3 bg-[#721B32] hover:bg-[#5b1528] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span>{submitting ? 'Verificando unicidad en Firebase...' : 'Continuar al Paso 2: Datos del Tutor'}</span>
                        {!submitting && <ArrowRight className="w-4 h-4 shrink-0" />}
                      </button>
                    </div>
                  </form>
                )}

                {paso === 2 && (
                  <form onSubmit={e => void handleFinalizarRegistro(e)} className="space-y-4">
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 leading-relaxed">
                      <div className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
                        <Mail className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Vinculación Obligatoria del Tutor Legal</span>
                      </div>
                      El correo de tu papá, mamá o tutor legal se registrará directamente en Firebase para validar su firma digital y autorizar tu <strong>Pase Digital QR</strong>.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">Parentesco con el Alumno *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Padre', 'Madre', 'Tutor Legal'] as const).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setParentesco(p)}
                            className={`py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer truncate ${
                              parentesco === p
                                ? 'bg-[#721B32] text-white border-[#721B32] shadow-xs ring-2 ring-[#721B32]/30'
                                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            {p === 'Padre' ? '👨 Padre' : p === 'Madre' ? '👩 Madre' : '⚖️ Tutor Legal'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        Nombre Completo del Padre, Madre o Tutor *
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        autoCapitalize="words"
                        placeholder="Ej. Roberto Sánchez Morales"
                        value={nombreTutor}
                        onChange={e => setNombreTutor(e.target.value)}
                        className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#721B32] focus:outline-none bg-white font-medium shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-800 mb-1">Teléfono del Tutor *</label>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          placeholder="Ej. 55 9876 5432"
                          value={telefonoTutor}
                          onChange={e => setTelefonoTutor(e.target.value)}
                          className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#721B32] focus:outline-none bg-white shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-800 mb-1">Correo Electrónico del Tutor *</label>
                        <input
                          type="email"
                          inputMode="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          autoComplete="email"
                          required
                          placeholder="Ej. tutor.alumno@gmail.com"
                          value={correoTutor}
                          onChange={e => setCorreoTutor(e.target.value)}
                          className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-mono-code border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#721B32] focus:outline-none bg-white shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setPaso(1)}
                        className="w-full sm:w-auto px-4 py-3 sm:py-2.5 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Regresar al Paso 1</span>
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                        <span>{submitting ? 'Guardando en Firebase...' : 'Completar Registro y Entrar'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'login' && (
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
                <div className="text-center max-w-md mx-auto">
                  <h3 className="text-base font-bold text-stone-900">
                    Ingreso de Alumnos Registrados en Firebase
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Conecta tu cuenta Google vinculada e ingresa tu <strong>CURP</strong> o <strong>Número de Control</strong>.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">{loginError}</div>
                  </div>
                )}

                <form onSubmit={handleLoginExisting} className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">CURP o Número de Control:</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="Ej. SACM090714HDFRLA01 o 26316070010042"
                        value={loginQuery}
                        onChange={e => setLoginQuery(e.target.value.toUpperCase())}
                        className="w-full pl-10 pr-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-mono-code font-bold tracking-wider border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#721B32] focus:outline-none bg-white shadow-2xs"
                      />
                      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isOnlineConnected}
                    className="w-full py-3.5 sm:py-3 bg-[#721B32] hover:bg-[#5b1528] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Acceder a mi Cuenta de Alumno</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="border-t border-stone-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Matrículas Disponibles en tu Sesión ({estudiantesRegistrados.length})
                    </span>
                    <span className="text-[10px] text-stone-400">Sincronizado con Firebase</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                    {estudiantesRegistrados.map(est => (
                      <button
                        key={est.num_control}
                        type="button"
                        onClick={() => handleSelectQuickStudent(est)}
                        className="p-3 text-left rounded-xl border border-stone-200 hover:border-[#721B32] hover:bg-stone-50 transition-all flex items-center justify-between text-xs cursor-pointer gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-stone-900 truncate">{est.nombre_completo}</div>
                          <div className="text-[10px] text-stone-500 font-mono-code truncate">
                            {est.curp} · {est.grupo}
                          </div>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold shrink-0 ${
                          est.tutor?.verificado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {est.tutor?.verificado ? '✓ Tutor OK' : '⚠️ Sin Firma'}
                        </span>
                      </button>
                    ))}
                    {estudiantesRegistrados.length === 0 && (
                      <div className="col-span-1 sm:col-span-2 text-center p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500 space-y-1">
                        <p className="font-semibold text-stone-700">
                          {isFirebaseVerified
                            ? 'No hay alumnos vinculados a esta cuenta Google'
                            : 'Conecta tu cuenta Google arriba para consultar tu registro en Firebase'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'docente' && (
              <div className="w-full p-4 sm:p-6 space-y-4 max-w-md mx-auto flex-1">
                <div className="text-center space-y-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#721B32] text-white flex items-center justify-center mx-auto shadow-xs">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 pt-1">
                    Autenticación de Dirección Académica
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    El módulo directivo está protegido mediante Google Auth y reglas de seguridad en Cloud Firestore. La única cuenta administradora autorizada para cambios es <strong>rafajrosales@gmail.com</strong>.
                  </p>
                </div>

                {isFirebaseVerified ? (
                  isGoogleAdmin ? (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Cuenta autorizada: <strong>{firebaseUser?.email}</strong></span>
                      </div>
                      {onEnterAsGoogleAdmin && (
                        <button
                          type="button"
                          onClick={onEnterAsGoogleAdmin}
                          className="w-full py-3 bg-[#721B32] hover:bg-[#5b1528] text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-300" />
                          <span>Entrar al Tablero de Dirección</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950">
                        La cuenta conectada (<strong>{firebaseUser?.email}</strong>) no cuenta con rol de Dirección en Firebase.
                      </div>
                      {onGoogleSignOut && (
                        <button
                          type="button"
                          onClick={() => void onGoogleSignOut()}
                          className="w-full py-2.5 bg-white border border-stone-300 text-stone-800 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                        >
                          Cambiar a cuenta Google institucional
                        </button>
                      )}
                    </div>
                  )
                ) : (
                  onGoogleSignIn && (
                    <button
                      type="button"
                      disabled={authLoading || !dbSnapshot.online}
                      onClick={() => void onGoogleSignIn()}
                      className="w-full py-3 bg-[#721B32] hover:bg-[#5b1528] disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>{authLoading ? 'Conectando...' : 'Conectar Cuenta Google de Dirección'}</span>
                    </button>
                  )
                )}
              </div>
            )}

            <div className="bg-stone-100 px-4 sm:px-6 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-stone-500 font-mono-code shrink-0">
              <span>Plantel Cuautepec, GAM, CDMX</span>
              <span>Base Única en Línea · Firebase 2026</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
