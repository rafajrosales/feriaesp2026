/**
 * Suite de pruebas de seguridad TDD para Firestore Rules (Phase 0 - Dirty Dozen)
 * Verifica que los 12 ataques de identidad, integridad, unicidad y estado devuelvan PERMISSION_DENIED.
 */

export const DIRTY_DOZEN_SECURITY_CASES = [
  {
    id: 1,
    name: 'Anonymous list on estudiantes',
    auth: null,
    operation: 'list',
    path: 'estudiantes',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Anonymous write on estudiantes/26316070010042',
    auth: null,
    operation: 'create',
    path: 'estudiantes/26316070010042',
    payload: { num_control: '26316070010042', nombre_completo: 'Test' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Identity spoofing with mismatched ownerUid',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'create',
    path: 'estudiantes/26316070019999',
    payload: { num_control: '26316070019999', ownerUid: 'victim-uid-2' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Email spoofing with email_verified=false for admin email',
    auth: { uid: 'attacker-uid', email: 'rafajrosales@gmail.com', email_verified: false },
    operation: 'list',
    path: 'docentes',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'Shadow update injecting redundant score or ghost field in evaluaciones',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'update',
    path: 'evaluaciones/26316070019999',
    payload: { score_aptitud_programacion: 100, isAdmin: true },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Orphan student create without atomic curp_registry coupling',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'create',
    path: 'estudiantes/26316070019999',
    payload: { num_control: '26316070019999', curp: 'CURPDUP990101HDF01' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'Client-forged createdAt timestamp not equal to request.time',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'create',
    path: 'estudiantes/26316070019999',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Modification after terminal state COMPLETADO in progresos',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'update',
    path: 'progresos/26316070019999',
    payload: { estatus_fase_virtual: 'EN_PROCESO' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Resource poisoning with invalid doc ID characters',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'create',
    path: 'estudiantes/invalid$id!with*chars',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'Oversized analisis_pedagogico (>2000 chars) on evaluaciones',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'create',
    path: 'evaluaciones/26316070019999',
    payload: { analisis_pedagogico: 'A'.repeat(3000) },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Unfiltered list query by non-admin on curp_registry or evaluaciones',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'list',
    path: 'curp_registry',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Non-admin read on docentes or write on configuracion',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'update',
    path: 'configuracion/oficio_circular',
    payload: { clave_oficio: 'FAKE-2026' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 13,
    name: 'Non-admin list on accesos_google or es_admin escalation',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'list',
    path: 'accesos_google',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 14,
    name: 'Non-admin attempting es_admin=true on accesos_google/{uid}',
    auth: { uid: 'student-uid-1', email: 'alumno@gmail.com', email_verified: true },
    operation: 'create',
    path: 'accesos_google/student-uid-1',
    payload: { uid: 'student-uid-1', email: 'alumno@gmail.com', es_admin: true },
    expected: 'PERMISSION_DENIED'
  }
];
