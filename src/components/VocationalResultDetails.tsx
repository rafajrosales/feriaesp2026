import React, { useState } from 'react';
import { EvaluacionVocacional, SpecialtyId } from '../types';
import { TEST_VOCACIONAL_40_PREGUNTAS, TEST_VOCACIONAL_PARTES } from '../data/mockData';
import {
  ChevronDown,
  ChevronUp,
  Database,
  FileCheck2,
  Award,
  Layers,
  Scale
} from 'lucide-react';

interface VocationalResultDetailsProps {
  evaluacion: EvaluacionVocacional;
  nombreAlumno?: string;
  compact?: boolean;
  defaultOpenSheet?: boolean;
}

const SPECIALTY_META: {
  id: SpecialtyId;
  nombre: string;
  corto: string;
  color: string;
  badgeClass: string;
}[] = [
  {
    id: 'programacion',
    nombre: 'Programación',
    corto: 'Programación',
    color: '#1d4ed8',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    id: 'rrhh',
    nombre: 'Administración de Recursos Humanos',
    corto: 'Recursos Humanos',
    color: '#7c3aed',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200'
  },
  {
    id: 'comercio',
    nombre: 'Comercio Internacional y Aduanas',
    corto: 'Comercio y Aduanas',
    color: '#047857',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'cosmetologia',
    nombre: 'Cosmetología',
    corto: 'Cosmetología',
    color: '#be185d',
    badgeClass: 'bg-pink-50 text-pink-800 border-pink-200'
  }
];

export const VocationalResultDetails: React.FC<VocationalResultDetailsProps> = ({
  evaluacion,
  nombreAlumno,
  compact = false,
  defaultOpenSheet = false
}) => {
  const [mostrarHojaRespuestas, setMostrarHojaRespuestas] = useState(defaultOpenSheet);

  const puntajes: Record<SpecialtyId, number> = evaluacion.puntajes_especialidad || {
    programacion: Math.round(((evaluacion.score_aptitud_programacion + evaluacion.score_gusto_programacion) / 200) * 40),
    rrhh: Math.round(((evaluacion.score_aptitud_rrhh + evaluacion.score_gusto_rrhh) / 200) * 40),
    comercio: Math.round(((evaluacion.score_aptitud_comercio + evaluacion.score_gusto_comercio) / 200) * 40),
    cosmetologia: Math.round(((evaluacion.score_aptitud_cosmetologia + evaluacion.score_gusto_cosmetologia) / 200) * 40)
  };

  const totalRespondidos =
    Object.values(puntajes).reduce((acc, v) => acc + v, 0) || evaluacion.total_reactivos || 40;

  const porcentajes: Record<SpecialtyId, number> = evaluacion.porcentajes_especialidad || {
    programacion: totalRespondidos > 0 ? Math.round((puntajes.programacion / totalRespondidos) * 100) : 0,
    rrhh: totalRespondidos > 0 ? Math.round((puntajes.rrhh / totalRespondidos) * 100) : 0,
    comercio: totalRespondidos > 0 ? Math.round((puntajes.comercio / totalRespondidos) * 100) : 0,
    cosmetologia: totalRespondidos > 0 ? Math.round((puntajes.cosmetologia / totalRespondidos) * 100) : 0
  };

  const maxPts = Math.max(...Object.values(puntajes));
  const empatadas =
    evaluacion.especialidades_empatadas && evaluacion.especialidades_empatadas.length > 0
      ? evaluacion.especialidades_empatadas
      : SPECIALTY_META.filter(s => puntajes[s.id] === maxPts).map(s => s.id);

  const hayEmpate = empatadas.length > 1;
  const rowsOrdenadas = [...SPECIALTY_META].sort((a, b) => puntajes[b.id] - puntajes[a.id]);

  return (
    <div className="space-y-4">
      {/* Header / Tie Alert / Persistence Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Award className="w-4 h-4 text-[#721B32] shrink-0" />
          <span className="font-bold text-stone-900">
            Concentración Oficial del Test (40 Reactivos)
          </span>
          {nombreAlumno && (
            <span className="text-stone-600">· {nombreAlumno}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono-code text-[11px] font-semibold border ${
              evaluacion.sincronizado_firestore
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <Database className="w-3 h-3" />
            {evaluacion.sincronizado_firestore ? 'BD Firestore Sincronizada' : 'Guardado en BD Local + Nube'}
          </span>
          <span className="text-[11px] font-mono-code text-stone-500">
            {new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-MX')}
          </span>
        </div>
      </div>

      {hayEmpate && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
          <Scale className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">
              Empate en el puntaje más alto ({maxPts} / 40 pts · {Math.round((maxPts / 40) * 100)}%):
            </strong>
            <span>
              Conforme a la clave oficial del CETis No. 7,{' '}
              <strong>
                {empatadas
                  .map(id => SPECIALTY_META.find(s => s.id === id)?.nombre || id)
                  .join(' y ')}
              </strong>{' '}
              se consideran opciones afines recomendadas para este perfil.
            </span>
          </div>
        </div>
      )}

      {/* Official PDF Page 8 Concentration Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#721B32] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Especialidad</th>
                <th className="p-3 text-center">Reactivos Acertados</th>
                <th className="p-3 text-center">Puntaje Total / 40</th>
                <th className="p-3 text-right">Porcentaje de Afinidad %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {rowsOrdenadas.map(spec => {
                const pts = puntajes[spec.id] ?? 0;
                const pct = porcentajes[spec.id] ?? 0;
                const isTop = empatadas.includes(spec.id);
                return (
                  <tr
                    key={spec.id}
                    className={isTop ? 'bg-amber-50/60 font-semibold' : 'hover:bg-stone-50'}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: spec.color }}
                        />
                        <span className="text-stone-900 font-semibold">{spec.nombre}</span>
                        {isTop && (
                          <span className="px-1.5 py-0.5 rounded bg-[#721B32] text-white text-[10px] font-bold">
                            {hayEmpate ? 'Opción Afín' : '1.ª Sugerida'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono-code text-stone-700">
                      {pts} reactivo{pts === 1 ? '' : 's'}
                    </td>
                    <td className="p-3 text-center font-mono-code font-bold text-stone-900">
                      {pts} / {totalRespondidos}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2 justify-end min-w-[110px]">
                        <div className="w-16 h-2 bg-stone-200 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: spec.color }}
                          />
                        </div>
                        <span className="font-mono-code font-bold text-stone-900">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-Part Breakdown */}
      {evaluacion.desglose_partes && (
        <div className="bg-stone-50/70 rounded-xl border border-stone-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#721B32]" />
              Desglose por las 4 Partes del Instrumento (10 reactivos por parte)
            </h5>
          </div>

          <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'} gap-3`}>
            {[
              {
                parte: TEST_VOCACIONAL_PARTES[0],
                scores: evaluacion.desglose_partes.parte1_intereses
              },
              {
                parte: TEST_VOCACIONAL_PARTES[1],
                scores: evaluacion.desglose_partes.parte2_actividades
              },
              {
                parte: TEST_VOCACIONAL_PARTES[2],
                scores: evaluacion.desglose_partes.parte3_habilidades
              },
              {
                parte: TEST_VOCACIONAL_PARTES[3],
                scores: evaluacion.desglose_partes.parte4_metas
              }
            ].map(({ parte, scores }) => (
              <div
                key={parte.id}
                className="bg-white p-3 rounded-xl border border-stone-200 space-y-2 text-xs"
              >
                <div>
                  <div className="font-bold text-[#721B32]">{parte.titulo}</div>
                  <div className="text-[10px] text-stone-500 font-mono-code">{parte.subtitulo}</div>
                </div>
                <div className="space-y-1.5">
                  {SPECIALTY_META.map(spec => {
                    const val = scores?.[spec.id] ?? 0;
                    return (
                      <div key={spec.id} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-stone-700 truncate pr-1">{spec.corto}</span>
                          <span className="font-mono-code font-bold text-stone-900">{val}/10</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(val / 10) * 100}%`, backgroundColor: spec.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible 40-Item Answer Sheet */}
      {evaluacion.respuestas_detalle && Object.keys(evaluacion.respuestas_detalle).length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setMostrarHojaRespuestas(prev => !prev)}
            className="w-full px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors flex items-center justify-between text-xs font-bold text-stone-800 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#721B32]" />
              Hoja de Respuestas Individual (40 Reactivos Guardados)
            </span>
            <span className="inline-flex items-center gap-1 text-[#721B32]">
              {mostrarHojaRespuestas ? 'Ocultar detalle' : 'Consultar 40 respuestas'}
              {mostrarHojaRespuestas ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {mostrarHojaRespuestas && (
            <div className="p-4 max-h-96 overflow-y-auto divide-y divide-stone-100 text-xs">
              {TEST_VOCACIONAL_40_PREGUNTAS.map(pregunta => {
                const resp = evaluacion.respuestas_detalle?.[pregunta.id];
                const opt = resp
                  ? pregunta.opciones.find(o => o.letra === resp.opcion)
                  : undefined;
                const specMeta = resp
                  ? SPECIALTY_META.find(s => s.id === resp.especialidad)
                  : undefined;

                return (
                  <div
                    key={pregunta.id}
                    className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-stone-900">
                        <span className="font-mono-code text-[#721B32] mr-1.5">
                          {pregunta.id}.
                        </span>
                        {pregunta.enunciado}
                      </div>
                      {opt ? (
                        <div className="text-stone-600 pl-4">
                          <span className="font-mono-code font-bold text-stone-800 uppercase mr-1">
                            {opt.letra})
                          </span>
                          {opt.texto}
                        </div>
                      ) : (
                        <div className="text-stone-400 italic pl-4">Sin respuesta registrada</div>
                      )}
                    </div>
                    {specMeta && (
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 self-start sm:self-center ${specMeta.badgeClass}`}
                      >
                        {specMeta.corto}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
