import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth/web-extension';
import { auth } from './firebase';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import CartIcon from './components/CartIcon';
import CartPage from './components/CartPage';
import './App.css';

const API_BASE_URL = 'http://localhost:3000/api';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'
  const [showCart, setShowCart] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });
          fetchCartCount(token);
        } catch (err) {
          console.error('Error obteniendo token:', err);
        }
      } else {
        setUser(null);
        setIdToken(null);
        setCartItemCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchProducts();
    // Actualizar stock cada 5 segundos
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      setProducts(response.data.products || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cart/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCartItemCount(response.data.cart.items.length);
      }
    } catch (err) {
      console.error('Error obteniendo carrito:', err);
    }
  };

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    setIdToken(userData.idToken);
    setShowAuth(false);
    fetchCartCount(userData.idToken);
  };

  const handleRegisterSuccess = async (userData) => {
    setUser(userData);
    setIdToken(userData.idToken);
    setShowAuth(false);
    fetchCartCount(userData.idToken);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIdToken(null);
      setCartItemCount(0);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user || !idToken) {
      setShowAuth(true);
      setAuthMode('login');
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/cart/add`,
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      alert('✅ Producto agregado al carrito');
      fetchCartCount(idToken);
    } catch (err) {
      const message = err.response?.data?.error || 'Error al agregar al carrito';
      alert(`❌ ${message}`);
      console.error(err);
    }
  };

  const handleCheckoutSuccess = () => {
    setCartItemCount(0);
    fetchProducts(); // Actualizar stock
  };

  if (showCart && user) {
    return (
      <CartPage
        user={user}
        idToken={idToken}
        onCheckoutSuccess={handleCheckoutSuccess}
        onBack={() => setShowCart(false)}
      />
    );
  }

  if (showAuth) {
    return (
      <div className="app">
        {authMode === 'login' ? (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <Register
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="logout-button" onClick={() => setShowAuth(false)}>
            CANCELAR
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">CARGANDO...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">DROPS STORE</h1>
        <div className="header-actions">
          {user ? (
            <div className="user-menu">
              <span className="user-email">{user.email}</span>
              <CartIcon
                itemCount={cartItemCount}
                onClick={() => setShowCart(true)}
              />
              <button className="logout-button" onClick={handleLogout}>
                SALIR
              </button>
            </div>
          ) : (
            <button className="login-button" onClick={() => { setShowAuth(true); setAuthMode('login'); }}>
              INICIAR SESIÓN
            </button>
          )}
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <main className="products-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            isAuthenticated={!!user}
          />
        ))}
      </main>

      {products.length === 0 && !loading && (
        <div className="empty-state">
          <p>NO HAY PRODUCTOS DISPONIBLES</p>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart, isAuthenticated }) {
  const isSoldOut = product.isSoldOut || product.stock <= 0;

  return (
    <div className={`product-card ${isSoldOut ? 'sold-out' : ''}`}>
      <div className="product-image-container">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="product-image" />
        ) : (
          <div className="product-image-placeholder">SIN IMAGEN</div>
        )}
        {isSoldOut && (
          <div className="sold-out-overlay">
            <span className="sold-out-text">AGOTADO</span>
          </div>
        )}
      </div>

      <div className="product-info">
        <h2 className="product-name">{product.name?.toUpperCase() || 'SIN NOMBRE'}</h2>
        <p className="product-description">{product.description || ''}</p>
        
        <div className="product-footer">
          <div className="product-price">${product.price?.toLocaleString() || '0'}</div>
          
          {!isSoldOut && (
            <div className="product-stock">
              {product.stock} DISPONIBLES
            </div>
          )}

          <button
            className={`add-to-cart-button ${isSoldOut ? 'disabled' : ''}`}
            onClick={() => !isSoldOut && onAddToCart(product.id)}
            disabled={isSoldOut}
          >
            {isSoldOut ? 'AGOTADO' : isAuthenticated ? 'AGREGAR AL CARRITO' : 'INICIA SESIÓN PARA COMPRAR'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
