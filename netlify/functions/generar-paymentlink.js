import Stripe from 'stripe';

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handler = async (event) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Manejar preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  try {
    const {
      nombre,
      precio,
      descripcion = '',
      cantidad = 1,
      imagen = null,
      moneda = 'usd',
      urlExito = null,
    } = JSON.parse(event.body);

    // Validar datos requeridos
    if (!nombre || !precio || precio <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Nombre y precio son requeridos. El precio debe ser mayor a 0.',
        }),
      };
    }

    // Crear producto en Stripe
    const producto = await stripe.products.create({
      name: nombre,
      description: descripcion,
      ...(imagen && { images: [imagen] }),
    });

    // Crear precio para el producto
    const price = await stripe.prices.create({
      product: producto.id,
      unit_amount: Math.round(precio * 100), // Convertir a centavos
      currency: moneda,
    });

    // Configurar after_completion
    const afterCompletion = {
      type: 'redirect',
      redirect: {
        url: urlExito || `${event.headers.origin || 'https://tu-sitio.com'}/gracias`,
      },
    };

    // Crear Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: cantidad,
        },
      ],
      after_completion: afterCompletion,
    });

    // Responder con éxito
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        paymentLink: {
          url: paymentLink.url,
          id: paymentLink.id,
          active: paymentLink.active,
        },
        producto: {
          id: producto.id,
          nombre: producto.name,
        },
        precio: {
          id: price.id,
          monto: precio,
          moneda: moneda,
          total: precio * cantidad,
        },
      }),
    };

  } catch (error) {
    console.error('Error generando Payment Link:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
