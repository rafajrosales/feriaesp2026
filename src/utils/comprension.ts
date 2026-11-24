import { ProgresoEspecialidad } from '../types';

export type NivelComprension = 'MUCHO' | 'REGULAR' | 'POCO' | 'NADA';

export interface ComprensionMeta {
  nivel: NivelComprension;
  label: string;
  labelCorto: string;
  badgeClass: string;
  bannerClass: string;
  dotClass: string;
  tituloFeedback: string;
  mensajeBase: (nombreEspecialidad: string) => string;
  accionRecomendada: 'FELICITAR' | 'REPASAR';
}

export function getNivelComprension(scorePct: number): NivelComprension {
  if (scorePct >= 80) return 'MUCHO';
  if (scorePct >= 50) return 'REGULAR';
  if (scorePct > 0) return 'POCO';
  return 'NADA';
}

export function resolveNivelComprension(
  sp?: Pick<ProgresoEspecialidad, 'nivel_perfil' | 'calificacion_quiz'>
): NivelComprension {
  const raw = sp?.nivel_perfil;
  if (raw === 'MUCHO' || raw === 'ALTO' || raw === 'MUY_ALTO') return 'MUCHO';
  if (raw === 'REGULAR' || raw === 'EN_DESARROLLO' || raw === 'MEDIO_ALTO') return 'REGULAR';
  if (raw === 'POCO' || raw === 'BAJO' || raw === 'OTRA_ESPECIALIDAD') return 'POCO';
  if (raw === 'NADA') return 'NADA';
  if (raw === 'EXPLORATORIO') {
    return (sp?.calificacion_quiz ?? 0) === 0 ? 'NADA' : 'POCO';
  }
  return getNivelComprension(sp?.calificacion_quiz ?? 0);
}

export const COMPRENSION_META: Record<NivelComprension, ComprensionMeta> = {
  MUCHO: {
    nivel: 'MUCHO',
    label: 'Comprendió Mucho',
    labelCorto: 'Mucho',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bannerClass: 'bg-emerald-50 border-emerald-300 text-emerald-950',
    dotClass: 'bg-emerald-600',
    tituloFeedback: '✨ ¡Felicidades por tu comprensión! (Nivel: Mucho)',
    mensajeBase: (nombre) =>
      `¡Excelente trabajo! Comprendiste muy bien de qué trata ${nombre}, su mapa curricular, actividades prácticas y campo laboral.`,
    accionRecomendada: 'FELICITAR'
  },
  REGULAR: {
    nivel: 'REGULAR',
    label: 'Comprensión Regular',
    labelCorto: 'Regular',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    bannerClass: 'bg-sky-50 border-sky-300 text-sky-950',
    dotClass: 'bg-sky-600',
    tituloFeedback: '👍 ¡Bien hecho! Comprensión Regular — Te sugerimos un repaso breve',
    mensajeBase: (nombre) =>
      `¡Felicidades por completar la exploración de ${nombre}! Comprendiste las ideas principales; te sugerimos repasar los puntos donde tuviste duda para conocer la carrera con mayor claridad.`,
    accionRecomendada: 'REPASAR'
  },
  POCO: {
    nivel: 'POCO',
    label: 'Comprendió Poco',
    labelCorto: 'Poco',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    bannerClass: 'bg-amber-50 border-amber-300 text-amber-950',
    dotClass: 'bg-amber-500',
    tituloFeedback: '📖 Comprensión: Poco — Te sugerimos repasar el contenido',
    mensajeBase: (nombre) =>
      `Comprendiste poco sobre los aspectos clave de ${nombre}. Te sugerimos repasar el mapa curricular, el video didáctico y los proyectos destacados, y si deseas puedes volver a responder.`,
    accionRecomendada: 'REPASAR'
  },
  NADA: {
    nivel: 'NADA',
    label: 'No se reflejó comprensión (Nada)',
    labelCorto: 'Nada',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    bannerClass: 'bg-rose-50 border-rose-300 text-rose-950',
    dotClass: 'bg-rose-600',
    tituloFeedback: '🔎 Comprensión: Nada — Te sugerimos explorar de nuevo la especialidad',
    mensajeBase: (nombre) =>
      `Tus respuestas muestran que aún no quedó claro en qué consiste ${nombre}. Te sugerimos revisar con calma la infografía, el video de academia y los proyectos antes de decidir tu carrera.`,
    accionRecomendada: 'REPASAR'
  }
};
