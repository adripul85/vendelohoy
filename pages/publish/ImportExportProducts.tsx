import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useNotification } from '../../context/NotificationContext';
import { publishItem, getItemsBySeller, updateItem } from '../../lib/items';
import Papa from 'papaparse';
import { CATEGORIES } from '../../lib/constants';

const CSV_HEADERS = [
    "Identificador de URL", "Nombre", "Categorías", 
    "Nombre de propiedad 1", "Valor de propiedad 1", 
    "Nombre de propiedad 2", "Valor de propiedad 2", 
    "Nombre de propiedad 3", "Valor de propiedad 3", 
    "Precio", "Precio promocional", "Peso (kg)", "Alto (cm)", "Ancho (cm)", "Profundidad (cm)", 
    "Stock", "SKU", "Código de barras", "Mostrar en tienda", "Envío sin cargo", 
    "Descripción", "Tags", "Título para SEO", "Descripción para SEO", 
    "Marca", "Producto Físico", "MPN (Número de pieza del fabricante)", 
    "Sexo", "Rango de edad", "Costo", "Visibilidad"
];

export default function ImportExportProducts() {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('import');
    
    // Import state
    const [file, setFile] = useState<File | null>(null);
    const [modificarExistentes, setModificarExistentes] = useState(true);
    const [actualizarStock, setActualizarStock] = useState(true);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        const csv = Papa.unparse({
            fields: CSV_HEADERS,
            data: []
        }, { delimiter: ';' });
        
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'plantilla_productos.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const items = await getItemsBySeller(user.uid);
            
            const data = items.map(item => {
                const color = Array.isArray(item.color) ? item.color[0] : item.color;
                const size = Array.isArray(item.size) ? item.size[0] : item.size;
                
                return {
                    "Identificador de URL": item.seoTitle || '',
                    "Nombre": item.title,
                    "Categorías": item.category || '',
                    "Nombre de propiedad 1": color ? 'Color' : '',
                    "Valor de propiedad 1": color || '',
                    "Nombre de propiedad 2": size ? 'Talle' : '',
                    "Valor de propiedad 2": size || '',
                    "Nombre de propiedad 3": '',
                    "Valor de propiedad 3": '',
                    "Precio": item.price,
                    "Precio promocional": item.oldPrice || '',
                    "Peso (kg)": item.weight || '',
                    "Alto (cm)": item.dimensions?.height || '',
                    "Ancho (cm)": item.dimensions?.width || '',
                    "Profundidad (cm)": item.dimensions?.length || '',
                    "Stock": item.hasInfiniteStock ? '' : (item.quantity || 0),
                    "SKU": item.sku || '',
                    "Código de barras": item.barcode || '',
                    "Mostrar en tienda": item.showPriceInStore !== false ? 'SI' : 'NO',
                    "Envío sin cargo": item.shippingAvailable ? 'SI' : 'NO',
                    "Descripción": item.description,
                    "Tags": (item.tags || []).join(','),
                    "Título para SEO": item.seoTitle || '',
                    "Descripción para SEO": item.seoDescription || '',
                    "Marca": item.brand || '',
                    "Producto Físico": 'SI',
                    "MPN (Número de pieza del fabricante)": item.mpn || '',
                    "Sexo": item.gender || '',
                    "Rango de edad": item.ageRange || '',
                    "Costo": item.cost || '',
                    "Visibilidad": 'Visible'
                };
            });

            const csv = Papa.unparse({ fields: CSV_HEADERS, data }, { delimiter: ';' });
            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'mis_productos.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notify({ type: 'success', title: 'Éxito', message: 'Productos exportados correctamente.' });
        } catch (error) {
            console.error(error);
            notify({ type: 'error', title: 'Error', message: 'No se pudieron exportar los productos.' });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!file || !user || !userProfile) return;
        setLoading(true);
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            complete: async (results) => {
                const data = results.data as any[];
                let createdCount = 0;
                let updatedCount = 0;
                let errorsCount = 0;

                try {
                    const existingItems = await getItemsBySeller(user.uid);
                    
                    for (const row of data) {
                        try {
                            if (!row['Nombre'] || !row['Precio']) continue; // Skip invalid rows
                            
                            const parsedPrice = parseFloat(row['Precio'].toString().replace(',', '.'));
                            const parsedStock = row['Stock'] ? parseInt(row['Stock'].toString()) : 1;
                            const isInfinite = row['Stock'] === '' || row['Stock']?.toString().toLowerCase() === 'infinito';
                            
                            const itemData: any = {
                                title: row['Nombre'],
                                price: parsedPrice,
                                description: row['Descripción'] || '',
                                masterCategory: CATEGORIES[0].name,
                                category: row['Categorías'] || CATEGORIES[0].categories[0].name,
                                condition: 'new',
                                images: [], // Default empty, user uploads later
                                sellerId: user.uid,
                                sellerName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
                                hasInfiniteStock: isInfinite,
                                quantity: isInfinite ? 0 : parsedStock,
                                sku: row['SKU'] || '',
                                barcode: row['Código de barras'] || '',
                                showPriceInStore: row['Mostrar en tienda'] !== 'NO',
                                shippingAvailable: row['Envío sin cargo'] === 'SI',
                                brand: row['Marca'] || '',
                                mpn: row['MPN (Número de pieza del fabricante)'] || '',
                                cost: row['Costo'] ? parseFloat(row['Costo'].toString().replace(',', '.')) : 0,
                                seoTitle: row['Título para SEO'] || row['Identificador de URL'] || '',
                                seoDescription: row['Descripción para SEO'] || '',
                                tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()) : [],
                                gender: row['Sexo'] || '',
                                ageRange: row['Rango de edad'] || ''
                            };

                            // Properties mapping (Color, Talle)
                            for (let i = 1; i <= 3; i++) {
                                const propName = row[`Nombre de propiedad ${i}`]?.toString().toLowerCase();
                                const propValue = row[`Valor de propiedad ${i}`];
                                if (propName === 'color' && propValue) itemData.color = [propValue];
                                if (propName === 'talle' && propValue) itemData.size = [propValue];
                            }

                            // Weight and Dimensions
                            if (row['Peso (kg)']) itemData.weight = parseFloat(row['Peso (kg)'].toString().replace(',', '.'));
                            if (row['Alto (cm)'] || row['Ancho (cm)'] || row['Profundidad (cm)']) {
                                itemData.dimensions = {
                                    height: parseFloat(row['Alto (cm)'] || '0'),
                                    width: parseFloat(row['Ancho (cm)'] || '0'),
                                    length: parseFloat(row['Profundidad (cm)'] || '0')
                                };
                            }
                            if (row['Precio promocional']) {
                                itemData.oldPrice = parseFloat(row['Precio promocional'].toString().replace(',', '.'));
                            }

                            // Match existing
                            const skuToMatch = row['SKU'];
                            const urlToMatch = row['Identificador de URL'];
                            
                            let existingItem = null;
                            if (modificarExistentes) {
                                if (skuToMatch) {
                                    existingItem = existingItems.find(i => i.sku === skuToMatch);
                                }
                                if (!existingItem && urlToMatch) {
                                    existingItem = existingItems.find(i => i.seoTitle === urlToMatch);
                                }
                            }

                            if (existingItem && modificarExistentes) {
                                // Update
                                const updatePayload = { ...itemData };
                                if (!actualizarStock) {
                                    delete updatePayload.quantity;
                                    delete updatePayload.hasInfiniteStock;
                                }
                                await updateItem(existingItem.id, updatePayload);
                                updatedCount++;
                            } else {
                                // Create
                                await publishItem(itemData);
                                createdCount++;
                            }
                        } catch (err) {
                            console.error("Row error", err);
                            errorsCount++;
                        }
                    }
                    
                    notify({ 
                        type: 'success', 
                        title: 'Importación Completada', 
                        message: `Nuevos: ${createdCount} | Actualizados: ${updatedCount} | Errores: ${errorsCount}`,
                        duration: 8000
                    });
                    setFile(null);
                } catch (error) {
                    notify({ type: 'error', title: 'Error', message: 'Fallo al importar productos.' });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto pt-24 px-6 pb-20">
            <div className="mb-8">
                <button onClick={() => navigate('/publish')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4 font-bold text-sm">
                    <span className="material-symbols-outlined text-[20px] mr-1">arrow_back</span>
                    Volver a Publicar
                </button>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Exportar e importar</h1>
                <p className="text-slate-600 mt-2 font-medium">Economizá tiempo modificando o agregando nuevos productos de forma masiva a través de un archivo .csv de Excel.</p>
            </div>

            <div className="bg-surface rounded-[32px] border border-outline-variant/50 shadow-sm p-4 md:p-8">
                
                {/* Modern Pill Toggle */}
                <div className="flex bg-surface-container-low p-1.5 rounded-2xl mb-8 max-w-sm mx-auto">
                    <button 
                        onClick={() => setActiveTab('export')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'export' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
                    >
                        Exportar
                    </button>
                    <button 
                        onClick={() => setActiveTab('import')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'import' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
                    >
                        Importar
                    </button>
                </div>

                <div className="max-w-2xl mx-auto">
                    {activeTab === 'export' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
                            <div className="size-24 bg-primary-container/30 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-5xl">cloud_download</span>
                            </div>
                            <h3 className="text-xl font-black text-on-surface mb-3 tracking-tight">Exportá tus productos actuales</h3>
                            <p className="text-sm text-on-surface-variant mb-10 font-medium">Generaremos un archivo .csv con todos los productos de tu tienda. Vas a poder editarlo en Excel o Google Sheets y luego volver a importarlo para actualizar precios y stock rápidamente.</p>
                            
                            <button 
                                onClick={handleExport}
                                disabled={loading}
                                className="w-full md:w-auto px-10 py-4 bg-primary text-on-primary font-black rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto shadow-lg shadow-primary-500/20"
                            >
                                {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">download</span>}
                                {loading ? 'Exportando...' : 'Exportar productos a .csv'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            <p className="text-sm text-on-surface-variant font-medium mb-8 text-center">
                                Cargá un archivo de hasta 20000 líneas. Si es necesario, dividilo en más de uno.
                            </p>

                            {/* Gradient Template Card */}
                            <div className="relative overflow-hidden rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between mb-8 group bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-lg">
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                <div className="relative z-10 flex items-center gap-4 mb-4 md:mb-0 text-center md:text-left">
                                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                                        <span className="material-symbols-outlined text-3xl">table_view</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg">Descargá la plantilla base</h4>
                                        <p className="text-sm font-medium text-white/80">Contiene los encabezados exactos que el sistema necesita.</p>
                                    </div>
                                </div>
                                <button onClick={handleDownloadTemplate} className="relative z-10 w-full md:w-auto bg-white text-indigo-600 hover:bg-indigo-50 font-black text-sm px-6 py-3 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95">
                                    Descargar Plantilla
                                </button>
                            </div>

                            {/* Dropzone */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`group relative border-[3px] border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center cursor-pointer transition-all mb-8 ${file ? 'border-emerald-500 bg-emerald-50' : 'border-outline-variant/40 hover:border-primary hover:bg-primary-container/10'}`}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".csv"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                <div className={`size-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-2 duration-300 ${file ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                    <span className="material-symbols-outlined text-3xl">{file ? 'check_circle' : 'upload_file'}</span>
                                </div>
                                <h3 className={`font-black text-xl mb-1 ${file ? 'text-emerald-700' : 'text-on-surface'}`}>
                                    {file ? 'Archivo listo' : 'Cargar archivo .csv'}
                                </h3>
                                <p className={`text-sm font-medium ${file ? 'text-emerald-600' : 'text-on-surface-variant'}`}>
                                    {file ? file.name : 'Hacé clic acá para seleccionar tu archivo'}
                                </p>
                            </div>

                            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 mb-8 space-y-4 shadow-sm">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Modificar productos ya existentes</span>
                                    <input 
                                        type="checkbox" 
                                        checked={modificarExistentes}
                                        onChange={e => setModificarExistentes(e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-2 border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 bg-surface transition-colors cursor-pointer" 
                                    />
                                </label>
                                <hr className="border-outline-variant/20"/>
                                <div>
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className={`text-sm font-bold transition-colors ${!modificarExistentes ? 'text-on-surface-variant opacity-50' : 'text-on-surface group-hover:text-primary'}`}>Actualizar stock</span>
                                        <input 
                                            type="checkbox" 
                                            checked={actualizarStock}
                                            onChange={e => setActualizarStock(e.target.checked)}
                                            className="w-5 h-5 rounded-lg border-2 border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 bg-surface transition-colors cursor-pointer disabled:opacity-50" 
                                            disabled={!modificarExistentes}
                                        />
                                    </label>
                                    <a href="#" className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline inline-block mt-3 opacity-80 hover:opacity-100">A tener en cuenta al actualizar stock ↗</a>
                                </div>
                            </div>

                            <button 
                                onClick={handleImport}
                                disabled={!file || loading}
                                className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-sm uppercase tracking-widest ${!file ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed' : 'bg-on-surface text-on-primary hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-on-surface/20'}`}
                            >
                                {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">backup</span>}
                                {loading ? 'Procesando archivo...' : 'Iniciar Importación'}
                            </button>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
