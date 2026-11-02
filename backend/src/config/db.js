import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Production-ready MySQL 8.0 Connection Pool
 * Built with mysql2/promise for high-concurrency non-blocking queries
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ccms_db',
  waitForConnections: true,
  connectionLimit: 15,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4'
});

/**
 * Execute parameterized query safely using the connection pool
 * @param {string} sql - Parameterized SQL statement with '?' placeholders
 * @param {Array} params - Array of parameters
 * @returns {Promise<[Array, Array]>} - [rows, fields]
 */
export async function query(sql, params = []) {
  return pool.query(sql, params);
}

/**
 * Run a multi-step operation inside a managed ACID transaction
 * Automatically rolls back on any thrown exception and commits on success
 * @param {Function} callback - Async function receiving the active transaction connection
 * @returns {Promise<any>} - Value returned by the callback
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Verify database reachability on server startup
 */
export async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT VERSION() AS version, DATABASE() AS database_name');
    console.log(`[MySQL 8] Connected successfully to "${rows[0].database_name}" (Server version: ${rows[0].version})`);
    return true;
  } catch (error) {
    console.error('[MySQL 8] Connection Error:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('[MySQL 8] HINT: Database does not exist yet. Please execute backend/database/schema.mysql.sql first.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('[MySQL 8] HINT: Check your DB_USER and DB_PASSWORD in backend/.env.');
    }
    return false;
  }
}

export default pool;
