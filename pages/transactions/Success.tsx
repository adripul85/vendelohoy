
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';


const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [queryParams] = React.useState(new URLSearchParams(location.search));

  const status = queryParams.get('collection_status') || 'approved';
  const paymentMethod = queryParams.get('payment_method') || queryParams.get('payment_type') || 'MERCADO_PAGO';
  const transactionId = queryParams.get('external_reference') || 'N/A';
  const [transactionData, setTransactionData] = React.useState<any>(null);
  const { user, loading } = useAuth(); // Esperar a Firebase Auth

  React.useEffect(() => {
    if (loading || !user) return; // Evitar la Race Condition de Auth

    if (transactionId && transactionId !== 'N/A') {
      import('../../lib/transactions').then(({ getTransaction, updateTransactionStatus }) => {
        import('../../lib/items').then(({ updateItem }) => {
          getTransaction(transactionId).then(data => {
            if (data) {
              setTransactionData(data);
              // AUTO-FIX: Ensure status moves to PAID_HELD if payment approved
              if (status === 'approved' && data.status === 'PENDING_PAYMENT') {
                user.getIdToken().then(token => {
                  fetch('/api/confirm-payment', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ transactionId })
                  })
                  .then(res => res.json())
                  .then(apiRes => {
                    if (apiRes.success) {
                      setTransactionData((prev: any) => ({ ...prev, status: 'PAID_HELD' }));
                      // Notify seller about the sale
                      if (data.sellerId) {
                        import('../../lib/interactions').then(({ sendNotification }) => {
                          sendNotification(data.sellerId, {
                            title: '🎉 ¡Nueva Venta!',
                            message: `Tu producto "${data.itemTitle || 'Producto'}" se vendió por $${(data.amountTotal || data.amount || 0).toLocaleString()}. Los fondos están en garantía hasta que confirmes la entrega.`,
                            type: 'success',
                            link: `/dashboard`
                          });
                        });
                      }
                    } else {
                      console.warn("Backend API failed, trying local fallback:", apiRes.error);
                      updateTransactionStatus(transactionId, 'PAID_HELD').then(res => {
                          if(res?.success) setTransactionData((prev: any) => ({ ...prev, status: 'PAID_HELD' }));
                      }).catch(console.error);
                    }
                  })
                  .catch(err => {
                      console.error("API Fetch Error:", err);
                      // Local Fallback si la API no está disponible en testing
                      updateTransactionStatus(transactionId, 'PAID_HELD').then(res => {
                          if(res?.success) setTransactionData((prev: any) => ({ ...prev, status: 'PAID_HELD' }));
                      }).catch(console.error);
                  });
                });
              } else if ((status === 'pending' || status === 'in_process') && data.status === 'PENDING_PAYMENT') {
                // Si el pago está pendiente (Transferencia/Efectivo/MercadoPago en revisión)
                // Ocultamos el producto pasándolo a PENDING_PAYMENT
                updateItem(data.itemId, { status: 'PENDING_PAYMENT' }).catch(console.error);
              }
            }
          });
        });
      });
    }
  }, [transactionId, status, user, loading]);

  React.useEffect(() => {
    if (status === 'approved') {
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      });
    }
  }, [status]);

  const { title: stateTitle, total: stateTotal } = location.state || {};
  
  const displayTitle = transactionData?.itemTitle || stateTitle || 'Producto Adquirido';
  const displayTotal = transactionData?.amountTotal || transactionData?.total || stateTotal || 0;

  const isTransfer = paymentMethod === 'TRANSFER';
  const isCash = paymentMethod === 'CASH';
  const isPending = status === 'pending' || status === 'in_process';

  return (
    <main className="flex-grow flex flex-col items-center py-20 px-6 bg-light-50 min-h-screen">
      <div className="max-w-3xl w-full flex flex-col items-center">

        {/* Dynamic Header */}
        <div className="text-center mb-16">
          {isPending && isTransfer ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="size-24 bg-dark-800 text-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-premium">
                <span className="material-symbols-outlined text-5xl font-black">account_balance</span>
              </div>
              <h1 className="text-4xl font-black text-dark-800 mb-4 uppercase tracking-tight">Solicitud de Transferencia</h1>
              <p className="text-sm font-bold text-gray-400">Reserva bloqueada. Completa la transferencia para notificar al vendedor.</p>
            </div>
          ) : isPending && isCash ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="size-24 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <span className="material-symbols-outlined text-5xl font-black">handshake</span>
              </div>
              <h1 className="text-4xl font-black text-dark-800 mb-4 uppercase tracking-tight">Trato Inicializado</h1>
              <p className="text-sm font-bold text-gray-400">Coordenadas de entrega requeridas. La liquidación será física.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="size-24 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <span className="material-symbols-outlined text-5xl font-black">check_circle</span>
              </div>
              <h1 className="text-4xl font-black text-emerald-600 mb-4 uppercase tracking-tight">¡Pago Realizado! 🎉</h1>
              <p className="text-sm font-bold text-gray-400">Tu pago se acreditó correctamente. Los fondos están seguros hasta que confirmes la entrega.</p>
            </div>
          )}
        </div>

        {/* Transaction Ticket */}
        <div className="w-full bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden mb-16 animate-in slide-in-from-bottom-8 duration-1000">

          {/* Transfer Instructions */}
          {isTransfer && (
            <div className="p-4 md:p-10 bg-amber-50/50 border-b border-amber-100">
              <h3 className="text-[10px] font-black text-amber-600 mb-8 uppercase tracking-[0.3em]">Trato Directo con el Vendedor</h3>
              <div className="bg-white p-8 rounded-[32px] border border-amber-200 shadow-sm flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-5xl text-amber-400 mb-4">handshake</span>
                <p className="text-sm font-bold text-dark-800 mb-2">Comunicate con el vendedor desde el chat para pedirle su CBU / CVU.</p>
                <p className="text-xs text-gray-500 max-w-md">Una vez que le transfieras el dinero, el vendedor te enviará el producto. Este método de pago es directo y <strong className="text-amber-600">no cuenta con la garantía de Compra Protegida</strong> de la plataforma.</p>
              </div>
            </div>
          )}

          {/* Ticket Header */}
          <div className="p-4 md:p-10 border-b border-light-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 mb-2">Código de Transacción</p>
              <h3 className="text-2xl font-black text-dark-800 font-mono tracking-tighter">{transactionId}</h3>
            </div>
            {displayTotal > 0 && (
              <div className="md:text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 mb-2">Total del Trato</p>
                <h3 className="text-4xl font-black text-dark-800 tracking-tighter">$ {displayTotal.toLocaleString()}</h3>
              </div>
            )}
          </div>

          <div className="p-4 md:p-10 md:p-14">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 leading-none">Producto</h4>
            <h4 className="text-xl font-black text-dark-800 tracking-tight mb-10">{displayTitle}</h4>

            <div className={`p-8 rounded-[32px] border flex flex-col md:flex-row items-center gap-6 text-center md:text-left ${isTransfer ? 'bg-amber-50 border-amber-100' : 'bg-primary-50 border-primary-100'}`}>
              <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 ${isTransfer ? 'bg-white text-amber-500' : 'bg-white text-primary-vibrant'} shadow-sm`}>
                <span className="material-symbols-outlined text-3xl font-black">{isTransfer ? 'history' : 'verified_user'}</span>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${isTransfer ? 'text-amber-700' : 'text-primary-700'}`}>
                  {isTransfer ? 'Esperando Verificación' : 'Compra Segura'}
                </p>
                {isTransfer ? (
                  <p className="text-xs text-amber-900 leading-relaxed font-bold uppercase tracking-tight">Tras confirmar la transferencia, el vendedor despachará tu producto.</p>
                ) : (
                  <p className="text-xs text-primary-900 leading-relaxed font-bold uppercase tracking-tight">
                    {isCash ? 'Acordá con el vendedor el lugar de encuentro y pago.' : 'Tu dinero está protegido. Los fondos se retienen hasta que verifiques la entrega del producto.'}
                  </p>
                )}
              </div>
            </div>

            {/* Next Steps Section */}
            {!isTransfer && (
              <div className="mt-10 pt-10 border-t border-light-100 text-center">
                <div className="size-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">task_alt</span>
                </div>
                <h3 className="text-xl font-black text-dark-800 mb-3">¿Qué sigue?</h3>
                <p className="text-xs font-bold text-gray-400 leading-relaxed max-w-md mx-auto mb-6">
                  Cuando recibas el producto, confirmá la recepción desde tu Dashboard para liberar los fondos al vendedor.
                </p>
                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100 justify-center">
                  <span className="material-symbols-outlined">schedule</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">Autoliberación en 48hs si no hay reclamos.</p>
                </div>
              </div>
            )}

            {/* Shipping Status Section */}
            {transactionData?.deliveryMethod === 'SHIPPING' && (
              <div className="mt-10 pt-10 border-t border-light-100 text-center">
                <div className="size-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-4xl">local_shipping</span>
                </div>
                <h3 className="text-2xl font-black text-dark-800 mb-2">Envío Certificado Pendiente</h3>
                <p className="text-sm font-bold text-gray-400 max-w-lg mx-auto">
                  El vendedor está preparando tu paquete. Recibirás el código de seguimiento aquí y por email apenas sea despachado.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center px-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-4 md:px-12 py-6 bg-dark-800 text-white font-black rounded-3xl hover:opacity-90 transition-all shadow-2xl shadow-dark-800/20 flex items-center justify-center gap-4 active:scale-95 group"
          >
            <span className="material-symbols-outlined group-hover:rotate-[360deg] transition-transform duration-700">dashboard_customize</span>
            <span className="uppercase tracking-[0.2em] text-[10px]">Ver mis compras</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 md:px-12 py-6 bg-white border-2 border-light-200 text-dark-800 font-black rounded-3xl hover:bg-light-50 transition-all flex items-center justify-center gap-4 active:scale-95"
          >
            <span className="material-symbols-outlined">storefront</span>
            <span className="uppercase tracking-[0.2em] text-[10px]">Seguir Comprando</span>
          </button>
        </div>

        <div className="mt-20 flex flex-col items-center gap-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
          <div className="size-1 bg-gray-300 rounded-full w-24 mb-4"></div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-3">
            <span className="material-symbols-outlined text-sm">support_agent</span>
            ¿Requieres asistencia?
          </p>
          <Link to="/help" className="text-[10px] font-black text-dark-800 uppercase tracking-widest hover:text-primary-vibrant underline underline-offset-4">Contactar Soporte</Link>
        </div>
      </div>
    </main>
  );
};

export default Success;
