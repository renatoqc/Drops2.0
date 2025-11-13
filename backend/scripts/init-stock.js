/**
 * Script para inicializar stock en Redis desde Firestore
 * Uso: node scripts/init-stock.js
 */

import { createClient } from 'redis';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

async function initStock() {
  try {
    await redisClient.connect();
    console.log('✅ Redis conectado');

    // Obtener todos los productos
    const productsSnapshot = await db.collection('products').get();

    if (productsSnapshot.empty) {
      console.log('⚠️  No hay productos en Firestore');
      return;
    }

    console.log(`📦 Inicializando stock para ${productsSnapshot.size} productos...\n`);

    for (const doc of productsSnapshot.docs) {
      const productId = doc.id;
      const productData = doc.data();
      const stockLimit = productData.stock_limit || 0;

      const stockKey = `product:${productId}:stock`;

      // Verificar si ya existe
      const existing = await redisClient.get(stockKey);

      if (existing !== null) {
        console.log(`⏭️  ${productId}: Stock ya existe (${existing}), omitiendo...`);
        continue;
      }

      // Inicializar stock
      await redisClient.set(stockKey, stockLimit);
      console.log(`✅ ${productId}: Stock inicializado a ${stockLimit}`);
    }

    console.log('\n✨ Inicialización completada');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redisClient.quit();
    process.exit(0);
  }
}

initStock();

