# Backend - Drops Store

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
- Copiar `.env.example` a `.env`
- Completar con tus credenciales de Firebase y Redis

3. Inicializar stock en Redis:
```bash
# Ejemplo: Establecer stock inicial para un producto
redis-cli SET product:PRODUCT_ID:stock 100
```

4. Ejecutar servidor:
```bash
npm start
# o en modo desarrollo:
npm run dev
```

## Scripts Útiles

### Agregar Productos de Ejemplo

Para agregar un catálogo completo de productos de moda (zapatillas, polos, poleras, camperas, jeans, relojes, cadenas):

```bash
node scripts/add-products.js
```

Este script agregará 14 productos de ejemplo con diferentes categorías y stocks limitados, e inicializará el stock en Redis automáticamente.

### Inicializar Stock desde Firestore

Si ya tienes productos en Firestore y necesitas inicializar su stock en Redis:

```bash
node scripts/init-stock.js
```

## Endpoints

- `GET /api/products` - Obtiene todos los productos con stock actual
- `POST /api/purchase/:productId` - Procesa una compra atómica
- `GET /health` - Estado del servidor

