import { useState, useEffect } from 'react';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const API_BASE_URL = 'http://localhost:3000/api';

function CartPage({ user, idToken, onCheckoutSuccess, onBack }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cart/get`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      setError('Error al cargar el carrito');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      await axios.post(
        `${API_BASE_URL}/cart/update`,
        { productId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      fetchCart();
    } catch (err) {
      alert('Error al actualizar cantidad');
      console.error(err);
    }
  };

  const removeItem = async (productId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/cart/remove`,
        { productId },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      fetchCart();
    } catch (err) {
      alert('Error al eliminar producto');
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/purchase/checkout`,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      if (response.data.success) {
        if (response.data.failedItems && response.data.failedItems.length > 0) {
          alert(`Algunos productos no pudieron ser comprados:\n${response.data.failedItems.map(item => `- ${item.reason}`).join('\n')}`);
        } else {
          alert('✅ Compra completada exitosamente!');
          onCheckoutSuccess();
        }
        fetchCart();
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Error al procesar la compra';
      alert(`❌ ${message}`);
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">CARGANDO CARRITO...</div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="cart-title">MI CARRITO</h1>
        <button className="logout-button" onClick={onBack}>
          VOLVER
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {cart.items.length === 0 ? (
        <div className="empty-state">
          <p>TU CARRITO ESTÁ VACÍO</p>
        </div>
      ) : (
        <>
          <div>
            {cart.items.map((item) => (
              <div key={item.productId} className="cart-item">
                {item.product?.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="cart-item-image"
                  />
                ) : (
                  <div className="cart-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    SIN IMAGEN
                  </div>
                )}

                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.product?.name?.toUpperCase() || 'PRODUCTO'}</h3>
                  <div className="cart-item-price">
                    ${item.product?.price?.toLocaleString() || '0'} c/u
                  </div>
                  
                  {item.product?.isSoldOut && (
                    <div style={{ color: '#CC0000', fontWeight: 700, marginTop: '0.5rem' }}>
                      AGOTADO
                    </div>
                  )}

                  <div className="cart-item-quantity">
                    <button
                      className="quantity-button"
                      onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="quantity-input"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        updateQuantity(item.productId, Math.max(1, val));
                      }}
                      min="1"
                    />
                    <button
                      className="quantity-button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.product?.isSoldOut}
                    >
                      +
                    </button>
                    <button
                      className="remove-item-button"
                      onClick={() => removeItem(item.productId)}
                    >
                      ELIMINAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              TOTAL: ${cart.total.toLocaleString()}
            </div>
            <button
              className="checkout-button"
              onClick={handleCheckout}
              disabled={processing || cart.items.some(item => item.product?.isSoldOut)}
            >
              {processing ? 'PROCESANDO...' : 'FINALIZAR COMPRA'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;

