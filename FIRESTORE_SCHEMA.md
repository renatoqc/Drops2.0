# Esquema de Datos - Firestore

## Colección: `products`

Documento que representa un producto disponible en el drop.

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

