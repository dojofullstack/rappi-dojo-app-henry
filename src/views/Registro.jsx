import { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import useRappi from '../store';

const Registro = () => {
  const navigate = useNavigate();
  const { setLoginActivo, setUsuario } = useRappi();
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== password2) {
      toast.error('Las contraseñas no coinciden', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://api2.dojofullstack.com/api/v1/dummyapi/auth/register/',
        {
          username,
          first_name: firstName,
          email,
          password,
          password2,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Registro exitoso:', response.data);

      if (!response.data.access || !response.data.refresh) {
        console.error('❌ Error: Faltan tokens en la respuesta');
        setLoading(false);
        return;
      }

      toast.success(`¡Cuenta creada! Bienvenido ${response.data.user.firstName}!`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setLoginActivo(true);
      setUsuario(response.data.user);

      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error) {
      console.error('❌ Error en registro:', error);

      const errData = error.response?.data;
      const mensaje =
        errData?.username?.[0] ||
        errData?.email?.[0] ||
        errData?.password?.[0] ||
        errData?.message ||
        'Error al crear la cuenta';

      toast.error(mensaje, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
            <h1 className="text-5xl font-bold">¡Regístrate!</h1>
            <p className="py-6">
              Crea tu cuenta para disfrutar de todos los restaurantes y productos
              disponibles en nuestra plataforma.
            </p>
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
                <label className="label">Nombre completo</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Tu nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label className="label">Contraseña</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label className="label">Confirmar contraseña</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repite la contraseña"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-neutral mt-4"
                  disabled={loading}
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
                <p className="text-sm text-center mt-2">
                  ¿Ya tienes cuenta?{' '}
                  <a className="link link-primary" onClick={() => navigate('/login')}>
                    Inicia sesión
                  </a>
                </p>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;
