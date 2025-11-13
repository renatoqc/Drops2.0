# Drops Store 2.0

Tienda virtual de drops con inventario atómico usando Redis y Firestore.
 

## 🔑 Características Clave

### Inventario Atómico

La lógica de compra usa `DECRBY` de Redis para garantizar que no haya sobreventa:

```javascript
// Operación atómica
const newStock = await redisClient.decrBy(stockKey, quantity);

// Si el stock queda negativo, revertir
if (newStock < 0) {
  await redisClient.incrBy(stockKey, quantity);
  return res.status(409).json({ error: 'Stock insuficiente' });
}
```


**Carrito:**
- `GET /api/cart/get` - Obtiene carrito del usuario (requiere autenticación)
- `POST /api/cart/add` - Agrega producto al carrito (requiere autenticación)
- `POST /api/cart/update` - Actualiza cantidad en carrito (requiere autenticación)
- `POST /api/cart/remove` - Elimina producto del carrito (requiere autenticación)

**Productos y Compras:**
- `GET /api/products` - Obtiene productos con stock actual desde Redis
- `POST /api/purchase/checkout` - Procesa compra del carrito completo (requiere autenticación)
- `POST /api/purchase/:productId` - Compra directa (deprecated, usar carrito)

## 🛒 Funcionalidades

### Autenticación
- Registro de usuarios con email y contraseña
- Inicio de sesión con Firebase Auth
- Sesión persistente
- Protección de rutas

### Carrito de Compras
- Agregar productos al carrito
- Actualizar cantidades
- Eliminar productos
- Vista completa del carrito con totales
- Checkout con validación de stock atómica

## 📝 Notas

- El stock real se mantiene en Redis
- Firestore almacena `totalSold` para auditoría
- El frontend se actualiza cada 5 segundos para mostrar stock actualizado
- Cada usuario tiene su propio carrito asociado a su `uid`
- El carrito se crea automáticamente al registrar un usuario

