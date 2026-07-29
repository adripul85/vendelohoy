export interface SubCategory {
    name: string;
}

export interface Category {
    name: string;
    sub: string[];
}

export interface MasterCategory {
    id: string;
    name: string;
    icon: string;
    categories: Category[];
}

export const CATEGORIES: MasterCategory[] = [
    {
        id: 'fashion',
        name: 'Moda',
        icon: 'checkroom',
        categories: [
            { name: 'Abrigos', sub: ['Buzos y Hoodies', 'Camperas, Tapados y Trenchs', 'Saquitos, Sweaters y Chalecos', 'Otros'] },
            { name: 'Accesorios de Moda', sub: ['Abanicos', 'Accesorios para el Cabello', 'Anteojos y Accesorios', 'Antifaces para Dormir', 'Antifaz para Dormir Eléctrico', 'Bufandas y Pañuelos', 'Cinturones', 'Corbatas', 'Espejitos', 'Fajas', 'Filtros para Tapabocas', 'Gorros, Sombreros y Boinas', 'Guantes y Mitones', 'Llaveros', 'Orejeras', 'Otros Accesorios', 'Paraguas', 'Pareos', 'Polainas', 'Prendedores y Broches', 'Tapabocas Reutilizables', 'Tiradores', 'Toallas de Playa', 'Traba Corbatas'] },
            { name: 'Bermudas y Shorts', sub: ['General'] },
            { name: 'Blusas', sub: ['General'] },
            { name: 'Calzado', sub: ['Alpargatas', 'Botas y Botinetas', 'Chatitas', 'Cubre Zapatos', 'Mocasines y Oxfords', 'Pantuflas', 'Sandalias y Ojotas', 'Stilletos y Plataformas', 'Zapatillas', 'Otros'] },
            { name: 'Calzas', sub: ['General'] },
            { name: 'Camisas', sub: ['General'] },
            { name: 'Enteritos', sub: ['General'] },
            { name: 'Equipaje, Bolsos y Carteras', sub: ['Accesorios', 'Billeteras y Monederos', 'Carteras', 'Equipaje y Accesorios de Viaje', 'Kits de Mochilas Escolares', 'Luncheras Escolares', 'Maletines', 'Mochilas', 'Neceseres', 'Riñoneras', 'Sets de Carteras', 'Otros'] },
            { name: 'Indumentaria Laboral y Escolar', sub: ['Accesorios Tácticos', 'Guardapolvos Escolares', 'Indumentaria Táctica', 'Uniformes Escolares', 'Uniformes y Ropa de Trabajo', 'Otros'] },
            { name: 'Kimonos', sub: ['General'] },
            { name: 'Lotes de Ropa', sub: ['General'] },
            { name: 'Pantalones', sub: ['General'] },
            { name: 'Polleras', sub: ['General'] },
            { name: 'Remeras, Musculosas y Chombas', sub: ['General'] },
            { name: 'Ropa Deportiva', sub: ['Bolsos Deportivos', 'Buzos', 'Calzas', 'Camperas', 'Conjuntos Deportivos', 'Fajas', 'Gorras', 'Guantes', 'Mangas de Compresión', 'Medias', 'Pantalones y Joggings', 'Remeras y Chombas', 'Ropa de Danza y Patinaje', 'Shorts', 'Tobilleras', 'Tops', 'Vestidos', 'Otros'] },
            { name: 'Ropa Interior y de Dormir', sub: ['Ropa Interior', 'Ropa de Dormir'] },
            { name: 'Ropa y Calzado para Bebés', sub: ['Accesorios', 'Batas', 'Bermudas y Shorts', 'Blusas', 'Bodys', 'Bolsas de Dormir', 'Buzos', 'Calzados', 'Camisas', 'Camperas', 'Conjuntos', 'Jardineros', 'Kits para Salida del Hospital', 'Medias', 'Pantalones', 'Pijamas', 'Polleras', 'Remeras, Musculosas y Chombas', 'Saquitos y Sweaters', 'Trajes de Baño', 'Vestidos', 'Otros'] },
            { name: 'Trajes', sub: ['General'] },
            { name: 'Trajes de Baño', sub: ['General'] },
            { name: 'Vestidos', sub: ['General'] },
            { name: 'Otros', sub: ['General'] }
        ]
    },
    {
        id: 'home',
        name: 'Hogar, Muebles y Jardín',
        icon: 'home',
        categories: [
            { name: 'Adornos y Decoración del Hogar', sub: ['Alcancías', 'Atrapasueños', 'Bandejas', 'Banderines y Guirnaldas', 'Barriles', 'Biombos', 'Bolitas de Gel', 'Cajas, Cajones y Canastos', 'Ceniceros', 'Columnas Decorativas', 'Cortinas y Accesorios', 'Cuadros, Carteles y Espejos', 'Figuras Decorativas', 'Fuentes de Agua', 'Imanes Decorativos', 'Jaulas Decorativas', 'Llamadores de Ángeles', 'Paneles Decorativos', 'Plantas y Flores Artificiales', 'Porta Llaves', 'Portarretratos', 'Péndulos de Newton', 'Relojes', 'Soportes de Lectura', 'Sujetalibros', 'Velas y Fanales', 'Vinilos Decorativos', 'Árboles y Adornos de Navidad', 'Otros'] },
            { name: 'Bazar y Cocina', sub: ['Almacenamiento y Organización', 'Artículos de Vino y Coctelería', 'Artículos para Compras', 'Bombas para Bidones', 'Café, Té y Mate', 'Cocción y Horneado', 'Cubeteras y Hieleras', 'Delantales de Cocina', 'Repasadores', 'Utensilios de Preparación', 'Utensilios de Repostería', 'Vajilla y Artículos de Servir', 'Otros'] },
            { name: 'Baños', sub: ['Accesorios para Baños', 'Alfombras para Baño', 'Bachas para Baño', 'Barrales y Cortinas de Baño', 'Bañeras', 'Espejos para Baños', 'Generadores de Vapor', 'Grifería para Baño', 'Mamparas y Cabinas', 'Mesadas', 'Receptáculos de Ducha', 'Sanitarios', 'Sifones de Desagüe', 'Toallas, Toallones y Batas', 'Otros'] },
            { name: 'Camas, Colchones y Accesorios', sub: ['Almohadas', 'Bases para Sommiers', 'Camas', 'Colchones', 'Juegos de Sommier y Colchón', 'Respaldos', 'Ropa de Cama', 'Sommiers Masajeadores', 'Otros'] },
            { name: 'Cuidado del Hogar y Lavandería', sub: ['Accesorios de Limpieza', 'Accesorios para Lavandería', 'Control de Plagas', 'Cuidado del Calzado', 'Desechables', 'Productos de Lavandería', 'Productos de Limpieza', 'Otros'] },
            { name: 'Iluminación para el Hogar', sub: ['Accesorios', 'Focos', 'Guirnaldas y Luces Decorativas', 'Luces de Emergencia', 'Lámparas', 'Reflectores', 'Tiras de LED', 'Otros'] },
            { name: 'Instalaciones de Muebles', sub: ['General'] },
            { name: 'Jardín y Aire Libre', sub: ['Cercos y Tranqueras', 'Control de Plagas', 'Decoración de Exterior', 'Hornos, Parrillas y Accesorios', 'Invernaderos y Carpas', 'Jardinería y Accesorios', 'Lonas Playeras', 'Muebles para Exterior', 'Piletas y Accesorios', 'Rejillas', 'Riego', 'Sillones Inflables', 'Spa Exterior', 'Tejidos Mosquiteros', 'Toldos y Cerramientos', 'Otros'] },
            { name: 'Muebles para el Hogar', sub: ['Accesorios y Repuestos', 'Bares', 'Bibliotecas', 'Camas, Bases y Respaldos', 'Cunas, Catres y Moisés', 'Escritorios', 'Estanterías', 'Juegos y Sets de Muebles', 'Mesas Ratonas y Auxiliares', 'Mesas de Computación', 'Mesas de Jardín', 'Mesas de Luz', 'Mobiliario para Cocinas', 'Muebles de Guardado', 'Muebles para Baño', 'Muebles para TV', 'Pupitres', 'Sillas, Sillones y Banquetas', 'Tocadores', 'Otros'] },
            { name: 'Organización para el Hogar', sub: ['Baúles', 'Bolsas al Vacío', 'Cajas', 'Cajones de Madera', 'Canastos de mimbre', 'Organizadores de Escritorio', 'Organizadores de Maquillaje', 'Organizadores de Ropa', 'Organizadores para Cocina', 'Paragüeros', 'Revisteros', 'Secaplatos', 'Otros'] },
            { name: 'Seguridad para el Hogar', sub: ['Automatización para Portones', 'Cajas Fuertes', 'Films de Seguridad', 'Herrajes de Seguridad', 'Localizadores de Objetos', 'Puertas Blindadas', 'Redes de protección', 'Rejas', 'Seguridad Perimetral', 'Sistemas de Monitoreo', 'Timbres', 'Otros'] },
            { name: 'Textiles de Hogar y Decoración', sub: ['Aguayos', 'Alfombras y Carpetas', 'Almohadas', 'Almohadones', 'Doseles para Camas y Cunas', 'Fundas', 'Mantas para Sillones', 'Mantelería y Platos de Sitio', 'Ropa de Cama', 'Tapices', 'Textiles de Cocina', 'Toallas, Toallones y Batas', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    },
    {
        id: 'appliances',
        name: 'Electrodomésticos',
        icon: 'kitchen',
        categories: [
            { name: 'Artefactos de Cuidado Personal', sub: ['Artefactos para el Cabello', 'Balanzas de Baño', 'Nebulizadores', 'Repuestos y Accesorios', 'Secadores de Calzado', 'Otros'] },
            { name: 'Climatización', sub: ['Aires Acondicionados', 'Calderas', 'Chimeneas', 'Climatizadores Portátiles', 'Cortinas de Aire', 'Deshumidificadores', 'Ductos Textiles', 'Estufas y Calefactores', 'Repuestos y Accesorios', 'Termotanques y Calefones', 'Ventiladores', 'Ventiladores Portátiles', 'Otros'] },
            { name: 'Cocción', sub: ['Anafes', 'Cocinas', 'Extractores y Purificadores', 'Hornos', 'Kits de Anafes y Extractores', 'Microondas', 'Repuestos y Accesorios', 'Otros'] },
            { name: 'Dispensadores y Purificadores', sub: ['Ablandadores de Agua', 'Dispensadores de Agua', 'Filtros de Ósmosis Inversa', 'Purificadores de Agua', 'Repuestos y Accesorios', 'Otros'] },
            { name: 'Lavado', sub: ['Centros de Lavado', 'Lavarropas y Lavasecarropas', 'Lavavajillas', 'Mini Lavarropas', 'Repuestos y Accesorios', 'Secarropas', 'Otros'] },
            { name: 'Pequeños Electrodomésticos', sub: ['Para Cocina', 'Para Hogar', 'Otros'] },
            { name: 'Refrigeración', sub: ['Cavas Conservadoras', 'Cerveceras', 'Freezers', 'Frigobares', 'Heladeras', 'Repuestos y Accesorios', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    },
    {
        id: 'construction',
        name: 'Construcción',
        icon: 'construction',
        categories: [
            { name: 'Aberturas', sub: ['Aleros', 'Claraboyas', 'Herrajes', 'Persianas', 'Portones', 'Postigos', 'Puertas', 'Ventanas', 'Otros'] },
            { name: 'Accesorios de Construcción', sub: ['Andamios', 'Carros y Carretillas', 'Escaleras', 'Puntales Telescópicos', 'Soportes de Vigas', 'Otros'] },
            { name: 'Baños y Sanitarios', sub: ['Accesorios para Sanitarios', 'Bachas para Baño', 'Bañeras', 'Bidets', 'Grifería para Baño', 'Inodoros', 'Mamparas y Cabinas', 'Mesadas', 'Mingitorios', 'Muebles para Baño', 'Sets de Artefactos', 'Ventilación', 'Otros'] },
            { name: 'Electricidad', sub: ['Ahorradores de Energía', 'Balastos', 'Buscapolos', 'Cables y Accesorios', 'Caños Corrugados', 'Cintas Aisladoras', 'Cintas Aislantes Líquidas', 'Energía Solar', 'Fotocontroles', 'Fusibles', 'Grupos Electrógenos', 'Interruptores y Enchufes', 'Motores', 'Multímetros', 'Pinzas Amperimétricas', 'Tableros y Medidores', 'Temporizadores', 'Transformadores', 'Otros'] },
            { name: 'Maquinarias para Construcción', sub: ['Allanadoras', 'Aserradoras', 'Bloqueras', 'Hormigoneras', 'Mezcladoras de Polvo', 'Otras', 'Placas Compactadoras', 'Revocadoras', 'Rodillos Compactadores', 'Trituradoras de Mandíbulas', 'Vibradores de Inmersión', 'Vibroapisonadores'] },
            { name: 'Materiales de Obra', sub: ['Adhesivos y Selladores', 'Alambrados', 'Alambres', 'Bolsas de Escombros', 'Cables de Acero y Accesorios', 'Caños', 'Cenefas', 'Chapas', 'Construcción en Seco', 'Cuerdas', 'Fijaciones', 'Hierros', 'Obra Pesada', 'Vigas y Viguetas', 'Otros'] },
            { name: 'Mobiliario para Cocinas', sub: ['Amoblamientos de Cocina', 'Griferías Convencionales', 'Griferías Eléctricas', 'Otros'] },
            { name: 'Pinturería', sub: ['Acabados', 'Accesorios para Pintura', 'Diluyentes y Solventes', 'Pinturas', 'Terminación de Superficies', 'Otros'] },
            { name: 'Pisos y Revestimientos', sub: ['Alfombrados para Construcción', 'Azulejos y Mosaicos', 'Baldosas de Cemento', 'Cerámica Simil Madera', 'Cerámicas', 'Empapelados', 'Entrepisos', 'Ladrillos de Vidrio', 'Molduras', 'Pisos Laminados', 'Pisos Vinílicos', 'Pisos de Goma', 'Pisos de Madera', 'Placas Antihumedad', 'Porcelanatos', 'Revestimientos Cementicios', 'Revestimientos de Piedra', 'Zócalos', 'Otros'] },
            { name: 'Plomería', sub: ['Aislantes Térmicos para Tubos', 'Bombas', 'Boroscopios', 'Conexiones', 'Motobombas a Combustión', 'Prolongadores de Cámaras', 'Tanques', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    },
    {
        id: 'tools',
        name: 'Herramientas',
        icon: 'build',
        categories: [
            { name: 'Accesorios para Herramientas', sub: ['Accesorios para Compresores', 'Baterías', 'Batidores para Taladros', 'Cargadores para Baterías', 'Cuchillas para Cepilladoras', 'Discos y Piedras', 'Escobillas de Carbón', 'Guardacabos', 'Hojas para Sierras', 'Inducidos', 'Kit de Consumibles para Plasma', 'Kits para Minitornos', 'Lupas', 'Poleas', 'Puntas y Adaptadores', 'Rodeles Cortadoras de Cerámica', 'Soldado', 'Soportes para Taladros', 'Tijeras', 'Otros'] },
            { name: 'Cajas y Organizadores', sub: ['Bancos de Trabajo', 'Bandejas Imantadas', 'Bolsos de Herramientas', 'Cajas de Herramientas', 'Cajas de Ingletes', 'Carros Portaherramientas', 'Cartucheras Portaherramientas', 'Gabinetes para Herramientas', 'Maletines de Herramientas', 'Organizadores de Herramientas', 'Tableros para Herramientas', 'Otros'] },
            { name: 'Herramientas Eléctricas', sub: ['Afiladores', 'Amarradoras de Varillas', 'Canteadoras', 'Compresores', 'Corte', 'Destornilladores', 'Detectores de Metales', 'Equipos para Pintar', 'Kits de Herramientas', 'Lijado, Desbaste y Pulido', 'Limpieza', 'Llaves de Impacto', 'Mezcladores de Pintura', 'Multiherramientas Oscilantes', 'Perforación', 'Pirograbadores', 'Pistolas de Calor', 'Pistolas para Pintar', 'Soldadura', 'Termofusoras', 'Otros'] },
            { name: 'Herramientas Industriales', sub: ['Balanceadoras de Ruedas', 'Bobinadoras', 'CNC', 'Calderas Industriales', 'Carga y Descarga', 'Colectores de Polvo', 'Conformado', 'Enfriadores de Agua', 'Equip. Pintura Electrostática', 'Escopleadoras', 'Hornos y Tratamiento Térmico', 'Mecanizado y Acabado', 'Motores Estacionarios', 'Máquinas Copiadoras de Llaves', 'Máquinas Pelacables', 'Pegadoras de Cantos', 'Plasturgia', 'Rebobinadoras para Papel', 'Repuestos', 'Sierras', 'Taladros a Combustión', 'Otros'] },
            { name: 'Herramientas Manuales', sub: ['Aceiteras Manuales', 'Albañilería', 'Corte y Desbaste', 'Elevación y Tracción', 'Engrasadores', 'Espejos de Inspección', 'Extracción', 'Fijación', 'Ganzúas', 'Martillos', 'Morsas', 'Pinzas', 'Prensas Sargento', 'Sets de Herramientas', 'Sopapas Ventosas', 'Sopletes', 'Yunques', 'Zancos', 'Otros'] },
            { name: 'Herramientas Neumáticas', sub: ['Aerógrafos', 'Amoladoras Neumáticas', 'Engrapadoras y Clavadoras', 'Lijadoras Neumáticas', 'Pistolas para Pintar', 'Taladros Neumáticos', 'Otros'] },
            { name: 'Herramientas para Jardín', sub: ['Chipeadoras', 'Cortacerco', 'Cortadoras de Césped', 'Desmalezadoras y Bordeadora', 'Fumigadores y Pulverizadores', 'Herramientas Multifuncionales', 'Hoyadoras de Combustión', 'Motocultivadores', 'Motosierras', 'Otras', 'Podadoras de Altura', 'Pulverizadores a Explosión', 'Recogedores de Frutas', 'Repuestos', 'Sopladoras', 'Utensilios de Jardinería'] },
            { name: 'Testers y Equipos de Medición', sub: ['Caudalímetro', 'Cuenta Ganado', 'Durómetros', 'Escuadras de Precisión', 'Hidrómetros y Densímetros', 'Medidores Ambientales', 'Medidores de Distancia', 'Medidores de Electricidad', 'Medidores de Espesores', 'Medidores de Fuerza', 'Medidores de Longitud', 'Medidores de Presión', 'Medidores de Ángulos', 'Niveles', 'Pistolas Infrarrojas', 'Refractómetros', 'Reguladores de Oxígeno', 'Tacómetros Portátiles', 'Termostatos Digitales', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    },
    {
        id: 'sports',
        name: 'Deportes y Fitness',
        icon: 'sports_soccer',
        categories: [
            { name: 'Artes Marciales y Boxeo', sub: ['Bolsas y Soportes', 'Indumentaria', 'Focos', 'Protección y Defensa', 'Otros'] },
            { name: 'Buceo', sub: ['Capuchas', 'Chalecos Compensadores', 'Cinturones de Buceo', 'Computadoras', 'Cuchillos', 'Guantes', 'Indumentaria', 'Máscaras', 'Reguladores', 'Otros'] },
            { name: 'Bádminton', sub: ['Pelotas', 'Plumas', 'Raquetas', 'Sets de Bádminton', 'Otros'] },
            { name: 'Básquet', sub: ['Aros y Tableros', 'Indumentaria y Calzado', 'Pelotas', 'Pizarras tácticas', 'Redes de básquet', 'Otros'] },
            { name: 'Béisbol y Sóftbol', sub: ['Bates', 'Caretas para Catcher', 'Cascos', 'Guantes', 'Guantes Para Receptores', 'Indumentaria', 'Kits de Equipos de Protección', 'Mochilas y Bolsos', 'Pelotas', 'Otros'] },
            { name: 'Camping, Caza y Pesca', sub: ['Accesorios de Camping', 'Artículos para Caza', 'Equipamiento para Camping', 'Equipamiento para Pescar', 'Linternas y Faroles', 'Otros'] },
            { name: 'Canoas, Kayaks e Inflables', sub: ['Asientos para Kayaks', 'Canoas', 'Inflables', 'Kayaks', 'Portaequipajes Embarcaciones', 'Remos', 'Salvavidas', 'Tablas de Stand Up', 'Otros'] },
            { name: 'Ciclismo', sub: ['Accesorios para Bicicletas', 'Bicicletas', 'Bicicletas Fijas', 'Indumentaria', 'Repuestos', 'Otros'] },
            { name: 'Coderas', sub: ['General'] },
            { name: 'Equitación y Polo', sub: ['Artículos para Equitación', 'Indumentaria', 'Polainas', 'Otros'] },
            { name: 'Esgrima', sub: ['Chaquetas', 'Espadas', 'Máscaras', 'Puntas Florete', 'Otros'] },
            { name: 'Esquí y Snowboard', sub: ['Accesorios', 'Equipamiento para Esquí', 'Equipamiento para Snowboard', 'Indumentaria', 'Otros'] },
            { name: 'Fitness y Musculación', sub: ['Funcional, Pilates y Yoga', 'Máquinas Cardiovasculares', 'Máquinas de Musculación', 'Pesas, Discos y Barras', 'Protección y Rehabilitación', 'Otros'] },
            { name: 'Fútbol', sub: ['Bolsos y Botineros', 'Equipamiento y Entrenamiento', 'Infladores de Pelota', 'Ropa y Calzado', 'Otros'] },
            { name: 'Fútbol Americano', sub: ['Cascos', 'Indumentaria', 'Pelotas', 'Pizarras tácticas', 'Otros'] },
            { name: 'Golf', sub: ['Bolsos', 'Carros Eléctricos', 'Carros Manuales', 'Indumentaria', 'Medidores Láser', 'Palos y Sets', 'Pelotas', 'Tees', 'Otros'] },
            { name: 'Handball', sub: ['Indumentaria', 'Otras', 'Pelotas', 'Pizarras tácticas', 'Redes'] },
            { name: 'Hockey', sub: ['Equipamiento', 'Indumentaria y Calzado', 'Otros'] },
            { name: 'Juegos de Salón', sub: ['Billar', 'Juegos de Salón', 'Mesas Multijuegos', 'Mesas de Tejo', 'Metegol', 'Ping Pong', 'Otros'] },
            { name: 'Kitesurf', sub: ['Arneses', 'Fundas de Tablas', 'Kites', 'Tablas', 'Otros'] },
            { name: 'Monopatines y Scooters', sub: ['Accesorios y Repuestos', 'Hoverboards', 'Monopatines Eléctricos', 'Monopatines', 'Segways', 'Triciclos', 'Otros'] },
            { name: 'Montañismo y Trekking', sub: ['Accesorios para Escalada', 'Bastones', 'Bolsas de Hidratación', 'Crampones', 'Indumentaria y Calzado', 'Magnesieras', 'Mochilas de Trekking', 'Otros'] },
            { name: 'Natación', sub: ['Accesorios para Natación', 'Tablas y Pull Buoys', 'Toallas de Microfibra', 'Trajes de Baño Deportivos', 'Vinchas', 'Otros'] },
            { name: 'Paintball', sub: ['Bolas de Pintura', 'Cargadores', 'Granadas de Humo', 'Indumentaria y Protección', 'Marcadoras', 'O-rings', 'Remotos', 'Resortes para Armas de Aire', 'Tubos de CO2', 'Otros'] },
            { name: 'Parapente', sub: ['Cascos', 'Hélices para Paramotores', 'Paramotores', 'Parapentes', 'Otros'] },
            { name: 'Patín y Skateboard', sub: ['Accesorios', 'Longboards', 'Patines para Hielo', 'Patines y Rollers', 'Repuestos', 'Skates Completos', 'Tablas de Skate', 'Waveboards', 'Otros'] },
            { name: 'Pilates y Yoga', sub: ['Bolsters', 'Camas para Pilates', 'Ladrillos para Pilates y Yoga', 'Mats y Colchonetas', 'Pelotas', 'Zafus', 'Otros'] },
            { name: 'Pulsómetros y Cronómetros', sub: ['Bandas Cardíacas', 'Cronómetros', 'Podómetros', 'Smartbands', 'Otros'] },
            { name: 'Ropa Deportiva', sub: ['Bolsos Deportivos', 'Buzos', 'Calzas', 'Camperas', 'Conjuntos Deportivos', 'Fajas', 'Gorras', 'Guantes', 'Mangas de Compresión', 'Medias', 'Pantalones y Joggings', 'Remeras y Chombas', 'Ropa de Danza y Patinaje', 'Shorts', 'Tobilleras', 'Tops', 'Vestidos', 'Otros'] },
            { name: 'Rugby', sub: ['Cascos', 'Indumentaria y Calzado', 'Pelotas', 'Pizarras tácticas', 'Protectores', 'Otros'] },
            { name: 'Slackline', sub: ['General'] },
            { name: 'Suplementos y Shakers', sub: ['Botellas Deportivas', 'Shakers', 'Suplementos Deportivos', 'Otros'] },
            { name: 'Surf y Bodyboard', sub: ['Bodyboard', 'Fundas para Tablas de Surf', 'Grips Antideslizantes', 'Indumentaria', 'Leashes para Tablas', 'Parafina', 'Pitas para Surf', 'Porta Equipajes de Tablas', 'Quillas', 'Soportes para Tablas', 'Tablas', 'Otros'] },
            { name: 'Tenis, Pádel y Squash', sub: ['Antivibradores', 'Cuerdas y Encordados', 'Equipamiento', 'Grips y Cubre Grips', 'Indumentaria', 'Muñequeras', 'Pizarras tácticas', 'Otros'] },
            { name: 'Tiro Deportivo', sub: ['Accesorios y Piezas', 'Armas de Aire Comprimido', 'Armas de Gel', 'Balines', 'Kits de Limpieza para Armas', 'Otros'] },
            { name: 'Vóley', sub: ['Indumentaria', 'Pelotas', 'Pizarras tácticas', 'Redes de Vóley', 'Rodilleras de Vóley', 'Otros'] },
            { name: 'Wakeboard y Esquí Acuático', sub: ['Botas', 'Esquíes', 'Manillares y Sogas', 'Quillas', 'Tablas', 'Otros'] },
            { name: 'Windsurf', sub: ['Accesorios', 'Tablas', 'Trajes', 'Velas', 'Otros'] },
            { name: 'Zapatillas', sub: ['General'] },
            { name: 'Otros', sub: ['General'] }
        ]
    }    ,
    {
        id: 'pets',
        name: 'Animales y Mascotas',
        icon: 'pets',
        categories: [
            { name: 'Abrigos', sub: ['General'] },
            { name: 'Ahuyentadores Ultrasónicos', sub: ['General'] },
            { name: 'Aves', sub: ['Alimentos', 'Anillos', 'Bebederos y Comederos', 'Cetrería', 'Huevos Fértiles', 'Incubadoras', 'Juguetes', 'Nidos', 'Pelotas', 'Otros'] },
            { name: 'Botas y Zapatos', sub: ['General'] },
            { name: 'Caballos', sub: ['Carretas', 'Higiene y Cuidado', 'Suplementos para Caballos', 'Otros'] },
            { name: 'Cepillos y Peines', sub: ['General'] },
            { name: 'Cinturones de Seguridad', sub: ['General'] },
            { name: 'Collares', sub: ['General'] },
            { name: 'Conejos', sub: ['Cortaúñas', 'Jaulas', 'Pelotas', 'Otros'] },
            { name: 'Contenedores de Alimento', sub: ['General'] },
            { name: 'Correas para Mascotas', sub: ['General'] },
            { name: 'Cortaúñas', sub: ['General'] },
            { name: 'Gatos', sub: ['Accesorios', 'Ahuyentadores Ultrasónicos', 'Alimento, Premios y Suplemento', 'Bozales', 'Camas y Cuchas', 'Comederos y Bebederos', 'Contenedores de Alimento', 'Estética e Higiene', 'Indumentaria y Accesorios', 'Juguetes', 'Kits de Juguetes', 'Pelotas', 'Puertas y Rampas', 'Soportes para Rehabilitación', 'Viaje y Paseo', 'Otros'] },
            { name: 'Golosinas para Mascotas', sub: ['General'] },
            { name: 'Insectos', sub: ['Cucarachas', 'Escarabajos', 'Grillos', 'Otros'] },
            { name: 'Jabones', sub: ['General'] },
            { name: 'Jaulas para Mascotas', sub: ['General'] },
            { name: 'Moños', sub: ['General'] },
            { name: 'Pastas Dentales', sub: ['General'] },
            { name: 'Pañales', sub: ['General'] },
            { name: 'Peces', sub: ['Alimentos', 'Peceras y Accesorios', 'Otros'] },
            { name: 'Perros', sub: ['Adiestramiento', 'Alimento, Premios y Suplemento', 'Bebederos y Comederos', 'Camas y Cuchas', 'Estética e Higiene', 'Indumentaria y Accesorios', 'Juguetes', 'Puertas, Rampas y Corrales', 'Sillas de Ruedas', 'Soportes para Rehabilitación', 'Viaje y Paseo', 'Otros'] },
            { name: 'Pilotos', sub: ['General'] },
            { name: 'Reptiles y Anfibios', sub: ['Alimentos', 'Terrarios y Tortugueros', 'Otros'] },
            { name: 'Roedores', sub: ['Alimentos y Vitaminas', 'Bebederos y Comederos', 'Casas', 'Cortaúñas', 'Juguetes', 'Shampoos', 'Sustratos', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    },
    {
        id: 'toys',
        name: 'Juegos y Juguetes',
        icon: 'toys',
        categories: [
            { name: 'Armas y Lanzadores de Juguete', sub: ['Accesorios y Municiones', 'Arcos y Flechas', 'Espadas', 'Otras Armas', 'Pistolas de Agua', 'Pistolas y Escopetas'] },
            { name: 'Arte y Manualidades', sub: ['Arenas Mágicas', 'Atriles, Pizarras y Pizarrones', 'Kits de Bijouterie para Niños', 'Kits de Pintura por Diamantes', 'Kits para Hacer Slime', 'Loom Bands', 'Masas y Plastilina', 'Otros'] },
            { name: 'Casas y Carpas para Niños', sub: ['Carpas Infantiles', 'Casas Infantiles', 'Otros'] },
            { name: 'Electrónicos para Niños', sub: ['Alfombras de Baile', 'Celulares de Juguete', 'Computadoras Didácticas', 'Drones de Juguete', 'Mascotas Virtuales', 'Pelotas Deslizantes', 'Relojes de Juguete', 'Robots de Juguete', 'Walkie Talkies', 'Otros'] },
            { name: 'Figuritas, Álbumes y Cromos', sub: ['Figuritas y Cromos', 'Álbumes de Cartas', 'Álbumes de Figuritas', 'Otros'] },
            { name: 'Hobbies', sub: ['Juegos de Magia', 'Modelismo', 'Scalextric', 'Otros'] },
            { name: 'Instrumentos Musicales', sub: ['Baterías', 'Guitarras', 'Micrófonos', 'Pianos y Órganos', 'Otros'] },
            { name: 'Juegos de Agua y Playa', sub: ['Alfombras de Agua', 'Burbujeros', 'Centros de Juegos Inflables', 'Deslizadores de Agua', 'Inflables para Piscina', 'Juguetes de Playa', 'Piletas Inflables', 'Pistolas de Agua', 'Otros'] },
            { name: 'Juegos de Mesa y Cartas', sub: ['Acc. Juegos de Mesa y Cartas', 'Ajedrez', 'Cartas Coleccionables T.C.G', 'Cartas Didácticas', 'Dados', 'Juegos de Mesa y Cartas', 'Juegos de Rol', 'Juegos de Ruleta', 'Naipes Españoles', 'Poker', 'Rompecabezas y Puzzles', 'Otros'] },
            { name: 'Juegos de Plaza y Aire Libre', sub: ['Barriletes y Accesorios', 'Camas Elásticas', 'Deportes', 'Juegos de Plaza', 'Malabares', 'Pelotas y Animales Saltarines', 'Resortes para Camas Elásticas', 'Otros'] },
            { name: 'Juegos de Salón', sub: ['Billar', 'Flippers y Arcade', 'Fútbol de Botón', 'Juegos de Bolos', 'Juegos de Dardos', 'Juegos de Ruleta', 'Mesas Multijuegos', 'Mesas de Tejo', 'Metegol', 'Ping Pong', 'Poker', 'Repuestos para Mesas de Tejo', 'Sapo', 'Otros'] },
            { name: 'Juguetes Antiestrés e Ingenio', sub: ['Cubos Mágicos', 'Fidget Cubes', 'Fidget Spinners', 'Pop Its', 'Rompecabezas y Puzzles', 'Squishys', 'Sudoku', 'Trompos', 'Otros'] },
            { name: 'Juguetes de Bromas', sub: ['General'] },
            { name: 'Juguetes de Construcción', sub: ['Bloques y Figuras para Armar', 'Escenarios y Playsets', 'Otros'] },
            { name: 'Juguetes de Oficios', sub: ['Alimentos de Juguete', 'Binoculares de Juguete', 'Electrodomésticos de Juguete', 'Juguetes de Cocina', 'Sets de Belleza para Niños', 'Supermercado de Juguete', 'Tablas de Planchar', 'Taller de Herramientas', 'Tocadores', 'Valijitas de Juguete', 'Otros'] },
            { name: 'Juguetes para Bebés', sub: ['Caballitos Mecedores', 'Centros de Actividades', 'Computadoras Didácticas', 'Juegos de Arrastre', 'Juegos de Encastre y Apilables', 'Juguetes para el Baño', 'Laberintos y Cubos Didácticos', 'Mecedoras y Saltarines', 'Mesas de Actividades', 'Muñecos de Estimulación', 'Móviles', 'Pelotas', 'Sonajeros', 'Otros'] },
            { name: 'Mesas y Sillas', sub: ['General'] },
            { name: 'Miniaturas', sub: ['General'] },
            { name: 'Muñecos y Muñecas', sub: ['Accesorios', 'Bebés Reborn', 'Exhibidores de Muñecos', 'Figuras de Acción', 'Muñecas de Porcelana', 'Muñecas, Muñecos y Bebotes', 'Sets de Muñecos', 'Soldaditos', 'Otros'] },
            { name: 'Patines y Patinetas', sub: ['Patines', 'Patinetas', 'Otros'] },
            { name: 'Peloteros y Castillos', sub: ['Accesorios', 'Inflables', 'Pelotas para Peloteros', 'Peloteros', 'Toboganes', 'Otros'] },
            { name: 'Peluches', sub: ['General'] },
            { name: 'Títeres y Marionetas', sub: ['Patinetas para Dedos', 'Títeres y Marionetas', 'Otros'] },
            { name: 'Vehículos Montables para Niños', sub: ['Accesorios y Repuestos', 'Bicicletas Infantiles', 'Camicletas', 'Monopatines', 'Triciclos', 'Vehículos a Batería', 'Vehículos a Pedal', 'Otros'] },
            { name: 'Vehículos de Juguete', sub: ['Cascos a Escala', 'Exhibidoras de Autitos', 'Pistas y Lanzadores', 'Repuestos', 'Vehículos Sin Control Remoto', 'Vehículos a Control Remoto', 'Vehículos a Escala', 'Vehículos de Muñecos y Muñecas', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    },
    {
        id: 'babies',
        name: 'Bebés',
        icon: 'child_friendly',
        categories: [
            { name: 'Andadores y Vehículos de Bebés', sub: ['Andadores y Caminadores', 'Camicletas', 'Triciclos', 'Otros'] },
            { name: 'Artículos de Bebés para Baño', sub: ['Almohadas y Redes', 'Asientos de Bañera', 'Batas', 'Bañeras para Bebés', 'Cepillos de Dientes', 'Extensores de Canilla', 'Mingitorios', 'Pelelas', 'Termómetros para Baño', 'Toallones', 'Viseras de Baño', 'Otros'] },
            { name: 'Artículos de Maternidad', sub: ['Almohadones de Maternidad', 'Cambiadores Portátiles', 'Diarios para Bebés', 'Fajas para Embarazadas', 'Kit Maternidad', 'Mochilas y Bolsos Maternales', 'Pezoneras', 'Protectores Mamarios', 'Ropa para Embarazadas', 'Otros'] },
            { name: 'Chupetes y Mordillos', sub: ['Chupetes', 'Chupetes Alimentarios', 'Esterilizadores de Chupetes', 'Guarda Chupetes', 'Mordillos', 'Prendedores Para Chupetes', 'Otros'] },
            { name: 'Comida para Bebés', sub: ['Cereales', 'Galletas para Bebés', 'Leche Maternizada', 'Papilla', 'Otros'] },
            { name: 'Corralitos', sub: ['General'] },
            { name: 'Cuarto del Bebé', sub: ['Almohadones', 'Cambiadores Rígidos', 'Colchones', 'Colgantes de Puerta', 'Cunas, Catres y Moisés', 'Juegos de Dormitorio', 'Mantas de Apego', 'Máquinas de Ruido Blanco', 'Nido de Contención', 'Organizadores de Juguetes', 'Organizadores de Pañales', 'Portadientes de Leche', 'Ropa de Cuna', 'Otros'] },
            { name: 'Higiene y Cuidado del Bebé', sub: ['Colonias para Bebés', 'Cremas, Pomadas y Aceites', 'Esponjas', 'Jabones', 'Kits de Cuidado para Bebés', 'Otros Artículos', 'Pañales', 'Paños de Algodón', 'Peines y Cepillos', 'Shampoos y Acondicionadores', 'Talcos para Bebés', 'Toallitas Húmedas'] },
            { name: 'Juegos y Juguetes para Bebés', sub: ['Caballitos Mecedores', 'Centros de Actividades', 'Juegos de Arrastre', 'Juegos de Encastre y Apilables', 'Juguetes para el Baño', 'Laberintos y Cubos Didácticos', 'Mecedoras y Saltarines', 'Mesas de Actividades', 'Muñecos de Estimulación', 'Móviles', 'Pelotas', 'Peluches', 'Sonajeros', 'Otros'] },
            { name: 'Lactancia y Alimentación', sub: ['Baberos para Comer', 'Babitas', 'Bolsas para Leche Materna', 'Calentadores de Mamaderas', 'Esterilizadores', 'Esterilizadores Eléctricos', 'Esterilizadores Manuales', 'Mamaderas y Accesorios', 'Sacaleches', 'Sillas de Comer', 'Vasos, Platos y Cubiertos', 'Otros'] },
            { name: 'Paseo del Bebé', sub: ['Accesorios para Cochecitos', 'Almohadas para Cinturones', 'Arneses y Correas', 'Cochecitos para Bebés', 'Huevitos y Sillitas para Autos', 'Mochilas y Porta Bebés', 'Organizadores para Autos', 'Parasoles para Autos', 'Reductores para Huevitos', 'Otros'] },
            { name: 'Ropa y Calzado para Bebés', sub: ['Accesorios', 'Batas', 'Bermudas y Shorts', 'Blusas', 'Bodys', 'Bolsas de Dormir', 'Buzos', 'Calzados', 'Camisas', 'Camperas', 'Conjuntos', 'Jardineros', 'Kits para Salida del Hospital', 'Medias', 'Pantalones', 'Pijamas', 'Polleras', 'Remeras, Musculosas y Chombas', 'Saquitos y Sweaters', 'Trajes de Baño', 'Vestidos', 'Otros'] },
            { name: 'Salud del Bebé', sub: ['Aspiradores Nasales', 'Botones y Parches Repelentes', 'Chupetes Termómetros', 'Collares de Dentición', 'Otros'] },
            { name: 'Seguridad para Bebés', sub: ['Alfombras Antigolpes', 'Baby Calls', 'Barandas', 'Cascos para Bebés', 'Espejos Retrovisores', 'Pisos de Goma', 'Protectores de Enchufes', 'Protectores de Esquinas', 'Puertas de Seguridad', 'Rodilleras para Bebés', 'Torres de Aprendizaje', 'Trabas para Puertas', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    },
    {
        id: 'beauty',
        name: 'Belleza y Cuidado Personal',
        icon: 'face',
        categories: [
            { name: 'Artefactos para el Cabello', sub: ['Bucleras', 'Cepillos Eléctricos', 'Cortadoras de Pelo', 'Kits de Artefactos', 'Planchitas de Pelo', 'Repuestos de Cortadora de Pelo', 'Secadores de Pelo', 'Trimmers', 'Otros'] },
            { name: 'Artículos de Peluquería', sub: ['Accesorios de Peluquería', 'Extensiones y Pelucas', 'Muebles para Peluquerías', 'Otros'] },
            { name: 'Barbería', sub: ['Afeitadoras', 'Brochas de Afeitar', 'Bálsamos, Aceites y Tónicos', 'Capas', 'Cartuchos para Afeitadoras', 'Cepillos Alisadores para Barba', 'Espumas de Afeitar', 'Hojas de Afeitar', 'Jabones para Barba', 'Kits para Barba', 'Navajas de Afeitar', 'Peines Barberos', 'Productos Post Afeitar', 'Otros'] },
            { name: 'Cuidado de la Piel', sub: ['Autobronceantes', 'Bálsamos Labiales', 'Cuidado Corporal', 'Cuidado Facial', 'Kits de Cuidado de la Piel', 'Limpieza Facial', 'Máscaras Faciales', 'Protección Solar', 'Pulseras Repelentes', 'Repelentes', 'Otros'] },
            { name: 'Cuidado del Cabello', sub: ['Crema para Peinar', 'Fijadores para el Cabello', 'Shampoos y Acondicionadores', 'Tinturas y Decolorantes', 'Tratamientos para el Cabello', 'Otros'] },
            { name: 'Depilación', sub: ['Bandas Depilatorias', 'Cera Depilatoria', 'Cremas Depilatorias', 'Depiladoras', 'Fundidor de Cera', 'Kits Depilatorios', 'Lapiceras Capilares', 'Moldes para Cejas', 'Pinzas de Depilar', 'Resortes Depiladores', 'Otros'] },
            { name: 'Farmacia', sub: ['Alcohol Etílico', 'Alcoholes Líquidos', 'Alcoholes en Aerosol', 'Alcoholes en Gel', 'Alcoholes en Spray', 'Algodones', 'Bicarbonato de Sodio', 'Bolsas de Colostomía', 'Cuidado Sexual', 'Cápsulas Vacías', 'Gasas', 'Tests de Embarazo y Ovulación', 'Vendas', 'Otros'] },
            { name: 'Higiene Personal', sub: ['Absorbentes de Axilas', 'Afeitadoras Descartables', 'Apósitos Adhesivos', 'Cartuchos para Afeitadoras', 'Cuidado Bucal', 'Desodorantes', 'Espumas de Afeitar', 'Higiene Femenina', 'Hisopos', 'Hojas de Afeitar', 'Jabones', 'Limpiadores de Oídos', 'Papeles Higiénicos', 'Pañuelos Descartables', 'Protección para Incontinencia', 'Rascadores de Espalda', 'Talco', 'Toallas Húmedas', 'Otros'] },
            { name: 'Manicura y Pedicura', sub: ['Decoración para Uñas', 'Dedos para Práctica', 'Diluyentes de Esmalte', 'Esmaltes', 'Instrumentos', 'Manos para Práctica', 'Mesas para Manicura', 'Muestrarios de Uñas', 'Pantuflas Descartables', 'Parafineros', 'Porta Esmaltes', 'Protectores de Esmalte', 'Quitaesmaltes', 'Sprays y Gotas Seca Esmaltes', 'Tratamientos para Manos y Pies', 'Uñas Esculpidas', 'Otros'] },
            { name: 'Maquillaje', sub: ['Agujas para Microblading', 'Aplicadores y Herramientas', 'Labios', 'Maletines de Maquillaje', 'Ojos, Pestañas y Cejas', 'Organizadores de Maquillaje', 'Rostro', 'Set de Maquillaje', 'Otros'] },
            { name: 'Perfumes', sub: ['General'] },
            { name: 'Tratamientos de Belleza', sub: ['Correctores Nasales', 'Dermógrafos', 'Equipos de Cosmetología', 'Equipos de Estética Corporal', 'Fajas Reductoras', 'Guantes Exfoliantes', 'Insumos', 'Microblading', 'Reductores de Papada', 'Vinchas Cosmetológicas', 'Voluminizadores de Labios', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    },
    {
        id: 'health',
        name: 'Salud y Equipamiento Médico',
        icon: 'medical_services',
        categories: [
            { name: 'Cuidado de la Salud', sub: ['Anteojos Graduados', 'Audífonos', 'Balanzas de Baño', 'Botiquín de Primeros Auxilios', 'Correctores de Juanetes', 'Farmacia', 'Filtros para Tapabocas', 'Lentes de Contacto', 'Lámparas Sanitizantes', 'Pastilleros', 'Pistolas Sanitizantes', 'Protección para Incontinencia', 'Pulseras Anti Náuseas', 'Tapabocas Reutilizables', 'Tensiómetros', 'Terapias de Frío y Calor', 'Termómetros Digitales', 'Termómetros de Mercurio', 'Tratamientos Respiratorios', 'Tratamientos para Piojos', 'Tratamientos para Ronquidos', 'Otros'] },
            { name: 'Equipamiento Médico', sub: ['Cabinas de Flujo Laminar', 'Desfibriladores Externos', 'Educación y Entrenamiento', 'Encapsuladoras Manuales', 'Equipamiento Odontológico', 'Equipos de Magnetoterapia', 'Equipos de Monitoreo', 'Instrumental Médico', 'Lámparas Cialíticas', 'Material de Laboratorio', 'Mobiliario Clínico', 'Máquinas Centrífugas', 'Oxigenoterapia', 'Otros'] },
            { name: 'Masajes', sub: ['Camillas y Sillas', 'Masajeadores', 'Piedras para Masajes', 'Otros'] },
            { name: 'Movilidad', sub: ['Andadores', 'Ayudas para el Baño', 'Bastones', 'Elevadores de Pacientes', 'Muletas', 'Sillas de Ruedas y Repuestos', 'Sujetadores de Pacientes', 'Otros'] },
            { name: 'Ortopedia', sub: ['Botas Ortopédicas', 'Cabestrillos', 'Coderas', 'Collares Cervicales', 'Espalderas', 'Fajas Lumbares y Abdominales', 'Férulas', 'Hombreras', 'Musleras y Pantorrilleras', 'Muñequeras', 'Podología', 'Prótesis Mamarias Externas', 'Rodilleras', 'Taloneras', 'Tobilleras', 'Otros'] },
            { name: 'Suplementos Alimenticios', sub: ['General'] },
            { name: 'Terapias Alternativas', sub: ['Acupuntura', 'Almohadillas Relajantes', 'Aromaterapia', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    }    ,
    {
        id: 'industry_office',
        name: 'Industrias y Oficinas',
        icon: 'business',
        categories: [
            { name: 'Arquitectura y Diseño', sub: ['Materiales', 'Planos', 'Tableros y Mesas de Dibujo', 'Otros'] },
            { name: 'Embalaje y Logística', sub: ['Bolsos Térmicos', 'Dispensador de Cinta Eléctrico', 'Dispensadores de Cinta', 'Envasadoras', 'Flejadoras y Tensoras Manuales', 'Materiales', 'Mochilas Térmicas', 'Selladoras', 'Túneles Termocontraíbles', 'Otros'] },
            { name: 'Equipamiento Médico', sub: ['Cabinas de Flujo Laminar', 'Desfibriladores Externos', 'Educación y Entrenamiento', 'Encapsuladoras Manuales', 'Equipamiento Odontológico', 'Equipos de Magnetoterapia', 'Equipos de Monitoreo', 'Instrumental Médico', 'Lámparas Cialíticas', 'Material de Laboratorio', 'Mobiliario Clínico', 'Máquinas Centrífugas', 'Oxigenoterapia', 'Otros'] },
            { name: 'Equipamiento para Comercios', sub: ['Balanzas', 'Butacas para Auditorio', 'Canastos de Supermercado', 'Carritos de Supermercado', 'Cobro y Control', 'Cortinas Metálicas', 'Cortinas para Refrigeración', 'Dispensadores de Vasos', 'Etiquetado de Mercadería', 'Expendedoras de Números', 'Locutorios', 'Máquinas Expendedoras', 'Organización y Exhibición', 'Otros'] },
            { name: 'Equipamiento para Oficinas', sub: ['Control de Acceso y Asistencia', 'Cortadoras de Tarjetas', 'Cubículos de Oficina', 'Fotocopiadoras y Accesorios', 'Impresoras de Tarjetas', 'Mesas, Sillas y Escritorios', 'Muebles de Guardado', 'Organización para Oficinas', 'Regatones y Almohadillas', 'Teléfonos y Faxes', 'Trituradoras', 'Otros'] },
            { name: 'Gastronomía y Hotelería', sub: ['Accesorios para Restaurantes', 'Cafeteras', 'Carritos de Comida', 'Carritos de Servicio', 'Cervecería Artesanal', 'Cocción', 'Equipamiento de Panadería', 'Fabricadora de Helados', 'Fabricadoras de Hielo', 'Limpieza y Organización', 'Mantenedores Calientes', 'Mesas de Trabajo', 'Pochocleras Comerciales', 'Preparación de Bebidas', 'Procesado de Alimentos', 'Refrigeración', 'Tratamiento de Lácteos', 'Tratamiento de la Carne', 'Otros'] },
            { name: 'Gráfica e Impresión', sub: ['Codificadoras y Fechadoras', 'Cortadores de Cinta Eléctricos', 'Cuchillas para Plotters', 'Hendedoras', 'Impresoras Offset', 'Impresoras Térmicas', 'Plastificado', 'Plotters de Corte', 'Serigrafía', 'Tampográficas', 'Otros'] },
            { name: 'Herramientas Industriales', sub: ['Balanceadoras de Ruedas', 'Bobinadoras', 'CNC', 'Calderas Industriales', 'Carga y Descarga', 'Colectores de Polvo', 'Conformado', 'Enfriadores de Agua', 'Equip. Pintura Electrostática', 'Escopleadoras', 'Hornos y Tratamiento Térmico', 'Mecanizado y Acabado', 'Motores Estacionarios', 'Máquinas Copiadoras de Llaves', 'Máquinas Pelacables', 'Pegadoras de Cantos', 'Plasturgia', 'Rebobinadoras para Papel', 'Repuestos', 'Sierras', 'Taladros a Combustión', 'Otros'] },
            { name: 'Publicidad y Promoción', sub: ['Carteles', 'Carteles Luminosos', 'Folletos', 'Identificación para Eventos', 'Inflables Danzantes', 'Merchandising', 'Portafolletos', 'Vinilos', 'Volantes', 'Otros'] },
            { name: 'Seguridad Laboral', sub: ['Alfombras Antifatiga', 'Botiquín de Primeros Auxilios', 'Chalecos Reflectivos', 'Cinta Antideslizante', 'Detectores de Gases', 'Equipos Contra Incendios', 'Limpieza y Sanitización', 'Protección Personal', 'Señalización', 'Otros'] },
            { name: 'Textil y Calzado', sub: ['Confección de Ropa', 'Fabricación de Ojotas', 'Lavado y Planchado', 'Otros'] },
            { name: 'Uniformes y Ropa de Trabajo', sub: ['Ambos Médicos', 'Camisas', 'Camperas de Trabajo', 'Mamelucos', 'Medias de Trabajo', 'Pantalones', 'Trajes de Bombero', 'Uniformes Gastronómicos', 'Uniformes de Trabajo Doméstico', 'Otros'] },
            { name: 'Otros', sub: ['General'] }
        ]
    }    ,
    {
        id: 'technology',
        name: 'Tecnología',
        icon: 'devices',
        categories: [
            { name: 'Celulares y Teléfonos', sub: ['Celulares y Smartphones', 'Accesorios para Celulares', 'Repuestos de Celulares'] },
            { name: 'Computación', sub: ['Componentes de PC', 'Impresión', 'Tablets y Accesorios', 'PC', 'Conectividad y Redes', 'Monitores y Accesorios'] },
            { name: 'Cámaras y Accesorios', sub: ['Cámaras Digitales', 'Accesorios para Cámaras', 'Filmadoras y Cámaras de Acción'] },
            { name: 'Electrónica, Audio y Video', sub: ['Audio', 'Accesorios para Audio y Video', 'Componentes Electrónicos', 'Drones y Accesorios', 'Audio para Vehículos', 'Televisores'] },
            { name: 'Consolas y Videojuegos', sub: ['Videojuegos', 'Para PlayStation', 'Para Nintendo'] },
            { name: 'Televisores', sub: ['General'] }
        ]
    },
    {
        id: 'vehicles',
        name: 'Autos, Motos y Otros',
        icon: 'directions_car',
        categories: [
            { name: 'Autos Chocados y Averiados', sub: ['General'] },
            { name: 'Autos de Colección', sub: ['General'] },
            { name: 'Autos y Camionetas', sub: ['General'] },
            { name: 'Camiones', sub: ['General'] },
            { name: 'Colectivos', sub: ['General'] },
            { name: 'Maquinaria Agrícola', sub: ['Cosechadoras', 'Desmalezadoras', 'Fertilizadoras', 'Mixers', 'Otras Maquinarias', 'Palas Cargadoras', 'Pulverizadoras', 'Sembradoras', 'Tolvas', 'Tractores'] },
            { name: 'Maquinaria Vial', sub: ['Autoelevadores', 'Excavadoras', 'Minicargadoras', 'Motoniveladoras', 'Otras Maquinarias', 'Palas Cargadoras', 'Retroexcavadoras', 'Topadoras'] },
            { name: 'Motorhomes', sub: ['General'] },
            { name: 'Motos', sub: ['General'] },
            { name: 'Náutica', sub: ['Botes y Canoas', 'Cruceros', 'Embarcaciones a Vela', 'Gomones con Motor', 'Lanchas', 'Motos de Agua y Jet Ski', 'Semirrígidos', 'Otros'] },
            { name: 'Otros Vehículos', sub: ['Acoplados', 'Areneros', 'Aviones', 'Bicimotos', 'Contenedores', 'Food Trucks', 'Grúas', 'Kartings', 'Motos Eléctricas', 'Taxis', 'Trailers', 'Otros'] },
            { name: 'Planes de Ahorro', sub: ['General'] },
            { name: 'Semirremolques', sub: ['General'] }
        ]
    },
    {
        id: 'real_estate',
        name: 'Inmuebles',
        icon: 'location_city',
        categories: [
            { name: 'Camas Náuticas', sub: ['Alquiler', 'Venta'] },
            { name: 'Campos', sub: ['Alquiler', 'Venta'] },
            { name: 'Casas', sub: ['Alquiler', 'Alquiler Temporario', 'Venta'] },
            { name: 'Cocheras', sub: ['Alquiler', 'Venta'] },
            { name: 'Consultorios', sub: ['Alquiler', 'Venta'] },
            { name: 'Departamentos', sub: ['Alquiler', 'Alquiler Temporario', 'Venta'] },
            { name: 'Depósitos y Galpones', sub: ['Alquiler', 'Venta'] },
            { name: 'Fondo de Comercio', sub: ['Alquiler', 'Venta'] },
            { name: 'Locales', sub: ['Alquiler', 'Venta'] },
            { name: 'Oficinas', sub: ['Alquiler', 'Venta'] },
            { name: 'Otros Inmuebles', sub: ['Alquiler', 'Alquiler Temporario', 'Venta'] },
            { name: 'PH', sub: ['Alquiler', 'Alquiler Temporario', 'Venta'] },
            { name: 'Parcelas, Nichos y Bóvedas', sub: ['Venta'] },
            { name: 'Quintas', sub: ['Alquiler', 'Alquiler Temporario', 'Venta'] },
            { name: 'Terrenos y Lotes', sub: ['Alquiler', 'Venta'] },
            { name: 'Tiempo Compartido', sub: ['Alquiler Temporario', 'Venta'] }
        ]
    }
];
