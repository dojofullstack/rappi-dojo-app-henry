import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useRappi from "../store";


const Header = () => {

     const navigate = useNavigate();

    // const {carrito, profile} =  useRappi();

    const carrito =  useRappi((state) => state.carrito);
    const profile =  useRappi((state) => state.profile);
    const usuario =  useRappi((state) => state.usuario);
    const loginActivo =  useRappi((state) => state.loginActivo);
    const cerrarSesion =  useRappi((state) => state.cerrarSesion);
    const setLoginActivo =  useRappi((state) => state.setLoginActivo);
    const setUsuario =  useRappi((state) => state.setUsuario);
    const agregarProducto =  useRappi((state) => state.agregarProducto);

    console.log(carrito, profile, usuario, loginActivo);
    // console.log(agregarProducto);
    
    // Función para inicializar la sesión desde localStorage
    const initLogin = () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        // const userString = localStorage.getItem('user');
        
        if (accessToken && refreshToken && userString) {
          const userData = JSON.parse(userString);


          // consultar api de usuario /api/user , si el api falla llamar a /api/refresh-token (si este tambien falla navegar login)
          
          // Actualizar estados de Zustand
          setLoginActivo(true);
          setUsuario(userData);
          
          console.log('✅ Sesión restaurada:', userData);
        } else {
          console.log('⚠️ No hay sesión guardada');
        }
      } catch (error) {
        console.error('❌ Error al restaurar sesión:', error);
        // Limpiar localStorage si hay datos corruptos
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    };
    
    const handleLogout = () => {
      cerrarSesion();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    };
    
    // Restaurar sesión al montar el componente
    useEffect(() => {
      initLogin();
    }, []);
    


  return (
    <header>
      
      <div className="navbar bg-base-100 shadow-sm">
  <div className="flex-1 pointer"  onClick={() => navigate("/")}  >
      <img width={"100px"}  src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Rappi_logo.svg/1280px-Rappi_logo.svg.png" alt="" />
  </div>

    {/* <button onClick={() => agregarProducto("manzana")} className="btn btn-primary mr-4">
      Agregar producto
    </button> */}

  <div className="flex-none">
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <div className="indicator">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> </svg>
          <span className="badge badge-sm indicator-item">{carrito.length}</span>
        </div>
      </div>
      <div
        tabIndex={0}
        className="card card-compact dropdown-content bg-base-100 z-1 mt-3 w-52 shadow">
        <div className="card-body">
          <span className="text-lg font-bold">{carrito.length} productos</span>
          <span className="text-info">Subtotal:


            <span style={{fontWeight: 'bold'}}> $
 {
            
              carrito.map(item => item.price).reduce((acumulador, valorActual) => {
                    return acumulador + valorActual;
        }, 0).toFixed(2)
            
            } 

            </span>
            </span>
          <div className="card-actions">
            <button  onClick={() => navigate("/resumen-carrito")} className="btn btn-primary btn-block">Ver Carrito</button>
          </div>
        </div>
      </div>
    </div>

    {loginActivo && usuario && (
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
          <div className="w-10 rounded-full">
            <img
              alt={`${usuario.firstName} ${usuario.lastName}`}
              src={usuario.image || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"} />
          </div>
        </div>
        <ul
          tabIndex="-1"
          className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
          <li className="menu-title">
            <span>{usuario.firstName} {usuario.lastName}</span>
            <span className="text-xs opacity-60">{usuario.email}</span>
          </li>
          <li>
            <a className="justify-between">
              Perfil
              <span className="badge">New</span>
            </a>
          </li>
          <li><a>Configuración</a></li>
          <li><a onClick={handleLogout}>Cerrar sesión</a></li>
        </ul>
      </div>
    )}

    {!loginActivo && (
      <div className="dropdown dropdown-end">
        <button onClick={() => navigate('/login')} className="btn btn-ghost btn-sm">
          Iniciar sesión
        </button>
      </div>
    )}
     </div>
      </div>
    </header>
  );
}

export default Header;