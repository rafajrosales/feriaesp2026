# Especificación de Seguridad Firestore — Feria de Especialidades CETis No. 7

## 1. Arquitectura de Base de Datos Única en Línea (8 Colecciones Normalizadas)

Toda persistencia de la plataforma (tanto en AI Studio como en producción en `https://feriac7.vercel.app/`) opera exclusivamente en línea contra la base única de Cloud Firestore (`gen-lang-client-0550420170` / `ai-studio-cetisno7feriadee-0d6232a8-7486-4926-bbe7-5550c23951e3`), sin almacenamiento local (`localStorage`) ni modo offline:

1. `/admins/{userId}` — Administradores institucionales verificados.
2. `/estudiantes/{numControl}` — Padrón de alumnos y tutor legal embebido.
3. `/curp_registry/{curp}` — Índice público-autenticado sin PII para garantizar unicidad global de CURP entre dispositivos.
4. `/evaluaciones/{numControl}` — Resultados normalizados del Test Vocacional de 40 reactivos (sin campos derivados redundantes).
5. `/progresos/{numControl}` — Avance integral (0–100%) y Constancia QR.
6. `/docentes/{docenteId}` — Padrón confidencial de docentes (solo administradores).
7. `/fichas_academia/{especialidadId}` — Fuente única de verdad para metadata, multimedia (`video_academia`, `galeria_alumnos`) y `banco_reactivos` de las 4 especialidades.
8. `/configuracion/{configId}` — Configuración institucional única (`oficio_circular`).

## 2. Invariantes de Datos (Data Invariants)

1. **Autenticación Verificada Obligatoria (Sin Modo Offline):** Ningún usuario anónimo o no autenticado (`request.auth == null` o `email_verified == false`) puede leer ni escribir en ninguna colección de Firestore.
2. **Aislamiento de PII (Datos Personales):** La colección `estudiantes` (CURP, teléfonos, correos, tutor) y `docentes` (RFC, claves institucionales) solo pueden ser leídas o listadas por su dueño (`resource.data.ownerUid == request.auth.uid`) o por administradores institucionales verificados (`isAdmin()`). `curp_registry` expone únicamente consultas puntuales `get` sin PII ni permiso de `list` para alumnos.
3. **Unicidad Global Atómica de CURP (`existsAfter` / `getAfter`):** Ningún documento en `estudiantes/{numControl}` puede crearse sin crear atómicamente su correspondiente reserva en `curp_registry/{curp}` (y viceversa), impidiendo registros duplicados desde distintos navegadores o sesiones.
4. **Integridad Referencial y Cero Redundancia:** Ninguna evaluación (`evaluaciones/{numControl}`) ni progreso (`progresos/{numControl}`) puede crearse sin que exista `estudiantes/{numControl}`. En `evaluaciones`, solo se almacenan `desglose_partes` y `respuestas` compactas; todos los puntajes, porcentajes e indicadores Aptitud/Gusto se calculan dinámicamente en cliente.
5. **Bloqueo de Estado Terminal (Terminal State Locking):** Una vez que `progresos.estatus_fase_virtual == 'COMPLETADO'`, solo un administrador (`isAdmin()`) puede modificar el registro.
6. **Inmutabilidad de Campos Críticos y Marcas Temporales del Servidor:** `ownerUid`, `num_control`, `curp`, `clave_unica_token` y `createdAt` son inmutables tras la creación. Tanto `createdAt` como `updatedAt` deben coincidir estrictamente con `request.time`.
7. **Validación Estricta de Claves y Límites de Tamaño:** Toda creación y actualización pasa por `isValid[Entity](incoming())`, prohibiendo campos fantasma (`keys().hasOnly(...)`) y acotando longitudes de cadenas y arreglos.

## 3. "Dirty Dozen" — 12 Payloads Maliciosos (Deben devolver PERMISSION_DENIED)

1. **Lectura anónima de padrón (`estudiantes` list sin auth):** `request.auth == null` -> `PERMISSION_DENIED`.
2. **Escritura anónima de estudiante (`estudiantes/26316070010042` sin auth):** `request.auth == null` -> `PERMISSION_DENIED`.
3. **Suplantación de identidad (`ownerUid` ajeno en create):** Usuario A intenta crear `estudiantes/26316070999999` con `ownerUid: "otro-uid"` -> `PERMISSION_DENIED`.
4. **Usuario no verificado (`email_verified == false`) escribiendo datos:** Email coincide con admin pero `email_verified == false` -> `PERMISSION_DENIED`.
5. **Actualización fantasma ("Shadow Update"):** Alumno intenta inyectar campo no permitido (`isAdmin: true` o `score_aptitud_programacion: 100`) en `estudiantes/{id}` o `evaluaciones/{id}` -> `PERMISSION_DENIED`.
6. **Registro huérfano / CURP duplicada sin atomicidad:** Intentar crear `estudiantes/{nc}` sin crear atómicamente `curp_registry/{curp}` o reutilizando una CURP ya registrada -> `PERMISSION_DENIED`.
7. **Manipulación de timestamp del cliente:** Enviar `createdAt` o `updatedAt` distinto de `request.time` -> `PERMISSION_DENIED`.
8. **Modificación post-terminal:** Alumno intenta modificar `progresos/{numControl}` cuando `estatus_fase_virtual == 'COMPLETADO'` -> `PERMISSION_DENIED`.
9. **ID Injection / Resource Poisoning:** Intentar crear documento con ID con `/` o mayor a 128 caracteres -> `PERMISSION_DENIED`.
10. **Payload de cadena excesiva ("Denial of Wallet"):** Enviar `analisis_pedagogico` de 5,000 caracteres (> max 2000) -> `PERMISSION_DENIED`.
11. **Consulta `list` sin filtro de propiedad:** Usuario no-admin ejecuta `getDocs(collection(db, 'evaluaciones'))` o `getDocs(collection(db, 'curp_registry'))` -> `PERMISSION_DENIED`.
12. **Lectura/Escritura no autorizada en `docentes` o `configuracion`:** Alumno autenticado intenta leer `docentes` o modificar `configuracion/oficio_circular` -> `PERMISSION_DENIED`.
