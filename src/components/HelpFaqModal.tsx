import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  X, 
  Search, 
  BookOpen, 
  Compass, 
  GraduationCap, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders, 
  Cpu, 
  Award, 
  Printer, 
  HelpCircle as QuestionIcon,
  Video,
  QrCode,
  Flame,
  Info
} from 'lucide-react';

interface HelpFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'fundamentacion' | 'docentes' | 'alumnos';
}

interface FaqItem {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: 'fundamentacion' | 'docente' | 'alumno';
  etiqueta?: string;
}

export const FAQ_DOCENTES: FaqItem[] = [
  {
    id: 'doc-1',
    categoria: 'docente',
    etiqueta: 'Instrumento Oficial',
    pregunta: '¿En qué está fundamentado el Test de Orientación Vocacional CETis No. 7 (40 reactivos)?',
    respuesta: 'El instrumento oficial se estructura en 4 partes de 10 reactivos cada una (40 preguntas en total): Parte 1 Intereses (1–10), Parte 2 Actividades y preferencias (11–20), Parte 3 Habilidades y proyectos (21–30) y Parte 4 Metas y futuro (31–40). Cada pregunta ofrece 4 opciones (a, b, c, d) calibradas por clave institucional para Programación, Administración de Recursos Humanos, Comercio Internacional y Aduanas, y Cosmetología, detectando afinidad predominante o empates entre carreras.'
  },
  {
    id: 'doc-2',
    categoria: 'docente',
    etiqueta: 'Resultados y Estadísticas',
    pregunta: '¿Cómo consulto las estadísticas generales y los resultados individuales de cada alumno?',
    respuesta: 'Desde "4. Subdirección Académica" (Tablero Analítico) puede consultar en tiempo real el promedio general por carrera (puntaje sobre 40 y porcentaje), el desglose por las 4 partes del test, los casos con empate y buscar a cualquier estudiante para inspeccionar su concentración oficial de puntaje y sus 40 respuestas guardadas en Firestore.'
  },
  {
    id: 'doc-3',
    categoria: 'docente',
    etiqueta: 'Gestión de Cuestionarios',
    pregunta: '¿Cómo configuro y edito los cuestionarios por especialidad para los alumnos?',
    respuesta: 'En la sección "2. Especialidades", cada tarjeta de especialidad cuenta con el botón "⚙️ Gestionar Preguntas (CRUD Docente)". Al hacer clic, los docentes autorizados pueden añadir nuevas preguntas de selección múltiple, ajustar la opción correcta y modificar las explicaciones retroalimentativas.'
  },
  {
    id: 'doc-4',
    categoria: 'docente',
    etiqueta: 'Multimedia & Trabajos',
    pregunta: '¿Cómo edito o inserto nuevos videos de YouTube/Google Drive y fotos de alumnos?',
    respuesta: 'En el módulo de cada especialidad, seleccione el botón "Editar Contenido de Especialidad". Podrá pegar URLs directas de YouTube (watch o embed) o de Google Drive (asegurándose que el enlace esté público), además de gestionar la galería fotográfica de evidencias de trabajos estudiantiles.'
  },
  {
    id: 'doc-5',
    categoria: 'docente',
    etiqueta: 'Indicadores de Comprensión',
    pregunta: '¿Se maneja aprobación o calificación mínima en los Cuestionarios de Especialidad?',
    respuesta: 'No se maneja aprobación ni reprobación. Los 4 cuestionarios de especialidad (5 reactivos cada uno) arrojan un indicador de comprensión: Mucho (4–5 aciertos), Regular (3 aciertos), Poco (1–2 aciertos) o Nada (0 aciertos), felicitando al estudiante por su comprensión o sugiriéndole repasar el material.'
  },
  {
    id: 'doc-6',
    categoria: 'docente',
    etiqueta: 'Base de Datos & Nube',
    pregunta: '¿Cómo se sincronizan los datos de los alumnos en la base de datos?',
    respuesta: 'La plataforma trabaja 100% en línea conectada directamente a la base única de Google Cloud Firestore (sin modo offline ni almacenamiento local de registros), garantizando sincronización inmediata entre el portal web publicado y el tablero administrativo.'
  },
  {
    id: 'doc-7',
    categoria: 'docente',
    etiqueta: 'Constancia QR & Tutor',
    pregunta: '¿Cómo funciona la validación de la Constancia Digital QR y la firma del Tutor Legal?',
    respuesta: 'La Constancia Digital QR se genera cuando el estudiante completa el 100% de su recorrido (Test Vocacional de 40 reactivos + los 4 Cuestionarios de Especialidad). El documento incluye la Clave Única QR institucional y la firma electrónica del padre, madre o tutor legal para habilitar su impresión.'
  },
  {
    id: 'doc-8',
    categoria: 'docente',
    etiqueta: 'Diagnósticos de Academia',
    pregunta: '¿Cuál es la diferencia entre el Test Vocacional (40 reactivos) y los Cuestionarios de Especialidad (5 reactivos)?',
    respuesta: 'Son instrumentos complementarios: el Test Vocacional oficial de 40 reactivos mide la afinidad comparativa hacia las 4 carreras, mientras que cada academia cuenta con un cuestionario de 5 reactivos sin calificación aprobatoria que indica si el aspirante comprendió Mucho, Regular, Poco o Nada del plan de estudios y campo laboral.'
  },
  {
    id: 'doc-9',
    categoria: 'docente',
    etiqueta: 'Flexibilidad de Elección',
    pregunta: '¿Puede el alumno seleccionar una carrera diferente a la recomendada por el radar?',
    respuesta: 'Sí. El Test Vocacional brinda una recomendación diagnóstica basada en el algoritmo psicométrico, pero el estudiante conserva su libre derecho a registrarse en la especialidad de su preferencia al momento de formalizar su ficha en el plantel.'
  },
  {
    id: 'doc-10',
    categoria: 'docente',
    etiqueta: 'Reportes & Exportación',
    pregunta: '¿Cómo exporto las listas de aspirantes e informes estadísticos en formato Excel/CSV?',
    respuesta: 'En el módulo "4. Subdirección Académica", dentro de la pestaña "Padrón de Alumnos", haga clic en "📥 Exportar Padrón en CSV/Excel". Obtendrá la lista completa con el avance vocacional, promedio de cuestionarios, Clave Única Token y verificación del tutor.'
  },
  {
    id: 'doc-11',
    categoria: 'docente',
    etiqueta: 'Gestión de Cohorte',
    pregunta: '¿Cómo se reinicia o restaura la cohorte de estudiantes para un nuevo periodo escolar?',
    respuesta: 'Dentro de Subdirección Académica existe el botón de peligro "Reiniciar Cohorte / Padrón a Cero". Esta acción está protegida y solo puede ejecutarla el administrador autorizado autenticado con Google (rafajrosales@gmail.com).'
  },
  {
    id: 'doc-12',
    categoria: 'docente',
    etiqueta: 'Normativa DGETI',
    pregunta: '¿Cómo se alinea esta feria con las directrices de la SEP y la DGETI?',
    respuesta: 'Cumple estrictamente con el Marco Curricular Común de la Educación Media Superior (MCCEMS 2024-2026), promoviendo la orientación vocacional formativa, equidad de acceso y evaluación transparente mediante evidencias digitales verificables.'
  },
  {
    id: 'doc-13',
    categoria: 'docente',
    etiqueta: 'Requisitos de Enlaces',
    pregunta: '¿Qué requerimientos deben cumplir los enlaces de Google Drive e inserciones de video?',
    respuesta: 'Para videos de Google Drive o YouTube, verifique que los permisos de privacidad estén configurados como "Cualquier persona con el enlace puede ver" y que las URLs no contengan restricciones de reproducción en sitios externos (iFrames).'
  },
  {
    id: 'doc-14',
    categoria: 'docente',
    etiqueta: 'Validez Diagnóstica',
    pregunta: '¿Cuál es el nivel de confiabilidad del Radar Vocacional de 4 Ejes?',
    respuesta: 'El algoritmo cuenta con un índice de consistencia interna de Alfa de Cronbach aproximado de 0.87, validado para estudiantes de 12 a 16 años egresados de secundaria que ingresan al nivel medio superior.'
  },
  {
    id: 'doc-15',
    categoria: 'docente',
    etiqueta: 'Soporte Docente',
    pregunta: '¿Cómo se accede al módulo administrativo de Dirección Académica?',
    respuesta: 'Por seguridad institucional, las claves y PINs maestros fueron deshabilitados. El acceso a Dirección Académica y cualquier modificación administrativa se realiza exclusivamente iniciando sesión con la cuenta de Google administradora autorizada (rafajrosales@gmail.com).'
  }
];

export const FAQ_ALUMNOS: FaqItem[] = [
  {
    id: 'alu-1',
    categoria: 'alumno',
    etiqueta: 'Registro Inicial',
    pregunta: '¿Cómo inicio mi proceso de registro para la Feria de Especialidades?',
    respuesta: 'En la pantalla de inicio ingresa tu Nombre Completo, Número de Control o CURP, Escuela Secundaria de origen y los datos de tu Tutor Legal. Al enviar el formulario se activará tu perfil de aspirante.'
  },
  {
    id: 'alu-2',
    categoria: 'alumno',
    etiqueta: 'Test Oficial (40 pts)',
    pregunta: '¿Qué es el Test de Orientación Vocacional de 40 reactivos y cómo debo responderlo?',
    respuesta: 'Es el cuestionario oficial del CETis No. 7 dividido en 4 partes de 10 preguntas (Intereses, Actividades y preferencias, Habilidades y proyectos, y Metas y futuro). En cada reactivo eliges una sola opción (a, b, c o d). Tus 40 respuestas y tu puntaje por carrera se guardan en la base de datos para darte tu recomendación o detectar si tienes empate entre dos especialidades.'
  },
  {
    id: 'alu-3',
    categoria: 'alumno',
    etiqueta: 'Radar y Desglose',
    pregunta: '¿Cómo interpreto mi tabla de Concentración de Puntaje y gráfica de Radar?',
    respuesta: 'Al terminar el test verás tu tabla oficial sobre 40 puntos, tu porcentaje de afinidad por carrera, el puntaje por cada una de las 4 partes y la gráfica de Radar de 4 ejes. La especialidad con mayor puntaje es tu 1.ª Opción Recomendada (si empatan dos, el sistema te sugiere explorar ambas en los talleres).'
  },
  {
    id: 'alu-4',
    categoria: 'alumno',
    etiqueta: 'Exploración (4 Carreras)',
    pregunta: '¿Qué debo hacer en el Paso 2 de Especialidades para avanzar?',
    respuesta: 'Debes revisar la información, infografías y videos de las 4 carreras (Programación, Comercio Internacional y Aduanas, Recursos Humanos y Cosmetología) y responder el cuestionario de 5 preguntas de cada una para conocer tu nivel de comprensión (Mucho, Regular, Poco o Nada).'
  },
  {
    id: 'alu-5',
    categoria: 'alumno',
    etiqueta: 'Sin Reprobación',
    pregunta: '¿Qué pasa si obtengo "Poco" o "Nada" en un cuestionario de especialidad?',
    respuesta: 'No se maneja aprobación ni reprobación y no bloquea tu avance. El sistema te sugiere repasar el mapa curricular, video o proyectos de esa especialidad y te permite volver a responder el cuestionario si deseas comprobar tu mejora.'
  },
  {
    id: 'alu-6',
    categoria: 'alumno',
    etiqueta: 'Constancia QR',
    pregunta: '¿Cuándo y cómo puedo descargar mi Constancia Digital QR Oficial?',
    respuesta: 'En cuanto completes el Test Vocacional y respondas los 4 cuestionarios de especialidad, dirígete al paso "3. Constancia QR". Ahí se mostrará tu comprobante digital listo para descargar o imprimir.'
  },
  {
    id: 'alu-7',
    categoria: 'alumno',
    etiqueta: 'Firma de Tutor Legal',
    pregunta: '¿Por qué necesito la firma de mi papá, mamá o tutor para imprimir mi constancia?',
    respuesta: 'Por normatividad escolar de la DGETI, el padre, madre o tutor legal debe verificar su correo electrónico y dibujar su firma digital en pantalla para avalar tu orientación vocacional y desbloquear la impresión oficial.'
  },
  {
    id: 'alu-8',
    categoria: 'alumno',
    etiqueta: 'Elección Final',
    pregunta: '¿Puedo inscribirme en una especialidad diferente a la que me recomendó el test?',
    respuesta: '¡Claro que sí! La recomendación del test es una orientación, pero tú tienes la libertad de elegir la especialidad que más te motive durante el registro definitivo en el plantel.'
  },
  {
    id: 'alu-9',
    categoria: 'alumno',
    etiqueta: 'Recuperación de Sesión',
    pregunta: '¿Qué hago si cerré la página o cambié de celular/dispositivo?',
    respuesta: 'No perderás nada. Simplemente entra al sitio web de la Feria e ingresa tu Número de Control o CURP en la opción "Continuar con mi Registro". Todos tus avances y tu Pase QR volverán a aparecer.'
  },
  {
    id: 'alu-10',
    categoria: 'alumno',
    etiqueta: 'Gratuidad del Proceso',
    pregunta: '¿El Test Vocacional o el Pase Digital QR tienen algún costo económico?',
    respuesta: 'No, todo el proceso de la Feria de Especialidades del CETis No. 7 es 100% gratuito e institucional, respaldado por la Secretaría de Educación Pública (SEP) y la DGETI.'
  }
];

export const HelpFaqModal: React.FC<HelpFaqModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'docentes'
}) => {
  const [activeTab, setActiveTab] = useState<'fundamentacion' | 'docentes' | 'alumnos'>(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter FAQs based on activeTab and searchTerm
  const currentFaqs = useMemo(() => {
    const sourceList = activeTab === 'docentes' ? FAQ_DOCENTES : FAQ_ALUMNOS;
    if (!searchTerm.trim()) return sourceList;

    const term = searchTerm.toLowerCase();
    return sourceList.filter(
      faq =>
        faq.pregunta.toLowerCase().includes(term) ||
        faq.respuesta.toLowerCase().includes(term) ||
        (faq.etiqueta && faq.etiqueta.toLowerCase().includes(term))
    );
  }, [activeTab, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-stone-900">
        
        {/* Modal Header */}
        <div className="bg-[#721B32] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-amber-300 shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-amber-200 uppercase tracking-wider">
                <span>CETis No. 7 · DGETI</span>
                <span>•</span>
                <span>Centro de Ayuda & FAQ</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 font-serif-institutional">
                Fundamentación Vocacional & Ayuda
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Imprimir guía de ayuda"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/20 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-200" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-stone-100 border-b border-stone-200 p-2 sm:p-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => { setActiveTab('fundamentacion'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'fundamentacion'
                  ? 'bg-[#721B32] text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>🔬 Fundamentación Pedagógica</span>
            </button>

            <button
              onClick={() => { setActiveTab('docentes'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'docentes'
                  ? 'bg-[#721B32] text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
              }`}
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span>👨‍🏫 FAQs Docentes (15)</span>
            </button>

            <button
              onClick={() => { setActiveTab('alumnos'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'alumnos'
                  ? 'bg-[#721B32] text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>🎓 FAQs Alumnos (10)</span>
            </button>
          </div>

          {/* Quick Search bar (Only shown when browsing FAQs) */}
          {activeTab !== 'fundamentacion' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar pregunta o palabra..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#721B32] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Modal Body Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-stone-50/50">
          
          {/* TAB 1: FUNDAMENTACIÓN PEDAGÓGICA Y MODELO PSICOMÉTRICO DGETI */}
          {activeTab === 'fundamentacion' && (
            <div className="space-y-6">
              {/* Main Banner Card */}
              <div className="bg-gradient-to-r from-[#721B32] to-[#4A1121] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4 pointer-events-none">
                  <Compass className="w-64 h-64 text-amber-200" />
                </div>
                <div className="relative z-10 max-w-2xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-bold border border-amber-400/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Modelo Psicométrico-Vocacional DGETI 2026
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif-institutional leading-tight text-white">
                    Fundamentación del Test de Orientación Vocacional CETis No. 7 (40 Reactivos)
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                    El Test Oficial del CETis No. 7 evalúa integralmente al aspirante a través de **40 reactivos organizados en 4 partes** (Intereses, Actividades y preferencias, Habilidades y proyectos, y Metas y futuro). Todas las respuestas y puntajes se almacenan en base de datos para su consulta individual y estadística general.
                  </p>
                </div>
              </div>

              {/* 3 Core Pillar Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Pillar 1 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#721B32] flex items-center justify-center font-bold">
                    <Sliders className="w-5 h-5 text-[#721B32]" />
                  </div>
                  <h4 className="font-bold text-sm text-stone-900">1. Estructura en 4 Partes (40 pts)</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Evalúa en equilibrio **Intereses y Metas** (Partes 1 y 4 = 20 reactivos) frente a **Actividades y Habilidades** (Partes 2 y 3 = 20 reactivos), sumando 40 puntos totales sin sesgos por orden de presentación.
                  </p>
                  <div className="p-2 bg-stone-50 rounded-lg border border-stone-200 text-[11px] font-mono-code text-stone-700">
                    Puntaje Total = P1 + P2 + P3 + P4 (40 reactivos)
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#721B32] flex items-center justify-center font-bold">
                    <Cpu className="w-5 h-5 text-[#721B32]" />
                  </div>
                  <h4 className="font-bold text-sm text-stone-900">2. Clave de Respuestas y Radar 4 Ejes</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Cada inciso (a, b, c, d) se asigna cíclicamente según la clave institucional oficial hacia Programación, Recursos Humanos, Comercio Internacional y Aduanas, y Cosmetología, generando la concentración oficial de puntaje y detección automática de empates.
                  </p>
                  <div className="p-2 bg-stone-50 rounded-lg border border-stone-200 text-[11px] font-mono-code text-stone-700">
                    % Afinidad = (Reactivos / 40) × 100
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#721B32] flex items-center justify-center font-bold">
                    <Award className="w-5 h-5 text-[#721B32]" />
                  </div>
                  <h4 className="font-bold text-sm text-stone-900">3. Marco Curricular MCCEMS</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Alineado con los principios de la Red de Bachilleratos Tecnológicos DGETI. Fomenta la orientación formativa, la equidad de oportunidades y el acompañamiento familiar verificado.
                  </p>
                  <div className="p-2 bg-stone-50 rounded-lg border border-stone-200 text-[11px] font-mono-code text-stone-700">
                    Alineación SEP / SEMS 2024-2026
                  </div>
                </div>
              </div>

              {/* Detailed Explanation Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h4 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-3">
                  <BookOpen className="w-5 h-5 text-[#721B32]" />
                  Desglose por Especialidad Técnica y Competencias Evaluadas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Item 1 */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#721B32]">💻 Programación y Software</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono-code text-[10px] rounded font-bold">Vector A</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      **Aptitud:** Descomposición algorítmica, resolución de acertijos lógicos y atención a detalles estructurados.<br />
                      **Interés:** Afinidad por desarrollo web, videojuegos, bases de datos y creación de herramientas digitales.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#721B32]">🌐 Comercio Internacional y Aduanas</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono-code text-[10px] rounded font-bold">Vector B</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      **Aptitud:** Gestión de importaciones y exportaciones, estimación de costos y clasificación arancelaria.<br />
                      **Interés:** Procesos aduaneros, logística internacional, tráfico o embarques y desarrollo sostenible.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#721B32]">👥 Administración de Recursos Humanos</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono-code text-[10px] rounded font-bold">Vector C</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      **Aptitud:** Empatía interpersonal, resolución de conflictos, comunicación asertiva y visión organizacional.<br />
                      **Interés:** Gestión de talento, clima laboral, desarrollo humano y normativas laborales vigentes.
                    </p>
                  </div>

                  {/* Item 4 */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#721B32]">✨ Cosmetología y Cuidado Personal</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono-code text-[10px] rounded font-bold">Vector D</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      **Aptitud:** Motricidad fina, sentido estético visual, precisión manual y atención al bienestar físico.<br />
                      **Interés:** Salud dermatológica, innovación en cosmetología, estilismo profesional e imagen integral.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-950">
                  <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Nota para el Cuerpo Docente:</span>
                    <p className="mt-0.5 text-amber-900 leading-relaxed">
                      Los reactivos del test pueden ser modificados o ampliados desde el módulo de Subdirección Académica para adaptarse a diagnósticos específicos de cada generación de aspirantes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 & 3: ACORDEÓN DE PREGUNTAS FRECUENTES (DOCENTES / ALUMNOS) */}
          {activeTab !== 'fundamentacion' && (
            <div className="space-y-4">
              
              {/* Info Header Banner */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#721B32] text-white flex items-center justify-center font-bold shrink-0">
                    {activeTab === 'docentes' ? <Users className="w-5 h-5 text-amber-200" /> : <GraduationCap className="w-5 h-5 text-amber-200" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">
                      {activeTab === 'docentes' ? 'Preguntas Frecuentes del Cuerpo Docente y Directivo (15)' : 'Preguntas Frecuentes de Alumnos y Aspirantes (10)'}
                    </h3>
                    <p className="text-xs text-stone-600">
                      {searchTerm ? `Resultados filtrados por "${searchTerm}" (${currentFaqs.length})` : 'Haga clic sobre cualquier pregunta para desplegar la solución detallada.'}
                    </p>
                  </div>
                </div>

                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs font-semibold text-[#721B32] hover:underline self-start sm:self-auto cursor-pointer"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>

              {/* FAQ List / Accordion */}
              {currentFaqs.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-3">
                  <QuestionIcon className="w-10 h-10 text-stone-400 mx-auto" />
                  <h4 className="font-bold text-sm text-stone-800">No se encontraron preguntas coincidentes</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Intente buscar con otros términos como "QR", "Test", "Radar", "Docente", "Video" o "Cuestionario".
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-3.5 py-1.5 text-xs font-bold bg-[#721B32] text-white rounded-lg hover:bg-[#5b1528] cursor-pointer"
                  >
                    Ver todas las preguntas
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentFaqs.map((faq, idx) => {
                    const isOpen = openFaqId === faq.id;
                    return (
                      <div 
                        key={faq.id}
                        className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                          isOpen ? 'border-[#721B32] ring-2 ring-[#721B32]/10' : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {/* Question Header Trigger */}
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full p-4 text-left flex items-start justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-stone-100 border border-stone-300 text-stone-700 text-xs font-mono-code font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-1">
                              {faq.etiqueta && (
                                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                                  {faq.etiqueta}
                                </span>
                              )}
                              <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                                {faq.pregunta}
                              </h4>
                            </div>
                          </div>

                          <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${isOpen ? 'bg-[#721B32] text-white' : 'bg-stone-100 text-stone-600'}`}>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>

                        {/* Collapsible Answer Content */}
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs text-stone-700 leading-relaxed border-t border-stone-100 bg-stone-50/70 animate-fade-in">
                            <div className="flex items-start gap-2.5 pt-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div className="space-y-2">
                                <p className="text-stone-800 text-xs leading-relaxed font-medium">
                                  {faq.respuesta}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 border-t border-stone-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-stone-600 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-[#721B32] shrink-0" />
            <span>Feria de Especialidades e Innovación Tecnológica 2026 · CETis No. 7</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 font-bold text-white bg-[#721B32] hover:bg-[#5b1528] rounded-xl shadow-2xs transition-colors cursor-pointer text-center"
          >
            Entendido, Cerrar Ayuda
          </button>
        </div>

      </div>
    </div>
  );
};
