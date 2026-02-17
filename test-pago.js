import Stripe from 'stripe';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Inicializar Stripe con tu clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testProcesarPago() {
  try {
    console.log('🧪 Iniciando prueba de procesamiento de pago...\n');

    // ID del payment method que obtuviste en el test.html
    const paymentMethodId = ""; // Reemplaza con tu PM real
    const amount = 100.00; // Monto en dólares
    const currency = 'usd';
    const description = 'zapatilla nike';

    console.log('📝 Datos del pago:');
    console.log('  - Payment Method ID:', paymentMethodId);
    console.log('  - Monto:', `$${amount} ${currency.toUpperCase()}`);
    console.log('  - Descripción:', description);
    console.log('\n⏳ Creando PaymentIntent...\n');

    // Crear el PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency: currency,
      payment_method: paymentMethodId,
      confirm: true, // Confirmar automáticamente
      description: description,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    console.log('✅ PaymentIntent creado exitosamente!\n');
    console.log('📊 Resultado:');
    console.log('  - ID:', paymentIntent.id);
    console.log('  - Status:', paymentIntent.status);
    console.log('  - Amount:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
    console.log('  - Created:', new Date(paymentIntent.created * 1000).toLocaleString());
    
    if (paymentIntent.charges && paymentIntent.charges.data.length > 0) {
      const charge = paymentIntent.charges.data[0];
      console.log('\n💳 Información del cargo:');
      console.log('  - Charge ID:', charge.id);
      console.log('  - Status:', charge.status);
      console.log('  - Paid:', charge.paid ? '✓' : '✗');
      console.log('  - Receipt URL:', charge.receipt_url || 'N/A');
    }

    console.log('\n🎉 Prueba completada exitosamente!');

  } catch (error) {
    console.error('\n❌ Error procesando pago:');
    console.error('  - Mensaje:', error.message);
    console.error('  - Tipo:', error.type);
    console.error('  - Código:', error.code);
    
    if (error.raw) {
      console.error('  - Detalles adicionales:', error.raw.message);
    }
  }
}

// Ejecutar la prueba
testProcesarPago();
