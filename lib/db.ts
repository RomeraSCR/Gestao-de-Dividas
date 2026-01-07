import mysql from "mysql2/promise"
import { initializeDatabase } from "./init-db"

let pool: mysql.Pool | null = null
let initPromise: Promise<void> | null = null

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const dbConfig = {
      host: process.env.DB_HOST || "31.97.160.146",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "dividascasal",
      password: process.env.DB_PASSWORD || "4mFay8WY48i5NKMm",
      database: process.env.DB_NAME || "dividascasal",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      dateStrings: true, // Retorna datas como strings ao invés de objetos Date
    }

    pool = mysql.createPool(dbConfig)

    // Inicializar tabelas na primeira conexão
    if (!initPromise) {
      initPromise = initializeDatabase()
    }
  }

  return pool
}

// Função auxiliar para garantir que o banco está inicializado antes de usar
export async function ensureInitialized() {
  getDbPool() // Cria o pool se não existir
  if (initPromise) {
    await initPromise
  }
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  await ensureInitialized()
  const connection = await getDbPool().getConnection()
  try {
    const [rows] = await connection.execute(sql, params)
    return rows as T[]
  } finally {
    connection.release()
  }
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(sql, params)
  return results[0] || null
}
