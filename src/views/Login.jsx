import { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import useRappi from '../store';

const Login = () => {
  const navigate = useNavigate();
  const { setLoginActivo, setUsuario } = useRappi();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        'https://dummyjson.com/auth/login',
        {
          username,
          password,
          expiresInMins: 30,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Login exitoso
      console.log('Login exitoso:', response.data);

      // validar el objetio contiene acccesToken y refreshToken
      if (!response.data.accessToken || !response.data.refreshToken) {
        console.error('❌ Error: Faltan tokens en la respuesta');
        setLoading(false);
        return;
      }
      
      // Mostrar notificación de éxito
      toast.success(`¡Bienvenido ${response.data.firstName} ${response.data.lastName}!`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Guardar datos en localStorage (opcional)
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data));

      // Actualizar estados de Zustand
      setLoginActivo(true);
      setUsuario(response.data);

      // navegar a otra página después de login exitoso
      setTimeout(() => {
          navigate("/");
      }, 3000);


    } catch (error) {
      console.error('Error en login:', error);
      
      // Mostrar notificación de error
      toast.error(
        error.response?.data?.message || 'Usuario o contraseña incorrectos',
        {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <ToastContainer />
      <div className="hero bg-base-200 min-h-screen">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold">Login now!</h1>
            <p className="py-6">
              Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
              excepturi exercitationem quasi. In deleniti eaque aut repudiandae
              et a id nisi.
            </p>
            <div className="mt-4 text-sm opacity-70">
              <p>Usuario de prueba: <strong>emilys</strong></p>
              <p>Contraseña: <strong>emilyspass</strong></p>
            </div>
          </div>
          <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
            <form className="card-body" onSubmit={handleSubmit}>
              <fieldset className="fieldset">
                <label className="label">Usuario</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div>
                  <a className="link link-hover">¿Olvidaste tu contraseña?</a>
                </div>
                <button
                  type="submit"
                  className="btn btn-neutral mt-4"
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
