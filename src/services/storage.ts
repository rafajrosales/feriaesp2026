import {
  Estudiante,
  EvaluacionVocacional,
  ProgresoVirtual,
  ProgresoEspecialidad,
  FichaAcademiaReq,
  OficioCircular,
  SpecialtyId,
  DocenteAutorizado,
  CuestionarioEspecialidad,
  ReactivoExamen,
  LetraOpcionVocacional,
  DesglosePartesVocacional,
  RespuestaVocacionalDetalle
} from '../types';
import {
  ESTUDIANTES_INICIALES,
  FICHAS_ACADEMIA_DEFAULT,
  OFICIO_CIRCULAR_DEFAULT,
  COSMETOLOGIA_DIAGNOSTICO_REACTIVOS,
  RRHH_DIAGNOSTICO_REACTIVOS,
  TEST_VOCACIONAL_40_PREGUNTAS
} from '../data/mockData';
import { getNivelComprension, resolveNivelComprension } from '../utils/comprension';
import {
  auth,
  checkIsFirebaseAdmin,
  hasVerifiedFirebaseUser,
  cloudGetEstudiantes,
  cloudSaveEstudiante,
  cloudGetDocentes,
  cloudSaveDocente,
  cloudSaveCuestionario,
  cloudDeleteCuestionario,
  cloudGetEvaluaciones,
  cloudSaveEvaluacion,
  cloudGetProgresos,
  cloudSaveProgreso,
  cloudSaveFichaAcademia,
  testConnection
} from './firebase';

const STORAGE_KEYS = {
  ESTUDIANTES: 'cetis7_estudiantes',
  EVALUACIONES: 'cetis7_evaluaciones',
  PROGRESOS: 'cetis7_progresos_virtuales',
  FICHAS: 'cetis7_fichas_academia',
  OFICIO: 'cetis7_oficio_circular',
  ESTUDIANTE_ACTIVO: 'cetis7_estudiante_activo_nc',
  SESION_ACTIVA: 'cetis7_sesion_activa',
  DOCENTES: 'cetis7_docentes_autorizados',
  CUESTIONARIOS: 'cetis7_cuestionarios_especialidad'
};

export const DOCENTES_INICIALES: DocenteAutorizado[] = [
  {
    id: 'DOC-2026-001',
    nombre_completo: 'Ing. Marco Antonio Estrada Ruiz',
    rfc: 'EASM780412HDF',
    correo_institucional: 'marco.estrada@cetis7.edu.mx',
    academia: 'programacion',
    rol: 'Jefe de Academia',
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
    clave_acceso: 'COSM2026',
    estatus_autorizacion: 'AUTORIZADO',
    fecha_alta: '2026-01-18T14:20:00.000Z',
    registrado_por: 'Administrador DGETI'
  }
];

// Simple deterministic hash for demo token generation
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

function buildCosmetologiaSeedProgress(wrongQuestionIds: number[]): ProgresoEspecialidad {
  return buildStandardSeedProgress(COSMETOLOGIA_DIAGNOSTICO_REACTIVOS, wrongQuestionIds);
}

function buildRrhhSeedProgress(wrongQuestionIds: number[]): ProgresoEspecialidad {
  return buildStandardSeedProgress(RRHH_DIAGNOSTICO_REACTIVOS, wrongQuestionIds);
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

  const respuestas_detalle: Record<number, RespuestaVocacionalDetalle> = {};

  TEST_VOCACIONAL_40_PREGUNTAS.forEach(pregunta => {
    const letra = respuestasPorId[pregunta.id];
    if (!letra) return;
    const opt = pregunta.opciones.find(o => o.letra === letra);
    if (!opt) return;

    const spec = opt.specialty;
    puntajes[spec] += 1;
    respuestas_detalle[pregunta.id] = {
      opcion: letra,
      especialidad: spec
    };

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

  const toPct20 = (v: number) => Math.min(100, Math.round((v / 20) * 100));

  return {
    num_control: numControl,
    version_test: '40_REACTIVOS_2026',
    total_reactivos: totalReactivos,
    score_aptitud_programacion: toPct20(desglose_partes.parte2_actividades.programacion + desglose_partes.parte3_habilidades.programacion),
    score_gusto_programacion: toPct20(desglose_partes.parte1_intereses.programacion + desglose_partes.parte4_metas.programacion),
    score_aptitud_comercio: toPct20(desglose_partes.parte2_actividades.comercio + desglose_partes.parte3_habilidades.comercio),
    score_gusto_comercio: toPct20(desglose_partes.parte1_intereses.comercio + desglose_partes.parte4_metas.comercio),
    score_aptitud_rrhh: toPct20(desglose_partes.parte2_actividades.rrhh + desglose_partes.parte3_habilidades.rrhh),
    score_gusto_rrhh: toPct20(desglose_partes.parte1_intereses.rrhh + desglose_partes.parte4_metas.rrhh),
    score_aptitud_cosmetologia: toPct20(desglose_partes.parte2_actividades.cosmetologia + desglose_partes.parte3_habilidades.cosmetologia),
    score_gusto_cosmetologia: toPct20(desglose_partes.parte1_intereses.cosmetologia + desglose_partes.parte4_metas.cosmetologia),
    puntajes_especialidad: puntajes,
    porcentajes_especialidad: porcentajes,
    desglose_partes,
    respuestas_detalle,
    especialidades_empatadas: empatadas,
    carrera_sugerida: primaria,
    segunda_opcion: secundaria,
    analisis_pedagogico,
    fecha_evaluacion: fechaEvalISO || new Date().toISOString(),
    sincronizado_firestore: false
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

function buildDefaultEvaluaciones40(): Record<string, EvaluacionVocacional> {
  const gaelNC = ESTUDIANTES_INICIALES[0].num_control;
  const valeriaNC = ESTUDIANTES_INICIALES[1].num_control;
  const diegoNC = ESTUDIANTES_INICIALES[2].num_control;
  const ximenaNC = ESTUDIANTES_INICIALES[3].num_control;
  const mateoNC = ESTUDIANTES_INICIALES[4].num_control;
  const camilaNC = ESTUDIANTES_INICIALES[5].num_control;
  const leonardoNC = ESTUDIANTES_INICIALES[6].num_control;
  const renataNC = ESTUDIANTES_INICIALES[7].num_control;

  return {
    [gaelNC]: buildEvaluacion40Seed(
      gaelNC,
      { programacion: 28, comercio: 6, rrhh: 4, cosmetologia: 2 },
      new Date(Date.now() - 86400000).toISOString()
    ),
    [valeriaNC]: buildEvaluacion40Seed(
      valeriaNC,
      { comercio: 27, rrhh: 7, programacion: 4, cosmetologia: 2 },
      new Date(Date.now() - 80000000).toISOString()
    ),
    [diegoNC]: buildEvaluacion40Seed(
      diegoNC,
      { rrhh: 28, comercio: 6, cosmetologia: 4, programacion: 2 },
      new Date(Date.now() - 75000000).toISOString()
    ),
    [ximenaNC]: buildEvaluacion40Seed(
      ximenaNC,
      { cosmetologia: 29, rrhh: 6, comercio: 3, programacion: 2 },
      new Date(Date.now() - 70000000).toISOString()
    ),
    [mateoNC]: buildEvaluacion40Seed(
      mateoNC,
      { programacion: 23, comercio: 9, rrhh: 5, cosmetologia: 3 },
      new Date(Date.now() - 50000000).toISOString()
    ),
    [camilaNC]: buildEvaluacion40Seed(
      camilaNC,
      { cosmetologia: 24, rrhh: 9, comercio: 4, programacion: 3 },
      new Date(Date.now() - 40000000).toISOString()
    ),
    [leonardoNC]: buildEvaluacion40Seed(
      leonardoNC,
      { programacion: 25, comercio: 8, rrhh: 4, cosmetologia: 3 },
      new Date(Date.now() - 30000000).toISOString()
    ),
    [renataNC]: buildEvaluacion40Seed(
      renataNC,
      { comercio: 26, rrhh: 7, programacion: 4, cosmetologia: 3 },
      new Date(Date.now() - 20000000).toISOString()
    )
  };
}

// Initial state builder
export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.DOCENTES)) {
    localStorage.setItem(STORAGE_KEYS.DOCENTES, JSON.stringify(DOCENTES_INICIALES));
  }

  const hasBeenInitialized = localStorage.getItem('cetis7_estudiantes_initialized');
  if (!localStorage.getItem(STORAGE_KEYS.ESTUDIANTES) && !hasBeenInitialized) {

    localStorage.setItem(STORAGE_KEYS.ESTUDIANTES, JSON.stringify(ESTUDIANTES_INICIALES));
    localStorage.setItem('cetis7_estudiantes_initialized', 'true');

    const gaelNC = ESTUDIANTES_INICIALES[0].num_control; // 26316070010042
    const valeriaNC = ESTUDIANTES_INICIALES[1].num_control; // 26316070010118
    const diegoNC = ESTUDIANTES_INICIALES[2].num_control; // 26316070010205
    const ximenaNC = ESTUDIANTES_INICIALES[3].num_control; // 26316070010312
    const mateoNC = ESTUDIANTES_INICIALES[4].num_control; // 26316070010419
    const camilaNC = ESTUDIANTES_INICIALES[5].num_control; // 26316070010523
    const leonardoNC = ESTUDIANTES_INICIALES[6].num_control; // 26316070010631
    const renataNC = ESTUDIANTES_INICIALES[7].num_control; // 26316070010744

    const gaelToken = generateClaveUnicaToken(gaelNC, Date.now() - 3600000);
    const valeriaToken = generateClaveUnicaToken(valeriaNC, Date.now() - 7200000);
    const diegoToken = generateClaveUnicaToken(diegoNC, Date.now() - 10800000);
    const ximenaToken = generateClaveUnicaToken(ximenaNC, Date.now() - 14400000);
    const leonardoToken = generateClaveUnicaToken(leonardoNC, Date.now() - 18000000);
    const renataToken = generateClaveUnicaToken(renataNC, Date.now() - 21600000);

    const defaultEvaluaciones: Record<string, EvaluacionVocacional> = buildDefaultEvaluaciones40();

    const baseFinishedSpecs = {
      programacion: { video_visto: true, infografia_explorada: true, proyectos_revisados: true, quiz_aprobado: true, calificacion_quiz: 100, puntaje_obtenido: 5, puntaje_maximo: 5, nivel_perfil: 'MUCHO' as const },
      comercio: { video_visto: true, infografia_explorada: true, proyectos_revisados: true, quiz_aprobado: true, calificacion_quiz: 100, puntaje_obtenido: 5, puntaje_maximo: 5, nivel_perfil: 'MUCHO' as const }
    };

    const defaultProgresos: Record<string, ProgresoVirtual> = {
      [gaelNC]: {
        num_control: gaelNC,
        test_vocacional_completado: true,
        progreso_especialidades: {
          ...baseFinishedSpecs,
          rrhh: buildRrhhSeedProgress([4]),
          cosmetologia: buildCosmetologiaSeedProgress([2, 5])
        },
        porcentaje_virtual: 100,
        promedio_cuestionarios: 85.0,
        clave_unica_token: gaelToken,
        estatus_fase_virtual: 'COMPLETADO',
        fecha_termino: new Date(Date.now() - 3600000).toISOString()
      },
      [valeriaNC]: {
        num_control: valeriaNC,
        test_vocacional_completado: true,
        progreso_especialidades: {
          ...baseFinishedSpecs,
          rrhh: buildRrhhSeedProgress([3, 5]),
          cosmetologia: buildCosmetologiaSeedProgress([4])
        },
        porcentaje_virtual: 100,
        promedio_cuestionarios: 85.0,
        clave_unica_token: valeriaToken,
        estatus_fase_virtual: 'COMPLETADO',
        fecha_termino: new Date(Date.now() - 7200000).toISOString()
      },
      [diegoNC]: {
        num_control: diegoNC,
        test_vocacional_completado: true,
        progreso_especialidades: {
          ...baseFinishedSpecs,
          rrhh: buildRrhhSeedProgress([]),
          cosmetologia: buildCosmetologiaSeedProgress([3])
        },
        porcentaje_virtual: 100,
        promedio_cuestionarios: 95.0,
        clave_unica_token: diegoToken,
        estatus_fase_virtual: 'COMPLETADO',
        fecha_termino: new Date(Date.now() - 10800000).toISOString()
      },
      [ximenaNC]: {
        num_control: ximenaNC,
        test_vocacional_completado: true,
        progreso_especialidades: {
          ...baseFinishedSpecs,
          rrhh: buildRrhhSeedProgress([2]),
          cosmetologia: buildCosmetologiaSeedProgress([])
        },
        porcentaje_virtual: 100,
        promedio_cuestionarios: 95.0,
        clave_unica_token: ximenaToken,
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
          cosmetologia: buildCosmetologiaSeedProgress([])
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
          rrhh: buildRrhhSeedProgress([1, 2, 4]),
          cosmetologia: buildCosmetologiaSeedProgress([2, 3])
        },
        porcentaje_virtual: 100,
        promedio_cuestionarios: 75.0,
        clave_unica_token: leonardoToken,
        estatus_fase_virtual: 'COMPLETADO',
        fecha_termino: new Date(Date.now() - 18000000).toISOString()
      },
      [renataNC]: {
        num_control: renataNC,
        test_vocacional_completado: true,
        progreso_especialidades: {
          ...baseFinishedSpecs,
          rrhh: buildRrhhSeedProgress([5]),
          cosmetologia: buildCosmetologiaSeedProgress([1, 2, 4])
        },
        porcentaje_virtual: 100,
        promedio_cuestionarios: 80.0,
        clave_unica_token: renataToken,
        estatus_fase_virtual: 'COMPLETADO',
        fecha_termino: new Date(Date.now() - 21600000).toISOString()
      }
    };

    localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify(defaultEvaluaciones));
    localStorage.setItem(STORAGE_KEYS.PROGRESOS, JSON.stringify(defaultProgresos));
    localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(FICHAS_ACADEMIA_DEFAULT));
    localStorage.setItem(STORAGE_KEYS.OFICIO, JSON.stringify(OFICIO_CIRCULAR_DEFAULT));
    localStorage.setItem(STORAGE_KEYS.ESTUDIANTE_ACTIVO, gaelNC);
  }
}

// Data access helpers
export function getEstudiantes(): Estudiante[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.ESTUDIANTES);
  let list: Estudiante[] = raw ? JSON.parse(raw) : ESTUDIANTES_INICIALES;
  
  // Ensure backward compatibility if stored prior to tutor fields
  let updated = false;
  list = list.map(e => {
    if (!e.tutor) {
      const match = ESTUDIANTES_INICIALES.find(i => i.num_control === e.num_control);
      e.tutor = match?.tutor || {
        nombre_tutor: 'Tutor Legal Familiar',
        parentesco: 'Padre',
        correo_tutor: `tutor.${e.num_control.slice(-4)}@gmail.com`,
        telefono_tutor: '55 1234 5678',
        verificado: false
      };
      updated = true;
    }
    return e;
  });

  if (updated) {
    localStorage.setItem(STORAGE_KEYS.ESTUDIANTES, JSON.stringify(list));
  }
  return list;
}

export function getEstudianteByNC(nc: string): Estudiante | null {
  const list = getEstudiantes();
  return list.find(e => e.num_control === nc) || null;
}

export function getEstudianteByCURP(curp: string): Estudiante | null {
  const list = getEstudiantes();
  const clean = curp.trim().toUpperCase();
  return list.find(e => e.curp.trim().toUpperCase() === clean) || null;
}

export function validarCURP(curp: string): { valido: boolean; mensaje?: string } {
  const clean = curp.trim().toUpperCase();
  if (!clean) {
    return { valido: false, mensaje: 'La CURP es obligatoria.' };
  }
  if (clean.length !== 18) {
    return { valido: false, mensaje: `La CURP debe tener exactamente 18 caracteres (actualmente tiene ${clean.length}).` };
  }
  // Standard Mexican CURP format: 4 letters + 6 digits (YYMMDD) + H/M + 5 letters + 1 letter/digit + 1 digit
  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
  if (!regex.test(clean)) {
    return { valido: false, mensaje: 'El formato de la CURP es inválido (ejemplo: LOVM090412HDFRLA01).' };
  }
  return { valido: true };
}

export function registrarNuevoEstudiante(estudiante: Estudiante): { 
  success: boolean; 
  error?: string; 
  estudiante?: Estudiante 
} {
  initializeStorage();
  const cleanCurp = estudiante.curp.trim().toUpperCase();
  const cleanNC = estudiante.num_control.trim();

  // Validate format
  const curpCheck = validarCURP(cleanCurp);
  if (!curpCheck.valido) {
    return { success: false, error: curpCheck.mensaje };
  }

  // 1. Strict Uniqueness Check by CURP
  const existingByCurp = getEstudianteByCURP(cleanCurp);
  if (existingByCurp) {
    return { 
      success: false, 
      error: `La CURP "${cleanCurp}" ya está registrada en el padrón del CETis No. 7 a nombre de ${existingByCurp.nombre_completo} (Núm. Control: ${existingByCurp.num_control}). Por normatividad de la DGETI y control de matrícula, solo se permite un único registro por alumno. Si eres este alumno, ingresa directamente con tu CURP.` 
    };
  }

  // 2. Strict Uniqueness Check by Num. Control
  const existingByNC = getEstudianteByNC(cleanNC);
  if (existingByNC) {
    return { 
      success: false, 
      error: `El Número de Control "${cleanNC}" ya se encuentra asignado a ${existingByNC.nombre_completo}. Verifica tu número escolar o solicita apoyo a Control Escolar.` 
    };
  }

  // Normalize student data
  const normalized: Estudiante = {
    ...estudiante,
    curp: cleanCurp,
    num_control: cleanNC,
    correo_institucional: estudiante.correo_institucional || `${estudiante.nombre_completo.split(' ')[0].toLowerCase()}.${cleanNC.slice(-4)}@cetis7.edu.mx`,
    ...(auth.currentUser?.uid ? { ownerUid: auth.currentUser.uid } : {})
  };

  saveEstudiante(normalized);
  setEstudianteActivoNC(normalized.num_control);
  setSesionActiva({
    tipo: 'alumno',
    num_control: normalized.num_control,
    nombre: normalized.nombre_completo
  });

  return { success: true, estudiante: normalized };
}

export interface SesionUsuario {
  tipo: 'alumno' | 'docente';
  num_control?: string;
  nombre?: string;
  timestamp?: number;
}

export function getSesionActiva(): SesionUsuario | null {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.SESION_ACTIVA);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSesionActiva(sesion: SesionUsuario | null): void {
  initializeStorage();
  if (!sesion) {
    localStorage.removeItem(STORAGE_KEYS.SESION_ACTIVA);
  } else {
    localStorage.setItem(STORAGE_KEYS.SESION_ACTIVA, JSON.stringify({
      ...sesion,
      timestamp: Date.now()
    }));
  }
}

export function cerrarSesion(): void {
  setSesionActiva(null);
}

export function verificarYFirmarTutor(numControl: string, firmaDigital: string, correoConfirmado?: string): Estudiante | null {
  const current = getEstudiantes();
  const idx = current.findIndex(e => e.num_control === numControl);
  if (idx >= 0) {
    const est = { ...current[idx] };
    est.tutor = {
      ...est.tutor,
      verificado: true,
      fecha_verificacion: new Date().toISOString(),
      firma_digital: firmaDigital,
      ...(correoConfirmado ? { correo_tutor: correoConfirmado } : {})
    };
    current[idx] = est;
    localStorage.setItem(STORAGE_KEYS.ESTUDIANTES, JSON.stringify(current));
    void canSyncStudentRecord(est).then(allowed => {
      if (allowed) {
        void cloudSaveEstudiante(est).catch(err => {
          console.warn('Firestore write warning (tutor):', err);
        });
      }
    });
    return est;
  }
  return null;
}

const SEED_STUDENT_NCS = new Set(ESTUDIANTES_INICIALES.map(e => e.num_control));

async function canSyncStudentRecord(record: { num_control: string; ownerUid?: string }): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return false;
  const isAdmin = await checkIsFirebaseAdmin(user);
  if (isAdmin) return true;
  if (record.ownerUid && record.ownerUid === user.uid) return true;
  if (!record.ownerUid && !SEED_STUDENT_NCS.has(record.num_control)) return true;
  return false;
}

export function saveEstudiante(estudiante: Estudiante): void {
  const current = getEstudiantes();
  const payloadEst: Estudiante =
    !estudiante.ownerUid && auth.currentUser?.uid && !SEED_STUDENT_NCS.has(estudiante.num_control)
      ? { ...estudiante, ownerUid: auth.currentUser.uid }
      : estudiante;

  const idx = current.findIndex(e => e.num_control === payloadEst.num_control);
  if (idx >= 0) {
    current[idx] = payloadEst;
  } else {
    current.push(payloadEst);
  }
  localStorage.setItem(STORAGE_KEYS.ESTUDIANTES, JSON.stringify(current));

  void canSyncStudentRecord(payloadEst).then(allowed => {
    if (allowed) {
      void cloudSaveEstudiante(payloadEst).catch(err => {
        console.warn('Firestore write warning (estudiante):', err);
      });
    }
  });
}

export function getEstudianteActivoNC(): string {
  initializeStorage();
  const stored = localStorage.getItem(STORAGE_KEYS.ESTUDIANTE_ACTIVO);
  if (stored) return stored;
  const list = getEstudiantes();
  if (list.length > 0) return list[0].num_control;
  return '';
}

export function setEstudianteActivoNC(nc: string): void {
  if (!nc) {
    localStorage.removeItem(STORAGE_KEYS.ESTUDIANTE_ACTIVO);
  } else {
    localStorage.setItem(STORAGE_KEYS.ESTUDIANTE_ACTIVO, nc);
  }
}

function migrateEvaluacionesTo40IfNeeded(): Record<string, EvaluacionVocacional> {
  const raw = localStorage.getItem(STORAGE_KEYS.EVALUACIONES);
  const dict: Record<string, EvaluacionVocacional> = raw ? JSON.parse(raw) : {};
  const syncKey = 'cetis7_vocacional_40_v1_synced';

  if (!localStorage.getItem(syncKey)) {
    const defaults40 = buildDefaultEvaluaciones40();
    let changed = false;
    Object.entries(defaults40).forEach(([nc, ev40]) => {
      const existing = dict[nc];
      if (!existing || existing.version_test !== '40_REACTIVOS_2026') {
        dict[nc] = ev40;
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify(dict));
    }
    localStorage.setItem(syncKey, '1');
  }

  return dict;
}

export function getAllEvaluacionesVocacionales(): Record<string, EvaluacionVocacional> {
  initializeStorage();
  return migrateEvaluacionesTo40IfNeeded();
}

export function getEvaluacionVocacional(nc: string): EvaluacionVocacional | null {
  if (!nc) return null;
  const dict = getAllEvaluacionesVocacionales();
  return dict[nc] || null;
}

export function saveEvaluacionVocacional(evaluacion: EvaluacionVocacional): void {
  if (!evaluacion || !evaluacion.num_control) return;
  initializeStorage();
  const dict = migrateEvaluacionesTo40IfNeeded();
  const est = getEstudianteByNC(evaluacion.num_control);
  const ownerUid =
    evaluacion.ownerUid ||
    est?.ownerUid ||
    (auth.currentUser?.uid && !SEED_STUDENT_NCS.has(evaluacion.num_control) ? auth.currentUser.uid : undefined);
  const payloadEval: EvaluacionVocacional = ownerUid ? { ...evaluacion, ownerUid } : evaluacion;

  dict[payloadEval.num_control] = payloadEval;
  localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify(dict));

  void canSyncStudentRecord(payloadEval).then(async allowed => {
    if (!allowed) return;
    if (est) {
      await cloudSaveEstudiante(est).catch(() => undefined);
    }
    await cloudSaveEvaluacion(payloadEval)
      .then(() => {
        const latestRaw = localStorage.getItem(STORAGE_KEYS.EVALUACIONES);
        const latestDict: Record<string, EvaluacionVocacional> = latestRaw ? JSON.parse(latestRaw) : {};
        if (latestDict[payloadEval.num_control]) {
          latestDict[payloadEval.num_control] = {
            ...latestDict[payloadEval.num_control],
            sincronizado_firestore: true
          };
          localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify(latestDict));
        }
      })
      .catch(err => {
        console.warn('No se pudo sincronizar evaluación vocacional con Firestore (respaldo local activo):', err);
      });
  });
}

export async function guardarEvaluacionVocacionalEnBD(
  evaluacion: EvaluacionVocacional
): Promise<{ syncedToCloud: boolean; error?: string }> {
  if (!evaluacion || !evaluacion.num_control) {
    return { syncedToCloud: false, error: 'Número de control inválido.' };
  }
  initializeStorage();
  const dict = migrateEvaluacionesTo40IfNeeded();
  const est = getEstudianteByNC(evaluacion.num_control);
  const ownerUid =
    evaluacion.ownerUid ||
    est?.ownerUid ||
    (auth.currentUser?.uid && !SEED_STUDENT_NCS.has(evaluacion.num_control) ? auth.currentUser.uid : undefined);
  const payloadEval: EvaluacionVocacional = ownerUid ? { ...evaluacion, ownerUid } : evaluacion;

  dict[payloadEval.num_control] = payloadEval;
  localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify(dict));

  if (!hasVerifiedFirebaseUser()) {
    return {
      syncedToCloud: false,
      error: 'Conecta tu cuenta Google para sincronizar con la nube Firestore (respaldo local activo).'
    };
  }

  const allowed = await canSyncStudentRecord(payloadEval);
  if (!allowed) {
    return {
      syncedToCloud: false,
      error: 'Modo demostración local activo; registra un alumno con tu cuenta para sincronizar en la nube.'
    };
  }

  try {
    if (est) {
      await cloudSaveEstudiante(est);
    }
    await cloudSaveEvaluacion(payloadEval);
    dict[payloadEval.num_control] = { ...payloadEval, sincronizado_firestore: true };
    localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify(dict));
    return { syncedToCloud: true };
  } catch (err: unknown) {
    return {
      syncedToCloud: false,
      error: err instanceof Error ? err.message : 'Sin conexión con Firestore; guardado en respaldo local.'
    };
  }
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
  initializeStorage();
  const user = auth.currentUser;
  const localEvalCount = Object.keys(migrateEvaluacionesTo40IfNeeded()).length;

  // Never trigger unauthenticated Firestore list/write calls
  if (!user || !user.emailVerified) {
    return {
      connected: false,
      requiresAuth: true,
      estudiantesCount: getEstudiantes().length,
      evaluacionesCount: localEvalCount,
      progresosCount: Object.keys(JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESOS) || '{}')).length,
      syncedAt: new Date().toISOString()
    };
  }

  try {
    const connected = await testConnection();
    const isAdmin = await checkIsFirebaseAdmin(user);

    if (!connected) {
      return {
        connected: false,
        requiresAuth: false,
        isAdmin,
        userEmail: user.email,
        estudiantesCount: getEstudiantes().length,
        evaluacionesCount: localEvalCount,
        progresosCount: Object.keys(JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESOS) || '{}')).length,
        syncedAt: new Date().toISOString()
      };
    }

    const [cloudEstudiantes, cloudEvaluaciones, cloudProgresos] = await Promise.all([
      cloudGetEstudiantes(isAdmin).catch(() => [] as Estudiante[]),
      cloudGetEvaluaciones(isAdmin).catch(() => [] as EvaluacionVocacional[]),
      cloudGetProgresos(isAdmin).catch(() => [] as ProgresoVirtual[])
    ]);

    // 1. Merge Estudiantes FIRST (required parent records for evaluaciones/progresos)
    const localEst = getEstudiantes();
    const estMap = new Map<string, Estudiante>(localEst.map(e => [e.num_control, e]));
    cloudEstudiantes.forEach(ce => {
      if (ce?.num_control) estMap.set(ce.num_control, ce);
    });
    const mergedEst = Array.from(estMap.values());
    localStorage.setItem(STORAGE_KEYS.ESTUDIANTES, JSON.stringify(mergedEst));

    // Push eligible local students to cloud BEFORE dependent docs
    const cloudEstSet = new Set(cloudEstudiantes.map(e => e.num_control));
    for (const le of localEst) {
      if (!cloudEstSet.has(le.num_control)) {
        const canUpload = isAdmin || le.ownerUid === user.uid || (!le.ownerUid && !SEED_STUDENT_NCS.has(le.num_control));
        if (canUpload) {
          const estToUpload = le.ownerUid ? le : { ...le, ownerUid: user.uid };
          await cloudSaveEstudiante(estToUpload).catch(() => undefined);
          cloudEstSet.add(le.num_control);
        }
      }
    }

    // 2. Merge Evaluaciones (prefer 40_REACTIVOS_2026 or newer fecha_evaluacion)
    const localEvalDict = migrateEvaluacionesTo40IfNeeded();
    const cloudEvalMap = new Map<string, EvaluacionVocacional>();
    cloudEvaluaciones.forEach(ev => {
      if (ev?.num_control) {
        cloudEvalMap.set(ev.num_control, { ...ev, sincronizado_firestore: true });
        const localEv = localEvalDict[ev.num_control];
        const cloudIsNewer =
          !localEv ||
          (ev.version_test === '40_REACTIVOS_2026' && localEv.version_test !== '40_REACTIVOS_2026') ||
          new Date(ev.fecha_evaluacion).getTime() >= new Date(localEv.fecha_evaluacion).getTime();
        if (cloudIsNewer) {
          localEvalDict[ev.num_control] = { ...ev, sincronizado_firestore: true };
        }
      }
    });
    localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify(localEvalDict));

    // Push eligible local 40-question evaluaciones missing or newer in cloud
    for (const [nc, le] of Object.entries(localEvalDict)) {
      const ce = cloudEvalMap.get(nc);
      const shouldUpload =
        !ce ||
        (le.version_test === '40_REACTIVOS_2026' && ce.version_test !== '40_REACTIVOS_2026') ||
        new Date(le.fecha_evaluacion).getTime() > new Date(ce.fecha_evaluacion).getTime();
      const canUpload = isAdmin || le.ownerUid === user.uid || (!le.ownerUid && !SEED_STUDENT_NCS.has(nc));
      if (shouldUpload && canUpload && (isAdmin || cloudEstSet.has(nc))) {
        const evalToUpload = le.ownerUid ? le : { ...le, ownerUid: user.uid };
        await cloudSaveEvaluacion(evalToUpload)
          .then(() => {
            localEvalDict[nc] = { ...evalToUpload, sincronizado_firestore: true };
          })
          .catch(() => undefined);
      }
    }
    localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify(localEvalDict));

    // 3. Merge Progresos
    const rawProg = localStorage.getItem(STORAGE_KEYS.PROGRESOS);
    const localProgDict: Record<string, ProgresoVirtual> = rawProg ? JSON.parse(rawProg) : {};
    const cloudProgSet = new Set<string>();
    cloudProgresos.forEach(cp => {
      if (cp?.num_control) {
        cloudProgSet.add(cp.num_control);
        const lp = localProgDict[cp.num_control];
        if (!lp || cp.porcentaje_virtual >= lp.porcentaje_virtual) {
          localProgDict[cp.num_control] = cp;
        }
      }
    });
    localStorage.setItem(STORAGE_KEYS.PROGRESOS, JSON.stringify(localProgDict));
    for (const lp of Object.values(localProgDict)) {
      const canUpload = isAdmin || lp.ownerUid === user.uid || (!lp.ownerUid && !SEED_STUDENT_NCS.has(lp.num_control));
      if (!cloudProgSet.has(lp.num_control) && canUpload && (isAdmin || cloudEstSet.has(lp.num_control))) {
        const progToUpload = lp.ownerUid ? lp : { ...lp, ownerUid: user.uid };
        await cloudSaveProgreso(progToUpload).catch(() => undefined);
      }
    }

    // 4. Admin-only docentes sync
    if (isAdmin) {
      await cloudGetDocentes(true).catch(() => [] as DocenteAutorizado[]);
    }

    return {
      connected,
      requiresAuth: false,
      isAdmin,
      userEmail: user.email,
      estudiantesCount: mergedEst.length,
      evaluacionesCount: Object.keys(localEvalDict).length,
      progresosCount: Object.keys(localProgDict).length,
      syncedAt: new Date().toISOString()
    };
  } catch (err: unknown) {
    return {
      connected: false,
      requiresAuth: false,
      userEmail: user.email,
      estudiantesCount: getEstudiantes().length,
      evaluacionesCount: Object.keys(migrateEvaluacionesTo40IfNeeded()).length,
      progresosCount: 0,
      syncedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Error de sincronización con Firestore.'
    };
  }
}

export function getProgresoVirtual(nc: string): ProgresoVirtual {
  initializeStorage();
  if (nc) {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESOS);
    const dict: Record<string, ProgresoVirtual> = raw ? JSON.parse(raw) : {};

    const standardizedStatsSyncKey = 'cetis7_especialidades_comprension_v3_synced';
    if (!localStorage.getItem(standardizedStatsSyncKey)) {
      const sampleCosmeWrong: Record<string, number[]> = {
        [ESTUDIANTES_INICIALES[0].num_control]: [2, 5],
        [ESTUDIANTES_INICIALES[1].num_control]: [4],
        [ESTUDIANTES_INICIALES[2].num_control]: [3],
        [ESTUDIANTES_INICIALES[3].num_control]: [],
        [ESTUDIANTES_INICIALES[5].num_control]: [],
        [ESTUDIANTES_INICIALES[6].num_control]: [2, 3],
        [ESTUDIANTES_INICIALES[7].num_control]: [1, 2, 4]
      };
      const sampleRrhhWrong: Record<string, number[]> = {
        [ESTUDIANTES_INICIALES[0].num_control]: [4],
        [ESTUDIANTES_INICIALES[1].num_control]: [3, 5],
        [ESTUDIANTES_INICIALES[2].num_control]: [],
        [ESTUDIANTES_INICIALES[3].num_control]: [2],
        [ESTUDIANTES_INICIALES[6].num_control]: [1, 2, 4],
        [ESTUDIANTES_INICIALES[7].num_control]: [5]
      };
      let changedStats = false;
      const careers: SpecialtyId[] = ['programacion', 'comercio', 'rrhh', 'cosmetologia'];

      Object.values(dict).forEach(entry => {
        if (!entry?.progreso_especialidades) return;
        const cosme = entry.progreso_especialidades.cosmetologia;
        const rrhh = entry.progreso_especialidades.rrhh;

        if (cosme && (cosme.puntaje_maximo ?? 0) > 5) {
          if (sampleCosmeWrong[entry.num_control]) {
            entry.progreso_especialidades.cosmetologia = {
              ...cosme,
              ...buildCosmetologiaSeedProgress(sampleCosmeWrong[entry.num_control])
            };
          } else {
            const pct = cosme.calificacion_quiz || 0;
            const pts = Math.max(0, Math.min(5, Math.round((pct / 100) * 5)));
            entry.progreso_especialidades.cosmetologia = {
              ...cosme,
              puntaje_obtenido: pts,
              puntaje_maximo: 5,
              calificacion_quiz: pts * 20,
              quiz_aprobado: true,
              nivel_perfil: getNivelComprension(pts * 20),
              respuestas_detalle: undefined
            };
          }
          changedStats = true;
        }

        if (rrhh && (rrhh.puntaje_maximo ?? 0) > 5) {
          if (sampleRrhhWrong[entry.num_control]) {
            entry.progreso_especialidades.rrhh = {
              ...rrhh,
              ...buildRrhhSeedProgress(sampleRrhhWrong[entry.num_control])
            };
          } else {
            const pct = rrhh.calificacion_quiz || 0;
            const pts = Math.max(0, Math.min(5, Math.round((pct / 100) * 5)));
            entry.progreso_especialidades.rrhh = {
              ...rrhh,
              puntaje_obtenido: pts,
              puntaje_maximo: 5,
              calificacion_quiz: pts * 20,
              quiz_aprobado: true,
              nivel_perfil: getNivelComprension(pts * 20),
              respuestas_detalle: undefined
            };
          }
          changedStats = true;
        }

        // Normalize all evaluated specialty records to comprehension indicators (MUCHO/REGULAR/POCO/NADA)
        let totalQuiz = 0;
        let countQuiz = 0;
        careers.forEach(c => {
          const sp = entry.progreso_especialidades[c];
          if (!sp) return;
          const isEvaluated = Boolean(sp.quiz_aprobado || (sp.puntaje_maximo ?? 0) > 0 || (sp.calificacion_quiz ?? 0) > 0);
          if (isEvaluated) {
            const mappedNivel = resolveNivelComprension(sp);
            if (!sp.quiz_aprobado || sp.nivel_perfil !== mappedNivel) {
              sp.quiz_aprobado = true;
              sp.nivel_perfil = mappedNivel;
              changedStats = true;
            }
            totalQuiz += sp.calificacion_quiz || 0;
            countQuiz++;
          }
        });
        if (countQuiz > 0) {
          entry.promedio_cuestionarios = Math.round((totalQuiz / countQuiz) * 10) / 10;
        }
      });

      if (changedStats) {
        localStorage.setItem(STORAGE_KEYS.PROGRESOS, JSON.stringify(dict));
      }
      localStorage.setItem(standardizedStatsSyncKey, '1');
    }

    if (dict[nc]) {
      return dict[nc];
    }
  }

  // Return empty progress structure safely
  const empty: ProgresoVirtual = {
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
  return empty;
}

export function saveProgresoVirtual(progreso: ProgresoVirtual): void {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.PROGRESOS);
  const dict: Record<string, ProgresoVirtual> = raw ? JSON.parse(raw) : {};

  // Recalculate percentage:
  // Test vocacional = 20%
  // Each career (4 careers) = 20% each (video: 4%, info: 4%, proyectos: 4%, quiz: 8%)
  let pct = 0;
  if (progreso.test_vocacional_completado) pct += 20;

  let totalQuizScores = 0;
  let quizesCompleted = 0;

  const careers: SpecialtyId[] = ['programacion', 'comercio', 'rrhh', 'cosmetologia'];
  careers.forEach(c => {
    const sp = progreso.progreso_especialidades[c];
    if (sp.video_visto) pct += 4;
    if (sp.infografia_explorada) pct += 4;
    if (sp.proyectos_revisados) pct += 4;
    const quizDone = Boolean(sp.quiz_aprobado || (sp.puntaje_maximo ?? 0) > 0);
    if (quizDone) {
      sp.quiz_aprobado = true;
      pct += 8;
      totalQuizScores += sp.calificacion_quiz;
      quizesCompleted++;
    }
  });

  progreso.porcentaje_virtual = Math.min(100, Math.round(pct));
  progreso.promedio_cuestionarios = quizesCompleted > 0 ? Math.round((totalQuizScores / quizesCompleted) * 10) / 10 : 0;

  if (progreso.porcentaje_virtual >= 100) {
    progreso.estatus_fase_virtual = 'COMPLETADO';
    if (!progreso.clave_unica_token) {
      progreso.clave_unica_token = generateClaveUnicaToken(progreso.num_control);
    }
    if (!progreso.fecha_termino) {
      progreso.fecha_termino = new Date().toISOString();
    }
  } else if (progreso.porcentaje_virtual > 0) {
    progreso.estatus_fase_virtual = 'EN_PROCESO';
  } else {
    progreso.estatus_fase_virtual = 'PENDIENTE';
  }

  dict[progreso.num_control] = progreso;
  localStorage.setItem(STORAGE_KEYS.PROGRESOS, JSON.stringify(dict));
  void canSyncStudentRecord(progreso).then(async allowed => {
    if (!allowed) return;
    const est = getEstudianteByNC(progreso.num_control);
    if (est) {
      await cloudSaveEstudiante(est).catch(() => undefined);
    }
    await cloudSaveProgreso(progreso).catch(err => {
      console.warn('Firestore write warning (progreso):', err);
    });
  });
}

export function getFichasAcademia(): Record<string, FichaAcademiaReq> {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.FICHAS);
  if (!raw) return FICHAS_ACADEMIA_DEFAULT;

  const fichas: Record<string, FichaAcademiaReq> = JSON.parse(raw);
  const syncKey = 'cetis7_drive_gallery_v1_synced';

  if (!localStorage.getItem(syncKey)) {
    let changed = false;
    (['rrhh', 'cosmetologia'] as SpecialtyId[]).forEach(specId => {
      const defaultGal = FICHAS_ACADEMIA_DEFAULT[specId]?.recursos_multimedia?.galeria_alumnos;
      if (fichas[specId] && defaultGal && defaultGal.length > 0) {
        const currentGal = fichas[specId].recursos_multimedia?.galeria_alumnos || [];
        const existingIds = new Set(currentGal.map(item => item.id));
        const missingDriveItems = defaultGal.filter(
          item => item.id.includes('-drive-') && !existingIds.has(item.id)
        );
        if (missingDriveItems.length > 0) {
          fichas[specId].recursos_multimedia = {
            ...fichas[specId].recursos_multimedia,
            galeria_alumnos: [
              ...(currentGal.length > 0 ? currentGal : defaultGal.filter(item => !item.id.includes('-drive-'))),
              ...missingDriveItems
            ]
          };
          changed = true;
        }
      }
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
    }
    localStorage.setItem(syncKey, '1');
  }

  const comercioSyncKey = 'cetis7_comercio_aduanas_v1_synced';
  if (!localStorage.getItem(comercioSyncKey)) {
    const defaultComercio = FICHAS_ACADEMIA_DEFAULT.comercio;
    if (fichas.comercio && defaultComercio) {
      let changedComercio = false;
      if (fichas.comercio.nombre_especialidad === 'Técnico en Comercio Internacional') {
        fichas.comercio.nombre_especialidad = defaultComercio.nombre_especialidad;
        changedComercio = true;
      }
      if (
        fichas.comercio.resumen_ejecutivo &&
        fichas.comercio.resumen_ejecutivo.startsWith('Prepara profesionistas técnicos capaces de coordinar')
      ) {
        fichas.comercio.resumen_ejecutivo = defaultComercio.resumen_ejecutivo;
        changedComercio = true;
      }
      if (fichas.comercio.recursos_multimedia) {
        fichas.comercio.recursos_multimedia.infografia_formato =
          defaultComercio.recursos_multimedia.infografia_formato;
        const currentComGal = fichas.comercio.recursos_multimedia.galeria_alumnos || defaultComercio.recursos_multimedia.galeria_alumnos || [];
        const hasInfografia = currentComGal.some(item => item.id === 'com-infografia-oficial');
        const defaultInfoItem = defaultComercio.recursos_multimedia.galeria_alumnos?.find(item => item.id === 'com-infografia-oficial');
        if (!hasInfografia && defaultInfoItem) {
          fichas.comercio.recursos_multimedia.galeria_alumnos = [defaultInfoItem, ...currentComGal];
        }
        changedComercio = true;
      }
      if (changedComercio) {
        localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
      }
    }
    localStorage.setItem(comercioSyncKey, '1');
  }

  const comercioInfoGalSyncKey = 'cetis7_comercio_infografia_gal_v1_synced';
  if (!localStorage.getItem(comercioInfoGalSyncKey)) {
    const defaultComercio = FICHAS_ACADEMIA_DEFAULT.comercio;
    const defaultInfoItem = defaultComercio?.recursos_multimedia?.galeria_alumnos?.find(item => item.id === 'com-infografia-oficial');
    if (fichas.comercio && defaultInfoItem) {
      const currentComGal = fichas.comercio.recursos_multimedia?.galeria_alumnos || defaultComercio.recursos_multimedia?.galeria_alumnos || [];
      if (!currentComGal.some(item => item.id === 'com-infografia-oficial')) {
        fichas.comercio.recursos_multimedia = {
          ...fichas.comercio.recursos_multimedia,
          galeria_alumnos: [defaultInfoItem, ...currentComGal]
        };
        localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
      }
    }
    localStorage.setItem(comercioInfoGalSyncKey, '1');
  }

  const cosmeInfoGalSyncKey = 'cetis7_cosmetologia_infografia_v1_synced';
  if (!localStorage.getItem(cosmeInfoGalSyncKey)) {
    const defaultCosme = FICHAS_ACADEMIA_DEFAULT.cosmetologia;
    const defaultCosInfoItem = defaultCosme?.recursos_multimedia?.galeria_alumnos?.find(item => item.id === 'cos-infografia-oficial');
    if (fichas.cosmetologia && defaultCosInfoItem) {
      const currentCosGal = fichas.cosmetologia.recursos_multimedia?.galeria_alumnos || defaultCosme.recursos_multimedia?.galeria_alumnos || [];
      let changedCos = false;
      if (!currentCosGal.some(item => item.id === 'cos-infografia-oficial')) {
        fichas.cosmetologia.recursos_multimedia = {
          ...fichas.cosmetologia.recursos_multimedia,
          infografia_formato: defaultCosme.recursos_multimedia.infografia_formato,
          galeria_alumnos: [defaultCosInfoItem, ...currentCosGal]
        };
        changedCos = true;
      }
      if (changedCos) {
        localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
      }
    }
    localStorage.setItem(cosmeInfoGalSyncKey, '1');
  }

  const comercioVideoSyncKey = 'cetis7_comercio_video_principal_v1_synced';
  if (!localStorage.getItem(comercioVideoSyncKey)) {
    const defaultComercio = FICHAS_ACADEMIA_DEFAULT.comercio;
    const defaultVideo = defaultComercio?.recursos_multimedia?.video_academia;
    if (fichas.comercio && defaultVideo) {
      const currentVideoUrl = fichas.comercio.recursos_multimedia?.video_academia?.url_video;
      if (!currentVideoUrl || currentVideoUrl.includes('dQw4w9WgXcQ')) {
        fichas.comercio.recursos_multimedia = {
          ...fichas.comercio.recursos_multimedia,
          video_url_o_estado: defaultComercio.recursos_multimedia.video_url_o_estado,
          video_academia: defaultVideo
        };
        localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
      }
    }
    localStorage.setItem(comercioVideoSyncKey, '1');
  }

  const standardizedFichasSyncKey = 'cetis7_especialidades_5reactivos_fichas_v2_synced';
  if (!localStorage.getItem(standardizedFichasSyncKey)) {
    let changedBanco = false;
    const defaultCosme = FICHAS_ACADEMIA_DEFAULT.cosmetologia;
    if (fichas.cosmetologia && defaultCosme?.banco_reactivos?.length === 5) {
      const currentCount = fichas.cosmetologia.banco_reactivos?.length || 0;
      if (currentCount >= 16) {
        fichas.cosmetologia.banco_reactivos = defaultCosme.banco_reactivos;
        changedBanco = true;
      }
    }
    const defaultRrhh = FICHAS_ACADEMIA_DEFAULT.rrhh;
    if (fichas.rrhh && defaultRrhh?.banco_reactivos?.length === 5) {
      const currentCount = fichas.rrhh.banco_reactivos?.length || 0;
      if (currentCount >= 18) {
        fichas.rrhh.banco_reactivos = defaultRrhh.banco_reactivos;
        changedBanco = true;
      }
    }
    if (changedBanco) {
      localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
    }
    localStorage.setItem(standardizedFichasSyncKey, '1');
  }

  return fichas;
}

export function saveFichaAcademia(ficha: FichaAcademiaReq): void {
  initializeStorage();
  const fichas = getFichasAcademia();
  fichas[ficha.especialidad_id] = ficha;
  localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
  void cloudSaveFichaAcademia(ficha).catch(err => {
    console.warn('Firestore write warning (ficha academia):', err);
  });
}

export function getOficioCircular(): OficioCircular {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.OFICIO);
  return raw ? JSON.parse(raw) : OFICIO_CIRCULAR_DEFAULT;
}

export function saveOficioCircular(oficio: OficioCircular): void {
  localStorage.setItem(STORAGE_KEYS.OFICIO, JSON.stringify(oficio));
}

// ---------------------------------------------------------------------
// Docentes Autorizados (Dirección & Subdirección Académica CETis 7)
// ---------------------------------------------------------------------

export function getDocentes(): DocenteAutorizado[] {
  initializeStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.DOCENTES);
  return raw ? JSON.parse(raw) : DOCENTES_INICIALES;
}

export function saveDocentes(docentes: DocenteAutorizado[]): void {
  initializeStorage();
  localStorage.setItem(STORAGE_KEYS.DOCENTES, JSON.stringify(docentes));
  if (hasVerifiedFirebaseUser()) {
    docentes.forEach(d => {
      void cloudSaveDocente(d).catch(err => {
        console.warn('Firestore write warning (docente):', err);
      });
    });
  }
}

export function registrarNuevoDocente(
  datos: Omit<DocenteAutorizado, 'id' | 'fecha_alta'>
): { success: boolean; error?: string; docente?: DocenteAutorizado } {
  const docentes = getDocentes();

  const cleanRfc = datos.rfc.trim().toUpperCase();
  const cleanClave = datos.clave_acceso.trim().toUpperCase();

  if (!cleanRfc) {
    return { success: false, error: 'El RFC del docente es obligatorio.' };
  }

  if (!cleanClave || cleanClave.length < 4) {
    return { success: false, error: 'La clave de acceso o PIN debe tener al menos 4 caracteres.' };
  }

  // Check unique RFC
  const existingRfc = docentes.find(d => d.rfc.trim().toUpperCase() === cleanRfc);
  if (existingRfc) {
    return { 
      success: false, 
      error: `El RFC "${cleanRfc}" ya está registrado a nombre de ${existingRfc.nombre_completo} (${existingRfc.rol}).` 
    };
  }

  // Check unique Clave
  const existingClave = docentes.find(d => d.clave_acceso.trim().toUpperCase() === cleanClave);
  if (existingClave) {
    return { 
      success: false, 
      error: `La clave de acceso "${cleanClave}" ya fue asignada al docente ${existingClave.nombre_completo}. Por favor elige un PIN o clave diferente.` 
    };
  }

  const nuevoDocente: DocenteAutorizado = {
    ...datos,
    id: `DOC-2026-${String(docentes.length + 1).padStart(3, '0')}`,
    rfc: cleanRfc,
    clave_acceso: cleanClave,
    fecha_alta: new Date().toISOString()
  };

  docentes.push(nuevoDocente);
  saveDocentes(docentes);

  return { success: true, docente: nuevoDocente };
}

export function cambiarEstatusDocente(id: string, nuevoEstatus: 'AUTORIZADO' | 'PENDIENTE' | 'REVOCADO'): void {
  const docentes = getDocentes();
  const idx = docentes.findIndex(d => d.id === id);
  if (idx >= 0) {
    docentes[idx].estatus_autorizacion = nuevoEstatus;
    saveDocentes(docentes);
  }
}

export function eliminarDocente(id: string): void {
  const docentes = getDocentes();
  const actualizados = docentes.filter(d => d.id !== id);
  saveDocentes(actualizados);
}

export function validarClaveAccesoDocente(inputClave: string): {
  valido: boolean;
  docente?: DocenteAutorizado;
  esMaster?: boolean;
  mensajeError?: string;
} {
  const cleanInput = inputClave.trim().toUpperCase();
  if (!cleanInput) {
    return { valido: false, mensajeError: 'Por favor ingresa la clave de acceso institucional o PIN.' };
  }

  // Master admin keys
  const CLAVES_MASTER = ['DGETI72026', 'CETIS7DIR', '2026', 'DGETI2026', 'DIR2026'];
  if (CLAVES_MASTER.includes(cleanInput)) {
    return { valido: true, esMaster: true };
  }

  // Check individual authorized teacher PINs or RFC
  const docentes = getDocentes();
  const docenteEncontrado = docentes.find(
    d => d.clave_acceso.trim().toUpperCase() === cleanInput || d.rfc.trim().toUpperCase() === cleanInput
  );

  if (!docenteEncontrado) {
    return { 
      valido: false, 
      mensajeError: 'Clave de acceso o PIN no reconocido en el padrón de la Dirección Académica. Contacta al Administrador.' 
    };
  }

  if (docenteEncontrado.estatus_autorizacion === 'REVOCADO') {
    return { 
      valido: false, 
      mensajeError: `El acceso para el docente ${docenteEncontrado.nombre_completo} fue REVOCADO por la Dirección del plantel.` 
    };
  }

  if (docenteEncontrado.estatus_autorizacion === 'PENDIENTE') {
    return { 
      valido: false, 
      mensajeError: `El registro de ${docenteEncontrado.nombre_completo} se encuentra PENDIENTE de aprobación por el Administrador.` 
    };
  }

  return { valido: true, docente: docenteEncontrado };
}

export function resetAllDataToDefault(): void {
  localStorage.clear();
  initializeStorage();
}

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
    fichas?: any;
    oficio?: any;
  };
}

export function generarRespaldoCompleto(): RespaldoCompletoCETis7 {
  const alumnos = getEstudiantes();
  const docentes = getDocentes();
  
  const rawEval = localStorage.getItem(STORAGE_KEYS.EVALUACIONES);
  const rawProg = localStorage.getItem(STORAGE_KEYS.PROGRESOS);
  const rawFichas = localStorage.getItem(STORAGE_KEYS.FICHAS);
  const rawOficio = localStorage.getItem(STORAGE_KEYS.OFICIO);

  return {
    version: '1.0.0',
    fecha_generacion: new Date().toISOString(),
    plantel: 'CETis No. 7 "Miguel Lerdo de Tejada"',
    ciclo: 'Feria de Especialidades 2026',
    total_alumnos: alumnos.length,
    total_docentes: docentes.length,
    datos: {
      alumnos,
      docentes,
      evaluaciones: rawEval ? JSON.parse(rawEval) : {},
      progresos: rawProg ? JSON.parse(rawProg) : {},
      fichas: rawFichas ? JSON.parse(rawFichas) : null,
      oficio: rawOficio ? JSON.parse(rawOficio) : null
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
  const fileName = `Respaldo_CETis7_Alumnos_Docentes_${fechaStr}.json`;
  
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

export function restaurarDesdeRespaldoJSON(jsonString: string): {
  success: boolean;
  mensaje: string;
  totalAlumnos?: number;
  totalDocentes?: number;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data.datos || (!data.datos.alumnos && !data.datos.docentes)) {
      return { success: false, mensaje: 'El archivo JSON no contiene una estructura válida de respaldo de CETis 7.' };
    }

    if (Array.isArray(data.datos.alumnos)) {
      localStorage.setItem(STORAGE_KEYS.ESTUDIANTES, JSON.stringify(data.datos.alumnos));
      if (data.datos.alumnos.length > 0) {
        localStorage.setItem(STORAGE_KEYS.ESTUDIANTE_ACTIVO, data.datos.alumnos[0].num_control);
      }
    }

    if (Array.isArray(data.datos.docentes)) {
      localStorage.setItem(STORAGE_KEYS.DOCENTES, JSON.stringify(data.datos.docentes));
    }

    if (data.datos.evaluaciones) {
      localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify(data.datos.evaluaciones));
    }
    if (data.datos.progresos) {
      localStorage.setItem(STORAGE_KEYS.PROGRESOS, JSON.stringify(data.datos.progresos));
    }
    if (data.datos.fichas) {
      localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(data.datos.fichas));
    }
    if (data.datos.oficio) {
      localStorage.setItem(STORAGE_KEYS.OFICIO, JSON.stringify(data.datos.oficio));
    }

    return {
      success: true,
      mensaje: '¡Respaldo restaurado con éxito en el sistema!',
      totalAlumnos: data.datos.alumnos?.length || 0,
      totalDocentes: data.datos.docentes?.length || 0
    };
  } catch (err: any) {
    return { success: false, mensaje: `Error al leer el archivo JSON: ${err.message || 'Formato inválido'}` };
  }
}

export function reiniciarSoloAlumnos(modo: 'iniciales' | 'limpiar'): void {
  if (modo === 'iniciales') {
    localStorage.removeItem(STORAGE_KEYS.ESTUDIANTES);
    localStorage.removeItem(STORAGE_KEYS.EVALUACIONES);
    localStorage.removeItem(STORAGE_KEYS.PROGRESOS);
    localStorage.removeItem(STORAGE_KEYS.ESTUDIANTE_ACTIVO);
    localStorage.removeItem('cetis7_estudiantes_initialized');
    initializeStorage();
  } else {
    localStorage.setItem(STORAGE_KEYS.ESTUDIANTES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVALUACIONES, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEYS.PROGRESOS, JSON.stringify({}));
    localStorage.removeItem(STORAGE_KEYS.ESTUDIANTE_ACTIVO);
    localStorage.setItem('cetis7_estudiantes_initialized', 'true');

    // Si la sesión activa era de un alumno, cerrarla inmediatamente
    const ses = getSesionActiva();
    if (ses && ses.tipo === 'alumno') {
      cerrarSesion();
    }
  }
}

export function reiniciarSoloDocentes(modo: 'iniciales' | 'limpiar'): void {
  if (modo === 'iniciales') {
    localStorage.setItem(STORAGE_KEYS.DOCENTES, JSON.stringify(DOCENTES_INICIALES));
  } else {
    localStorage.setItem(STORAGE_KEYS.DOCENTES, JSON.stringify([]));
    // Mantener la sesión de administración disponible para no bloquear al directivo
    const ses = getSesionActiva();
    if (ses && ses.tipo === 'docente') {
      setSesionActiva({
        tipo: 'docente',
        nombre: 'Dirección Académica (Administrador DGETI)'
      });
    }
  }
}

export function reiniciarAlumnosYDocentes(modo: 'iniciales' | 'limpiar'): void {
  reiniciarSoloAlumnos(modo);
  reiniciarSoloDocentes(modo);
}

