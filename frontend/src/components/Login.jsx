import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Verificar con backend
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        idToken,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        onLoginSuccess({
          ...response.data.user,
          idToken,
        });
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.response?.data?.error || err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">INICIAR SESIÓN</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <input
          type="email"
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          className="auth-input"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'CARGANDO...' : 'ENTRAR'}
        </button>
      </form>
      
      <div className="auth-link">
        ¿No tienes cuenta?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>
          Regístrate
        </a>
      </div>
    </div>
  );
}

export default Login;

