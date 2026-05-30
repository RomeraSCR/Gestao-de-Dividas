const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const dbPath = path.join(__dirname, '..', 'database-mock.json');

if (!fs.existsSync(dbPath)) {
  console.error("database-mock.json não encontrado. Rode a aplicação uma vez antes.");
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Limpar tabelas de dados de dívidas, valores e pagamentos
db.dividas = [];
db.parcelas_valores = [];
db.parcelas_pagamentos = [];

const today = new Date();
const yyyy = today.getFullYear();
const mm = today.getMonth(); // 0-indexed

function formatYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Para cada usuário cadastrado no banco de dados mockado
db.users.forEach(user => {
  const userId = user.id;

  // 1. Notebook Dell (10 parcelas, 5 pagas, iniciou há 5 meses)
  const notebookId = randomUUID();
  const notebookStartDate = new Date(yyyy, mm - 5, 10);
  db.dividas.push({
    id: notebookId,
    user_id: userId,
    autor: "Guilherme",
    produto: "Notebook Dell Inspiron 15",
    loja: "Magazine Luiza",
    data_fatura: formatYYYYMMDD(notebookStartDate),
    total_parcelas: 10,
    parcelas_pagas: 5,
    valor_parcela: 349.90,
    valor_variavel: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Criar 5 pagamentos para o Notebook
  for (let i = 1; i <= 5; i++) {
    const payDate = new Date(notebookStartDate.getFullYear(), notebookStartDate.getMonth() + i - 1, 10);
    db.parcelas_pagamentos.push({
      id: randomUUID(),
      divida_id: notebookId,
      numero_parcela: i,
      data_pagamento: formatYYYYMMDD(payDate),
      valor_pago: 349.90,
      comprovante_url: null,
      comprovante_nome: null,
      comprovante_mime: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // 2. Sofá Mobly (6 parcelas, totalmente pago, iniciou há 7 meses)
  const sofaId = randomUUID();
  const sofaStartDate = new Date(yyyy, mm - 7, 5);
  db.dividas.push({
    id: sofaId,
    user_id: userId,
    autor: "Nick",
    produto: "Sofá Retrátil 3 Lugares",
    loja: "Mobly",
    data_fatura: formatYYYYMMDD(sofaStartDate),
    total_parcelas: 6,
    parcelas_pagas: 6,
    valor_parcela: 249.00,
    valor_variavel: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Criar 6 pagamentos para o Sofá
  for (let i = 1; i <= 6; i++) {
    const payDate = new Date(sofaStartDate.getFullYear(), sofaStartDate.getMonth() + i - 1, 5);
    db.parcelas_pagamentos.push({
      id: randomUUID(),
      divida_id: sofaId,
      numero_parcela: i,
      data_pagamento: formatYYYYMMDD(payDate),
      valor_pago: 249.00,
      comprovante_url: null,
      comprovante_nome: null,
      comprovante_mime: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // 3. Rancho de Supermercado (Valor variável, 4 parcelas, 3 pagas, começou há 3 meses)
  const ranchoId = randomUUID();
  const ranchoStartDate = new Date(yyyy, mm - 3, 15);
  db.dividas.push({
    id: ranchoId,
    user_id: userId,
    autor: "Guilherme",
    produto: "Rancho de Supermercado",
    loja: "Carrefour",
    data_fatura: formatYYYYMMDD(ranchoStartDate),
    total_parcelas: 4,
    parcelas_pagas: 3,
    valor_parcela: 600.00,
    valor_variavel: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Valores customizados das parcelas do Rancho
  const valoresRancho = [582.40, 615.10, 590.00, 605.50];
  for (let i = 1; i <= 4; i++) {
    db.parcelas_valores.push({
      id: randomUUID(),
      divida_id: ranchoId,
      numero_parcela: i,
      valor: valoresRancho[i - 1],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // Pagamentos para parcelas 1, 2, 3 do Rancho
  for (let i = 1; i <= 3; i++) {
    const payDate = new Date(ranchoStartDate.getFullYear(), ranchoStartDate.getMonth() + i - 1, 15);
    db.parcelas_pagamentos.push({
      id: randomUUID(),
      divida_id: ranchoId,
      numero_parcela: i,
      data_pagamento: formatYYYYMMDD(payDate),
      valor_pago: valoresRancho[i - 1],
      comprovante_url: null,
      comprovante_nome: null,
      comprovante_mime: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  // 4. PlayStation 5 (10 parcelas, 0 pagas, vence a primeira no próximo mês)
  const ps5Id = randomUUID();
  const ps5StartDate = new Date(yyyy, mm + 1, 20);
  db.dividas.push({
    id: ps5Id,
    user_id: userId,
    autor: "Nick",
    produto: "Console PlayStation 5 Slim",
    loja: "Amazon BR",
    data_fatura: formatYYYYMMDD(ps5StartDate),
    total_parcelas: 10,
    parcelas_pagas: 0,
    valor_parcela: 429.90,
    valor_variavel: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // 5. Ar Condicionado Split (12 parcelas, 1 paga neste mês)
  const arId = randomUUID();
  const arStartDate = new Date(yyyy, mm, 25);
  db.dividas.push({
    id: arId,
    user_id: userId,
    autor: "Guilherme",
    produto: "Ar Condicionado Split 12000 BTUs",
    loja: "Frio & Calor",
    data_fatura: formatYYYYMMDD(arStartDate),
    total_parcelas: 12,
    parcelas_pagas: 1,
    valor_parcela: 185.00,
    valor_variavel: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Pagamento da primeira parcela do ar condicionado
  db.parcelas_pagamentos.push({
    id: randomUUID(),
    divida_id: arId,
    numero_parcela: 1,
    data_pagamento: formatYYYYMMDD(arStartDate),
    valor_pago: 185.00,
    comprovante_url: null,
    comprovante_nome: null,
    comprovante_mime: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log("Mock data seeded successfully for all users!");
