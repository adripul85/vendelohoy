import React from 'react';
import { UserProfile } from '../../lib/users';
import { TransactionData } from '../../lib/transactions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    buyer: UserProfile;
    transaction: TransactionData & { id: string };
}

export default function CustomerDetailModal({ isOpen, onClose, buyer, transaction }: CustomerDetailModalProps) {
    if (!isOpen) return null;

    const formattedDate = transaction.createdAt 
        ? format(transaction.createdAt.toDate(), "d 'de' MMMM 'de' yyyy", { locale: es }) 
        : 'Fecha desconocida';

    const shortDate = transaction.createdAt 
        ? format(transaction.createdAt.toDate(), "dd MMM", { locale: es })
        : 'N/A';

    const whatsappLink = buyer.phone 
        ? `https://wa.me/${buyer.phone.replace(/\D/g, '')}` 
        : null;

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-50 w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-white p-6 md:p-8 flex items-center justify-between border-b border-slate-100">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Detalles del cliente</h2>
                        <h3 className="text-3xl font-black text-slate-900 mt-4 tracking-tighter">{buyer.displayName || 'Usuario'}</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Primera interacción el {formattedDate}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <button className="hidden sm:flex px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                            Más opciones
                        </button>
                        <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Editar
                        </button>
                        <button onClick={onClose} className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 ml-2 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 max-h-[60vh] overflow-y-auto">
                    {/* Left Column: Sales */}
                    <div className="flex-1 bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm">
                        <h4 className="text-xl font-black text-slate-800 tracking-tight mb-6">1 Venta</h4>
                        
                        <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-emerald-600 font-bold text-sm">#{transaction.id.slice(0, 8)}</p>
                                    <p className="font-bold text-slate-800 text-sm mt-1">{buyer.displayName || 'Usuario'}</p>
                                    <p className="text-emerald-600 font-medium text-xs flex items-center gap-1 mt-1 cursor-pointer hover:text-emerald-700 transition-colors">
                                        1 unidad <span className="material-symbols-outlined text-[14px]">expand_more</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-500 capitalize">{shortDate}</p>
                                    <p className="text-lg font-black text-slate-800 tracking-tight mt-1">
                                        ${(transaction.amountTotal || transaction.amount).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                    transaction.status === 'CANCELLED' || transaction.status === 'REFUNDED'
                                    ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                    <span className="material-symbols-outlined text-[14px]">
                                        {transaction.status === 'CANCELLED' ? 'block' : 'payments'}
                                    </span>
                                    {transaction.status === 'CANCELLED' ? 'Cancelada' : 'Pagada'}
                                </span>
                                
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                                    {transaction.status === 'COMPLETED' ? 'Entregada' : 'Pendiente'}
                                </span>
                            </div>
                            
                            <p className="text-xs text-slate-600 font-medium mt-4 flex items-center gap-2 pt-3 border-t border-slate-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                {transaction.paymentMethod === 'TRANSFER' ? 'Transferencia' : transaction.paymentMethod === 'MERCADO_PAGO' ? 'MercadoPago' : transaction.paymentMethod === 'CASH' ? 'Efectivo' : 'Otro'} 
                                {' - '}
                                {transaction.deliveryMethod === 'acordar' || transaction.deliveryMethod === 'en_mano' ? 'A convenir' : transaction.deliveryMethod}
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Customer Info */}
                    <div className="w-full md:w-[320px] bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm relative h-fit">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <h4 className="text-xl font-black text-slate-800 tracking-tight">Datos del cliente</h4>
                            {whatsappLink && (
                                <a 
                                    href={whatsappLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="size-10 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors border border-emerald-100 shadow-sm"
                                    title="Contactar por WhatsApp"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chat</span>
                                </a>
                            )}
                        </div>
                        
                        <div className="space-y-4 text-sm text-slate-600 font-medium">
                            <p className="font-bold text-slate-900 text-base">{buyer.displayName || 'Sin nombre'}</p>
                            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-slate-400">mail</span> {buyer.email || 'Email no registrado'}</p>
                            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-slate-400">call</span> {buyer.phone || 'Teléfono no registrado'}</p>
                            <p className="pt-2 border-t border-slate-100">DNI/CUIT: <span className="font-bold text-slate-800">{buyer.dni || 'No especificado'}</span></p>
                            <div className="pt-2 border-t border-slate-100">
                                {buyer.location?.address ? (
                                    <p className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0 mt-0.5">location_on</span>
                                        <span>
                                            <span className="block">{buyer.location.address}</span>
                                            <span className="block text-xs mt-1 text-slate-500">{buyer.location.city}, {buyer.location.state}</span>
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-slate-500 italic flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">location_off</span> Dirección no especificada</p>
                                )}
                            </div>
                        </div>

                        <button className="mt-8 pt-4 w-full border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Eliminar datos del cliente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
