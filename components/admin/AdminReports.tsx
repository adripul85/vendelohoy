import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { json2csv } from 'json-2-csv';
import { fetchMonthlySales } from '../../lib/admin';
import { useNotification } from '../../context/NotificationContext';

export default function AdminReports() {
    const [isGenerating, setIsGenerating] = useState(false);
    const { notify } = useNotification();

    const exportMonthlyReport = async (month: string) => {
        setIsGenerating(true);
        try {
            // 1. Consultamos las ventas finalizadas del mes
            const sales = await fetchMonthlySales(month);

            if (sales.length === 0) {
                notify({ type: 'warning', title: 'Sin Datos', message: 'No hay ventas completadas en este periodo.', icon: 'warning' });
                setIsGenerating(false);
                return;
            }

            // 2. Mapeamos los datos para que sean legibles para el contador
            const reportData = sales.map((sale: any) => {
                const productPrice = sale.amountProduct || sale.amount || 0;
                const escrowFee = sale.amountPlatformFee || sale.platformFee || Math.round(productPrice * 0.05);
                
                let promoFee = 0;
                if (sale.isFlashSale || (sale.featuredFeeApplied && (sale.featuredFeeApplied === 0.1 || sale.featuredFeeApplied === 10 || sale.featuredFeeApplied >= 0.08))) {
                    promoFee = (sale.featuredFeeApplied && sale.featuredFeeApplied > 1) ? sale.featuredFeeApplied : Math.round(productPrice * 0.10);
                } else if (sale.isFeatured || (sale.featuredFeeApplied && sale.featuredFeeApplied > 0)) {
                    promoFee = (sale.featuredFeeApplied && sale.featuredFeeApplied > 1) ? sale.featuredFeeApplied : Math.round(productPrice * 0.05);
                }
                const totalAdminFee = escrowFee + promoFee;

                return {
                    Fecha: sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleDateString() : 'N/A',
                    ID_Operacion: sale.id,
                    Vendedor_ID: sale.sellerId,
                    Comprador_ID: sale.buyerId,
                    Monto_Trato: productPrice,
                    Comision_Escrow: escrowFee,
                    Comision_Destacado_Flash: promoFee,
                    Comision_VendeloHoy: totalAdminFee, // Tu ganancia total (Escrow + Promos)
                    Monto_a_Liquidar: productPrice, // Lo que va al vendedor
                    Estado: sale.status
                };
            });

            // 3. Convertimos a CSV y descargamos
            const csv = json2csv(reportData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            saveAs(blob, `VendeloHoy_Reporte_${month.replace(' ', '_')}.csv`);

            notify({ type: 'success', title: 'Reporte Generado', message: 'El archivo está listo para tu contador.', icon: 'info' });
        } catch (error) {
            console.error('Error exporting CSV:', error);
            notify({ type: 'error', title: 'Error', message: 'No se pudo generar el reporte.', icon: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const currentMonthLabel = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-surface p-8 md:p-10 rounded-3xl border border-outline-variant/30 shadow-2xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full mb-3">
                        <span className="material-symbols-outlined text-xs font-black">account_balance</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Auditoría Fiscal & AFIP/ARCA</span>
                    </div>
                    <h3 className="text-2xl font-black text-on-surface tracking-tight font-display">Reportes Impositivos y Liquidaciones</h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-1 max-w-2xl text-balance leading-relaxed">Exportá la actividad financiera (ventas completadas) para presentar ante ARCA. Trazabilidad en cuenta corriente de terceros sin sobrecarga tributaria.</p>
                </div>
                <button
                    onClick={() => exportMonthlyReport(currentMonthLabel)}
                    disabled={isGenerating}
                    className="bg-primary hover:bg-primary/90 text-on-primary px-7 py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 min-w-[240px] shadow-sm active:scale-95 shrink-0"
                >
                    <span className="material-symbols-outlined text-base">{isGenerating ? 'sync' : 'download'}</span>
                    {isGenerating ? 'Generando y calculando...' : `Descargar ${currentMonthLabel}`}
                </button>
            </div>

            <div className="bg-surface-container-low border-l-4 border-primary p-6 rounded-r-2xl border-y border-r border-outline-variant/30 flex flex-col sm:flex-row gap-4 items-start">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined font-black">info</span>
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase text-on-surface tracking-wider font-display mb-1">Protocolo Contable — Facturación de Intermediación</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                        Recuerda que debes emitir <strong className="text-on-surface font-black">Factura C (o A/B según tu condición fiscal)</strong> únicamente por la suma declarada en la columna <strong className="text-primary font-black">"Comision_VendeloHoy"</strong>. El resto del dinero (<span className="font-mono text-[11px] bg-surface px-1.5 py-0.5 rounded border border-outline-variant/30">Monto_a_Liquidar</span>) se considera legalmente como <em className="text-on-surface font-semibold">"fondos de terceros en tránsito"</em> asociados al protocolo de Escrow.
                    </p>
                </div>
            </div>
        </div>
    );
}
