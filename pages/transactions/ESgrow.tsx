
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Hooks
import { useEscrow, UserRole } from '../../hooks/useEscrow';

// Components
import EscrowStatusDisplay from '../../components/esgrow/EscrowStatus';
import EscrowChat from '../../components/esgrow/EscrowChat';
import EscrowEvidence from '../../components/esgrow/EscrowEvidence';
import EscrowActions from '../../components/esgrow/EscrowActions';

const ESgrow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const {
    dealData,
    currentUserRole,
    status,
    messages,
    evidence,
    isVerifyingAI,
    isTyping,
    deadline,
    actions,
    transaction
  } = useEscrow(id);

  const [trackingId, setTrackingId] = useState('');
  const [courier, setCourier] = useState('Correo Argentino');
  const hasEvidence = evidence && evidence.length > 0;
  const sellerInputRef = React.useRef<HTMLInputElement>(null);
  const buyerInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      actions.uploadEvidence(e.target.files[0], type);
    }
  };

  const triggerSuccessEffects = () => {
    // 1. Vibración Hápica
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 200]);
    }
    // 2. Confeti
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00C853', '#1a1a1a'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00C853', '#1a1a1a'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const downloadTicket = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Comprobante de Transacción Segura", 14, 22);
    doc.setFontSize(10);
    doc.text(`ID de Protocolo: ${dealData.id}`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 35);
    autoTable(doc, {
      startY: 45,
      head: [['Concepto', 'Detalle']],
      body: [
        ['Producto', dealData.title],
        ['Monto Liberado', `$${dealData.price}`],
        ['Método de Entrega', transaction?.deliveryMethod?.replace('_', ' ').toUpperCase() || 'NO ESPECIFICADO'],
        ['Vendedor ID', transaction?.sellerId || 'Verificado'],
        ['Comprador ID', transaction?.buyerId || 'Verificado'],
        ['Estado Final', 'COMPLETADO / FONDOS LIBERADOS'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [26, 26, 26] }
    });
    doc.save(`Ticket_Escrow_${dealData.id}.pdf`);
  };



  const handleDownload = () => {
    const content = `=== REGISTRO DE TRANSACCIÓN ===\nTrato: #${dealData.id}\nEstado: ${status}\n\n` +
      messages.map(m => `[${m.time}] ${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Registro_Protocolo_${dealData.id}.txt`;
    link.click();
    notify({ type: 'info', title: 'Registro Exportado', message: 'El historial de transacciones ha sido guardado.', icon: 'description' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 min-h-screen bg-light-50">
      {/* HEADER: Protocolo de Transacción */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 mb-16 bg-white p-10 rounded-[40px] border border-light-200 shadow-premium">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate(-1)} className="size-14 bg-light-50 rounded-2xl border border-light-200 hover:bg-white hover:shadow-sm transition-all flex items-center justify-center group">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-dark-800 tracking-tight">Trato en Curso</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">Referencia #{dealData.id}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4 bg-light-50/50 px-6 py-4 rounded-3xl border border-light-100">
            <img src={dealData.seller.avatar} alt="Seller" className="size-10 rounded-2xl object-cover border-2 border-white shadow-sm" />
            <div>
              <p className="text-[11px] font-black text-dark-800 uppercase tracking-tight">{dealData.seller.name}</p>
              <p className="text-[9px] text-primary-vibrant font-black uppercase tracking-widest mt-1">Vendedor Verificado</p>
            </div>
          </div>

          <div className="h-10 w-px bg-light-200 hidden xl:block mx-2"></div>

          <div className="relative">
            <select
              value={currentUserRole}
              onChange={(e) => actions.toggleRole(e.target.value as UserRole)}
              className="appearance-none pl-6 pr-12 py-4 bg-dark-800 text-white border-none rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] focus:ring-4 focus:ring-primary-vibrant/10 outline-none cursor-pointer shadow-xl shadow-dark-800/10"
            >
              <option value="COMPRADOR">Simulación: Comprador</option>
              <option value="VENDEDOR">Simulación: Vendedor</option>
              <option value="MEDIADOR">Simulación: Mediador</option>
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-sm">unfold_more</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-10">
          <EscrowStatusDisplay
            status={status}
            deadline={deadline}
          />

          {/* BUYER VIEW: Pending Payment Prompt */}
          {currentUserRole === 'COMPRADOR' && status === 'PENDING_PAYMENT' && (
            <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-200 shadow-premium mb-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="size-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2">Pago Pendiente</h3>
              <p className="text-[11px] text-amber-800/70 mb-6 font-bold">
                Para iniciar el protocolo de seguridad, debes completar el pago del activo.
              </p>
              <button
                onClick={() => navigate(`/checkout?tx=${id}`)}
                className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-vibrant/20 active:scale-95"
              >
                Pagar Ahora
              </button>
            </div>
          )}

          {/* BUYER VIEW: Confirm Receipt */}
          {currentUserRole === 'COMPRADOR' && (status === 'SHIPPED' || status === 'DELIVERED_PENDING_REVIEW') && (
            <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-premium mb-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="size-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">inventory_2</span>
              </div>

              <h3 className="text-sm font-black text-dark-800 uppercase tracking-widest mb-2">Confirmación de Recepción</h3>
              <p className="text-[10px] text-gray-500 mb-6 font-bold leading-relaxed max-w-xs mx-auto">
                {status === 'SHIPPED' 
                  ? 'Avisá cuando te llegue el paquete para iniciar tus 48hs de protección, o liberá los fondos directamente si está todo bien.' 
                  : 'Estás dentro de tus 48hs de protección. Revisá el producto tranquilo y liberá los fondos cuando estés conforme.'}
              </p>

              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  accept="image/*"
                  ref={buyerInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'RECEPCION')}
                />
                <button
                  onClick={() => buyerInputRef.current?.click()}
                  className="w-full btn-secondary py-4 flex items-center justify-center gap-2 border border-light-200"
                >
                  <span className="material-symbols-outlined">add_a_photo</span>
                  Subir Foto de Recepción (Opcional)
                </button>

                {status === 'SHIPPED' && (
                  <button
                    onClick={async () => {
                      const res = await actions.updateStatus('DELIVERED_PENDING_REVIEW', '📦 El comprador confirmó que recibió el paquete. Inician 48hs de prueba.');
                      if (res.success) {
                        notify({ type: 'success', title: 'Paquete Recibido', message: 'Tenés 48hs para revisarlo.', icon: 'inventory_2' });
                      }
                    }}
                    className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-colors"
                  >
                    Ya me llegó (Iniciar 48hs de prueba)
                  </button>
                )}

                <button
                  onClick={async () => {
                    if (!window.confirm('¿Confirmás que el producto está perfecto y querés liberar los fondos?\n\nEsta acción pagará al vendedor y NO se puede deshacer.')) return;
                    const res = await actions.releaseEscrow();
                    if (res.success) {
                      triggerSuccessEffects();
                      notify({ type: 'success', title: '¡Trato Hecho!', message: 'Fondos liberados al vendedor.', icon: 'verified' });
                    }
                  }}
                  className="w-full btn-primary bg-emerald-600 py-5 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 text-[11px] font-black uppercase tracking-widest"
                >
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  Todo perfecto (Liberar Fondos)
                </button>
              </div>

              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-[9px] font-black text-amber-700 uppercase tracking-tight flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  Autoliberación en 48hs si no hay reclamos.
                </p>
              </div>
            </div>
          )}

          {/* SELLER VIEW: Confirm Delivery */}
          {currentUserRole === 'VENDEDOR' && status === 'PAID_HELD' && (
            <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-premium mb-6 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-black text-dark-800 uppercase tracking-widest mb-6">Confirmar Entrega</h3>

              {!hasEvidence && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4 mb-6 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => sellerInputRef.current?.click()}>
                  <span className="material-symbols-outlined text-amber-600">add_a_photo</span>
                  <div>
                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight">Foto Requerida - Toca para subir</p>
                    <p className="text-[9px] text-amber-700 mt-1 leading-relaxed">
                      Sube una foto del paquete o producto antes de confirmar la entrega.
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={sellerInputRef}
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'ENVIO')}
              />

              <div className="space-y-4">
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full bg-light-50 border border-light-200 rounded-2xl py-4 px-6 font-bold text-xs outline-none"
                >
                  <option value="Correo Argentino">Correo Argentino (Protocolo Oficial)</option>
                  <option value="Andreani">Andreani</option>
                  <option value="OCASA">OCASA</option>
                  <option value="Entrega en domicilio">Entrega a domicilio (Vehículo propio)</option>
                  <option value="En mano">En mano (Entrega personal)</option>
                  <option value="Acordado">Acordado con el comprador</option>
                </select>

                {courier !== 'En mano' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Número de Seguimiento (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: AR123456789"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                      className="w-full bg-light-50 border border-light-200 rounded-2xl py-4 px-6 font-bold text-sm tracking-widest outline-none focus:border-primary-vibrant transition-all"
                    />
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (!window.confirm('¿Confirmás que ya entregaste/despachaste el producto?\n\nEsto quedará registrado como evidencia para el tribunal de disputas.')) return;
                    actions.registerTracking(trackingId || 'ENTREGA_PERSONAL', courier);
                    notify({ type: 'success', title: 'Entrega Registrada', message: 'El comprador será notificado. Los fondos se liberarán cuando confirme la recepción.', icon: 'local_shipping' });
                  }}
                  disabled={!hasEvidence}
                  className="w-full btn-primary py-5 text-[11px] font-black tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-vibrant/20 flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-xl">local_shipping</span>
                  Ya entregué el producto
                </button>

                <p className="text-[8px] text-gray-400 font-bold text-center leading-relaxed">
                  Los fondos se liberarán cuando el comprador confirme la recepción o tras 48hs sin reclamos.
                </p>
              </div>
            </div>
          )}

          {/* MEDIATOR VIEW: Admin Validation for Bank Transfers */}
          {currentUserRole === 'MEDIADOR' && status === 'PENDING_PAYMENT' && (
            <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-200 shadow-premium mb-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="size-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">account_balance</span>
              </div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2">Validación Administrativa</h3>
              <p className="text-[11px] text-amber-800/70 mb-6 font-bold">
                Verifica la acreditación en la cuenta bancaria de la empresa antes de confirmar.
              </p>
              <button
                onClick={() => actions.updateStatus('PAID_HELD', '🏦 Pago verificado en cuenta de empresa por el Administrador.')}
                className="w-full bg-dark-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-dark-800/10 active:scale-95"
              >
                Confirmar Transferencia Bancaria
              </button>
            </div>
          )}

          {/* COMPLETED/REFUNDED VIEW: Result display */}
          {(status === 'COMPLETED' || status === 'REFUNDED') && (
            <div className={`p-8 rounded-[32px] border text-center animate-in zoom-in shadow-premium mt-6 ${status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <span className={`material-symbols-outlined text-5xl mb-4 ${status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {status === 'COMPLETED' ? 'task_alt' : 'history'}
              </span>
              <h3 className={`text-xl font-black uppercase tracking-tight ${status === 'COMPLETED' ? 'text-emerald-900' : 'text-amber-900'}`}>
                {status === 'COMPLETED' ? 'Transacción Exitosa' : 'Transacción Reembolsada'}
              </h3>
              <p className={`text-xs mb-6 font-bold ${status === 'COMPLETED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {status === 'COMPLETED' ? 'El activo ha sido entregado y los fondos transferidos.' : 'Los fondos han sido devueltos al comprador conforme a la resolución.'}
              </p>
              {status === 'COMPLETED' && (
                <button
                  onClick={downloadTicket}
                  className="btn-primary bg-dark-800 w-full py-4 flex items-center justify-center gap-2 shadow-lg shadow-dark-800/20"
                >
                  <span className="material-symbols-outlined">download</span>
                  Descargar Ticket Legal (PDF)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-10">
          <EscrowChat
            messages={messages}
            currentUserRole={currentUserRole}
            onSendMessage={actions.sendMessage}
            onDownload={handleDownload}
            isTyping={isTyping}
          />

          <EscrowEvidence
            evidence={evidence}
            isVerifyingAI={isVerifyingAI}
            onUpload={() => sellerInputRef.current?.click()}
          />

          <EscrowActions
            status={status}
            currentUserRole={currentUserRole}
            price={dealData.price}
            isAmicableReturnAccepted={transaction?.isAmicableReturnAccepted}
            onUpdateStatus={actions.updateStatus}
            onReleaseFunds={() => actions.releaseEscrow()}
            onAcceptReturn={actions.acceptReturn}
            onConfirmReturnReceipt={actions.confirmReturnReceipt}
            onRequestMediation={() => actions.updateStatus('DISPUTED', '⚖️ Protocolo de mediación iniciado por el usuario.')}
            onCancel={() => {
              if (window.confirm("🚨 ¿Estás seguro de cancelar este trato?\n\nSe reembolsará el 100% de los fondos.\n\nEsta acción es irreversible.")) {
                actions.cancelEscrow();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ESgrow;
