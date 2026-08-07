import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { publishItemsBatch } from '../../lib/items';
import { uploadImages } from '../../lib/storage';
import { useAuth } from '../../lib/auth';
import { useNotification } from '../../context/NotificationContext';
import { ItemData } from '../../lib/items';
import { CATEGORIES } from '../../lib/constants';

interface ParsedRow {
    titulo: string;
    precio: string;
    descripcion: string;
    categoria: string;
    condicion: string;
    stock: string;
    imagenes: string; // Comma separated filenames
    marca?: string;
    modelo?: string;
}

interface PendingProduct {
    data: ItemData;
    pendingImages: File[];
    missingImages: string[];
}

const BulkUpload: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const { user } = useAuth();
    const { notify } = useNotification();
    
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleCsvDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCsvFile(e.target.files[0]);
        }
    };

    const handleImagesDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeImage = (name: string) => {
        setImageFiles(prev => prev.filter(f => f.name !== name));
    };

    const processCsv = () => {
        if (!csvFile || !user) return;
        
        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data as ParsedRow[];
                
                const products: PendingProduct[] = rows.map(row => {
                    const expectedImages = row.imagenes ? row.imagenes.split(',').map(s => s.trim()) : [];
                    
                    const foundImages = expectedImages.map(imgName => 
                        imageFiles.find(f => f.name === imgName)
                    ).filter(Boolean) as File[];

                    const missingImages = expectedImages.filter(imgName => 
                        !imageFiles.find(f => f.name === imgName)
                    );

                    // Map string categories to valid options if possible
                    const validCategory = CATEGORIES.find(c => c.toLowerCase() === row.categoria?.toLowerCase()) || 'Otros';
                    
                    return {
                        data: {
                            title: row.titulo,
                            price: parseFloat(row.precio) || 0,
                            description: row.descripcion || '',
                            category: validCategory,
                            condition: (row.condicion?.toLowerCase() as any) || 'new',
                            quantity: parseInt(row.stock) || 1,
                            sellerId: user.uid,
                            images: [], // To be filled after upload
                            brand: row.marca || '',
                            model: row.modelo || '',
                        },
                        pendingImages: foundImages,
                        missingImages
                    };
                });
                
                setPendingProducts(products);
                notify({ type: 'success', title: 'CSV Procesado', message: `Se detectaron ${products.length} productos. Revisa los detalles antes de subir.`, icon: 'table_chart' });
            },
            error: (error: any) => {
                notify({ type: 'error', title: 'Error leyendo CSV', message: error.message, icon: 'error' });
            }
        });
    };

    const handleUploadAll = async () => {
        if (!user || pendingProducts.length === 0) return;
        setIsProcessing(true);
        setProgress(0);

        try {
            const finalProducts: ItemData[] = [];
            
            for (let i = 0; i < pendingProducts.length; i++) {
                const pending = pendingProducts[i];
                let uploadedUrls: string[] = [];
                
                if (pending.pendingImages.length > 0) {
                    uploadedUrls = await uploadImages(pending.pendingImages, user.uid);
                }

                finalProducts.push({
                    ...pending.data,
                    images: uploadedUrls.length > 0 ? uploadedUrls : ['https://via.placeholder.com/600?text=Sin+Imagen']
                });

                setProgress(Math.round(((i + 1) / pendingProducts.length) * 100));
            }

            const res = await publishItemsBatch(finalProducts);
            if (res.success) {
                notify({ type: 'success', title: '¡Éxito!', message: `Se publicaron ${res.count} productos correctamente.`, icon: 'check_circle' });
                setCsvFile(null);
                setImageFiles([]);
                setPendingProducts([]);
                onComplete();
            } else {
                throw res.error;
            }
        } catch (error) {
            notify({ type: 'error', title: 'Error en subida', message: 'Hubo un problema guardando los productos.', icon: 'error' });
            console.error(error);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const totalMissing = pendingProducts.reduce((acc, p) => acc + p.missingImages.length, 0);

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-600">upload_file</span>
                        Carga Masiva (Automágico)
                    </h3>
                    <p className="text-sm text-slate-500">Sube un CSV y múltiples fotos para publicar en segundos.</p>
                </div>
                <a 
                    href="data:text/csv;charset=utf-8,titulo,precio,descripcion,categoria,condicion,stock,imagenes%0ARemera%20Nike,25000,Remera%20deportiva,Ropa,new,10,remera-nike.jpg%0A" 
                    download="plantilla-oportunidades.csv"
                    className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Plantilla CSV
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* CSV DROPZONE */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors relative">
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleCsvDrop}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="size-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined">table_chart</span>
                    </div>
                    <p className="font-bold text-slate-700">Subir archivo CSV</p>
                    <p className="text-xs text-slate-500 mt-1">{csvFile ? csvFile.name : 'Arrastra tu archivo aquí o haz clic'}</p>
                </div>

                {/* IMAGES DROPZONE */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors relative">
                    <input 
                        type="file" 
                        accept="image/*"
                        multiple
                        onChange={handleImagesDrop}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="size-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined">imagesmode</span>
                    </div>
                    <p className="font-bold text-slate-700">Añadir Imágenes ({imageFiles.length})</p>
                    <p className="text-xs text-slate-500 mt-1">Arrastra todas las fotos de tus productos</p>
                </div>
            </div>

            {/* ACTION ROW */}
            <div className="flex justify-end mb-8">
                <button 
                    onClick={processCsv}
                    disabled={!csvFile || isProcessing}
                    className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50 hover:bg-slate-800 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">settings_suggest</span>
                    Procesar Emparejamiento
                </button>
            </div>

            {/* PREVIEW */}
            {pendingProducts.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-slate-800">Vista Previa ({pendingProducts.length} productos)</h4>
                        {totalMissing > 0 && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                {totalMissing} imágenes faltantes
                            </span>
                        )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                        {pendingProducts.map((p, i) => (
                            <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm text-slate-800">{p.data.title}</p>
                                    <p className="text-xs text-slate-500">${p.data.price} • Stock: {p.data.quantity}</p>
                                </div>
                                <div className="flex gap-1">
                                    {p.pendingImages.map((f, idx) => (
                                        <div key={idx} className="size-8 bg-emerald-100 rounded-lg flex items-center justify-center border border-emerald-200" title={`Lista: ${f.name}`}>
                                            <span className="material-symbols-outlined text-[14px] text-emerald-600">check</span>
                                        </div>
                                    ))}
                                    {p.missingImages.map((name, idx) => (
                                        <div key={`miss-${idx}`} className="size-8 bg-red-100 rounded-lg flex items-center justify-center border border-red-200" title={`Falta subir: ${name}`}>
                                            <span className="material-symbols-outlined text-[14px] text-red-600">close</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-4">
                        <button 
                            onClick={handleUploadAll}
                            disabled={isProcessing}
                            className="bg-indigo-600 text-white font-black px-8 py-4 rounded-xl flex-1 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                    Subiendo ({progress}%)
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">cloud_upload</span>
                                    Publicar Todo Ahora
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkUpload;
