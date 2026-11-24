# Especificación de Seguridad Firestore — Feria de Especialidades CETis No. 7

## 1. Invariantes de Datos (Data Invariants)

1. **Autenticación Verificada Obligatoria:** Ningún usuario anónimo o no autenticado (`request.auth == null` o `email_verified == false`) puede leer ni escribir en ninguna colección de Firestore.
2. **Aislamiento de PII (Datos Personales):** La colección `estudiantes` (CURP, teléfonos, correos) y `docentes` (RFC, claves de acceso institucional) solo pueden ser leídas o listadas por su dueño (`resource.data.ownerUid == request.auth.uid`) o por administradores institucionales verificados (`isAdmin()`).
3. **Integridad Referencial:** Ninguna evaluación vocacional (`evaluaciones/{numControl}`) ni progreso virtual (`progresos/{numControl}`) puede ser creada por un alumno sin que exista previamente su registro en `estudiantes/{numControl}`.
4. **Bloqueo de Estado Terminal (Terminal State Locking):** Una vez que `progresos.estatus_fase_virtual == 'COMPLETADO'`, solo un administrador (`isAdmin()`) puede modificar el registro.
5. **Inmutabilidad de Campos Críticos y Marcas Temporales del Servidor:** `ownerUid`, `num_control`, `clave_unica_token` y `createdAt` son inmutables tras la creación. Tanto `createdAt` como `updatedAt` deben coincidir estrictamente con `request.time`.
6. **Validación Estricta de Claves y Límites de Tamaño:** Toda creación y actualización pasa por `isValid[Entity](incoming())`, prohibiendo campos fantasma (`keys().hasOnly(...)`) y acotando longitudes de cadenas y arreglos.

## 2. "Dirty Dozen" — 12 Payloads Maliciosos (Deben devolver PERMISSION_DENIED)

1. **Lectura anónima de padrón (`estudiantes` list sin auth):** `request.auth == null` -> `PERMISSION_DENIED`.
2. **Escritura anónima de estudiante (`estudiantes/26316070010042` sin auth):** `request.auth == null` -> `PERMISSION_DENIED`.
3. **Suplantación de identidad (`ownerUid` ajeno en create):** Usuario A intenta crear `estudiantes/26316070999999` con `ownerUid: "otro-uid"` -> `PERMISSION_DENIED`.
4. **Usuario no verificado (`email_verified == false`) escribiendo datos:** Email coincide con admin pero `email_verified == false` -> `PERMISSION_DENIED`.
5. **Actualización fantasma ("Shadow Update"):** Alumno intenta inyectar campo no permitido (`isAdmin: true` o `extraFlag: true`) en `estudiantes/{id}` -> `PERMISSION_DENIED`.
6. **Cambio de `ownerUid` en update:** Alumno intenta transferir propiedad de `evaluaciones/{id}` modificando `ownerUid` -> `PERMISSION_DENIED`.
7. **Manipulación de timestamp del cliente:** Enviar `createdAt` o `updatedAt` distinto de `request.time` -> `PERMISSION_DENIED`.
8. **Modificación post-terminal:** Alumno intenta modificar `progresos/{numControl}` cuando `estatus_fase_virtual == 'COMPLETADO'` -> `PERMISSION_DENIED`.
9. **ID Injection / Resource Poisoning:** Intentar crear documento con ID con `/` o mayor a 128 caracteres -> `PERMISSION_DENIED`.
10. **Payload de cadena excesiva ("Denial of Wallet"):** Enviar `analisis_pedagogico` de 5,000 caracteres (> max 2000) -> `PERMISSION_DENIED`.
11. **Consulta `list` sin filtro de propiedad:** Usuario no-admin ejecuta `getDocs(collection(db, 'evaluaciones'))` sin `where('ownerUid', '==', uid)` -> `PERMISSION_DENIED`.
12. **Lectura/Escritura no autorizada en `docentes`:** Alumno autenticado intenta leer `docentes` (para obtener PINes) o crear un docente -> `PERMISSION_DENIED`.
