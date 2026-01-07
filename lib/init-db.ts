import { getDbPool } from "./db"

let initialized = false

export async function initializeDatabase() {
  if (initialized) {
    return
  }

  try {
    const pool = getDbPool()
    const connection = await pool.getConnection()

    try {
      // Criar tabela de usuários
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          nome VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      // Criar tabela de perfis
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS profiles (
          id VARCHAR(36) PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_profiles_id (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      // Criar tabela de dívidas
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS dividas (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          autor VARCHAR(255) NOT NULL,
          produto VARCHAR(255) NOT NULL,
          loja VARCHAR(255) NOT NULL,
          data_fatura DATE NOT NULL,
          total_parcelas INT NOT NULL CHECK (total_parcelas > 0),
          parcelas_pagas INT NOT NULL DEFAULT 0 CHECK (parcelas_pagas >= 0),
          valor_parcela DECIMAL(10, 2) NOT NULL CHECK (valor_parcela > 0),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_user_id_data_fatura (user_id, data_fatura DESC),
          CONSTRAINT chk_parcelas_pagas_lte_total CHECK (parcelas_pagas <= total_parcelas)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      // Migração: Adicionar coluna valor_variavel se não existir
      try {
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'dividas' 
          AND COLUMN_NAME = 'valor_variavel'
        `)
        
        if (Array.isArray(columns) && columns.length === 0) {
          await connection.execute(`
            ALTER TABLE dividas 
            ADD COLUMN valor_variavel BOOLEAN NOT NULL DEFAULT FALSE
          `)
          console.log("✅ Coluna valor_variavel adicionada à tabela dividas")
        }
      } catch (error) {
        console.warn("⚠️ Erro ao verificar/adicionar coluna valor_variavel:", error)
      }

      // Criar tabela de valores individuais das parcelas (para dívidas com valor variável)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS parcelas_valores (
          id VARCHAR(36) PRIMARY KEY,
          divida_id VARCHAR(36) NOT NULL,
          numero_parcela INT NOT NULL CHECK (numero_parcela > 0),
          valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (divida_id) REFERENCES dividas(id) ON DELETE CASCADE,
          UNIQUE KEY uk_divida_parcela (divida_id, numero_parcela),
          INDEX idx_divida_id (divida_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      // Criar tabela de pagamentos das parcelas (com comprovante opcional)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS parcelas_pagamentos (
          id VARCHAR(36) PRIMARY KEY,
          divida_id VARCHAR(36) NOT NULL,
          numero_parcela INT NOT NULL CHECK (numero_parcela > 0),
          data_pagamento DATE NOT NULL,
          valor_pago DECIMAL(10, 2) NOT NULL CHECK (valor_pago > 0),
          comprovante_url VARCHAR(512) NULL,
          comprovante_nome VARCHAR(255) NULL,
          comprovante_mime VARCHAR(100) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (divida_id) REFERENCES dividas(id) ON DELETE CASCADE,
          UNIQUE KEY uk_divida_parcela_pagamento (divida_id, numero_parcela),
          INDEX idx_pagamentos_divida (divida_id),
          INDEX idx_pagamentos_data (data_pagamento)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)

      console.log("✅ Tabelas do banco de dados inicializadas com sucesso")
      initialized = true
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar banco de dados:", error)
    // Não lançar erro para não quebrar a aplicação
    // As tabelas podem já existir ou haver problema de conexão
  }
}
