# Esquema de Datos - Firestore

## Colección: `products`

Documento que representa un producto disponible en el drop.

### Campos:

```javascript
{
  // Identificación
  name: string,                    // Nombre del producto (ej: "T-Shirt Exclusive Drop")
  description: string,              // Descripción del producto
  imageUrl: string,                 // URL de la imagen principal
  
  // Precio y Stock
  price: number,                    // Precio en la moneda base (ej: 99.99)
  stock_limit: number,              // Stock máximo inicial (ej: 100)
  
  // Metadatos
  category: string,                 // Categoría (opcional, ej: "apparel", "accessories")
  tags: array<string>,              // Tags para búsqueda (opcional)
  
  // Auditoría y estadísticas
  totalSold: number,                // Total vendido (se incrementa con cada compra)
  createdAt: timestamp,             // Fecha de creación
  lastPurchaseAt: timestamp,        // Última fecha de compra
  isActive: boolean,                // Si el producto está activo para venta
  
  // Información adicional (opcional)
  sku: string,                      // SKU único del producto
  weight: number,                   // Peso para envío (opcional)
  dimensions: {                     // Dimensiones (opcional)
    length: number,
    width: number,
    height: number
  }
}
```

### Ejemplo de Documento:

```javascript
{
  name: "ASTROWORLD HOODIE",
  description: "Limited edition hoodie from the exclusive drop",
  imageUrl: "https://example.com/hoodie.jpg",
  price: 149.99,
  stock_limit: 50,
  category: "apparel",
  tags: ["hoodie", "limited", "exclusive"],
  totalSold: 0,
  createdAt: Timestamp,
  lastPurchaseAt: null,
  isActive: true,
  sku: "AST-HOOD-001"
}
```

---

## Colección: `purchases`

Documento que registra cada compra realizada.

### Campos:

```javascript
{
  // Referencias
  productId: string,                // ID del producto comprado
  userId: string,                   // ID del usuario que compró
  
  // Detalles de la compra
  quantity: number,                 // Cantidad comprada
  price: number,                    // Precio unitario al momento de la compra
  total: number,                    // Total pagado (price * quantity)
  
  // Estado y timestamps
  status: string,                   // Estado: "completed", "pending", "cancelled"
  timestamp: timestamp,             // Fecha y hora de la compra
  
  // Información adicional (opcional)
  paymentMethod: string,            // Método de pago (opcional)
  shippingAddress: {                // Dirección de envío (opcional)
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  }
}
```

### Ejemplo de Documento:

```javascript
{
  productId: "abc123",
  userId: "user_1234567890",
  quantity: 1,
  price: 149.99,
  total: 149.99,
  status: "completed",
  timestamp: Timestamp,
  paymentMethod: "credit_card"
}
```

---

## Colección: `users`

Documento que almacena información adicional del usuario (además de Firebase Auth).

### Campos:

```javascript
{
  email: string,                      // Email del usuario
  displayName: string,                 // Nombre para mostrar
  createdAt: timestamp,                // Fecha de registro
}
```

### Ejemplo de Documento:

```javascript
{
  email: "usuario@example.com",
  displayName: "Usuario",
  createdAt: Timestamp
}
```

---

## Colección: `carts`

Documento que representa el carrito de compras de un usuario. El ID del documento es el `uid` del usuario.

### Campos:

```javascript
{
  items: array<{                      // Array de items en el carrito
    productId: string,                 // ID del producto
    quantity: number,                   // Cantidad deseada
    addedAt: timestamp                 // Fecha en que se agregó al carrito
  }>,
  updatedAt: timestamp                 // Última actualización del carrito
}
```

### Ejemplo de Documento:

```javascript
{
  items: [
    {
      productId: "abc123",
      quantity: 2,
      addedAt: Timestamp
    },
    {
      productId: "def456",
      quantity: 1,
      addedAt: Timestamp
    }
  ],
  updatedAt: Timestamp
}
```

### Notas sobre Carritos:

- Cada usuario tiene un único carrito identificado por su `uid`
- El carrito se crea automáticamente al registrar un usuario
- Los items se enriquecen con información del producto al obtener el carrito
- El stock se verifica en tiempo real desde Redis

---

