import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  DocumentReference
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Estudiante,
  EvaluacionVocacional,
  ProgresoVirtual,
  DocenteAutorizado,
  FichaAcademiaReq,
  OficioCircular,
  AccesoGoogle,
  AccesoGoogleEvento
} from '../types';
import {
  normalizeEvaluacionFromFirestore,
  toNormalizedEvaluacionPayload
} from '../utils/vocationalMetrics';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createFirestoreInstance(): Firestore {
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  try {
    // 100% online memoryLocalCache (no IndexedDB offline persistence)
    return initializeFirestore(
      app,
      {
        localCache: memoryLocalCache(),
        ...(typeof window !== 'undefined'
          ? {
              experimentalAutoDetectLongPolling: true,
              experimentalLongPollingOptions: { timeoutSeconds: 8 }
            }
          : {}),
        ignoreUndefinedProperties: true
      },
      databaseId
    );
  } catch {
    return getFirestore(app, databaseId);
  }
}

export const db: Firestore = createFirestoreInstance();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || '(default)';
export const BOOTSTRAPPED_ADMIN_EMAIL = 'rafajrosales@gmail.com';
export const CONFIG_OFICIO_ID = 'oficio_circular';

export const COLLECTIONS = {
  ADMINS: 'admins',
  ACCESOS_GOOGLE: 'accesos_google',
  ESTUDIANTES: 'estudiantes',
  CURP_REGISTRY: 'curp_registry',
  DOCENTES: 'docentes',
  EVALUACIONES: 'evaluaciones',
  PROGRESOS: 'progresos',
  FICHAS: 'fichas_academia',
  CONFIGURACION: 'configuracion'
} as const;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let inFlightConnectionTest: Promise<boolean> | null = null;
let lastConnectionResult: { ok: boolean; checkedAt: number } | null = null;
const CONNECTION_CACHE_MS = 10000;

async function probeFirestoreRestReachability(): Promise<'reachable' | 'invalid_config' | 'unreachable'> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'unreachable';
  }
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    return 'invalid_config';
  }
  if (typeof fetch !== 'function') {
    return 'reachable';
  }

  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/${encodeURIComponent(databaseId)}/documents/test/connection?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    if (response.status === 400 || response.status === 404) {
      return 'invalid_config';
    }
    return 'reachable';
  } catch {
    return 'unreachable';
  } finally {
    clearTimeout(timer);
  }
}

export async function testConnection(forceRefresh = false): Promise<boolean> {
  if (!forceRefresh && lastConnectionResult && Date.now() - lastConnectionResult.checkedAt < CONNECTION_CACHE_MS) {
    return lastConnectionResult.ok;
  }
  if (inFlightConnectionTest) {
    return inFlightConnectionTest;
  }

  inFlightConnectionTest = (async () => {
    const restState = await probeFirestoreRestReachability();
    if (restState === 'invalid_config') {
      console.error('Please check your Firebase configuration.');
      lastConnectionResult = { ok: false, checkedAt: Date.now() };
      return false;
    }
    if (restState === 'unreachable') {
      lastConnectionResult = { ok: false, checkedAt: Date.now() };
      return false;
    }

    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      lastConnectionResult = { ok: true, checkedAt: Date.now() };
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        lastConnectionResult = { ok: false, checkedAt: Date.now() };
        return false;
      }
      lastConnectionResult = { ok: true, checkedAt: Date.now() };
      return true;
    }
  })().finally(() => {
    inFlightConnectionTest = null;
  });

  return inFlightConnectionTest;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    lastConnectionResult = null;
  });
  window.addEventListener('offline', () => {
    lastConnectionResult = { ok: false, checkedAt: Date.now() };
  });
}

void testConnection();

export function hasVerifiedFirebaseUser(): boolean {
  return Boolean(auth.currentUser && auth.currentUser.emailVerified);
}

export async function signInWithGooglePopup(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return null;
    }
    throw error;
  }
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export function onFirebaseAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Verifies admin status strictly against the sole authorized administrator email:
 * rafajrosales@gmail.com (with verified email).
 */
export async function checkIsFirebaseAdmin(user: User | null = auth.currentUser): Promise<boolean> {
  if (!user || !user.emailVerified || !user.email) return false;
  return user.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
}

export async function requireOnlineFirebase(requireAdmin = false): Promise<{ user: User; isAdmin: boolean }> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Sin conexión a Internet. La aplicación trabaja exclusivamente en línea con Firebase y no permite operación offline.');
  }
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('Se requiere iniciar sesión con una cuenta de Google verificada para acceder o guardar en la base única de Firebase.');
  }
  const connected = await testConnection(true);
  if (!connected) {
    throw new Error('No se pudo establecer conexión en línea con Cloud Firestore. Verifica tu red e intenta nuevamente.');
  }
  const isAdmin = await checkIsFirebaseAdmin(user);
  if (requireAdmin && !isAdmin) {
    throw new Error('Permisos insuficientes: esta operación requiere una cuenta autorizada de Dirección Académica en Firebase.');
  }
  return { user, isAdmin };
}

function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = sanitizeForFirestore(v);
      }
    }
    return out as T;
  }
  return value;
}

async function prepareWritePayload(
  docRef: DocumentReference,
  rawData: Record<string, unknown>,
  includeOwnerUid: boolean
): Promise<{ payload: Record<string, unknown>; opType: OperationType; exists: boolean }> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('Se requiere una cuenta Google verificada para guardar en Firestore.');
  }

  const snap = await getDocFromServer(docRef);
  const existingData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;

  const sanitized = sanitizeForFirestore(rawData);
  const resolvedOwnerUid = includeOwnerUid
    ? (typeof existingData?.ownerUid === 'string' && existingData.ownerUid
        ? existingData.ownerUid
        : typeof sanitized.ownerUid === 'string' && sanitized.ownerUid
        ? sanitized.ownerUid
        : user.uid)
    : undefined;

  const payload: Record<string, unknown> = {
    ...sanitized,
    ...(includeOwnerUid ? { ownerUid: resolvedOwnerUid } : {}),
    createdAt: existingData?.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  return {
    payload,
    opType: existingData ? OperationType.UPDATE : OperationType.CREATE,
    exists: Boolean(existingData)
  };
}

// ---------------------------------------------------------------------
// Global CURP & Num. Control Uniqueness (Cross-Device Online Checks)
// ---------------------------------------------------------------------

export async function cloudCheckCurpAvailable(curp: string): Promise<{ available: boolean; numControl?: string }> {
  await requireOnlineFirebase(false);
  const cleanCurp = curp.trim().toUpperCase();
  const path = `${COLLECTIONS.CURP_REGISTRY}/${cleanCurp}`;
  try {
    const snap = await getDocFromServer(doc(db, COLLECTIONS.CURP_REGISTRY, cleanCurp));
    if (!snap.exists()) return { available: true };
    const data = snap.data();
    return {
      available: false,
      numControl: typeof data?.num_control === 'string' ? data.num_control : undefined
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function cloudCheckNumControlAvailable(numControl: string): Promise<{ available: boolean }> {
  await requireOnlineFirebase(false);
  const cleanNC = numControl.trim();
  const path = `${COLLECTIONS.ESTUDIANTES}/${cleanNC}`;
  try {
    const snap = await getDocFromServer(doc(db, COLLECTIONS.ESTUDIANTES, cleanNC));
    return { available: !snap.exists() };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function cloudRegisterEstudianteAtomic(estudiante: Estudiante): Promise<Estudiante> {
  const { user } = await requireOnlineFirebase(false);
  const cleanNC = estudiante.num_control.trim();
  const cleanCurp = estudiante.curp.trim().toUpperCase();
  const ownerUid = estudiante.ownerUid || user.uid;

  const estRef = doc(db, COLLECTIONS.ESTUDIANTES, cleanNC);
  const curpRef = doc(db, COLLECTIONS.CURP_REGISTRY, cleanCurp);

  try {
    const [estSnap, curpSnap] = await Promise.all([
      getDocFromServer(estRef),
      getDocFromServer(curpRef)
    ]);

    if (curpSnap.exists()) {
      const existingNc = curpSnap.data()?.num_control || 'otro registro';
      throw new Error(
        `La CURP "${cleanCurp}" ya está registrada en la base única de Firebase (Núm. Control: ${existingNc}). Por normatividad de la DGETI, solo se permite un registro por alumno.`
      );
    }

    if (estSnap.exists()) {
      throw new Error(
        `El Número de Control "${cleanNC}" ya se encuentra asignado en Firebase. Verifica tu número escolar o contacta a Control Escolar.`
      );
    }

    const normalized: Estudiante = {
      ...estudiante,
      num_control: cleanNC,
      curp: cleanCurp,
      turno: 'MATUTINO',
      ownerUid
    };

    const batch = writeBatch(db);
    batch.set(estRef, {
      ...sanitizeForFirestore(normalized as unknown as Record<string, unknown>),
      ownerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    batch.set(curpRef, {
      curp: cleanCurp,
      num_control: cleanNC,
      ownerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    return normalized;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('ya está registrada') || error.message.includes('ya se encuentra asignado'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.ESTUDIANTES}/${cleanNC}`);
  }
}

export async function cloudSaveEstudiante(estudiante: Estudiante): Promise<void> {
  await requireOnlineFirebase(false);
  const cleanNC = estudiante.num_control.trim();
  const estRef = doc(db, COLLECTIONS.ESTUDIANTES, cleanNC);
  const path = `${COLLECTIONS.ESTUDIANTES}/${cleanNC}`;

  try {
    const snap = await getDocFromServer(estRef);
    if (!snap.exists()) {
      await cloudRegisterEstudianteAtomic({ ...estudiante, turno: 'MATUTINO' });
      return;
    }
    const existingData = snap.data() as Record<string, unknown>;
    const sanitized = sanitizeForFirestore({
      ...estudiante,
      turno: 'MATUTINO'
    } as unknown as Record<string, unknown>);
    const payload = {
      ...sanitized,
      num_control: existingData.num_control,
      curp: existingData.curp,
      turno: 'MATUTINO',
      ownerUid: existingData.ownerUid,
      createdAt: existingData.createdAt,
      updatedAt: serverTimestamp()
    };
    await setDoc(estRef, payload);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('ya está registrada') || error.message.includes('ya se encuentra asignado'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cloudDeleteEstudianteCascade(numControl: string, curp?: string): Promise<void> {
  await requireOnlineFirebase(true);
  const cleanNC = numControl.trim();
  const path = `${COLLECTIONS.ESTUDIANTES}/${cleanNC}`;
  try {
    let resolvedCurp = curp?.trim().toUpperCase();
    if (!resolvedCurp) {
      const estSnap = await getDocFromServer(doc(db, COLLECTIONS.ESTUDIANTES, cleanNC));
      if (estSnap.exists() && typeof estSnap.data()?.curp === 'string') {
        resolvedCurp = estSnap.data().curp.trim().toUpperCase();
      }
    }

    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTIONS.ESTUDIANTES, cleanNC));
    batch.delete(doc(db, COLLECTIONS.EVALUACIONES, cleanNC));
    batch.delete(doc(db, COLLECTIONS.PROGRESOS, cleanNC));
    if (resolvedCurp) {
      batch.delete(doc(db, COLLECTIONS.CURP_REGISTRY, resolvedCurp));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------
// Evaluaciones Vocacionales (Normalized, Zero Redundancy)
// ---------------------------------------------------------------------

export async function cloudSaveEvaluacion(evaluacion: EvaluacionVocacional): Promise<void> {
  await requireOnlineFirebase(false);
  const path = `${COLLECTIONS.EVALUACIONES}/${evaluacion.num_control}`;
  const docRef = doc(db, COLLECTIONS.EVALUACIONES, evaluacion.num_control);
  let opType: OperationType = OperationType.WRITE;
  try {
    const normalizedPayload = toNormalizedEvaluacionPayload(evaluacion);
    const prepared = await prepareWritePayload(docRef, normalizedPayload, true);
    opType = prepared.opType;
    await setDoc(docRef, prepared.payload);
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

// ---------------------------------------------------------------------
// Progreso Virtual
// ---------------------------------------------------------------------

export async function cloudSaveProgreso(progreso: ProgresoVirtual): Promise<void> {
  await requireOnlineFirebase(false);
  const path = `${COLLECTIONS.PROGRESOS}/${progreso.num_control}`;
  const docRef = doc(db, COLLECTIONS.PROGRESOS, progreso.num_control);
  let opType: OperationType = OperationType.WRITE;
  try {
    const prepared = await prepareWritePayload(
      docRef,
      progreso as unknown as Record<string, unknown>,
      true
    );
    opType = prepared.opType;
    await setDoc(docRef, prepared.payload);
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

// ---------------------------------------------------------------------
// Docentes Autorizados (Admin Only)
// ---------------------------------------------------------------------

export async function cloudSaveDocente(docente: DocenteAutorizado): Promise<void> {
  await requireOnlineFirebase(true);
  const path = `${COLLECTIONS.DOCENTES}/${docente.id}`;
  const docRef = doc(db, COLLECTIONS.DOCENTES, docente.id);
  let opType: OperationType = OperationType.WRITE;
  try {
    const prepared = await prepareWritePayload(
      docRef,
      docente as unknown as Record<string, unknown>,
      false
    );
    opType = prepared.opType;
    await setDoc(docRef, prepared.payload);
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

export async function cloudDeleteDocente(id: string): Promise<void> {
  await requireOnlineFirebase(true);
  const path = `${COLLECTIONS.DOCENTES}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.DOCENTES, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------
// Fichas Academia & Oficio Circular (Single Source of Truth)
// ---------------------------------------------------------------------

export async function cloudSaveFichaAcademia(ficha: FichaAcademiaReq): Promise<void> {
  await requireOnlineFirebase(true);
  const path = `${COLLECTIONS.FICHAS}/${ficha.especialidad_id}`;
  const docRef = doc(db, COLLECTIONS.FICHAS, ficha.especialidad_id);
  let opType: OperationType = OperationType.WRITE;
  try {
    const prepared = await prepareWritePayload(
      docRef,
      ficha as unknown as Record<string, unknown>,
      false
    );
    opType = prepared.opType;
    await setDoc(docRef, prepared.payload);
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

export async function cloudSaveOficioCircular(oficio: OficioCircular): Promise<void> {
  await requireOnlineFirebase(true);
  const path = `${COLLECTIONS.CONFIGURACION}/${CONFIG_OFICIO_ID}`;
  const docRef = doc(db, COLLECTIONS.CONFIGURACION, CONFIG_OFICIO_ID);
  let opType: OperationType = OperationType.WRITE;
  try {
    const prepared = await prepareWritePayload(
      docRef,
      {
        ...oficio,
        id: CONFIG_OFICIO_ID
      } as unknown as Record<string, unknown>,
      false
    );
    opType = prepared.opType;
    await setDoc(docRef, prepared.payload);
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

export async function cloudEnsureInstitutionalDefaultsIfEmpty(
  defaultFichas: Record<string, FichaAcademiaReq>,
  defaultOficio: OficioCircular
): Promise<void> {
  const { isAdmin } = await requireOnlineFirebase(false);
  if (!isAdmin) return;

  for (const ficha of Object.values(defaultFichas)) {
    const ref = doc(db, COLLECTIONS.FICHAS, ficha.especialidad_id);
    const snap = await getDocFromServer(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...sanitizeForFirestore(ficha as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  const oficioRef = doc(db, COLLECTIONS.CONFIGURACION, CONFIG_OFICIO_ID);
  const oficioSnap = await getDocFromServer(oficioRef);
  if (!oficioSnap.exists()) {
    await setDoc(oficioRef, {
      ...sanitizeForFirestore({ ...defaultOficio, id: CONFIG_OFICIO_ID } as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

// ---------------------------------------------------------------------
// Admin Bulk Maintenance (Batch Wipe, Seed & Restore)
// ---------------------------------------------------------------------

async function commitOperationsInChunks(
  ops: Array<(batch: ReturnType<typeof writeBatch>) => void>
): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    const slice = ops.slice(i, i + CHUNK_SIZE);
    slice.forEach(fn => fn(batch));
    await batch.commit();
  }
}

export async function cloudWipeEstudiantes(): Promise<void> {
  await requireOnlineFirebase(true);
  try {
    const [estSnap, curpSnap, evalSnap, progSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.ESTUDIANTES)),
      getDocs(collection(db, COLLECTIONS.CURP_REGISTRY)),
      getDocs(collection(db, COLLECTIONS.EVALUACIONES)),
      getDocs(collection(db, COLLECTIONS.PROGRESOS))
    ]);

    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    evalSnap.docs.forEach(d => ops.push(b => b.delete(d.ref)));
    progSnap.docs.forEach(d => ops.push(b => b.delete(d.ref)));
    estSnap.docs.forEach(d => ops.push(b => b.delete(d.ref)));
    curpSnap.docs.forEach(d => ops.push(b => b.delete(d.ref)));

    await commitOperationsInChunks(ops);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.ESTUDIANTES);
  }
}

export async function cloudWipeDocentes(): Promise<void> {
  await requireOnlineFirebase(true);
  try {
    const docSnap = await getDocs(collection(db, COLLECTIONS.DOCENTES));
    const ops = docSnap.docs.map(d => (b: ReturnType<typeof writeBatch>) => b.delete(d.ref));
    await commitOperationsInChunks(ops);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.DOCENTES);
  }
}

export async function cloudSeedEstudiantesWithRelations(
  estudiantes: Estudiante[],
  evaluaciones: Record<string, EvaluacionVocacional>,
  progresos: Record<string, ProgresoVirtual>
): Promise<void> {
  const { user } = await requireOnlineFirebase(true);
  await cloudWipeEstudiantes();

  try {
    const studentOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    for (const est of estudiantes) {
      const cleanNC = est.num_control.trim();
      const cleanCurp = est.curp.trim().toUpperCase();
      const ownerUid = est.ownerUid || user.uid;
      const estPayload = sanitizeForFirestore({
        ...est,
        num_control: cleanNC,
        curp: cleanCurp,
        turno: 'MATUTINO',
        ownerUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      studentOps.push(b => b.set(doc(db, COLLECTIONS.ESTUDIANTES, cleanNC), estPayload));
      studentOps.push(b =>
        b.set(doc(db, COLLECTIONS.CURP_REGISTRY, cleanCurp), {
          curp: cleanCurp,
          num_control: cleanNC,
          ownerUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );
    }
    await commitOperationsInChunks(studentOps);

    const relatedOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    for (const ev of Object.values(evaluaciones)) {
      const cleanNC = ev.num_control.trim();
      const matchingEst = estudiantes.find(e => e.num_control.trim() === cleanNC);
      const ownerUid = ev.ownerUid || matchingEst?.ownerUid || user.uid;
      const norm = toNormalizedEvaluacionPayload({ ...ev, ownerUid });
      relatedOps.push(b =>
        b.set(doc(db, COLLECTIONS.EVALUACIONES, cleanNC), {
          ...sanitizeForFirestore(norm),
          ownerUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );
    }
    for (const prog of Object.values(progresos)) {
      const cleanNC = prog.num_control.trim();
      const matchingEst = estudiantes.find(e => e.num_control.trim() === cleanNC);
      const ownerUid = prog.ownerUid || matchingEst?.ownerUid || user.uid;
      relatedOps.push(b =>
        b.set(doc(db, COLLECTIONS.PROGRESOS, cleanNC), {
          ...sanitizeForFirestore(prog as unknown as Record<string, unknown>),
          ownerUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );
    }
    await commitOperationsInChunks(relatedOps);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.ESTUDIANTES);
  }
}

export async function cloudSeedDocentesList(docentes: DocenteAutorizado[]): Promise<void> {
  await requireOnlineFirebase(true);
  await cloudWipeDocentes();
  try {
    const ops = docentes.map(d => (b: ReturnType<typeof writeBatch>) =>
      b.set(doc(db, COLLECTIONS.DOCENTES, d.id), {
        ...sanitizeForFirestore(d as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );
    await commitOperationsInChunks(ops);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.DOCENTES);
  }
}

// ---------------------------------------------------------------------
// Google Authentication Registry (/accesos_google/{uid})
// ---------------------------------------------------------------------

export async function cloudRegistrarAccesoGoogle(
  user: User,
  isAdminFlag: boolean,
  metodo: AccesoGoogleEvento['metodo'] = 'login_interactivo'
): Promise<void> {
  if (!user || !user.emailVerified || !user.email) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  const docRef = doc(db, COLLECTIONS.ACCESOS_GOOGLE, user.uid);
  const path = `${COLLECTIONS.ACCESOS_GOOGLE}/${user.uid}`;
  const nowIso = new Date().toISOString();
  const origen = typeof window !== 'undefined' ? window.location.origin : 'desconocido';
  const nombreGoogle = (user.displayName || user.email.split('@')[0] || 'Usuario Google').slice(0, 150);
  const eventoNuevo: AccesoGoogleEvento = {
    fecha_iso: nowIso,
    origen: origen.slice(0, 200),
    metodo
  };

  let opType: OperationType = OperationType.WRITE;
  try {
    const snap = await getDocFromServer(docRef);
    if (!snap.exists()) {
      opType = OperationType.CREATE;
      const createPayload = sanitizeForFirestore({
        uid: user.uid,
        email: user.email.toLowerCase(),
        nombre_google: nombreGoogle,
        ...(user.photoURL ? { foto_url: user.photoURL.slice(0, 500) } : {}),
        es_admin: isAdminFlag,
        primer_acceso: nowIso,
        ultimo_acceso: nowIso,
        total_accesos: 1,
        ultimo_origen: origen.slice(0, 250),
        historial_reciente: [eventoNuevo],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await setDoc(docRef, createPayload);
    } else {
      opType = OperationType.UPDATE;
      const existingData = snap.data() as Partial<AccesoGoogle> & { createdAt?: unknown };
      const prevHist = Array.isArray(existingData.historial_reciente)
        ? existingData.historial_reciente
        : [];
      const nextHist = [eventoNuevo, ...prevHist].slice(0, 10);
      const prevTotal = typeof existingData.total_accesos === 'number' ? existingData.total_accesos : 1;

      const updatePayload = sanitizeForFirestore({
        uid: existingData.uid || user.uid,
        email: existingData.email || user.email.toLowerCase(),
        nombre_google: nombreGoogle,
        ...(user.photoURL ? { foto_url: user.photoURL.slice(0, 500) } : existingData.foto_url ? { foto_url: existingData.foto_url } : {}),
        es_admin: isAdminFlag,
        primer_acceso: existingData.primer_acceso || nowIso,
        ultimo_acceso: nowIso,
        total_accesos: prevTotal + 1,
        ultimo_origen: origen.slice(0, 250),
        historial_reciente: nextHist,
        createdAt: existingData.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await setDoc(docRef, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

// ---------------------------------------------------------------------
// Real-Time Online Database Subscriptions (onSnapshot)
// ---------------------------------------------------------------------

export interface AppDbCallbacks {
  onEstudiantes: (list: Estudiante[]) => void;
  onEvaluaciones: (dict: Record<string, EvaluacionVocacional>) => void;
  onProgresos: (dict: Record<string, ProgresoVirtual>) => void;
  onFichas: (dict: Record<string, FichaAcademiaReq>) => void;
  onOficio: (oficio: OficioCircular | null) => void;
  onDocentes: (list: DocenteAutorizado[]) => void;
  onAccesosGoogle: (list: AccesoGoogle[]) => void;
  onError: (err: Error) => void;
}

export function subscribeAppDatabase(
  user: User,
  isAdmin: boolean,
  callbacks: AppDbCallbacks
): () => void {
  const unsubs: Array<() => void> = [];

  const handleListenerErr = (path: string, err: unknown) => {
    try {
      handleFirestoreError(err, OperationType.LIST, path);
    } catch (wrapped) {
      callbacks.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
    }
  };

  const estQuery = isAdmin
    ? collection(db, COLLECTIONS.ESTUDIANTES)
    : query(collection(db, COLLECTIONS.ESTUDIANTES), where('ownerUid', '==', user.uid));

  unsubs.push(
    onSnapshot(
      estQuery,
      snap => {
        const list = snap.docs.map(d => {
          const data = d.data() as Estudiante;
          return {
            ...data,
            turno: 'MATUTINO' as const,
            num_control: data.num_control || d.id
          };
        });
        callbacks.onEstudiantes(list);
      },
      err => handleListenerErr(COLLECTIONS.ESTUDIANTES, err)
    )
  );

  const evalQuery = isAdmin
    ? collection(db, COLLECTIONS.EVALUACIONES)
    : query(collection(db, COLLECTIONS.EVALUACIONES), where('ownerUid', '==', user.uid));

  unsubs.push(
    onSnapshot(
      evalQuery,
      snap => {
        const dict: Record<string, EvaluacionVocacional> = {};
        snap.docs.forEach(d => {
          const normalized = normalizeEvaluacionFromFirestore({
            ...(d.data() as Record<string, unknown>),
            num_control: (d.data()?.num_control as string) || d.id
          });
          if (normalized.num_control) {
            dict[normalized.num_control] = normalized;
          }
        });
        callbacks.onEvaluaciones(dict);
      },
      err => handleListenerErr(COLLECTIONS.EVALUACIONES, err)
    )
  );

  const progQuery = isAdmin
    ? collection(db, COLLECTIONS.PROGRESOS)
    : query(collection(db, COLLECTIONS.PROGRESOS), where('ownerUid', '==', user.uid));

  unsubs.push(
    onSnapshot(
      progQuery,
      snap => {
        const dict: Record<string, ProgresoVirtual> = {};
        snap.docs.forEach(d => {
          const data = d.data() as ProgresoVirtual;
          const nc = data.num_control || d.id;
          if (nc) dict[nc] = { ...data, num_control: nc };
        });
        callbacks.onProgresos(dict);
      },
      err => handleListenerErr(COLLECTIONS.PROGRESOS, err)
    )
  );

  const fichasQuery = isAdmin
    ? collection(db, COLLECTIONS.FICHAS)
    : query(
        collection(db, COLLECTIONS.FICHAS),
        where('especialidad_id', 'in', ['programacion', 'comercio', 'rrhh', 'cosmetologia'])
      );

  unsubs.push(
    onSnapshot(
      fichasQuery,
      snap => {
        const dict: Record<string, FichaAcademiaReq> = {};
        snap.docs.forEach(d => {
          const data = d.data() as FichaAcademiaReq;
          const id = data.especialidad_id || d.id;
          if (id) dict[id] = data;
        });
        callbacks.onFichas(dict);
      },
      err => handleListenerErr(COLLECTIONS.FICHAS, err)
    )
  );

  unsubs.push(
    onSnapshot(
      doc(db, COLLECTIONS.CONFIGURACION, CONFIG_OFICIO_ID),
      snap => {
        callbacks.onOficio(snap.exists() ? (snap.data() as OficioCircular) : null);
      },
      err => handleListenerErr(`${COLLECTIONS.CONFIGURACION}/${CONFIG_OFICIO_ID}`, err)
    )
  );

  if (isAdmin) {
    unsubs.push(
      onSnapshot(
        collection(db, COLLECTIONS.DOCENTES),
        snap => {
          const list = snap.docs.map(d => d.data() as DocenteAutorizado);
          callbacks.onDocentes(list);
        },
        err => handleListenerErr(COLLECTIONS.DOCENTES, err)
      )
    );
    unsubs.push(
      onSnapshot(
        collection(db, COLLECTIONS.ACCESOS_GOOGLE),
        snap => {
          const list = snap.docs
            .map(d => d.data() as AccesoGoogle)
            .sort((a, b) => (b.ultimo_acceso || '').localeCompare(a.ultimo_acceso || ''));
          callbacks.onAccesosGoogle(list);
        },
        err => handleListenerErr(COLLECTIONS.ACCESOS_GOOGLE, err)
      )
    );
  } else {
    callbacks.onDocentes([]);
    callbacks.onAccesosGoogle([]);
  }

  return () => {
    unsubs.forEach(fn => fn());
  };
}
