import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const PedidoCompletedView = () => {
  const navigate = useNavigate();
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    // Generar ID de transacción random al montar el componente
    const randomId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setTransactionId(randomId);
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full text-center p-8">
          
          {/* Ícono de éxito */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Mensaje principal */}
          <h1 className="text-3xl font-bold text-success mb-2">¡Gracias por tu pedido!</h1>
          <p className="text-base-content opacity-70 mb-6">
            Tu orden ha sido confirmada y está siendo procesada.
          </p>

          {/* ID de transacción */}
          <div className="bg-base-200 rounded-lg p-4 mb-8">
            <p className="text-sm opacity-60 mb-1">ID de transacción</p>
            <p className="font-mono font-bold text-lg tracking-wide">{transactionId}</p>
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-3">
            <button
              className="btn btn-primary btn-block"
              onClick={() => navigate('/resumen-carrito')}
            >
              Ver resumen del pedido
            </button>
            <button
              className="btn btn-ghost btn-block"
              onClick={() => navigate('/')}
            >
              Volver al inicio
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default PedidoCompletedView;
