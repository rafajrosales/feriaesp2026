import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
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
  CuestionarioEspecialidad,
  FichaAcademiaReq
} from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createFirestoreInstance(): Firestore {
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  try {
    return initializeFirestore(
      app,
      {
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

export const BOOTSTRAPPED_ADMIN_EMAIL = 'rafajrosales@gmail.com';

export const COLLECTIONS = {
  ADMINS: 'admins',
  ESTUDIANTES: 'estudiantes',
  DOCENTES: 'docentes',
  EVALUACIONES: 'evaluaciones',
  PROGRESOS: 'progresos',
  CUESTIONARIOS: 'cuestionarios_especialidades',
  FICHAS: 'fichas_academia'
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
const CONNECTION_CACHE_MS = 15000;

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
        console.warn('Firestore WebChannel quedó en modo sin conexión temporalmente.');
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

export async function checkIsFirebaseAdmin(user: User | null = auth.currentUser): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  const authorizedEmails = [
    BOOTSTRAPPED_ADMIN_EMAIL,
    'direccion@cetis7.edu.mx',
    'subdireccion@cetis7.edu.mx',
    'control.escolar@cetis7.edu.mx',
    'admin@cetis7.edu.mx'
  ];
  if (user.email && authorizedEmails.includes(user.email.toLowerCase())) {
    return true;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  const connected = await testConnection();
  if (!connected) {
    return false;
  }
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));
    return snap.exists() && snap.data()?.role === 'admin';
  } catch {
    return false;
  }
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
): Promise<{ payload: Record<string, unknown>; opType: OperationType }> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('Se requiere una cuenta Google verificada para guardar en Firestore.');
  }

  let existingData: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      existingData = snap.data() as Record<string, unknown>;
    }
  } catch {
    existingData = null;
  }

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
    opType: existingData ? OperationType.UPDATE : OperationType.CREATE
  };
}

export async function cloudGetEstudiantes(isAdmin?: boolean): Promise<Estudiante[]> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return [];
  const path = COLLECTIONS.ESTUDIANTES;
  const admin = isAdmin ?? (await checkIsFirebaseAdmin(user));
  try {
    const q = admin
      ? collection(db, path)
      : query(collection(db, path), where('ownerUid', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Estudiante);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function cloudSaveEstudiante(estudiante: Estudiante): Promise<void> {
  if (!hasVerifiedFirebaseUser()) return;
  const path = `${COLLECTIONS.ESTUDIANTES}/${estudiante.num_control}`;
  const docRef = doc(db, COLLECTIONS.ESTUDIANTES, estudiante.num_control);
  let opType: OperationType = OperationType.WRITE;
  try {
    const prepared = await prepareWritePayload(
      docRef,
      estudiante as unknown as Record<string, unknown>,
      true
    );
    opType = prepared.opType;
    await setDoc(docRef, prepared.payload);
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

export async function cloudGetDocentes(isAdmin?: boolean): Promise<DocenteAutorizado[]> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return [];
  const admin = isAdmin ?? (await checkIsFirebaseAdmin(user));
  if (!admin) return [];
  const path = COLLECTIONS.DOCENTES;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => d.data() as DocenteAutorizado);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function cloudSaveDocente(docente: DocenteAutorizado): Promise<void> {
  if (!hasVerifiedFirebaseUser()) return;
  const admin = await checkIsFirebaseAdmin();
  if (!admin) return;
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

export async function cloudGetEvaluaciones(isAdmin?: boolean): Promise<EvaluacionVocacional[]> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return [];
  const path = COLLECTIONS.EVALUACIONES;
  const admin = isAdmin ?? (await checkIsFirebaseAdmin(user));
  try {
    const q = admin
      ? collection(db, path)
      : query(collection(db, path), where('ownerUid', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as EvaluacionVocacional);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function cloudGetEvaluacion(numControl: string): Promise<EvaluacionVocacional | null> {
  if (!hasVerifiedFirebaseUser()) return null;
  const path = `${COLLECTIONS.EVALUACIONES}/${numControl}`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.EVALUACIONES, numControl));
    return snap.exists() ? (snap.data() as EvaluacionVocacional) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function cloudSaveEvaluacion(evaluacion: EvaluacionVocacional): Promise<void> {
  if (!hasVerifiedFirebaseUser()) return;
  const path = `${COLLECTIONS.EVALUACIONES}/${evaluacion.num_control}`;
  const docRef = doc(db, COLLECTIONS.EVALUACIONES, evaluacion.num_control);
  let opType: OperationType = OperationType.WRITE;
  try {
    const prepared = await prepareWritePayload(
      docRef,
      {
        ...evaluacion,
        sincronizado_firestore: true
      },
      true
    );
    opType = prepared.opType;
    await setDoc(docRef, prepared.payload);
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

export async function cloudDeleteEvaluacion(numControl: string): Promise<void> {
  if (!hasVerifiedFirebaseUser()) return;
  const admin = await checkIsFirebaseAdmin();
  if (!admin) return;
  const path = `${COLLECTIONS.EVALUACIONES}/${numControl}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.EVALUACIONES, numControl));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function cloudGetProgresos(isAdmin?: boolean): Promise<ProgresoVirtual[]> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return [];
  const path = COLLECTIONS.PROGRESOS;
  const admin = isAdmin ?? (await checkIsFirebaseAdmin(user));
  try {
    const q = admin
      ? collection(db, path)
      : query(collection(db, path), where('ownerUid', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ProgresoVirtual);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function cloudSaveProgreso(progreso: ProgresoVirtual): Promise<void> {
  if (!hasVerifiedFirebaseUser()) return;
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

export async function cloudGetCuestionarios(isAdmin?: boolean): Promise<CuestionarioEspecialidad[]> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return [];
  const path = COLLECTIONS.CUESTIONARIOS;
  const admin = isAdmin ?? (await checkIsFirebaseAdmin(user));
  try {
    const q = admin
      ? collection(db, path)
      : query(collection(db, path), where('activo', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as CuestionarioEspecialidad);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function cloudSaveCuestionario(cuestionario: CuestionarioEspecialidad): Promise<void> {
  if (!hasVerifiedFirebaseUser()) return;
  const admin = await checkIsFirebaseAdmin();
  if (!admin) return;
  const path = `${COLLECTIONS.CUESTIONARIOS}/${cuestionario.id}`;
  const docRef = doc(db, COLLECTIONS.CUESTIONARIOS, cuestionario.id);
  let opType: OperationType = OperationType.WRITE;
  try {
    const prepared = await prepareWritePayload(
      docRef,
      cuestionario as unknown as Record<string, unknown>,
      false
    );
    opType = prepared.opType;
    await setDoc(docRef, prepared.payload);
  } catch (error) {
    handleFirestoreError(error, opType, path);
  }
}

export async function cloudDeleteCuestionario(id: string): Promise<void> {
  if (!hasVerifiedFirebaseUser()) return;
  const admin = await checkIsFirebaseAdmin();
  if (!admin) return;
  const path = `${COLLECTIONS.CUESTIONARIOS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CUESTIONARIOS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function cloudGetFichasAcademia(isAdmin?: boolean): Promise<FichaAcademiaReq[]> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return [];
  const path = COLLECTIONS.FICHAS;
  const admin = isAdmin ?? (await checkIsFirebaseAdmin(user));
  try {
    const q = admin
      ? collection(db, path)
      : query(
          collection(db, path),
          where('especialidad_id', 'in', ['programacion', 'comercio', 'rrhh', 'cosmetologia'])
        );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as FichaAcademiaReq);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function cloudSaveFichaAcademia(ficha: FichaAcademiaReq): Promise<void> {
  if (!hasVerifiedFirebaseUser()) return;
  const admin = await checkIsFirebaseAdmin();
  if (!admin) return;
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
