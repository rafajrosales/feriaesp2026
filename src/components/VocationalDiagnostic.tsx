import React, { useEffect, useMemo, useState } from 'react';
import {
  TEST_VOCACIONAL_40_PREGUNTAS,
  TEST_VOCACIONAL_PARTES
} from '../data/mockData';
import {
  EvaluacionVocacional,
  LetraOpcionVocacional,
  ParteVocacionalId,
  SpecialtyId
} from '../types';
import {
  evaluarTestVocacional40,
  guardarEvaluacionVocacionalEnBD
} from '../services/storage';
import { VocationalRadar } from './VocationalRadar';
import { VocationalResultDetails } from './VocationalResultDetails';
import {
  CheckCircle2,
  Compass,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Zap,
  Sparkles,
  Database,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { COMIC_ASSETS } from '../assets/comicAssets';

interface VocationalDiagnosticProps {
  numControl: string;
  evaluacionExistente: EvaluacionVocacional | null;
  onCompletar: (evaluacion: EvaluacionVocacional) => void;
}

export const VocationalDiagnostic: React.FC<VocationalDiagnosticProps> = ({
  numControl,
  evaluacionExistente,
  onCompletar
}) => {
  const [respuestas, setRespuestas] = useState<Record<number, LetraOpcionVocacional>>({});
  const [parteActiva, setParteActiva] = useState<ParteVocacionalId>(1);
  const [pantalla, setPantalla] = useState<'intro' | 'cuestionario' | 'resultado'>(
    evaluacionExistente ? 'resultado' : 'intro'
  );
  const [evaluacionActual, setEvaluacionActual] = useState<EvaluacionVocacional | null>(
    evaluacionExistente
  );
  const [guardandoBD, setGuardandoBD] = useState(false);
  const [estadoSyncBD, setEstadoSyncBD] = useState<{
    syncedToCloud: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    setEvaluacionActual(evaluacionExistente);
    if (evaluacionExistente) {
      setPantalla('resultado');
      setEstadoSyncBD(
        evaluacionExistente.sincronizado_firestore !== undefined
          ? { syncedToCloud: Boolean(evaluacionExistente.sincronizado_firestore) }
          : null
      );
    } else {
      setRespuestas({});
      setParteActiva(1);
      setPantalla('intro');
      setEstadoSyncBD(null);
    }
  }, [numControl, evaluacionExistente]);

  const preguntasParteActual = useMemo(
    () => TEST_VOCACIONAL_40_PREGUNTAS.filter(p => p.parte === parteActiva),
    [parteActiva]
  );

  const infoParteActual = useMemo(
    () => TEST_VOCACIONAL_PARTES.find(pt => pt.id === parteActiva) || TEST_VOCACIONAL_PARTES[0],
    [parteActiva]
  );

  const conteoPorParte = useMemo(() => {
    const map: Record<ParteVocacionalId, { respondidas: number; total: number }> = {
      1: { respondidas: 0, total: 10 },
      2: { respondidas: 0, total: 10 },
      3: { respondidas: 0, total: 10 },
      4: { respondidas: 0, total: 10 }
    };
    TEST_VOCACIONAL_40_PREGUNTAS.forEach(p => {
      if (respuestas[p.id]) {
        map[p.parte].respondidas += 1;
      }
    });
    return map;
  }, [respuestas]);

  const totalRespondidas = Object.keys(respuestas).length;
  const totalPreguntas = TEST_VOCACIONAL_40_PREGUNTAS.length;
  const faltantesParteActual = preguntasParteActual.filter(p => !respuestas[p.id]);
  const preguntasFaltantesGlobales = TEST_VOCACIONAL_40_PREGUNTAS.filter(p => !respuestas[p.id]);

  const seleccionarRespuesta = (preguntaId: number, letra: LetraOpcionVocacional) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: letra
    }));
  };

  const handleFinalizarYGuardar = async () => {
    if (preguntasFaltantesGlobales.length > 0) {
      const primeraFaltante = preguntasFaltantesGlobales[0];
      setParteActiva(primeraFaltante.parte);
      return;
    }

    setGuardandoBD(true);
    const resultado = evaluarTestVocacional40(numControl, respuestas);
    const syncRes = await guardarEvaluacionVocacionalEnBD(resultado);
    const resultadoFinal: EvaluacionVocacional = {
      ...resultado,
      sincronizado_firestore: syncRes.syncedToCloud
    };

    setGuardandoBD(false);
    setEstadoSyncBD(syncRes);
    setEvaluacionActual(resultadoFinal);
    setPantalla('resultado');
    onCompletar(resultadoFinal);
  };

  const nombreEspecialidad = (id: SpecialtyId) => {
    switch (id) {
      case 'programacion':
        return 'Programación';
      case 'comercio':
        return 'Comercio Internacional y Aduanas';
      case 'rrhh':
        return 'Administración de Recursos Humanos';
      case 'cosmetologia':
        return 'Cosmetología';
    }
  };

  const hayEmpate =
    (evaluacionActual?.especialidades_empatadas?.length ?? 0) > 1;

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-5 border-b border-stone-200 bg-stone-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#721B32]/10 text-[#721B32] flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold">
                Instrumento Oficial CETis No. 7 · 40 Reactivos
              </span>
              <h3 className="text-lg font-bold text-stone-900">
                Test de Orientación Vocacional — Elige tu especialidad de bachillerato
              </h3>
            </div>
          </div>

          {evaluacionActual && pantalla === 'resultado' && (
            <button
              type="button"
              onClick={() => {
                setRespuestas({});
                setParteActiva(1);
                setPantalla('cuestionario');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Aplicar Test Nuevamente
            </button>
          )}
        </div>
      </div>

      {/* Screen 1: Introduction */}
      {pantalla === 'intro' && (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="border border-stone-200 rounded-xl p-5 bg-stone-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div>
                <h4 className="text-base font-bold text-stone-900">
                  Instrucciones Generales del Test
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  Lee cada pregunta y elige <strong>UNA sola opción</strong>, la que más se parezca a ti. No hay respuestas buenas o malas.
                </p>
              </div>
              <span className="text-xs font-mono-code font-bold text-[#721B32] bg-[#721B32]/10 px-2.5 py-1 rounded-md self-start">
                4 Partes · 40 Preguntas
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              Las especialidades que ofrece el CETis No. 7 son:{' '}
              <strong className="text-stone-900">
                Programación, Administración de Recursos Humanos, Comercio Internacional y Aduanas, y Cosmetología
              </strong>
              . Al terminar, tus respuestas se guardarán en la base de datos institucional para generar tu dictamen, gráfica de afinidad y tabla oficial de resultados.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {TEST_VOCACIONAL_PARTES.map(parte => (
                <div
                  key={parte.id}
                  className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#721B32]">{parte.titulo}</span>
                    <span className="text-[11px] font-mono-code text-stone-500 font-semibold">
                      {parte.subtitulo}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{parte.descripcion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-stone-500">
              40 reactivos de opción múltiple (a, b, c, d) · Duración aproximada: 8–10 minutos
            </span>
            <button
              type="button"
              onClick={() => {
                setParteActiva(1);
                setPantalla('cuestionario');
              }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#721B32] hover:bg-[#5b1528] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Iniciar Test Vocacional (Parte 1)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: 4-Part Questionnaire */}
      {pantalla === 'cuestionario' && (
        <div className="p-5 sm:p-6 max-w-4xl mx-auto space-y-6">
          {/* Global Progress + 4 Parts Navigation */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-stone-800">
                Avance General del Cuestionario
              </span>
              <span className="font-mono-code font-bold text-[#721B32]">
                {totalRespondidas} de {totalPreguntas} reactivos respondidos (
                {Math.round((totalRespondidas / totalPreguntas) * 100)}%)
              </span>
            </div>

            <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#721B32] rounded-full transition-all duration-300"
                style={{ width: `${(totalRespondidas / totalPreguntas) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              {TEST_VOCACIONAL_PARTES.map(parte => {
                const count = conteoPorParte[parte.id];
                const isActive = parteActiva === parte.id;
                const isComplete = count.respondidas === count.total;
                return (
                  <button
                    key={parte.id}
                    type="button"
                    onClick={() => setParteActiva(parte.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#721B32] text-white border-[#721B32] shadow-xs'
                        : isComplete
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>Parte {parte.id}</span>
                      <span className="font-mono-code">
                        {count.respondidas}/{count.total}
                      </span>
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-amber-200' : 'text-stone-500'
                      }`}
                    >
                      {parte.titulo.replace(`Parte ${parte.id}: `, '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Part Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <span className="text-xs font-bold text-[#721B32] uppercase tracking-wider">
                {infoParteActual.subtitulo}
              </span>
              <h4 className="text-base font-bold text-stone-900">{infoParteActual.titulo}</h4>
              <p className="text-xs text-stone-600 mt-0.5">{infoParteActual.descripcion}</p>
            </div>
            <span className="text-xs font-mono-code text-stone-600 font-semibold bg-stone-100 px-2.5 py-1 rounded-md self-start">
              {conteoPorParte[parteActiva].respondidas} / 10 en esta parte
            </span>
          </div>

          {/* 10 Questions of Active Part */}
          <div className="space-y-6">
            {preguntasParteActual.map(pregunta => (
              <div
                key={pregunta.id}
                className={`p-4 rounded-xl border transition-colors space-y-3 ${
                  respuestas[pregunta.id]
                    ? 'bg-stone-50/40 border-stone-200'
                    : 'bg-white border-stone-200'
                }`}
              >
                <p className="text-sm font-semibold text-stone-900">
                  <span className="font-mono-code font-bold text-[#721B32] mr-2">
                    {pregunta.id}.
                  </span>
                  {pregunta.enunciado}
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {pregunta.opciones.map(op => {
                    const isSelected = respuestas[pregunta.id] === op.letra;
                    return (
                      <button
                        key={op.letra}
                        type="button"
                        onClick={() => seleccionarRespuesta(pregunta.id, op.letra)}
                        className={`w-full text-left p-3 rounded-lg text-xs sm:text-sm transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-[#721B32]/8 border-[#721B32] text-stone-950 font-medium shadow-2xs ring-1 ring-[#721B32]/30'
                            : 'bg-stone-50/60 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-mono-code font-bold ${
                              isSelected
                                ? 'border-[#721B32] bg-[#721B32] text-white'
                                : 'border-stone-400 bg-white text-stone-700'
                            }`}
                          >
                            {isSelected ? '✓' : op.letra}
                          </span>
                          <span>
                            <strong className="font-mono-code mr-1">{op.letra})</strong>
                            {op.texto}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Missing Questions Warning if needed */}
          {faltantesParteActual.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Faltan <strong>{faltantesParteActual.length}</strong> pregunta(s) por responder en esta parte ({faltantesParteActual.map(p => `#${p.id}`).join(', ')}).
              </span>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-stone-200">
            <div className="flex items-center gap-2">
              {parteActiva > 1 ? (
                <button
                  type="button"
                  onClick={() => setParteActiva((parteActiva - 1) as ParteVocacionalId)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 hover:text-stone-950 border border-stone-300 rounded-lg hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Parte {parteActiva - 1}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPantalla('intro')}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Ver Instrucciones
                </button>
              )}
            </div>

            {parteActiva < 4 ? (
              <button
                type="button"
                disabled={faltantesParteActual.length > 0}
                onClick={() => {
                  setParteActiva((parteActiva + 1) as ParteVocacionalId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  faltantesParteActual.length === 0
                    ? 'bg-[#721B32] text-white hover:bg-[#5b1528] cursor-pointer'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                Continuar a Parte {parteActiva + 1}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={preguntasFaltantesGlobales.length > 0 || guardandoBD}
                onClick={handleFinalizarYGuardar}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  preguntasFaltantesGlobales.length === 0 && !guardandoBD
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer shadow-xs'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                {guardandoBD ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando Resultados en Base de Datos...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Finalizar y Guardar Resultados en BD ({totalRespondidas}/40)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Screen 3: Results Display */}
      {pantalla === 'resultado' && evaluacionActual && (
        <div className="p-6 space-y-6">
          {/* Top Confirmation Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-800 font-semibold">
                  Test Vocacional de 40 Reactivos Completado
                </span>
                <h4 className="text-base font-bold text-emerald-950">
                  {hayEmpate
                    ? `Opciones Afines Recomendadas (Empate): ${evaluacionActual.especialidades_empatadas
                        ?.map(id => nombreEspecialidad(id))
                        .join(' y ')}`
                    : `Especialidad Sugerida: ${nombreEspecialidad(evaluacionActual.carrera_sugerida)}`}
                </h4>
                {!hayEmpate && evaluacionActual.segunda_opcion && (
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Segunda alternativa por afinidad:{' '}
                    <strong className="font-semibold">
                      {nombreEspecialidad(evaluacionActual.segunda_opcion)}
                    </strong>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1 text-xs">
              <div className="text-emerald-800 bg-white px-3 py-1.5 rounded-md border border-emerald-200 shadow-2xs">
                Núm. Control: <span className="font-mono-code font-semibold">{numControl}</span>
              </div>
              {estadoSyncBD && (
                <span className="text-[11px] font-mono-code text-emerald-700 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {estadoSyncBD.syncedToCloud
                    ? 'Sincronizado en Firestore Cloud'
                    : 'Guardado localmente (pendiente de red)'}
                </span>
              )}
            </div>
          </div>

          {/* Teen Comic Recommendation Spotlight */}
          {COMIC_ASSETS.especialidades[evaluacionActual.carrera_sugerida] && (
            <div className="rounded-2xl border-2 border-stone-800 bg-stone-900 text-white overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-5 relative h-56 md:h-auto overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-stone-800">
                <img
                  src={COMIC_ASSETS.especialidades[evaluacionActual.carrera_sugerida].image}
                  alt={nombreEspecialidad(evaluacionActual.carrera_sugerida)}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-3 left-3 bg-amber-400 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  {hayEmpate ? '¡OPCIÓN AFÍN!' : '¡TU CARRERA IDEAL!'}
                </div>
              </div>
              <div className="md:col-span-7 p-5 flex flex-col justify-between space-y-3 bg-gradient-to-br from-stone-900 to-stone-950">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Resultado de Orientación Vocacional CETis No. 7
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {nombreEspecialidad(evaluacionActual.carrera_sugerida)}
                  </h3>
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs text-stone-200 leading-relaxed font-medium">
                    "{COMIC_ASSETS.especialidades[evaluacionActual.carrera_sugerida].callout}"
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {evaluacionActual.analisis_pedagogico}
                  </p>
                </div>
                <div className="text-[11px] text-amber-200 font-mono-code">
                  Lema: {COMIC_ASSETS.especialidades[evaluacionActual.carrera_sugerida].motto}
                </div>
              </div>
            </div>
          )}

          {/* Official Concentration Table + 4-Part Breakdown + 40-Answer Sheet */}
          <VocationalResultDetails evaluacion={evaluacionActual} />

          {/* SVG Radar */}
          <VocationalRadar evaluacion={evaluacionActual} />

          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
            <span>
              Para alcanzar el 100% de avance y generar tu Constancia Digital QR, explora los 4 módulos de especialidad y responde sus cuestionarios diagnósticos.
            </span>
            <span className="font-medium text-stone-800 underline shrink-0 ml-2">Continúa abajo</span>
          </div>
        </div>
      )}
    </div>
  );
};
