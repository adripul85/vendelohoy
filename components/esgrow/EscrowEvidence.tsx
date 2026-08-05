
import React from 'react';

interface Evidence {
    id: number;
    url: string;
    type: string;
    user: string;
    aiVerified: boolean;
}

interface Props {
    evidence: Evidence[];
    isVerifyingAI: boolean;
    onUpload: () => void;
}


const EscrowEvidence: React.FC<Props> = ({ evidence, isVerifyingAI, onUpload }) => {
    return (
        <section className="bg-white p-4 md:p-10 rounded-[40px] border border-light-200 shadow-premium">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-8">
                <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-black text-dark-800 flex items-center justify-center sm:justify-start gap-4">
                        <span className="material-symbols-outlined text-primary-vibrant font-black">receipt_long</span>
                        Protocol Evidence
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-3">Assets verification, dispatch proof & compliance logs</p>
                </div>
                <button
                    onClick={onUpload}
                    disabled={isVerifyingAI}
                    className="bg-dark-800 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-dark-800/10 disabled:opacity-50 active:scale-95"
                >
                    <span className="material-symbols-outlined text-xl font-black">{isVerifyingAI ? 'sync' : 'add_a_photo'}</span>
                    {isVerifyingAI ? 'AI Verification...' : 'Attach Proof'}
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {evidence.map((img) => (
                    <div key={img.id} className="group relative overflow-hidden rounded-3xl border border-light-200 bg-light-50 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className="aspect-square bg-white overflow-hidden relative">
                            <img src={img.url} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-800/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="p-5 bg-white flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">{img.type}</p>
                                {img.aiVerified && (
                                    <div className="size-5 bg-primary-50 text-primary-vibrant rounded-lg flex items-center justify-center" title="AI Validated">
                                        <span className="material-symbols-outlined text-xs font-black">verified</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[9px] font-black text-dark-800/60 truncate uppercase tracking-tight">Origin: {img.user}</p>
                        </div>
                    </div>
                ))}

                {evidence.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-light-200 rounded-[32px] bg-light-50/30 group hover:bg-light-50 transition-colors">
                        <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-light-200 mb-6 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-4xl text-gray-200">cloud_upload</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">No protocol evidence attached</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default EscrowEvidence;
