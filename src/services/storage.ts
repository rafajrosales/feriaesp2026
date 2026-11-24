import type { User } from 'firebase/auth';
import {
  Estudiante,
  EvaluacionVocacional,
  ProgresoVirtual,
  ProgresoEspecialidad,
  FichaAcademiaReq,
  OficioCircular,
  SpecialtyId,
  DocenteAutorizado,
  DocenteAcceso,
  ReactivoExamen,
  LetraOpcionVocacional,
  DesglosePartesVocacional,
  AccesoGoogle,
  AccesoGoogleEvento
} from '../types';
import {
  ESTUDIANTES_INICIALES,
  FICHAS_ACADEMIA_DEFAULT,
  OFICIO_CIRCULAR_DEFAULT,
  COSMETOLOGIA_DIAGNOSTICO_REACTIVOS,
  RRHH_DIAGNOSTICO_REACTIVOS,
  TEST_VOCACIONAL_40_PREGUNTAS
} from '../data/mockData';
import { getNivelComprension } from '../utils/comprension';
import { normalizeEvaluacionFromFirestore } from '../utils/vocationalMetrics';
import {
  auth,
  checkDocenteAcceso,
  checkIsFirebaseAdmin,
  cloudCheckCurpAvailable,
  cloudCheckNumControlAvailable,
  cloudDeleteDocente,
  cloudDeleteEstudianteCascade,
  cloudEnsureInstitutionalDefaultsIfEmpty,
  cloudFetchDocentes,
  cloudFetchFichas,
  cloudFetchOficio,
  cloudRegisterEstudianteAtomic,
  cloudRegistrarAccesoGoogle,
  cloudSaveDocente,
  cloudSaveEstudiante,
  cloudSaveEvaluacion,
  cloudSaveFichaAcademia,
  cloudSaveOficioCircular,
  cloudSaveProgreso,
  cloudSeedDocentesList,
  cloudSeedEstudiantesWithRelations,
  cloudSyncMissingDocenteAccesos,
  cloudWipeDocentes,
  cloudWipeEstudiantes,
  hasVerifiedFirebaseUser,
  isValidEmailDocIdClient,
  normalizeDocenteEmail,
  requireOnlineFirebase,
  subscribeAppDatabase,
  subscribePublicCollections,
  testConnection
} from './firebase';

const SESSION_KEYS = {
  ESTUDIANTE_ACTIVO: 'cetis7_session_estudiante_activo_nc',
  SESION_ACTIVA: 'cetis7_session_usuario_activa',
  AUTH_LOGGED_UID: 'cetis7_session_auth_logged_uid'
} as const;

// Purge legacy localStorage tables if present from older versions
const LEGACY_LOCAL_KEYS = [
  'cetis7_estudiantes',
  'cetis7_evaluaciones',
  'cetis7_progresos_virtuales',
  'cetis7_fichas_academia',
  'cetis7_oficio_circular',
  'cetis7_estudiante_activo_nc',
  'cetis7_sesion_activa',
  'cetis7_docentes_autorizados',
  'cetis7_cuestionarios_especialidad',
  'cetis7_estudiantes_initialized',
  'cetis7_vocacional_40_v1_synced',
  'cetis7_especialidades_comprension_v3_synced',
  'cetis7_drive_gallery_v1_synced',
  'cetis7_comercio_aduanas_v1_synced',
  'cetis7_comercio_infografia_gal_v1_synced',
  'cetis7_cosmetologia_infografia_v1_synced',
  'cetis7_comercio_video_principal_v1_synced',
  'cetis7_especialidades_5reactivos_fichas_v2_synced'
];

if (typeof window !== 'undefined') {
  try {
    LEGACY_LOCAL_KEYS.forEach(k => window.localStorage.removeItem(k));
  } catch {
    // ignore storage access issues
  }
}

export const DOCENTES_INICIALES: DocenteAutorizado[] = [
  {
    id: 'DOC-2026-001',
    nombre_completo: 'Ing. Marco Antonio Estrada Ruiz',
    rfc: 'EASM780412HDF',
    correo_institucional: 'marco.estrada@cetis7.edu.mx',
    academia: 'programacion',
    rol: 'Jefe de Academia',
    nivel_acceso: 'editor',
    clave_acceso: 'PROG2026',
    estatus_autorizacion: 'AUTORIZADO',
    fecha_alta: '2026-01-10T09:00:00.000Z',
    registrado_por: 'Administrador DGETI'
  },
  {
    id: 'DOC-2026-002',
    nombre_completo: 'Lic. Claudia Becerril Hernández',
    rfc: 'BECC820915MDF',
    correo_institucional: 'claudia.becerril@cetis7.edu.mx',
    academia: 'comercio',
    rol: 'Profesor Titular',
    nivel_acceso: 'lector',
    clave_acceso: 'COM2026',
    estatus_autorizacion: 'AUTORIZADO',
    fecha_alta: '2026-01-12T10:30:00.000Z',
    registrado_por: 'Administrador DGETI'
  },
  {
    id: 'DOC-2026-003',
    nombre_completo: 'Mtra. Patricia Mendoza Paredes',
    rfc: 'MEMP751108HDF',
    correo_institucional: 'patricia.mendoza@cetis7.edu.mx',
    academia: 'rrhh',
    rol: 'Profesor Titular',
    nivel_acceso: 'lector',
    clave_acceso: 'RRHH2026',
    estatus_autorizacion: 'AUTORIZADO',
    fecha_alta: '2026-01-15T11:00:00.000Z',
    registrado_por: 'Administrador DGETI'
  },
  {
    id: 'DOC-2026-004',
    nombre_completo: 'Cosmiatra Rosa Isela Romero Vargas',
    rfc: 'RORR850320MDF',
    correo_institucional: 'rosa.romero@cetis7.edu.mx',
    academia: 'cosmetologia',
    rol: 'Jefe de Academia',
    nivel_acceso: 'editor',
    clave_acceso: 'COSM2026',
    estatus_autorizacion: 'AUTORIZADO',
    fecha_alta: '2026-01-18T14:20:00.000Z',
    registrado_por: 'Administrador DGETI'
  }
];

// ---------------------------------------------------------------------
// Reactive In-Memory Database Mirror (Populated Exclusively by Firestore)
// ---------------------------------------------------------------------

export interface OnlineDbState {
  online: boolean;
  connected: boolean;
  loading: boolean;
  ready: boolean;
  isAdmin: boolean;
  hasDirectionAccess: boolean;
  docenteAcceso: DocenteAcceso | null;
  syncError: string | null;
  lastSyncAt: string | null;
  estudiantes: Estudiante[];
  evaluaciones: Record<string, EvaluacionVocacional>;
  progresos: Record<string, ProgresoVirtual>;
  fichas: Record<string, FichaAcademiaReq>;
  oficio: OficioCircular;
  docentes: DocenteAutorizado[];
  accesosGoogle: AccesoGoogle[];
}

const DOCENTES_CACHE_KEY = 'cetis7_docentes_cache_v1';

export function getInitialDocentes(): DocenteAutorizado[] {
  if (typeof window === 'undefined') return [...DOCENTES_INICIALES];
  try {
    const raw = window.localStorage.getItem(DOCENTES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, DocenteAutorizado>();
        DOCENTES_INICIALES.forEach(d => map.set(d.id, d));
        parsed.forEach((d: DocenteAutorizado) => {
          if (d && d.id) map.set(d.id, d);
        });
        return Array.from(map.values());
      }
    }
  } catch {
    // fallback
  }
  return [...DOCENTES_INICIALES];
}

export function persistDocentesCache(docentes: DocenteAutorizado[]): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(DOCENTES_CACHE_KEY, JSON.stringify(docentes));
    } catch {
      // ignore
    }
  }
}

const initialDbState: OnlineDbState = {
  online: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
  connected: false,
  loading: false,
  ready: false,
  isAdmin: false,
  hasDirectionAccess: false,
  docenteAcceso: null,
  syncError: null,
  lastSyncAt: null,
  estudiantes: [],
  evaluaciones: {},
  progresos: {},
  fichas: { ...FICHAS_ACADEMIA_DEFAULT },
  oficio: { ...OFICIO_CIRCULAR_DEFAULT },
  docentes: getInitialDocentes(),
  accesosGoogle: []
};

let dbState: OnlineDbState = { ...initialDbState };
const storeListeners = new Set<() => void>();
let activeUnsubscribe: (() => void) | null = null;
let publicUnsubscribe: (() => void) | null = null;
let connectedUserUid: string | null = null;
let inFlightConnect: { key: string; promise: Promise<ResultadoSyncBD> } | null = null;

function emitStoreChange() {
  storeListeners.forEach(listener => listener());
}

function updateDbState(patch: Partial<OnlineDbState>) {
  dbState = { ...dbState, ...patch };
  emitStoreChange();
}

export function iniciarSuscripcionPublica(): void {
  if (typeof window === 'undefined') return;
  if (publicUnsubscribe) return;

  publicUnsubscribe = subscribePublicCollections({
    onDocentes: cloudList => {
      if (cloudList && cloudList.length > 0) {
        const map = new Map<string, DocenteAutorizado>();
        DOCENTES_INICIALES.forEach(d => map.set(d.id, d));
        cloudList.forEach(d => {
          if (d && d.id) map.set(d.id, d);
        });
        const merged = Array.from(map.values());
        updateDbState({ docentes: merged });
        persistDocentesCache(merged);
      }
    },
    onFichas: cloudFichas => {
      if (cloudFichas && Object.keys(cloudFichas).length > 0) {
        updateDbState({
          fichas: { ...FICHAS_ACADEMIA_DEFAULT, ...cloudFichas }
        });
      }
    },
    onOficio: cloudOficio => {
      if (cloudOficio) {
        updateDbState({ oficio: cloudOficio });
      }
    }
  });
}

if (typeof window !== 'undefined') {
  iniciarSuscripcionPublica();
}

export function subscribeDbStore(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

export function getDbStoreSnapshot(): OnlineDbState {
  return dbState;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    updateDbState({ online: true, syncError: null });
    void testConnection(true).then(ok => updateDbState({ connected: ok }));
  });
  window.addEventListener('offline', () => {
    updateDbState({
      online: false,
      connected: false,
      syncError: 'Sin conexión a Internet. La plataforma trabaja únicamente en línea con Firebase.'
    });
  });
}

export function disconnectOnlineDatabase(): void {
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }
  connectedUserUid = null;
  inFlightConnect = null;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_KEYS.AUTH_LOGGED_UID);
  }
  updateDbState({
    ...initialDbState,
    docentes: getInitialDocentes(),
    online: typeof navigator !== 'undefined' ? navigator.onLine !== false : true
  });
}

export async function connectOnlineDatabase(
  user: User,
  isAdmin: boolean,
  docenteAcceso: DocenteAcceso | null = null
): Promise<ResultadoSyncBD> {
  if (!user || !user.emailVerified) {
    disconnectOnlineDatabase();
    return {
      connected: false,
      requiresAuth: true,
      estudiantesCount: 0,
      evaluacionesCount: 0,
      progresosCount: 0,
      syncedAt: new Date().toISOString()
    };
  }

  const isAuthorizedDoc = Boolean(docenteAcceso && docenteAcceso.estatus_autorizacion === 'AUTORIZADO');
  const hasDirectionAccess = isAdmin || isAuthorizedDoc;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const msg = 'Sin conexión a Internet. No es posible operar en modo offline.';
    updateDbState({ online: false, connected: false, loading: false, syncError: msg });
    return {
      connected: false,
      requiresAuth: false,
      isAdmin,
      userEmail: user.email,
      estudiantesCount: 0,
      evaluacionesCount: 0,
      progresosCount: 0,
      syncedAt: new Date().toISOString(),
      error: msg
    };
  }

  // Re-attach cleanly if user or direction access level changed or not yet connected
  if (
    activeUnsubscribe &&
    connectedUserUid === user.uid &&
    dbState.isAdmin === isAdmin &&
    dbState.hasDirectionAccess === hasDirectionAccess &&
    dbState.connected
  ) {
    return {
      connected: true,
      requiresAuth: false,
      isAdmin,
      userEmail: user.email,
      estudiantesCount: dbState.estudiantes.length,
      evaluacionesCount: Object.keys(dbState.evaluaciones).length,
      progresosCount: Object.keys(dbState.progresos).length,
      syncedAt: dbState.lastSyncAt || new Date().toISOString()
    };
  }

  const connectKey = `${user.uid}:${isAdmin ? 'admin' : hasDirectionAccess ? 'docente' : 'user'}`;
  if (inFlightConnect && inFlightConnect.key === connectKey) {
    return inFlightConnect.promise;
  }

  const runConnect = async (): Promise<ResultadoSyncBD> => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
      activeUnsubscribe = null;
    }

    connectedUserUid = user.uid;
    updateDbState({
      loading: true,
      syncError: null,
      isAdmin,
      hasDirectionAccess,
      docenteAcceso
    });

    const reachable = await testConnection(true);
    if (!reachable) {
      const msg = 'No se pudo conectar con la base de datos única en Firebase Firestore.';
      updateDbState({ connected: false, loading: false, syncError: msg });
      return {
        connected: false,
        requiresAuth: false,
        isAdmin,
        userEmail: user.email,
        estudiantesCount: 0,
        evaluacionesCount: 0,
        progresosCount: 0,
        syncedAt: new Date().toISOString(),
        error: msg
      };
    }

    if (isAdmin) {
      await cloudEnsureInstitutionalDefaultsIfEmpty(FICHAS_ACADEMIA_DEFAULT, OFICIO_CIRCULAR_DEFAULT).catch(err => {
        console.warn('No se pudieron verificar defaults institucionales:', err);
      });
      void cloudSyncMissingDocenteAccesos();
    }

    activeUnsubscribe = subscribeAppDatabase(user, isAdmin, hasDirectionAccess, {
      onEstudiantes: list => {
        updateDbState({
          connected: true,
          loading: false,
          ready: true,
          estudiantes: list,
          syncError: null,
          lastSyncAt: new Date().toISOString()
        });
      },
      onEvaluaciones: dict => {
        updateDbState({
          connected: true,
          evaluaciones: dict,
          lastSyncAt: new Date().toISOString()
        });
      },
      onProgresos: dict => {
        updateDbState({
          connected: true,
          progresos: dict,
          lastSyncAt: new Date().toISOString()
        });
      },
      onFichas: dict => {
        const merged = { ...FICHAS_ACADEMIA_DEFAULT, ...dict };
        const progRemote = dict.programacion;
        const progDefault = FICHAS_ACADEMIA_DEFAULT.programacion;
        if (progRemote && progDefault) {
          const remoteGal = progRemote.recursos_multimedia?.galeria_alumnos || [];
          const hasDrive = remoteGal.some(item => String(item.id).startsWith('prog-drive-'));
          const defaultDrive = (progDefault.recursos_multimedia?.galeria_alumnos || []).filter(item =>
            String(item.id).startsWith('prog-drive-')
          );
          if (!hasDrive && defaultDrive.length > 0) {
            merged.programacion = {
              ...progRemote,
              recursos_multimedia: {
                ...progRemote.recursos_multimedia,
                galeria_alumnos: [...remoteGal, ...defaultDrive]
              }
            };
          }
        }
        updateDbState({
          connected: true,
          fichas: merged,
          lastSyncAt: new Date().toISOString()
        });
      },
      onOficio: oficio => {
        updateDbState({
          connected: true,
          oficio: oficio || { ...OFICIO_CIRCULAR_DEFAULT },
          lastSyncAt: new Date().toISOString()
        });
      },
      onDocentes: list => {
        updateDbState({
          connected: true,
          docentes: list,
          lastSyncAt: new Date().toISOString()
        });
      },
      onAccesosGoogle: list => {
        updateDbState({
          connected: true,
          accesosGoogle: list,
          lastSyncAt: new Date().toISOString()
        });
      },
      onDocenteAcceso: acceso => {
        const nextAuthorized = Boolean(acceso && acceso.estatus_autorizacion === 'AUTORIZADO');
        const nextHasDir = isAdmin || nextAuthorized;
        if (nextHasDir !== dbState.hasDirectionAccess) {
          void connectOnlineDatabase(user, isAdmin, acceso);
        } else {
          updateDbState({ docenteAcceso: acceso });
        }
      },
      onError: err => {
        updateDbState({
          loading: false,
          syncError: err.message
        });
      }
    });

    return {
      connected: true,
      requiresAuth: false,
      isAdmin,
      userEmail: user.email,
      estudiantesCount: dbState.estudiantes.length,
      evaluacionesCount: Object.keys(dbState.evaluaciones).length,
      progresosCount: Object.keys(dbState.progresos).length,
      syncedAt: new Date().toISOString()
    };
  };

  const promise = runConnect().finally(() => {
    if (inFlightConnect?.promise === promise) {
      inFlightConnect = null;
    }
  });
  inFlightConnect = { key: connectKey, promise };
  return promise;
}

export interface ResultadoSyncBD {
  connected: boolean;
  requiresAuth?: boolean;
  isAdmin?: boolean;
  userEmail?: string | null;
  estudiantesCount: number;
  evaluacionesCount: number;
  progresosCount: number;
  syncedAt: string;
  error?: string;
}

export async function sincronizarBaseDeDatosCETis7(): Promise<ResultadoSyncBD> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return {
      connected: false,
      requiresAuth: true,
      estudiantesCount: 0,
      evaluacionesCount: 0,
      progresosCount: 0,
      syncedAt: new Date().toISOString()
    };
  }
  const [isAdmin, docAcceso] = await Promise.all([
    checkIsFirebaseAdmin(user),
    checkDocenteAcceso(user)
  ]);
  return connectOnlineDatabase(user, isAdmin, docAcceso);
}

// ---------------------------------------------------------------------
// Tokens & Psychometric Evaluators
// ---------------------------------------------------------------------

export function generateHashShort(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase();
  return hex.padStart(4, '0').slice(-4);
}

export function generateClaveUnicaToken(numControl: string, timestamp: number = Date.now()): string {
  const tsSeconds = Math.floor(timestamp / 1000);
  const hash = generateHashShort(`${numControl}-${tsSeconds}-CETIS7-DGETI`);
  return `${numControl}-${tsSeconds}-${hash}`;
}

export function parseTokenPayload(token: string): { numControl: string; timestamp: number } | null {
  try {
    const parts = token.split('-');
    if (parts.length >= 3) {
      return {
        numControl: parts[0],
        timestamp: parseInt(parts[1], 10) * 1000
      };
    }
    return null;
  } catch {
    return null;
  }
}

const LETTER_TO_IDX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

function buildStandardSeedProgress(
  reactivos: ReactivoExamen[],
  wrongQuestionIds: number[]
): ProgresoEspecialidad {
  const wrongSet = new Set(wrongQuestionIds);
  const respuestas_detalle: Record<number, number> = {};
  let correctCount = 0;

  reactivos.forEach((item, index) => {
    const qId = typeof item.id === 'number' ? item.id : index + 1;
    const correctIdx = LETTER_TO_IDX[item.correcta.toLowerCase()] ?? 0;
    if (wrongSet.has(qId)) {
      respuestas_detalle[qId] = (correctIdx + 1) % item.opciones.length;
    } else {
      respuestas_detalle[qId] = correctIdx;
      correctCount++;
    }
  });

  const puntaje_maximo = reactivos.length || 5;
  const calificacion_quiz = Math.round((correctCount / puntaje_maximo) * 100);
  const nivel_perfil = getNivelComprension(calificacion_quiz);

  return {
    video_visto: true,
    infografia_explorada: true,
    proyectos_revisados: true,
    quiz_aprobado: true,
    calificacion_quiz,
    puntaje_obtenido: correctCount,
    puntaje_maximo,
    nivel_perfil,
    respuestas_detalle
  };
}

const SPECIALTY_NAMES_MAP: Record<SpecialtyId, string> = {
  programacion: 'Programación',
  comercio: 'Comercio Internacional y Aduanas',
  rrhh: 'Administración de Recursos Humanos',
  cosmetologia: 'Cosmetología'
};

export function evaluarTestVocacional40(
  numControl: string,
  respuestasPorId: Record<number, LetraOpcionVocacional>,
  fechaEvalISO?: string
): EvaluacionVocacional {
  const puntajes: Record<SpecialtyId, number> = {
    programacion: 0,
    comercio: 0,
    rrhh: 0,
    cosmetologia: 0
  };

  const desglose_partes: DesglosePartesVocacional = {
    parte1_intereses: { programacion: 0, comercio: 0, rrhh: 0, cosmetologia: 0 },
    parte2_actividades: { programacion: 0, comercio: 0, rrhh: 0, cosmetologia: 0 },
    parte3_habilidades: { programacion: 0, comercio: 0, rrhh: 0, cosmetologia: 0 },
    parte4_metas: { programacion: 0, comercio: 0, rrhh: 0, cosmetologia: 0 }
  };

  const respuestas: Record<string, LetraOpcionVocacional> = {};

  TEST_VOCACIONAL_40_PREGUNTAS.forEach(pregunta => {
    const letra = respuestasPorId[pregunta.id];
    if (!letra) return;
    const opt = pregunta.opciones.find(o => o.letra === letra);
    if (!opt) return;

    const spec = opt.specialty;
    puntajes[spec] += 1;
    respuestas[String(pregunta.id)] = letra;

    if (pregunta.parte === 1) desglose_partes.parte1_intereses[spec] += 1;
    else if (pregunta.parte === 2) desglose_partes.parte2_actividades[spec] += 1;
    else if (pregunta.parte === 3) desglose_partes.parte3_habilidades[spec] += 1;
    else if (pregunta.parte === 4) desglose_partes.parte4_metas[spec] += 1;
  });

  const totalReactivos = TEST_VOCACIONAL_40_PREGUNTAS.length;
  const porcentajes: Record<SpecialtyId, number> = {
    programacion: Math.round((puntajes.programacion / totalReactivos) * 100),
    comercio: Math.round((puntajes.comercio / totalReactivos) * 100),
    rrhh: Math.round((puntajes.rrhh / totalReactivos) * 100),
    cosmetologia: Math.round((puntajes.cosmetologia / totalReactivos) * 100)
  };

  const careers: SpecialtyId[] = ['programacion', 'rrhh', 'comercio', 'cosmetologia'];
  const ranking = careers
    .map(c => ({ id: c, pts: puntajes[c] }))
    .sort((a, b) => b.pts - a.pts);

  const maxPts = ranking[0].pts;
  const empatadas = ranking.filter(r => r.pts === maxPts).map(r => r.id);
  const primaria = empatadas[0];
  const secundaria = empatadas.length > 1 ? empatadas[1] : ranking[1].id;

  const narrativaBase: Record<SpecialtyId, string> = {
    programacion:
      'Tu perfil destaca en pensamiento lógico, resolución paso a paso, interés por aplicaciones digitales, algoritmos y creación de herramientas tecnológicas.',
    comercio:
      'Presentas marcada afinidad por el intercambio global, aduanas, logística de exportación, negociación internacional y análisis de costos y mercados.',
    rrhh:
      'Demuestras sólidas competencias interpersonales, empatía, liderazgo colaborativo, mediación de conflictos y organización del talento humano.',
    cosmetologia:
      'Sobresales por tu sentido estético, precisión manual, sensibilidad en el cuidado de la piel, higiene profesional y atención personalizada.'
  };

  let analisis_pedagogico = '';
  if (empatadas.length > 1) {
    const nombresEmpatadas = empatadas.map(id => SPECIALTY_NAMES_MAP[id]).join(' y ');
    analisis_pedagogico = `Empate técnico detectado con ${maxPts}/${totalReactivos} puntos (${Math.round((maxPts / totalReactivos) * 100)}% de afinidad) entre ${nombresEmpatadas}. De acuerdo con la guía oficial del CETis No. 7, ambas especialidades se consideran opciones afines recomendadas para tu perfil.`;
  } else {
    analisis_pedagogico = `${narrativaBase[primaria]} Obtuviste ${maxPts} de ${totalReactivos} reactivos afines (${porcentajes[primaria]}%), con ${SPECIALTY_NAMES_MAP[secundaria]} (${puntajes[secundaria]} pts · ${porcentajes[secundaria]}%) como segunda opción complementaria.`;
  }

  return {
    num_control: numControl,
    version_test: '40_REACTIVOS_2026',
    total_reactivos: totalReactivos,
    desglose_partes,
    respuestas,
    especialidades_empatadas: empatadas,
    carrera_sugerida: primaria,
    segunda_opcion: secundaria,
    analisis_pedagogico,
    fecha_evaluacion: fechaEvalISO || new Date().toISOString()
  };
}

function buildEvaluacion40Seed(
  numControl: string,
  counts: Record<SpecialtyId, number>,
  fechaEvalISO: string
): EvaluacionVocacional {
  const secuencia: SpecialtyId[] = [];
  (['programacion', 'comercio', 'rrhh', 'cosmetologia'] as SpecialtyId[]).forEach(spec => {
    for (let i = 0; i < counts[spec]; i++) {
      secuencia.push(spec);
    }
  });
  const respuestas: Record<number, LetraOpcionVocacional> = {};
  const stride = 7;
  const usedIndices = new Set<number>();

  TEST_VOCACIONAL_40_PREGUNTAS.forEach((pregunta, qIdx) => {
    let pickIdx = (qIdx * stride) % secuencia.length;
    while (usedIndices.has(pickIdx) && usedIndices.size < secuencia.length) {
      pickIdx = (pickIdx + 1) % secuencia.length;
    }
    usedIndices.add(pickIdx);
    const desiredSpec = secuencia[pickIdx] || 'programacion';
    const matchOpt = pregunta.opciones.find(o => o.specialty === desiredSpec) || pregunta.opciones[0];
    respuestas[pregunta.id] = matchOpt.letra;
  });
  return evaluarTestVocacional40(numControl, respuestas, fechaEvalISO);
}

function buildSeedBundle() {
  const gaelNC = ESTUDIANTES_INICIALES[0].num_control;
  const valeriaNC = ESTUDIANTES_INICIALES[1].num_control;
  const diegoNC = ESTUDIANTES_INICIALES[2].num_control;
  const ximenaNC = ESTUDIANTES_INICIALES[3].num_control;
  const mateoNC = ESTUDIANTES_INICIALES[4].num_control;
  const camilaNC = ESTUDIANTES_INICIALES[5].num_control;
  const leonardoNC = ESTUDIANTES_INICIALES[6].num_control;
  const renataNC = ESTUDIANTES_INICIALES[7].num_control;

  const evaluaciones: Record<string, EvaluacionVocacional> = {
    [gaelNC]: buildEvaluacion40Seed(gaelNC, { programacion: 28, comercio: 6, rrhh: 4, cosmetologia: 2 }, new Date(Date.now() - 86400000).toISOString()),
    [valeriaNC]: buildEvaluacion40Seed(valeriaNC, { comercio: 27, rrhh: 7, programacion: 4, cosmetologia: 2 }, new Date(Date.now() - 80000000).toISOString()),
    [diegoNC]: buildEvaluacion40Seed(diegoNC, { rrhh: 28, comercio: 6, cosmetologia: 4, programacion: 2 }, new Date(Date.now() - 75000000).toISOString()),
    [ximenaNC]: buildEvaluacion40Seed(ximenaNC, { cosmetologia: 29, rrhh: 6, comercio: 3, programacion: 2 }, new Date(Date.now() - 70000000).toISOString()),
    [mateoNC]: buildEvaluacion40Seed(mateoNC, { programacion: 23, comercio: 9, rrhh: 5, cosmetologia: 3 }, new Date(Date.now() - 50000000).toISOString()),
    [camilaNC]: buildEvaluacion40Seed(camilaNC, { cosmetologia: 24, rrhh: 9, comercio: 4, programacion: 3 }, new Date(Date.now() - 40000000).toISOString()),
    [leonardoNC]: buildEvaluacion40Seed(leonardoNC, { programacion: 25, comercio: 8, rrhh: 4, cosmetologia: 3 }, new Date(Date.now() - 30000000).toISOString()),
    [renataNC]: buildEvaluacion40Seed(renataNC, { comercio: 26, rrhh: 7, programacion: 4, cosmetologia: 3 }, new Date(Date.now() - 20000000).toISOString())
  };

  const baseFinishedSpecs = {
    programacion: { video_visto: true, infografia_explorada: true, proyectos_revisados: true, quiz_aprobado: true, calificacion_quiz: 100, puntaje_obtenido: 5, puntaje_maximo: 5, nivel_perfil: 'MUCHO' as const },
    comercio: { video_visto: true, infografia_explorada: true, proyectos_revisados: true, quiz_aprobado: true, calificacion_quiz: 100, puntaje_obtenido: 5, puntaje_maximo: 5, nivel_perfil: 'MUCHO' as const }
  };

  const progresos: Record<string, ProgresoVirtual> = {
    [gaelNC]: {
      num_control: gaelNC,
      test_vocacional_completado: true,
      progreso_especialidades: {
        ...baseFinishedSpecs,
        rrhh: buildStandardSeedProgress(RRHH_DIAGNOSTICO_REACTIVOS, [4]),
        cosmetologia: buildStandardSeedProgress(COSMETOLOGIA_DIAGNOSTICO_REACTIVOS, [2, 5])
      },
      porcentaje_virtual: 100,
      promedio_cuestionarios: 85.0,
      clave_unica_token: generateClaveUnicaToken(gaelNC, Date.now() - 3600000),
      estatus_fase_virtual: 'COMPLETADO',
      fecha_termino: new Date(Date.now() - 3600000).toISOString()
    },
    [valeriaNC]: {
      num_control: valeriaNC,
      test_vocacional_completado: true,
      progreso_especialidades: {
        ...baseFinishedSpecs,
        rrhh: buildStandardSeedProgress(RRHH_DIAGNOSTICO_REACTIVOS, [3, 5]),
        cosmetologia: buildStandardSeedProgress(COSMETOLOGIA_DIAGNOSTICO_REACTIVOS, [4])
      },
      porcentaje_virtual: 100,
      promedio_cuestionarios: 85.0,
      clave_unica_token: generateClaveUnicaToken(valeriaNC, Date.now() - 7200000),
      estatus_fase_virtual: 'COMPLETADO',
      fecha_termino: new Date(Date.now() - 7200000).toISOString()
    },
    [diegoNC]: {
      num_control: diegoNC,
      test_vocacional_completado: true,
      progreso_especialidades: {
        ...baseFinishedSpecs,
        rrhh: buildStandardSeedProgress(RRHH_DIAGNOSTICO_REACTIVOS, []),
        cosmetologia: buildStandardSeedProgress(COSMETOLOGIA_DIAGNOSTICO_REACTIVOS, [3])
      },
      porcentaje_virtual: 100,
      promedio_cuestionarios: 95.0,
      clave_unica_token: generateClaveUnicaToken(diegoNC, Date.now() - 10800000),
      estatus_fase_virtual: 'COMPLETADO',
      fecha_termino: new Date(Date.now() - 10800000).toISOString()
    },
    [ximenaNC]: {
      num_control: ximenaNC,
      test_vocacional_completado: true,
      progreso_especialidades: {
        ...baseFinishedSpecs,
        rrhh: buildStandardSeedProgress(RRHH_DIAGNOSTICO_REACTIVOS, [2]),
        cosmetologia: buildStandardSeedProgress(COSMETOLOGIA_DIAGNOSTICO_REACTIVOS, [])
      },
      porcentaje_virtual: 100,
      promedio_cuestionarios: 95.0,
      clave_unica_token: generateClaveUnicaToken(ximenaNC, Date.now() - 14400000),
      estatus_fase_virtual: 'COMPLETADO',
      fecha_termino: new Date(Date.now() - 14400000).toISOString()
    },
    [mateoNC]: {
      num_control: mateoNC,
      test_vocacional_completado: true,
      progreso_especialidades: {
        programacion: { video_visto: true, infografia_explorada: true, proyectos_revisados: true, quiz_aprobado: true, calificacion_quiz: 60, puntaje_obtenido: 3, puntaje_maximo: 5, nivel_perfil: 'REGULAR' },
        comercio: { video_visto: true, infografia_explorada: true, proyectos_revisados: true, quiz_aprobado: true, calificacion_quiz: 80, puntaje_obtenido: 4, puntaje_maximo: 5, nivel_perfil: 'MUCHO' },
        rrhh: { video_visto: false, infografia_explorada: false, proyectos_revisados: false, quiz_aprobado: false, calificacion_quiz: 0 },
        cosmetologia: { video_visto: false, infografia_explorada: false, proyectos_revisados: false, quiz_aprobado: false, calificacion_quiz: 0 }
      },
      porcentaje_virtual: 60,
      promedio_cuestionarios: 70.0,
      clave_unica_token: '',
      estatus_fase_virtual: 'EN_PROCESO'
    },
    [camilaNC]: {
      num_control: camilaNC,
      test_vocacional_completado: true,
      progreso_especialidades: {
        programacion: { video_visto: false, infografia_explorada: false, proyectos_revisados: false, quiz_aprobado: false, calificacion_quiz: 0 },
        comercio: { video_visto: false, infografia_explorada: false, proyectos_revisados: false, quiz_aprobado: false, calificacion_quiz: 0 },
        rrhh: { video_visto: false, infografia_explorada: false, proyectos_revisados: false, quiz_aprobado: false, calificacion_quiz: 0 },
        cosmetologia: buildStandardSeedProgress(COSMETOLOGIA_DIAGNOSTICO_REACTIVOS, [])
      },
      porcentaje_virtual: 40,
      promedio_cuestionarios: 100.0,
      clave_unica_token: '',
      estatus_fase_virtual: 'EN_PROCESO'
    },
    [leonardoNC]: {
      num_control: leonardoNC,
      test_vocacional_completado: true,
      progreso_especialidades: {
        ...baseFinishedSpecs,
        rrhh: buildStandardSeedProgress(RRHH_DIAGNOSTICO_REACTIVOS, [1, 2, 4]),
        cosmetologia: buildStandardSeedProgress(COSMETOLOGIA_DIAGNOSTICO_REACTIVOS, [2, 3])
      },
      porcentaje_virtual: 100,
      promedio_cuestionarios: 75.0,
      clave_unica_token: generateClaveUnicaToken(leonardoNC, Date.now() - 18000000),
      estatus_fase_virtual: 'COMPLETADO',
      fecha_termino: new Date(Date.now() - 18000000).toISOString()
    },
    [renataNC]: {
      num_control: renataNC,
      test_vocacional_completado: true,
      progreso_especialidades: {
        ...baseFinishedSpecs,
        rrhh: buildStandardSeedProgress(RRHH_DIAGNOSTICO_REACTIVOS, [5]),
        cosmetologia: buildStandardSeedProgress(COSMETOLOGIA_DIAGNOSTICO_REACTIVOS, [1, 2, 4])
      },
      porcentaje_virtual: 100,
      promedio_cuestionarios: 80.0,
      clave_unica_token: generateClaveUnicaToken(renataNC, Date.now() - 21600000),
      estatus_fase_virtual: 'COMPLETADO',
      fecha_termino: new Date(Date.now() - 21600000).toISOString()
    }
  };

  return {
    estudiantes: ESTUDIANTES_INICIALES,
    evaluaciones,
    progresos
  };
}

// ---------------------------------------------------------------------
// Reactive Read Accessors (Strictly From Live Firestore Mirror)
// ---------------------------------------------------------------------

export function getEstudiantes(): Estudiante[] {
  return dbState.estudiantes;
}

export function getEstudianteByNC(nc: string): Estudiante | null {
  return dbState.estudiantes.find(e => e.num_control === nc) || null;
}

export function getEstudianteByCURP(curp: string): Estudiante | null {
  const clean = curp.trim().toUpperCase();
  return dbState.estudiantes.find(e => e.curp.trim().toUpperCase() === clean) || null;
}

export function validarCURP(curp: string): { valido: boolean; mensaje?: string } {
  const clean = curp.trim().toUpperCase();
  if (!clean) {
    return { valido: false, mensaje: 'La CURP es obligatoria.' };
  }
  if (clean.length !== 18) {
    return { valido: false, mensaje: `La CURP debe tener exactamente 18 caracteres (actualmente tiene ${clean.length}).` };
  }
  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
  if (!regex.test(clean)) {
    return { valido: false, mensaje: 'El formato de la CURP es inválido (ejemplo: LOVM090412HDFRLA01).' };
  }
  return { valido: true };
}

export function getAllEvaluacionesVocacionales(): Record<string, EvaluacionVocacional> {
  return dbState.evaluaciones;
}

export function getEvaluacionVocacional(nc: string): EvaluacionVocacional | null {
  if (!nc) return null;
  return dbState.evaluaciones[nc] || null;
}

export function getProgresoVirtual(nc: string): ProgresoVirtual {
  if (nc && dbState.progresos[nc]) {
    return dbState.progresos[nc];
  }
  return {
    num_control: nc || '',
    test_vocacional_completado: false,
    progreso_especialidades: {
      programacion: { video_visto: false, infografia_explorada: false, proyectos_revisados: false, quiz_aprobado: false, calificacion_quiz: 0 },
      comercio: { video_visto: false, infografia_explorada: false, proyectos_revisados: false, quiz_aprobado: false, calificacion_quiz: 0 },
      rrhh: { video_visto: false, infografia_explorada: false, proyectos_revisados: false, quiz_aprobado: false, calificacion_quiz: 0 },
      cosmetologia: { video_visto: false, infografia_explorada: false, proyectos_revisados: false, quiz_aprobado: false, calificacion_quiz: 0 }
    },
    porcentaje_virtual: 0,
    promedio_cuestionarios: 0,
    clave_unica_token: '',
    estatus_fase_virtual: 'PENDIENTE'
  };
}

export function getFichasAcademia(): Record<string, FichaAcademiaReq> {
  return dbState.fichas;
}

export function getOficioCircular(): OficioCircular {
  return dbState.oficio;
}

export function getDocentes(): DocenteAutorizado[] {
  return dbState.docentes;
}

// ---------------------------------------------------------------------
// Session State (UI Pointer Only — Cleared on Sign Out, Never Stores DB)
// ---------------------------------------------------------------------

export interface SesionUsuario {
  tipo: 'alumno' | 'docente';
  num_control?: string;
  nombre?: string;
  esAdmin?: boolean;
  esEditor?: boolean;
  rolDocente?: string;
  docenteId?: string;
  docenteEmail?: string;
  timestamp?: number;
}

export function getSesionActiva(): SesionUsuario | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(SESSION_KEYS.SESION_ACTIVA);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SesionUsuario;
  } catch {
    return null;
  }
}

export function setSesionActiva(sesion: SesionUsuario | null): void {
  if (typeof window === 'undefined') return;
  if (!sesion) {
    window.sessionStorage.removeItem(SESSION_KEYS.SESION_ACTIVA);
  } else {
    window.sessionStorage.setItem(
      SESSION_KEYS.SESION_ACTIVA,
      JSON.stringify({ ...sesion, timestamp: Date.now() })
    );
  }
}

export function cerrarSesion(): void {
  setSesionActiva(null);
}

export function getEstudianteActivoNC(): string {
  if (typeof window !== 'undefined') {
    const stored = window.sessionStorage.getItem(SESSION_KEYS.ESTUDIANTE_ACTIVO);
    if (stored) return stored;
  }
  return dbState.estudiantes[0]?.num_control || '';
}

export function setEstudianteActivoNC(nc: string): void {
  if (typeof window === 'undefined') return;
  if (!nc) {
    window.sessionStorage.removeItem(SESSION_KEYS.ESTUDIANTE_ACTIVO);
  } else {
    window.sessionStorage.setItem(SESSION_KEYS.ESTUDIANTE_ACTIVO, nc);
  }
}

// ---------------------------------------------------------------------
// Online-Only Firestore Mutations
// ---------------------------------------------------------------------

export async function registrarNuevoEstudiante(estudiante: Estudiante): Promise<{
  success: boolean;
  error?: string;
  estudiante?: Estudiante;
}> {
  const cleanCurp = estudiante.curp.trim().toUpperCase();
  const cleanNC = estudiante.num_control.trim();

  const curpCheck = validarCURP(cleanCurp);
  if (!curpCheck.valido) {
    return { success: false, error: curpCheck.mensaje };
  }

  try {
    const { user } = await requireOnlineFirebase(false);

    // 1. Global uniqueness check in Firestore across all devices (AI Studio & Vercel)
    const curpAvail = await cloudCheckCurpAvailable(cleanCurp);
    if (!curpAvail.available) {
      return {
        success: false,
        error: `La CURP "${cleanCurp}" ya está registrada en la base única de Firebase (Núm. Control: ${curpAvail.numControl || 'asignado'}). Por normatividad de la DGETI solo se permite un registro por alumno.`
      };
    }

    const ncAvail = await cloudCheckNumControlAvailable(cleanNC);
    if (!ncAvail.available) {
      return {
        success: false,
        error: `El Número de Control "${cleanNC}" ya se encuentra asignado en Firebase. Verifica tu número escolar o solicita apoyo a Control Escolar.`
      };
    }

    const normalized: Estudiante = {
      ...estudiante,
      curp: cleanCurp,
      num_control: cleanNC,
      turno: 'MATUTINO',
      correo_institucional:
        estudiante.correo_institucional ||
        `${estudiante.nombre_completo.split(' ')[0].toLowerCase()}.${cleanNC.slice(-4)}@cetis7.edu.mx`,
      ownerUid: user.uid
    };

    const created = await cloudRegisterEstudianteAtomic(normalized);

    const existingList = dbState.estudiantes.filter(e => e.num_control !== created.num_control);
    updateDbState({ estudiantes: [...existingList, created] });

    setEstudianteActivoNC(created.num_control);
    setSesionActiva({
      tipo: 'alumno',
      num_control: created.num_control,
      nombre: created.nombre_completo
    });

    return { success: true, estudiante: created };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo registrar el estudiante en Firebase.'
    };
  }
}

export async function registrarAccesoGoogleEnNube(
  user: User,
  isAdminFlag: boolean,
  metodo: AccesoGoogleEvento['metodo'] = 'login_interactivo'
): Promise<void> {
  if (!user || !user.emailVerified) return;
  if (typeof window !== 'undefined') {
    const alreadyLogged = window.sessionStorage.getItem(SESSION_KEYS.AUTH_LOGGED_UID);
    if (metodo === 'sesion_activa' && alreadyLogged === user.uid) return;
    window.sessionStorage.setItem(SESSION_KEYS.AUTH_LOGGED_UID, user.uid);
  }
  try {
    await cloudRegistrarAccesoGoogle(user, isAdminFlag, metodo);
  } catch (error) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_KEYS.AUTH_LOGGED_UID);
    }
    console.warn('No se pudo registrar el acceso de Google en Firebase:', error);
  }
}

export async function saveEstudiante(estudiante: Estudiante): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEst: Estudiante = { ...estudiante, turno: 'MATUTINO' };
    await cloudSaveEstudiante(normalizedEst);
    const list = dbState.estudiantes.filter(e => e.num_control !== normalizedEst.num_control);
    updateDbState({ estudiantes: [...list, normalizedEst] });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo actualizar el registro en Firebase.'
    };
  }
}

export async function verificarYFirmarTutor(
  numControl: string,
  firmaDigital: string,
  correoConfirmado?: string
): Promise<{ success: boolean; estudiante?: Estudiante; error?: string }> {
  const existing = getEstudianteByNC(numControl);
  if (!existing) {
    return { success: false, error: 'Estudiante no encontrado en la sesión activa.' };
  }

  const updated: Estudiante = {
    ...existing,
    tutor: {
      ...existing.tutor,
      verificado: true,
      fecha_verificacion: new Date().toISOString(),
      firma_digital: firmaDigital,
      ...(correoConfirmado ? { correo_tutor: correoConfirmado } : {})
    }
  };

  const res = await saveEstudiante(updated);
  if (!res.success) {
    return { success: false, error: res.error };
  }
  return { success: true, estudiante: updated };
}

export async function guardarEvaluacionVocacionalEnBD(
  evaluacion: EvaluacionVocacional
): Promise<{ syncedToCloud: boolean; error?: string }> {
  if (!evaluacion || !evaluacion.num_control) {
    return { syncedToCloud: false, error: 'Número de control inválido.' };
  }
  if (!hasVerifiedFirebaseUser()) {
    return {
      syncedToCloud: false,
      error: 'Debes iniciar sesión con Google para guardar en la base única de Firebase.'
    };
  }

  const est = getEstudianteByNC(evaluacion.num_control);
  const ownerUid = evaluacion.ownerUid || est?.ownerUid || auth.currentUser?.uid;
  const payloadEval: EvaluacionVocacional = ownerUid ? { ...evaluacion, ownerUid } : evaluacion;

  try {
    await cloudSaveEvaluacion(payloadEval);
    updateDbState({
      evaluaciones: {
        ...dbState.evaluaciones,
        [payloadEval.num_control]: payloadEval
      }
    });
    return { syncedToCloud: true };
  } catch (err: unknown) {
    return {
      syncedToCloud: false,
      error: err instanceof Error ? err.message : 'Error al guardar evaluación vocacional en Firebase.'
    };
  }
}

export async function saveEvaluacionVocacional(evaluacion: EvaluacionVocacional): Promise<void> {
  const res = await guardarEvaluacionVocacionalEnBD(evaluacion);
  if (!res.syncedToCloud && res.error) {
    throw new Error(res.error);
  }
}

export async function saveProgresoVirtual(
  progreso: ProgresoVirtual
): Promise<{ success: boolean; progreso: ProgresoVirtual; error?: string }> {
  const cleanNC = (progreso?.num_control || '').trim();
  const cloneProgreso: ProgresoVirtual = {
    ...progreso,
    num_control: cleanNC,
    progreso_especialidades: {
      programacion: { ...progreso.progreso_especialidades.programacion },
      comercio: { ...progreso.progreso_especialidades.comercio },
      rrhh: { ...progreso.progreso_especialidades.rrhh },
      cosmetologia: { ...progreso.progreso_especialidades.cosmetologia }
    }
  };

  if (!cleanNC) {
    return { success: true, progreso: cloneProgreso };
  }

  let pct = 0;
  if (cloneProgreso.test_vocacional_completado) pct += 20;

  let totalQuizScores = 0;
  let quizesCompleted = 0;

  const careers: SpecialtyId[] = ['programacion', 'comercio', 'rrhh', 'cosmetologia'];
  careers.forEach(c => {
    const sp = cloneProgreso.progreso_especialidades[c];
    const quizDone = Boolean(sp.quiz_aprobado || (sp.puntaje_maximo ?? 0) > 0);
    const moduleDone = quizDone || sp.video_visto || sp.infografia_explorada || sp.proyectos_revisados;
    if (quizDone) {
      sp.quiz_aprobado = true;
      totalQuizScores += sp.calificacion_quiz;
      quizesCompleted++;
    }
    if (quizDone || moduleDone) {
      pct += 20;
    }
  });

  cloneProgreso.porcentaje_virtual = Math.min(100, Math.round(pct));
  cloneProgreso.promedio_cuestionarios =
    quizesCompleted > 0 ? Math.round((totalQuizScores / quizesCompleted) * 10) / 10 : 0;

  if (cloneProgreso.porcentaje_virtual >= 100) {
    cloneProgreso.estatus_fase_virtual = 'COMPLETADO';
    if (!cloneProgreso.clave_unica_token) {
      cloneProgreso.clave_unica_token = generateClaveUnicaToken(cloneProgreso.num_control);
    }
    if (!cloneProgreso.fecha_termino) {
      cloneProgreso.fecha_termino = new Date().toISOString();
    }
  } else if (cloneProgreso.porcentaje_virtual > 0) {
    cloneProgreso.estatus_fase_virtual = 'EN_PROCESO';
  } else {
    cloneProgreso.estatus_fase_virtual = 'PENDIENTE';
  }

  const est = getEstudianteByNC(cloneProgreso.num_control);
  if (!cloneProgreso.ownerUid) {
    cloneProgreso.ownerUid = est?.ownerUid || auth.currentUser?.uid;
  }

  try {
    await cloudSaveProgreso(cloneProgreso);
    updateDbState({
      progresos: {
        ...dbState.progresos,
        [cloneProgreso.num_control]: cloneProgreso
      }
    });
    return { success: true, progreso: cloneProgreso };
  } catch (error) {
    return {
      success: false,
      progreso: cloneProgreso,
      error: error instanceof Error ? error.message : 'No se pudo guardar el progreso en Firebase.'
    };
  }
}

export async function saveFichaAcademia(
  ficha: FichaAcademiaReq
): Promise<{ success: boolean; error?: string }> {
  try {
    if (hasVerifiedFirebaseUser()) {
      await cloudSaveFichaAcademia(ficha);
    }
    updateDbState({
      fichas: {
        ...dbState.fichas,
        [ficha.especialidad_id]: ficha
      }
    });
    return { success: true };
  } catch {
    updateDbState({
      fichas: {
        ...dbState.fichas,
        [ficha.especialidad_id]: ficha
      }
    });
    return { success: true };
  }
}

export async function saveOficioCircular(
  oficio: OficioCircular
): Promise<{ success: boolean; error?: string }> {
  try {
    if (hasVerifiedFirebaseUser()) {
      await cloudSaveOficioCircular(oficio);
    }
    updateDbState({ oficio });
    return { success: true };
  } catch {
    updateDbState({ oficio });
    return { success: true };
  }
}

export const CLAVES_MAESTRAS_AUTORIZADAS = [
  '2026',
  'DGETI72026',
  'CETIS7DIR',
  'DGETI2026',
  'DIR2026'
];

export const CLAVES_ACADEMIA_AUTORIZADAS: Record<string, { academia: SpecialtyId; nombre: string; rol: DocenteAutorizado['rol'] }> = {
  'PROG2026': { academia: 'programacion', nombre: 'Academia de Programación', rol: 'Jefe de Academia' },
  'COM2026': { academia: 'comercio', nombre: 'Academia de Comercio Internacional y Aduanas', rol: 'Jefe de Academia' },
  'RRHH2026': { academia: 'rrhh', nombre: 'Academia de Recursos Humanos', rol: 'Jefe de Academia' },
  'COSM2026': { academia: 'cosmetologia', nombre: 'Academia de Cosmetología', rol: 'Jefe de Academia' }
};

export async function autenticarDocentePorClave(
  identificador: string,
  clave: string
): Promise<{ success: boolean; docente?: DocenteAutorizado; error?: string }> {
  const cleanId = (identificador || '').trim().toLowerCase();
  const cleanClave = (clave || '').trim().toUpperCase();

  if (!cleanId || !cleanClave) {
    return { success: false, error: 'Ingresa tu correo o RFC y tu clave de acceso.' };
  }

  const isMasterKey = CLAVES_MAESTRAS_AUTORIZADAS.includes(cleanClave);

  // Sync latest docentes from Firestore if in-memory list doesn't have custom records yet
  let currentDocentes = getDocentes();
  if (currentDocentes.length <= DOCENTES_INICIALES.length) {
    try {
      const fetched = await cloudFetchDocentes();
      if (fetched && fetched.length > 0) {
        const map = new Map<string, DocenteAutorizado>();
        DOCENTES_INICIALES.forEach(d => map.set(d.id, d));
        fetched.forEach(d => {
          if (d && d.id) map.set(d.id, d);
        });
        currentDocentes = Array.from(map.values());
        updateDbState({ docentes: currentDocentes });
        persistDocentesCache(currentDocentes);
      }
    } catch {
      // keep local
    }
  }

  const cleanIdAlphaNum = cleanId.replace(/[^a-z0-9]/g, '');
  const findTeacher = (list: DocenteAutorizado[]) => {
    return list.find(d => {
      const dEmail = (d.correo_institucional || '').toLowerCase();
      const dRfc = (d.rfc || '').toLowerCase();
      const dRfcAlphaNum = dRfc.replace(/[^a-z0-9]/g, '');
      const dId = (d.id || '').toLowerCase();
      const dName = (d.nombre_completo || '').toLowerCase();

      if (
        dEmail === cleanId ||
        dRfc === cleanId ||
        (cleanIdAlphaNum.length >= 8 && dRfcAlphaNum === cleanIdAlphaNum) ||
        dId === cleanId ||
        dName === cleanId ||
        (cleanId.length >= 4 && dName.includes(cleanId))
      ) {
        return true;
      }

      if (cleanId.includes(' ')) {
        const parts = cleanId.split(/\s+/).filter(p => p.length >= 3);
        if (parts.length >= 2 && parts.every(part => dName.includes(part))) {
          return true;
        }
      }

      if (cleanId === 'rafajrosales@gmail.com' && (dEmail === 'rosalesg@gmail.com' || dName.includes('rosales'))) {
        return true;
      }

      return false;
    });
  };

  let found = findTeacher(currentDocentes);

  if (!found) {
    try {
      const fresh = await cloudFetchDocentes();
      if (fresh && fresh.length > 0) {
        const map = new Map<string, DocenteAutorizado>();
        DOCENTES_INICIALES.forEach(d => map.set(d.id, d));
        fresh.forEach(d => {
          if (d && d.id) map.set(d.id, d);
        });
        currentDocentes = Array.from(map.values());
        updateDbState({ docentes: currentDocentes });
        persistDocentesCache(currentDocentes);
        found = findTeacher(currentDocentes);
      }
    } catch {
      // ignore
    }
  }

  if (isMasterKey) {
    if (found) {
      return {
        success: true,
        docente: {
          ...found,
          nivel_acceso: 'editor'
        }
      };
    }

    const masterDocente: DocenteAutorizado = {
      id: 'DOC-MASTER-DIR',
      nombre_completo: 'Dirección General / Subdirección CETis 7',
      rfc: 'DGETI72026DIR',
      correo_institucional: 'direccion@cetis7.edu.mx',
      academia: 'programacion',
      rol: 'Subdirector',
      nivel_acceso: 'editor',
      clave_acceso: cleanClave,
      estatus_autorizacion: 'AUTORIZADO',
      fecha_alta: new Date().toISOString(),
      registrado_por: 'Clave Maestra Institucional'
    };
    return { success: true, docente: masterDocente };
  }

  if (found) {
    const assignedClave = (found.clave_acceso || '').trim().toUpperCase();
    const isAssignedClaveMatch = assignedClave === cleanClave;
    const isMasterBypass = isMasterKey;
    const isAcademiaClave =
      Boolean(CLAVES_ACADEMIA_AUTORIZADAS[cleanClave]) &&
      CLAVES_ACADEMIA_AUTORIZADAS[cleanClave].academia === found.academia;

    if (!isAssignedClaveMatch && !isMasterBypass && !isAcademiaClave) {
      return {
        success: false,
        error: 'La clave de acceso ingresada es incorrecta para este docente.'
      };
    }

    if (found.estatus_autorizacion !== 'AUTORIZADO') {
      return {
        success: false,
        error: `Tu cuenta se encuentra con estatus "${found.estatus_autorizacion}". Contacta a Dirección (rafajrosales@gmail.com).`
      };
    }

    return { success: true, docente: found };
  }

  if (CLAVES_ACADEMIA_AUTORIZADAS[cleanClave]) {
    const acadInfo = CLAVES_ACADEMIA_AUTORIZADAS[cleanClave];
    const isGenericAcadId =
      cleanId.includes(acadInfo.academia) ||
      cleanId.includes('academia') ||
      cleanId.includes('jefe') ||
      cleanId.includes('docente') ||
      cleanId.includes('maestro') ||
      cleanId === '2026';

    if (isGenericAcadId) {
      const acadDocente: DocenteAutorizado = {
        id: `DOC-ACAD-${acadInfo.academia.toUpperCase()}`,
        nombre_completo: `Jefatura de ${acadInfo.nombre}`,
        rfc: `ACAD${acadInfo.academia.slice(0, 4).toUpperCase()}2026`,
        correo_institucional: `${acadInfo.academia}@cetis7.edu.mx`,
        academia: acadInfo.academia,
        rol: acadInfo.rol,
        nivel_acceso: 'editor',
        clave_acceso: cleanClave,
        estatus_autorizacion: 'AUTORIZADO',
        fecha_alta: new Date().toISOString(),
        registrado_por: 'Clave de Academia'
      };
      return { success: true, docente: acadDocente };
    }
  }

  return {
    success: false,
    error: 'No se encontró ningún docente registrado con el correo, RFC o identificador ingresado. Contacta a Dirección (rafajrosales@gmail.com) para tu registro.'
  };
}

export async function registrarNuevoDocente(
  datos: Omit<DocenteAutorizado, 'id' | 'fecha_alta'>
): Promise<{ success: boolean; error?: string; docente?: DocenteAutorizado }> {
  const docentes = getDocentes();
  const cleanRfc = datos.rfc.trim().toUpperCase();
  const cleanClave = datos.clave_acceso.trim().toUpperCase();
  const cleanEmail = normalizeDocenteEmail(datos.correo_institucional);

  if (!cleanRfc) {
    return { success: false, error: 'El RFC del docente es obligatorio.' };
  }
  if (!isValidEmailDocIdClient(cleanEmail)) {
    return { success: false, error: 'Ingresa un correo electrónico válido (Gmail o institucional) para habilitar el acceso.' };
  }
  if (!cleanClave || cleanClave.length < 4) {
    return { success: false, error: 'El folio administrativo interno debe tener al menos 4 caracteres.' };
  }

  const existingRfc = docentes.find(d => d.rfc.trim().toUpperCase() === cleanRfc);
  if (existingRfc) {
    return {
      success: false,
      error: `El RFC "${cleanRfc}" ya está registrado a nombre de ${existingRfc.nombre_completo} (${existingRfc.rol}).`
    };
  }

  const existingEmail = docentes.find(d => normalizeDocenteEmail(d.correo_institucional) === cleanEmail);
  if (existingEmail) {
    return {
      success: false,
      error: `El correo "${cleanEmail}" ya está asignado al docente ${existingEmail.nombre_completo}.`
    };
  }

  const existingClave = docentes.find(d => d.clave_acceso.trim().toUpperCase() === cleanClave);
  if (existingClave) {
    return {
      success: false,
      error: `El folio "${cleanClave}" ya fue asignado al docente ${existingClave.nombre_completo}.`
    };
  }

  const nuevoDocente: DocenteAutorizado = {
    ...datos,
    id: `DOC-${Date.now()}`,
    rfc: cleanRfc,
    correo_institucional: cleanEmail,
    clave_acceso: cleanClave,
    fecha_alta: new Date().toISOString()
  };

  try {
    await cloudSaveDocente(nuevoDocente);
    const nextDocentes = [...docentes, nuevoDocente];
    updateDbState({ docentes: nextDocentes });
    persistDocentesCache(nextDocentes);
    return { success: true, docente: nuevoDocente };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo guardar el docente en Firebase.'
    };
  }
}

export async function actualizarDocente(
  datos: DocenteAutorizado,
  previousEmail?: string
): Promise<{ success: boolean; error?: string; docente?: DocenteAutorizado }> {
  const docentes = getDocentes();
  const cleanRfc = datos.rfc.trim().toUpperCase();
  const cleanEmail = normalizeDocenteEmail(datos.correo_institucional);
  const cleanClave = datos.clave_acceso.trim().toUpperCase();

  if (!cleanRfc || cleanRfc.length < 10) {
    return { success: false, error: 'Ingresa un RFC válido (mínimo 10 caracteres).' };
  }
  if (!isValidEmailDocIdClient(cleanEmail)) {
    return { success: false, error: 'Ingresa un correo electrónico válido (Gmail o institucional).' };
  }
  if (!cleanClave || cleanClave.length < 4) {
    return { success: false, error: 'El folio administrativo interno debe tener al menos 4 caracteres.' };
  }

  const dupRfc = docentes.find(d => d.id !== datos.id && d.rfc.trim().toUpperCase() === cleanRfc);
  if (dupRfc) {
    return { success: false, error: `El RFC "${cleanRfc}" ya pertenece a ${dupRfc.nombre_completo}.` };
  }

  const dupEmail = docentes.find(d => d.id !== datos.id && normalizeDocenteEmail(d.correo_institucional) === cleanEmail);
  if (dupEmail) {
    return { success: false, error: `El correo "${cleanEmail}" ya está asignado a ${dupEmail.nombre_completo}.` };
  }

  const updated: DocenteAutorizado = {
    ...datos,
    rfc: cleanRfc,
    correo_institucional: cleanEmail,
    clave_acceso: cleanClave
  };

  try {
    await cloudSaveDocente(updated, previousEmail);
    const nextDocentes = docentes.map(d => (d.id === updated.id ? updated : d));
    updateDbState({ docentes: nextDocentes });
    persistDocentesCache(nextDocentes);
    return { success: true, docente: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo actualizar el docente en Firebase.'
    };
  }
}

export async function cambiarEstatusDocente(
  id: string,
  nuevoEstatus: 'AUTORIZADO' | 'PENDIENTE' | 'REVOCADO'
): Promise<{ success: boolean; error?: string }> {
  const target = dbState.docentes.find(d => d.id === id);
  if (!target) return { success: false, error: 'Docente no encontrado.' };
  const updated: DocenteAutorizado = { ...target, estatus_autorizacion: nuevoEstatus };
  try {
    await cloudSaveDocente(updated, target.correo_institucional);
    const nextDocentes = dbState.docentes.map(d => (d.id === id ? updated : d));
    updateDbState({ docentes: nextDocentes });
    persistDocentesCache(nextDocentes);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo actualizar el estatus del docente.'
    };
  }
}

export async function cambiarNivelAccesoDocente(
  id: string,
  nuevoNivel: 'editor' | 'lector'
): Promise<{ success: boolean; error?: string }> {
  const target = dbState.docentes.find(d => d.id === id);
  if (!target) return { success: false, error: 'Docente no encontrado.' };
  const updated: DocenteAutorizado = { ...target, nivel_acceso: nuevoNivel };
  try {
    await cloudSaveDocente(updated, target.correo_institucional);
    const nextDocentes = dbState.docentes.map(d => (d.id === id ? updated : d));
    updateDbState({ docentes: nextDocentes });
    persistDocentesCache(nextDocentes);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo actualizar el nivel de acceso del docente.'
    };
  }
}

export async function eliminarDocente(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudDeleteDocente(id);
    const nextDocentes = dbState.docentes.filter(d => d.id !== id);
    updateDbState({ docentes: nextDocentes });
    persistDocentesCache(nextDocentes);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo eliminar el docente en Firebase.'
    };
  }
}

export async function eliminarEstudiante(numControl: string, curp?: string): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudDeleteEstudianteCascade(numControl, curp);
    const nextEval = { ...dbState.evaluaciones };
    delete nextEval[numControl];
    const nextProg = { ...dbState.progresos };
    delete nextProg[numControl];
    updateDbState({
      estudiantes: dbState.estudiantes.filter(e => e.num_control !== numControl),
      evaluaciones: nextEval,
      progresos: nextProg
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo eliminar el alumno de Firebase.'
    };
  }
}

// ---------------------------------------------------------------------
// Backups, Restore & Cohort Resets (Firebase Direct)
// ---------------------------------------------------------------------

export interface RespaldoCompletoCETis7 {
  version: string;
  fecha_generacion: string;
  plantel: string;
  ciclo: string;
  total_alumnos: number;
  total_docentes: number;
  datos: {
    alumnos: Estudiante[];
    docentes: DocenteAutorizado[];
    evaluaciones: Record<string, EvaluacionVocacional>;
    progresos: Record<string, ProgresoVirtual>;
    fichas?: Record<string, FichaAcademiaReq> | null;
    oficio?: OficioCircular | null;
  };
}

export function generarRespaldoCompleto(): RespaldoCompletoCETis7 {
  const alumnos = getEstudiantes();
  const docentes = getDocentes();

  return {
    version: '2.0.0-firebase',
    fecha_generacion: new Date().toISOString(),
    plantel: 'CETis No. 7 "Miguel Lerdo de Tejada"',
    ciclo: 'Feria de Especialidades 2026',
    total_alumnos: alumnos.length,
    total_docentes: docentes.length,
    datos: {
      alumnos,
      docentes,
      evaluaciones: dbState.evaluaciones,
      progresos: dbState.progresos,
      fichas: dbState.fichas,
      oficio: dbState.oficio
    }
  };
}

export function descargarRespaldoJSON(): {
  success: boolean;
  nombreArchivo: string;
  totalAlumnos: number;
  totalDocentes: number;
} {
  const respaldo = generarRespaldoCompleto();
  const jsonStr = JSON.stringify(respaldo, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const fechaStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `Respaldo_CETis7_Firebase_${fechaStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    nombreArchivo: fileName,
    totalAlumnos: respaldo.total_alumnos,
    totalDocentes: respaldo.total_docentes
  };
}

export async function restaurarDesdeRespaldoJSON(jsonString: string): Promise<{
  success: boolean;
  mensaje: string;
  totalAlumnos?: number;
  totalDocentes?: number;
}> {
  try {
    await requireOnlineFirebase(true);
    const data = JSON.parse(jsonString);
    if (!data.datos || (!data.datos.alumnos && !data.datos.docentes)) {
      return {
        success: false,
        mensaje: 'El archivo JSON no contiene una estructura válida de respaldo de CETis 7.'
      };
    }

    const rawAlumnos = Array.isArray(data.datos.alumnos) ? (data.datos.alumnos as Estudiante[]) : [];
    const alumnos: Estudiante[] = rawAlumnos.map(a => ({ ...a, turno: 'MATUTINO' as const }));
    const docentes: DocenteAutorizado[] = Array.isArray(data.datos.docentes) ? data.datos.docentes : [];
    const rawEval = (data.datos.evaluaciones || {}) as Record<string, Record<string, unknown>>;
    const normalizedEval: Record<string, EvaluacionVocacional> = {};
    for (const [nc, ev] of Object.entries(rawEval)) {
      normalizedEval[nc] = normalizeEvaluacionFromFirestore({ ...ev, num_control: (ev?.num_control as string) || nc });
    }
    const progresos: Record<string, ProgresoVirtual> = data.datos.progresos || {};

    if (Array.isArray(data.datos.alumnos)) {
      await cloudSeedEstudiantesWithRelations(alumnos, normalizedEval, progresos);
      if (alumnos.length > 0) {
        setEstudianteActivoNC(alumnos[0].num_control);
      } else {
        setEstudianteActivoNC('');
      }
    }

    if (Array.isArray(data.datos.docentes)) {
      await cloudSeedDocentesList(docentes);
    }

    if (data.datos.fichas && typeof data.datos.fichas === 'object') {
      for (const ficha of Object.values(data.datos.fichas as Record<string, FichaAcademiaReq>)) {
        if (ficha?.especialidad_id) {
          await cloudSaveFichaAcademia(ficha);
        }
      }
    }

    if (data.datos.oficio && typeof data.datos.oficio === 'object') {
      await cloudSaveOficioCircular(data.datos.oficio as OficioCircular);
    }

    return {
      success: true,
      mensaje: '¡Respaldo restaurado y sincronizado en la base única de Firebase!',
      totalAlumnos: alumnos.length,
      totalDocentes: docentes.length
    };
  } catch (err: unknown) {
    return {
      success: false,
      mensaje: `Error al restaurar respaldo en Firebase: ${err instanceof Error ? err.message : 'Formato inválido'}`
    };
  }
}

export async function reiniciarSoloAlumnos(modo: 'iniciales' | 'limpiar'): Promise<void> {
  await requireOnlineFirebase(true);
  if (modo === 'iniciales') {
    const bundle = buildSeedBundle();
    await cloudSeedEstudiantesWithRelations(bundle.estudiantes, bundle.evaluaciones, bundle.progresos);
    setEstudianteActivoNC(bundle.estudiantes[0]?.num_control || '');
  } else {
    await cloudWipeEstudiantes();
    setEstudianteActivoNC('');
    const ses = getSesionActiva();
    if (ses && ses.tipo === 'alumno') {
      cerrarSesion();
    }
  }
}

export async function reiniciarSoloDocentes(modo: 'iniciales' | 'limpiar'): Promise<void> {
  await requireOnlineFirebase(true);
  if (modo === 'iniciales') {
    await cloudSeedDocentesList(DOCENTES_INICIALES);
  } else {
    await cloudWipeDocentes();
  }
}

export async function reiniciarAlumnosYDocentes(modo: 'iniciales' | 'limpiar'): Promise<void> {
  await reiniciarSoloAlumnos(modo);
  await reiniciarSoloDocentes(modo);
}

export async function resetAllDataToDefault(): Promise<void> {
  await reiniciarAlumnosYDocentes('iniciales');
  for (const ficha of Object.values(FICHAS_ACADEMIA_DEFAULT)) {
    await cloudSaveFichaAcademia(ficha);
  }
  await cloudSaveOficioCircular(OFICIO_CIRCULAR_DEFAULT);
}
