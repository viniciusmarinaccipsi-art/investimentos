// ============================================================
// INVESTIMENTOS — Google Apps Script Backend  •  v3.3.0
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
const ABA_RADAR         = "Radar";

const HEADERS_RADAR = [
  "data", "nome", "tipo", "indexador", "taxaBruta", "taxaLiqAnual",
  "vencimento", "liquidez", "aporteMinimo", "distribuidor", "emissor",
  "fgc", "ir", "vsCDI", "destaque", "fonte"
];

const THRESHOLDS = {
  cdi_liq_diaria: 102,
  cdi_prazo_1ano: 115,
  cdi_mais:        2.0,
  ipca_mais:       9.0,
  prefixado:      15.0,
  aporte_max:  10000
};

const EMAIL_DESTINO = "viniciusmarinacci.psi@gmail.com";

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
    if (acao === "ping")          return { ok: true, msg: "Apps Script v3.3.0 ativo!", versao: "3.3.0" };
    if (acao === "listar")        return listarTudo();
    if (acao === "buscarIndices") return buscarIndices();
    if (acao === "listarRadar")   return listarRadar();

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
    if (acao === "executarRadar")  return radarDiario();

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

  var radarOut = [];
  try { radarOut = lerAba(ss, ABA_RADAR, HEADERS_RADAR); } catch(e) {}

  return {
    ok: true,
    investimentos: resultado,
    resgatados: resgatados,
    proventos: provOut,
    radar: radarOut,
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

// ── RADAR DIÁRIO ─────────────────────────────────────────────

function testarTesouro() {
  var url = "https://www.tesourodireto.com.br/o/rentabilidade/investir";
  var resp = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
  Logger.log("Status: " + resp.getResponseCode());
  Logger.log("Body (500 chars): " + resp.getContentText().substring(0, 500));
  return resp.getResponseCode();
}

function inferirIndexadorRd(raw) {
  var nome = (raw.nome || "").toUpperCase();
  if (nome.indexOf("IPCA") >= 0) return "IPCA+";
  if (nome.indexOf("CDI+") >= 0 || nome.indexOf("CDI +") >= 0) return "CDI+";
  if (nome.indexOf("CDI") >= 0) return "CDI";
  if (nome.indexOf("PRÉ") >= 0 || nome.indexOf("PRE") >= 0) return "Prefixado";
  return "CDI";
}

function inferirIndexadorTesouro(nome) {
  var n = (nome || "").toUpperCase();
  if (n.indexOf("IPCA") >= 0) return "IPCA+";
  if (n.indexOf("SELIC") >= 0) return "CDI";
  return "Prefixado";
}

function inferirLiquidezRd(raw) {
  var nome = (raw.nome || "").toUpperCase();
  if (nome.indexOf("LIQUIDEZ DIÁRIA") >= 0 || nome.indexOf("LIQ. DIÁRIA") >= 0 ||
      nome.indexOf("LIQ DIÁRIA") >= 0 || nome.indexOf("DIÁRIA") >= 0) return "Diária";
  if (raw.liquidez && String(raw.liquidez).toUpperCase().indexOf("DIÁR") >= 0) return "Diária";
  return "No venc.";
}

function converterDataRd(str) {
  if (!str) return "";
  var m = String(str).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return m[3] + "-" + m[2] + "-" + m[1];
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return str;
}

function parseMoedaRd(str) {
  if (!str) return 0;
  var s = String(str).replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(s) || 0;
}

function extrairNumeroRd(str) {
  if (!str) return 0;
  var m = String(str).match(/([\d]+[,.]?[\d]*)/);
  return m ? parseFloat(m[1].replace(",", ".")) : 0;
}

function calcPrazoAnos(vencISO) {
  if (!vencISO) return 0;
  var venc = new Date(vencISO);
  return (venc - new Date()) / (365.25 * 24 * 60 * 60 * 1000);
}

function normalizarAtivoRd(raw, tipoFromQuery) {
  return {
    data:         new Date().toISOString().substring(0, 10),
    nome:         (raw.nome || "").trim(),
    tipo:         tipoFromQuery.toUpperCase(),
    indexador:    inferirIndexadorRd(raw),
    taxaBruta:    raw.taxaBruta    || "",
    taxaLiqAnual: raw.taxaLiqAnual || "",
    vencimento:   converterDataRd(raw.vencimento),
    liquidez:     inferirLiquidezRd(raw),
    aporteMinimo: parseMoedaRd(raw.aporteMinimo),
    distribuidor: raw.distribuidor || "",
    emissor:      raw.emissor      || "",
    fgc:          raw.fgc          || "",
    ir:           raw.impostos     || "",
    vsCDI:        raw.vsCDI        || "",
    destaque:     false,
    fonte:        "Meelion"
  };
}

function parsearCardsHTML(html, tipo) {
  var ativos = [];
  var partes = html.split("investment-card h-100");
  if (partes.length <= 1) return ativos;
  for (var i = 1; i < partes.length; i++) {
    var card = partes[i];
    var raw = {};
    var mNome = card.match(/<h3[^>]*class="title-text"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/);
    if (!mNome) continue;
    raw.nome = mNome[1].trim();
    var mFgc = card.match(/ci-card-fgc-pill[^"]*"[^>]*>([^<]+)</);
    raw.fgc = mFgc ? mFgc[1].trim() : "";
    var mEmissor = card.match(/data-field="offered-by"[^>]*>([^<]+)</);
    raw.emissor = mEmissor ? mEmissor[1].trim() : "";
    var mDist = card.match(/data-field="available-at"[^>]*>([^<]+)</);
    raw.distribuidor = mDist ? mDist[1].trim() : "";
    var infoRe = /<span[^>]*class="label"[^>]*>\s*([^<]+?)\s*<\/span>\s*<span[^>]*class="value"[^>]*>\s*([^<]+?)\s*<\/span>/g;
    var mInfo;
    while ((mInfo = infoRe.exec(card)) !== null) {
      var label = mInfo[1].trim().toLowerCase();
      var valor = mInfo[2].trim();
      if      (label.indexOf("vencimento") >= 0)          raw.vencimento   = valor;
      else if (label.indexOf("taxa líquida anual") >= 0)  raw.taxaLiqAnual = valor;
      else if (label.indexOf("vs cdi") >= 0)              raw.vsCDI        = valor;
      else if (label.indexOf("impostos") >= 0)            raw.impostos     = valor;
      else if (label.indexOf("investimento mínimo") >= 0) raw.aporteMinimo = valor;
    }
    var mTaxa = raw.nome.match(/([\d]+[,.]?[\d]*)\s*%\s*(CDI|a\.a\.|IPCA)/i);
    raw.taxaBruta = mTaxa
      ? mTaxa[1].replace(",", ".") + "% " + mTaxa[2].toUpperCase()
      : (raw.taxaLiqAnual || "");
    ativos.push(normalizarAtivoRd(raw, tipo));
  }
  return ativos;
}

function buscarMeelion() {
  var buscas = [
    { params: "investment_type=cdb&financial_index=cdi&sort=rate_value%20desc",        tipo: "CDB",       maxPag: 3 },
    { params: "investment_type=cdb&financial_index=pre-fixado&sort=rate_value%20desc", tipo: "CDB",       maxPag: 2 },
    { params: "investment_type=cdb&financial_index=ipca&sort=rate_value%20desc",       tipo: "CDB",       maxPag: 2 },
    { params: "investment_type=cdb&financial_index=cdi-mais&sort=rate_value%20desc",   tipo: "CDB",       maxPag: 2 },
    { params: "investment_type=lci&sort=rate_value%20desc",                            tipo: "LCI",       maxPag: 2 },
    { params: "investment_type=lca&sort=rate_value%20desc",                            tipo: "LCA",       maxPag: 2 },
    { params: "investment_type=cri&sort=rate_value%20desc",                            tipo: "CRI",       maxPag: 1 },
    { params: "investment_type=cra&sort=rate_value%20desc",                            tipo: "CRA",       maxPag: 1 },
    { params: "investment_type=debenture-incentivada&sort=rate_value%20desc",          tipo: "DEBENTURE", maxPag: 1 }
  ];
  var options = {
    muteHttpExceptions: true,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GoogleAppsScript)" }
  };
  var todos = [];
  buscas.forEach(function(b) {
    for (var pag = 1; pag <= b.maxPag; pag++) {
      var url = "https://www.meelion.com/renda-fixa/comparar-investimentos/?" + b.params + "&page=" + pag;
      try {
        var resp = UrlFetchApp.fetch(url, options);
        if (resp.getResponseCode() !== 200) { Logger.log("Meelion " + resp.getResponseCode() + " — " + b.tipo + " p" + pag); break; }
        var ativos = parsearCardsHTML(resp.getContentText(), b.tipo);
        Logger.log("Meelion " + b.tipo + " p" + pag + ": " + ativos.length + " ativos");
        todos = todos.concat(ativos);
        if (ativos.length < 12) break;
        Utilities.sleep(500);
      } catch(e) { Logger.log("Erro Meelion (" + b.tipo + " p" + pag + "): " + e.message); break; }
    }
  });
  return todos;
}

function buscarTesouro() {
  var url = "https://www.tesourodireto.com.br/o/rentabilidade/investir";
  var resp = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
  if (resp.getResponseCode() !== 200) return [];
  try {
    var json = JSON.parse(resp.getContentText());
    var ativos = [];
    ["TesouroLegado", "Tesouro24x7"].forEach(function(grupo) {
      (json[grupo] || []).forEach(function(t) {
        ativos.push({
          data:         new Date().toISOString().substring(0, 10),
          nome:         t.treasuryBondName || "",
          tipo:         "Tesouro Direto",
          indexador:    inferirIndexadorTesouro(t.treasuryBondName),
          taxaBruta:    t.investmentProfitabilityIndexerName || "",
          taxaLiqAnual: "",
          vencimento:   t.maturityDate ? t.maturityDate.substring(0, 10) : "",
          liquidez:     "Diária",
          aporteMinimo: parseFloat(t.investmentBondMinimumValue) || 0,
          distribuidor: "Tesouro Nacional",
          emissor:      "Governo Federal",
          fgc:          "N/A",
          ir:           "Tributável",
          vsCDI:        "",
          destaque:     false,
          fonte:        "Tesouro Direto"
        });
      });
    });
    return ativos;
  } catch(e) { Logger.log("Erro ao parsear Tesouro: " + e.message); return []; }
}

function filtrarRadar(ativos) {
  return ativos.map(function(a) {
    var taxa = extrairNumeroRd(a.taxaBruta);
    var prazo = calcPrazoAnos(a.vencimento);
    var ok = false;
    if (a.indexador === "CDI"      && a.liquidez === "Diária"  && taxa >= THRESHOLDS.cdi_liq_diaria) ok = true;
    if (a.indexador === "CDI"      && a.liquidez !== "Diária"  && prazo >= 1 && taxa >= THRESHOLDS.cdi_prazo_1ano) ok = true;
    if (a.indexador === "CDI+"     && taxa >= THRESHOLDS.cdi_mais)  ok = true;
    if (a.indexador === "IPCA+"    && taxa >= THRESHOLDS.ipca_mais) ok = true;
    if (a.indexador === "Prefixado"&& taxa >= THRESHOLDS.prefixado) ok = true;
    if (a.aporteMinimo > 0 && a.aporteMinimo > THRESHOLDS.aporte_max) ok = false;
    a.destaque = ok;
    return a;
  });
}

function salvarRadar(ativos) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var aba = ss.getSheetByName(ABA_RADAR);
    if (!aba) {
      aba = ss.insertSheet(ABA_RADAR);
      aba.getRange(1, 1, 1, HEADERS_RADAR.length).setValues([HEADERS_RADAR]);
      aba.setFrozenRows(1);
      aba.getRange(1, 1, 1, HEADERS_RADAR.length)
        .setBackground("#0d1b2a").setFontColor("#ffffff").setFontWeight("bold");
    }
    var corteISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    var lastRow = aba.getLastRow();
    if (lastRow > 1) {
      var datas = aba.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = datas.length - 1; i >= 0; i--) {
        if (String(datas[i][0]) < corteISO) aba.deleteRow(i + 2);
      }
    }
    if (ativos.length > 0) {
      var linhas = ativos.map(function(a) {
        return HEADERS_RADAR.map(function(h) { return a[h] !== undefined ? a[h] : ""; });
      });
      aba.getRange(aba.getLastRow() + 1, 1, linhas.length, HEADERS_RADAR.length).setValues(linhas);
    }
    return { ok: true, gravados: ativos.length };
  } finally { lock.releaseLock(); }
}

function enviarEmailRadar(ativos) {
  var destaques = ativos.filter(function(a) { return a.destaque; });
  var tesouro   = ativos.filter(function(a) { return a.fonte === "Tesouro Direto"; });
  var hoje = new Date();
  var dataStr = hoje.toLocaleDateString("pt-BR") + " " + hoje.toLocaleTimeString("pt-BR").substring(0, 5);
  var corpo = '<div style="font-family:Arial,sans-serif;background:#0d1b2a;color:#e9edf3;padding:20px;max-width:720px">';
  corpo += '<h2 style="color:#f5c518;margin:0 0 4px">📡 Radar Renda Fixa — ' + dataStr + '</h2>';
  corpo += '<p style="color:#8b97a8;margin:0 0 20px">' + destaques.length + ' destaque(s) de ' + ativos.length + ' ativos escaneados</p>';
  if (destaques.length > 0) {
    corpo += '<h3 style="color:#34d399;padding-bottom:6px;border-bottom:1px solid #222d3d">🔥 Destaques</h3>';
    var grupos = {};
    destaques.forEach(function(a) { (grupos[a.indexador] = grupos[a.indexador] || []).push(a); });
    Object.keys(grupos).forEach(function(idx) {
      corpo += '<h4 style="color:#5aa9e6;margin-bottom:6px">' + idx + '</h4>';
      corpo += '<table style="width:100%;border-collapse:collapse">';
      corpo += '<tr style="background:#172030"><th style="padding:5px 8px;text-align:left;font-size:11px">Nome / Emissor</th><th style="font-size:11px;padding:5px 8px">Taxa</th><th style="font-size:11px;padding:5px 8px">Venc.</th><th style="font-size:11px;padding:5px 8px">Mín.</th><th style="font-size:11px;padding:5px 8px">FGC</th></tr>';
      grupos[idx].forEach(function(a) {
        corpo += '<tr>' +
          '<td style="padding:5px 8px;border-bottom:1px solid #1a2535;font-size:12px"><b>' + a.nome + '</b><br><span style="color:#5d6878;font-size:10px">' + (a.distribuidor || "") + '</span></td>' +
          '<td style="padding:5px 8px;border-bottom:1px solid #1a2535;font-size:12px;color:#f5c518;font-weight:bold">' + (a.taxaBruta || a.taxaLiqAnual || "—") + '</td>' +
          '<td style="padding:5px 8px;border-bottom:1px solid #1a2535;font-size:12px">' + (a.vencimento || "—") + '</td>' +
          '<td style="padding:5px 8px;border-bottom:1px solid #1a2535;font-size:12px">' + (a.aporteMinimo > 0 ? "R$ " + Number(a.aporteMinimo).toLocaleString("pt-BR") : "—") + '</td>' +
          '<td style="padding:5px 8px;border-bottom:1px solid #1a2535;font-size:12px">' + (a.fgc || "—") + '</td>' +
        '</tr>';
      });
      corpo += '</table><br>';
    });
  } else {
    corpo += '<p style="color:#8b97a8">Nenhum ativo atendeu aos thresholds hoje.</p>';
  }
  if (tesouro.length > 0) {
    corpo += '<h3 style="color:#5aa9e6;padding-bottom:6px;border-bottom:1px solid #222d3d;margin-top:20px">📊 Tesouro Direto</h3>';
    corpo += '<table style="width:100%;border-collapse:collapse">';
    corpo += '<tr style="background:#172030"><th style="padding:5px 8px;text-align:left;font-size:11px">Título</th><th style="font-size:11px;padding:5px 8px">Indexador</th><th style="font-size:11px;padding:5px 8px">Taxa Bruta</th><th style="font-size:11px;padding:5px 8px">Venc.</th></tr>';
    tesouro.forEach(function(a) {
      corpo += '<tr>' +
        '<td style="padding:5px 8px;border-bottom:1px solid #1a2535;font-size:12px">' + a.nome + '</td>' +
        '<td style="padding:5px 8px;border-bottom:1px solid #1a2535;font-size:12px">' + a.indexador + '</td>' +
        '<td style="padding:5px 8px;border-bottom:1px solid #1a2535;font-size:12px;color:#f5c518">' + (a.taxaBruta || "—") + '</td>' +
        '<td style="padding:5px 8px;border-bottom:1px solid #1a2535;font-size:12px">' + (a.vencimento || "—") + '</td>' +
      '</tr>';
    });
    corpo += '</table>';
  }
  corpo += '<p style="color:#5d6878;font-size:10px;margin-top:20px;border-top:1px solid #1a2535;padding-top:10px">Radar automático · Apps Script v3.3.0 · Thresholds: CDI diária ≥' + THRESHOLDS.cdi_liq_diaria + '% · CDI prazo ≥' + THRESHOLDS.cdi_prazo_1ano + '% · IPCA+ ≥' + THRESHOLDS.ipca_mais + '% · Pré ≥' + THRESHOLDS.prefixado + '%</p>';
  corpo += '</div>';
  MailApp.sendEmail({
    to: EMAIL_DESTINO,
    subject: "📡 Radar RF — " + destaques.length + " destaque(s) · " + hoje.toLocaleDateString("pt-BR"),
    htmlBody: corpo
  });
}

function radarDiario() {
  var ativos = [];
  try { ativos = ativos.concat(buscarTesouro()); } catch(e) { Logger.log("Tesouro falhou: " + e.message); }
  try { ativos = ativos.concat(buscarMeelion()); } catch(e) {
    Logger.log("Meelion falhou: " + e.message);
    try { MailApp.sendEmail({ to: EMAIL_DESTINO, subject: "⚠️ Radar RF — Meelion indisponível " + new Date().toLocaleDateString("pt-BR"), body: "Meelion erro: " + e.message + "\nTesouro: " + ativos.length + " ativos." }); } catch(e2) {}
  }
  ativos = filtrarRadar(ativos);
  salvarRadar(ativos);
  var destaques = ativos.filter(function(a) { return a.destaque; });
  if (ativos.length > 0) { try { enviarEmailRadar(ativos); } catch(e) { Logger.log("Email falhou: " + e.message); } }
  return { ok: true, total: ativos.length, destaques: destaques.length };
}

function criarTriggerRadar() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "radarDiario") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("radarDiario").timeBased().atHour(7).everyDays(1).create();
  return { ok: true, msg: "Trigger radar diário criado (7h)" };
}

function migrarParaV6() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var aba = ss.getSheetByName(ABA_RADAR);
  if (aba) return { ok: true, msg: "Aba Radar já existe.", linhas: Math.max(0, aba.getLastRow() - 1) };
  aba = ss.insertSheet(ABA_RADAR);
  aba.getRange(1, 1, 1, HEADERS_RADAR.length).setValues([HEADERS_RADAR]);
  aba.setFrozenRows(1);
  aba.getRange(1, 1, 1, HEADERS_RADAR.length)
    .setBackground("#0d1b2a").setFontColor("#ffffff").setFontWeight("bold");
  return { ok: true, msg: "Aba Radar criada.", colunas: HEADERS_RADAR.length };
}

function listarRadar() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var aba = ss.getSheetByName(ABA_RADAR);
  if (!aba) return { ok: true, radar: [] };
  var dados = lerAba(ss, ABA_RADAR, HEADERS_RADAR);
  var out = dados.map(function(r) {
    var o = Object.assign({}, r);
    o.aporteMinimo = parseFloat(o.aporteMinimo) || 0;
    o.destaque = (o.destaque === true || String(o.destaque).toLowerCase() === "true" || o.destaque === 1 || o.destaque === "1" || o.destaque === "TRUE");
    return o;
  });
  return { ok: true, radar: out };
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