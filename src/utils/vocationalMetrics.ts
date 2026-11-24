import {
  DesglosePartesVocacional,
  EvaluacionVocacional,
  LetraOpcionVocacional,
  RespuestaVocacionalDetalle,
  SpecialtyId
} from '../types';
import { TEST_VOCACIONAL_40_PREGUNTAS } from '../data/mockData';

export interface DerivedVocationalMetrics {
  puntajes: Record<SpecialtyId, number>;
  porcentajes: Record<SpecialtyId, number>;
  aptitud: Record<SpecialtyId, number>;
  gusto: Record<SpecialtyId, number>;
  respuestasDetalle: Record<number, RespuestaVocacionalDetalle>;
}

const SPECIALTIES: SpecialtyId[] = ['programacion', 'comercio', 'rrhh', 'cosmetologia'];

const emptyCounts = (): Record<SpecialtyId, number> => ({
  programacion: 0,
  comercio: 0,
  rrhh: 0,
  cosmetologia: 0
});

export function buildEmptyDesglosePartes(): DesglosePartesVocacional {
  return {
    parte1_intereses: emptyCounts(),
    parte2_actividades: emptyCounts(),
    parte3_habilidades: emptyCounts(),
    parte4_metas: emptyCounts()
  };
}

/**
 * Calcula dinámicamente puntajes totales, porcentajes, ejes Aptitud/Gusto
 * y el mapa detallado de respuestas a partir de los datos normalizados (sin redundancia).
 */
export function deriveVocationalMetrics(evaluacion: EvaluacionVocacional): DerivedVocationalMetrics {
  const dp = evaluacion.desglose_partes || buildEmptyDesglosePartes();
  const totalReactivos = evaluacion.total_reactivos || 40;

  const puntajes: Record<SpecialtyId, number> = emptyCounts();
  const porcentajes: Record<SpecialtyId, number> = emptyCounts();
  const aptitud: Record<SpecialtyId, number> = emptyCounts();
  const gusto: Record<SpecialtyId, number> = emptyCounts();

  const toPct20 = (v: number) => Math.min(100, Math.round((v / 20) * 100));

  for (const spec of SPECIALTIES) {
    const p1 = dp.parte1_intereses?.[spec] ?? 0;
    const p2 = dp.parte2_actividades?.[spec] ?? 0;
    const p3 = dp.parte3_habilidades?.[spec] ?? 0;
    const p4 = dp.parte4_metas?.[spec] ?? 0;
    const totalSpec = p1 + p2 + p3 + p4;
    puntajes[spec] = totalSpec;
    porcentajes[spec] = totalReactivos > 0 ? Math.round((totalSpec / totalReactivos) * 100) : 0;
    aptitud[spec] = toPct20(p2 + p3);
    gusto[spec] = toPct20(p1 + p4);
  }

  const respuestasDetalle: Record<number, RespuestaVocacionalDetalle> = {};
  const respuestas = evaluacion.respuestas || {};

  TEST_VOCACIONAL_40_PREGUNTAS.forEach(pregunta => {
    const rawLetra = respuestas[String(pregunta.id)];
    if (!rawLetra) return;
    const opt = pregunta.opciones.find(o => o.letra === rawLetra);
    if (opt) {
      respuestasDetalle[pregunta.id] = {
        opcion: rawLetra,
        especialidad: opt.specialty
      };
    }
  });

  return {
    puntajes,
    porcentajes,
    aptitud,
    gusto,
    respuestasDetalle
  };
}

/**
 * Convierte documentos de Firestore (normalizados o heredados) al formato único normalizado.
 */
export function normalizeEvaluacionFromFirestore(raw: Record<string, unknown>): EvaluacionVocacional {
  const num_control = typeof raw.num_control === 'string' ? raw.num_control : '';
  const ownerUid = typeof raw.ownerUid === 'string' ? raw.ownerUid : undefined;
  const version_test =
    raw.version_test === '8_REACTIVOS_LEGACY' ? '8_REACTIVOS_LEGACY' : '40_REACTIVOS_2026';
  const total_reactivos = typeof raw.total_reactivos === 'number' ? raw.total_reactivos : 40;
  const carrera_sugerida = (
    ['programacion', 'comercio', 'rrhh', 'cosmetologia'].includes(String(raw.carrera_sugerida))
      ? raw.carrera_sugerida
      : 'programacion'
  ) as SpecialtyId;
  const segunda_opcion = ['programacion', 'comercio', 'rrhh', 'cosmetologia'].includes(String(raw.segunda_opcion))
    ? (raw.segunda_opcion as SpecialtyId)
    : undefined;

  let desglose_partes: DesglosePartesVocacional;
  if (raw.desglose_partes && typeof raw.desglose_partes === 'object') {
    const dpRaw = raw.desglose_partes as Partial<DesglosePartesVocacional>;
    desglose_partes = {
      parte1_intereses: { ...emptyCounts(), ...(dpRaw.parte1_intereses || {}) },
      parte2_actividades: { ...emptyCounts(), ...(dpRaw.parte2_actividades || {}) },
      parte3_habilidades: { ...emptyCounts(), ...(dpRaw.parte3_habilidades || {}) },
      parte4_metas: { ...emptyCounts(), ...(dpRaw.parte4_metas || {}) }
    };
  } else {
    // Fallback for legacy documents that only stored score_aptitud_* / score_gusto_*
    desglose_partes = buildEmptyDesglosePartes();
    for (const spec of SPECIALTIES) {
      const aptPct = Number(raw[`score_aptitud_${spec}`] ?? 0);
      const gusPct = Number(raw[`score_gusto_${spec}`] ?? 0);
      const aptPts = Math.round((aptPct / 100) * 20);
      const gusPts = Math.round((gusPct / 100) * 20);
      desglose_partes.parte1_intereses[spec] = Math.floor(gusPts / 2);
      desglose_partes.parte4_metas[spec] = gusPts - Math.floor(gusPts / 2);
      desglose_partes.parte2_actividades[spec] = Math.floor(aptPts / 2);
      desglose_partes.parte3_habilidades[spec] = aptPts - Math.floor(aptPts / 2);
    }
  }

  const respuestas: Record<string, LetraOpcionVocacional> = {};
  if (raw.respuestas && typeof raw.respuestas === 'object') {
    for (const [k, v] of Object.entries(raw.respuestas as Record<string, unknown>)) {
      if (v === 'a' || v === 'b' || v === 'c' || v === 'd') {
        respuestas[String(k)] = v;
      }
    }
  } else if (raw.respuestas_detalle && typeof raw.respuestas_detalle === 'object') {
    for (const [k, v] of Object.entries(raw.respuestas_detalle as Record<string, { opcion?: string }>)) {
      const op = v?.opcion;
      if (op === 'a' || op === 'b' || op === 'c' || op === 'd') {
        respuestas[String(k)] = op;
      }
    }
  }

  const empatadasRaw = Array.isArray(raw.especialidades_empatadas)
    ? raw.especialidades_empatadas.filter((x): x is SpecialtyId =>
        typeof x === 'string' && ['programacion', 'comercio', 'rrhh', 'cosmetologia'].includes(x)
      )
    : [];
  const especialidades_empatadas: SpecialtyId[] =
    empatadasRaw.length > 0 ? empatadasRaw : [carrera_sugerida];

  const analisis_pedagogico =
    typeof raw.analisis_pedagogico === 'string' && raw.analisis_pedagogico.trim()
      ? raw.analisis_pedagogico
      : 'Evaluación vocacional registrada.';
  const fecha_evaluacion =
    typeof raw.fecha_evaluacion === 'string' && raw.fecha_evaluacion.trim()
      ? raw.fecha_evaluacion
      : new Date().toISOString();

  return {
    num_control,
    ...(ownerUid ? { ownerUid } : {}),
    version_test,
    total_reactivos,
    desglose_partes,
    respuestas,
    especialidades_empatadas,
    carrera_sugerida,
    ...(segunda_opcion ? { segunda_opcion } : {}),
    analisis_pedagogico,
    fecha_evaluacion
  };
}

/**
 * Serializa estrictamente el payload normalizado para escribir en Firestore (cero campos redundantes).
 */
export function toNormalizedEvaluacionPayload(evaluacion: EvaluacionVocacional): Record<string, unknown> {
  const cleanRespuestas: Record<string, LetraOpcionVocacional> = {};
  for (const [k, v] of Object.entries(evaluacion.respuestas || {})) {
    if (v === 'a' || v === 'b' || v === 'c' || v === 'd') {
      cleanRespuestas[String(k)] = v;
    }
  }

  return {
    num_control: evaluacion.num_control,
    ...(evaluacion.ownerUid ? { ownerUid: evaluacion.ownerUid } : {}),
    version_test: evaluacion.version_test || '40_REACTIVOS_2026',
    total_reactivos: evaluacion.total_reactivos || 40,
    desglose_partes: evaluacion.desglose_partes || buildEmptyDesglosePartes(),
    respuestas: cleanRespuestas,
    especialidades_empatadas:
      evaluacion.especialidades_empatadas && evaluacion.especialidades_empatadas.length > 0
        ? evaluacion.especialidades_empatadas
        : [evaluacion.carrera_sugerida],
    carrera_sugerida: evaluacion.carrera_sugerida,
    ...(evaluacion.segunda_opcion ? { segunda_opcion: evaluacion.segunda_opcion } : {}),
    analisis_pedagogico: evaluacion.analisis_pedagogico,
    fecha_evaluacion: evaluacion.fecha_evaluacion
  };
}
