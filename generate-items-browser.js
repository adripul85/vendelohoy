/**
 * Script para generar 50 artículos de prueba
 * 
 * PASO A PASO:
 * 1. Asegúrate de tener la app corriendo (npm run dev)
 * 2. Abre http://localhost:5173 en tu navegador
 * 3. Presiona F12 para abrir la consola
 * 4. Copia TODO este código y pégalo en la consola
 * 5. Presiona Enter y espera
 */

(async function generateItems() {
    console.log('%c🚀 Iniciando generación de 50 artículos...', 'color: #00ff00; font-size: 18px; font-weight: bold');
    console.log('%c⏳ Por favor espera, esto puede tardar unos segundos...', 'color: #ffaa00; font-size: 12px');

    try {
        // Importar Firebase usando el path absoluto de los módulos cargados
        const firebase = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
        const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');

        // Inicializar Firestore
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        const app = firebase.initializeApp(firebaseConfig, 'temp-generator-app');
        const db = firestoreModule.getFirestore(app);
        const { collection, addDoc, serverTimestamp } = firestoreModule;

        const categories = [
            'Computación',
            'Celulares y Teléfonos',
            'Audio y Video',
            'Videojuegos',
            'Muebles y Decoración',
            'Electrodomésticos',
            'Moda y Accesorios',
            'Deportes y Fitness'
        ];

        const conditions = ['new', 'like_new', 'good', 'fair'];

        const productsByCategory = {
            'Computación': ['Laptop Dell XPS', 'MacBook Pro M2', 'PC Gamer RGB', 'Monitor 27" 4K', 'Teclado Mecánico', 'Mouse Gamer', 'SSD 1TB NVMe', 'RAM 16GB DDR4'],
            'Celulares y Teléfonos': ['iPhone 14 Pro', 'Samsung Galaxy S23', 'Xiaomi Redmi Note', 'Google Pixel 7', 'OnePlus 11', 'Motorola Edge', 'Huawei P50'],
            'Audio y Video': ['AirPods Pro', 'Sony WH-1000XM5', 'Bose QuietComfort', 'Parlante JBL', 'Auriculares Gaming', 'Soundbar Samsung', 'Micrófono Streaming'],
            'Videojuegos': ['PlayStation 5', 'Xbox Series X', 'Nintendo Switch OLED', 'Steam Deck', 'Control Xbox', 'Joystick PS5', 'FIFA 24', 'God of War'],
            'Muebles y Decoración': ['Silla Gamer', 'Escritorio L Shape', 'Sofá 3 Cuerpos', 'Mesa Comedor', 'Estantería', 'Lámpara LED', 'Sillón Relax'],
            'Electrodomésticos': ['Heladera Samsung', 'Lavarropas Drean', 'Microondas LG', 'Aire Acondicionado', 'Aspiradora Robot', 'Freidora Aire', 'Cafetera Nespresso'],
            'Moda y Accesorios': ['Zapatillas Nike Air', 'Reloj Smartwatch', 'Campera North Face', 'Jean Levis 501', 'Mochila', 'Gafas Ray-Ban', 'Cartera Cuero'],
            'Deportes y Fitness': ['Bicicleta MTB', 'Cinta de Correr', 'Mancuernas Set', 'Pelota Yoga', 'Pesas Rusas', 'Colchoneta', 'Barra Dominadas']
        };

        const descriptions = [
            'Producto en excelente estado, poco uso. Incluye todos los accesorios originales y caja.',
            'Artículo prácticamente nuevo, usado solo 2 veces. Sin detalles ni rayones. Impecable!',
            'Muy buen estado general, funcionando perfectamente. Ideal para uso diario.',
            'Producto usado pero bien cuidado. Algunas marcas de uso normal pero funciona perfecto.',
            'Excelente oportunidad! Precio negociable. Entrega inmediata en CABA y GBA.',
            'Estado impecable, como recién comprado. Factura original incluida.',
            'Artículo de calidad premium, marca reconocida. Ideal para regalo.',
            'Última unidad disponible! Estado como nuevo. No te lo pierdas!',
            'Producto de primera calidad. Funcionamiento verificado y testeado.',
            'Oportunidad única! Precio especial por venta rápida. Acepto transferencia.'
        ];

        const sellerIds = ['test_seller_1', 'test_seller_2', 'test_seller_3', 'test_seller_4', 'test_seller_5'];

        const getPlaceholderImage = (seed) => {
            return `https://picsum.photos/seed/${seed}/800/600`;
        };

        const generatePrice = (category) => {
            const priceRanges = {
                'Computación': [15000, 250000],
                'Celulares y Teléfonos': [30000, 300000],
                'Audio y Video': [10000, 80000],
                'Videojuegos': [50000, 180000],
                'Muebles y Decoración': [8000, 120000],
                'Electrodomésticos': [20000, 200000],
                'Moda y Accesorios': [5000, 50000],
                'Deportes y Fitness': [8000, 100000]
            };

            const [min, max] = priceRanges[category] || [5000, 100000];
            return Math.floor(Math.random() * (max - min) + min);
        };

        const generateItem = (index) => {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const products = productsByCategory[category];
            const productName = products[Math.floor(Math.random() * products.length)];
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            const description = descriptions[Math.floor(Math.random() * descriptions.length)];
            const sellerId = sellerIds[Math.floor(Math.random() * sellerIds.length)];
            const price = generatePrice(category);

            return {
                title: `${productName} ${index + 1}`,
                description: description,
                price: price,
                category: category,
                condition: condition,
                images: [
                    getPlaceholderImage(`item${index}-1`),
                    getPlaceholderImage(`item${index}-2`),
                    getPlaceholderImage(`item${index}-3`)
                ],
                sellerId: sellerId,
                status: 'AVAILABLE',
                createdAt: serverTimestamp(),
                searchKeywords: productName.toLowerCase().split(' ')
            };
        };

        const itemsRef = collection(db, 'items');
        let successCount = 0;

        for (let i = 0; i < 50; i++) {
            try {
                const item = generateItem(i);
                await addDoc(itemsRef, item);
                successCount++;
                console.log(`%c✅ [${i + 1}/50] ${item.title} - $${item.price.toLocaleString()}`,
                    'color: #00cc00; font-weight: bold');
            } catch (error) {
                console.error(`❌ Error en item ${i + 1}:`, error);
            }

            // Pequeña pausa de 50ms entre cada item
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log(`%c\n🎉 ¡Generación completada exitosamente!`, 'color: #00ff00; font-size: 20px; font-weight: bold');
        console.log(`%c📊 Total creado: ${successCount}/50 artículos`, 'color: #00aaff; font-size: 16px; font-weight: bold');
        console.log(`%c💡 Recarga la página (F5) para ver los nuevos artículos`, 'color: #ffaa00; font-size: 14px');

    } catch (error) {
        console.error('%c❌ Error al generar artículos:', 'color: red; font-weight: bold; font-size: 16px');
        console.error(error);
        console.log('%c💡 Asegúrate de estar en http://localhost:5173', 'color: #ffaa00');
    }
})();
