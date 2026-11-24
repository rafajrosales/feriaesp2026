import { SpecialtyInfo, SpecialtyId, Estudiante, FichaAcademiaReq, OficioCircular, ReactivoExamen, PreguntaVocacional40, ParteVocacionalId, LetraOpcionVocacional } from '../types';

export const COSMETOLOGIA_DIAGNOSTICO_REACTIVOS: ReactivoExamen[] = [
  {
    id: 1,
    pregunta: '¿Qué estudia la carrera técnica de Cosmetología en el CETis No. 7?',
    opciones: [
      'Medicina quirúrgica y procedimientos hospitalarios invasivos.',
      'Únicamente peinados y venta de cosméticos por catálogo.',
      'El cuidado estético facial y corporal de la piel sana, asepsia, activos cosméticos y técnicas de relajación y SPA.'
    ],
    correcta: 'c',
    aspecto_evaluado: 'Objetivo y campo de estudio estético (no médico).',
    explicacion: 'La Cosmetología se enfoca en el cuidado estético saludable de la piel mediante protocolos no invasivos, bioseguridad y bienestar integral.'
  },
  {
    id: 2,
    pregunta: '¿Cómo progresa la formación técnica en los 5 módulos profesionales (M1 a M5) de Cosmetología?',
    opciones: [
      'Desde cosmetología básica facial y corporal (M1), activación y masaje relajante (M2), drenaje (M3), lifting y remodelación (M4), hasta diseño de imagen y SPA (M5).',
      'Únicamente enseña programación de aplicaciones móviles durante los seis semestres.',
      'Trata sobre trámites aduanales, pedimentos e importación de mercancías.'
    ],
    correcta: 'a',
    aspecto_evaluado: 'Comprensión de la trayectoria modular M1–M5.',
    explicacion: 'Los módulos M1 a M5 desarrollan gradualmente competencias faciales, corporales, drenantes, reafirmantes e imagen integral en cabina.'
  },
  {
    id: 3,
    pregunta: '¿Qué requisitos de higiene, ética y práctica en cabina implica estudiar Cosmetología?',
    opciones: [
      'Trabajar sin desinfección ni uniforme y recetar medicamentos dermatológicos.',
      'Aplicar protocolos de asepsia y bioseguridad, mantener postura ergonómica, contar con insumos/modelos para prácticas y canalizar padecimientos médicos a un especialista.',
      'Realizar todas las actividades únicamente en cuaderno sin trato con personas.'
    ],
    correcta: 'b',
    aspecto_evaluado: 'Protocolos de higiene, materiales, ética y prácticas en taller.',
    explicacion: 'Las prácticas en cabina exigen estricta asepsia, cuidado ergonómico, insumos y uniforme, respeto al usuario y límites éticos no médicos.'
  },
  {
    id: 4,
    pregunta: '¿Qué técnicas y proyectos destacados se trabajan en Cosmetología en el CETis No. 7?',
    opciones: [
      'Cálculo de nóminas quincenales y contratos de la Ley Federal del Trabajo.',
      'Drenaje linfático manual, análisis de biotipos cutáneos y formulación dermocosmética botánica.',
      'Cubicaje de contenedores marítimos de 40 pies High Cube.'
    ],
    correcta: 'b',
    aspecto_evaluado: 'Técnicas especializadas y proyectos destacados de la academia.',
    explicacion: 'En módulos III a V destacan el drenaje linfático manual, la identificación de biotipos cutáneos y proyectos de formulación botánica.'
  },
  {
    id: 5,
    pregunta: '¿Cuál es un campo de inserción laboral directo para los egresados técnicos de Cosmetología?',
    opciones: [
      'SPAs, cabinas estéticas, clínicas dermatológicas de apoyo no médico, laboratorios cosméticos y autoempleo profesional.',
      'Departamentos de ciberseguridad y desarrollo backend.',
      'Agencias aduanales marítimas y fronterizas exclusivamente.'
    ],
    correcta: 'a',
    aspecto_evaluado: 'Campo de inserción laboral y productiva.',
    explicacion: 'Los egresados pueden desempeñarse en SPAs de gran turismo, centros de bienestar, clínicas estéticas, laboratorios o cabina propia.'
  }
];

export const RRHH_DIAGNOSTICO_REACTIVOS: ReactivoExamen[] = [
  {
    id: 1,
    pregunta: '¿Cuál es el objetivo principal de la carrera técnica en Administración de Recursos Humanos en el CETis No. 7?',
    opciones: [
      'Atracción, selección, contratación, capacitación, nómina y bienestar del talento humano con apego a la Ley Federal del Trabajo y la NOM-035-STPS.',
      'Únicamente armar y reparar computadoras de escritorio.',
      'Clasificar aranceles de mercancías en aduanas portuarias.'
    ],
    correcta: 'a',
    aspecto_evaluado: 'Objetivo y marco normativo de la especialidad.',
    explicacion: 'La carrera prepara técnicos para gestionar el ciclo integral del talento humano conforme a la LFT y la NOM-035-STPS.'
  },
  {
    id: 2,
    pregunta: '¿Qué herramientas de integración y desarrollo del talento se aprenden en los primeros módulos?',
    opciones: [
      'Cubicaje volumétrico de embarques internacionales.',
      'Reclutamiento, filtrado curricular, entrevistas por competencias (STAR) y Diagnóstico de Necesidades de Capacitación (DNC).',
      'Tratamientos faciales con aparatología estética.'
    ],
    correcta: 'b',
    aspecto_evaluado: 'Reclutamiento, entrevistas STAR y capacitación.',
    explicacion: 'En los Módulos I y II se aplican técnicas de reclutamiento, entrevistas estructuradas STAR y planes de capacitación.'
  },
  {
    id: 3,
    pregunta: '¿Qué competencias técnico-administrativas se desarrollan en el Módulo III (Nóminas y prestaciones de ley)?',
    opciones: [
      'Programación orientada a objetos y desarrollo móvil en la nube.',
      'Maquillaje social y diseño de imagen en SPA.',
      'Cálculo de percepciones, deducciones, ISR retenido, cuotas de IMSS/INFONAVIT y finiquitos laborales.'
    ],
    correcta: 'c',
    aspecto_evaluado: 'Dominio administrativo de nóminas y prestaciones.',
    explicacion: 'El Módulo III capacita al alumno en el cálculo preciso de nóminas, impuestos laborales, seguridad social y finiquitos.'
  },
  {
    id: 4,
    pregunta: '¿Qué propósito tiene el proyecto destacado "Diagnóstico de Clima Laboral y Bienestar Escolar NOM-035"?',
    opciones: [
      'Identificar factores de riesgo psicosocial y proponer acciones de bienestar organizacional y pausas activas.',
      'Diseñar circuitos electrónicos de alumbrado público.',
      'Evaluar el pH de cremas hidratantes en laboratorio.'
    ],
    correcta: 'a',
    aspecto_evaluado: 'Clima organizacional y aplicación práctica de la NOM-035.',
    explicacion: 'En el Módulo IV se aplican encuestas diagnósticas bajo la NOM-035-STPS para mejorar el ambiente y la salud organizacional.'
  },
  {
    id: 5,
    pregunta: '¿Cuál es un campo de inserción laboral directo para el técnico en Administración de Recursos Humanos?',
    opciones: [
      'Exclusivamente cabinas cosmetológicas y clínicas estéticas.',
      'Departamentos de Capital Humano en empresas, agencias de reclutamiento y áreas de personal en instituciones públicas.',
      'Talleres mecánicos y muelles portuarios únicamente.'
    ],
    correcta: 'b',
    aspecto_evaluado: 'Campo laboral y desarrollo profesional.',
    explicacion: 'Los egresados laboran en áreas de recursos humanos, consultorías de reclutamiento, nóminas, capacitación y desarrollo organizacional.'
  }
];

export const ESPECIALIDADES: SpecialtyInfo[] = [
  {
    id: 'programacion',
    nombre: 'Técnico en Programación',
    titulo_corto: 'Programación',
    area: 'Tecnologías de la Información y Comunicación',
    color_acento: '#1d4ed8',
    color_badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icono: 'Code2',
    resumen_ejecutivo: 'Forma técnicos con capacidades analíticas sólidas para diseñar, codificar, depurar, implementar y administrar sistemas informáticos, soluciones web de alto impacto, bases de datos relacionales y aplicaciones móviles para el sector productivo.',
    perfil_ingreso: [
      'Razonamiento lógico-matemático y abstracción.',
      'Atracción por la resolución de acertijos y algoritmos.',
      'Interés en el funcionamiento interno del software y la web.'
    ],
    perfil_egreso: [
      'Desarrollo de software en múltiples lenguajes (Python, JavaScript, Java, C#).',
      'Construcción y modelado de bases de datos relacionales y no relacionales.',
      'Despliegue de aplicaciones web frontend/backend y móviles seguras.'
    ],
    campo_laboral: [
      'Empresas de desarrollo de software y startups tecnológicas.',
      'Departamentos de sistemas e infraestructura TI en el sector público y privado.',
      'Consultor independiente o freelance en desarrollo web y automatización.'
    ],
    submodulos: [
      { semestre: '2° Semestre', nombre: 'Módulo I: Desarrollo de software estructurado', competencia: 'Aplica algoritmos estructurados y conceptos de programación modular.' },
      { semestre: '3° Semestre', nombre: 'Módulo II: Programación orientada a objetos', competencia: 'Diseña interfaces visuales y modelado POO con persistencia de datos.' },
      { semestre: '4° Semestre', nombre: 'Módulo III: Soluciones web dinámicas', competencia: 'Implementa servicios web, APIs y clientes interactivos.' },
      { semestre: '5° Semestre', nombre: 'Módulo IV: Bases de datos y seguridad', competencia: 'Administra motores SQL, integridad transaccional y ciberseguridad básica.' },
      { semestre: '6° Semestre', nombre: 'Módulo V: Aplicaciones móviles multiplataforma', competencia: 'Desarrolla e implementa apps para Android/iOS con arquitectura en la nube.' }
    ],
    proyectos_destacados: [
      {
        titulo: 'Sistema Escolar Web "LerdoConecta"',
        alumnos: 'Alumnos de 5° Semestre - Grupo 5°A Programación',
        semestre: '5° Semestre',
        descripcion: 'Plataforma web para gestión de calificaciones, reportes tutoriales y asesorías entre pares estudiantiles del CETis 7.',
        impacto: 'Redujo el tiempo de entrega de boletas internas de 5 días a 10 minutos.'
      },
      {
        titulo: 'App Móvil SOS Comunitaria Cuautepec',
        alumnos: 'Equipo Innovatec - 6° Semestre',
        semestre: '6° Semestre',
        descripcion: 'Aplicación para teléfonos móviles con geolocalización para alertar sobre incidentes viales y luminarias en la zona alta de GAM.',
        impacto: 'Reconocimiento en el Concurso de Prototipos DGETI CDMX 2025.'
      },
      {
        titulo: 'Simulador de Encriptación y Ciberdefensa',
        alumnos: 'Academia de TIC - Alumnos de 4° Semestre',
        semestre: '4° Semestre',
        descripcion: 'Herramienta interactiva para enseñar a alumnos de nuevo ingreso los riesgos de contraseñas débiles y técnicas de hashing seguro.',
        impacto: 'Utilizado en talleres de inducción para 850 alumnos.'
      }
    ],
    video_demo: {
      titulo: 'Descubre el Código que Transforma al CETis 7',
      duracion: '2:45 min',
      presentador: 'Ing. Marco Antonio Estrada (Docente Titular de Programación)',
      descripcion: 'Recorrido por el Laboratorio de Cómputo 3, demostración de arquitectura de software y testimonios de egresados que hoy laboran en empresas tecnológicas.',
      url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    video_academia: {
      titulo: 'Video Oficial de la Academia de Programación CETis 7',
      duracion: '4:15 min',
      presentador: 'Ing. Marco Antonio Estrada Ruiz y Colegiado de Docentes',
      descripcion: 'Los profesores de la academia explican el modelo de proyectos integradores, la ruta de aprendizaje en desarrollo Web y Móvil, y los requerimientos para el campo laboral.',
      url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    galeria_alumnos: [
      {
        id: 'prog-gal-1',
        titulo: 'Sistema Escolar Web LerdoConecta',
        alumnos: 'Sofía Martínez y Carlos Ruiz',
        semestre: '5° Semestre',
        tipo: 'video',
        url_media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        descripcion: 'Demostración en vivo del sistema de calificaciones con Firebase Firestore y panel reactivo.'
      },
      {
        id: 'prog-gal-2',
        titulo: 'App Móvil SOS Comunitaria Cuautepec',
        alumnos: 'Equipo Innovatec 6°A',
        semestre: '6° Semestre',
        tipo: 'foto',
        url_media: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        descripcion: 'Alumnos exponiendo el prototipo galardonado en el Concurso DGETI 2025.'
      },
      {
        id: 'prog-gal-3',
        titulo: 'Laboratorio de Algoritmos e Inteligencia Artificial',
        alumnos: 'Comunidad de Alumnos de 4° Semestre',
        semestre: '4° Semestre',
        tipo: 'foto',
        url_media: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
        descripcion: 'Sesión práctica de desarrollo en el Laboratorio de Cómputo 3.'
      },
      {
        id: 'prog-drive-1',
        titulo: 'Prácticas en Laboratorio de Programación 1',
        alumnos: 'Academia de Programación CETis 7',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1kE_IbOtVPREi6NXTyE7NJD8NrzT8hMPh/view',
        descripcion: 'Fotografía de prácticas de laboratorio y desarrollo de proyectos de alumnos de Programación.'
      },
      {
        id: 'prog-drive-2',
        titulo: 'Prácticas en Laboratorio de Programación 2',
        alumnos: 'Academia de Programación CETis 7',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1XTglEpzKabT8ETx3wCLOInOgmwBvDX93/view',
        descripcion: 'Fotografía de prácticas de laboratorio y desarrollo de proyectos de alumnos de Programación.'
      },
      {
        id: 'prog-drive-3',
        titulo: 'Actividad de Desarrollo de Software 3',
        alumnos: 'Academia de Programación CETis 7',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1Lvp53a7JsJ4tNCxjSqmRxH3FgWYt2oB8/view',
        descripcion: 'Evidencia fotográfica del trabajo en equipo y codificación en la especialidad de Programación.'
      },
      {
        id: 'prog-drive-4',
        titulo: 'Actividad de Desarrollo de Software 4',
        alumnos: 'Academia de Programación CETis 7',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1bn-oYfl8_LhA-9fPABgCB49RTZ9fNR3j/view',
        descripcion: 'Evidencia fotográfica del trabajo en equipo y codificación en la especialidad de Programación.'
      },
      {
        id: 'prog-drive-5',
        titulo: 'Actividad de Desarrollo de Software 5',
        alumnos: 'Academia de Programación CETis 7',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1MNQ2FkRc1zPsY4Z0-5NVNBSq5hNm0fOY/view',
        descripcion: 'Evidencia fotográfica del trabajo en equipo y codificación en la especialidad de Programación.'
      },
      {
        id: 'prog-drive-6',
        titulo: 'Exposición de Proyectos de Programación 6',
        alumnos: 'Academia de Programación CETis 7',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1x807lzHR4UJUFCjwaPWvjObD7kWXU05R/view',
        descripcion: 'Muestra estudiantil de sistemas y aplicaciones desarrolladas en la carrera de Programación.'
      }
    ],
    preguntas_quiz: [
      {
        id: 1,
        pregunta: '¿Cuál es el objetivo principal de la especialidad de Programación en el CETis No. 7?',
        opciones: [
          'Únicamente armar y reparar computadoras físicamente.',
          'Diseñar, programar, implementar y mantener sistemas de software y aplicaciones web/móviles.',
          'Gestionar trámites de nóminas y contratos colectivos.'
        ],
        respuesta_correcta: 1,
        explicacion: 'Programación se enfoca en el desarrollo de software, modelado algorítmico y aplicaciones web/móviles integrales.'
      },
      {
        id: 2,
        pregunta: '¿En qué semestre se imparte el Módulo de desarrollo de aplicaciones para móviles en el mapa curricular DGETI?',
        opciones: ['1° Semestre', '3° Semestre', '6° Semestre'],
        respuesta_correcta: 2,
        explicacion: 'El Módulo V se cursa en 6° semestre y consolida las competencias de desarrollo móvil y computación en la nube.'
      },
      {
        id: 3,
        pregunta: '¿Qué destreza principal desarrolla un alumno en esta carrera?',
        opciones: [
          'Razonamiento lógico, análisis de algoritmos y solución estructurada de problemas.',
          'Clasificación arancelaria y despacho aduanero.',
          'Elaboración de cremas hidratantes y cosméticos botánicos.'
        ],
        respuesta_correcta: 0,
        explicacion: 'El perfil de egreso destaca el pensamiento algorítmico, lógica matemática y modularidad.'
      },
      {
        id: 4,
        pregunta: '¿Cuál es uno de los proyectos destacados presentados por la Academia de Programación?',
        opciones: [
          'Póliza de importación de granos a Centroamérica.',
          'Sistema Escolar Web "LerdoConecta" para gestión de calificaciones y tutorías.',
          'Protocolo de drenaje linfático de cabina.'
        ],
        respuesta_correcta: 1,
        explicacion: 'LerdoConecta fue desarrollado por alumnos de 5° semestre para agilizar la entrega de reportes del plantel.'
      },
      {
        id: 5,
        pregunta: '¿Cuál es un campo laboral directo para el egresado técnico de esta especialidad?',
        opciones: [
          'Empresas de desarrollo tecnológico, áreas de sistemas y soporte de software.',
          'Aduanas fronterizas de Manzanillo y Veracruz.',
          'Spas y clínicas dermatológicas exclusivamente.'
        ],
        respuesta_correcta: 0,
        explicacion: 'Los egresados se integran con éxito en industrias de software, departamentos de TI y consultorías digitales.'
      }
    ]
  },
  {
    id: 'comercio',
    nombre: 'Bachillerato Tecnológico en Comercio Internacional y Aduanas',
    titulo_corto: 'Comercio Int. y Aduanas',
    area: 'Ciencias Económico-Administrativas y Logística Global',
    color_acento: '#047857',
    color_badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icono: 'Globe2',
    resumen_ejecutivo: 'Bachillerato Tecnológico en Comercio Internacional y Aduanas. Transmite competencias profesionales para la gestión de importaciones y exportaciones, estimación de costos y planes de exportación, clasificación arancelaria, procesos aduaneros, empleabilidad y economía ecológica con desarrollo sostenible.',
    infografia_url: '/assets/aistudio/image_ed736886.png',
    perfil_ingreso: [
      'Gusto por la geografía económica, monedas y logística internacional.',
      'Habilidad negociadora y capacidad organizativa en flujos de suministros.',
      'Curiosidad por tratados comerciales y regulaciones aduaneras.'
    ],
    perfil_egreso: [
      'Gestión de importaciones y exportaciones.',
      'Estimación de costos y planes de exportación.',
      'Clasificación arancelaria y procesos aduaneros.',
      'Desarrollo de empleabilidad, liderazgo y trabajo en equipo.',
      'Aplicación de economía ecológica y desarrollo sostenible.'
    ],
    campo_laboral: [
      'Auxiliar de aduanas.',
      'Auxiliar de comercio exterior.',
      'Auxiliar de logística internacional.',
      'Auxiliar de tráfico o embarques.',
      'Auxiliar de clasificación arancelaria.'
    ],
    submodulos: [
      { semestre: '2° Semestre', nombre: 'Módulo I: Fundamentos del comercio exterior y aduanas', competencia: 'Identifica la estructura del sistema aduanero mexicano y procesos aduaneros.' },
      { semestre: '3° Semestre', nombre: 'Módulo II: Clasificación arancelaria y tratados', competencia: 'Aplica la clasificación arancelaria y tarifa de impuestos de importación y exportación (TIGIE).' },
      { semestre: '4° Semestre', nombre: 'Módulo III: Logística y transporte multimodal', competencia: 'Coordina operaciones de tráfico o embarques y logística internacional con Incoterms.' },
      { semestre: '5° Semestre', nombre: 'Módulo IV: Despacho aduanal y pedimento digital', competencia: 'Ejecuta gestión de importaciones y exportaciones y valida procesos aduaneros ante SAT/ANAM.' },
      { semestre: '6° Semestre', nombre: 'Módulo V: Plan de negocios y proyectos de exportación', competencia: 'Realiza estimación de costos, planes de exportación y economía ecológica con desarrollo sostenible.' }
    ],
    proyectos_destacados: [
      {
        titulo: 'Ruta de Exportación: Miel de Agave a la Unión Europea',
        alumnos: 'Alumnos de 5° Semestre - Grupo 5°B Comercio',
        semestre: '5° Semestre',
        descripcion: 'Proyecto integral de trazabilidad logística marítima (Veracruz - Rotterdam) con cálculo de flete, aranceles cero por TLCUEM y embalaje térmico.',
        impacto: 'Primer Lugar en la Muestra Emprendedora DGETI Zona Norte CDMX.'
      },
      {
        titulo: 'Simulador Digital de Cubicaje de Contenedores (40ft High Cube)',
        alumnos: 'Equipo Logistix CETis 7',
        semestre: '6° Semestre',
        descripcion: 'Herramienta de cálculo para optimizar el espacio físico de cajas palletizadas evitando mermas y sobrecostos por peso vehicular.',
        impacto: 'Ahorro proyectado de 18% en costos logísticos simulados.'
      },
      {
        titulo: 'Manual de Cumplimiento Arancelario para PYMES Artesanales',
        alumnos: 'Academia de Comercio Internacional y Aduanas',
        semestre: '4° Semestre',
        descripcion: 'Guía paso a paso para artesanos del Valle de México sobre cómo exportar a Estados Unidos bajo facilidades del T-MEC.',
        impacto: 'Distribuido a 45 talleres cooperativos locales.'
      }
    ],
    video_demo: {
      titulo: 'Comercio Internacional y Aduanas · Video Oficial DGETI',
      duracion: '0:45 min',
      presentador: 'Lic. Claudia Becerril (Presidenta de Academia de Comercio Internacional y Aduanas)',
      descripcion: 'Domina las reglas que rigen el comercio mundial: gestión de importaciones y exportaciones, logística internacional y doble ventaja DGETI (certificado de bachillerato y título técnico).',
      url_video: '/assets/aistudio/Comercio_internacional_y_aduanas_video_principal_979d88d2.mp4'
    },
    video_academia: {
      titulo: 'Video Principal: Comercio Internacional y Aduanas',
      duracion: '0:45 min',
      presentador: 'DGETI · Academia de Comercio Internacional y Aduanas CETis 7',
      descripcion: 'Cada producto que usas y cada mercancía que llega necesita un estratega. Conoce la carrera técnica en Comercio Internacional y Aduanas y sus oportunidades laborales y universitarias.',
      url_video: '/assets/aistudio/Comercio_internacional_y_aduanas_video_principal_979d88d2.mp4'
    },
    galeria_alumnos: [
      {
        id: 'com-infografia-oficial',
        titulo: 'Infografía Oficial: Perfil de Egreso y Puestos de Trabajo',
        alumnos: 'Academia de Comercio Internacional y Aduanas',
        semestre: 'Material Oficial',
        tipo: 'foto',
        url_media: '/assets/aistudio/image_ed736886.png',
        descripcion: 'Infografía institucional con las competencias laborales principales, formación integral y principales puestos de trabajo de Comercio Internacional y Aduanas.'
      },
      {
        id: 'com-gal-1',
        titulo: 'Simulador Digital de Cubicaje de Contenedores 40ft',
        alumnos: 'Equipo Logistix 6°A',
        semestre: '6° Semestre',
        tipo: 'video',
        url_media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        descripcion: 'Video demostrativo de estiba y optimización de espacio volumétrico en transporte marítimo.'
      },
      {
        id: 'com-gal-2',
        titulo: 'Maqueta de Garita Aduanal y Puerto de Veracruz',
        alumnos: 'Alumnos de 3° Semestre',
        semestre: '3° Semestre',
        tipo: 'foto',
        url_media: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
        descripcion: 'Representación física a escala del proceso de desaduanamiento y semáforo fiscal.'
      },
      {
        id: 'com-gal-3',
        titulo: 'Ruta de Exportación de Miel de Agave a la UE',
        alumnos: 'Grupo 5°B Comercio',
        semestre: '5° Semestre',
        tipo: 'foto',
        url_media: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
        descripcion: 'Exposición de la carpeta técnica con Incoterms y certificado de origen bajo TLCUEM.'
      }
    ],
    preguntas_quiz: [
      {
        id: 1,
        pregunta: '¿Qué documento oficial legaliza el tránsito y nacionalización de mercancías en las aduanas mexicanas?',
        opciones: ['El Pedimento Aduanal', 'La Credencial Escolar', 'El Comprobante de Domicilio'],
        respuesta_correcta: 0,
        explicacion: 'El pedimento aduanal avala el cumplimiento de contribuciones y regulaciones no arancelarias ante la ANAM/SAT.'
      },
      {
        id: 2,
        pregunta: '¿Para qué se utilizan los términos internacionales de comercio conocidos como Incoterms?',
        opciones: [
          'Para calcular el promedio escolar de los alumnos.',
          'Para definir los derechos, costos y riesgos de entrega entre comprador y vendedor a nivel mundial.',
          'Para programar código de páginas web.'
        ],
        respuesta_correcta: 1,
        explicacion: 'Los Incoterms establecen con precisión quién paga transporte, seguro y asume riesgos en la cadena logística.'
      },
      {
        id: 3,
        pregunta: '¿En qué consiste el cubicaje en la logística de comercio exterior?',
        opciones: [
          'Optimizar el volumen y acomodo de mercancías dentro de un contenedor o transporte para reducir costos.',
          'Contar el número de horas trabajadas por los empleados.',
          'Aplicar mascarillas faciales.'
        ],
        respuesta_correcta: 0,
        explicacion: 'El cubicaje maximiza el aprovechamiento volumétrico y de peso de los contenedores (20ft, 40ft).'
      },
      {
        id: 4,
        pregunta: '¿Cuál es uno de los principales tratados comerciales que estudia la especialidad en México?',
        opciones: ['Tratado de Tordesillas', 'T-MEC (México, Estados Unidos y Canadá)', 'Pacto de Varsovia'],
        respuesta_correcta: 1,
        explicacion: 'El T-MEC es el pilar de exportaciones e importaciones de manufactura y servicios de nuestro país.'
      },
      {
        id: 5,
        pregunta: '¿Cuáles son algunos de los principales puestos de trabajo para el egresado de Comercio Internacional y Aduanas?',
        opciones: [
          'Auxiliar de aduanas, de comercio exterior, logística internacional, tráfico o clasificación arancelaria.',
          'Únicamente en salones de belleza.',
          'Instalando cableado eléctrico en hogares.'
        ],
        respuesta_correcta: 0,
        explicacion: 'El perfil de egreso prepara al estudiante como auxiliar de aduanas, comercio exterior, logística internacional, tráfico o embarques y clasificación arancelaria.'
      }
    ]
  },
  {
    id: 'rrhh',
    nombre: 'Técnico en Administración de Recursos Humanos',
    titulo_corto: 'Recursos Humanos',
    area: 'Gestión Organizacional, Capital Humano y Normatividad Laboral',
    color_acento: '#7c3aed',
    color_badge: 'bg-purple-50 text-purple-700 border-purple-200',
    icono: 'Users2',
    resumen_ejecutivo: 'Capacita al alumno en la atracción, selección, contratación, capacitación, evaluación y bienestar del talento humano en organizaciones productivas, con estricto apego a la Ley Federal del Trabajo y la NOM-035-STPS.',
    perfil_ingreso: [
      'Empatía, facilidad de comunicación asertiva y liderazgo colaborativo.',
      'Interés en la psicología del trabajo, dinámicas de equipo y resolución de conflictos.',
      'Responsabilidad ética en el manejo de expedientes confidenciales.'
    ],
    perfil_egreso: [
      'Publicación de vacantes, filtrado curricular y aplicación de entrevistas por competencias.',
      'Elaboración de nóminas quincenales, cálculo de finiquitos, IMSS e INFONAVIT.',
      'Diseño de planes de capacitación y evaluación del clima organizacional (NOM-035).'
    ],
    campo_laboral: [
      'Departamentos de Capital Humano en empresas comerciales, de servicios e industriales.',
      'Agencias de reclutamiento y consultorías de headhunting.',
      'Instituciones públicas en áreas de personal, capacitación y desarrollo organizacional.'
    ],
    submodulos: [
      { semestre: '2° Semestre', nombre: 'Módulo I: Integración del personal a la organización', competencia: 'Aplica técnicas de reclutamiento, selección y contratos de trabajo.' },
      { semestre: '3° Semestre', nombre: 'Módulo II: Capacitación y desarrollo del talento humano', competencia: 'Elabora diagnósticos de necesidades de capacitación (DNC) y manuales.' },
      { semestre: '4° Semestre', nombre: 'Módulo III: Nóminas y prestaciones de ley', competencia: 'Calcula percepciones, deducciones, ISR retenido, cuotas obrero-patronales y finiquitos.' },
      { semestre: '5° Semestre', nombre: 'Módulo IV: Clima organizacional y normatividad laboral', competencia: 'Aplica encuestas de factores psicosociales bajo la NOM-035-STPS.' },
      { semestre: '6° Semestre', nombre: 'Módulo V: Auditoría y gestión estratégica del talento', competencia: 'Evalúa la productividad laboral y la retención del talento clave.' }
    ],
    proyectos_destacados: [
      {
        titulo: 'Diagnóstico de Clima Laboral y Bienestar Escolar NOM-035',
        alumnos: 'Alumnos de 5° Semestre - Grupo 5°D RRHH',
        semestre: '5° Semestre',
        descripcion: 'Implementación de encuestas analíticas para identificar factores de estrés académico y propuestas de pausas activas para el plantel.',
        impacto: 'Adoptado por el Departamento de Orientación Educativa del CETis 7.'
      },
      {
        titulo: 'Simulador Digital de Entrevistas STAR con Inteligencia de Datos',
        alumnos: 'Equipo Capital Humano Lerdo',
        semestre: '6° Semestre',
        descripcion: 'Guía interactiva que entrena a estudiantes en cómo responder y conducir entrevistas por competencias laborales reales.',
        impacto: 'Más de 300 alumnos de 6° semestre entrenados para su ingreso laboral.'
      },
      {
        titulo: 'Manual de Inducción Digital "Orgullo Lerdo"',
        alumnos: 'Academia de Recursos Humanos',
        semestre: '3° Semestre',
        descripcion: 'Material audiovisual y gráfico para la bienvenida formal y capacitación de nuevos integrantes de la comunidad técnica.',
        impacto: 'Reconocido por la Dirección del Plantel como material institucional.'
      }
    ],
    video_demo: {
      titulo: 'El Corazón de Toda Empresa: El Talento Humano',
      duracion: '2:50 min',
      presentador: 'Mtra. Patricia Mendoza (Docente de Recursos Humanos)',
      descripcion: 'Recorrido por las dinámicas de entrevista, resolución de dilemas éticos y cálculo de nómina en laboratorios administrativos.',
      url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    video_academia: {
      titulo: 'Video Oficial de la Academia de Recursos Humanos',
      duracion: '3:15 min',
      presentador: 'Mtra. Patricia Mendoza Garduño y Docentes Tutores',
      descripcion: 'Explicación del rol estratégico del capital humano, aplicación de la NOM-035-STPS y talleres de entrevistas por competencias laborales.',
      url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    galeria_alumnos: [
      {
        id: 'rrhh-gal-1',
        titulo: 'Roleplay de Entrevistas Estructuradas por Competencias',
        alumnos: 'Alumnos de 4° Semestre',
        semestre: '4° Semestre',
        tipo: 'video',
        url_media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        descripcion: 'Simulación interactiva de reclutamiento y selección de personal con retroalimentación en vivo.'
      },
      {
        id: 'rrhh-gal-2',
        titulo: 'Jornada de Diagnóstico de Clima Laboral NOM-035',
        alumnos: 'Grupo 5°D RRHH',
        semestre: '5° Semestre',
        tipo: 'foto',
        url_media: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        descripcion: 'Aplicación de cuestionarios de bienestar organizacional y pausas activas para la comunidad.'
      },
      {
        id: 'rrhh-gal-3',
        titulo: 'Taller Practico de Nóminas y Contratos LFT',
        alumnos: 'Alumnos de 6° Semestre',
        semestre: '6° Semestre',
        tipo: 'foto',
        url_media: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
        descripcion: 'Cálculo de finiquitos y elaboración de contratos individuales de trabajo.'
      },
      {
        id: 'rrhh-drive-1',
        titulo: 'Galería Recursos Humanos 1',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1z1J_aJjy2Q-T_45u8diRfxJ2FjV76K-s/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-2',
        titulo: 'Galería Recursos Humanos 2',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1gXIDhbqHZF4sUiMBqqGGqLZGA75bXcCM/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-3',
        titulo: 'Galería Recursos Humanos 3',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1SFHJ40OSkVZ74LUJqcDkB2E11nX7UMAC/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-4',
        titulo: 'Galería Recursos Humanos 4',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/179DDIy40OcR_hkXvmlMxiGydn1V0NpYx/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-5',
        titulo: 'Galería Recursos Humanos 5',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/11TDlo7eCej-l_zLDpdIKF4X8S78Zips5/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-6',
        titulo: 'Galería Recursos Humanos 6',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/10Q259Ru8A2Bs5VEdpd9rcVMULM6WfjEk/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-7',
        titulo: 'Galería Recursos Humanos 7',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1pw5POoViC6fBeAAUzu1KI6n8YMXXjOQQ/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-8',
        titulo: 'Galería Recursos Humanos 8',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1XgCf4NtjSegIhgVVb_muuRSK7c5rXZid/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-9',
        titulo: 'Galería Recursos Humanos 9',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1FYeCnE67aYON3B5tHurZk-0k4JCocWmG/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-10',
        titulo: 'Galería Recursos Humanos 10',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1ta8qYsEK4XymD3RN1j-uMChpphfMQt_q/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-11',
        titulo: 'Galería Recursos Humanos 11',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1XM14-DMZIwI2y3F7Zw-im-wWSdxhSIhM/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-12',
        titulo: 'Galería Recursos Humanos 12',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1BN2fwadPlO41zECa_swTQM0gpYDZYAtz/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      },
      {
        id: 'rrhh-drive-13',
        titulo: 'Galería Recursos Humanos 13',
        alumnos: 'Academia de Recursos Humanos',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1RyHLrFkcBoU5eqfqzxP5agv_gHdDBWRs/view',
        descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
      }
    ],
    preguntas_quiz: RRHH_DIAGNOSTICO_REACTIVOS.map((r, idx) => ({
      id: typeof r.id === 'number' ? r.id : idx + 1,
      bloque: r.bloque,
      pregunta: r.pregunta,
      opciones: r.opciones,
      respuesta_correcta: ({ a: 0, b: 1, c: 2, d: 3 }[r.correcta] ?? 0),
      explicacion: r.explicacion || '',
      es_informativa: false,
      aspecto_evaluado: r.aspecto_evaluado
    }))
  },
  {
    id: 'cosmetologia',
    nombre: 'Técnico en Cosmetología',
    titulo_corto: 'Cosmetología',
    area: 'Ciencias de la Salud, Dermocosmiatría y Bienestar Integral',
    color_acento: '#be185d',
    color_badge: 'bg-pink-50 text-pink-700 border-pink-200',
    icono: 'Sparkles',
    resumen_ejecutivo: 'La Cosmetología se encarga de los cuidados estéticos del rostro y cuerpo, asepsia, rejuvenecimiento y embellecimiento saludable de la piel, conocimiento de activos cosméticos y técnicas de relajación que generan bienestar integral.',
    infografia_url: '/assets/aistudio/infografia_cosmetologia_cetis7.jpg',
    perfil_ingreso: [
      'Interés por las ciencias biológicas, dermatología preventiva y cuidado de la salud.',
      'Destreza manual fina, pulcritud, higiene y sensibilidad estética.',
      'Vocación de servicio al cliente y empatía con el bienestar de las personas.'
    ],
    perfil_egreso: [
      'Identificación precisa de biotipos cutáneos y aplicación de procesos de cosmetología básica facial y corporal.',
      'Aplicación de técnicas de activación facial profunda (antienvejecimiento y despigmentantes) y masaje relajante corporal.',
      'Ejecución de técnicas drenantes faciales (acné y piel sensible) y corporales (celulitis, estrías, depilación y epilación).',
      'Manipulación facial reafirmante (lifting), tratamientos corporales remodelantes y diseño de imagen y servicios de SPA.'
    ],
    campo_laboral: [
      "SPA's de gran turismo y de ciudad, centros de bienestar y cabinas estéticas.",
      'Clínicas dermatológicas, de cirugía estética y empresas de aparatología estética.',
      'Laboratorios de cosmética profesional y aplicaciones digitales de bienestar y belleza.',
      'Eventos sociales, servicios a domicilio y autoempleo.'
    ],
    submodulos: [
      { semestre: '2° Semestre', nombre: 'Módulo I: Realiza procesos de Cosmetología básica', competencia: 'M1S1 Limpia el rostro (faciales hidratantes y oxigenantes) · M1S2 Limpia el cuerpo (hidratación y maniobras básicas de masaje).' },
      { semestre: '3° Semestre', nombre: 'Módulo II: Aplica técnicas de activación facial y relajación corporal', competencia: 'M2S1 Faciales de activación profunda (antienvejecimiento y despigmentantes) · M2S2 Masaje relajante y tratamientos relajantes.' },
      { semestre: '4° Semestre', nombre: 'Módulo III: Aplica técnica y proceso drenante facial y corporal', competencia: 'M3S1 Drenante facial (acné y piel sensible) · M3S2 Drenante corporal (celulitis, estrías, piernas cansadas, depilación y epilación).' },
      { semestre: '5° Semestre', nombre: 'Módulo IV: Manipula el rostro y cuerpo con fines estéticos', competencia: 'M4S1 Manipula el rostro con fines reafirmantes (lifting) · M4S2 Tratamientos corporales remodelantes, reafirmantes y postoperatorios.' },
      { semestre: '6° Semestre', nombre: 'Módulo V: Implementa el diseño de imagen y servicios de SPA', competencia: 'M5S1 Maquillaje y diseño de imagen · M5S2 Técnicas de SPA y supervisión de los procesos de SPA.' }
    ],
    proyectos_destacados: [
      {
        titulo: 'Línea Dermocosmética Botánica "Xochitl-Lerdo"',
        alumnos: 'Alumnas de 5° Semestre - Grupo 5°F Cosmetología',
        semestre: '5° Semestre',
        descripcion: 'Formulación de gel hidratante y tónico calmante a base de nopal, caléndula y aloe vera cosechados sustentablemente en la alcaldía Gustavo A. Madero.',
        impacto: 'Validación de pH neutro (5.5) y cero irritación en pruebas de laboratorio.'
      },
      {
        titulo: 'Protocolo de Drenaje Linfático Manual para Alivio de Tensión',
        alumnos: 'Equipo Salud y Bienestar CETis 7',
        semestre: '4° Semestre',
        descripcion: 'Guía clínica de maniobras suaves de estimulación ganglionar para desinflamación facial y descongestión ocular.',
        impacto: 'Aplicado en jornadas comunitarias de salud del plantel a más de 200 vecinos.'
      },
      {
        titulo: 'Atlas Interactivo de Biotipos y Lesiones Cutáneas Básicas',
        alumnos: 'Academia de Cosmetología',
        semestre: '3° Semestre',
        descripcion: 'Fichas fotográficas ampliadas para la diferenciación entre piel alípica, seborreica y con rosácea para el uso didáctico de 1.er semestre.',
        impacto: 'Material de consulta permanente en la Cabina Didáctica 1.'
      }
    ],
    video_demo: {
      titulo: 'Ciencia, Salud y Belleza: Cosmetología CETis 7',
      duracion: '3:05 min',
      presentador: 'Cosmiatra Lic. Rosa Isela Romero (Titular de Cosmetología)',
      descripcion: 'Conoce lo que aprenderás en la carrera de Cosmetología en el canal oficial Cosmetología CETis 7.',
      url_video: 'https://www.youtube.com/channel/UCWMj1ilClTm5xxW_t6FZ7mg'
    },
    video_academia: {
      titulo: 'Canal Oficial de la Academia de Cosmetología CETis 7',
      duracion: '4:00 min',
      presentador: 'Cosmiatra Lic. Rosa Isela Romero Vargas y Colegiado',
      descripcion: 'Visita el canal oficial de Cosmetología CETis 7 para conocer las prácticas en cabina, protocolos faciales y corporales, drenaje y servicios de SPA.',
      url_video: 'https://www.youtube.com/channel/UCWMj1ilClTm5xxW_t6FZ7mg'
    },
    galeria_alumnos: [
      {
        id: 'cos-infografia-oficial',
        titulo: 'Infografía Oficial: Qué se estudia en Cosmetología',
        alumnos: 'Academia de Cosmetología CETis 7',
        semestre: 'Material Oficial',
        tipo: 'foto',
        url_media: '/assets/aistudio/infografia_cosmetologia_cetis7.jpg',
        descripcion: 'Infografía estandarizada con los 5 módulos profesionales (M1 a M5) y campo laboral de Cosmetología.'
      },
      {
        id: 'cos-gal-1',
        titulo: 'Demostración de Drenaje Linfático y Masaje Facial',
        alumnos: 'Alumnas de 6° Semestre',
        semestre: '6° Semestre',
        tipo: 'video',
        url_media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        descripcion: 'Técnica de maniobras suaves de descongestión ganglionar en cabina didáctica.'
      },
      {
        id: 'cos-gal-2',
        titulo: 'Línea Dermocosmética Botánica Xochitl-Lerdo',
        alumnos: 'Grupo 5°F Cosmetología',
        semestre: '5° Semestre',
        tipo: 'foto',
        url_media: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
        descripcion: 'Presentación de lociones, tónicos y mascarillas con aloe vera y caléndula.'
      },
      {
        id: 'cos-gal-3',
        titulo: 'Análisis Cutáneo con Lupa Dermatológica y Luz LED',
        alumnos: 'Alumnos de 3° Semestre',
        semestre: '3° Semestre',
        tipo: 'foto',
        url_media: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
        descripcion: 'Evaluación del pH y biotipo cutáneo en modelos con estándares de higiene COFEPRIS.'
      },
      {
        id: 'cos-drive-1',
        titulo: 'Galería Cosmetología 1A',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1-mf-kQ3XbtJhhqXjIbQXBUMufRVzH3KE/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-1b',
        titulo: 'Galería Cosmetología 1B',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1Qga3N-jPbgvzkxP77YIonj4kfGQoEgvH/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-2',
        titulo: 'Galería Cosmetología 2',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1GZr1qoER1RcQoLmdAKxRONuaRAIiX5nN/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-3',
        titulo: 'Galería Cosmetología 3',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/12-iS6SE6f9CguqfYH92-ulmSMAVV_yGA/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-4',
        titulo: 'Galería Cosmetología 4',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1MMdvqBJ-CMc028BqFEh4GSt8oS8HcH4x/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-5',
        titulo: 'Galería Cosmetología 5',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1RA2LJwdg43BxzABTTB9YGgah1fPGhcuU/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-6',
        titulo: 'Galería Cosmetología 6',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1WQ5oFJYIkGflMEyhIPCwvO3AZoxolErR/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-7',
        titulo: 'Galería Cosmetología 7',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1UBGaafhZAX1mIBLETmmbSzROR-fqOB1r/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-8',
        titulo: 'Galería Cosmetología 8',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1f-KwkMWiVBswbk62sK4r2bEVniDFLHxj/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-9',
        titulo: 'Galería Cosmetología 9',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/17dtK-zvRd_VHlqRYPgLQ-RJEX2XtJxlq/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-10',
        titulo: 'Galería Cosmetología 10',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1xMoy_N002pDv3mR6ubB3Wbh-AdRyuVLj/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-11',
        titulo: 'Galería Cosmetología 11',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1jRyBM7jml-3uz6iLR3bKrICY4-5SMNAW/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-12',
        titulo: 'Galería Cosmetología 12',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1WWlLoJxj1pHA-mHWKyXwLhYH_9iSJ8cd/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-13',
        titulo: 'Galería Cosmetología 13',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1CoucVHk_ABYd27Rdwr3V-oYwR32vVEl_/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-14',
        titulo: 'Galería Cosmetología 14',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1jOp4ZvOUseoisRepWisipoUyXmfOszqO/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-15',
        titulo: 'Galería Cosmetología 15',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1Q7tSK_1qmNFK4nhOSfXHvd_Ya5ipHnQK/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-16',
        titulo: 'Galería Cosmetología 16',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1v4nceILyr_Be2KoQycLDxtD5LqLYbC37/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-17',
        titulo: 'Galería Cosmetología 17',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1LVH1_DmcYhWYwvZaTJHV1kq6CwQGg0dJ/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      },
      {
        id: 'cos-drive-18',
        titulo: 'Galería Cosmetología 18',
        alumnos: 'Academia de Cosmetología',
        semestre: 'Evidencia Estudiantil',
        tipo: 'foto',
        url_media: 'https://drive.google.com/file/d/1D-Gpsqx7k2zzvH9L5f9Hr_vIQsBUFOiV/view',
        descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
      }
    ],
    preguntas_quiz: COSMETOLOGIA_DIAGNOSTICO_REACTIVOS.map((r, idx) => ({
      id: typeof r.id === 'number' ? r.id : idx + 1,
      bloque: r.bloque,
      pregunta: r.pregunta,
      opciones: r.opciones,
      respuesta_correcta: r.es_informativa ? -1 : ({ a: 0, b: 1, c: 2, d: 3 }[r.correcta] ?? 0),
      explicacion: r.explicacion || '',
      es_informativa: r.es_informativa,
      aspecto_evaluado: r.aspecto_evaluado
    }))
  }
];

export const TEST_VOCACIONAL_PARTES: {
  id: ParteVocacionalId;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  rango: string;
}[] = [
  {
    id: 1,
    titulo: 'Parte 1: Intereses',
    subtitulo: 'Reactivos 1 al 10',
    descripcion: 'Explora qué actividades, temas, lugares y tareas despiertan tu curiosidad natural en la vida cotidiana.',
    rango: '1–10'
  },
  {
    id: 2,
    titulo: 'Parte 2: Actividades y preferencias',
    subtitulo: 'Reactivos 11 al 20',
    descripcion: 'Identifica el tipo de dinámicas, ambientes de trabajo y proyectos que más disfrutas realizar.',
    rango: '11–20'
  },
  {
    id: 3,
    titulo: 'Parte 3: Habilidades y proyectos',
    subtitulo: 'Reactivos 21 al 30',
    descripcion: 'Reconoce tus fortalezas prácticas, destrezas con herramientas, números, documentos y trato humano.',
    rango: '21–30'
  },
  {
    id: 4,
    titulo: 'Parte 4: Metas y futuro',
    subtitulo: 'Reactivos 31 al 40',
    descripcion: 'Proyecta cómo te visualizas aprendiendo, colaborando en equipo y ejerciendo profesionalmente en el futuro.',
    rango: '31–40'
  }
];

const CYCLE_MOD_4: Record<number, Record<LetraOpcionVocacional, SpecialtyId>> = {
  0: { a: 'programacion', b: 'rrhh', c: 'comercio', d: 'cosmetologia' },
  1: { a: 'rrhh', b: 'comercio', c: 'cosmetologia', d: 'programacion' },
  2: { a: 'comercio', b: 'cosmetologia', c: 'programacion', d: 'rrhh' },
  3: { a: 'cosmetologia', b: 'programacion', c: 'rrhh', d: 'comercio' }
};

function crearReactivoVocacional(
  id: number,
  parte: ParteVocacionalId,
  parte_titulo: string,
  enunciado: string,
  textos: [string, string, string, string]
): PreguntaVocacional40 {
  const keyMap = CYCLE_MOD_4[(id - 1) % 4];
  const letras: LetraOpcionVocacional[] = ['a', 'b', 'c', 'd'];
  return {
    id,
    parte,
    parte_titulo,
    enunciado,
    opciones: letras.map((letra, idx) => ({
      letra,
      texto: textos[idx],
      specialty: keyMap[letra]
    }))
  };
}

export const TEST_VOCACIONAL_40_PREGUNTAS: PreguntaVocacional40[] = [
  // Parte 1: Intereses (1 - 10)
  crearReactivoVocacional(1, 1, 'Parte 1: Intereses', 'En tu tiempo libre prefieres:', [
    'Descubrir cómo funciona una app o un videojuego',
    'Organizar a tus amigos para un convivio',
    'Investigar sobre otros países, productos o marcas del mundo',
    'Probar peinados, maquillaje o cuidado de la piel'
  ]),
  crearReactivoVocacional(2, 1, 'Parte 1: Intereses', 'En un trabajo en equipo sueles:', [
    'Mediar cuando hay conflictos y motivar a los demás',
    'Conseguir materiales y negociar con proveedores',
    'Encargarte de la presentación y el aspecto del trabajo',
    'Resolver la parte técnica o lógica del problema'
  ]),
  crearReactivoVocacional(3, 1, 'Parte 1: Intereses', 'Si pudieras visitar un lugar, sería:', [
    'Un puerto o aduana, para ver cómo llegan productos de todo el mundo',
    'Un salón de belleza de alta moda',
    'Un centro de desarrollo de tecnología',
    'Una gran empresa, para ver cómo contratan y capacitan personal'
  ]),
  crearReactivoVocacional(4, 1, 'Parte 1: Intereses', '¿Qué canal de YouTube verías más?', [
    'Tutoriales de maquillaje y peinados',
    'Tutoriales de programación o robótica',
    'Consejos para entrevistas de trabajo y liderazgo',
    'Cómo importar y vender productos desde el extranjero'
  ]),
  crearReactivoVocacional(5, 1, 'Parte 1: Intereses', '¿Qué materia te gusta más?', [
    'Matemáticas o Tecnología',
    'Formación Cívica y Ética o Español (convivencia, comunicación)',
    'Inglés o Geografía',
    'Artes o Ciencias (biología, química de productos)'
  ]),
  crearReactivoVocacional(6, 1, 'Parte 1: Intereses', '¿Qué te describe mejor?', [
    'Escucho y comprendo a las personas',
    'Soy bueno para negociar y convencer',
    'Soy detallista y creativo con lo estético',
    'Soy lógico y resuelvo problemas paso a paso'
  ]),
  crearReactivoVocacional(7, 1, 'Parte 1: Intereses', 'Sobre el inglés:', [
    'Me interesa dominarlo para comunicarme con gente de otros países',
    'Me gusta para ver tutoriales y tendencias de belleza',
    'Me sirve para leer documentación y programar',
    'Prefiero usar mi idioma para escuchar, aconsejar y apoyar a otros'
  ]),
  crearReactivoVocacional(8, 1, 'Parte 1: Intereses', 'Si te regalan un curso gratis, elegirías:', [
    'Colorimetría y corte de cabello',
    'Desarrollo de páginas web',
    'Liderazgo y manejo de personal',
    'Logística y exportación'
  ]),
  crearReactivoVocacional(9, 1, 'Parte 1: Intereses', 'Hay un problema en tu escuela. Tú:', [
    'Diseñarías un sistema o app para solucionarlo',
    'Reunirías a los involucrados para dialogar',
    'Buscarías recursos externos o patrocinios',
    'Cuidarías que el ambiente se vea y se sienta agradable'
  ]),
  crearReactivoVocacional(10, 1, 'Parte 1: Intereses', '¿Qué tarea harías con más gusto?', [
    'Entrevistar personas para conocer sus habilidades',
    'Calcular costos de envío y precios de venta',
    'Asesorar a un cliente sobre su imagen personal',
    'Escribir instrucciones para que una computadora haga una tarea'
  ]),

  // Parte 2: Actividades y preferencias (11 - 20)
  crearReactivoVocacional(11, 2, 'Parte 2: Actividades y preferencias', 'Sobre una tienda en línea, lo que más te interesa es:', [
    'Cómo se envían y venden productos a otros países',
    'Vender productos de belleza',
    'Programar la página',
    'Organizar al equipo que la atiende'
  ]),
  crearReactivoVocacional(12, 2, 'Parte 2: Actividades y preferencias', 'Al trabajar con las manos o en tu espacio:', [
    'Me gusta la precisión en cabello, uñas o piel',
    'Prefiero el teclado y la computadora',
    'Prefiero trabajar con expedientes y personas',
    'Prefiero trabajar con facturas, documentos de comercio y mapas'
  ]),
  crearReactivoVocacional(13, 2, 'Parte 2: Actividades y preferencias', '¿Qué te emociona más?', [
    'Que un programa que hice funcione',
    'Que alguien me diga que lo ayudé con un problema personal',
    'Cerrar un buen trato con alguien de otro país',
    'Ver a alguien sentirse bien con su cambio de imagen'
  ]),
  crearReactivoVocacional(14, 2, 'Parte 2: Actividades y preferencias', '¿Qué profesionista admiras más?', [
    'Un director de talento humano',
    'Un agente aduanal o empresario exportador',
    'Un estilista o maquillista profesional',
    'Un ingeniero de software'
  ]),
  crearReactivoVocacional(15, 2, 'Parte 2: Actividades y preferencias', 'Cuando viajas o ves otros lugares, te fijas en:', [
    'Las costumbres, monedas y economías',
    'La moda y el estilo de las personas',
    'La tecnología que usan',
    'Cómo se organizan y cooperan las personas'
  ]),
  crearReactivoVocacional(16, 2, 'Parte 2: Actividades y preferencias', 'Si pudieras emprender un negocio, sería:', [
    'Un salón de belleza o spa',
    'Una empresa de apps o software',
    'Una consultoría de reclutamiento y capacitación',
    'Una empresa de importación y exportación'
  ]),
  crearReactivoVocacional(17, 2, 'Parte 2: Actividades y preferencias', 'Cuando algo falla, tú:', [
    'Busco el error y lo analizo hasta encontrarlo',
    'Hablo con las personas para entender qué pasó',
    'Busco alternativas y otras rutas para lograr el objetivo',
    'Lo arreglo con creatividad para que quede presentable'
  ]),
  crearReactivoVocacional(18, 2, 'Parte 2: Actividades y preferencias', 'Tu ambiente de trabajo ideal es:', [
    'Una oficina con mucha interacción entre personas',
    'Una oficina o almacén en contacto con proveedores y clientes de varios países',
    'Un salón o estudio atendiendo clientes uno a uno',
    'Un espacio tranquilo frente a la computadora'
  ]),
  crearReactivoVocacional(19, 2, 'Parte 2: Actividades y preferencias', 'De las noticias, lo que más te llama la atención es:', [
    'Tratados comerciales, aranceles y tipo de cambio',
    'Tendencias de moda y belleza',
    'Nuevas tecnologías e inteligencia artificial',
    'Derechos laborales y empleo'
  ]),
  crearReactivoVocacional(20, 2, 'Parte 2: Actividades y preferencias', 'Tus amigos te ven como:', [
    'Quien los asesora con su look',
    'Quien les arregla el celular o la computadora',
    'Quien los escucha y les ayuda con sus problemas',
    'Quien sabe negociar y conseguir buenos precios'
  ]),

  // Parte 3: Habilidades y proyectos (21 - 30)
  crearReactivoVocacional(21, 3, 'Parte 3: Habilidades y proyectos', 'Para un proyecto de fin de curso, harías:', [
    'Un videojuego o una app',
    'Un plan de integración y convivencia para un grupo',
    'Un plan para vender un producto local en el extranjero',
    'Una exposición de maquillaje y peinados'
  ]),
  crearReactivoVocacional(22, 3, 'Parte 3: Habilidades y proyectos', '¿Qué habilidad quieres desarrollar?', [
    'Liderazgo y comunicación con personas',
    'Negociación y conocimiento de mercados',
    'Destreza manual y sentido estético',
    'Pensamiento lógico y programación'
  ]),
  crearReactivoVocacional(23, 3, 'Parte 3: Habilidades y proyectos', 'Con los números, te gusta:', [
    'Calcular precios, divisas y costos de importación',
    'Calcular cantidades de productos y tiempos de aplicación',
    'Usarlos en algoritmos y lógica',
    'Usarlos en nóminas y pagos'
  ]),
  crearReactivoVocacional(24, 3, 'Parte 3: Habilidades y proyectos', 'En un centro comercial, te detienes en:', [
    'Cosméticos y salones de belleza',
    'Tiendas de electrónica y gadgets',
    'Observar cómo tratan los empleados a los clientes',
    'El origen de los productos y las marcas internacionales'
  ]),
  crearReactivoVocacional(25, 3, 'Parte 3: Habilidades y proyectos', 'Te gustaría ser:', [
    'Desarrollador de aplicaciones',
    'Reclutador o gerente de personal',
    'Agente de comercio exterior',
    'Estilista o cosmetólogo profesional'
  ]),
  crearReactivoVocacional(26, 3, 'Parte 3: Habilidades y proyectos', 'Un compañero está desmotivado. Tú:', [
    'Hablo con él, lo escucho y lo animo',
    'Negocio con él un acuerdo en que ambos ganemos',
    'Le levanto el ánimo con un detalle creativo y personal',
    'Le ofrezco ayuda técnica para que le sea más fácil'
  ]),
  crearReactivoVocacional(27, 3, 'Parte 3: Habilidades y proyectos', '¿Con qué tipo de documentos te sentirías más cómodo?', [
    'Facturas, pedimentos y contratos de compraventa',
    'Fichas de clientes con sus tratamientos',
    'Código y diagramas de flujo',
    'Contratos de trabajo y expedientes de personal'
  ]),
  crearReactivoVocacional(28, 3, 'Parte 3: Habilidades y proyectos', '¿Qué taller tomarías con gusto un sábado?', [
    'Uñas o maquillaje',
    'Robótica',
    'Comunicación asertiva',
    'Idiomas y negocios internacionales'
  ]),
  crearReactivoVocacional(29, 3, 'Parte 3: Habilidades y proyectos', 'Con una computadora, te gustaría:', [
    'Crear lo que hay detrás de los programas',
    'Organizar horarios y datos del personal',
    'Investigar mercados y contactar proveedores',
    'Editar fotos y videos de belleza'
  ]),
  crearReactivoVocacional(30, 3, 'Parte 3: Habilidades y proyectos', 'Tu mayor fortaleza es:', [
    'La empatía',
    'La persuasión',
    'La creatividad estética',
    'La lógica'
  ]),

  // Parte 4: Metas y futuro (31 - 40)
  crearReactivoVocacional(31, 4, 'Parte 4: Metas y futuro', '¿Qué te gustaría aprender primero?', [
    'Cómo funcionan las aduanas',
    'Técnicas de cuidado de la piel',
    'Lenguajes de programación',
    'Leyes laborales y selección de personal'
  ]),
  crearReactivoVocacional(32, 4, 'Parte 4: Metas y futuro', 'En la feria de tu escuela, tu stand sería de:', [
    'Cambios de look',
    'Demostración de apps hechas por ti',
    'Dinámicas de integración y trabajo en equipo',
    'Productos típicos de distintos países'
  ]),
  crearReactivoVocacional(33, 4, 'Parte 4: Metas y futuro', 'Ante un reto difícil:', [
    'Lo divido en partes pequeñas y lo resuelvo con lógica',
    'Pido opiniones y coordino al grupo',
    'Busco opciones estratégicas para salir adelante',
    'Confío en mi creatividad y en mis manos'
  ]),
  crearReactivoVocacional(34, 4, 'Parte 4: Metas y futuro', 'Prefieres trabajar:', [
    'Con muchas personas durante todo el día',
    'Con clientes y socios de otros países por videollamada',
    'Atendiendo directamente a cada cliente cara a cara',
    'Concentrado en un proyecto técnico con pocas interrupciones'
  ]),
  crearReactivoVocacional(35, 4, 'Parte 4: Metas y futuro', 'Tus series o películas favoritas tratan de:', [
    'Negocios y viajes por el mundo',
    'Moda, belleza y transformaciones',
    'Tecnología, hackers o ciencia ficción',
    'Relaciones entre personas en el trabajo'
  ]),
  crearReactivoVocacional(36, 4, 'Parte 4: Metas y futuro', 'En un proyecto de equipo, te tocaría:', [
    'El diseño, la imagen y la presentación',
    'Programar o automatizar tareas',
    'Coordinar al equipo y repartir tareas',
    'Conseguir contactos externos y recursos'
  ]),
  crearReactivoVocacional(37, 4, 'Parte 4: Metas y futuro', '¿Qué te da más satisfacción?', [
    'Crear algo que funcione y lo use mucha gente',
    'Que un equipo trabaje en armonía gracias a mí',
    'Que un producto llegue a otro país gracias a mi gestión',
    'Que un cliente salga feliz con su imagen'
  ]),
  crearReactivoVocacional(38, 4, 'Parte 4: Metas y futuro', 'Para un empleo de verano elegirías:', [
    'Apoyar en el área de personal de una empresa',
    'Apoyar en una empresa de logística o comercio exterior',
    'Ayudar en un salón de belleza',
    'Ayudar en un negocio de reparación o programación'
  ]),
  crearReactivoVocacional(39, 4, 'Parte 4: Metas y futuro', '¿Cómo te ves en 10 años?', [
    'Dirigiendo una empresa que exporta',
    'Con mi propio salón, spa o marca de cosméticos',
    'Desarrollando software o trabajando en tecnología',
    'Dirigiendo un área de recursos humanos'
  ]),
  crearReactivoVocacional(40, 4, 'Parte 4: Metas y futuro', '¿Con qué frase te identificas más?', [
    '"La imagen personal cambia la vida de las personas"',
    '"La tecnología transforma el mundo"',
    '"Las personas son el activo más valioso de una empresa"',
    '"El comercio conecta a las naciones"'
  ])
];

export const BANCO_PREGUNTAS_VOCACIONALES = {
  partes: TEST_VOCACIONAL_PARTES,
  preguntas: TEST_VOCACIONAL_40_PREGUNTAS
};

export const ESTUDIANTES_INICIALES: Estudiante[] = [
  {
    num_control: '26316070010042',
    nombre_completo: 'Gael Emiliano Morales Sánchez',
    grupo: '1°A',
    turno: 'MATUTINO',
    correo_institucional: 'gael.morales.26@cetis7.edu.mx',
    curp: 'MOSG090314HDFRLA01',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
    telefono_alumno: '55 4123 8901',
    tutor: {
      nombre_tutor: 'Ing. Fernando Morales Silva',
      parentesco: 'Padre',
      correo_tutor: 'fernando.morales.padre@gmail.com',
      telefono_tutor: '55 1234 5678',
      verificado: true,
      fecha_verificacion: '2026-10-31T18:30:00Z',
      firma_digital: 'Fdo. Fernando Morales S. - Firma Digital Tutor DGETI'
    }
  },
  {
    num_control: '26316070010118',
    nombre_completo: 'Valeria Sofía Hernández Mendoza',
    grupo: '1°B',
    turno: 'MATUTINO',
    correo_institucional: 'valeria.hernandez.26@cetis7.edu.mx',
    curp: 'HEMV090822MDFRNS04',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    telefono_alumno: '55 6789 1234',
    tutor: {
      nombre_tutor: 'Lic. Laura Mendoza Rivas',
      parentesco: 'Madre',
      correo_tutor: 'laura.mendoza.tutora@gmail.com',
      telefono_tutor: '55 8765 4321',
      verificado: true,
      fecha_verificacion: '2026-10-31T19:00:00Z',
      firma_digital: 'Fdo. Laura Mendoza R. - Firma Digital Tutor DGETI'
    }
  },
  {
    num_control: '26316070010205',
    nombre_completo: 'Diego Alejandro Ramírez Ortiz',
    grupo: '1°C',
    turno: 'MATUTINO',
    correo_institucional: 'diego.ramirez.26@cetis7.edu.mx',
    curp: 'RAOD091105HDFMRG09',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    telefono_alumno: '55 3344 5566',
    tutor: {
      nombre_tutor: 'Prof. Jorge Ramírez Ortiz',
      parentesco: 'Padre',
      correo_tutor: 'jorge.ramirez.tutor@gmail.com',
      telefono_tutor: '55 9876 5432',
      verificado: false
    }
  },
  {
    num_control: '26316070010312',
    nombre_completo: 'Ximena Guadalupe Torres Castillo',
    grupo: '1°D',
    turno: 'MATUTINO',
    correo_institucional: 'ximena.torres.26@cetis7.edu.mx',
    curp: 'TOCX090518MDFRTL03',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    telefono_alumno: '55 7788 9900',
    tutor: {
      nombre_tutor: 'Sra. Beatriz Castillo Peza',
      parentesco: 'Madre',
      correo_tutor: 'beatriz.castillo.tutora@gmail.com',
      telefono_tutor: '55 6543 2109',
      verificado: false
    }
  },
  {
    num_control: '26316070010419',
    nombre_completo: 'Mateo Sebastián Cruz Pineda',
    grupo: '1°E',
    turno: 'MATUTINO',
    correo_institucional: 'mateo.cruz.26@cetis7.edu.mx',
    curp: 'CUPM090129HDFRND02',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    telefono_alumno: '55 2211 4433',
    tutor: {
      nombre_tutor: 'Sr. Roberto Cruz Navarro',
      parentesco: 'Padre',
      correo_tutor: 'roberto.cruz.tutor@gmail.com',
      telefono_tutor: '55 4321 0987',
      verificado: false
    }
  },
  {
    num_control: '26316070010523',
    nombre_completo: 'Camila Fernanda Reyes Aguilar',
    grupo: '1°F',
    turno: 'MATUTINO',
    correo_institucional: 'camila.reyes.26@cetis7.edu.mx',
    curp: 'REAC090412MDFRLS03',
    telefono_alumno: '55 6677 8899',
    tutor: {
      nombre_tutor: 'Sra. Patricia Aguilar Reyes',
      parentesco: 'Madre',
      correo_tutor: 'patricia.aguilar.tutora@gmail.com',
      telefono_tutor: '55 3210 9876',
      verificado: false
    }
  },
  {
    num_control: '26316070010631',
    nombre_completo: 'Leonardo Daniel Gómez Varela',
    grupo: '1°A',
    turno: 'MATUTINO',
    correo_institucional: 'leonardo.gomez.26@cetis7.edu.mx',
    curp: 'GOVL091003HDFRMD05',
    telefono_alumno: '55 1199 8822',
    tutor: {
      nombre_tutor: 'Dr. Alejandro Gómez Varela',
      parentesco: 'Padre',
      correo_tutor: 'alejandro.gomez.tutor@gmail.com',
      telefono_tutor: '55 2109 8765',
      verificado: true,
      fecha_verificacion: '2026-10-30T14:20:00Z',
      firma_digital: 'Fdo. Alejandro Gómez V. - Firma Digital Tutor DGETI'
    }
  },
  {
    num_control: '26316070010744',
    nombre_completo: 'Renata Nicole Domínguez Silva',
    grupo: '1°B',
    turno: 'MATUTINO',
    correo_institucional: 'renata.dominguez.26@cetis7.edu.mx',
    curp: 'DOSR090620MDFRNL01',
    telefono_alumno: '55 4433 2211',
    tutor: {
      nombre_tutor: 'Lic. Carmen Silva Domínguez',
      parentesco: 'Madre',
      correo_tutor: 'carmen.silva.tutora@gmail.com',
      telefono_tutor: '55 1098 7654',
      verificado: true,
      fecha_verificacion: '2026-10-30T16:45:00Z',
      firma_digital: 'Fdo. Carmen Silva D. - Firma Digital Tutor DGETI'
    }
  },
  {
    num_control: '26316070010852',
    nombre_completo: 'Santiago Jesús Méndez Rangel',
    grupo: '1°G',
    turno: 'MATUTINO',
    correo_institucional: 'santiago.mendez.26@cetis7.edu.mx',
    curp: 'MERS091215HDFRGP08',
    telefono_alumno: '55 9988 7766',
    tutor: {
      nombre_tutor: 'Sr. Javier Méndez Rangel',
      parentesco: 'Padre',
      correo_tutor: 'javier.mendez.tutor@gmail.com',
      telefono_tutor: '55 0987 6543',
      verificado: false
    }
  },
  {
    num_control: '26316070010967',
    nombre_completo: 'Andrea Jimena Salazar Flores',
    grupo: '1°H',
    turno: 'MATUTINO',
    correo_institucional: 'andrea.salazar.26@cetis7.edu.mx',
    curp: 'SAFA090708MDFRNT06',
    telefono_alumno: '55 8877 6655',
    tutor: {
      nombre_tutor: 'Sra. Rocío Flores Salazar',
      parentesco: 'Madre',
      correo_tutor: 'rocio.flores.tutora@gmail.com',
      telefono_tutor: '55 9876 1234',
      verificado: false
    }
  }
];

export const FICHAS_ACADEMIA_DEFAULT: Record<string, FichaAcademiaReq> = {
  programacion: {
    especialidad_id: 'programacion',
    nombre_especialidad: 'Técnico en Programación',
    presidente_academia: 'Ing. Carlos Alberto Navarrete Silva',
    integrantes_academia: [
      'Ing. Marco Antonio Estrada',
      'Mtra. Laura Patricia Guadarrama',
      'Ing. Roberto Zepeda Morales'
    ],
    fecha_entrega: '2026-11-15',
    resumen_ejecutivo: 'Forma técnicos con capacidades analíticas sólidas para diseñar, codificar, depurar e implementar sistemas informáticos, soluciones web de alto impacto, bases de datos relacionales y aplicaciones móviles para el sector productivo nacional e internacional.',
    recursos_multimedia: {
      video_url_o_estado: 'Grabación de 2:45 min en Laboratorio 3 en MP4 1080p con demostración de proyectos.',
      infografia_formato: 'Infografía en PDF vectorizado alta resolución con mapa modular I al V y salidas ocupacionales.',
      proyectos_registrados: [
        'Sistema Escolar Web LerdoConecta',
        'App Móvil SOS Comunitaria Cuautepec',
        'Simulador de Encriptación y Ciberdefensa'
      ],
      video_academia: {
        titulo: 'Video Oficial de la Academia de Programación CETis 7',
        duracion: '4:15 min',
        presentador: 'Ing. Marco Antonio Estrada Ruiz y Colegiado de Docentes',
        descripcion: 'Los profesores de la academia explican el modelo de proyectos integradores, la ruta de aprendizaje en desarrollo Web y Móvil, y los requerimientos para el campo laboral.',
        url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      },
      galeria_alumnos: [
        {
          id: 'prog-gal-1',
          titulo: 'Sistema Escolar Web LerdoConecta',
          alumnos: 'Sofía Martínez y Carlos Ruiz',
          semestre: '5° Semestre',
          tipo: 'video',
          url_media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          descripcion: 'Demostración en vivo del sistema de calificaciones con Firebase Firestore y panel reactivo.'
        },
        {
          id: 'prog-gal-2',
          titulo: 'App Móvil SOS Comunitaria Cuautepec',
          alumnos: 'Equipo Innovatec 6°A',
          semestre: '6° Semestre',
          tipo: 'foto',
          url_media: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
          descripcion: 'Alumnos exponiendo el prototipo galardonado en el Concurso DGETI 2025.'
        },
        {
          id: 'prog-gal-3',
          titulo: 'Laboratorio de Algoritmos e Inteligencia Artificial',
          alumnos: 'Comunidad de Alumnos de 4° Semestre',
          semestre: '4° Semestre',
          tipo: 'foto',
          url_media: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
          descripcion: 'Sesión práctica de desarrollo en el Laboratorio de Cómputo 3.'
        },
        {
          id: 'prog-drive-1',
          titulo: 'Prácticas en Laboratorio de Programación 1',
          alumnos: 'Academia de Programación CETis 7',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1kE_IbOtVPREi6NXTyE7NJD8NrzT8hMPh/view',
          descripcion: 'Fotografía de prácticas de laboratorio y desarrollo de proyectos de alumnos de Programación.'
        },
        {
          id: 'prog-drive-2',
          titulo: 'Prácticas en Laboratorio de Programación 2',
          alumnos: 'Academia de Programación CETis 7',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1XTglEpzKabT8ETx3wCLOInOgmwBvDX93/view',
          descripcion: 'Fotografía de prácticas de laboratorio y desarrollo de proyectos de alumnos de Programación.'
        },
        {
          id: 'prog-drive-3',
          titulo: 'Actividad de Desarrollo de Software 3',
          alumnos: 'Academia de Programación CETis 7',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1Lvp53a7JsJ4tNCxjSqmRxH3FgWYt2oB8/view',
          descripcion: 'Evidencia fotográfica del trabajo en equipo y codificación en la especialidad de Programación.'
        },
        {
          id: 'prog-drive-4',
          titulo: 'Actividad de Desarrollo de Software 4',
          alumnos: 'Academia de Programación CETis 7',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1bn-oYfl8_LhA-9fPABgCB49RTZ9fNR3j/view',
          descripcion: 'Evidencia fotográfica del trabajo en equipo y codificación en la especialidad de Programación.'
        },
        {
          id: 'prog-drive-5',
          titulo: 'Actividad de Desarrollo de Software 5',
          alumnos: 'Academia de Programación CETis 7',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1MNQ2FkRc1zPsY4Z0-5NVNBSq5hNm0fOY/view',
          descripcion: 'Evidencia fotográfica del trabajo en equipo y codificación en la especialidad de Programación.'
        },
        {
          id: 'prog-drive-6',
          titulo: 'Exposición de Proyectos de Programación 6',
          alumnos: 'Academia de Programación CETis 7',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1x807lzHR4UJUFCjwaPWvjObD7kWXU05R/view',
          descripcion: 'Muestra estudiantil de sistemas y aplicaciones desarrolladas en la carrera de Programación.'
        }
      ]
    },
    banco_reactivos: [
      {
        pregunta: '¿Cuál es el objetivo principal de la especialidad de Programación en el CETis No. 7?',
        opciones: ['Armar computadoras físicas exclusivamente', 'Diseñar, codificar, implementar y mantener sistemas de software y apps', 'Elaborar contratos de trabajo'],
        correcta: 'b'
      },
      {
        pregunta: '¿En qué semestre se cursa el módulo de desarrollo de aplicaciones móviles?',
        opciones: ['2° Semestre', '4° Semestre', '6° Semestre'],
        correcta: 'c'
      },
      {
        pregunta: '¿Qué destreza principal desarrolla el estudiante en esta carrera técnica?',
        opciones: ['Pensamiento lógico, razonamiento algorítmico y modularidad', 'Clasificación arancelaria y despacho aduanero', 'Drenaje linfático facial'],
        correcta: 'a'
      },
      {
        pregunta: '¿Cuál de los proyectos destacados presentados fue reconocido en el Concurso de Prototipos DGETI 2025?',
        opciones: ['Pase de lista con credencial', 'App Móvil SOS Comunitaria Cuautepec', 'Catálogo de cremas de sábila'],
        correcta: 'b'
      },
      {
        pregunta: '¿Cuál es un campo de inserción profesional directo para los egresados?',
        opciones: ['Empresas de desarrollo tecnológico, áreas de sistemas y soporte de software', 'Agencias aduanales marítimas', 'Spas de belleza'],
        correcta: 'a'
      }
    ]
  },
  comercio: {
    especialidad_id: 'comercio',
    nombre_especialidad: 'Bachillerato Tecnológico en Comercio Internacional y Aduanas',
    presidente_academia: 'Lic. Claudia Becerril Morales',
    integrantes_academia: [
      'Lic. Fernando Reyes Arredondo',
      'Mtro. Jorge Luis Santillán',
      'Lic. Ana María Padrón'
    ],
    fecha_entrega: '2026-11-15',
    resumen_ejecutivo: 'Forma técnicos en Comercio Internacional y Aduanas con competencias en gestión de importaciones y exportaciones, estimación de costos y planes de exportación, clasificación arancelaria, procesos aduaneros, empleabilidad y economía ecológica.',
    recursos_multimedia: {
      video_url_o_estado: 'Video oficial principal MP4 de Comercio Internacional y Aduanas integrado en plataforma.',
      infografia_formato: 'Infografía oficial del Perfil de Egreso: Comercio Internacional y Aduanas (Competencias Laborales, Formación Integral y Principales Puestos de Trabajo).',
      proyectos_registrados: [
        'Ruta de Exportación: Miel de Agave a la Unión Europea',
        'Simulador Digital de Cubicaje de Contenedores 40ft',
        'Manual de Cumplimiento Arancelario para PYMES'
      ],
      video_academia: {
        titulo: 'Video Principal: Comercio Internacional y Aduanas',
        duracion: '0:45 min',
        presentador: 'DGETI · Academia de Comercio Internacional y Aduanas CETis 7',
        descripcion: 'Cada producto que usas y cada mercancía que llega necesita un estratega. Conoce la carrera técnica en Comercio Internacional y Aduanas y sus oportunidades laborales y universitarias.',
        url_video: '/assets/aistudio/Comercio_internacional_y_aduanas_video_principal_979d88d2.mp4'
      },
      galeria_alumnos: [
        {
          id: 'com-infografia-oficial',
          titulo: 'Infografía Oficial: Perfil de Egreso y Puestos de Trabajo',
          alumnos: 'Academia de Comercio Internacional y Aduanas',
          semestre: 'Material Oficial',
          tipo: 'foto',
          url_media: '/assets/aistudio/image_ed736886.png',
          descripcion: 'Infografía institucional con las competencias laborales principales, formación integral y principales puestos de trabajo de Comercio Internacional y Aduanas.'
        },
        {
          id: 'com-gal-1',
          titulo: 'Simulador Digital de Cubicaje de Contenedores 40ft',
          alumnos: 'Equipo Logistix 6°A',
          semestre: '6° Semestre',
          tipo: 'video',
          url_media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          descripcion: 'Video demostrativo de estiba y optimización de espacio volumétrico en transporte marítimo.'
        },
        {
          id: 'com-gal-2',
          titulo: 'Maqueta de Garita Aduanal y Puerto de Veracruz',
          alumnos: 'Alumnos de 3° Semestre',
          semestre: '3° Semestre',
          tipo: 'foto',
          url_media: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
          descripcion: 'Representación física a escala del proceso de desaduanamiento y semáforo fiscal.'
        },
        {
          id: 'com-gal-3',
          titulo: 'Ruta de Exportación de Miel de Agave a la UE',
          alumnos: 'Grupo 5°B Comercio',
          semestre: '5° Semestre',
          tipo: 'foto',
          url_media: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
          descripcion: 'Exposición de la carpeta técnica con Incoterms y certificado de origen bajo TLCUEM.'
        }
      ]
    },
    banco_reactivos: [
      {
        pregunta: '¿Qué documento oficial legaliza el tránsito y desaduanamiento de mercancías en México?',
        opciones: ['Pedimento Aduanal', 'Carta de recomendación escolar', 'Credencial de elector'],
        correcta: 'a'
      },
      {
        pregunta: '¿Para qué sirven los Incoterms en el comercio mundial?',
        opciones: ['Calcular el promedio escolar', 'Determinar costos, riesgos y obligaciones entre comprador y vendedor', 'Escribir código de software'],
        correcta: 'b'
      },
      {
        pregunta: '¿En qué consiste el cubicaje en la logística?',
        opciones: ['Maximizar el aprovechamiento de espacio en contenedores', 'Pintar contenedores de colores', 'Calcular el aguinaldo'],
        correcta: 'a'
      },
      {
        pregunta: '¿Cuál es el tratado comercial clave de México con América del Norte?',
        opciones: ['Pacto Andino', 'T-MEC', 'Tratado de Kioto'],
        correcta: 'b'
      },
      {
        pregunta: '¿Cuáles son los principales puestos de trabajo de un egresado de Comercio Internacional y Aduanas?',
        opciones: ['Auxiliar de aduanas, comercio exterior, logística internacional, tráfico o clasificación arancelaria', 'Laboratorios clínicos únicamente', 'Salones de manicura'],
        correcta: 'a'
      }
    ]
  },
  rrhh: {
    especialidad_id: 'rrhh',
    nombre_especialidad: 'Técnico en Administración de Recursos Humanos',
    presidente_academia: 'Mtra. Patricia Mendoza Garduño',
    integrantes_academia: [
      'Lic. Héctor Hugo Benítez',
      'Mtra. Rocío Salgado Fuentes',
      'Lic. Silvia Ortega Galindo'
    ],
    fecha_entrega: '2026-11-15',
    resumen_ejecutivo: 'Capacita al alumno en la atracción, selección, contratación, capacitación, evaluación y bienestar del talento humano en organizaciones productivas, con estricto apego a la Ley Federal del Trabajo y la NOM-035-STPS.',
    recursos_multimedia: {
      video_url_o_estado: 'Video explicativo 2:50 min con dramatización de entrevistas por competencias y dinámicas grupales.',
      infografia_formato: 'Infografía interactiva sobre cálculo de nómina y los 5 módulos de especialidad.',
      proyectos_registrados: [
        'Diagnóstico de Clima Laboral NOM-035',
        'Simulador Digital de Entrevistas STAR',
        'Manual de Inducción Digital Orgullo Lerdo'
      ],
      galeria_alumnos: [
        {
          id: 'rrhh-gal-1',
          titulo: 'Roleplay de Entrevistas Estructuradas por Competencias',
          alumnos: 'Alumnos de 4° Semestre',
          semestre: '4° Semestre',
          tipo: 'video',
          url_media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          descripcion: 'Simulación interactiva de reclutamiento y selección de personal con retroalimentación en vivo.'
        },
        {
          id: 'rrhh-gal-2',
          titulo: 'Jornada de Diagnóstico de Clima Laboral NOM-035',
          alumnos: 'Grupo 5°D RRHH',
          semestre: '5° Semestre',
          tipo: 'foto',
          url_media: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
          descripcion: 'Aplicación de cuestionarios de bienestar organizacional y pausas activas para la comunidad.'
        },
        {
          id: 'rrhh-gal-3',
          titulo: 'Taller Practico de Nóminas y Contratos LFT',
          alumnos: 'Alumnos de 6° Semestre',
          semestre: '6° Semestre',
          tipo: 'foto',
          url_media: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
          descripcion: 'Cálculo de finiquitos y elaboración de contratos individuales de trabajo.'
        },
        {
          id: 'rrhh-drive-1',
          titulo: 'Galería Recursos Humanos 1',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1z1J_aJjy2Q-T_45u8diRfxJ2FjV76K-s/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-2',
          titulo: 'Galería Recursos Humanos 2',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1gXIDhbqHZF4sUiMBqqGGqLZGA75bXcCM/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-3',
          titulo: 'Galería Recursos Humanos 3',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1SFHJ40OSkVZ74LUJqcDkB2E11nX7UMAC/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-4',
          titulo: 'Galería Recursos Humanos 4',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/179DDIy40OcR_hkXvmlMxiGydn1V0NpYx/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-5',
          titulo: 'Galería Recursos Humanos 5',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/11TDlo7eCej-l_zLDpdIKF4X8S78Zips5/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-6',
          titulo: 'Galería Recursos Humanos 6',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/10Q259Ru8A2Bs5VEdpd9rcVMULM6WfjEk/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-7',
          titulo: 'Galería Recursos Humanos 7',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1pw5POoViC6fBeAAUzu1KI6n8YMXXjOQQ/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-8',
          titulo: 'Galería Recursos Humanos 8',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1XgCf4NtjSegIhgVVb_muuRSK7c5rXZid/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-9',
          titulo: 'Galería Recursos Humanos 9',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1FYeCnE67aYON3B5tHurZk-0k4JCocWmG/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-10',
          titulo: 'Galería Recursos Humanos 10',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1ta8qYsEK4XymD3RN1j-uMChpphfMQt_q/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-11',
          titulo: 'Galería Recursos Humanos 11',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1XM14-DMZIwI2y3F7Zw-im-wWSdxhSIhM/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-12',
          titulo: 'Galería Recursos Humanos 12',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1BN2fwadPlO41zECa_swTQM0gpYDZYAtz/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        },
        {
          id: 'rrhh-drive-13',
          titulo: 'Galería Recursos Humanos 13',
          alumnos: 'Academia de Recursos Humanos',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1RyHLrFkcBoU5eqfqzxP5agv_gHdDBWRs/view',
          descripcion: 'Fotografía de actividades y trabajos realizados por alumnos de la especialidad de Recursos Humanos.'
        }
      ]
    },
    banco_reactivos: RRHH_DIAGNOSTICO_REACTIVOS
  },
  cosmetologia: {
    especialidad_id: 'cosmetologia',
    nombre_especialidad: 'Técnico en Cosmetología',
    presidente_academia: 'Cosmiatra Lic. Rosa Isela Romero Vargas',
    integrantes_academia: [
      'Lic. Mayra Janet González',
      'Téc. Martha Elena Solís',
      'Q.F.B. Andrés Delgado Cruz'
    ],
    fecha_entrega: '2026-11-15',
    resumen_ejecutivo: 'La Cosmetología se encarga de los cuidados estéticos del rostro y cuerpo, asepsia, rejuvenecimiento y embellecimiento saludable de la piel, conocimiento de activos cosméticos y técnicas de relajación que generan bienestar integral.',
    recursos_multimedia: {
      video_url_o_estado: 'Canal oficial de YouTube Cosmetología CETis 7 (https://www.youtube.com/channel/UCWMj1ilClTm5xxW_t6FZ7mg) y videos de cabina.',
      infografia_formato: 'Infografía oficial estandarizada CETis 7 con los 5 módulos profesionales (M1 a M5) y campo de trabajo.',
      proyectos_registrados: [
        'Línea Dermocosmética Botánica Xochitl-Lerdo',
        'Protocolo de Drenaje Linfático Manual',
        'Atlas Interactivo de Biotipos y Lesiones Dérmicas'
      ],
      galeria_alumnos: [
        {
          id: 'cos-infografia-oficial',
          titulo: 'Infografía Oficial: Qué se estudia en Cosmetología',
          alumnos: 'Academia de Cosmetología CETis 7',
          semestre: 'Material Oficial',
          tipo: 'foto',
          url_media: '/assets/aistudio/infografia_cosmetologia_cetis7.jpg',
          descripcion: 'Infografía estandarizada con los 5 módulos profesionales (M1 a M5) y campo laboral de Cosmetología.'
        },
        {
          id: 'cos-gal-1',
          titulo: 'Demostración de Drenaje Linfático y Masaje Facial',
          alumnos: 'Alumnas de 6° Semestre',
          semestre: '6° Semestre',
          tipo: 'video',
          url_media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          descripcion: 'Técnica de maniobras suaves de descongestión ganglionar en cabina didáctica.'
        },
        {
          id: 'cos-gal-2',
          titulo: 'Línea Dermocosmética Botánica Xochitl-Lerdo',
          alumnos: 'Grupo 5°F Cosmetología',
          semestre: '5° Semestre',
          tipo: 'foto',
          url_media: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
          descripcion: 'Presentación de lociones, tónicos y mascarillas con aloe vera y caléndula.'
        },
        {
          id: 'cos-gal-3',
          titulo: 'Análisis Cutáneo con Lupa Dermatológica y Luz LED',
          alumnos: 'Alumnos de 3° Semestre',
          semestre: '3° Semestre',
          tipo: 'foto',
          url_media: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
          descripcion: 'Evaluación del pH y biotipo cutáneo en modelos con estándares de higiene COFEPRIS.'
        },
        {
          id: 'cos-drive-1',
          titulo: 'Galería Cosmetología 1A',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1-mf-kQ3XbtJhhqXjIbQXBUMufRVzH3KE/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-1b',
          titulo: 'Galería Cosmetología 1B',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1Qga3N-jPbgvzkxP77YIonj4kfGQoEgvH/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-2',
          titulo: 'Galería Cosmetología 2',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1GZr1qoER1RcQoLmdAKxRONuaRAIiX5nN/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-3',
          titulo: 'Galería Cosmetología 3',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/12-iS6SE6f9CguqfYH92-ulmSMAVV_yGA/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-4',
          titulo: 'Galería Cosmetología 4',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1MMdvqBJ-CMc028BqFEh4GSt8oS8HcH4x/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-5',
          titulo: 'Galería Cosmetología 5',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1RA2LJwdg43BxzABTTB9YGgah1fPGhcuU/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-6',
          titulo: 'Galería Cosmetología 6',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1WQ5oFJYIkGflMEyhIPCwvO3AZoxolErR/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-7',
          titulo: 'Galería Cosmetología 7',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1UBGaafhZAX1mIBLETmmbSzROR-fqOB1r/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-8',
          titulo: 'Galería Cosmetología 8',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1f-KwkMWiVBswbk62sK4r2bEVniDFLHxj/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-9',
          titulo: 'Galería Cosmetología 9',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/17dtK-zvRd_VHlqRYPgLQ-RJEX2XtJxlq/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-10',
          titulo: 'Galería Cosmetología 10',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1xMoy_N002pDv3mR6ubB3Wbh-AdRyuVLj/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-11',
          titulo: 'Galería Cosmetología 11',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1jRyBM7jml-3uz6iLR3bKrICY4-5SMNAW/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-12',
          titulo: 'Galería Cosmetología 12',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1WWlLoJxj1pHA-mHWKyXwLhYH_9iSJ8cd/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-13',
          titulo: 'Galería Cosmetología 13',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1CoucVHk_ABYd27Rdwr3V-oYwR32vVEl_/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-14',
          titulo: 'Galería Cosmetología 14',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1jOp4ZvOUseoisRepWisipoUyXmfOszqO/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-15',
          titulo: 'Galería Cosmetología 15',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1Q7tSK_1qmNFK4nhOSfXHvd_Ya5ipHnQK/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-16',
          titulo: 'Galería Cosmetología 16',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1v4nceILyr_Be2KoQycLDxtD5LqLYbC37/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-17',
          titulo: 'Galería Cosmetología 17',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1LVH1_DmcYhWYwvZaTJHV1kq6CwQGg0dJ/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        },
        {
          id: 'cos-drive-18',
          titulo: 'Galería Cosmetología 18',
          alumnos: 'Academia de Cosmetología',
          semestre: 'Evidencia Estudiantil',
          tipo: 'foto',
          url_media: 'https://drive.google.com/file/d/1D-Gpsqx7k2zzvH9L5f9Hr_vIQsBUFOiV/view',
          descripcion: 'Fotografía de prácticas en cabina y trabajos realizados por alumnos de Cosmetología.'
        }
      ]
    },
    banco_reactivos: COSMETOLOGIA_DIAGNOSTICO_REACTIVOS
  }
};

export const OFICIO_CIRCULAR_DEFAULT: OficioCircular = {
  clave_oficio: 'DGETI/CDMX/CETIS007/SA/028/2026',
  asunto: 'Convocatoria y Lineamientos Operativos para la Feria de Especialidades e Innovación Tecnológica 2026',
  lugar_fecha: 'Ciudad de México, a 03 de Noviembre de 2026',
  destinatarios: 'A toda la Comunidad Escolar de 1.er Semestre, Presidentes de Academia, Docentes Tutores y Padres de Familia del CETis No. 7',
  cuerpo: [
    'Con fundamento en las directrices emitidas por la Dirección General de Educación Tecnológica Industrial y de Servicios (DGETI) relativas al fortalecimiento de la orientación vocacional y la elección informada de trayectoria técnica para el alumnado de primer semestre, se emite la presente CONVOCATORIA OFICIAL.',
    'La Feria de Especialidades e Innovación Tecnológica ciclo 2026 operará bajo un proceso digital integral en plataforma oficial:',
    '1. DIAGNÓSTICO VOCACIONAL (40 REACTIVOS): Los alumnos deberán registrarse con su Número de Control en la plataforma oficial y completar el Test Oficial de Orientación Vocacional organizado en 4 partes (Intereses, Actividades, Habilidades y Metas).',
    '2. EXPLORACIÓN DE ESPECIALIDADES: El alumnado revisará las infografías, videos didácticos, evidencias estudiantiles y responderá los cuestionarios diagnósticos de las cuatro carreras técnicas (Programación, Comercio Internacional y Aduanas, Recursos Humanos y Cosmetología).',
    '3. CONSTANCIA Y PASE DIGITAL QR FIRMADO POR TUTOR: Al alcanzar el 100% de avance en plataforma, el padre, madre o tutor legal validará su correo y firmará digitalmente para habilitar la impresión de la Constancia Digital QR Oficial.',
    'Se instruye a las Academias de Especialidad y al personal docente a brindar todas las facilidades didácticas requeridas conforme a la ficha técnica estandarizada.'
  ],
  firmante_nombre: 'Mtro. José Luis Rodríguez Arredondo',
  firmante_cargo: 'Subdirector Académico del CETis No. 7 "Miguel Lerdo de Tejada"',
  sello_oficial: 'CETIS 007 - SUBDIRECCIÓN ACADÉMICA - DGETI CDMX'
};

