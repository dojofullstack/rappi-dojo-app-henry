/**
 * Test CRUD para la colección auditoria_pagos en MongoDB
 *
 * Ejecutar con:
 *   node netlify/functions/test_mongodb.js
 */

import {
  crearAuditoria,
  obtenerAuditorias,
  obtenerAuditoriaPorId,
  obtenerAuditoriasPorPedido,
  obtenerAuditoriasPorEstado,
  actualizarAuditoria,
  actualizarEstadoPago,
  incrementarIntentos,
  eliminarAuditoria,
  eliminarAuditoriasPorPedido,
  cerrarConexion,
} from './auditoria_pagos.js';

// ─── Utilidades de consola ─────────────────────────────────────────────────────

const OK    = '✅';
const ERROR = '❌';
const SEP   = '─'.repeat(60);

function titulo(texto) {
  console.log(`\n${SEP}`);
  console.log(`  ${texto}`);
  console.log(SEP);
}

function log(label, data) {
  console.log(`\n${label}:`);
  console.log(JSON.stringify(data, null, 2));
}

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const registrosEjemplo = [
  {
    pedido_id:       'PED-001',
    monto:           150.00,
    moneda:          'PEN',
    metodo_pago:     'tarjeta',
    estado:          'aprobado',
    referencia_pago: 'ch_3Ptest001',
    cliente: {
      nombre: 'Juan Pérez',
      email:  'juan.perez@example.com',
      dni:    '12345678',
    },
    descripcion: 'Pago pedido menú ejecutivo',
    intentos:    1,
    ip_cliente:  '192.168.1.100',
    metadata: {
      plataforma: 'web',
      navegador:  'Chrome',
    },
  },
  {
    pedido_id:       'PED-002',
    monto:           85.50,
    moneda:          'PEN',
    metodo_pago:     'paypal',
    estado:          'pendiente',
    referencia_pago: 'PAY-ABC123',
    cliente: {
      nombre: 'María García',
      email:  'maria.garcia@example.com',
      dni:    '87654321',
    },
    descripcion: 'Pago via PayPal',
    intentos:    1,
    ip_cliente:  '10.0.0.5',
    metadata: {
      plataforma: 'móvil',
      os:         'Android',
    },
  },
  {
    pedido_id:       'PED-003',
    monto:           200.00,
    moneda:          'USD',
    metodo_pago:     'tarjeta',
    estado:          'rechazado',
    referencia_pago: null,
    cliente: {
      nombre: 'Carlos López',
      email:  'carlos.lopez@example.com',
    },
    descripcion: 'Pago rechazado por fondos insuficientes',
    error:       'insufficient_funds',
    intentos:    3,
    ip_cliente:  '172.16.0.1',
    metadata:    {},
  },
];

// ─── Suite de tests ────────────────────────────────────────────────────────────

async function testCrear() {
  titulo('CREATE — Insertar 3 registros de auditoría');
  const ids = [];

  for (const datos of registrosEjemplo) {
    const resultado = await crearAuditoria(datos);
    console.log(`${OK} Insertado | pedido_id=${datos.pedido_id} | _id=${resultado.insertedId}`);
    ids.push(resultado.insertedId);
  }

  return ids;
}

async function testLeerTodos() {
  titulo('READ — Obtener todos los registros');
  const registros = await obtenerAuditorias();
  console.log(`${OK} Total registros encontrados: ${registros.length}`);
  registros.forEach((r) => {
    console.log(`   _id=${r._id} | pedido=${r.pedido_id} | estado=${r.estado} | monto=${r.moneda} ${r.monto}`);
  });
  return registros;
}

async function testLeerPorId(id) {
  titulo(`READ — Obtener registro por _id: ${id}`);
  const registro = await obtenerAuditoriaPorId(id);
  if (registro) {
    log(`${OK} Registro encontrado`, registro);
  } else {
    console.log(`${ERROR} No se encontró el registro con _id=${id}`);
  }
  return registro;
}

async function testLeerPorPedido(pedidoId) {
  titulo(`READ — Obtener auditorías por pedido_id: ${pedidoId}`);
  const registros = await obtenerAuditoriasPorPedido(pedidoId);
  console.log(`${OK} Registros encontrados: ${registros.length}`);
  registros.forEach((r) => console.log(`   _id=${r._id} | estado=${r.estado}`));
}

async function testLeerPorEstado(estado) {
  titulo(`READ — Obtener auditorías con estado: "${estado}"`);
  const registros = await obtenerAuditoriasPorEstado(estado);
  console.log(`${OK} Registros con estado "${estado}": ${registros.length}`);
  registros.forEach((r) => console.log(`   _id=${r._id} | pedido=${r.pedido_id}`));
}

async function testLeerConPaginacion() {
  titulo('READ — Paginación (limit=2, skip=0)');
  const pagina1 = await obtenerAuditorias({}, { limit: 2, skip: 0 });
  console.log(`${OK} Página 1 (2 registros): ${pagina1.length} obtenidos`);

  const pagina2 = await obtenerAuditorias({}, { limit: 2, skip: 2 });
  console.log(`${OK} Página 2 (restantes): ${pagina2.length} obtenidos`);
}

async function testActualizarCampos(id) {
  titulo(`UPDATE — Actualizar descripción y metadata del registro ${id}`);
  const resultado = await actualizarAuditoria(id, {
    descripcion: 'Pago ACTUALIZADO — cobro confirmado por banco',
    metadata:    { plataforma: 'web', version: '2.0', revisado: true },
  });
  console.log(`${OK} matchedCount=${resultado.matchedCount} | modifiedCount=${resultado.modifiedCount}`);

  // Verificar cambio
  const actualizado = await obtenerAuditoriaPorId(id);
  log('Registro tras actualización', {
    descripcion:         actualizado.descripcion,
    metadata:            actualizado.metadata,
    fecha_actualizacion: actualizado.fecha_actualizacion,
  });
}

async function testActualizarEstado(id) {
  titulo(`UPDATE — Cambiar estado a "aprobado" del registro ${id}`);
  const resultado = await actualizarEstadoPago(id, 'aprobado');
  console.log(`${OK} matchedCount=${resultado.matchedCount} | modifiedCount=${resultado.modifiedCount}`);

  const actualizado = await obtenerAuditoriaPorId(id);
  console.log(`   Estado nuevo: ${actualizado.estado}`);
}

async function testIncrementarIntentos(id) {
  titulo(`UPDATE — Incrementar intentos del registro ${id}`);
  const antes    = await obtenerAuditoriaPorId(id);
  const resultado = await incrementarIntentos(id);
  const despues  = await obtenerAuditoriaPorId(id);

  console.log(`${OK} Intentos antes=${antes.intentos} → después=${despues.intentos}`);
  console.log(`   matchedCount=${resultado.matchedCount} | modifiedCount=${resultado.modifiedCount}`);
}

async function testEliminarUno(id) {
  titulo(`DELETE — Eliminar registro con _id: ${id}`);
  const resultado = await eliminarAuditoria(id);
  console.log(`${OK} deletedCount=${resultado.deletedCount}`);

  // Verificar que ya no existe
  const verificacion = await obtenerAuditoriaPorId(id);
  if (!verificacion) {
    console.log(`${OK} Confirmado: el registro ya no existe en la colección`);
  } else {
    console.log(`${ERROR} El registro sigue existiendo — revisar`);
  }
}

async function testEliminarPorPedido(pedidoId) {
  titulo(`DELETE — Eliminar todos los registros del pedido: ${pedidoId}`);
  const resultado = await eliminarAuditoriasPorPedido(pedidoId);
  console.log(`${OK} deletedCount=${resultado.deletedCount}`);
}

// ─── Runner principal ──────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n🚀  INICIO DE TESTS — auditoria_pagos (MongoDB)');
  console.log(`    Host: ${process.env.MONGODB_HOST}`);
  console.log(`    DB  : ${process.env.MONGODB_DATABASE}`);

  try {
    // 1. CREATE
    const ids = await testCrear();
    const [id1, id2, id3] = ids;

    // 2. READ
    await testLeerTodos();
    await testLeerPorId(id1);
    await testLeerPorPedido('PED-001');
    await testLeerPorEstado('pendiente');
    await testLeerConPaginacion();

    // 3. UPDATE
    await testActualizarCampos(id2);
    await testActualizarEstado(id3);
    await testIncrementarIntentos(id3);

    // // 4. DELETE
    // await testEliminarUno(id1);
    // await testEliminarPorPedido('PED-002');

    // // Estado final
    // titulo('READ — Estado final de la colección tras los tests');
    // const restantes = await obtenerAuditorias();
    // console.log(`${OK} Registros restantes en la colección: ${restantes.length}`);
    // restantes.forEach((r) => {
    //   console.log(`   _id=${r._id} | pedido=${r.pedido_id} | estado=${r.estado}`);
    // });

    console.log(`\n${OK} TODOS LOS TESTS COMPLETADOS\n`);
  } catch (err) {
    console.error(`\n${ERROR} ERROR DURANTE LOS TESTS:`);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await cerrarConexion();
    console.log('🔌  Conexión MongoDB cerrada.\n');
  }
}

runTests();
