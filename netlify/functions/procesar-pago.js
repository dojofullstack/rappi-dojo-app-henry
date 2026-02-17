import Stripe from 'stripe';

// Inicializar Stripe con tu clave secreta
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
    const { paymentMethodId, amount, currency = 'usd', description } = JSON.parse(event.body);

    // Validar datos requeridos
    if (!paymentMethodId || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'paymentMethodId y amount son requeridos' 
        }),
      };
    }

    // Crear el PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency: currency,
      payment_method: paymentMethodId,
      confirm: true, // Confirmar automáticamente
      description: description || 'Pago Rappi Dojo',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    // Responder con éxito
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          client_secret: paymentIntent.client_secret,
        },
      }),
    };

  } catch (error) {
    console.error('Error procesando pago:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        type: error.type,
        code: error.code,
      }),
    };
  }
};
