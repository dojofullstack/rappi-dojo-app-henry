import Stripe from 'stripe';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Genera un Payment Link de Stripe para un producto
 * @param {Object} productoData - Datos del producto
 * @param {string} productoData.nombre - Nombre del producto
 * @param {number} productoData.precio - Precio en dólares (ej: 25.50)
 * @param {string} productoData.descripcion - Descripción del producto (opcional)
 * @param {number} productoData.cantidad - Cantidad del producto (opcional, default: 1)
 * @param {string} productoData.imagen - URL de la imagen del producto (opcional)
 * @param {string} productoData.moneda - Moneda (opcional, default: 'usd')
 * @returns {Promise<Object>} Objeto con el payment link y datos relacionados
 */
export async function generarPaymentLink(productoData) {
  try {
    const {
      nombre,
      precio,
      descripcion = '',
      cantidad = 1,
      imagen = null,
      moneda = 'usd'
    } = productoData;

    // Validar datos requeridos
    if (!nombre) {
      throw new Error('El nombre del producto es requerido');
    }
    if (!precio || precio <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }

    console.log('📦 Generando Payment Link para:', nombre);
    console.log('💰 Precio:', `$${precio} ${moneda.toUpperCase()}`);

    // Paso 1: Crear un producto en Stripe
    const producto = await stripe.products.create({
      name: nombre,
      description: descripcion,
      ...(imagen && { images: [imagen] }),
    });

    console.log('✅ Producto creado:', producto.id);

    // Paso 2: Crear un precio para ese producto
    const price = await stripe.prices.create({
      product: producto.id,
      unit_amount: Math.round(precio * 100), // Convertir a centavos
      currency: moneda,
    });

    console.log('✅ Precio creado:', price.id);

    // Paso 3: Crear el Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: cantidad,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://tu-sitio.com/gracias', // Puedes personalizar esta URL
        },
      },
    });

    console.log('✅ Payment Link generado exitosamente!\n');

    return {
      success: true,
      paymentLink: {
        url: paymentLink.url,
        id: paymentLink.id,
        active: paymentLink.active,
      },
      producto: {
        id: producto.id,
        nombre: producto.name,
        descripcion: producto.description,
      },
      precio: {
        id: price.id,
        monto: precio,
        moneda: moneda,
      },
    };

  } catch (error) {
    console.error('❌ Error generando Payment Link:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Obtener un Payment Link existente
 * @param {string} paymentLinkId - ID del Payment Link
 * @returns {Promise<Object>} Datos del Payment Link
 */
export async function obtenerPaymentLink(paymentLinkId) {
  try {
    const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
    
    return {
      success: true,
      url: paymentLink.url,
      active: paymentLink.active,
      id: paymentLink.id,
    };
  } catch (error) {
    console.error('❌ Error obteniendo Payment Link:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Desactivar un Payment Link
 * @param {string} paymentLinkId - ID del Payment Link
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function desactivarPaymentLink(paymentLinkId) {
  try {
    const paymentLink = await stripe.paymentLinks.update(paymentLinkId, {
      active: false,
    });
    
    console.log('✅ Payment Link desactivado');
    return {
      success: true,
      id: paymentLink.id,
      active: paymentLink.active,
    };
  } catch (error) {
    console.error('❌ Error desactivando Payment Link:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Ejemplo de uso (solo si se ejecuta directamente)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Ejecutando prueba de generación de Payment Link...\n');
  
  const productoEjemplo = {
    nombre: 'Pizza Hawaiana',
    precio: 15.99,
    descripcion: 'Pizza con jamón y piña, tamaño mediano',
    cantidad: 2,
    moneda: 'usd',
  };

  const resultado = await generarPaymentLink(productoEjemplo);

  if (resultado.success) {
    console.log('🔗 URL del Payment Link:');
    console.log(resultado.paymentLink.url);
    console.log('\n📋 Datos completos:');
    console.log(JSON.stringify(resultado, null, 2));
  } else {
    console.log('Error:', resultado.error);
  }
}
