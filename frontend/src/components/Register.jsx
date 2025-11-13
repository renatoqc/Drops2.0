import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Registrar en backend (que crea el usuario en Firebase Auth)
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        displayName: displayName || email.split('@')[0],
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (registerResponse.data.success) {
        // Iniciar sesión con el custom token
        const userCredential = await signInWithCustomToken(auth, registerResponse.data.customToken);
        const idToken = await userCredential.user.getIdToken();

        // Verificar con backend
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          idToken,
        });

        if (loginResponse.data.success) {
          onRegisterSuccess({
            ...loginResponse.data.user,
            idToken,
          });
        }
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError(err.response?.data?.error || err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">REGISTRARSE</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <input
          type="text"
          className="auth-input"
          placeholder="Nombre (opcional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        
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
          minLength={6}
        />
        
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'REGISTRANDO...' : 'REGISTRARSE'}
        </button>
      </form>
      
      <div className="auth-link">
        ¿Ya tienes cuenta?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
          Inicia sesión
        </a>
      </div>
    </div>
  );
}

export default Register;

