import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { SpecialtyId } from '../types';
import { TEST_VOCACIONAL_PARTES } from '../data/mockData';
import { 
  getProgresoVirtual, 
  sincronizarBaseDeDatosCETis7,
  subscribeDbStore,
  getDbStoreSnapshot,
  ResultadoSyncBD
} from '../services/storage';
import { hasVerifiedFirebaseUser, signInWithGooglePopup } from '../services/firebase';
import { deriveVocationalMetrics } from '../utils/vocationalMetrics';
import { VocationalResultDetails } from './VocationalResultDetails';
import { VocationalRadar } from './VocationalRadar';
import { resolveNivelComprension, COMPRENSION_META } from '../utils/comprension';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Users, 
  Filter, 
  Compass, 
  Layers,
  ShieldCheck,
  ClipboardCheck,
  Database,
  RefreshCw,
  Search,
  Eye,
  Scale
} from 'lucide-react';

export const MatriculaDashboard: React.FC = () => {
  const dbSnapshot = useSyncExternalStore(subscribeDbStore, getDbStoreSnapshot);

  const [selectedTurno, setSelectedTurno] = useState<string>('TODOS');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('TODOS');
  const [activeChartMode, setActiveChartMode] = useState<'ambos' | 'vocacional' | 'especialidades'>('ambos');
  const [syncingBD, setSyncingBD] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<ResultadoSyncBD | null>(null);
  const [selectedStudentNC, setSelectedStudentNC] = useState<string>('');
  const [searchIndividual, setSearchIndividual] = useState<string>('');

  const handleSincronizarBD = async (promptAuth = false) => {
    setSyncingBD(true);
    try {
      if (promptAuth && !hasVerifiedFirebaseUser()) {
        await signInWithGooglePopup();
      }
      const res = await sincronizarBaseDeDatosCETis7();
      setSyncStatus(res);
    } finally {
      setSyncingBD(false);
    }
  };

  const todosEstudiantes = dbSnapshot.estudiantes;

  // Filter students based on selection
  const estudiantesFiltrados = useMemo(() => {
    return todosEstudiantes.filter(est => {
      const matchTurno = selectedTurno === 'TODOS' || est.turno === selectedTurno;
      const matchGrupo = selectedGrupo === 'TODOS' || est.grupo === selectedGrupo;
      return matchTurno && matchGrupo;
    });
  }, [todosEstudiantes, selectedTurno, selectedGrupo]);

  const totalMatricula = estudiantesFiltrados.length;

  // Compute metrics for the filtered cohort
  const metrics = useMemo(() => {
    let testCompletados = 0;
    let virtualCompletados100 = 0;
    let virtualEnProceso = 0;
    let virtualPendientes = 0;
    let tutoresVerificados = 0;

    // Per specialty stats:
    // 1. How many approved the reading quiz for each career
    // 2. How many have 100% virtual completed with that career as suggested
    const especialidadesStats: Record<SpecialtyId, {
      nombre: string;
      color: string;
      quizEvaluados: number;
      compMucho: number;
      compRegular: number;
      compPoco: number;
      compNada: number;
      sumaCalificaciones: number;
      finalizadosConSugerida: number;
    }> = {
      programacion: { nombre: 'Programación', color: '#1d4ed8', quizEvaluados: 0, compMucho: 0, compRegular: 0, compPoco: 0, compNada: 0, sumaCalificaciones: 0, finalizadosConSugerida: 0 },
      comercio: { nombre: 'Comercio Int. y Aduanas', color: '#047857', quizEvaluados: 0, compMucho: 0, compRegular: 0, compPoco: 0, compNada: 0, sumaCalificaciones: 0, finalizadosConSugerida: 0 },
      rrhh: { nombre: 'Recursos Humanos', color: '#7c3aed', quizEvaluados: 0, compMucho: 0, compRegular: 0, compPoco: 0, compNada: 0, sumaCalificaciones: 0, finalizadosConSugerida: 0 },
      cosmetologia: { nombre: 'Cosmetología', color: '#be185d', quizEvaluados: 0, compMucho: 0, compRegular: 0, compPoco: 0, compNada: 0, sumaCalificaciones: 0, finalizadosConSugerida: 0 }
    };

    // By group breakdown
    const gruposList = ['1°A', '1°B', '1°C', '1°D', '1°E', '1°F'];
    const gruposStats: Record<string, { total: number; testCompletados: number; virtualFinalizados: number; tutoresVerificados: number }> = {};
    gruposList.forEach(g => {
      gruposStats[g] = { total: 0, testCompletados: 0, virtualFinalizados: 0, tutoresVerificados: 0 };
    });

    // Pipeline funnel counts
    let pipelineExploraronModulos = 0;
    let pipelineEmitieronToken = 0;

    // 40-Question Vocational Orientation Test General Cohort Analytics
    let voc40Evaluados = 0;
    let voc40Empates = 0;
    const voc40Sugeridas: Record<SpecialtyId, number> = {
      programacion: 0,
      rrhh: 0,
      comercio: 0,
      cosmetologia: 0
    };
    const voc40SumaPuntajes: Record<SpecialtyId, number> = {
      programacion: 0,
      rrhh: 0,
      comercio: 0,
      cosmetologia: 0
    };
    const voc40PartesDominantes: Record<1 | 2 | 3 | 4, Record<SpecialtyId, number>> = {
      1: { programacion: 0, rrhh: 0, comercio: 0, cosmetologia: 0 },
      2: { programacion: 0, rrhh: 0, comercio: 0, cosmetologia: 0 },
      3: { programacion: 0, rrhh: 0, comercio: 0, cosmetologia: 0 },
      4: { programacion: 0, rrhh: 0, comercio: 0, cosmetologia: 0 }
    };

    estudiantesFiltrados.forEach(est => {
      const prog = dbSnapshot.progresos[est.num_control] || getProgresoVirtual(est.num_control);
      const evalVoc = dbSnapshot.evaluaciones[est.num_control] || null;

      // Tutor verification check
      const hasTutorVerified = est.tutor?.verificado === true;
      if (hasTutorVerified) {
        tutoresVerificados++;
      }

      // Group stat accumulation
      if (gruposStats[est.grupo]) {
        gruposStats[est.grupo].total++;
        if (prog.test_vocacional_completado) gruposStats[est.grupo].testCompletados++;
        if (prog.estatus_fase_virtual === 'COMPLETADO') gruposStats[est.grupo].virtualFinalizados++;
        if (hasTutorVerified) gruposStats[est.grupo].tutoresVerificados++;
      }

      // Test vocacional status
      if (prog.test_vocacional_completado) {
        testCompletados++;
      }

      // Virtual phase status
      if (prog.estatus_fase_virtual === 'COMPLETADO' && prog.porcentaje_virtual >= 100) {
        virtualCompletados100++;
        pipelineEmitieronToken++;
      } else if (prog.porcentaje_virtual > 0) {
        virtualEnProceso++;
      } else {
        virtualPendientes++;
      }

      // Check quiz comprehension level per career (no pass/fail threshold)
      const careers: SpecialtyId[] = ['programacion', 'comercio', 'rrhh', 'cosmetologia'];
      let quizesRespondedCount = 0;
      careers.forEach(c => {
        const sp = prog.progreso_especialidades[c];
        const evaluated = Boolean(sp && (sp.quiz_aprobado || (sp.puntaje_maximo ?? 0) > 0 || (sp.calificacion_quiz ?? 0) > 0));
        if (evaluated && sp) {
          especialidadesStats[c].quizEvaluados++;
          especialidadesStats[c].sumaCalificaciones += sp.calificacion_quiz || 0;
          quizesRespondedCount++;
          const nivel = resolveNivelComprension(sp);
          if (nivel === 'MUCHO') especialidadesStats[c].compMucho++;
          else if (nivel === 'REGULAR') especialidadesStats[c].compRegular++;
          else if (nivel === 'POCO') especialidadesStats[c].compPoco++;
          else especialidadesStats[c].compNada++;
        }
      });

      if (quizesRespondedCount > 0) {
        pipelineExploraronModulos++;
      }

      // Career suggested for students who finished 100% virtual
      if (prog.estatus_fase_virtual === 'COMPLETADO' && evalVoc?.carrera_sugerida) {
        if (especialidadesStats[evalVoc.carrera_sugerida]) {
          especialidadesStats[evalVoc.carrera_sugerida].finalizadosConSugerida++;
        }
      }

      // Accumulate 40-question general vocational analytics for EVERY evaluated student
      if (evalVoc) {
        voc40Evaluados++;
        if ((evalVoc.especialidades_empatadas?.length ?? 0) > 1) {
          voc40Empates++;
        }
        if (evalVoc.carrera_sugerida) {
          voc40Sugeridas[evalVoc.carrera_sugerida]++;
        }
        const ptsMap = deriveVocationalMetrics(evalVoc).puntajes;
        careers.forEach(c => {
          voc40SumaPuntajes[c] += ptsMap[c] || 0;
        });

        if (evalVoc.desglose_partes) {
          const pMap = [
            { num: 1 as const, data: evalVoc.desglose_partes.parte1_intereses },
            { num: 2 as const, data: evalVoc.desglose_partes.parte2_actividades },
            { num: 3 as const, data: evalVoc.desglose_partes.parte3_habilidades },
            { num: 4 as const, data: evalVoc.desglose_partes.parte4_metas }
          ];
          pMap.forEach(({ num, data }) => {
            careers.forEach(c => {
              voc40PartesDominantes[num][c] += data?.[c] || 0;
            });
          });
        }
      }
    });

    const pctTest = totalMatricula > 0 ? Math.round((testCompletados / totalMatricula) * 100) : 0;
    const pctVirtual = totalMatricula > 0 ? Math.round((virtualCompletados100 / totalMatricula) * 100) : 0;
    const pctTutores = totalMatricula > 0 ? Math.round((tutoresVerificados / totalMatricula) * 100) : 0;

    return {
      testCompletados,
      testPendientes: totalMatricula - testCompletados,
      pctTest,
      virtualCompletados100,
      virtualEnProceso,
      virtualPendientes,
      pctVirtual,
      tutoresVerificados,
      tutoresPendientes: totalMatricula - tutoresVerificados,
      pctTutores,
      especialidadesStats,
      gruposStats,
      vocacional40: {
        evaluados: voc40Evaluados,
        empates: voc40Empates,
        sugeridas: voc40Sugeridas,
        promedioPuntos: {
          programacion: voc40Evaluados > 0 ? Number((voc40SumaPuntajes.programacion / voc40Evaluados).toFixed(1)) : 0,
          rrhh: voc40Evaluados > 0 ? Number((voc40SumaPuntajes.rrhh / voc40Evaluados).toFixed(1)) : 0,
          comercio: voc40Evaluados > 0 ? Number((voc40SumaPuntajes.comercio / voc40Evaluados).toFixed(1)) : 0,
          cosmetologia: voc40Evaluados > 0 ? Number((voc40SumaPuntajes.cosmetologia / voc40Evaluados).toFixed(1)) : 0
        },
        promedioPorcentajes: {
          programacion: voc40Evaluados > 0 ? Math.round(((voc40SumaPuntajes.programacion / voc40Evaluados) / 40) * 100) : 0,
          rrhh: voc40Evaluados > 0 ? Math.round(((voc40SumaPuntajes.rrhh / voc40Evaluados) / 40) * 100) : 0,
          comercio: voc40Evaluados > 0 ? Math.round(((voc40SumaPuntajes.comercio / voc40Evaluados) / 40) * 100) : 0,
          cosmetologia: voc40Evaluados > 0 ? Math.round(((voc40SumaPuntajes.cosmetologia / voc40Evaluados) / 40) * 100) : 0
        },
        partesPromedio: ([1, 2, 3, 4] as const).map(num => ({
          parteId: num,
          titulo: TEST_VOCACIONAL_PARTES[num - 1].titulo,
          promedios: {
            programacion: voc40Evaluados > 0 ? Number((voc40PartesDominantes[num].programacion / voc40Evaluados).toFixed(1)) : 0,
            rrhh: voc40Evaluados > 0 ? Number((voc40PartesDominantes[num].rrhh / voc40Evaluados).toFixed(1)) : 0,
            comercio: voc40Evaluados > 0 ? Number((voc40PartesDominantes[num].comercio / voc40Evaluados).toFixed(1)) : 0,
            cosmetologia: voc40Evaluados > 0 ? Number((voc40PartesDominantes[num].cosmetologia / voc40Evaluados).toFixed(1)) : 0
          }
        }))
      },
      funnel: [
        { label: 'Matrícula Padrón', count: totalMatricula, pct: 100, color: 'bg-stone-600' },
        { label: 'Test Vocacional Listo (40 Reactivos)', count: testCompletados, pct: pctTest, color: 'bg-[#721B32]' },
        { label: 'Módulos en Exploración', count: pipelineExploraronModulos, pct: totalMatricula > 0 ? Math.round((pipelineExploraronModulos / totalMatricula) * 100) : 0, color: 'bg-blue-600' },
        { label: 'Orientación 100% Concluida (Token QR)', count: virtualCompletados100, pct: pctVirtual, color: 'bg-emerald-600' },
        { label: 'Consentimiento & Firma de Tutor (Constancia Imprimible)', count: tutoresVerificados, pct: pctTutores, color: 'bg-indigo-600' }
      ]
    };
  }, [estudiantesFiltrados, totalMatricula, dbSnapshot.progresos, dbSnapshot.evaluaciones]);

  // Max value for bar chart scaling
  const maxBarValue = Math.max(
    totalMatricula,
    1,
    ...Object.values(metrics.especialidadesStats).map(s => Math.max(s.quizEvaluados, s.finalizadosConSugerida))
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner & Filter Controls */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#721B32] uppercase tracking-wider">Tablero de Control Académico</span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-stone-500 font-mono-code">DGETI · CETis No. 7</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-semibold border ${
                dbSnapshot.connected && dbSnapshot.online && !dbSnapshot.syncError
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <Database className="w-3 h-3" />
                {dbSnapshot.connected && dbSnapshot.online && !dbSnapshot.syncError
                  ? `Base Única Firebase En Línea (${Object.keys(dbSnapshot.evaluaciones).length} eval.)`
                  : syncStatus?.requiresAuth
                  ? 'Requiere Google Auth para Firestore'
                  : 'Sin enlace a Firebase Firestore'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">
              Progreso General de la Matrícula Estudiantil
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Monitoreo analítico en base de datos: Test de Orientación Vocacional (40 Reactivos) y Conclusión de Orientación por Especialidad Técnica.
            </p>
          </div>

          {/* Interactive Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSincronizarBD(true)}
              disabled={syncingBD}
              className="px-2.5 py-1.5 text-xs font-bold text-[#721B32] bg-[#721B32]/10 hover:bg-[#721B32]/20 border border-[#721B32]/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Conectar cuenta Google y sincronizar resultados en tiempo real desde Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingBD ? 'animate-spin' : ''}`} />
              <span>
                {syncingBD
                  ? 'Sincronizando...'
                  : syncStatus?.requiresAuth
                  ? 'Conectar Google y Sincronizar'
                  : 'Actualizar BD Firestore'}
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <span>Filtros:</span>
            </div>

            {/* Turno Filter */}
            <select
              value={selectedTurno}
              onChange={e => setSelectedTurno(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-stone-300 rounded-lg bg-stone-50 text-stone-800 focus:bg-white focus:outline-none"
            >
              <option value="TODOS">Todos los Turnos</option>
              <option value="MATUTINO">Turno Matutino</option>
              <option value="VESPERTINO">Turno Vespertino</option>
            </select>

            {/* Grupo Filter */}
            <select
              value={selectedGrupo}
              onChange={e => setSelectedGrupo(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-stone-300 rounded-lg bg-stone-50 text-stone-800 focus:bg-white focus:outline-none font-mono-code"
            >
              <option value="TODOS">Todos los Grupos</option>
              <option value="1°A">Grupo 1°A</option>
              <option value="1°B">Grupo 1°B</option>
              <option value="1°C">Grupo 1°C</option>
              <option value="1°D">Grupo 1°D</option>
              <option value="1°E">Grupo 1°E</option>
              <option value="1°F">Grupo 1°F</option>
            </select>

            {/* Chart Mode view buttons */}
            <div className="flex items-center border border-stone-200 rounded-lg p-0.5 bg-stone-100 text-xs font-medium">
              <button
                onClick={() => setActiveChartMode('ambos')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeChartMode === 'ambos' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Vista Integral
              </button>
              <button
                onClick={() => setActiveChartMode('vocacional')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeChartMode === 'vocacional' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Test Vocacional
              </button>
              <button
                onClick={() => setActiveChartMode('especialidades')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeChartMode === 'especialidades' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Por Especialidad
              </button>
            </div>
          </div>
        </div>

        {/* 5 Summary Stat Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between text-stone-500 text-[11px] uppercase tracking-wider font-semibold">
              <span>Matrícula Filtrada</span>
              <Users className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <div className="text-2xl font-bold font-mono-code text-stone-900 mt-1">
              {totalMatricula} <span className="text-xs font-normal text-stone-500">alumnos</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5 font-mono-code">
              Turno: {selectedTurno} · {selectedGrupo}
            </div>
          </div>

          <div className="p-3.5 bg-[#721B32]/5 rounded-xl border border-[#721B32]/20">
            <div className="flex items-center justify-between text-[#721B32] text-[11px] uppercase tracking-wider font-semibold">
              <span>Test Vocacional Listo</span>
              <Compass className="w-3.5 h-3.5 text-[#721B32]" />
            </div>
            <div className="text-2xl font-bold font-mono-code text-[#721B32] mt-1">
              {metrics.testCompletados} <span className="text-xs font-medium text-[#721B32]">({metrics.pctTest}%)</span>
            </div>
            <div className="text-[11px] text-[#721B32]/80 mt-0.5 font-mono-code">
              {metrics.testPendientes} alumnos pendientes
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-800 text-[11px] uppercase tracking-wider font-semibold">
              <span>Avance 100% Listo</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono-code text-emerald-700 mt-1">
              {metrics.virtualCompletados100} <span className="text-xs font-medium text-emerald-600">({metrics.pctVirtual}%)</span>
            </div>
            <div className="text-[11px] text-emerald-800 mt-0.5 font-mono-code">
              Constancia QR emitida
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between text-indigo-900 text-[11px] uppercase tracking-wider font-semibold">
              <span>Tutores Firmados</span>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono-code text-indigo-800 mt-1">
              {metrics.tutoresVerificados} <span className="text-xs font-medium text-indigo-600">({metrics.pctTutores}%)</span>
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5 font-mono-code flex items-center gap-1">
              <span>Habilita impresión de pase</span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-blue-800 text-[11px] uppercase tracking-wider font-semibold">
              <span>En Proceso</span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono-code text-blue-700 mt-1">
              {metrics.virtualEnProceso} <span className="text-xs font-normal text-blue-600">alumnos</span>
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5 font-mono-code">
              Resolviendo módulos
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Estadísticas Generales e Individuales del Test Vocacional (40 Reactivos) */}
      {(activeChartMode === 'ambos' || activeChartMode === 'vocacional') && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#721B32]" />
                  Estadísticas Generales · Test de Orientación Vocacional (40 Reactivos)
                </span>
                <h4 className="text-base font-bold text-stone-900 mt-0.5">
                  Cobertura, Preferencia de Especialidades y Tendencia por Parte (P1–P4)
                </h4>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#721B32] inline-block"></span>
                  <span className="text-stone-700">Completado ({metrics.testCompletados})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-stone-300 inline-block"></span>
                  <span className="text-stone-700">Pendiente ({metrics.testPendientes})</span>
                </div>
                {metrics.vocacional40.empates > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
                    <Scale className="w-3 h-3" />
                    {metrics.vocacional40.empates} empate(s) técnico(s)
                  </span>
                )}
              </div>
            </div>

            {/* Bar Chart 1A: Global Cohort Comparison */}
            <div className="space-y-4">
              <div className="bg-stone-50/60 p-4 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-stone-800">
                    Progreso Global de Aplicación ({selectedTurno} · {selectedGrupo})
                  </span>
                  <span className="font-mono-code font-bold text-[#721B32] text-sm">
                    {metrics.testCompletados} de {totalMatricula} ({metrics.pctTest}%)
                  </span>
                </div>

                {/* Stacked Proportional Bar */}
                <div className="h-7 w-full bg-stone-200 rounded-lg overflow-hidden flex shadow-2xs border border-stone-300">
                  <div
                    className="h-full bg-[#721B32] flex items-center justify-center text-white text-xs font-bold font-mono-code transition-all duration-500"
                    style={{ width: `${metrics.pctTest}%` }}
                    title={`Completados: ${metrics.testCompletados} alumnos (${metrics.pctTest}%)`}
                  >
                    {metrics.pctTest > 15 ? `${metrics.pctTest}% Completado` : `${metrics.pctTest}%`}
                  </div>
                  <div
                    className="h-full bg-stone-300 flex items-center justify-center text-stone-700 text-xs font-bold font-mono-code transition-all duration-500"
                    style={{ width: `${100 - metrics.pctTest}%` }}
                    title={`Pendientes: ${metrics.testPendientes} alumnos (${100 - metrics.pctTest}%)`}
                  >
                    {100 - metrics.pctTest > 15 ? `${100 - metrics.pctTest}% Pendiente` : ''}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 font-mono-code">
                  <span>0 alumnos</span>
                  <span>Meta Institucional DGETI: 100% de 1.er Semestre</span>
                  <span>{totalMatricula} alumnos</span>
                </div>
              </div>

              {/* 40-Question General Cohort Breakdown: Primary Choice + Average Affinity / 40 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Distribución de Especialidad Principal Sugerida ({metrics.vocacional40.evaluados} evaluados)
                  </h5>
                  <div className="space-y-2.5">
                    {([
                      { id: 'programacion' as SpecialtyId, nombre: 'Programación', color: '#1d4ed8' },
                      { id: 'rrhh' as SpecialtyId, nombre: 'Administración de Recursos Humanos', color: '#7c3aed' },
                      { id: 'comercio' as SpecialtyId, nombre: 'Comercio Internacional y Aduanas', color: '#047857' },
                      { id: 'cosmetologia' as SpecialtyId, nombre: 'Cosmetología', color: '#be185d' }
                    ]).map(spec => {
                      const count = metrics.vocacional40.sugeridas[spec.id];
                      const pctSug = metrics.vocacional40.evaluados > 0
                        ? Math.round((count / metrics.vocacional40.evaluados) * 100)
                        : 0;
                      const avgPts = metrics.vocacional40.promedioPuntos[spec.id];
                      const avgPct = metrics.vocacional40.promedioPorcentajes[spec.id];
                      return (
                        <div key={spec.id} className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: spec.color }} />
                              {spec.nombre}
                            </span>
                            <span className="font-mono-code font-bold text-stone-900">
                              {count} alumno{count === 1 ? '' : 's'} ({pctSug}%)
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pctSug}%`, backgroundColor: spec.color }}
                            />
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono-code flex justify-between">
                            <span>Promedio cohorte en este perfil:</span>
                            <strong className="text-stone-700">{avgPts} / 40 pts ({avgPct}% afinidad)</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4-Part Average Distribution */}
                <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Tendencia Promedio por Parte del Test (Sobre 10 reactivos por parte)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {metrics.vocacional40.partesPromedio.map(parte => (
                      <div key={parte.parteId} className="bg-white p-3 rounded-lg border border-stone-200 space-y-2 text-xs">
                        <div className="font-bold text-[#721B32] truncate">{parte.titulo}</div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-stone-600">Programación:</span>
                            <span className="font-mono-code font-bold text-blue-800">{parte.promedios.programacion}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-600">Recursos Humanos:</span>
                            <span className="font-mono-code font-bold text-violet-800">{parte.promedios.rrhh}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-600">Comercio y Aduanas:</span>
                            <span className="font-mono-code font-bold text-emerald-800">{parte.promedios.comercio}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-600">Cosmetología:</span>
                            <span className="font-mono-code font-bold text-pink-800">{parte.promedios.cosmetologia}/10</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bar Chart 1B: Desglose Comparativo por Grupo (1°A a 1°F) */}
              <div className="space-y-3 pt-2">
                <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold block">
                  Desglose Comparativo de Cobertura Vocacional por Grupo Escolar
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(metrics.gruposStats).map(([grupo, st]) => {
                    const pct = st.total > 0 ? Math.round((st.testCompletados / st.total) * 100) : 0;
                    return (
                      <div key={grupo} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-stone-900 font-mono-code">{grupo}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-code font-bold text-stone-800 text-xs">
                              {st.testCompletados} / {st.total}
                            </span>
                            <span className="text-[11px] font-semibold text-[#721B32] font-mono-code bg-[#721B32]/10 px-1.5 py-0.2 rounded">
                              {pct}%
                            </span>
                          </div>
                        </div>

                        {/* Visual bar */}
                        <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#721B32] rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1B: Consulta Individual de Resultados para Maestros y Directivos */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#721B32] font-semibold flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#721B32]" />
                  Consulta Individual de Resultados · Maestros y Directivos
                </span>
                <h4 className="text-base font-bold text-stone-900 mt-0.5">
                  Análisis Individual por Alumno (Concentrado / 40 Reactivos y Hoja de Respuestas)
                </h4>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchIndividual}
                    onChange={e => setSearchIndividual(e.target.value)}
                    placeholder="Buscar alumno o núm. control..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-stone-50 focus:bg-white w-full sm:w-56"
                  />
                </div>
                <select
                  value={selectedStudentNC}
                  onChange={e => setSelectedStudentNC(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-lg bg-stone-50 text-stone-800 max-w-xs"
                >
                  <option value="">-- Seleccionar alumno para analizar --</option>
                  {estudiantesFiltrados
                    .filter(
                      est =>
                        !searchIndividual.trim() ||
                        est.nombre_completo.toLowerCase().includes(searchIndividual.toLowerCase()) ||
                        est.num_control.includes(searchIndividual)
                    )
                    .map(est => {
                      const ev = dbSnapshot.evaluaciones[est.num_control] || null;
                      return (
                        <option key={est.num_control} value={est.num_control}>
                          {est.nombre_completo} ({est.grupo}) ·{' '}
                          {ev ? `${ev.carrera_sugerida.toUpperCase()}` : 'Pendiente'}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            {(() => {
              const targetStudent =
                estudiantesFiltrados.find(e => e.num_control === selectedStudentNC) ||
                estudiantesFiltrados.find(e => Boolean(dbSnapshot.evaluaciones[e.num_control])) ||
                estudiantesFiltrados[0];

              if (!targetStudent) {
                return (
                  <div className="text-xs text-stone-500 text-center py-6">
                    No hay alumnos disponibles con los filtros actuales.
                  </div>
                );
              }

              const targetEval = dbSnapshot.evaluaciones[targetStudent.num_control] || null;

              return (
                <div className="space-y-4">
                  {/* Quick Student Selector Pills / Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {estudiantesFiltrados
                      .filter(
                        est =>
                          !searchIndividual.trim() ||
                          est.nombre_completo.toLowerCase().includes(searchIndividual.toLowerCase()) ||
                          est.num_control.includes(searchIndividual)
                      )
                      .slice(0, 12)
                      .map(est => {
                        const isSelected = targetStudent.num_control === est.num_control;
                        const ev = dbSnapshot.evaluaciones[est.num_control] || null;
                        return (
                          <button
                            key={est.num_control}
                            type="button"
                            onClick={() => setSelectedStudentNC(est.num_control)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#721B32] text-white border-[#721B32] font-semibold'
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <span className="truncate max-w-[160px]">{est.nombre_completo}</span>
                            <span className={`font-mono-code text-[10px] ${isSelected ? 'text-amber-200' : 'text-stone-500'}`}>
                              {ev ? ev.carrera_sugerida.slice(0, 4).toUpperCase() : 'N/A'}
                            </span>
                          </button>
                        );
                      })}
                  </div>

                  {targetEval ? (
                    <div className="space-y-4">
                      <VocationalResultDetails
                        evaluacion={targetEval}
                        nombreAlumno={`${targetStudent.nombre_completo} (${targetStudent.num_control} · ${targetStudent.grupo})`}
                        compact
                      />
                      <VocationalRadar evaluacion={targetEval} />
                    </div>
                  ) : (
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-center">
                      El alumno <strong>{targetStudent.nombre_completo}</strong> ({targetStudent.num_control}) aún no ha completado el Test de Orientación Vocacional de 40 reactivos.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SECTION 2: Gráfico de Barras - Finalización de Fase Virtual por Especialidad */}
      {(activeChartMode === 'ambos' || activeChartMode === 'especialidades') && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                Gráfico de Barras 2 · Rendimiento por Carrera Técnica
              </span>
              <h4 className="text-base font-bold text-stone-900 mt-0.5">
                Conclusión por Especialidad Técnica
              </h4>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-stone-400 inline-block"></span>
                <span className="text-stone-700">Módulo y Cuestionario Aprobado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block"></span>
                <span className="text-stone-700">100% Concluido (Carrera Sugerida)</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            Compara cuántos alumnos han explorado y respondido el cuestionario de comprensión de cada academia, frente a cuántos concluyeron todo el recorrido (100%) y fueron orientados a esa carrera como su opción prioritaria:
          </p>

          {/* Vertical / Horizontal Multi-Bar Chart per Specialty */}
          <div className="space-y-4">
            {(['programacion', 'comercio', 'rrhh', 'cosmetologia'] as SpecialtyId[]).map(specKey => {
              const spec = metrics.especialidadesStats[specKey];
              const pctQuiz = totalMatricula > 0 ? Math.round((spec.quizEvaluados / totalMatricula) * 100) : 0;
              const pctFinalizados = totalMatricula > 0 ? Math.round((spec.finalizadosConSugerida / totalMatricula) * 100) : 0;

              return (
                <div key={specKey} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: spec.color }}></span>
                      <h5 className="text-sm font-bold text-stone-900">{spec.nombre}</h5>
                    </div>
                    <div className="text-xs font-mono-code text-stone-600">
                      Demanda final: <strong className="text-stone-900 font-bold">{spec.finalizadosConSugerida} alumnos</strong> ({pctFinalizados}%)
                    </div>
                  </div>

                  {/* Dual comparative bars */}
                  <div className="space-y-2">
                    {/* Bar 1: Cuestionario Respondido */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1">
                        <span>Cuestionario de Comprensión Respondido:</span>
                        <span className="font-mono-code font-semibold">{spec.quizEvaluados} alumnos ({pctQuiz}%)</span>
                      </div>
                      <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-stone-500 rounded-full transition-all duration-500"
                          style={{ width: `${pctQuiz}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Bar 2: Concluyeron 100% con esa especialidad sugerida */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-stone-700 font-medium mb-1">
                        <span className="text-emerald-800 font-bold">Recorrido 100% Concluido con esta Especialidad Sugerida:</span>
                        <span className="font-mono-code font-bold text-emerald-800">{spec.finalizadosConSugerida} alumnos ({pctFinalizados}%)</span>
                      </div>
                      <div className="h-4 w-full bg-stone-200 rounded-full overflow-hidden border border-emerald-300">
                        <div
                          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold font-mono-code"
                          style={{
                            width: `${pctFinalizados}%`,
                            backgroundColor: spec.color
                          }}
                        >
                          {pctFinalizados > 10 ? `${pctFinalizados}%` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparative Summary Visual Grid */}
          <div className="pt-2">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold block mb-3">
              Resumen Gráfico de Orientación Vocacional Finalizada (Pase QR Emitido)
            </span>

            {/* Vertical column visualization */}
            <div className="grid grid-cols-4 gap-3 bg-stone-50/80 p-5 rounded-xl border border-stone-200 text-center">
              {(['programacion', 'comercio', 'rrhh', 'cosmetologia'] as SpecialtyId[]).map(key => {
                const sp = metrics.especialidadesStats[key];
                const heightPct = maxBarValue > 0 ? Math.round((sp.finalizadosConSugerida / maxBarValue) * 100) : 0;
                return (
                  <div key={key} className="flex flex-col items-center justify-end h-40">
                    <span className="text-xs font-bold font-mono-code text-stone-900 mb-1">
                      {sp.finalizadosConSugerida}
                    </span>
                    <div className="w-12 sm:w-16 bg-stone-200 rounded-t-lg h-28 flex items-end overflow-hidden">
                      <div
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${Math.max(8, heightPct)}%`,
                          backgroundColor: sp.color
                        }}
                      ></div>
                    </div>
                    <span className="text-[11px] font-semibold text-stone-800 mt-2 truncate w-full">
                      {sp.nombre}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2B: Indicadores de Comprensión Estandarizados (Mucho, Regular, Poco, Nada) */}
      {(activeChartMode === 'ambos' || activeChartMode === 'especialidades') && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#721B32] font-semibold flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-[#721B32]" />
                Indicadores de Comprensión Curricular (5 Reactivos c/u)
              </span>
              <h4 className="text-base font-bold text-stone-900 mt-0.5">
                Nivel de Comprensión por Academia Técnica
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                No se maneja aprobación ni reprobación: las 4 especialidades miden si los aspirantes comprendieron Mucho, Regular, Poco o Nada para felicitar su avance o sugerir repasar el contenido.
              </p>
            </div>
            <span className="text-xs font-mono-code font-semibold px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 shrink-0">
              Mucho · Regular · Poco · Nada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {(['programacion', 'comercio', 'rrhh', 'cosmetologia'] as SpecialtyId[]).map(specKey => {
              const sp = metrics.especialidadesStats[specKey];
              const total = sp.quizEvaluados;
              const pctMucho = total > 0 ? Math.round((sp.compMucho / total) * 100) : 0;
              const pctRegular = total > 0 ? Math.round((sp.compRegular / total) * 100) : 0;
              const pctPoco = total > 0 ? Math.round((sp.compPoco / total) * 100) : 0;
              const pctNada = total > 0 ? Math.round((sp.compNada / total) * 100) : 0;
              const promNivel =
                total > 0
                  ? sp.sumaCalificaciones / total >= 80
                    ? COMPRENSION_META.MUCHO
                    : sp.sumaCalificaciones / total >= 50
                    ? COMPRENSION_META.REGULAR
                    : sp.sumaCalificaciones / total > 0
                    ? COMPRENSION_META.POCO
                    : COMPRENSION_META.NADA
                  : null;

              return (
                <div key={specKey} className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sp.color }}></span>
                      <h5 className="text-xs font-bold text-stone-900 truncate">{sp.nombre}</h5>
                    </div>
                    {promNivel ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${promNivel.badgeClass}`}>
                        {promNivel.labelCorto}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono-code text-stone-400 shrink-0">Sin datos</span>
                    )}
                  </div>

                  {/* Stacked comprehension bar */}
                  <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden flex">
                    {pctMucho > 0 && <div className="bg-emerald-600 h-full" style={{ width: `${pctMucho}%` }} title={`Mucho: ${sp.compMucho}`} />}
                    {pctRegular > 0 && <div className="bg-sky-500 h-full" style={{ width: `${pctRegular}%` }} title={`Regular: ${sp.compRegular}`} />}
                    {pctPoco > 0 && <div className="bg-amber-500 h-full" style={{ width: `${pctPoco}%` }} title={`Poco: ${sp.compPoco}`} />}
                    {pctNada > 0 && <div className="bg-rose-500 h-full" style={{ width: `${pctNada}%` }} title={`Nada: ${sp.compNada}`} />}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="p-2 bg-emerald-50/80 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <span className="text-emerald-900 font-semibold">Mucho</span>
                      <span className="font-mono-code font-bold text-emerald-950">{sp.compMucho} ({pctMucho}%)</span>
                    </div>
                    <div className="p-2 bg-sky-50/80 rounded-lg border border-sky-200 flex items-center justify-between">
                      <span className="text-sky-900 font-semibold">Regular</span>
                      <span className="font-mono-code font-bold text-sky-950">{sp.compRegular} ({pctRegular}%)</span>
                    </div>
                    <div className="p-2 bg-amber-50/80 rounded-lg border border-amber-200 flex items-center justify-between">
                      <span className="text-amber-900 font-semibold">Poco</span>
                      <span className="font-mono-code font-bold text-amber-950">{sp.compPoco} ({pctPoco}%)</span>
                    </div>
                    <div className="p-2 bg-rose-50/80 rounded-lg border border-rose-200 flex items-center justify-between">
                      <span className="text-rose-900 font-semibold">Nada</span>
                      <span className="font-mono-code font-bold text-rose-950">{sp.compNada} ({pctNada}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1 border-t border-stone-200">
                    <span>Respondieron:</span>
                    <span className="font-mono-code font-semibold">{sp.quizEvaluados} / {totalMatricula} alumnos</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 leading-relaxed">
            <strong className="text-stone-900">Complementariedad Metodológica:</strong> El{' '}
            <strong>Test Vocacional (40 reactivos)</strong> determina la afinidad comparativa del estudiante entre las 4 carreras, mientras que cada{' '}
            <strong>Cuestionario de Especialidad (5 reactivos)</strong> arroja un indicador de comprensión (<strong>Mucho, Regular, Poco o Nada</strong>) para felicitarlo o sugerirle repasar antes de emitir su Constancia QR.
          </div>
        </div>
      )}

      {/* SECTION 3: Embudo de Conversión de la Matrícula */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-stone-700" />
              Embudo Institucional de Orientación Vocacional
            </span>
            <h4 className="text-base font-bold text-stone-900 mt-0.5">
              Tasa de Retención y Avance por Etapas en Plataforma
            </h4>
          </div>
          <span className="text-xs font-mono-code text-stone-500">
            Feria 2026 · CETis 7
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {metrics.funnel.map((step, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">
                  {idx + 1}. {step.label}
                </span>
                <span className="font-mono-code font-bold text-stone-900">
                  {step.count} de {totalMatricula} ({step.pct}%)
                </span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                <div
                  className={`h-full ${step.color} rounded-full transition-all duration-500`}
                  style={{ width: `${step.pct}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
