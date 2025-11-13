/**
 * Script para agregar productos de ejemplo al catálogo
 * Uso: node scripts/add-products.js
 */

import { createClient } from 'redis';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Definición de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') }); 

// Inicializar Firebase Admin usando la RUTA AL ARCHIVO JSON (más robusto)
if (!admin.apps.length) {
    // Usamos el path de .env: FIREBASE_SERVICE_ACCOUNT_PATH
    const serviceAccountPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
    });
    console.log("✅ Firebase Admin SDK inicializado usando la ruta JSON.");
}

const db = admin.firestore();
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

const products = [
  // Zapatillas
  {
    name: 'AIR MAX 90 RETRO',
    description: 'Zapatillas deportivas clásicas con tecnología de amortiguación Air Max. Diseño retro renovado.',
    category: 'zapatillas',
    price: 129.99,
    stock_limit: 25,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    tags: ['zapatillas', 'deportivas', 'nike', 'retro'],
    isActive: true,
  },
  {
    name: 'CHUNKY SNEAKERS PREMIUM',
    description: 'Zapatillas de diseño con suela gruesa. Estilo urbano y moderno.',
    category: 'zapatillas',
    price: 149.99,
    stock_limit: 30,
    imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
    tags: ['zapatillas', 'urbanas', 'chunky'],
    isActive: true,
  },
  // Polos
  {
    name: 'POLO CLASSIC FIT',
    description: 'Polo de algodón premium. Corte clásico y cómodo. Perfecto para cualquier ocasión.',
    category: 'polos',
    price: 49.99,
    stock_limit: 50,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    tags: ['polo', 'algodón', 'clásico'],
    isActive: true,
  },
  {
    name: 'POLO SLIM FIT PREMIUM',
    description: 'Polo de corte ajustado con tejido de alta calidad. Diseño moderno y elegante.',
    category: 'polos',
    price: 59.99,
    stock_limit: 40,
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    tags: ['polo', 'slim', 'premium'],
    isActive: true,
  },
  // Poleras
  {
    name: 'HOODIE OVERSIZED',
    description: 'Polera con capucha de corte oversized. Cómoda y con estilo urbano.',
    category: 'poleras',
    price: 79.99,
    stock_limit: 35,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    tags: ['hoodie', 'oversized', 'urbano'],
    isActive: true,
  },
  {
    name: 'CREW NECK SWEATER',
    description: 'Polera de cuello redondo. Tejido suave y cálido. Ideal para el día a día.',
    category: 'poleras',
    price: 69.99,
    stock_limit: 45,
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
    tags: ['sweater', 'crew', 'básico'],
    isActive: true,
  },
  // Camperas
  {
    name: 'BOMBER JACKET',
    description: 'Campera tipo bomber con diseño moderno. Perfecta para todas las estaciones.',
    category: 'camperas',
    price: 159.99,
    stock_limit: 20,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    tags: ['bomber', 'jacket', 'casual'],
    isActive: true,
  },
  {
    name: 'DENIM JACKET CLASSIC',
    description: 'Campera de jean clásica. Diseño atemporal y versátil.',
    category: 'camperas',
    price: 89.99,
    stock_limit: 30,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    tags: ['denim', 'jean', 'clásico'],
    isActive: true,
  },
  // Pantalones (Jeans)
  {
    name: 'JEANS SLIM FIT',
    description: 'Jeans de corte ajustado. Tela premium con gran elasticidad y comodidad.',
    category: 'pantalones',
    price: 89.99,
    stock_limit: 40,
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
    tags: ['jeans', 'slim', 'pantalones'],
    isActive: true,
  },
  {
    name: 'JEANS RELAXED FIT',
    description: 'Jeans de corte relajado. Máxima comodidad sin sacrificar estilo.',
    category: 'pantalones',
    price: 79.99,
    stock_limit: 35,
    imageUrl: 'https://images.unsplash.com/photo-1582418702059-97ebafb88868?w=800',
    tags: ['jeans', 'relaxed', 'cómodo'],
    isActive: true,
  },
  // Relojes
  {
    name: 'CHRONOGRAPH WATCH',
    description: 'Reloj cronógrafo con diseño elegante. Resistente al agua y con movimiento automático.',
    category: 'accesorios',
    price: 299.99,
    stock_limit: 15,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    tags: ['reloj', 'cronógrafo', 'elegante'],
    isActive: true,
  },
  {
    name: 'SMART WATCH PREMIUM',
    description: 'Reloj inteligente con múltiples funciones. Pantalla AMOLED y batería de larga duración.',
    category: 'accesorios',
    price: 249.99,
    stock_limit: 20,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    tags: ['smartwatch', 'tecnología', 'premium'],
    isActive: true,
  },
  // Cadenas y Collares
  {
    name: 'CHAIN NECKLACE GOLD',
    description: 'Cadena de oro de 18k. Diseño minimalista y elegante. Longitud ajustable.',
    category: 'accesorios',
    price: 199.99,
    stock_limit: 10,
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    tags: ['cadena', 'oro', 'elegante'],
    isActive: true,
  },
  {
    name: 'PENDANT NECKLACE SILVER',
    description: 'Collar de plata con colgante. Diseño único y sofisticado.',
    category: 'accesorios',
    price: 149.99,
    stock_limit: 18,
    imageUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a2?w=800',
    tags: ['collar', 'plata', 'colgante'],
    isActive: true,
  },
];

async function addProducts() {
  try {
    await redisClient.connect();
    console.log('✅ Redis conectado');

    console.log(`📦 Agregando ${products.length} productos...\n`);

    for (const product of products) {
      // Agregar producto a Firestore
      const productRef = await db.collection('products').add({
        ...product,
        totalSold: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastPurchaseAt: null,
      });

      const productId = productRef.id;

      // Inicializar stock en Redis
      const stockKey = `product:${productId}:stock`;
      await redisClient.set(stockKey, product.stock_limit);

      console.log(`✅ ${product.name} - Stock: ${product.stock_limit} - ID: ${productId}`);
    }

    console.log(`\n✨ ${products.length} productos agregados exitosamente`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redisClient.quit();
    process.exit(0);
  }
}

addProducts();

