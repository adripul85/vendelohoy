import React, { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';
import { uploadFile } from '../lib/storage';
import { updateUserProfile } from '../lib/users';
import { useNavigate } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';

const Verification = () => {
  const { user, userProfile } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState({
    dniFront: '',
    dniBack: '',
    selfie: ''
  });
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    dniFront: null,
    dniBack: null,
    selfie: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [key]: file }));
      setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
    }
  };

  const handleNext = () => {
    if (step === 1 && (!files.dniFront || !files.dniBack)) {
      notify({ type: 'warning', title: 'Documentos Faltantes', message: 'Por favor sube ambos lados de tu ID.', icon: 'warning' });
      return;
    }
    if (step === 2 && !files.selfie) {
      notify({ type: 'warning', title: 'Selfie Requerida', message: 'Por favor provee una selfie clara para verificación.', icon: 'warning' });
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        if (!file) return null;
        const path = `verifications/${user.uid}/${key}_${Date.now()}`;
        const url = await uploadFile(file as File, path);
        return { key, url };
      });

      const results = await Promise.all(uploadPromises);
      const evidence: any = {
        submittedAt: serverTimestamp(),
        status: 'pending'
      };

      results.forEach(res => {
        if (res) evidence[res.key] = res.url;
      });

      await updateUserProfile(user.uid, {
        verificationEvidence: evidence
      });

      notify({
        type: 'success',
        title: 'Solicitud Enviada',
        message: 'Tus documentos están siendo revisados por nuestro equipo de seguridad.',
        icon: 'verified'
      });
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      notify({ type: 'error', title: 'Fallo en la Carga', message: 'No se pudo completar el proceso. Inténtalo de nuevo.', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full py-16 px-6 bg-light-50 min-h-screen">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-dark-800 mb-4">Verificación de Identidad</h1>
        <p className="text-sm font-bold text-gray-400">Completa estos pasos para desbloquear capacidades completas de venta y ganar confianza del comprador.</p>
      </div>

      {/* Stepper Header */}
      <div className="w-full flex justify-center items-center gap-6 mb-20">
        <div className={`flex flex-col items-center gap-4 ${step < 1 ? 'opacity-30' : ''}`}>
          <div className={`size-14 ${step >= 1 ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white border-2 border-light-200 text-gray-400'} rounded-2xl flex items-center justify-center transition-all duration-500`}>
            <span className="material-symbols-outlined text-2xl font-black">badge</span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-dark-800' : 'text-gray-400'}`}>ID Estándar</span>
        </div>
        <div className={`h-1 w-16 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary-vibrant' : 'bg-light-200'}`}></div>
        <div className={`flex flex-col items-center gap-4 ${step < 2 ? 'opacity-30' : ''}`}>
          <div className={`size-14 ${step >= 2 ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white border-2 border-light-200 text-gray-400'} rounded-2xl flex items-center justify-center transition-all duration-500`}>
            <span className="material-symbols-outlined text-2xl font-black">face</span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 2 ? 'text-dark-800' : 'text-gray-400'}`}>Biometría</span>
        </div>
        <div className={`h-1 w-16 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-primary-vibrant' : 'bg-light-200'}`}></div>
        <div className={`flex flex-col items-center gap-4 ${step < 3 ? 'opacity-30' : ''}`}>
          <div className={`size-14 ${step >= 3 ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white border-2 border-light-200 text-gray-400'} rounded-2xl flex items-center justify-center transition-all duration-500`}>
            <span className="material-symbols-outlined text-2xl font-black">task_alt</span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 3 ? 'text-dark-800' : 'text-gray-400'}`}>Finalizar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-start">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-4 md:p-10 rounded-4xl border border-light-200 shadow-premium">
            <h2 className="text-2xl font-black text-dark-800 mb-6">
              {step === 1 ? 'Escaneo de Documento' : step === 2 ? 'Prueba de Vida' : 'Confirmación'}
            </h2>
            <p className="text-sm font-bold text-gray-400 leading-relaxed mb-10">
              {step === 1 ? 'Sube fotos de alta resolución de tu ID emitido por el gobierno o pasaporte.' : step === 2 ? 'Toma una selfie en vivo con buena iluminación para verificar que coincides con tu ID.' : 'Por favor revisa tus documentos subidos antes de enviar para revisión oficial.'}
            </p>
            <div className="flex items-center gap-4 p-6 bg-primary-50 rounded-[32px] border border-primary-100/50">
              <span className="material-symbols-outlined text-primary-vibrant text-3xl font-black">shield</span>
              <div>
                <p className="text-[10px] font-black text-primary-900 uppercase tracking-widest mb-1">Encriptación de Extremo a Extremo</p>
                <p className="text-[9px] font-bold text-primary-600/70 uppercase">Protegido por Seguridad de Nivel Bancario</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white p-4 md:p-10 rounded-[40px] shadow-premium border border-light-200 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['dniFront', 'dniBack'].map(key => (
                  <div key={key} className="relative aspect-video rounded-[32px] overflow-hidden border-2 border-dashed border-light-200 bg-light-50 flex items-center justify-center group cursor-pointer hover:border-primary-200 transition-all" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, key)} />
                    {previews[key as keyof typeof previews] ? (
                      <div className="w-full h-full relative group">
                        <img src={previews[key as keyof typeof previews]} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-dark-800/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Imagen</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center group-hover:scale-110 transition-transform duration-500">
                        <div className="size-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <span className="material-symbols-outlined text-3xl text-primary-vibrant">add_a_photo</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key === 'dniFront' ? 'Frente del ID' : 'Dorso del ID'}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center">
                <div className="size-80 rounded-full overflow-hidden border-4 border-dashed border-light-200 bg-light-50 flex items-center justify-center relative group cursor-pointer hover:border-primary-200 transition-all" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'selfie')} />
                  {previews.selfie ? (
                    <img src={previews.selfie} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="text-center group-hover:scale-110 transition-transform duration-500">
                      <div className="size-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                        <span className="material-symbols-outlined text-5xl text-primary-vibrant">face</span>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capture Selfie</p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-10">Ensure your face is centered and clearly visible</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 py-10">
                <div className="p-4 md:p-12 bg-emerald-50 rounded-[40px] border-2 border-emerald-100/50 text-center">
                  <div className="size-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <span className="material-symbols-outlined text-emerald-500 text-5xl font-black animate-in zoom-in duration-500">verified</span>
                  </div>
                  <h3 className="text-3xl font-black text-emerald-900 mb-4">Toda la Documentación Lista</h3>
                  <p className="text-sm font-bold text-emerald-700/70 max-w-md mx-auto leading-relaxed">
                    Al enviar, nuestro equipo de seguridad verificará tus datos dentro de 24-48 horas hábiles. Recibirás una notificación una vez aprobado.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-12 pt-8 border-t border-light-100">
              {step > 1 ? (
                <button onClick={() => setStep(prev => prev - 1)} className="px-4 md:px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-dark-800 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Anterior
                </button>
              ) : <div></div>}

              {step < 3 ? (
                <button onClick={handleNext} className="btn-primary !rounded-full !py-5 !px-4 md:px-12 text-xs">
                  CONTINUAR
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 md:px-12 py-5 rounded-full bg-dark-800 text-white text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-dark-700 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      ENVIANDO...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      ENVIAR SOLICITUD
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
        const key = step === 1 ? (files.dniFront ? 'dniBack' : 'dniFront') : 'selfie';
        handleFileSelect(e, key);
      }} />
    </div>
  );
};

export default Verification;
