
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../lib/auth';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { subscribeToTransaction, subscribeToEvidence, submitEvidence, cancelTransaction, TransactionData, EscrowEvidence as IEscrowEvidence } from '../../lib/transactions';
import { getUserProfile } from '../../lib/users';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { uploadFile } from '../../lib/storage';

interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

const SupportChat = ({ transactionId }: { transactionId: string }) => {
  const { notify } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Bienvenido al Centro de Resolución. Soy tu asistente de mediación. ¿Cómo puedo ayudarte respecto al Trato #${transactionId.slice(0, 8)}?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const downloadChatHistory = () => {
    // Generate text file (same as before)
    const header = `--- REGISTRO DE MEDIACIÓN OFICIAL - VENDELO HOY! 🎯 ---\n`;
    const dealInfo = `Transacción: #${transactionId}\nFecha: ${new Date().toLocaleString()}\n`;
    const separator = `--------------------------------------------------\n\n`;
    const chatContent = messages.map(m => `[${m.role === 'user' ? 'USUARIO' : 'MEDIADOR IA'}]: ${m.text}\n`).join('\n');
    const footer = `\n\n--- FIN DEL REGISTRO ---\nEste documento constituye evidencia válida para procesos de resolución.`;

    const blob = new Blob([header + dealInfo + separator + chatContent + footer], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mediation_Log_${transactionId}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify({ type: 'info', title: 'Registro Descargado', message: 'Historial guardado exitosamente.', icon: 'description' });
  };

  const sendMessage = async (retryText?: string) => {
    const userMsg = retryText || input.trim();
    if (!userMsg || isTyping) return;

    if (!retryText) {
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setInput('');
    }

    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' }); // Ensure API KEY is avail
      // Use fallback if no key (mock response) for demo
      if (!process.env.API_KEY) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'model', text: "Modo Demo: No se detectó API Key. Pero entiendo tu mensaje." }]);
          setIsTyping(false);
        }, 1000);
        return;
      }

      const chat = ai.chats.create({
        model: 'gemini-2.0-flash-exp',
        config: {
          systemInstruction: `Eres un Mediador Profesional para la plataforma "Vendelo Hoy! 🎯".
          Tu objetivo es resolver disputas de manera imparcial, técnica y eficiente.
          Tono: Profesional, neutral y decisivo. Evita el uso excesivo de emojis.
          Contexto: Trato #${transactionId}.
          Prioridad: Solicitar evidencia objetiva y citar políticas de protección al comprador.
          Tu respuesta DEBE estar en ESPAÑOL.`,
        },
      });

      const responseStream = await chat.sendMessageStream({ message: userMsg });
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text || '';
        fullResponse += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', text: 'Error de protocolo. Por favor reintenta.', isError: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-10 right-10 z-[60] size-16 bg-dark-800 text-white rounded-full shadow-premium hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white/10">
        <span className="material-symbols-outlined text-3xl">{isOpen ? 'close' : 'support_agent'}</span>
      </button>
      {isOpen && (
        <div className="fixed bottom-28 right-10 z-[60] w-[90vw] max-w-[440px] h-[650px] bg-white rounded-[40px] flex flex-col shadow-premium border border-light-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-light-100 bg-light-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-dark-800 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-2xl font-black">shield_lock</span>
              </div>
              <div>
                <p className="font-black text-xs text-dark-800 uppercase tracking-widest leading-none">Vínculo de Mediación</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600 mt-2">Conexión Asegurada</p>
              </div>
            </div>
            <button onClick={downloadChatHistory} className="size-10 bg-white border border-light-200 rounded-xl text-gray-400 hover:text-dark-800 transition-colors flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-xl">description</span>
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-light-50/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-5 rounded-3xl shadow-sm text-sm font-bold leading-relaxed max-w-[85%] ${m.role === 'user' ? 'bg-dark-800 text-white rounded-tr-none' : 'bg-white text-dark-800 border border-light-100 rounded-tl-none'}`}>
                  {m.text || '...'}
                </div>
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-3 px-2">
                  {m.role === 'user' ? 'Usuario Autenticado' : 'Mediador Neutral IA'}
                </span>
              </div>
            ))}
            {isTyping && <div className="flex items-center gap-2 px-2"><div className="size-1.5 bg-red-600 rounded-full animate-bounce"></div><div className="size-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="size-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.4s]"></div></div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="p-6 bg-white border-t border-light-100 flex gap-4">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Detalla tu situación..." disabled={isTyping} className="flex-1 bg-light-50 border border-transparent rounded-[24px] px-6 py-4 text-xs font-black text-dark-800 placeholder:text-gray-300 focus:bg-white focus:border-primary-100 transition-all outline-none" />
            <button disabled={!input.trim() || isTyping} className="size-14 bg-red-600 text-white rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary-500/10 active:scale-90 disabled:opacity-30 flex items-center justify-center">
              <span className="material-symbols-outlined font-black">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

// Real-time mediation chat between buyer and seller
const MediationChat = ({ transactionId, userId, buyerId, sellerId }: { transactionId: string; userId: string; buyerId: string; sellerId: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userRole = userId === buyerId ? 'comprador' : userId === sellerId ? 'vendedor' : 'observador';

  useEffect(() => {
    if (!transactionId) return;
    const loadFirestore = async () => {
      const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
      const chatRef = collection(db, 'transactions', transactionId, 'dispute_chat');
      const q = query(chatRef, orderBy('createdAt', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return unsub;
    };

    let unsub: (() => void) | undefined;
    loadFirestore().then(u => unsub = u);
    return () => unsub?.();
  }, [transactionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'transactions', transactionId, 'dispute_chat'), {
        text: input.trim(),
        senderId: userId,
        role: userRole,
        createdAt: serverTimestamp()
      });
      setInput('');
    } catch (err) {
      console.error('Error sending mediation message:', err);
    }
    setSending(false);
  };

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-light-50/30">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-3xl text-gray-200 mb-2">chat_bubble</span>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Inicien la conversación para llegar a un acuerdo</p>
          </div>
        )}
        {messages.map((m) => {
          const isOwn = m.senderId === userId;
          const isBuyer = m.role === 'comprador';
          return (
            <div key={m.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-xs font-bold max-w-[85%] shadow-sm ${isOwn
                ? 'bg-dark-800 text-white rounded-tr-sm'
                : isBuyer
                  ? 'bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-sm'
                  : 'bg-amber-50 text-amber-900 border border-amber-100 rounded-tl-sm'
                }`}>
                {m.text}
              </div>
              <div className="flex items-center gap-2 mt-1 px-1">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isBuyer ? 'text-blue-400' : 'text-amber-400'}`}>
                  {isBuyer ? '🛒 Comprador' : '🏪 Vendedor'}
                </span>
                <span className="text-[8px] font-bold text-gray-300">{formatTime(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="p-4 bg-white border-t border-light-100 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={sending}
          className="flex-1 bg-light-50 rounded-2xl px-4 py-3 text-xs font-bold text-dark-800 placeholder:text-gray-300 outline-none focus:bg-white focus:ring-2 focus:ring-amber-100 transition-all border border-transparent"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="size-11 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all active:scale-90 disabled:opacity-30 flex items-center justify-center shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </form>
    </>
  );
};

const ProgressStepper = ({ status }: { status: string }) => {
  const steps = [
    { label: 'Acordado', icon: 'handshake', status: 'completed' },
    { label: 'Pagado', icon: 'shield_lock', status: 'completed' },
    { label: 'Enviado', icon: 'local_shipping', status: ['SHIPPED', 'DELIVERED_PENDING_REVIEW', 'DISPUTED'].includes(status) ? 'completed' : 'upcoming' },
    { label: 'Mediación', icon: 'gavel', status: status === 'DISPUTED' ? 'current' : (status === 'CANCELLED' ? 'failed' : 'upcoming') },
    { label: 'Resolución', icon: 'task_alt', status: 'upcoming' },
  ];

  return (
    <div className="w-full py-16 px-6">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-light-200 -translate-y-1/2 z-0"></div>
        {steps.map((step, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center">
            <div className={`size-12 rounded-[18px] flex items-center justify-center transition-all duration-700 border-2 ${step.status === 'completed' ? 'bg-dark-800 border-dark-800 text-white' : step.status === 'current' ? 'bg-white border-red-600 text-red-600 ring-8 ring-primary-50' : 'bg-light-50 border-light-200 text-gray-200'}`}>
              <span className="material-symbols-outlined text-base font-black">{step.status === 'completed' ? 'check' : step.icon}</span>
            </div>
            <span className={`absolute -bottom-10 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${step.status === 'current' ? 'text-red-600' : 'text-gray-300'}`}>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dispute = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionData & { id: string } | null>(null);
  const [evidence, setEvidence] = useState<IEscrowEvidence[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [counterparty, setCounterparty] = useState<any>(null);
  const [isOpeningDispute, setIsOpeningDispute] = useState(false);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');
  const [openingLoading, setOpeningLoading] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  useEffect(() => {
    if (!transactionId) return;
    const unsubTx = subscribeToTransaction(transactionId, (data) => setTransaction(data));
    const unsubEv = subscribeToEvidence(transactionId, (data) => setEvidence(data));
    return () => { unsubTx(); unsubEv(); };
  }, [transactionId]);

  useEffect(() => {
    if (!transaction || !user) return;
    const otherId = user.uid === transaction.buyerId ? transaction.sellerId : transaction.buyerId;
    getUserProfile(otherId).then(setCounterparty);
  }, [transaction, user]);

  const handleStartDispute = async () => {
    if (!disputeReasonInput.trim()) {
      notify({ type: 'error', title: 'Motivo Requerido', message: 'Por favor explica brevemente el problema.', icon: 'warning' });
      return;
    }
    if (evidence.length === 0) {
      notify({ type: 'error', title: 'Evidencia Requerida', message: 'Debes subir al menos una foto del producto como prueba.', icon: 'photo_camera' });
      return;
    }

    setOpeningLoading(true);
    try {
      const { updateTransactionStatus } = await import('../../lib/transactions');
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');

      // Update with reason and status
      const txRef = doc(db, "transactions", transactionId!);
      await updateDoc(txRef, {
        status: 'DISPUTED',
        disputeReason: disputeReasonInput,
        disputeStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setIsOpeningDispute(false);
      notify({ type: 'success', title: 'Disputa Iniciada', message: 'El caso ha sido abierto exitosamente.', icon: 'gavel' });

      // Notify the counterparty about the dispute
      try {
        const { sendNotification } = await import('../../lib/interactions');
        const otherId = user?.uid === transaction?.buyerId ? transaction?.sellerId : transaction?.buyerId;
        if (otherId) {
          await sendNotification(otherId, {
            title: '⚠️ Nueva Disputa Abierta',
            message: `Se abrió una disputa en la transacción "${transaction?.itemTitle || 'Producto'}". Motivo: "${disputeReasonInput.slice(0, 80)}". Ingresá al chat de mediación para resolver.`,
            type: 'warning',
            link: `/dispute/${transactionId}`
          });
        }
      } catch (e) { console.error('Error notifying counterparty:', e); }
    } catch (error) {
      console.error("Error starting dispute:", error);
      notify({ type: 'error', title: 'Error', message: 'No se pudo iniciar la disputa.', icon: 'error' });
    } finally {
      setOpeningLoading(false);
    }
  };

  const handleUploadEvidence = () => {
    evidenceInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !transactionId) return;

    setUploadingEvidence(true);
    notify({ type: 'info', title: 'Subiendo', message: 'Cargando evidencia...', icon: 'cloud_upload' });
    try {
      const url = await uploadFile(file, `disputes/${transactionId}/${Date.now()}_${file.name}`);
      await submitEvidence(transactionId, url, 'image', 'Evidencia subida por usuario');
      notify({ type: 'success', title: 'Cargado', message: 'Evidencia añadida exitosamente.', icon: 'check_circle' });
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Error', message: 'No se pudo subir la evidencia.', icon: 'error' });
    } finally {
      setUploadingEvidence(false);
      if (evidenceInputRef.current) evidenceInputRef.current.value = '';
    }
  };

  const handleCancel = async () => {
    if (!transactionId || !user) return;
    const res = await cancelTransaction(transactionId, user.uid);
    if (res.success) {
      setShowCancelModal(false);
      notify({ type: 'success', title: 'Cancelado', message: 'La transacción ha sido cancelada.', icon: 'cancel' });
      navigate('/dashboard');
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo cancelar.', icon: 'error' });
    }
  };

  if (!transaction) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <main className="max-w-7xl mx-auto px-6 py-16 bg-light-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Header Section */}
        <div className="lg:col-span-12">
          <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-premium flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <div className="size-24 rounded-[32px] bg-light-100 overflow-hidden border border-light-200 shadow-inner group">
                <img src={counterparty?.avatar || `https://ui-avatars.com/api/?name=${counterparty?.displayName || 'User'}&background=random`} alt="Counterparty" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] mb-2">Contraparte del Trato</p>
                <h2 className="text-3xl font-black text-dark-800 tracking-tight">{counterparty?.displayName || 'Usuario'}</h2>
                <div className="flex items-center gap-3 mt-3">
                  {counterparty?.verificationBadges?.identityVerified && <span className="bg-primary-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-primary-100">Identidad Verificada</span>}
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">• Protocolo #{transactionId?.slice(0, 8)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/profile/${counterparty?.uid}`)}
                className="px-8 py-4 bg-white text-dark-800 border-2 border-light-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-light-50 transition-all active:scale-95">Ver Perfil</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12">
          <ProgressStepper status={transaction.status} />
        </div>

        {/* Resolution Content */}
        <div className="lg:col-span-4 space-y-10">
          {/* MEDIATION CHAT PANEL */}
          <div className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden flex flex-col" style={{ height: '520px' }}>
            <div className="p-6 border-b border-light-100 bg-light-50/50 flex items-center gap-3">
              <div className="size-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
                <span className="material-symbols-outlined text-lg font-black">forum</span>
              </div>
              <div>
                <p className="font-black text-xs text-dark-800 uppercase tracking-widest leading-none">Chat de Mediación</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ambas partes pueden negociar aquí</p>
              </div>
            </div>

            <MediationChat
              transactionId={transactionId!}
              userId={user?.uid || ''}
              buyerId={transaction.buyerId}
              sellerId={transaction.sellerId}
            />
          </div>

          <div className="bg-dark-800 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-32 bg-red-600/20 blur-[60px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="flex items-center gap-4 mb-8">
              <span className="material-symbols-outlined text-red-600 font-black">shield_with_heart</span>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Garantía (Escrow) Activa</h3>
            </div>
            <p className="text-[11px] font-medium text-gray-400 leading-relaxed italic relative z-10">
              "El capital de ${transaction.amount?.toLocaleString()} ha sido congelado en el libro contable seguro. La liberación solo ocurrirá tras la resolución del protocolo."
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-12">
          {/* Evidence Grid */}
          <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-premium">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Bóveda de Evidencia</h3>
              <button onClick={handleUploadEvidence} className="text-[10px] font-black text-red-600 flex items-center gap-2 uppercase tracking-widest hover:underline group">
                <span className="material-symbols-outlined text-base font-black group-hover:rotate-90 transition-transform">add_circle</span>
                Cargar Archivos
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
              {evidence.map((ev, i) => (
                <div key={ev.id || i} className="aspect-square rounded-[24px] bg-light-50 border border-light-100 overflow-hidden hover:scale-105 transition-all cursor-pointer shadow-sm group relative">
                  <img src={ev.url} alt="doc" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-1 text-center truncate">{ev.description}</div>
                </div>
              ))}
              <div
                onClick={uploadingEvidence ? undefined : handleUploadEvidence}
                className={`aspect-square rounded-[24px] border-2 border-dashed border-light-200 flex flex-col items-center justify-center text-gray-200 transition-all group ${uploadingEvidence ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-600/30 hover:bg-primary-50 cursor-pointer'}`}>
                {uploadingEvidence ? (
                  <span className="material-symbols-outlined text-3xl font-black animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-3xl font-black group-hover:scale-110 transition-transform">add</span>
                )}
              </div>
              <input type="file" accept="image/*" ref={evidenceInputRef} onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          {/* Action Center */}
          <div className="bg-dark-800 p-12 rounded-[50px] shadow-premium text-center flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight relative z-10">Terminal de Resolución</h3>
            <p className="text-[9px] font-black text-red-600 uppercase tracking-[0.4em] mb-12 relative z-10">Estado: {transaction.status}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative z-10">
              {transaction.status === 'DISPUTED' ? (
                <>
                  <div className="col-span-full mb-8 p-6 bg-white/5 rounded-3xl border border-white/10 text-left">
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">Motivo del Reclamo:</p>
                    <p className="text-[11px] font-medium text-gray-300 italic">"{transaction.disputeReason || 'No especificado'}"</p>
                  </div>

                  {user?.uid === transaction.sellerId && !transaction.isAmicableReturnAccepted && (
                    <button
                      onClick={async () => {
                        try {
                          const { acceptAmicableReturn } = await import('../../lib/transactions');
                          await acceptAmicableReturn(transactionId!, user.uid);
                          notify({ type: 'success', title: 'Devolución Aceptada', message: 'Has aceptado la devolución del producto.', icon: 'handshake' });
                        } catch (error: any) {
                          console.error(error);
                          notify({ type: 'error', title: 'Error', message: 'No se pudo aceptar la devolución.', icon: 'error' });
                        }
                      }}
                      className="col-span-full p-6 bg-white text-emerald-600 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-50 transition-all shadow-xl active:scale-95 group mb-4"
                    >
                      Aceptar Devolución Amigable
                    </button>
                  )}

                  {/* Resoluciones eliminadas por seguridad. Se hacen desde el AdminDashboard. */}

                  {/* Escalar a Árbitro Humano */}
                  <button
                    onClick={async () => {
                      if (!window.confirm('¿Escalar esta disputa a un administrador?\n\nUn árbitro humano revisará la evidencia y tomará una decisión final vinculante.')) return;
                      try {
                        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
                        await updateDoc(doc(db, 'transactions', transactionId!), {
                          disputeEscalated: true,
                          disputeEscalatedAt: serverTimestamp(),
                          updatedAt: serverTimestamp()
                        });
                        // Notify admin
                        const { getSystemAdminId } = await import('../../lib/admin');
                        const adminId = await getSystemAdminId();
                        if (adminId) {
                          const { sendNotification } = await import('../../lib/interactions');
                          await sendNotification(adminId, {
                            title: '🚨 Disputa Escalada',
                            message: `La disputa del trato #${transactionId!.slice(0, 8)} fue escalada. Motivo: "${transaction?.disputeReason?.slice(0, 60) || 'N/A'}". Requiere tu intervención.`,
                            type: 'error',
                            link: `/dispute/${transactionId}`
                          });
                        }
                        notify({ type: 'warning', title: 'Escalada Enviada', message: 'Un árbitro humano (admin) revisará el caso y tomará una decisión.', icon: 'supervisor_account' });
                      } catch (err) {
                        console.error(err);
                        notify({ type: 'error', title: 'Error', message: 'No se pudo escalar la disputa.', icon: 'error' });
                      }
                    }}
                    className="col-span-full p-6 bg-dark-700 border border-white/5 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-dark-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">supervisor_account</span>
                    Escalar a Árbitro Humano
                  </button>
                </>
              ) : isOpeningDispute ? (
                <div className="col-span-full space-y-6 text-left animate-in fade-in slide-in-from-bottom-4">
                  <div>
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block mb-3">Detalle del Inconveniente (Obligatorio)</label>
                    <textarea
                      value={disputeReasonInput}
                      onChange={(e) => setDisputeReasonInput(e.target.value)}
                      placeholder="Ej: El producto llegó con la pantalla rota aunque el empaque estaba bien..."
                      className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-xs text-white placeholder:text-white/20 outline-none focus:border-red-600 transition-all h-32"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsOpeningDispute(false)}
                      className="flex-1 p-5 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleStartDispute}
                      disabled={openingLoading}
                      className="flex-[2] p-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                    >
                      {openingLoading ? 'Procesando...' : 'Confirmar Reclamo Formal'}
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-white/30 text-center uppercase tracking-widest leading-relaxed">
                    Recuerda que debes haber subido evidencia en la bóveda superior para continuar.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setIsOpeningDispute(true)}
                  className="col-span-full p-6 bg-red-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl active:scale-95"
                >
                  Iniciar Disputa Formal
                </button>
              )}
              {!isOpeningDispute && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="col-span-full mt-6 text-[9px] font-black text-red-400 uppercase tracking-[0.4em] hover:text-red-300 transition-colors"
                >
                  Solicitar Anulación Absoluta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-dark-800/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white p-12 rounded-[60px] max-w-md w-full text-center border border-light-200 shadow-2xl scale-in-center">
            <div className="size-20 bg-red-50 text-red-500 rounded-[32px] mx-auto mb-8 flex items-center justify-center border border-red-100/50 shadow-sm animate-pulse">
              <span className="material-symbols-outlined text-4xl font-black">emergency_home</span>
            </div>
            <h3 className="text-3xl font-black text-dark-800 mb-4 uppercase tracking-tight">¿Confirmar Anulación?</h3>
            <p className="text-sm font-bold text-gray-400 mb-12 leading-relaxed px-4">
              Si cancelas, se aplicará una tarifa del 3% si eres el vendedor. El comprador recibirá un reembolso completo.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-5 bg-light-50 text-dark-800 font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] hover:bg-light-100 transition-all"
              >
                Abortar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-5 bg-red-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {transactionId && <SupportChat transactionId={transactionId} />}
    </main>
  );
};

export default Dispute;
