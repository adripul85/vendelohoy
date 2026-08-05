import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ResolutionCenter() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeDisputes, setActiveDisputes] = useState<any[]>([]);
    const [eligibleTransactions, setEligibleTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Active Disputes (transactions with status 'DISPUTED')
                // Buyer Disputes
                const qDisputesBuyer = query(
                    collection(db, "transactions"),
                    where("buyerId", "==", user.uid),
                    where("status", "==", "DISPUTED"),
                    orderBy("createdAt", "desc")
                );

                // Seller Disputes
                const qDisputesSeller = query(
                    collection(db, "transactions"),
                    where("sellerId", "==", user.uid),
                    where("status", "==", "DISPUTED"),
                    orderBy("createdAt", "desc")
                );

                const [disputesSnapBuyer, disputesSnapSeller] = await Promise.all([
                    getDocs(qDisputesBuyer),
                    getDocs(qDisputesSeller)
                ]);

                // Merge and dedup (though IDs should be unique across queries usually)
                const disputes = [
                    ...disputesSnapBuyer.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    ...disputesSnapSeller.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                ];

                setActiveDisputes(disputes);

                // 2. Fetch Eligible Transactions (PAID_HELD, SHIPPED, DELIVERED_PENDING_REVIEW)
                const qEligible = query(
                    collection(db, "transactions"),
                    where("buyerId", "==", user.uid),
                    where("status", "in", ["PAID_HELD", "SHIPPED", "DELIVERED_PENDING_REVIEW"]),
                    orderBy("createdAt", "desc")
                );
                const eligibleSnap = await getDocs(qEligible);
                const eligible = eligibleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEligibleTransactions(eligible);

            } catch (error) {
                console.error("Error fetching resolution data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (!user) return null; // Or redirect

    return (
        <div className="min-h-screen bg-light-50">
            <div className="bg-white border-b border-light-200">
                <div className="max-w-[1440px] mx-auto px-6 py-12">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/dashboard" className="text-gray-400 hover:text-dark-800 transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
                        </Link>
                    </div>
                    <h1 className="text-4xl font-black text-dark-800 tracking-tighter mb-2">Centro de Resolución</h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Estamos aquí para ayudarte a resolver cualquier inconveniente con tus órdenes.
                    </p>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">

                {/* LEFT COLUMN: ACTIONS */}
                <div className="lg:col-span-2 space-y-12">

                    {/* ACTIVE DISPUTES */}
                    {activeDisputes.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-dark-800 uppercase tracking-[0.2em]">Disputas Activas</h3>
                            {activeDisputes.map(dispute => (
                                <div key={dispute.id} className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                                            <span className="material-symbols-outlined text-3xl">gavel</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">En Mediación</p>
                                            <h4 className="text-xl font-black text-dark-800">{dispute.itemTitle}</h4>
                                            <p className="text-xs font-bold text-gray-400">Orden #{dispute.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <Link to={`/dispute/${dispute.id}`} className="px-8 py-4 bg-dark-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dark-900 transition-all">
                                        Ver Estado
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ELIGIBLE TRANSACTIONS */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-dark-800 uppercase tracking-[0.2em]">Seleccionar Orden para Reportar</h3>
                        {loading ? (
                            <LoadingSpinner />
                        ) : eligibleTransactions.length > 0 ? (
                            eligibleTransactions.map(tx => (
                                <div key={tx.id} className="bg-white p-6 rounded-[32px] border border-light-200 shadow-premium transition-all hover:border-light-300 group">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="size-14 rounded-2xl bg-light-50 flex items-center justify-center text-gray-400">
                                                <span className="material-symbols-outlined text-2xl">inventory_2</span>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-dark-800">{tx.itemTitle}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {tx.status === 'DELIVERED_PENDING_REVIEW' ? 'Entregado (Pendiente de Revisión)' : 'Completado'} • ${tx.total.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Link to={`/dispute/${tx.id}`} className="w-full md:w-auto px-6 py-3 border border-light-200 rounded-xl text-center font-black text-[10px] uppercase tracking-widest hover:bg-light-50 text-dark-800">
                                            Iniciar Reclamo
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-4 md:p-12 rounded-[40px] border border-light-200 shadow-premium text-center">
                                <div className="size-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
                                </div>
                                <h3 className="text-2xl font-black text-dark-800 mb-2">Todo en Orden</h3>
                                <p className="text-sm font-bold text-gray-400">No tienes transacciones elegibles para disputar en este momento.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: FAQ / INFO */}
                <div className="space-y-8">
                    <div className="bg-primary-vibrant p-8 rounded-[40px] text-white shadow-premium relative overflow-hidden">
                        <div className="relative z-10">
                            <span className="material-symbols-outlined text-4xl mb-4">support_agent</span>
                            <h3 className="text-2xl font-black mb-2">¿Necesitas Ayuda?</h3>
                            <p className="text-xs font-bold opacity-80 mb-8 leading-relaxed">
                                Nuestro equipo de soporte está disponible 24/7 para mediar en situaciones complejas.
                            </p>
                            <button className="w-full py-4 bg-white/20 backdrop-blur-md rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/30 transition-all border border-white/30">
                                Contactar Soporte
                            </button>
                        </div>
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium">
                        <h4 className="font-black text-dark-800 text-sm uppercase tracking-widest mb-6">Preguntas Frecuentes</h4>
                        <div className="space-y-4">
                            {[
                                {
                                    q: "¿Cuándo puedo abrir una disputa?",
                                    a: "Puedes abrir una disputa cuando el producto recibido no coincide con la descripción o tiene defectos no mencionados. Tienes 48 horas desde la recepción para iniciar el reclamo."
                                },
                                {
                                    q: "¿Qué evidencia necesito?",
                                    a: "Fotos y videos claros del producto, mostrando los defectos o discrepancias. También es útil mantener toda la comunicación dentro de la plataforma."
                                },
                                {
                                    q: "¿Cuánto tarda la mediación?",
                                    a: "Nuestro equipo revisa los casos en un plazo de 24-48 horas hábiles. La resolución final dependerá de la complejidad y cooperación de las partes."
                                },
                                {
                                    q: "¿Cómo funcionan los reembolsos?",
                                    a: "Si la disputa se resuelve a tu favor, los fondos retenidos en garantía se liberarán de nuevo a tu billetera inmediatamente."
                                }
                            ].map((item, i) => (
                                <FAQItem key={i} question={item.q} answer={item.a} />
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

const FAQItem = ({ question, answer }: { question: string, answer: string, key?: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            onClick={() => setIsOpen(!isOpen)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${isOpen ? 'bg-white border-primary-100 shadow-lg scale-[1.02]' : 'bg-light-50 border-light-100 hover:bg-light-100'}`}
        >
            <div className="flex items-center justify-between gap-4">
                <p className={`text-xs font-bold transition-colors ${isOpen ? 'text-primary-vibrant' : 'text-dark-800'}`}>{question}</p>
                <span className={`material-symbols-outlined text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-vibrant' : ''}`}>expand_more</span>
            </div>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-3 pb-1' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <p className="text-[10px] font-medium text-gray-500 leading-relaxed">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
};
