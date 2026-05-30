import fs from "fs"
import path from "path"

const dbPath = path.join(process.cwd(), "database-mock.json")

interface MockDbSchema {
  users: any[]
  profiles: any[]
  dividas: any[]
  parcelas_valores: any[]
  parcelas_pagamentos: any[]
  receitas: any[]
  gastos: any[]
  poupanca: any[]
}

function loadDb(): MockDbSchema {
  if (fs.existsSync(dbPath)) {
    try {
      const content = fs.readFileSync(dbPath, "utf-8")
      const dbObj = JSON.parse(content)
      dbObj.receitas = dbObj.receitas || []
      dbObj.gastos = dbObj.gastos || []
      dbObj.poupanca = dbObj.poupanca || []
      return dbObj
    } catch (e) {
      console.error("Error reading mock DB, resetting", e)
    }
  }

  const initialDb: MockDbSchema = {
    users: [
      {
        id: "demo-user-uuid-1234-5678",
        email: "demo@teste.com",
        password_hash: "$2a$10$2B7XXG.Y2E5tS0kO7S5JEu6A/Pj5fE5/QZ3W7U4q6mP.5m9j2jQ2i", // bcrypt hash for '123456'
        nome: "Usuário Demo"
      }
    ],
    profiles: [
      {
        id: "demo-user-uuid-1234-5678",
        nome: "Usuário Demo",
        email: "demo@teste.com"
      }
    ],
    dividas: [],
    parcelas_valores: [],
    parcelas_pagamentos: [],
    receitas: [],
    gastos: [],
    poupanca: []
  }
  saveDb(initialDb)
  return initialDb
}

function saveDb(db: MockDbSchema) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8")
}

export function mockQuery(sql: string, params: any[] = []): any[] | { affectedRows: number } {
  const db = loadDb()
  const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase()

  // 1. users
  if (normalized.startsWith("select id, email, password_hash, nome from users where email = ?")) {
    const email = params[0]?.toLowerCase().trim()
    const user = db.users.find(u => u.email.toLowerCase().trim() === email)
    return user ? [user] : []
  }

  if (normalized.startsWith("select id, email, nome from users where email = ?")) {
    const email = params[0]?.toLowerCase().trim()
    const user = db.users.find(u => u.email.toLowerCase().trim() === email)
    return user ? [user] : []
  }

  if (normalized.startsWith("select id from users where email = ?")) {
    const email = params[0]?.toLowerCase().trim()
    const user = db.users.find(u => u.email.toLowerCase().trim() === email)
    return user ? [{ id: user.id }] : []
  }

  if (normalized.startsWith("insert into users")) {
    const [id, email, password_hash, nome] = params
    db.users.push({ id, email, password_hash, nome })
    saveDb(db)
    return { affectedRows: 1 }
  }

  if (normalized.startsWith("select id, email, nome from users where id = ?")) {
    const id = params[0]
    const user = db.users.find(u => u.id === id)
    return user ? [{ id: user.id, email: user.email, nome: user.nome }] : []
  }

  if (normalized.startsWith("select id, email, password_hash, nome from users where id = ?")) {
    const id = params[0]
    const user = db.users.find(u => u.id === id)
    return user ? [user] : []
  }

  // 2. profiles
  if (normalized.startsWith("insert into profiles")) {
    const [id, nome, email] = params
    db.profiles.push({ id, nome, email })
    saveDb(db)
    return { affectedRows: 1 }
  }

  // 3. dividas
  if (normalized.startsWith("insert into dividas")) {
    const [id, user_id, autor, produto, loja, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, valor_variavel, data_fechamento, data_inicio, data_fim] = params
    db.dividas.push({
      id,
      user_id,
      autor,
      produto,
      loja,
      data_fatura,
      total_parcelas: Number(total_parcelas),
      parcelas_pagas: Number(parcelas_pagas),
      valor_parcela: Number(valor_parcela),
      valor_variavel: !!valor_variavel,
      data_fechamento: data_fechamento || null,
      data_inicio: data_inicio || null,
      data_fim: data_fim || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    saveDb(db)
    return { affectedRows: 1 }
  }

  if (normalized.startsWith("select user_id from dividas where id = ?")) {
    const id = params[0]
    const d = db.dividas.find(div => div.id === id)
    return d ? [{ user_id: d.user_id }] : []
  }

  if (normalized.startsWith("update dividas set autor =")) {
    const [autor, produto, loja, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, valor_variavel, data_fechamento, data_inicio, data_fim, id] = params
    const idx = db.dividas.findIndex(d => d.id === id)
    if (idx > -1) {
      db.dividas[idx] = {
        ...db.dividas[idx],
        autor,
        produto,
        loja,
        data_fatura,
        total_parcelas: Number(total_parcelas),
        parcelas_pagas: Number(parcelas_pagas),
        valor_parcela: Number(valor_parcela),
        valor_variavel: !!valor_variavel,
        data_fechamento: data_fechamento || null,
        data_inicio: data_inicio || null,
        data_fim: data_fim || null,
        updated_at: new Date().toISOString()
      }
      saveDb(db)
      return { affectedRows: 1 }
    }
    return { affectedRows: 0 }
  }

  if (normalized.startsWith("delete from dividas where id = ?")) {
    const id = params[0]
    db.dividas = db.dividas.filter(d => d.id !== id)
    db.parcelas_valores = db.parcelas_valores.filter(pv => pv.divida_id !== id)
    db.parcelas_pagamentos = db.parcelas_pagamentos.filter(pp => pp.divida_id !== id)
    saveDb(db)
    return { affectedRows: 1 }
  }

  if (normalized.startsWith("select id, user_id, total_parcelas, parcelas_pagas, valor_variavel, valor_parcela from dividas where id = ?")) {
    const id = params[0]
    const d = db.dividas.find(div => div.id === id)
    return d ? [d] : []
  }

  if (normalized.startsWith("update dividas set parcelas_pagas = ? where id = ?")) {
    const [parcelas_pagas, id] = params
    const idx = db.dividas.findIndex(d => d.id === id)
    if (idx > -1) {
      db.dividas[idx].parcelas_pagas = Number(parcelas_pagas)
      db.dividas[idx].updated_at = new Date().toISOString()
      saveDb(db)
      return { affectedRows: 1 }
    }
    return { affectedRows: 0 }
  }

  if (normalized.startsWith("select id, user_id, autor, produto, loja, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, coalesce(valor_variavel, 0) as valor_variavel, data_fechamento, data_inicio, data_fim, created_at, updated_at from dividas where user_id = ?")) {
    const user_id = params[0]
    const filtered = db.dividas.filter(d => d.user_id === user_id)
    filtered.sort((a, b) => b.data_fatura.localeCompare(a.data_fatura))
    return filtered
  }

  if (normalized.startsWith("select user_id, data_fatura, total_parcelas, parcelas_pagas, valor_parcela, coalesce(valor_variavel, 0) as valor_variavel from dividas where id = ?")) {
    const id = params[0]
    const d = db.dividas.find(div => div.id === id)
    return d ? [d] : []
  }

  // 4. parcelas_valores
  if (normalized.startsWith("insert into parcelas_valores")) {
    const [id, divida_id, numero_parcela, valor, valUpdate] = params
    const existingIndex = db.parcelas_valores.findIndex(
      pv => pv.divida_id === divida_id && Number(pv.numero_parcela) === Number(numero_parcela)
    )
    if (existingIndex > -1) {
      db.parcelas_valores[existingIndex].valor = Number(valUpdate !== undefined ? valUpdate : valor)
      db.parcelas_valores[existingIndex].updated_at = new Date().toISOString()
    } else {
      db.parcelas_valores.push({
        id,
        divida_id,
        numero_parcela: Number(numero_parcela),
        valor: Number(valor),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    saveDb(db)
    return { affectedRows: 1 }
  }

  if (normalized.startsWith("select numero_parcela from parcelas_valores where divida_id = ?")) {
    const dividaId = params[0]
    const rows = db.parcelas_valores.filter(pv => pv.divida_id === dividaId)
    return rows.map(r => ({ numero_parcela: r.numero_parcela }))
  }

  if (normalized.startsWith("select valor from parcelas_valores where divida_id = ? and numero_parcela = ?")) {
    const [divida_id, numero_parcela] = params
    const pv = db.parcelas_valores.find(
      r => r.divida_id === divida_id && Number(r.numero_parcela) === Number(numero_parcela)
    )
    return pv ? [pv] : []
  }

  if (normalized.startsWith("select numero_parcela, valor from parcelas_valores where divida_id = ?")) {
    const dividaId = params[0]
    const filtered = db.parcelas_valores.filter(pv => pv.divida_id === dividaId)
    filtered.sort((a, b) => a.numero_parcela - b.numero_parcela)
    return filtered
  }

  // 5. parcelas_pagamentos
  if (normalized.startsWith("insert into parcelas_pagamentos")) {
    const [id, divida_id, numero_parcela, data_pagamento, valor_pago, comprovante_url, comprovante_nome, comprovante_mime] = params
    const existingIdx = db.parcelas_pagamentos.findIndex(
      pp => pp.divida_id === divida_id && Number(pp.numero_parcela) === Number(numero_parcela)
    )
    if (existingIdx > -1) {
      db.parcelas_pagamentos[existingIdx] = {
        ...db.parcelas_pagamentos[existingIdx],
        data_pagamento,
        valor_pago: Number(valor_pago),
        comprovante_url: comprovante_url !== undefined ? comprovante_url : db.parcelas_pagamentos[existingIdx].comprovante_url,
        comprovante_nome: comprovante_nome !== undefined ? comprovante_nome : db.parcelas_pagamentos[existingIdx].comprovante_nome,
        comprovante_mime: comprovante_mime !== undefined ? comprovante_mime : db.parcelas_pagamentos[existingIdx].comprovante_mime,
        updated_at: new Date().toISOString()
      }
    } else {
      db.parcelas_pagamentos.push({
        id,
        divida_id,
        numero_parcela: Number(numero_parcela),
        data_pagamento,
        valor_pago: Number(valor_pago),
        comprovante_url,
        comprovante_nome,
        comprovante_mime,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    saveDb(db)
    return { affectedRows: 1 }
  }

  if (normalized.startsWith("select numero_parcela, data_pagamento, valor_pago, comprovante_url, comprovante_nome from parcelas_pagamentos where divida_id = ?")) {
    const dividaId = params[0]
    const filtered = db.parcelas_pagamentos.filter(pp => pp.divida_id === dividaId)
    filtered.sort((a, b) => a.numero_parcela - b.numero_parcela)
    return filtered
  }

  if (normalized.startsWith("update parcelas_pagamentos set comprovante_url =")) {
    const [comprovante_url, comprovante_nome, comprovante_mime, divida_id, numero_parcela] = params
    const idx = db.parcelas_pagamentos.findIndex(
      pp => pp.divida_id === divida_id && Number(pp.numero_parcela) === Number(numero_parcela)
    )
    if (idx > -1) {
      db.parcelas_pagamentos[idx] = {
        ...db.parcelas_pagamentos[idx],
        comprovante_url,
        comprovante_nome,
        comprovante_mime,
        updated_at: new Date().toISOString()
      }
      saveDb(db)
      return { affectedRows: 1 }
    }
    return { affectedRows: 0 }
  }

  if (normalized.startsWith("select d.user_id, pp.comprovante_mime, pp.comprovante_nome from parcelas_pagamentos pp join dividas d on d.id = pp.divida_id")) {
    const [like1, like2] = params
    const pattern1 = (like1 || "").replace(/%/g, "").toLowerCase()
    const pattern2 = (like2 || "").replace(/%/g, "").toLowerCase()

    const pp = db.parcelas_pagamentos.find(p => {
      const url = (p.comprovante_url || "").toLowerCase()
      return url.includes(pattern1) || url.includes(pattern2)
    })

    if (pp) {
      const d = db.dividas.find(div => div.id === pp.divida_id)
      if (d) {
        return [{
          user_id: d.user_id,
          comprovante_mime: pp.comprovante_mime,
          comprovante_nome: pp.comprovante_nome
        }]
      }
    }
    return []
  }

  // 6. receitas
  if (normalized.startsWith("insert into receitas")) {
    const [id, user_id, valor, descricao, data_receita] = params
    db.receitas.push({
      id,
      user_id,
      valor: Number(valor),
      descricao,
      data_receita,
      created_at: new Date().toISOString()
    })
    saveDb(db)
    return { affectedRows: 1 }
  }

  if (normalized.startsWith("select id, user_id, valor, descricao, data_receita, created_at from receitas where user_id = ?")) {
    const user_id = params[0]
    const filtered = db.receitas.filter(r => r.user_id === user_id)
    filtered.sort((a, b) => b.data_receita.localeCompare(a.data_receita))
    return filtered
  }

  if (normalized.startsWith("delete from receitas where id = ?")) {
    const id = params[0]
    db.receitas = db.receitas.filter(r => r.id !== id)
    saveDb(db)
    return { affectedRows: 1 }
  }

  // 7. gastos
  if (normalized.startsWith("insert into gastos")) {
    const [id, user_id, valor, descricao, categoria, data_gasto, tipo] = params
    db.gastos.push({
      id,
      user_id,
      valor: Number(valor),
      descricao,
      categoria,
      data_gasto,
      tipo,
      created_at: new Date().toISOString()
    })
    saveDb(db)
    return { affectedRows: 1 }
  }

  if (normalized.startsWith("select id, user_id, valor, descricao, categoria, data_gasto, tipo, created_at from gastos where user_id = ?")) {
    const user_id = params[0]
    const filtered = db.gastos.filter(g => g.user_id === user_id)
    filtered.sort((a, b) => b.data_gasto.localeCompare(a.data_gasto))
    return filtered
  }

  if (normalized.startsWith("delete from gastos where id = ?")) {
    const id = params[0]
    db.gastos = db.gastos.filter(g => g.id !== id)
    saveDb(db)
    return { affectedRows: 1 }
  }

  // 8. poupanca
  if (normalized.startsWith("insert into poupanca")) {
    const [id, user_id, valor, descricao, data_poupanca] = params
    db.poupanca.push({
      id,
      user_id,
      valor: Number(valor),
      descricao,
      data_poupanca,
      created_at: new Date().toISOString()
    })
    saveDb(db)
    return { affectedRows: 1 }
  }

  if (normalized.startsWith("select id, user_id, valor, descricao, data_poupanca, created_at from poupanca where user_id = ?")) {
    const user_id = params[0]
    const filtered = db.poupanca.filter(p => p.user_id === user_id)
    filtered.sort((a, b) => b.data_poupanca.localeCompare(a.data_poupanca))
    return filtered
  }

  if (normalized.startsWith("delete from poupanca where id = ?")) {
    const id = params[0]
    db.poupanca = db.poupanca.filter(p => p.id !== id)
    saveDb(db)
    return { affectedRows: 1 }
  }

  console.warn("⚠️ Unmatched SQL query in mock-db:", sql, params)
  return []
}

export function mockQueryOne(sql: string, params: any[] = []): any | null {
  const rows = mockQuery(sql, params)
  if (Array.isArray(rows)) {
    return rows[0] || null
  }
  return null
}
