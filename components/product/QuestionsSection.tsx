import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { askQuestion, getQuestions, answerQuestion, QuestionData } from '../../lib/questions';
import { useNotification } from '../../context/NotificationContext';

interface QuestionsSectionProps {
    itemId: string;
    sellerId: string;
    itemTitle: string; // Added for notifications
}

// Helper function to format relative time
const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'En este momento';

    const now = new Date();
    const then = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Recién';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return then.toLocaleDateString();
};

export default function QuestionsSection({ itemId, sellerId, itemTitle }: QuestionsSectionProps) {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const { notify } = useNotification();

    const [questions, setQuestions] = useState<(QuestionData & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [questionText, setQuestionText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');

    const isSeller = user?.uid === sellerId;

    // Load questions with real-time subscription
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupSubscription = async () => {
            if (!itemId) return;
            setLoading(true);
            const { subscribeToQuestions } = await import('../../lib/questions');
            unsubscribe = await subscribeToQuestions(itemId, (data) => {
                setQuestions(data);
                setLoading(false);
            });
        };

        setupSubscription();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [itemId]);

    // Submit question
    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            notify({ type: 'warning', title: 'Inicia sesión', message: 'Debes iniciar sesión para hacer una pregunta.', icon: 'login' });
            navigate('/login');
            return;
        }

        if (!questionText.trim()) {
            notify({ type: 'warning', title: 'Escribe algo', message: 'Por favor, escribe tu pregunta.', icon: 'edit' });
            return;
        }

        if (questionText.length > 500) {
            notify({ type: 'warning', title: 'Muy larga', message: 'La pregunta no puede superar los 500 caracteres.', icon: 'warning' });
            return;
        }

        setSubmitting(true);

        const result = await askQuestion(
            itemId,
            questionText,
            user.uid,
            userProfile?.displayName || user.displayName || 'Productor Anónimo',
            userProfile?.avatar || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}`,
            sellerId,
            itemTitle
        );

        setSubmitting(false);

        if (result.success) {
            notify({ type: 'success', title: 'Pregunta enviada', message: 'El vendedor ha sido notificado.', icon: 'check_circle' });
            setQuestionText('');
            setQuestionText('');
        } else {
            notify({ type: 'error', title: 'Error al enviar', message: 'No se pudo enviar la pregunta.', icon: 'error' });
        }
    };

    // Submit answer
    const handleAnswerQuestion = async (questionId: string, buyerId: string) => {
        if (!answerText.trim()) {
            notify({ type: 'warning', title: 'Escrib algo', message: 'Por favor, escribe una respuesta.', icon: 'edit' });
            return;
        }

        const result = await answerQuestion(
            questionId,
            answerText,
            user!.uid,
            buyerId,
            itemId,
            itemTitle
        );

        if (result.success) {
            notify({ type: 'success', title: 'Respuesta enviada', message: 'La respuesta ya es pública.', icon: 'check_circle' });
            setAnsweringId(null);
            setAnswerText('');
            setAnswerText('');
        } else {
            notify({ type: 'error', title: 'Error de envío', message: 'Fallo al enviar la respuesta.', icon: 'error' });
        }
    };

    return (
        <section className="bg-white rounded-[40px] border border-light-200/50 p-4 md:p-12 shadow-premium relative overflow-hidden">
            {/* HUD Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="material-symbols-outlined text-[120px] font-black">forum</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-5 mb-12 relative z-10">
                <div className="size-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-3xl text-white">chat_bubble_outline</span>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-on-surface uppercase tracking-tight">Preguntas y Respuestas</h2>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mt-2 pl-1">Despeja todas tus dudas con el vendedor</p>
                </div>
            </div>

            {/* Question Form */}
            {!isSeller && (
                <form onSubmit={handleAskQuestion} className="mb-14 relative z-10">
                    <div className="bg-light-50/50 p-8 rounded-[32px] border border-light-100 shadow-inner-premium">
                        <label className="block text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-5 ml-2">
                            Haz una pregunta
                        </label>
                        <textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Escribe tu duda sobre el producto aquí..."
                            className="w-full p-6 rounded-2xl border border-light-200 bg-white focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none transition-all font-bold text-sm text-dark-800 resize-none h-32"
                            maxLength={500}
                        />
                        <div className="flex items-center justify-between mt-5">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest pl-2">
                                {questionText.length} / 500 caracteres
                            </span>
                            <button
                                type="submit"
                                disabled={submitting || !questionText.trim()}
                                className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl shadow-primary/20 active:scale-95"
                            >
                                {submitting ? (
                                    <>
                                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg font-black">send</span>
                                        Preguntar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Questions List */}
            {loading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-light-50 rounded-[32px] animate-pulse border border-light-100" />
                    ))}
                </div>
            ) : questions.length > 0 ? (
                <div className="space-y-10 relative z-10">
                    {questions.map((q) => (
                        <div key={q.id} className="group">
                            {/* Question Row */}
                            <div className="flex gap-6">
                                <Link to={`/profile/${q.askedBy}`} className="shrink-0">
                                    <img
                                        src={q.askedByAvatar}
                                        alt={q.askedByName}
                                        className="size-14 rounded-2xl object-cover ring-4 ring-light-50 group-hover:ring-primary/10 transition-all shadow-sm"
                                    />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="font-black text-on-surface text-[11px] uppercase tracking-tight">{q.askedByName}</span>
                                        <div className="size-1 bg-gray-200 rounded-full" />
                                        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{getRelativeTime(q.createdAt)}</span>
                                    </div>
                                    <p className="text-dark-800 leading-relaxed font-bold text-sm bg-light-50/30 p-5 rounded-2xl border border-light-100/50">
                                        {q.questionText}
                                    </p>
                                </div>
                            </div>

                            {/* Answer Row */}
                            {q.answerText ? (
                                <div className="ml-20 mt-6 bg-primary-50/50 p-8 rounded-[32px] border border-primary-100/50 relative overflow-hidden group/answer transition-all hover:bg-primary-50">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <span className="material-symbols-outlined text-4xl text-primary-vibrant font-black">verified</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4 relative z-10">
                                        <span className="material-symbols-outlined text-primary-vibrant text-lg font-black">shield_person</span>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-800 pl-1">Respuesta del Vendedor</span>
                                        <div className="size-1 bg-primary-200 rounded-full" />
                                        <span className="text-[9px] font-bold text-primary-600 uppercase tracking-widest">{getRelativeTime(q.answeredAt)}</span>
                                    </div>
                                    <p className="text-primary-950 leading-relaxed font-black text-sm relative z-10 border-l-4 border-primary-vibrant pl-6">
                                        {q.answerText}
                                    </p>
                                </div>
                            ) : isSeller ? (
                                // Answer form for seller
                                answeringId === q.id ? (
                                    <div className="ml-20 mt-6 bg-light-50 p-8 rounded-[32px] border border-dark-800/10 shadow-premium animate-in slide-in-from-top-4 duration-500">
                                        <textarea
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            placeholder="Escribe tu respuesta aquí..."
                                            className="w-full p-5 rounded-2xl border border-light-200 bg-white focus:border-dark-800 focus:ring-4 focus:ring-dark-800/5 outline-none transition-all font-bold text-sm resize-none h-32"
                                            rows={3}
                                            maxLength={1000}
                                            autoFocus
                                        />
                                        <div className="flex items-center gap-4 mt-5">
                                            <button
                                                onClick={() => handleAnswerQuestion(q.id, q.askedBy)}
                                                className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-600 transition-all flex items-center gap-3 shadow-xl shadow-primary/20"
                                            >
                                                <span className="material-symbols-outlined text-lg">publish</span>
                                                Enviar Respuesta
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAnsweringId(null);
                                                    setAnswerText('');
                                                }}
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-6 py-4 hover:text-dark-800 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAnsweringId(q.id)}
                                        className="ml-20 mt-4 text-primary-vibrant font-black text-[10px] uppercase tracking-[0.2em] hover:text-primary-900 transition-all flex items-center gap-3 group/btn"
                                    >
                                        <div className="size-8 bg-primary-50 rounded-lg flex items-center justify-center group-hover/btn:bg-primary-100 transition-colors">
                                            <span className="material-symbols-outlined text-lg">reply</span>
                                        </div>
                                        Proveer Respuesta
                                    </button>
                                )
                            ) : (
                                <div className="ml-20 mt-5 flex items-center gap-3 opacity-40 grayscale pl-2">
                                    <span className="material-symbols-outlined text-lg animate-pulse">history</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Esperando respuesta del vendedor...</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                // Empty state
                <div className="text-center py-24 bg-light-50/50 rounded-[40px] border border-light-100 border-dashed relative z-10">
                    <div className="bg-white size-24 rounded-3xl mb-8 flex items-center justify-center mx-auto shadow-sm border border-light-100">
                        <span className="material-symbols-outlined text-5xl text-gray-200">question_answer</span>
                    </div>
                    <h3 className="text-xl font-black text-dark-800 mb-3 uppercase tracking-tight">Sin preguntas aún</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 max-w-xs mx-auto leading-relaxed">
                        {isSeller ? 'Aun no hay consultas sobre este producto' : 'Sé el primero en hacer una pregunta'}
                    </p>
                </div>
            )}
        </section>
    );
}
