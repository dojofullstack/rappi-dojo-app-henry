/**
 * Módulo CRUD para la colección auditoria_pagos en MongoDB
 * DB: auditoria_pagos
 * Colección: auditoria_pagos
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// ─── Conexión ──────────────────────────────────────────────────────────────────
const MONGO_URI     = process.env.MONGODB_URI;
const DB_NAME       = process.env.MONGODB_DATABASE || 'auditoria_pagos';
const COLLECTION    = 'auditoria_pagos';

let clientInstance = null;

/**
 * Retorna una instancia reutilizable del MongoClient.
 * @returns {Promise<MongoClient>}
 */
async function getClient() {
  if (clientInstance && clientInstance.topology?.isConnected()) {
    return clientInstance;
  }
  clientInstance = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
  });
  await clientInstance.connect();
  return clientInstance;
}

/**
 * Retorna la colección auditoria_pagos.
 * @returns {Promise<import('mongodb').Collection>}
 */
async function getCollection() {
  const client = await getClient();
  return client.db(DB_NAME).collection(COLLECTION);
}

/**
 * Cierra la conexión con MongoDB (útil en entornos de prueba / scripts).
 */
async function cerrarConexion() {
  if (clientInstance) {
    await clientInstance.close();
    clientInstance = null;
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * Crea un nuevo registro de auditoría de pago.
 *
 * @param {Object} datos - Datos del registro de auditoría.
 * @param {string} datos.pedido_id            - ID del pedido relacionado.
 * @param {number} datos.monto                - Monto de la transacción.
 * @param {string} [datos.moneda='PEN']       - Moneda (ej. PEN, USD).
 * @param {string} datos.metodo_pago          - Método de pago (tarjeta, paypal, etc.).
 * @param {string} [datos.estado='pendiente'] - Estado del pago.
 * @param {string} [datos.referencia_pago]    - Referencia externa del pago.
 * @param {Object} [datos.cliente]            - Datos del cliente.
 * @param {string} [datos.descripcion]        - Descripción u observación.
 * @param {string} [datos.ip_cliente]         - IP del cliente que realizó el pago.
 * @param {Object} [datos.metadata]           - Información adicional libre.
 * @returns {Promise<{insertedId: string, registro: Object}>}
 */
async function crearAuditoria(datos) {
  const col = await getCollection();

  const registro = {
    pedido_id:         datos.pedido_id,
    monto:             datos.monto,
    moneda:            datos.moneda            || 'PEN',
    metodo_pago:       datos.metodo_pago,
    estado:            datos.estado            || 'pendiente',
    referencia_pago:   datos.referencia_pago   || null,
    cliente:           datos.cliente           || {},
    descripcion:       datos.descripcion       || '',
    error:             datos.error             || null,
    intentos:          datos.intentos          || 1,
    ip_cliente:        datos.ip_cliente        || null,
    metadata:          datos.metadata          || {},
    fecha_creacion:    new Date(),
    fecha_actualizacion: new Date(),
  };

  const result = await col.insertOne(registro);
  return { insertedId: result.insertedId.toString(), registro };
}

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Obtiene todos los registros de auditoría de pago.
 * Permite filtros opcionales.
 *
 * @param {Object}  [filtro={}]      - Filtros de MongoDB.
 * @param {Object}  [opciones={}]
 * @param {number}  [opciones.limit=100]  - Límite de resultados.
 * @param {number}  [opciones.skip=0]     - Registros a omitir (paginación).
 * @param {Object}  [opciones.sort]       - Ordenamiento (ej. { fecha_creacion: -1 }).
 * @returns {Promise<Object[]>}
 */
async function obtenerAuditorias(filtro = {}, opciones = {}) {
  const col   = await getCollection();
  const limit = opciones.limit ?? 100;
  const skip  = opciones.skip  ?? 0;
  const sort  = opciones.sort  ?? { fecha_creacion: -1 };

  return col.find(filtro).sort(sort).skip(skip).limit(limit).toArray();
}

/**
 * Obtiene un registro de auditoría por su ObjectId.
 *
 * @param {string} id - ObjectId en formato string.
 * @returns {Promise<Object|null>}
 */
async function obtenerAuditoriaPorId(id) {
  const col = await getCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

/**
 * Obtiene todos los registros asociados a un pedido específico.
 *
 * @param {string} pedidoId - ID del pedido.
 * @returns {Promise<Object[]>}
 */
async function obtenerAuditoriasPorPedido(pedidoId) {
  return obtenerAuditorias({ pedido_id: pedidoId }, { sort: { fecha_creacion: -1 } });
}

/**
 * Obtiene registros filtrados por estado.
 *
 * @param {string} estado - Estado del pago (pendiente, aprobado, rechazado, etc.).
 * @returns {Promise<Object[]>}
 */
async function obtenerAuditoriasPorEstado(estado) {
  return obtenerAuditorias({ estado }, { sort: { fecha_creacion: -1 } });
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Actualiza un registro de auditoría de pago por su ObjectId.
 *
 * @param {string} id      - ObjectId en formato string.
 * @param {Object} cambios - Campos a actualizar (sin _id).
 * @returns {Promise<{matchedCount: number, modifiedCount: number}>}
 */
async function actualizarAuditoria(id, cambios) {
  const col = await getCollection();

  // Siempre actualizar la fecha de modificación
  const actualizacion = {
    $set: {
      ...cambios,
      fecha_actualizacion: new Date(),
    },
  };

  const result = await col.updateOne({ _id: new ObjectId(id) }, actualizacion);
  return {
    matchedCount:  result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
}

/**
 * Actualiza el estado de un registro de auditoría.
 *
 * @param {string} id     - ObjectId en formato string.
 * @param {string} estado - Nuevo estado.
 * @param {string} [error] - Mensaje de error si aplica.
 * @returns {Promise<{matchedCount: number, modifiedCount: number}>}
 */
async function actualizarEstadoPago(id, estado, error = null) {
  return actualizarAuditoria(id, { estado, error });
}

/**
 * Incrementa el contador de intentos de un registro.
 *
 * @param {string} id - ObjectId en formato string.
 * @returns {Promise<{matchedCount: number, modifiedCount: number}>}
 */
async function incrementarIntentos(id) {
  const col    = await getCollection();
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $inc: { intentos: 1 },
      $set: { fecha_actualizacion: new Date() },
    }
  );
  return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Elimina un registro de auditoría por su ObjectId.
 *
 * @param {string} id - ObjectId en formato string.
 * @returns {Promise<{deletedCount: number}>}
 */
async function eliminarAuditoria(id) {
  const col    = await getCollection();
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return { deletedCount: result.deletedCount };
}

/**
 * Elimina todos los registros de auditoría asociados a un pedido.
 * ¡Usar con precaución!
 *
 * @param {string} pedidoId - ID del pedido.
 * @returns {Promise<{deletedCount: number}>}
 */
async function eliminarAuditoriasPorPedido(pedidoId) {
  const col    = await getCollection();
  const result = await col.deleteMany({ pedido_id: pedidoId });
  return { deletedCount: result.deletedCount };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  // Conexión
  cerrarConexion,
  // Create
  crearAuditoria,
  // Read
  obtenerAuditorias,
  obtenerAuditoriaPorId,
  obtenerAuditoriasPorPedido,
  obtenerAuditoriasPorEstado,
  // Update
  actualizarAuditoria,
  actualizarEstadoPago,
  incrementarIntentos,
  // Delete
  eliminarAuditoria,
  eliminarAuditoriasPorPedido,
};
