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
  DocenteAcceso,
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
    // 100% online memoryLocalCache with experimentalForceLongPolling to avoid 10s WebSocket timeouts in preview/proxy environments
    return initializeFirestore(
      app,
      {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true,
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
  DOCENTE_ACCESOS: 'docente_accesos',
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

export async function testConnection(forceRefresh = false): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    lastConnectionResult = { ok: false, checkedAt: Date.now() };
    return false;
  }
  if (!forceRefresh && lastConnectionResult && Date.now() - lastConnectionResult.checkedAt < CONNECTION_CACHE_MS) {
    return lastConnectionResult.ok;
  }
  if (inFlightConnectionTest) {
    return inFlightConnectionTest;
  }

  inFlightConnectionTest = (async () => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('the client is offline - connection timed out')), 8000)
      );
      await Promise.race([
        getDocFromServer(doc(db, 'test', 'connection')),
        timeoutPromise
      ]);
      lastConnectionResult = { ok: true, checkedAt: Date.now() };
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
        lastConnectionResult = { ok: false, checkedAt: Date.now() };
        return false;
      }
      // Reaching the server and receiving 'permission-denied' or 'not-found' means the backend is reachable!
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

export const EMAIL_DOC_ID_REGEX = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/;

export function normalizeDocenteEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

export function isValidEmailDocIdClient(email: string): boolean {
  return email.length >= 3 && email.length <= 200 && EMAIL_DOC_ID_REGEX.test(email);
}

export async function checkDocenteAcceso(user: User | null = auth.currentUser): Promise<DocenteAcceso | null> {
  if (!user || !user.emailVerified || !user.email) return null;
  const cleanEmail = normalizeDocenteEmail(user.email);
  if (!isValidEmailDocIdClient(cleanEmail)) return null;
  try {
    const snap = await getDocFromServer(doc(db, COLLECTIONS.DOCENTE_ACCESOS, cleanEmail));
    if (!snap.exists()) return null;
    return snap.data() as DocenteAcceso;
  } catch {
    return null;
  }
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
  if (value !== null && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (v !== undefined) {
          out[k] = sanitizeForFirestore(v);
        }
      }
      return out as T;
    }
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
  const cleanNC = (evaluacion?.num_control || '').trim();
  if (!cleanNC || cleanNC.includes('/')) {
    throw new Error('Selecciona o registra un alumno con Número de Control válido antes de guardar la evaluación.');
  }
  const path = `${COLLECTIONS.EVALUACIONES}/${cleanNC}`;
  const docRef = doc(db, COLLECTIONS.EVALUACIONES, cleanNC);
  let opType: OperationType = OperationType.WRITE;
  try {
    const normalizedPayload = toNormalizedEvaluacionPayload({ ...evaluacion, num_control: cleanNC });
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
  const cleanNC = (progreso?.num_control || '').trim();
  if (!cleanNC || cleanNC.includes('/')) {
    throw new Error('Selecciona o registra un alumno válido antes de guardar el progreso en Firebase.');
  }
  const path = `${COLLECTIONS.PROGRESOS}/${cleanNC}`;
  const docRef = doc(db, COLLECTIONS.PROGRESOS, cleanNC);
  let opType: OperationType = OperationType.WRITE;
  try {
    const prepared = await prepareWritePayload(
      docRef,
      { ...progreso, num_control: cleanNC } as unknown as Record<string, unknown>,
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

export async function cloudSaveDocente(docente: DocenteAutorizado, previousEmail?: string): Promise<void> {
  await requireOnlineFirebase(true);
  const cleanId = (docente?.id || '').trim();
  if (!cleanId || cleanId.includes('/')) {
    throw new Error('El identificador del docente no es válido.');
  }
  const cleanEmail = normalizeDocenteEmail(docente.correo_institucional);
  if (!isValidEmailDocIdClient(cleanEmail)) {
    throw new Error('Ingresa un correo electrónico válido (Gmail o institucional) para el docente.');
  }

  const path = `${COLLECTIONS.DOCENTES}/${cleanId}`;
  const docRef = doc(db, COLLECTIONS.DOCENTES, cleanId);
  const accesoRef = doc(db, COLLECTIONS.DOCENTE_ACCESOS, cleanEmail);
  let opType: OperationType = OperationType.WRITE;

  try {
    const [docSnap, accesoSnap] = await Promise.all([
      getDocFromServer(docRef),
      getDocFromServer(accesoRef)
    ]);

    const existingDocente = docSnap.exists() ? (docSnap.data() as Partial<DocenteAutorizado> & { createdAt?: unknown }) : null;
    const oldEmail = normalizeDocenteEmail(previousEmail || existingDocente?.correo_institucional);
    opType = existingDocente ? OperationType.UPDATE : OperationType.CREATE;

    if (accesoSnap.exists() && accesoSnap.data()?.docente_id !== cleanId) {
      await deleteDoc(accesoRef);
    }

    const sanitizedDocente = sanitizeForFirestore({
      ...docente,
      id: cleanId,
      correo_institucional: cleanEmail
    } as unknown as Record<string, unknown>);

    const docentePayload: Record<string, unknown> = {
      ...sanitizedDocente,
      createdAt: existingDocente?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const existingAcceso =
      accesoSnap.exists() && accesoSnap.data()?.docente_id === cleanId
        ? (accesoSnap.data() as Record<string, unknown>)
        : null;

    const accesoPayload: Record<string, unknown> = {
      email: cleanEmail,
      docente_id: cleanId,
      nombre_completo: docente.nombre_completo.trim().slice(0, 150),
      academia: docente.academia,
      rol: docente.rol,
      nivel_acceso: docente.nivel_acceso || 'lector',
      clave_acceso: docente.clave_acceso,
      estatus_autorizacion: docente.estatus_autorizacion,
      createdAt: existingAcceso?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const batch = writeBatch(db);
    batch.set(docRef, docentePayload);
    batch.set(accesoRef, accesoPayload);
    if (oldEmail && oldEmail !== cleanEmail && isValidEmailDocIdClient(oldEmail)) {
      batch.delete(doc(db, COLLECTIONS.DOCENTE_ACCESOS, oldEmail));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

export async function cloudDeleteDocente(id: string): Promise<void> {
  await requireOnlineFirebase(true);
  const cleanId = (id || '').trim();
  if (!cleanId || cleanId.includes('/')) {
    throw new Error('El identificador del docente no es válido.');
  }
  const path = `${COLLECTIONS.DOCENTES}/${cleanId}`;
  const docRef = doc(db, COLLECTIONS.DOCENTES, cleanId);
  try {
    const snap = await getDocFromServer(docRef);
    const email = snap.exists() ? normalizeDocenteEmail((snap.data() as Partial<DocenteAutorizado>).correo_institucional) : '';
    const batch = writeBatch(db);
    batch.delete(docRef);
    if (email && isValidEmailDocIdClient(email)) {
      batch.delete(doc(db, COLLECTIONS.DOCENTE_ACCESOS, email));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function cloudSyncMissingDocenteAccesos(): Promise<void> {
  const { isAdmin } = await requireOnlineFirebase(false);
  if (!isAdmin) return;
  try {
    const [docSnap, accSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.DOCENTES)),
      getDocs(collection(db, COLLECTIONS.DOCENTE_ACCESOS))
    ]);
    const existingAccesos = new Map<string, Record<string, unknown>>();
    accSnap.docs.forEach(d => existingAccesos.set(d.id, d.data() as Record<string, unknown>));

    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    for (const d of docSnap.docs) {
      const docente = d.data() as DocenteAutorizado;
      const cleanEmail = normalizeDocenteEmail(docente.correo_institucional);
      if (!isValidEmailDocIdClient(cleanEmail)) continue;
      const existingAcc = existingAccesos.get(cleanEmail);
      const needsSync =
        !existingAcc ||
        existingAcc.docente_id !== docente.id ||
        existingAcc.estatus_autorizacion !== docente.estatus_autorizacion ||
        existingAcc.nombre_completo !== docente.nombre_completo ||
        existingAcc.academia !== docente.academia ||
        existingAcc.rol !== docente.rol ||
        existingAcc.nivel_acceso !== (docente.nivel_acceso || 'lector') ||
        existingAcc.clave_acceso !== (docente.clave_acceso || '');

      if (!needsSync) continue;

      if (existingAcc && existingAcc.docente_id !== docente.id) {
        await deleteDoc(doc(db, COLLECTIONS.DOCENTE_ACCESOS, cleanEmail));
      }

      const createdAtVal =
        existingAcc && existingAcc.docente_id === docente.id && existingAcc.createdAt
          ? existingAcc.createdAt
          : serverTimestamp();

      const accPayload: Record<string, unknown> = {
        email: cleanEmail,
        docente_id: docente.id,
        nombre_completo: docente.nombre_completo.trim().slice(0, 150),
        academia: docente.academia,
        rol: docente.rol,
        nivel_acceso: docente.nivel_acceso || 'lector',
        estatus_autorizacion: docente.estatus_autorizacion,
        createdAt: createdAtVal,
        updatedAt: serverTimestamp()
      };
      if (docente.clave_acceso && docente.clave_acceso.trim().length >= 4) {
        accPayload.clave_acceso = docente.clave_acceso.trim();
      }

      ops.push(b =>
        b.set(doc(db, COLLECTIONS.DOCENTE_ACCESOS, cleanEmail), accPayload)
      );
    }

    if (ops.length > 0) {
      await commitOperationsInChunks(ops);
    }
  } catch (err) {
    console.warn('No se pudo sincronizar docente_accesos:', err);
  }
}

export async function cloudFetchDocentes(): Promise<DocenteAutorizado[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.DOCENTES));
    return snap.docs.map(d => d.data() as DocenteAutorizado);
  } catch (err) {
    console.warn('No se pudo cargar docentes de Firebase:', err);
    return [];
  }
}

export async function cloudFetchFichas(): Promise<Record<string, FichaAcademiaReq>> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.FICHAS));
    const dict: Record<string, FichaAcademiaReq> = {};
    snap.docs.forEach(d => {
      const data = d.data() as FichaAcademiaReq;
      const id = data.especialidad_id || d.id;
      if (id) dict[id] = data;
    });
    return dict;
  } catch {
    return {};
  }
}

export async function cloudFetchOficio(): Promise<OficioCircular | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.CONFIGURACION, CONFIG_OFICIO_ID));
    return snap.exists() ? (snap.data() as OficioCircular) : null;
  } catch {
    return null;
  }
}

export function subscribePublicCollections(callbacks: {
  onDocentes?: (docentes: DocenteAutorizado[]) => void;
  onFichas?: (fichas: Record<string, FichaAcademiaReq>) => void;
  onOficio?: (oficio: OficioCircular | null) => void;
}): () => void {
  const unsubs: Array<() => void> = [];

  try {
    const unsubDoc = onSnapshot(
      collection(db, COLLECTIONS.DOCENTES),
      snap => {
        const list = snap.docs.map(d => {
          const data = d.data() as DocenteAutorizado;
          return {
            ...data,
            id: data.id || d.id
          };
        });
        callbacks.onDocentes?.(list);
      },
      err => {
        console.warn('Public onSnapshot docentes warn:', err);
      }
    );
    unsubs.push(unsubDoc);
  } catch (err) {
    console.warn('subscribePublicCollections docentes error:', err);
  }

  try {
    const unsubFichas = onSnapshot(
      collection(db, COLLECTIONS.FICHAS),
      snap => {
        const dict: Record<string, FichaAcademiaReq> = {};
        snap.docs.forEach(d => {
          const data = d.data() as FichaAcademiaReq;
          const id = data.especialidad_id || d.id;
          if (id) dict[id] = data;
        });
        callbacks.onFichas?.(dict);
      },
      err => {
        console.warn('Public onSnapshot fichas warn:', err);
      }
    );
    unsubs.push(unsubFichas);
  } catch (err) {
    console.warn('subscribePublicCollections fichas error:', err);
  }

  try {
    const unsubOficio = onSnapshot(
      doc(db, COLLECTIONS.CONFIGURACION, CONFIG_OFICIO_ID),
      snap => {
        callbacks.onOficio?.(snap.exists() ? (snap.data() as OficioCircular) : null);
      },
      err => {
        console.warn('Public onSnapshot oficio warn:', err);
      }
    );
    unsubs.push(unsubOficio);
  } catch (err) {
    console.warn('subscribePublicCollections oficio error:', err);
  }

  return () => {
    unsubs.forEach(u => {
      try {
        u();
      } catch {}
    });
  };
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
    } else if (ficha.especialidad_id === 'programacion') {
      const existingData = snap.data() as Partial<FichaAcademiaReq> & { createdAt?: unknown };
      const existingGal = Array.isArray(existingData.recursos_multimedia?.galeria_alumnos)
        ? existingData.recursos_multimedia!.galeria_alumnos!
        : [];
      const defaultDriveItems = (ficha.recursos_multimedia?.galeria_alumnos || []).filter(item =>
        String(item.id).startsWith('prog-drive-')
      );
      const hasDriveItems = existingGal.some(item => String(item.id).startsWith('prog-drive-'));
      if (!hasDriveItems && defaultDriveItems.length > 0 && existingData.recursos_multimedia) {
        const sanitizedExisting = sanitizeForFirestore(existingData as Record<string, unknown>);
        const mergedGal = sanitizeForFirestore([...existingGal, ...defaultDriveItems]);
        await setDoc(ref, {
          ...sanitizedExisting,
          recursos_multimedia: {
            ...(sanitizedExisting.recursos_multimedia as Record<string, unknown>),
            galeria_alumnos: mergedGal
          },
          createdAt: existingData.createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
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
    const [docSnap, accSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.DOCENTES)),
      getDocs(collection(db, COLLECTIONS.DOCENTE_ACCESOS))
    ]);
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    docSnap.docs.forEach(d => ops.push(b => b.delete(d.ref)));
    accSnap.docs.forEach(d => ops.push(b => b.delete(d.ref)));
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
      const cleanNC = (est.num_control || '').trim();
      const cleanCurp = (est.curp || '').trim().toUpperCase();
      if (!cleanNC || cleanNC.includes('/') || !cleanCurp || cleanCurp.includes('/')) continue;
      const ownerUid = est.ownerUid || user.uid;
      const estPayload = {
        ...sanitizeForFirestore({
          ...est,
          num_control: cleanNC,
          curp: cleanCurp,
          turno: 'MATUTINO',
          ownerUid
        } as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
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
      const cleanNC = (ev.num_control || '').trim();
      if (!cleanNC || cleanNC.includes('/')) continue;
      const matchingEst = estudiantes.find(e => e.num_control.trim() === cleanNC);
      const ownerUid = ev.ownerUid || matchingEst?.ownerUid || user.uid;
      const norm = toNormalizedEvaluacionPayload({ ...ev, num_control: cleanNC, ownerUid });
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
      const cleanNC = (prog.num_control || '').trim();
      if (!cleanNC || cleanNC.includes('/')) continue;
      const matchingEst = estudiantes.find(e => e.num_control.trim() === cleanNC);
      const ownerUid = prog.ownerUid || matchingEst?.ownerUid || user.uid;
      relatedOps.push(b =>
        b.set(doc(db, COLLECTIONS.PROGRESOS, cleanNC), {
          ...sanitizeForFirestore({ ...prog, num_control: cleanNC } as unknown as Record<string, unknown>),
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
    const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    const seenEmails = new Set<string>();
    for (const d of docentes) {
      const cleanEmail = normalizeDocenteEmail(d.correo_institucional);
      ops.push(b =>
        b.set(doc(db, COLLECTIONS.DOCENTES, d.id), {
          ...sanitizeForFirestore({ ...d, correo_institucional: cleanEmail } as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );
      if (isValidEmailDocIdClient(cleanEmail) && !seenEmails.has(cleanEmail)) {
        seenEmails.add(cleanEmail);
        ops.push(b =>
          b.set(doc(db, COLLECTIONS.DOCENTE_ACCESOS, cleanEmail), {
            email: cleanEmail,
            docente_id: d.id,
            nombre_completo: d.nombre_completo.trim().slice(0, 150),
            academia: d.academia,
            rol: d.rol,
            nivel_acceso: d.nivel_acceso || 'lector',
            clave_acceso: d.clave_acceso,
            estatus_autorizacion: d.estatus_autorizacion,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        );
      }
    }
    await commitOperationsInChunks(ops);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.DOCENTES);
  }
}

// ---------------------------------------------------------------------
// Google Authentication Registry (/accesos_google/{uid})
// ---------------------------------------------------------------------

const inFlightAccesoByUid = new Map<string, Promise<void>>();

export async function cloudRegistrarAccesoGoogle(
  user: User,
  _isAdminFlag: boolean,
  metodo: AccesoGoogleEvento['metodo'] = 'login_interactivo'
): Promise<void> {
  if (!user || !user.emailVerified || !user.email) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  const previous = inFlightAccesoByUid.get(user.uid) || Promise.resolve();
  const nextWrite = previous
    .catch(() => undefined)
    .then(async () => {
      const docRef = doc(db, COLLECTIONS.ACCESOS_GOOGLE, user.uid);
      const path = `${COLLECTIONS.ACCESOS_GOOGLE}/${user.uid}`;
      const nowIso = new Date().toISOString();
      const rawOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://cetis7.edu.mx';
      const origen = rawOrigin.trim().slice(0, 250) || 'https://cetis7.edu.mx';
      const rawNombre = (user.displayName || user.email?.split('@')[0] || 'Usuario Google').trim();
      const nombreGoogle = (rawNombre || 'Usuario Google').slice(0, 150);
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const verifiedIsAdmin = Boolean(user.emailVerified && cleanEmail === BOOTSTRAPPED_ADMIN_EMAIL);
      const cleanPhoto = user.photoURL && user.photoURL.trim() ? user.photoURL.trim().slice(0, 500) : undefined;

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
          const baseCreate = sanitizeForFirestore({
            uid: user.uid,
            email: cleanEmail,
            nombre_google: nombreGoogle,
            ...(cleanPhoto ? { foto_url: cleanPhoto } : {}),
            es_admin: verifiedIsAdmin,
            primer_acceso: nowIso,
            ultimo_acceso: nowIso,
            total_accesos: 1,
            ultimo_origen: origen,
            historial_reciente: [eventoNuevo]
          });
          await setDoc(docRef, {
            ...baseCreate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          opType = OperationType.UPDATE;
          const existingData = snap.data() as Partial<AccesoGoogle> & { createdAt?: unknown };
          const prevHist = Array.isArray(existingData.historial_reciente)
            ? existingData.historial_reciente
            : [];
          const nextHist = [eventoNuevo, ...prevHist].slice(0, 10);
          const prevTotal = typeof existingData.total_accesos === 'number' ? existingData.total_accesos : 1;
          const existingPhoto =
            typeof existingData.foto_url === 'string' && existingData.foto_url.trim()
              ? existingData.foto_url.trim().slice(0, 500)
              : undefined;
          const resolvedPhoto = cleanPhoto || existingPhoto;

          const baseUpdate = sanitizeForFirestore({
            uid: existingData.uid || user.uid,
            email: existingData.email || cleanEmail,
            nombre_google: nombreGoogle,
            ...(resolvedPhoto ? { foto_url: resolvedPhoto } : {}),
            es_admin: verifiedIsAdmin,
            primer_acceso: existingData.primer_acceso || nowIso,
            ultimo_acceso: nowIso,
            total_accesos: prevTotal + 1,
            ultimo_origen: origen,
            historial_reciente: nextHist
          });
          await setDoc(docRef, {
            ...baseUpdate,
            createdAt: existingData.createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        handleFirestoreError(error, opType, path);
      }
    });

  inFlightAccesoByUid.set(user.uid, nextWrite);
  try {
    await nextWrite;
  } finally {
    if (inFlightAccesoByUid.get(user.uid) === nextWrite) {
      inFlightAccesoByUid.delete(user.uid);
    }
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
  onDocenteAcceso?: (acceso: DocenteAcceso | null) => void;
  onError: (err: Error) => void;
}

export function subscribeAppDatabase(
  user: User,
  isAdmin: boolean,
  hasDirectionAccess: boolean,
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

  const canReadAllStudents = isAdmin || hasDirectionAccess;

  const estQuery = canReadAllStudents
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

  const evalQuery = canReadAllStudents
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

  const progQuery = canReadAllStudents
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

  const cleanUserEmail = normalizeDocenteEmail(user.email);
  if (!isAdmin && user.emailVerified && isValidEmailDocIdClient(cleanUserEmail) && callbacks.onDocenteAcceso) {
    unsubs.push(
      onSnapshot(
        doc(db, COLLECTIONS.DOCENTE_ACCESOS, cleanUserEmail),
        snap => {
          callbacks.onDocenteAcceso?.(snap.exists() ? (snap.data() as DocenteAcceso) : null);
        },
        () => {
          callbacks.onDocenteAcceso?.(null);
        }
      )
    );
  }

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
