import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path'; 
import { fileURLToPath } from 'url'; 

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para verificar token de autenticación
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token no proporcionado' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
};

// Inicializar Firebase Admin
if (!admin.apps.length) {
    try {
      // Usamos el path de .env: FIREBASE_SERVICE_ACCOUNT_PATH
      const serviceAccountPath = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        throw new Error('❌ Error: La variable FIREBASE_SERVICE_ACCOUNT_PATH no está definida en .env');
      }
  
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      console.log('✅ Firebase Admin inicializado correctamente usando la ruta JSON');
    } catch (error) {
      console.error('❌ Error inicializando Firebase Admin:', error.message);
      // Es crucial que el servidor se detenga si la autenticación falla
      throw new Error('ERROR FATAL DE CONFIGURACIÓN DE FIREBASE: ' + error.message);
    }
  }

const db = admin.firestore();

// Inicializar Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis conectado'));

// Conectar Redis
await redisClient.connect();

// ============================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================

/**
 * POST /api/auth/register
 * Registra un nuevo usuario con Firebase Authentication
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Email inválido' });
    }

    // Verificar que Firebase Admin esté inicializado
    if (admin.apps.length === 0) {
      return res.status(500).json({ success: false, error: 'Error de configuración del servidor' });
    }

    // Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
    });

    // Crear documento de usuario en Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: userRecord.displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Crear carrito vacío para el usuario
    await db.collection('carts').doc(userRecord.uid).set({
      items: [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Generar token personalizado
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
      customToken,
    });
  } catch (error) {
    console.error('Error registrando usuario:', error);
    
    // Manejar errores específicos de Firebase Auth
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ success: false, error: 'El email ya está registrado' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ success: false, error: 'Email inválido' });
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ success: false, error: 'La contraseña es muy débil' });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al registrar usuario',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Verifica credenciales y devuelve token
 * Nota: En producción, el login debería hacerse directamente desde el cliente con Firebase SDK
 * Este endpoint es para verificación del token
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, error: 'Token requerido' });
    }

    // Verificar que Firebase Admin esté inicializado
    if (admin.apps.length === 0) {
      return res.status(500).json({ success: false, error: 'Error de configuración del servidor' });
    }

    // Verificar token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Obtener información del usuario
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userDoc.data()?.displayName,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    
    // Manejar errores específicos
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, error: 'Token expirado' });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ success: false, error: 'Token revocado' });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(400).json({ success: false, error: 'Token inválido' });
    }
    
    res.status(401).json({ 
      success: false, 
      error: error.message || 'Token inválido',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// ENDPOINTS DE CARRITO
// ============================================

/**
 * GET /api/cart/get
 * Obtiene el carrito del usuario autenticado
 */
app.get('/api/cart/get', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const cartDoc = await db.collection('carts').doc(userId).get();

    if (!cartDoc.exists) {
      // Crear carrito vacío si no existe
      await db.collection('carts').doc(userId).set({
        items: [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.json({ success: true, cart: { items: [] } });
    }

    const cartData = cartDoc.data();
    
    // Enriquecer items con información del producto
    const enrichedItems = await Promise.all(
      (cartData.items || []).map(async (item) => {
        const productDoc = await db.collection('products').doc(item.productId).get();
        if (!productDoc.exists) {
          return null; // Producto eliminado
        }

        const productData = productDoc.data();
        const stockKey = `product:${item.productId}:stock`;
        const currentStock = await redisClient.get(stockKey);
        const stock = currentStock ? parseInt(currentStock, 10) : productData.stock_limit || 0;

        return {
          ...item,
          product: {
            id: item.productId,
            name: productData.name,
            price: productData.price,
            imageUrl: productData.imageUrl,
            stock: stock,
            isSoldOut: stock <= 0,
          },
        };
      })
    );

    // Filtrar items nulos (productos eliminados)
    const validItems = enrichedItems.filter(item => item !== null);

    res.json({
      success: true,
      cart: {
        items: validItems,
        total: validItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
      },
    });
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({ success: false, error: 'Error al obtener carrito' });
  }
});

/**
 * POST /api/cart/add
 * Agrega un producto al carrito
 */
app.post('/api/cart/add', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId es requerido' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, error: 'La cantidad debe ser mayor a 0' });
    }

    // Verificar que el producto existe
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    // Obtener carrito actual
    const cartDoc = await db.collection('carts').doc(userId).get();
    const cartData = cartDoc.exists ? cartDoc.data() : { items: [] };
    const items = cartData.items || [];

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = items.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
      // Actualizar cantidad
      items[existingItemIndex].quantity += quantity;
    } else {
      // Agregar nuevo item
      items.push({
        productId,
        quantity,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Actualizar carrito en Firestore
    await db.collection('carts').doc(userId).set({
      items,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ success: true, message: 'Producto agregado al carrito' });
  } catch (error) {
    console.error('Error agregando al carrito:', error);
    res.status(500).json({ success: false, error: 'Error al agregar al carrito' });
  }
});

/**
 * POST /api/cart/update
 * Actualiza la cantidad de un producto en el carrito
 */
app.post('/api/cart/update', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, error: 'productId y quantity son requeridos' });
    }

    if (quantity <= 0) {
      // Si la cantidad es 0 o menor, eliminar el item llamando al endpoint de remove
      const removeReq = { ...req, body: { productId } };
      const removeRes = {
        status: (code) => ({ json: (data) => res.status(code).json(data) }),
        json: (data) => res.json(data),
      };
      // Llamar lógica de remove directamente
      const cartDocForRemove = await db.collection('carts').doc(userId).get();
      if (!cartDocForRemove.exists) {
        return res.status(404).json({ success: false, error: 'Carrito no encontrado' });
      }
      const itemsForRemove = cartDocForRemove.data().items || [];
      const filteredItems = itemsForRemove.filter(item => item.productId !== productId);
      await db.collection('carts').doc(userId).update({
        items: filteredItems,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.json({ success: true, message: 'Producto eliminado del carrito' });
    }

    const cartDoc = await db.collection('carts').doc(userId).get();
    if (!cartDoc.exists) {
      return res.status(404).json({ success: false, error: 'Carrito no encontrado' });
    }

    const items = cartDoc.data().items || [];
    const itemIndex = items.findIndex(item => item.productId === productId);

    if (itemIndex < 0) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado en el carrito' });
    }

    items[itemIndex].quantity = quantity;

    await db.collection('carts').doc(userId).update({
      items,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: 'Carrito actualizado' });
  } catch (error) {
    console.error('Error actualizando carrito:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar carrito' });
  }
});

/**
 * POST /api/cart/remove
 * Elimina un producto del carrito
 */
app.post('/api/cart/remove', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId es requerido' });
    }

    const cartDoc = await db.collection('carts').doc(userId).get();
    if (!cartDoc.exists) {
      return res.status(404).json({ success: false, error: 'Carrito no encontrado' });
    }

    const items = cartDoc.data().items || [];
    const filteredItems = items.filter(item => item.productId !== productId);

    await db.collection('carts').doc(userId).update({
      items: filteredItems,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, message: 'Producto eliminado del carrito' });
  } catch (error) {
    console.error('Error eliminando del carrito:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar del carrito' });
  }
});

// ============================================
// ENDPOINTS EXISTENTES
// ============================================

/**
 * GET /api/products
 * Devuelve todos los productos con stock actual desde Redis
 */
app.get('/api/products', async (req, res) => {
  try {
    // Obtener productos de Firestore
    const productsSnapshot = await db.collection('products').get();
    const products = [];

    for (const doc of productsSnapshot.docs) {
      const productData = doc.data();
      const productId = doc.id;

      // Obtener stock actual desde Redis
      const stockKey = `product:${productId}:stock`;
      const currentStock = await redisClient.get(stockKey);
      const stock = currentStock ? parseInt(currentStock, 10) : productData.stock_limit || 0;

      products.push({
        id: productId,
        ...productData,
        stock: stock,
        isSoldOut: stock <= 0,
      });
    }

    res.json({ success: true, products });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener productos' });
  }
});

/**
 * POST /api/purchase/checkout
 * Procesa la compra de todos los items del carrito usando lógica atómica
 */
app.post('/api/purchase/checkout', verifyToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    // 1. Obtener carrito del usuario
    const cartDoc = await db.collection('carts').doc(userId).get();
    if (!cartDoc.exists) {
      return res.status(404).json({ success: false, error: 'Carrito no encontrado' });
    }

    const cartItems = cartDoc.data().items || [];
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, error: 'El carrito está vacío' });
    }

    // 2. Verificar stock y procesar compras de forma atómica
    const purchases = [];
    const failedItems = [];

    for (const item of cartItems) {
      const productDoc = await db.collection('products').doc(item.productId).get();
      
      if (!productDoc.exists) {
        failedItems.push({ productId: item.productId, reason: 'Producto no encontrado' });
        continue;
      }

      const productData = productDoc.data();
      const stockKey = `product:${item.productId}:stock`;

      // OPERACIÓN ATÓMICA: DECRBY
      const newStock = await redisClient.decrBy(stockKey, item.quantity);

      if (newStock < 0) {
        // Revertir si no hay stock suficiente
        await redisClient.incrBy(stockKey, item.quantity);
        failedItems.push({
          productId: item.productId,
          reason: 'Stock insuficiente',
          availableStock: newStock + item.quantity,
        });
        continue;
      }

      // Registrar compra exitosa
      const purchaseData = {
        productId: item.productId,
        userId,
        quantity: item.quantity,
        price: productData.price,
        total: productData.price * item.quantity,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
      };

      const purchaseRef = await db.collection('purchases').add(purchaseData);
      purchases.push({ ...purchaseData, id: purchaseRef.id });

      // Actualizar estadísticas del producto
      await db.collection('products').doc(item.productId).update({
        totalSold: admin.firestore.FieldValue.increment(item.quantity),
        lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 3. Limpiar carrito si todas las compras fueron exitosas
    if (failedItems.length === 0) {
      await db.collection('carts').doc(userId).update({
        items: [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Remover solo los items exitosos del carrito
      const remainingItems = cartItems.filter(item =>
        failedItems.some(failed => failed.productId === item.productId)
      );
      await db.collection('carts').doc(userId).update({
        items: remainingItems,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({
      success: true,
      purchases,
      failedItems: failedItems.length > 0 ? failedItems : undefined,
      message: failedItems.length > 0
        ? 'Algunos productos no pudieron ser comprados'
        : 'Compra completada exitosamente',
    });
  } catch (error) {
    console.error('Error procesando compra:', error);
    res.status(500).json({ success: false, error: 'Error al procesar la compra' });
  }
});

/**
 * POST /api/purchase/:productId
 * Lógica atómica de compra directa (mantener para compatibilidad)
 * @deprecated Usar /api/purchase/checkout con carrito
 */
app.post('/api/purchase/:productId', verifyToken, async (req, res) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;
  const userId = req.user.uid;

  if (quantity <= 0) {
    return res.status(400).json({ success: false, error: 'La cantidad debe ser mayor a 0' });
  }

  // Nota: Este endpoint mantiene la lógica original pero ahora requiere autenticación

  try {
    // 1. Verificar que el producto existe en Firestore
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    const productData = productDoc.data();
    const stockKey = `product:${productId}:stock`;

    // 2. OPERACIÓN ATÓMICA: DECRBY en Redis
    // Esta operación reduce el stock de forma atómica y devuelve el nuevo valor
    const newStock = await redisClient.decrBy(stockKey, quantity);

    // 3. Verificar si hay stock suficiente
    if (newStock < 0) {
      // Si el stock quedó negativo, revertir la operación
      await redisClient.incrBy(stockKey, quantity);
      return res.status(409).json({
        success: false,
        error: 'Stock insuficiente',
        availableStock: newStock + quantity,
      });
    }

    // 4. Si la operación fue exitosa, inicializar el stock en Redis si es la primera vez
    // (solo si el valor era null/undefined antes de DECRBY)
    if (newStock === productData.stock_limit - quantity) {
      // Primera compra, asegurar que el stock inicial esté configurado
      const currentValue = await redisClient.get(stockKey);
      if (!currentValue && productData.stock_limit) {
        // Si no existía, ya fue decrementado, así que está bien
        // Pero si necesitamos inicializar desde Firestore, lo hacemos aquí
      }
    }

    // 5. Registrar la venta en Firestore
    const purchaseData = {
      productId,
      userId,
      quantity,
      price: productData.price,
      total: productData.price * quantity,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed',
    };

    await db.collection('purchases').add(purchaseData);

    // 6. Actualizar el documento del producto en Firestore (opcional, para auditoría)
    await db.collection('products').doc(productId).update({
      totalSold: admin.firestore.FieldValue.increment(quantity),
      lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      purchase: purchaseData,
      remainingStock: newStock,
    });
  } catch (error) {
    console.error('Error procesando compra:', error);
    res.status(500).json({ success: false, error: 'Error al procesar la compra' });
  }
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

