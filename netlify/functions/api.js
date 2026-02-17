import express from 'express';
import serverless from 'serverless-http';
import Stripe from 'stripe';
import { db } from '../../src/db/index.js';
import { pedidos, pedidoItems } from '../../src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

// Endpoint para crear un nuevo pedido
app.post('/api/pedidos', async (req, res) => {
  // Log para debugging
  console.log('POST /api/pedidos - Body recibido:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      datosCliente, 
      metodoPago, 
      metodoEnvio, 
      subtotal, 
      costoEnvio, 
      impuesto, 
      total, 
      carrito,
      paymentMethodId
    } = req.body;

    // Validar que vengan los datos requeridos
    if (!datosCliente || !metodoPago || !metodoEnvio || !carrito) {
      return res.status(400).json({ 
        status: false, 
        error: 'Faltan datos requeridos' 
      });
    }

    // Validar que el carrito no esté vacío
    if (!Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ 
        status: false, 
        error: 'El carrito está vacío' 
      });
    }

    // Validar paymentMethodId si el método de pago es tarjeta
    if (metodoPago === 'tarjeta' && !paymentMethodId) {
      return res.status(400).json({ 
        status: false, 
        error: 'Se requiere paymentMethodId para pagos con tarjeta' 
      });
    }

    // Convertir valores numéricos a formato decimal correcto
    const formatearDecimal = (valor) => {
      const num = parseFloat(valor) || 0;
      return num.toFixed(2);
    };

    let paymentIntentId = null;
    let paymentStatus = 'pending';

    // PASO 1: Procesar el pago con Stripe (si es pago con tarjeta)
    if (metodoPago === 'tarjeta' && paymentMethodId) {
      console.log('💳 Procesando pago con Stripe...');
      console.log('  - Payment Method ID:', paymentMethodId);
      console.log('  - Monto:', `$${total}`);

      try {
        // Crear el PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(total) * 100), // Convertir a centavos
          currency: 'usd',
          payment_method: paymentMethodId,
          confirm: true, // Confirmar automáticamente
          description: `Pedido de ${datosCliente.nombre} - ${carrito.length} items`,
          receipt_email: datosCliente.email,
          metadata: {
            cliente_nombre: datosCliente.nombre,
            cliente_email: datosCliente.email,
            numero_items: carrito.length.toString(),
          },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
        });

        paymentIntentId = paymentIntent.id;
        paymentStatus = paymentIntent.status;

        console.log('✅ Pago procesado exitosamente');
        console.log('  - PaymentIntent ID:', paymentIntentId);
        console.log('  - Status:', paymentStatus);

        // Si el pago no fue exitoso, retornar error
        if (paymentStatus !== 'succeeded') {
          return res.status(400).json({
            status: false,
            error: 'El pago no pudo ser procesado',
            paymentStatus: paymentStatus,
          });
        }

      } catch (stripeError) {
        console.error('❌ Error procesando pago con Stripe:', stripeError.message);
        return res.status(400).json({
          status: false,
          error: `Error al procesar el pago: ${stripeError.message}`,
          stripeErrorType: stripeError.type,
          stripeErrorCode: stripeError.code,
        });
      }
    }

    // PASO 2: Insertar el pedido principal usando Drizzle ORM
    const [nuevoPedido] = await db.insert(pedidos).values({
      nombre: datosCliente.nombre,
      email: datosCliente.email,
      telefono: datosCliente.telefono || null,
      direccion: datosCliente.direccion,
      apartamento: datosCliente.apartamento || null,
      ciudad: datosCliente.ciudad,
      estado: datosCliente.estado,
      codigoPostal: datosCliente.codigoPostal,
      metodoPago: metodoPago,
      metodoEnvio: metodoEnvio,
      subtotal: formatearDecimal(subtotal),
      costoEnvio: formatearDecimal(costoEnvio),
      impuesto: formatearDecimal(impuesto),
      total: formatearDecimal(total),
      paymentIntentId: paymentIntentId, // ID del pago de Stripe
      paymentStatus: paymentStatus, // Estado del pago
    }).returning({ id: pedidos.id });
    
    const pedidoId = nuevoPedido.id;
    console.log('Pedido creado con ID:', pedidoId);

    // Paso 2: Insertar los items del carrito
    const itemsParaInsertar = carrito.map(item => ({
      pedidoId: pedidoId,
      nombreProducto: item.name || item.title || 'Producto sin nombre',
      precio: formatearDecimal(item.price || 0),
      cantidad: parseInt(item.cantidad || item.quantity || 1),
    }));

    await db.insert(pedidoItems).values(itemsParaInsertar);

    console.log(`${carrito.length} items insertados para pedido ${pedidoId}`);

    // Respuesta exitosa
    res.status(201).json({ 
      status: true, 
      pedidoId: pedidoId,
      mensaje: 'Pedido creado exitosamente',
      paymentIntent: paymentIntentId ? {
        id: paymentIntentId,
        status: paymentStatus,
      } : null,
      linkpayment: `https://rappi-dojo-app.netlify.app/pedido-confirmado/${pedidoId}`
    });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    console.error('Stack trace:', error.stack);
    console.error('Datos recibidos:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ 
      status: false, 
      error: error.message || 'Error al procesar el pedido' 
    });
  }
});

// Endpoint opcional para listar todos los pedidos (debe ir ANTES del endpoint con :id)
app.get('/api/pedidos', async (req, res) => {
  try {
    // Obtener todos los pedidos con sus items usando Drizzle ORM
    const todosPedidos = await db.query.pedidos.findMany({
      with: {
        items: true,
      },
      orderBy: [desc(pedidos.createdAt)],
    });

    res.json({ 
      status: true, 
      pedidos: todosPedidos 
    });

  } catch (error) {
    console.error('Error al listar pedidos:', error);
    res.status(500).json({ 
      status: false, 
      error: error.message 
    });
  }
});

// Endpoint opcional para obtener un pedido por ID (debe ir DESPUÉS del endpoint general)
// app.get('/api/pedidos/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const pedidoId = parseInt(id);
    
//     // Buscar el pedido con sus items usando Drizzle ORM
//     const pedido = await db.query.pedidos.findFirst({
//       where: eq(pedidos.id, pedidoId),
//       with: {
//         items: true,
//       },
//     });
    
//     if (!pedido) {
//       return res.status(404).json({ 
//         status: false, 
//         error: 'Pedido no encontrado' 
//       });
//     }
    
//     res.json({ 
//       status: true, 
//       pedido: pedido
//     });

//   } catch (error) {
//     console.error('Error al obtener pedido:', error);
//     res.status(500).json({ 
//       status: false, 
//       error: error.message 
//     });
//   }
// });

// Manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    status: false, 
    error: 'Endpoint no encontrado' 
  });
});

// Exportar el handler para Netlify Functions
export const handler = serverless(app);
