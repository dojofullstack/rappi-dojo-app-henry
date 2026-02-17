import { generarPaymentLink, obtenerPaymentLink, desactivarPaymentLink } from './generate_paymentlink.js';

console.log('🧪 Iniciando pruebas del módulo de Payment Links\n');
console.log('='.repeat(50));

// Test 1: Generar un Payment Link simple
async function test1() {
  console.log('\n📝 Test 1: Generar Payment Link simple');
  console.log('-'.repeat(50));
  
  const resultado = await generarPaymentLink({
    nombre: 'Hamburguesa Clásica',
    precio: 12.99,
    descripcion: 'Hamburguesa con queso, lechuga y tomate',
  });

  if (resultado.success) {
    console.log('✅ Test 1 exitoso!');
    console.log('🔗 Link:', resultado.paymentLink.url);
    return resultado.paymentLink.id;
  } else {
    console.log('❌ Test 1 falló:', resultado.error);
    return null;
  }
}

// Test 2: Generar Payment Link con múltiples cantidades
async function test2() {
  console.log('\n📝 Test 2: Payment Link con cantidad múltiple');
  console.log('-'.repeat(50));
  
  const resultado = await generarPaymentLink({
    nombre: 'Coca-Cola 355ml',
    precio: 2.50,
    descripcion: 'Bebida gaseosa',
    cantidad: 3,
  });

  if (resultado.success) {
    console.log('✅ Test 2 exitoso!');
    console.log('🔗 Link:', resultado.paymentLink.url);
    console.log('📦 Cantidad:', 3);
    console.log('💰 Total:', `$${(2.50 * 3).toFixed(2)}`);
  } else {
    console.log('❌ Test 2 falló:', resultado.error);
  }
}

// Test 3: Obtener un Payment Link existente
async function test3(paymentLinkId) {
  if (!paymentLinkId) {
    console.log('\n⏭️  Test 3 omitido (no hay Payment Link para consultar)');
    return;
  }

  console.log('\n📝 Test 3: Obtener Payment Link existente');
  console.log('-'.repeat(50));
  
  const resultado = await obtenerPaymentLink(paymentLinkId);

  if (resultado.success) {
    console.log('✅ Test 3 exitoso!');
    console.log('🔗 Link recuperado:', resultado.url);
    console.log('📊 Estado activo:', resultado.active);
  } else {
    console.log('❌ Test 3 falló:', resultado.error);
  }
}

// Test 4: Generar Payment Link con todos los parámetros
async function test4() {
  console.log('\n📝 Test 4: Payment Link completo con imagen');
  console.log('-'.repeat(50));
  
  const resultado = await generarPaymentLink({
    nombre: 'Pack Familiar de Tacos',
    precio: 29.99,
    descripcion: 'Pack de 12 tacos variados con guacamole y salsas',
    cantidad: 1,
    imagen: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
    moneda: 'usd',
  });

  if (resultado.success) {
    console.log('✅ Test 4 exitoso!');
    console.log('🔗 Link:', resultado.paymentLink.url);
    console.log('🖼️  Con imagen incluida');
  } else {
    console.log('❌ Test 4 falló:', resultado.error);
  }
}

// Ejecutar todos los tests
async function ejecutarTests() {
  try {
    const paymentLinkId = await test1();
    // await test2();
    // await test3(paymentLinkId);
    // await test4();

    // console.log('\n' + '='.repeat(50));
    // console.log('🎉 Todos los tests completados!');
    // console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error ejecutando tests:', error.message);
  }
}

ejecutarTests();
