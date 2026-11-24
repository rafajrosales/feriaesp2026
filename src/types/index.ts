export type SpecialtyId = 'programacion' | 'comercio' | 'rrhh' | 'cosmetologia';

export const GRUPOS_PRIMER_SEMESTRE = [
  '1°A',
  '1°B',
  '1°C',
  '1°D',
  '1°E',
  '1°F',
  '1°G',
  '1°H'
] as const;

export interface TutorLegal {
  nombre_tutor: string;
  parentesco: 'Padre' | 'Madre' | 'Tutor Legal';
  correo_tutor: string;
  telefono_tutor: string;
  verificado: boolean;
  fecha_verificacion?: string;
  firma_digital?: string; // Base64 data URL or digital signature trace
  token_verificacion?: string;
}

export interface Estudiante {
  num_control: string;
  nombre_completo: string;
  grupo: string;
  turno: 'MATUTINO';
  correo_institucional: string;
  curp: string;
  avatar_url?: string;
  telefono_alumno?: string;
  tutor: TutorLegal;
  ownerUid?: string;
}

export type LetraOpcionVocacional = 'a' | 'b' | 'c' | 'd';
export type ParteVocacionalId = 1 | 2 | 3 | 4;

export interface OpcionVocacional40 {
  letra: LetraOpcionVocacional;
  texto: string;
  specialty: SpecialtyId;
}

export interface PreguntaVocacional40 {
  id: number;
  parte: ParteVocacionalId;
  parte_titulo: string;
  enunciado: string;
  opciones: OpcionVocacional40[];
}

export interface RespuestaVocacionalDetalle {
  opcion: LetraOpcionVocacional;
  especialidad: SpecialtyId;
}

export interface DesglosePartesVocacional {
  parte1_intereses: Record<SpecialtyId, number>;
  parte2_actividades: Record<SpecialtyId, number>;
  parte3_habilidades: Record<SpecialtyId, number>;
  parte4_metas: Record<SpecialtyId, number>;
}

export interface EvaluacionVocacional {
  num_control: string;
  version_test: '40_REACTIVOS_2026' | '8_REACTIVOS_LEGACY';
  total_reactivos: number;
  desglose_partes: DesglosePartesVocacional;
  respuestas: Record<string, LetraOpcionVocacional>;
  especialidades_empatadas: SpecialtyId[];
  carrera_sugerida: SpecialtyId;
  segunda_opcion?: SpecialtyId;
  analisis_pedagogico: string;
  fecha_evaluacion: string;
  ownerUid?: string;
}

export interface QuizRespuesta {
  pregunta_id: number;
  opcion_seleccionada: number;
  es_correcta: boolean;
}

export interface ProgresoEspecialidad {
  video_visto: boolean;
  infografia_explorada: boolean;
  proyectos_revisados: boolean;
  quiz_aprobado: boolean;
  calificacion_quiz: number; // 0 to 100
  puntaje_obtenido?: number;
  puntaje_maximo?: number;
  nivel_perfil?: 'MUCHO' | 'REGULAR' | 'POCO' | 'NADA' | 'ALTO' | 'EN_DESARROLLO' | 'EXPLORATORIO' | 'MUY_ALTO' | 'MEDIO_ALTO' | 'BAJO' | 'OTRA_ESPECIALIDAD';
  respuestas_detalle?: Record<number, number>;
}

export interface ProgresoVirtual {
  num_control: string;
  test_vocacional_completado: boolean;
  progreso_especialidades: {
    programacion: ProgresoEspecialidad;
    comercio: ProgresoEspecialidad;
    rrhh: ProgresoEspecialidad;
    cosmetologia: ProgresoEspecialidad;
  };
  porcentaje_virtual: number; // 0 to 100 (represents 100% platform progress)
  promedio_cuestionarios: number;
  clave_unica_token: string;
  estatus_fase_virtual: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
  fecha_termino?: string;
  ownerUid?: string;
}

export interface SpecialtyInfo {
  id: SpecialtyId;
  nombre: string;
  titulo_corto: string;
  area: string;
  color_acento: string;
  color_badge: string;
  icono: string;
  resumen_ejecutivo: string;
  infografia_url?: string;
  perfil_ingreso: string[];
  perfil_egreso: string[];
  campo_laboral: string[];
  submodulos: {
    semestre: string;
    nombre: string;
    competencia: string;
  }[];
  proyectos_destacados: {
    titulo: string;
    alumnos: string;
    semestre: string;
    descripcion: string;
    impacto: string;
  }[];
  video_demo: {
    titulo: string;
    duracion: string;
    presentador: string;
    descripcion: string;
    url_video?: string;
  };
  video_academia?: VideoAcademiaDocente;
  galeria_alumnos?: ItemGaleriaAlumno[];
  preguntas_quiz: {
    id: number;
    bloque?: string;
    pregunta: string;
    opciones: string[];
    respuesta_correcta: number;
    explicacion: string;
    es_informativa?: boolean;
    aspecto_evaluado?: string;
  }[];
}

export interface VideoAcademiaDocente {
  titulo: string;
  duracion: string;
  presentador: string;
  descripcion: string;
  url_video: string; // YouTube URL or Google Drive Video URL
}

export interface ItemGaleriaAlumno {
  id: string;
  titulo: string;
  alumnos: string;
  semestre: string;
  tipo: 'video' | 'foto';
  url_media: string; // YouTube URL, Google Drive URL, or Image URL
  descripcion: string;
}

export interface ReactivoExamen {
  id?: string | number;
  bloque?: string;
  pregunta: string;
  opciones: string[];
  correcta: string; // 'a' | 'b' | 'c' | 'd' | 'na'
  explicacion?: string;
  es_informativa?: boolean;
  aspecto_evaluado?: string;
}


export interface FichaAcademiaReq {
  especialidad_id: SpecialtyId;
  nombre_especialidad: string;
  presidente_academia: string;
  integrantes_academia: string[];
  fecha_entrega: string;
  resumen_ejecutivo: string;
  recursos_multimedia: {
    video_url_o_estado: string;
    infografia_formato: string;
    proyectos_registrados: string[];
    video_academia?: VideoAcademiaDocente;
    galeria_alumnos?: ItemGaleriaAlumno[];
  };
  banco_reactivos: ReactivoExamen[];
}

export interface OficioCircular {
  id?: string;
  clave_oficio: string;
  asunto: string;
  lugar_fecha: string;
  destinatarios: string;
  cuerpo: string[];
  firmante_cargo: string;
  firmante_nombre: string;
  sello_oficial: string;
}

export interface DocenteAutorizado {
  id: string;
  nombre_completo: string;
  rfc: string;
  correo_institucional: string;
  academia: SpecialtyId | 'general';
  rol: 'Profesor Titular' | 'Jefe de Academia' | 'Tutor Escolar' | 'Subdirector';
  nivel_acceso: 'editor' | 'lector';
  clave_acceso: string;
  estatus_autorizacion: 'AUTORIZADO' | 'PENDIENTE' | 'REVOCADO';
  fecha_alta: string;
  registrado_por?: string;
}

export interface DocenteAcceso {
  email: string;
  docente_id: string;
  nombre_completo: string;
  academia: SpecialtyId | 'general';
  rol: 'Profesor Titular' | 'Jefe de Academia' | 'Tutor Escolar' | 'Subdirector';
  nivel_acceso: 'editor' | 'lector';
  clave_acceso: string;
  estatus_autorizacion: 'AUTORIZADO' | 'PENDIENTE' | 'REVOCADO';
}

export interface AccesoGoogleEvento {
  fecha_iso: string;
  origen: string;
  metodo: 'login_interactivo' | 'sesion_activa';
}

export interface AccesoGoogle {
  uid: string;
  email: string;
  nombre_google: string;
  foto_url?: string;
  es_admin: boolean;
  primer_acceso: string;
  ultimo_acceso: string;
  total_accesos: number;
  ultimo_origen: string;
  historial_reciente: AccesoGoogleEvento[];
}

