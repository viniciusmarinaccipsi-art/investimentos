// ============================================================
// INVESTIMENTOS — Google Apps Script Backend  •  v3.2.3
// ------------------------------------------------------------
// A PLANILHA É A FONTE ÚNICA DE VERDADE. O app é leitor + editor pontual.
//
// MUDANÇAS DA v3.2 (Feature Títulos Resgatados):
//   • Nova aba "TitulosResgatados" (criada via migrarParaV5)
//   • Campo "isentaIR" preservado (já vinha do v3.1)
//   • Função resgatarAtivo(): move ativo de Investimentos →
//     TitulosResgatados, adicionando 4 colunas:
//       dataResgate, tipoSaida, valorRecebido, rendimentoLiq
//   • listarTudo retorna agora também o array `resgatados`
//   • migrarParaV5(): cria a aba TitulosResgatados se não existir
//
// MUDANÇAS DA v3.1:
//   • Campo "isentaIR" em Investimentos (debêntures Lei 12.431)
//   • Função migrarParaV4(): adiciona coluna + marca CONX12/ALAR13
//
// MUDANÇAS DA v3:
//   • CRUD pontual via GET: addInv, editInv, delInv (JSONP-compatível)
//   • Token obrigatório em qualquer ação de escrita
//   • Provento agora tem dataPago + valorPago (controle real)
//
// COMO PUBLICAR (PASSOS PRA DEPLOY v3.2):
//   1. Editor Apps Script → Cole este código (substitui v3.1)
//   2. Ctrl+S salvar
//   3. Executar → migrarParaV5  (cria aba TitulosResgatados)
//   4. Implantar → Gerenciar implantações → ✎ → Nova versão
//   5. Token continua: vmc_kT8nXp2qLrB9wH4z
//      (ou troque pelo seguro — anote em local seguro)
// ============================================================

// ── CONFIGURAÇÃO ─────────────────────────────────────────────
const SHEET_ID = "1Cf4S59nzrWpNZIWyqHs9CAcu6o2at8nQpKOr68huj44";

// ⚠️ TROQUE este token antes de implantar. Anote a string em local
// seguro (Google Keep / 1Password). Você vai precisar dela ao
// configurar o app em cada aparelho novo.
const TOKEN = PropertiesService.getScriptProperties().getProperty("TOKEN");

const ABA_INVESTIMENTOS = "Investimentos";
const ABA_APORTES       = "Aportes";
const ABA_PROVENTOS     = "Proventos";
const ABA_INDICES       = "Indices";
const ABA_RESGATADOS    = "TitulosResgatados";

const HEADERS_INV = [
  "id", "nome", "tipo", "indexador", "taxa",
  "dataAplicacao", "vencimento", "valorInicial",
  "instituicao", "obs", "criadoEm", "atualizadoEm",
  "valorBruto", "ir", "dataReferencia", "liquidez",
  "grupo", "emissor", "codigo", "taxaLabel", "modoTaxa",
  "isentaIR"
];

// Resgatados = mesmas 22 colunas de Investimentos + 4 novas
const HEADERS_RESGATADOS = HEADERS_INV.concat([
  "dataResgate", "tipoSaida", "valorRecebido", "rendimentoLiq"
]);

const HEADERS_APORTES   = ["id", "invId", "data", "valor", "criadoEm"];
const HEADERS_PROVENTOS = [
  "id", "ativo", "codigo", "taxa", "periodicidade",
  "data", "valor", "pago", "dataPago", "valorPago"
];
const HEADERS_INDICES   = ["chave", "valor", "atualizadoEm"];

const CAMPOS_DATA_INV  = ["dataAplicacao", "vencimento", "dataReferencia"];
const CAMPOS_DATA_RES  = ["dataAplicacao", "vencimento", "dataReferencia", "dataResgate"];
const CAMPOS_DATA_PROV = ["data", "dataPago"];
const CAMPOS_NUM       = ["taxa", "valorInicial", "valorBruto", "ir"];

const SERIES_BCB = { cdi: 4389, selic: 1178, ipca: 13522, igpm: 189 };

// ── ENTRY POINTS ─────────────────────────────────────────────
function doGet(e)  { return responder(rotear(e), e); }
function doPost(e) { return responder(rotear(e), e); }

function responder(dados, e) {
  const out = JSON.stringify(dados);
  const cbRaw = e && e.parameter && e.parameter.callback;
  const cb = cbRaw ? cbRaw.replace(/[^a-zA-Z0-9_$]/g, "") : null;
  if (cb) {
    return ContentService.createTextOutput(cb + "(" + out + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(out)
    .setMimeType(ContentService.MimeType.JSON);
}

function rotear(e) {
  try {
    const p = (e && e.parameter) || {};
    const acao = p.acao;

    if (!acao) return { ok: false, erro: "Parâmetro 'acao' obrigatório." };

    // ── Ações de LEITURA (sem token) ──
    if (acao === "ping")          return { ok: true, msg: "Apps Script v3.2.3 ativo!", versao: "3.2.3" };
    if (acao === "listar")        return listarTudo();
    if (acao === "buscarIndices") return buscarIndices();

    // ── Ações de ESCRITA (exigem token) ──
    if (p.token !== TOKEN) {
      return { ok: false, erro: "Token inválido ou ausente." };
    }

    if (acao === "addInv")         return addInv(p);
    if (acao === "editInv")        return editInv(p);
    if (acao === "delInv")         return delInv(p);
    if (acao === "resgatarAtivo")  return resgatarAtivo(p);
    if (acao === "addProv")        return addProv(p);
    if (acao === "editProv")       return editProv(p);
    if (acao === "delProv")        return delProv(p);
    if (acao === "salvarIndices")  return salvarIndicesManual(p);

    return { ok: false, erro: "Ação desconhecida: " + acao };
  } catch (err) {
    return { ok: false, erro: err.message };
  }
}

// ── ESQUEMA / INICIALIZAÇÃO ──────────────────────────────────
function resetEsquema() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  [
    { nome: ABA_INVESTIMENTOS, headers: HEADERS_INV },
    { nome: ABA_APORTES,       headers: HEADERS_APORTES },
    { nome: ABA_PROVENTOS,     headers: HEADERS_PROVENTOS },
    { nome: ABA_INDICES,       headers: HEADERS_INDICES },
  ].forEach(function (cfg) {
    const aba = ss.getSheetByName(cfg.nome) || ss.insertSheet(cfg.nome);
    aba.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, cfg.headers.length)
      .setBackground("#0d1b2a").setFontColor("#ffffff").setFontWeight("bold");
  });
  return { ok: true, msg: "Esquema (cabeçalhos) atualizado." };
}

// ── MIGRAÇÃO v3 → v3.1 ───────────────────────────────────────
// (mantida pra compat — quem já rodou não precisa rodar de novo)
function migrarParaV4() {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  const aba = ss.getSheetByName(ABA_INVESTIMENTOS);
  if (!aba) return { ok: false, erro: "Aba Investimentos não encontrada." };

  const lastCol = aba.getLastColumn();
  const lastRow = aba.getLastRow();
  const cab = aba.getRange(1, 1, 1, lastCol).getValues()[0];

  let colIsenta = cab.indexOf("isentaIR") + 1;
  if (colIsenta === 0) {
    colIsenta = lastCol + 1;
    aba.getRange(1, colIsenta).setValue("isentaIR");
    aba.getRange(1, colIsenta)
      .setBackground("#0d1b2a").setFontColor("#ffffff").setFontWeight("bold");
    if (lastRow > 1) {
      const range = aba.getRange(2, colIsenta, lastRow - 1, 1);
      range.setValue(false);
    }
  }

  const colCodigo = cab.indexOf("codigo") + 1;
  if (colCodigo === 0) return { ok: false, erro: "Coluna 'codigo' não encontrada." };

  const codigosLei12431 = ["CONX12", "ALAR13"];
  const dados = aba.getRange(2, 1, lastRow - 1, lastCol).getValues();
  let marcados = 0;
  dados.forEach(function (linha, i) {
    const cod = String(linha[colCodigo - 1] || "").trim().toUpperCase();
    if (codigosLei12431.indexOf(cod) >= 0) {
      aba.getRange(i + 2, colIsenta).setValue(true);
      marcados++;
    }
  });

  return {
    ok: true,
    msg: "Migração v3.1 concluída.",
    ativosMarcadosIsentos: marcados
  };
}

// ── MIGRAÇÃO v3.1 → v3.2 ─────────────────────────────────────
// EXECUTE 1x NO EDITOR após implantar a v3.2.
// Cria a aba TitulosResgatados se não existir. Idempotente.
function migrarParaV5() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let aba = ss.getSheetByName(ABA_RESGATADOS);
  if (aba) {
    return {
      ok: true,
      msg: "Aba TitulosResgatados já existe.",
      linhas: Math.max(0, aba.getLastRow() - 1)
    };
  }
  aba = ss.insertSheet(ABA_RESGATADOS);
  aba.getRange(1, 1, 1, HEADERS_RESGATADOS.length).setValues([HEADERS_RESGATADOS]);
  aba.setFrozenRows(1);
  aba.getRange(1, 1, 1, HEADERS_RESGATADOS.length)
    .setBackground("#0d1b2a").setFontColor("#ffffff").setFontWeight("bold");
  return {
    ok: true,
    msg: "Aba TitulosResgatados criada.",
    colunas: HEADERS_RESGATADOS.length
  };
}

// ── LISTAR TUDO (o app lê daqui) ─────────────────────────────
function listarTudo() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const investimentos = lerAba(ss, ABA_INVESTIMENTOS, HEADERS_INV);
  const aportes       = lerAba(ss, ABA_APORTES, HEADERS_APORTES);
  const proventos     = lerAba(ss, ABA_PROVENTOS, HEADERS_PROVENTOS);
  const resgatadosRaw = lerAba(ss, ABA_RESGATADOS, HEADERS_RESGATADOS);

  const abaIdx = ss.getSheetByName(ABA_INDICES);
  const indices = {};
  if (abaIdx && abaIdx.getLastRow() > 1) {
    const dadosIdx = abaIdx.getDataRange().getValues();
    const cabIdx = dadosIdx[0].map(String);
    const colChave = cabIdx.indexOf("chave");
    const colValor = cabIdx.indexOf("valor");
    if (colChave >= 0 && colValor >= 0) {
      dadosIdx.slice(1).forEach(function(row) {
        const chave = String(row[colChave]);
        const valor = row[colValor];
        if (chave) indices[chave] = valor;
      });
    }
  }

  const aportesPorInv = {};
  aportes.forEach(function (a) {
    (aportesPorInv[a.invId] = aportesPorInv[a.invId] || []).push(a);
  });

  const resultado = investimentos.map(function (inv) {
    const o = Object.assign({}, inv);
    CAMPOS_NUM.forEach(function (c) { o[c] = parseFloat(o[c]) || 0; });
    CAMPOS_DATA_INV.forEach(function (c) { o[c] = toISO(o[c]); });
    o.taxa = String(inv.taxa);
    o.taxaNum = parseFloat(inv.taxa) || 0;
    o.isentaIR = (inv.isentaIR === true || String(inv.isentaIR).toLowerCase() === "true" || inv.isentaIR === 1 || inv.isentaIR === "1");
    o.aportes = (aportesPorInv[inv.id] || []).map(function (a) {
      return { id: a.id, invId: a.invId, data: toISO(a.data), valor: parseFloat(a.valor) || 0 };
    });
    return o;
  });

  // Processa resgatados (mesma lógica + 4 campos novos)
  const resgatados = resgatadosRaw.map(function (r) {
    const o = Object.assign({}, r);
    CAMPOS_NUM.forEach(function (c) { o[c] = parseFloat(o[c]) || 0; });
    CAMPOS_DATA_RES.forEach(function (c) { o[c] = toISO(o[c]); });
    o.taxa = String(r.taxa);
    o.taxaNum = parseFloat(r.taxa) || 0;
    o.isentaIR = (r.isentaIR === true || String(r.isentaIR).toLowerCase() === "true" || r.isentaIR === 1 || r.isentaIR === "1");
    o.valorRecebido = parseFloat(r.valorRecebido) || 0;
    o.rendimentoLiq = parseFloat(r.rendimentoLiq) || 0;
    o.tipoSaida = String(r.tipoSaida || "Resgate antecipado");
    return o;
  });

  const provOut = proventos.map(function (p) {
    return {
      id: p.id, ativo: p.ativo, codigo: p.codigo, taxa: p.taxa,
      periodicidade: p.periodicidade, data: toISO(p.data),
      valor: parseFloat(p.valor) || 0,
      pago: (p.pago === true || String(p.pago).toLowerCase() === "true" || p.pago === "1"),
      dataPago:  toISO(p.dataPago),
      valorPago: parseFloat(p.valorPago) || 0
    };
  });

  return {
    ok: true,
    investimentos: resultado,
    resgatados: resgatados,
    proventos: provOut,
    indices: {
      cdi:        parseFloat(indices.cdi)   || 14.83,
      selic:      parseFloat(indices.selic) || 14.75,
      ipca:       parseFloat(indices.ipca)  || 4.39,
      igpm:       parseFloat(indices.igpm)  || 1.95,
      lastUpdate: indices.lastUpdate || null
    }
  };
}

// ── CRUD: INVESTIMENTOS ──────────────────────────────────────
function addInv(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let aba = ss.getSheetByName(ABA_INVESTIMENTOS);
    if (!aba) {
      aba = ss.insertSheet(ABA_INVESTIMENTOS);
      aba.getRange(1, 1, 1, HEADERS_INV.length).setValues([HEADERS_INV]);
      aba.setFrozenRows(1);
    }

    const agora = new Date().toISOString();
    const id = p.id || ("inv_" + Date.now());

    if (encontrarLinha(aba, "id", id)) {
      return { ok: false, erro: "ID já existe: " + id };
    }

    const linhaNova = aba.getLastRow() + 1;
    CAMPOS_DATA_INV.forEach(function (c) {
      const col = HEADERS_INV.indexOf(c) + 1;
      aba.getRange(linhaNova, col).setNumberFormat("@");
    });

    const valores = HEADERS_INV.map(function (h) {
      if (h === "id")           return id;
      if (h === "criadoEm")     return agora;
      if (h === "atualizadoEm") return agora;
      return (p[h] !== undefined && p[h] !== null && p[h] !== "") ? p[h] : "";
    });
    aba.appendRow(valores);
    return { ok: true, acao: "criado", id: id };
  } finally {
    lock.releaseLock();
  }
}

function editInv(p) {
  if (!p.id) return { ok: false, erro: "ID ausente." };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const aba = ss.getSheetByName(ABA_INVESTIMENTOS);
    if (!aba) return { ok: false, erro: "Aba Investimentos não encontrada." };
    const linha = encontrarLinha(aba, "id", p.id);
    if (!linha) return { ok: false, erro: "Investimento não encontrado: " + p.id };

    const agora = new Date().toISOString();
    const atual = aba.getRange(linha, 1, 1, HEADERS_INV.length).getValues()[0];

    CAMPOS_DATA_INV.forEach(function (c) {
      const col = HEADERS_INV.indexOf(c) + 1;
      aba.getRange(linha, col).setNumberFormat("@");
    });

    const valores = HEADERS_INV.map(function (h, i) {
      if (h === "id")           return p.id;
      if (h === "atualizadoEm") return agora;
      if (h === "criadoEm")     return atual[i] || agora;
      return (p[h] !== undefined && p[h] !== "") ? p[h] : atual[i];
    });

    aba.getRange(linha, 1, 1, valores.length).setValues([valores]);
    return { ok: true, acao: "editado", id: p.id };
  } finally {
    lock.releaseLock();
  }
}

function delInv(p) {
  if (!p.id) return { ok: false, erro: "ID ausente." };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const aba = ss.getSheetByName(ABA_INVESTIMENTOS);
    if (!aba) return { ok: false, erro: "Aba Investimentos não encontrada." };
    const linha = encontrarLinha(aba, "id", p.id);
    if (!linha) return { ok: false, erro: "Investimento não encontrado: " + p.id };
    aba.deleteRow(linha);
    const abaAp = ss.getSheetByName(ABA_APORTES);
    if (abaAp) deletarLinhasPorColuna(abaAp, "invId", p.id);
    return { ok: true, acao: "deletado", id: p.id };
  } finally {
    lock.releaseLock();
  }
}

// ── RESGATAR ATIVO (move para TitulosResgatados) ─────────────
// Recebe: id, dataResgate, valorRecebido, tipoSaida ("Resgate antecipado" | "Vencimento natural")
// Faz: lê linha de Investimentos → cria linha em TitulosResgatados
//      com 4 colunas novas → deleta de Investimentos.
function resgatarAtivo(p) {
  if (!p.id) return { ok: false, erro: "ID ausente." };
  if (!p.dataResgate) return { ok: false, erro: "dataResgate ausente (YYYY-MM-DD)." };
  const valorRecebido = parseFloat(p.valorRecebido);
  if (isNaN(valorRecebido) || valorRecebido < 0) {
    return { ok: false, erro: "valorRecebido inválido." };
  }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const tipoSaida = String(p.tipoSaida || "Resgate antecipado");

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const abaInv = ss.getSheetByName(ABA_INVESTIMENTOS);
    if (!abaInv) return { ok: false, erro: "Aba Investimentos não encontrada." };

    // Lê linha do ativo
    const linha = encontrarLinha(abaInv, "id", p.id);
    if (!linha) return { ok: false, erro: "Ativo não encontrado: " + p.id };

    const dadosInv = abaInv.getRange(linha, 1, 1, HEADERS_INV.length).getValues()[0];
    const cabInv = abaInv.getRange(1, 1, 1, HEADERS_INV.length).getValues()[0].map(String);

    // Reconstrói objeto mantendo TODOS os campos do ativo
    const obj = {};
    HEADERS_INV.forEach(function (h) {
      const idx = cabInv.indexOf(h);
      obj[h] = idx >= 0 ? dadosInv[idx] : "";
    });

    // Calcula rendimento líquido
    const valorInicial = parseFloat(obj.valorInicial) || 0;
    const rendimentoLiq = valorRecebido - valorInicial;

    // Adiciona os 4 campos novos
    obj.dataResgate = p.dataResgate;
    obj.tipoSaida = tipoSaida;
    obj.valorRecebido = valorRecebido;
    obj.rendimentoLiq = rendimentoLiq;

    // Garante que a aba TitulosResgatados existe (cria se não existe)
    let abaRes = ss.getSheetByName(ABA_RESGATADOS);
    if (!abaRes) {
      abaRes = ss.insertSheet(ABA_RESGATADOS);
      abaRes.getRange(1, 1, 1, HEADERS_RESGATADOS.length).setValues([HEADERS_RESGATADOS]);
      abaRes.setFrozenRows(1);
      abaRes.getRange(1, 1, 1, HEADERS_RESGATADOS.length)
        .setBackground("#0d1b2a").setFontColor("#ffffff").setFontWeight("bold");
    }

    // Formata colunas de data como texto na nova linha
    const linhaNova = abaRes.getLastRow() + 1;
    CAMPOS_DATA_RES.forEach(function (c) {
      const col = HEADERS_RESGATADOS.indexOf(c) + 1;
      if (col > 0) abaRes.getRange(linhaNova, col).setNumberFormat("@");
    });

    // Grava na ordem do HEADERS_RESGATADOS
    const valores = HEADERS_RESGATADOS.map(function (h) {
      return (obj[h] !== undefined && obj[h] !== null) ? obj[h] : "";
    });
    abaRes.appendRow(valores);

    // Deleta da aba Investimentos
    abaInv.deleteRow(linha);

    // (Opcional) Deleta aportes vinculados — comentado pra preservar histórico
    // const abaAp = ss.getSheetByName(ABA_APORTES);
    // if (abaAp) deletarLinhasPorColuna(abaAp, "invId", p.id);

    return {
      ok: true,
      acao: "resgatado",
      id: p.id,
      nome: obj.nome,
      dataResgate: p.dataResgate,
      valorInicial: valorInicial,
      valorRecebido: valorRecebido,
      rendimentoLiq: rendimentoLiq,
      retornoPct: valorInicial > 0 ? (rendimentoLiq / valorInicial * 100) : 0
    };
  } finally {
    lock.releaseLock();
  }
}

// ── CRUD: PROVENTOS ──────────────────────────────────────────
function addProv(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let aba = ss.getSheetByName(ABA_PROVENTOS);
    if (!aba) {
      aba = ss.insertSheet(ABA_PROVENTOS);
      aba.getRange(1, 1, 1, HEADERS_PROVENTOS.length).setValues([HEADERS_PROVENTOS]);
      aba.setFrozenRows(1);
    }
    const id = p.id || ("prov_" + Date.now());
    if (encontrarLinha(aba, "id", id)) {
      return { ok: false, erro: "ID já existe: " + id };
    }

    const linhaNova = aba.getLastRow() + 1;
    CAMPOS_DATA_PROV.forEach(function (c) {
      const col = HEADERS_PROVENTOS.indexOf(c) + 1;
      aba.getRange(linhaNova, col).setNumberFormat("@");
    });

    const valores = HEADERS_PROVENTOS.map(function (h) {
      if (h === "id") return id;
      return (p[h] !== undefined && p[h] !== null && p[h] !== "") ? p[h] : "";
    });
    aba.appendRow(valores);
    return { ok: true, acao: "criado", id: id };
  } finally {
    lock.releaseLock();
  }
}

function editProv(p) {
  if (!p.id) return { ok: false, erro: "ID ausente." };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const aba = ss.getSheetByName(ABA_PROVENTOS);
    if (!aba) return { ok: false, erro: "Aba Proventos não encontrada." };
    const linha = encontrarLinha(aba, "id", p.id);
    if (!linha) return { ok: false, erro: "Provento não encontrado: " + p.id };

    const atual = aba.getRange(linha, 1, 1, HEADERS_PROVENTOS.length).getValues()[0];
    CAMPOS_DATA_PROV.forEach(function (c) {
      const col = HEADERS_PROVENTOS.indexOf(c) + 1;
      aba.getRange(linha, col).setNumberFormat("@");
    });

    const valores = HEADERS_PROVENTOS.map(function (h, i) {
      if (h === "id") return p.id;
      return (p[h] !== undefined && p[h] !== "") ? p[h] : atual[i];
    });
    aba.getRange(linha, 1, 1, valores.length).setValues([valores]);
    return { ok: true, acao: "editado", id: p.id };
  } finally {
    lock.releaseLock();
  }
}

function delProv(p) {
  if (!p.id) return { ok: false, erro: "ID ausente." };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const aba = ss.getSheetByName(ABA_PROVENTOS);
    if (!aba) return { ok: false, erro: "Aba Proventos não encontrada." };
    const linha = encontrarLinha(aba, "id", p.id);
    if (!linha) return { ok: false, erro: "Provento não encontrado: " + p.id };
    aba.deleteRow(linha);
    return { ok: true, acao: "deletado", id: p.id };
  } finally {
    lock.releaseLock();
  }
}

// ── ÍNDICES ──────────────────────────────────────────────────
function salvarIndicesManual(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const aba = ss.getSheetByName(ABA_INDICES) || ss.insertSheet(ABA_INDICES);
    if (aba.getLastRow() === 0) aba.getRange(1, 1, 1, HEADERS_INDICES.length).setValues([HEADERS_INDICES]);
    const agora = new Date().toISOString();
    ["cdi", "selic", "ipca", "igpm"].forEach(function (chave) {
      if (p[chave] === undefined) return;
      const v = parseFloat(p[chave]);
      if (!isNaN(v)) gravarIndice(aba, chave, v, agora);
    });
    gravarIndice(aba, "lastUpdate", agora, agora);
    return { ok: true, acao: "indices_manual" };
  } finally {
    lock.releaseLock();
  }
}

function buscarIndices() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const aba = ss.getSheetByName(ABA_INDICES) || ss.insertSheet(ABA_INDICES);
  if (aba.getLastRow() === 0) aba.getRange(1, 1, 1, HEADERS_INDICES.length).setValues([HEADERS_INDICES]);
  const agora = new Date().toISOString();
  const out = {};
  Object.keys(SERIES_BCB).forEach(function (chave) {
    const cod = SERIES_BCB[chave];
    try {
      const url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs." + cod + "/dados/ultimos/1?formato=json";
      const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (resp.getResponseCode() === 200) {
        const arr = JSON.parse(resp.getContentText());
        if (arr && arr.length) {
          const v = parseFloat(String(arr[0].valor).replace(",", "."));
          if (!isNaN(v)) { out[chave] = v; gravarIndice(aba, chave, v, agora); }
        }
      }
    } catch (e) { /* mantém valor anterior se falhar */ }
  });
  gravarIndice(aba, "lastUpdate", agora, agora);
  return { ok: true, acao: "indices_bcb", indices: out, atualizadoEm: agora };
}

function criarGatilhoDiario() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "buscarIndices") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("buscarIndices").timeBased().everyDays(1).atHour(6).create();
  return { ok: true, msg: "Gatilho diário de índices criado (06h)." };
}

// ── HELPERS ──────────────────────────────────────────────────
function gravarIndice(aba, chave, valor, agora) {
  const linha = encontrarLinha(aba, "chave", chave);
  if (linha) aba.getRange(linha, 2, 1, 2).setValues([[valor, agora]]);
  else aba.appendRow([chave, valor, agora]);
}

function toISO(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "GMT-3", "yyyy-MM-dd");
  return v == null ? "" : String(v);
}

function lerAba(ss, nomeAba, headers) {
  const aba = ss.getSheetByName(nomeAba);
  if (!aba) return [];
  const dados = aba.getDataRange().getValues();
  if (dados.length <= 1) return [];
  const cabecalho = dados[0].map(String);
  return dados.slice(1).map(function (linha) {
    const obj = {};
    headers.forEach(function (h) {
      const idx = cabecalho.indexOf(h);
      obj[h] = idx >= 0 ? linha[idx] : "";
    });
    return obj;
  }).filter(function (r) { return r.id; });
}

function encontrarLinha(aba, coluna, valor) {
  const dados = aba.getDataRange().getValues();
  if (!dados.length) return null;
  const cabecalho = dados[0].map(String);
  const colIdx = cabecalho.indexOf(coluna);
  if (colIdx < 0) return null;
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][colIdx]) === String(valor)) return i + 1;
  }
  return null;
}

function deletarLinhasPorColuna(aba, coluna, valor) {
  if (!aba) return;
  const dados = aba.getDataRange().getValues();
  if (!dados.length) return;
  const cabecalho = dados[0].map(String);
  const colIdx = cabecalho.indexOf(coluna);
  if (colIdx < 0) return;
  for (let i = dados.length - 1; i >= 1; i--) {
    if (String(dados[i][colIdx]) === String(valor)) aba.deleteRow(i + 1);
  }
}