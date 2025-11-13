# Drops Store 2.0

Tienda virtual de drops con inventario atómico usando Redis y Firestore.

## 🏗️ Arquitectura

- **Backend**: Node.js + Express.js
- **Frontend**: React + Vite
- **Base de Datos**: Firebase Firestore (NoSQL)
- **Autenticación**: Firebase Authentication
- **Caché/Inventario**: Redis

## 📁 Estructura del Proyecto

```
Drops2.0/
├── backend/
│   ├── server.js          # Servidor Express con endpoints
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Componente principal
│   │   ├── App.css        # Estilos minimalista blanco
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── firebase.js    # Configuración Firebase
│   │   └── components/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── CartIcon.jsx
│   │       └── CartPage.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── FIRESTORE_SCHEMA.md    # Esquema de datos
└── README.md
```

## 🚀 Inicio Rápido

### Backend

1. Navegar a la carpeta backend:
```bash
cd backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp env.template .env
# Editar .env con tus credenciales de Firebase y Redis
```

4. Inicializar stock en Redis (ejemplo):
```bash
redis-cli SET product:PRODUCT_ID:stock 100
```

5. Ejecutar servidor:
```bash
npm start
```

### Frontend

1. Navegar a la carpeta frontend:
```bash
cd frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar Firebase (crear archivo `.env` en la raíz de `frontend/`):
```bash
# Copiar valores desde Firebase Console > Project Settings > General
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=tu-app-id
```

4. Ejecutar en desarrollo:
```bash
npm run dev
```

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

### Endpoints

**Autenticación:**
- `POST /api/auth/register` - Registra nuevo usuario
- `POST /api/auth/login` - Verifica token de autenticación

**Carrito:**
- `GET /api/cart/get` - Obtiene carrito del usuario (requiere autenticación)
- `POST /api/cart/add` - Agrega producto al carrito (requiere autenticación)
- `POST /api/cart/update` - Actualiza cantidad en carrito (requiere autenticación)
- `POST /api/cart/remove` - Elimina producto del carrito (requiere autenticación)

**Productos y Compras:**
- `GET /api/products` - Obtiene productos con stock actual desde Redis
- `POST /api/purchase/checkout` - Procesa compra del carrito completo (requiere autenticación)
- `POST /api/purchase/:productId` - Compra directa (deprecated, usar carrito)

### Diseño

Diseño minimalista con fondo blanco:
- Fondo blanco (#FFFFFF)
- Texto negro (#000000)
- Acentos en azul (#4A90E2)
- Tipografía grande, audaz, en mayúsculas
- Diseño aireado y limpio
- Mensajes claros de "AGOTADO" o stock restante

## 📊 Esquema de Datos

Ver `FIRESTORE_SCHEMA.md` para detalles completos del esquema de Firestore.

## 🔒 Seguridad

- Autenticación con Firebase Authentication
- Validación de tokens JWT en endpoints protegidos
- Validación de stock antes de procesar compra
- Operaciones atómicas en Redis
- Manejo de errores y reversión de transacciones

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

