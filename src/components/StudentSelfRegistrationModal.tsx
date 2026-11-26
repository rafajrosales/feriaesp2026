import React, { useState } from 'react';
import { Estudiante, TutorLegal, GRUPOS_PRIMER_SEMESTRE } from '../types';
import { registrarNuevoEstudiante, validarCURP } from '../services/storage';
import { cloudCheckCurpAvailable, cloudCheckNumControlAvailable, hasVerifiedFirebaseUser } from '../services/firebase';
import { UserPlus, Mail, Phone, Check, X, Shield, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentSelfRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentRegistered: (newStudent: Estudiante) => void;
}

export const StudentSelfRegistrationModal: React.FC<StudentSelfRegistrationModalProps> = ({
  isOpen,
  onClose,
  onStudentRegistered
}) => {
  const [paso, setPaso] = useState<1 | 2>(1);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [curp, setCurp] = useState('');
  const [grupo, setGrupo] = useState('1°A');
  const [telefonoAlumno, setTelefonoAlumno] = useState('');
  const [correoAlumno, setCorreoAlumno] = useState('');

  const [nombreTutor, setNombreTutor] = useState('');
  const [parentesco, setParentesco] = useState<'Padre' | 'Madre' | 'Tutor Legal'>('Padre');
  const [correoTutor, setCorreoTutor] = useState('');
  const [telefonoTutor, setTelefonoTutor] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAutocompletarPrueba = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setNombreCompleto('Mariana Guadalupe Sánchez Cruz');
    setCurp(`SACM090714HDFRLA${randomSuffix.toString().slice(0, 2)}`);
    setGrupo('1°B');
    setTelefonoAlumno('55 4321 8765');
    setCorreoAlumno('mariana.sanchez@gmail.com');
    setNombreTutor('Lic. Roberto Sánchez Morales');
    setParentesco('Padre');
    setCorreoTutor('roberto.sanchez.tutor@gmail.com');
    setTelefonoTutor('55 9876 5432');
  };

  const handleNextPaso = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!hasVerifiedFirebaseUser()) {
      setErrorMsg('Debes tener una sesión de Google verificada y conexión en línea con Firebase para registrar alumnos.');
      return;
    }

    if (!nombreCompleto.trim() || nombreCompleto.trim().length < 5) {
      setErrorMsg('Por favor escribe tu nombre completo (nombre y apellidos).');
      return;
    }

    const curpValid = validarCURP(curp);
    if (!curpValid.valido) {
      setErrorMsg(curpValid.mensaje || 'La CURP no es válida.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanCurp = curp.trim().toUpperCase();
      const curpCheck = await cloudCheckCurpAvailable(cleanCurp);

      if (!curpCheck.available) {
        setErrorMsg(`Esta CURP ya se encuentra registrada en la base única de Firebase. Solo se permite un registro por alumno.`);
        return;
      }

      setPaso(2);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo validar la disponibilidad en Firebase.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombreTutor.trim()) {
      setErrorMsg('Por favor escribe el nombre de tu papá, mamá o tutor.');
      return;
    }

    if (!correoTutor.trim() || !correoTutor.includes('@')) {
      setErrorMsg('El correo electrónico de tu papá o tutor es obligatorio y debe ser válido.');
      return;
    }

    const tutorObj: TutorLegal = {
      nombre_tutor: nombreTutor.trim(),
      parentesco,
      correo_tutor: correoTutor.trim().toLowerCase(),
      telefono_tutor: telefonoTutor.trim() || 'No proporcionado',
      verificado: false
    };

    const cleanCurp = curp.trim().toUpperCase();
    const generatedNC = `2631607${cleanCurp.slice(0, 4)}${Math.floor(100 + Math.random() * 900)}`;

    const nuevoEstudiante: Estudiante = {
      num_control: generatedNC,
      nombre_completo: nombreCompleto.trim(),
      grupo,
      turno: 'MATUTINO',
      curp: cleanCurp,
      correo_institucional: correoAlumno.trim() ? correoAlumno.trim().toLowerCase() : `${nombreCompleto.trim().toLowerCase().split(' ')[0]}.${generatedNC.slice(-4)}@cetis7.edu.mx`,
      telefono_alumno: telefonoAlumno.trim(),
      tutor: tutorObj
    };

    setSubmitting(true);
    try {
      const result = await registrarNuevoEstudiante(nuevoEstudiante);
      if (!result.success) {
        setErrorMsg(result.error || 'Error al registrar alumno en Firebase.');
        return;
      }

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe ignore
      }

      onStudentRegistered(result.estudiante || nuevoEstudiante);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white sm:rounded-2xl border-0 sm:border border-stone-200 max-w-lg w-full shadow-2xl overflow-hidden min-h-full sm:min-h-0 sm:my-6 flex flex-col">
        <div className="bg-[#721B32] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-200 shrink-0">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-amber-200 font-semibold block truncate">
                CETis No. 7 &quot;Miguel Lerdo de Tejada&quot;
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Registro de Alumno (Base Única Firebase)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
              paso === 1 ? 'bg-[#721B32] text-white' : 'bg-emerald-600 text-white'
            }`}>
              {paso > 1 ? '✓' : '1'}
            </span>
            <span className={`text-[11px] sm:text-xs truncate ${paso === 1 ? 'text-[#721B32] font-bold' : 'text-stone-600'}`}>
              <span className="sm:hidden">Paso 1: Alumno</span>
              <span className="hidden sm:inline">Tus Datos de Estudiante</span>
            </span>
          </div>

          <div className="w-6 sm:w-8 h-px bg-stone-300 mx-2 shrink-0"></div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
              paso === 2 ? 'bg-[#721B32] text-white' : 'bg-stone-300 text-stone-700'
            }`}>
              2
            </span>
            <span className={`text-[11px] sm:text-xs truncate ${paso === 2 ? 'text-[#721B32] font-bold' : 'text-stone-400'}`}>
              <span className="sm:hidden">Paso 2: Tutor</span>
              <span className="hidden sm:inline">Datos de tu Papá o Tutor</span>
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-6 flex-1 overflow-y-auto">
          {paso === 1 ? (
            <form onSubmit={e => void handleNextPaso(e)} className="space-y-3.5 sm:space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 gap-1">
                <span>Ingresa tus datos escolares oficiales:</span>
                <button
                  type="button"
                  onClick={handleAutocompletarPrueba}
                  className="text-[#721B32] font-semibold hover:underline cursor-pointer"
                >
                  ⚡ Autocompletar ejemplo
                </button>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Nombre Completo del Estudiante *</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  autoCapitalize="words"
                  value={nombreCompleto}
                  onChange={e => setNombreCompleto(e.target.value)}
                  placeholder="ej. Gael Emiliano Morales Sánchez"
                  className="w-full px-3.5 py-3 sm:py-2 border border-stone-300 rounded-xl bg-white text-base sm:text-sm font-medium shadow-2xs focus:ring-2 focus:ring-[#721B32] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">CURP Oficial (18 caracteres) *</label>
                <input
                  type="text"
                  required
                  maxLength={18}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  value={curp}
                  onChange={e => setCurp(e.target.value.toUpperCase())}
                  placeholder="ej. MOSG090314HDFRLA01"
                  className="w-full px-3.5 py-3 sm:py-2 border border-stone-300 rounded-xl bg-white text-base sm:text-sm font-mono-code font-bold tracking-wider shadow-2xs focus:ring-2 focus:ring-[#721B32] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-stone-800 block">Grupo (1.° Semestre) *</label>
                  <span className="text-[11px] font-semibold text-[#721B32] bg-[#721B32]/10 px-2 py-0.5 rounded">
                    Turno Único Matutino
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {GRUPOS_PRIMER_SEMESTRE.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrupo(g)}
                      className={`py-2.5 text-xs font-mono-code font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        grupo === g
                          ? 'bg-[#721B32] text-white border-[#721B32] shadow-xs ring-2 ring-[#721B32]/30'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Correo Electrónico del Alumno (si se solicita):</label>
                  <input
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={correoAlumno}
                    onChange={e => setCorreoAlumno(e.target.value)}
                    placeholder="ej. alumno@gmail.com"
                    className="w-full px-3.5 py-3 sm:py-2 border border-stone-300 rounded-xl bg-white text-base sm:text-sm font-mono-code shadow-2xs focus:ring-2 focus:ring-[#721B32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Teléfono Celular del Alumno (o Teléfono):</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={telefonoAlumno}
                    onChange={e => setTelefonoAlumno(e.target.value)}
                    placeholder="ej. 55 1234 5678"
                    className="w-full px-3.5 py-3 sm:py-2 border border-stone-300 rounded-xl bg-white text-base sm:text-sm font-mono-code shadow-2xs focus:ring-2 focus:ring-[#721B32] focus:outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs sm:text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 text-stone-600 hover:bg-stone-100 rounded-xl font-bold cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-3.5 sm:py-2.5 bg-[#721B32] hover:bg-[#5b1528] disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{submitting ? 'Verificando en Firebase...' : 'Siguiente: Datos de Papá o Tutor'}</span>
                  {!submitting && <ArrowRight className="w-4 h-4 shrink-0" />}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={e => void handleFinalizarRegistro(e)} className="space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed space-y-1">
                <span className="font-bold flex items-center gap-1 text-xs sm:text-sm text-amber-950">
                  <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>¿Por qué necesitamos el correo de tu papá o tutor?</span>
                </span>
                <p className="text-xs text-amber-950">
                  El sistema del CETis 7 vinculará este correo oficial en la base única de Firebase. <strong>Tu Pase Digital QR solo podrá imprimirse cuando tu papá o tutor confirme y firme digitalmente.</strong>
                </p>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1.5">Parentesco con el Alumno *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Padre', 'Madre', 'Tutor Legal'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setParentesco(p)}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer truncate ${
                        parentesco === p
                          ? 'bg-[#721B32] text-white border-[#721B32] shadow-xs ring-2 ring-[#721B32]/30'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {p === 'Padre' ? '👨 Padre' : p === 'Madre' ? '👩 Madre' : '⚖️ Tutor'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Nombre Completo del Papá, Mamá o Tutor *</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  autoCapitalize="words"
                  value={nombreTutor}
                  onChange={e => setNombreTutor(e.target.value)}
                  placeholder="ej. Lic. Roberto Sánchez Morales"
                  className="w-full px-3.5 py-3 sm:py-2 border border-stone-300 rounded-xl bg-white text-base sm:text-sm font-medium shadow-2xs focus:ring-2 focus:ring-[#721B32] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Correo Electrónico del Tutor *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="email"
                      required
                      value={correoTutor}
                      onChange={e => setCorreoTutor(e.target.value)}
                      placeholder="ej. papa.tutor@gmail.com"
                      className="w-full pl-10 pr-3.5 py-3 sm:py-2 border border-stone-300 rounded-xl bg-white text-base sm:text-sm font-mono-code font-medium shadow-2xs focus:ring-2 focus:ring-[#721B32] focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">Teléfono Celular del Tutor *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={telefonoTutor}
                      onChange={e => setTelefonoTutor(e.target.value)}
                      placeholder="ej. 55 9876 5432"
                      className="w-full pl-10 pr-3.5 py-3 sm:py-2 border border-stone-300 rounded-xl bg-white text-base sm:text-sm font-mono-code shadow-2xs focus:ring-2 focus:ring-[#721B32] focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs sm:text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPaso(1)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Regresar al Paso 1</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                  <span>{submitting ? 'Guardando en Firebase...' : 'Completar Registro Oficial'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
