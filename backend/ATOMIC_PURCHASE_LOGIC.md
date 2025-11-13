# Lógica de Compra Atómica con Redis DECRBY

## Resumen

La operación de compra utiliza `DECRBY` de Redis para garantizar que no haya sobreventa (doble venta) en productos de stock limitado.

## Flujo de Compra

```javascript
/**
 * POST /api/purchase/:productId
 * 
 * 1. Verificar que el producto existe en Firestore
 * 2. OPERACIÓN ATÓMICA: DECRBY en Redis (reduce stock)
 * 3. Verificar si hay stock suficiente (si newStock < 0, revertir)
 * 4. Si exitoso, registrar venta en Firestore
 * 5. Actualizar estadísticas del producto
 */

app.post('/api/purchase/:productId', async (req, res) => {
  const { productId } = req.params;
  const { userId, quantity = 1 } = req.body;

  try {
    // 1. Verificar producto en Firestore
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const stockKey = `product:${productId}:stock`;

    // 2. OPERACIÓN ATÓMICA: DECRBY
    // Esta es la operación clave que garantiza atomicidad
    // DECRBY reduce el valor de forma atómica y devuelve el nuevo valor
    const newStock = await redisClient.decrBy(stockKey, quantity);

    // 3. Verificar stock suficiente
    if (newStock < 0) {
      // Si quedó negativo, revertir la operación
      await redisClient.incrBy(stockKey, quantity);
      return res.status(409).json({
        error: 'Stock insuficiente',
        availableStock: newStock + quantity,
      });
    }

    // 4. Registrar venta en Firestore
    const purchaseData = {
      productId,
      userId,
      quantity,
      price: productDoc.data().price,
      total: productDoc.data().price * quantity,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed',
    };

    await db.collection('purchases').add(purchaseData);

    // 5. Actualizar estadísticas
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
    res.status(500).json({ error: 'Error al procesar la compra' });
  }
});
```

## ¿Por qué DECRBY es Atómico?

1. **Operación Atómica**: `DECRBY` es una operación atómica en Redis, lo que significa que:
   - No puede ser interrumpida por otra operación
   - Garantiza consistencia incluso con múltiples solicitudes simultáneas
   - Devuelve el valor resultante inmediatamente

2. **Prevención de Sobreventa**:
   - Si dos usuarios intentan comprar el último producto simultáneamente
   - Solo uno de los `DECRBY` devolverá un valor >= 0
   - El otro recibirá un valor negativo y se revertirá

3. **Reversión en Caso de Error**:
   - Si el stock queda negativo, usamos `INCRBY` para revertir
   - Esto garantiza que el stock nunca quede inconsistente

## Ejemplo de Escenario de Concurrencia

```
Estado inicial: stock = 1

Usuario A: DECRBY(product:123:stock, 1) → newStock = 0 ✅
Usuario B: DECRBY(product:123:stock, 1) → newStock = -1 ❌

Usuario B detecta newStock < 0:
  → INCRBY(product:123:stock, 1) → stock = 0
  → Responde: "Stock insuficiente"
```

## Ventajas de este Enfoque

- ✅ **Atomicidad**: Operación indivisible
- ✅ **Performance**: Redis es extremadamente rápido
- ✅ **Escalabilidad**: Maneja alta concurrencia
- ✅ **Consistencia**: No hay condiciones de carrera
- ✅ **Simplicidad**: Lógica clara y fácil de mantener

