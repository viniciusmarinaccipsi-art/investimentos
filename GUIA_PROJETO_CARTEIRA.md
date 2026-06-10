# GUIA DE REFERÊNCIA — Projeto Carteira de Investimentos
> Versão: 09/06/2026 | Salve este arquivo e cole nas instruções do projeto no Claude

---

## 1. FERRAMENTAS INSTALADAS NA MÁQUINA

| Ferramenta | Versão | PowerShell | Git Bash | Claude Code |
|---|---|---|---|---|
| Node.js | v24.16.0 | ✅ | ✅ | ✅ com `!` |
| npm | v11.13.0 | ✅ | ✅ | ✅ com `!` |
| clasp | v3.3.0 | ✅ | ✅ | ✅ com `!` |
| Git | v2.54.0 | ✅ | ✅ | ✅ |
| Playwright | v1.60.0 | ✅ | ✅ | ✅ com `!` |
| Python | v3.14.3 | ✅ | ✅ | ✅ com `!` |
| gcloud CLI | v571.0.0 | ✅ | — | — |
| Claude Code | v2.1.169 | abre aqui | — | — |

> **Regra:** No Claude Code, sempre use `!` na frente de npm/node/clasp/playwright/python.
> No Git Bash e PowerShell, rode direto sem `!`.

---

## 2. COMO ABRIR CADA FERRAMENTA

| Ferramenta | Como abrir |
|---|---|
| **Claude Code** | PowerShell → `$env:PATH += ";C:\Users\cardi\.local\bin"` → `cd "G:\Meu Drive\Investimentos"` → `claude` |
| **Claude for Chrome** | Ícone da extensão Claude no Chrome (deviceId: 25255383-6a03-4f8d-83d8-41c8c8a5be36) |
| **Git Bash** | Botão direito na pasta → "Git Bash here" |
| **PowerShell** | Win + X → Terminal / PowerShell |

> **Modelo recomendado no Claude Code:** `/model claude-sonnet-4-6` (Sonnet pra tarefas simples, Opus pra problemas complexos)
> **PATH fix necessário** a cada sessão do Claude Code até aplicar: `[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Users\cardi\.local\bin", "User")`

---

## 3. CONECTORES MCP ATIVOS (disponíveis neste chat)

| Conector | O que faz |
|---|---|
| **Google Drive** | Lê e busca arquivos do Drive |
| **Gmail** | Lê, cria rascunhos, organiza emails |
| **Google Calendar** | Lê, cria e edita eventos |
| **Microsoft 365** | OneDrive, Outlook, Teams |
| **Claude for Chrome** | Controla o Chrome aberto — navega, clica, tira screenshot |

---

## 4. PROJETO CARTEIRA — REFERÊNCIA TÉCNICA

### Arquitetura
- **Planilha** (fonte de verdade): ID `1Cf4S59nzrWpNZIWyqHs9CAcu6o2at8nQpKOr68huj44`
- **Backend** Apps Script **v3.4.3** — deploy **@23** ativo
- **Frontend** GitHub Pages: `https://viniciusmarinaccipsi-art.github.io/investimentos/`
- **Repo Git**: `https://github.com/viniciusmarinaccipsi-art/investimentos`
- **Pasta local**: `G:\Meu Drive\Investimentos\`
- **APP_VERSION atual**: **4.6**

### IDs importantes
- **Script ID Apps Script**: `1OIgyQTvp0MvJD_Ug5dXOAQHEfKtPh7_YNWxRTGM6KKGCfCvIoIb4xH3O`
- **Deployment ID ativo** (NUNCA mudar): `AKfycbwVRDJTUuTMqSG0aNuU1xzVkvSbUxG-Tf_dHq87YaHXGL0ow_WrWwIuF0yeG9nPpRSCUA`
- **Token app**: configurado no PropertiesService (`TOKEN`)
- **Token relay**: configurado no PropertiesService (`RELAY_TOKEN`) = `radar_mln_2026_xK9p`

### Cloud Function Relay (Meelion)
- **URL**: `https://meelion-relay-mlqhnhvrlq-rj.a.run.app`
- **Projeto GCP**: `formularios-pesquisa` (ID: 797600335663)
- **Região**: southamerica-east1 (São Paulo)
- **Runtime**: Python 3.11
- **Token**: `radar_mln_2026_xK9p` (variável de ambiente `RELAY_TOKEN`)
- **Função**: Proxy que contorna o WAF Hostinger (bloqueia `Accept-Encoding` do Google). Aceita `?token=X&url=Y&cookie=Z` (cookie é opcional, pra acesso PRO).
- **Código local**: `G:\Meu Drive\Investimentos\cloud_function\main.py`
- **Deploy**: `gcloud functions deploy meelion-relay --gen2 --runtime=python311 --region=southamerica-east1 --source="G:\Meu Drive\Investimentos\cloud_function" --entry-point=relay --trigger-http --allow-unauthenticated --memory=256MB --timeout=60s --max-instances=5 --set-env-vars="RELAY_TOKEN=radar_mln_2026_xK9p"`
- **Max instâncias**: 5 (anti-abuso)
- **Custo**: R$0 (free tier — ~20 requests/dia, limite = 2 milhões/mês)

### GCP
- **Conta**: viniciusmarinacci.psi@gmail.com
- **2FA**: ativado (Google Authenticator) — obrigatório desde abril/2026
- **Faturamento**: ativo (free tier, R$1.727 créditos, 90 dias)
- **APIs ativas**: Cloud Functions, Cloud Build, Cloud Run Admin

### Abas da planilha
`Investimentos` · `TitulosResgatados` · `Proventos` · `Aportes` · `Indices` · `Radar`

### Abas do frontend (10 total)
| Aba | Descrição |
|---|---|
| **Visão Geral** | KPIs (XIRR, patrimônio, rendimento), donuts SVG por instituição/indexador/liquidez/isenção, card FGC |
| **Carteira** | Tabela de ativos ativos com ordenação por 6 critérios |
| **Consolidado** | Visão agregada por grupo/tipo |
| **Proventos** | Cupons e proventos previstos e pagos |
| **Projeções** | Projeção individual de cada ativo até o vencimento com IR detalhado |
| **Resgatados** | Leitura dos ativos já resgatados |
| **Evolução** | Gráfico Chart.js 3 linhas + KPIs (XIRR 15,43% a.a., 107,1% CDI) + tabela anual |
| **Metas** | Simulador de metas financeiras com cenários, presets, gráfico |
| **📡 Radar** | Radar diário de renda fixa — dados do Meelion + Tesouro Direto |
| **Configurações** | URL do Apps Script, token, índices manuais |

### Radar Diário de Renda Fixa
- **Trigger**: diário às 7h (criado via `criarTriggerRadar()`)
- **Fontes**: Meelion (via Cloud Function relay, 9 buscas × até 3 páginas) + Tesouro Direto (API JSON direta)
- **Filtros (thresholds)**: CDI diária ≥102% · CDI prazo ≥115% · IPCA+ ≥9% · Pré ≥15% · CDI+ ≥2% · Aporte ≤R$10k
- **Output**: Email HTML com destaques + salva na aba Radar da planilha
- **Status**: Funcionando (12 ativos/página em todos os tipos). Parser (`parsearCardsHTML`) precisa refinamento (duplicatas + categorias faltando).

### Funções do backend (v3.3.2)
**CRUD Investimentos:** `addInv`, `editInv`, `delInv`, `resgatarAtivo`
**CRUD Proventos:** `addProv`, `editProv`, `delProv`
**Leitura:** `listarTudo`, `listarRadar`, `buscarIndices`, `lerAba`
**Radar:** `buscarMeelion`, `buscarTesouro`, `parsearCardsHTML`, `filtrarRadar`, `salvarRadar`, `enviarEmailRadar`, `radarDiario`, `criarTriggerRadar`
**Migração:** `migrarParaV4`, `migrarParaV5`, `migrarParaV6`
**Utilidades:** `setRelayToken`, `salvarIndices`, `normalizarAtivoRd`, `encontrarLinha`, `deletarLinhasPorColuna`
**Índices BCB:** CDI (4389), SELIC (1178), IPCA (13522), IGP-M (189)

---

## 5. COMANDOS DO DIA A DIA

### Frontend (index.html)
```bash
git add index.html
git commit -m "descrição da mudança"
git push
```

### Backend (Apps Script)
```bash
clasp push --force
clasp deploy --deploymentId AKfycbwVRDJTUuTMqSG0aNuU1xzVkvSbUxG-Tf_dHq87YaHXGL0ow_WrWwIuF0yeG9nPpRSCUA --description "descrição"
```

### Cloud Function
```bash
cd "G:\Meu Drive\Investimentos\cloud_function"
gcloud functions deploy meelion-relay --gen2 --runtime=python311 --region=southamerica-east1 --source=. --entry-point=relay --trigger-http --allow-unauthenticated --memory=256MB --timeout=60s --max-instances=5 --set-env-vars="RELAY_TOKEN=radar_mln_2026_xK9p"
```

### Verificar estado
```bash
clasp deployments       # lista versões do Apps Script
git log --oneline -5    # últimos commits
git status              # arquivos modificados
gcloud functions describe meelion-relay --region=southamerica-east1  # status da Cloud Function
```

---

## 6. REGRAS IMPORTANTES DO PROJETO

1. **Token nunca vai pro Git** — está no PropertiesService do Apps Script
2. **4 arquivos versionados**: .gitignore, index.html, GUIA_PROJETO_CARTEIRA.md, Código.js
3. **Sempre usar o mesmo deploymentId** — nunca criar nova implantação
4. **.claspignore** criado — push envia só Código.js + appsscript.json
5. **Planilha = fonte de verdade** — nunca editar dados direto no código
6. **Projeto Carteira não se mistura com outros projetos** (Clínica VMC, pesquisa SUS, etc.)
7. **RELAY_TOKEN** está em 2 lugares: PropertiesService do Apps Script + variável de ambiente da Cloud Function. Ambos precisam ser atualizados se mudar.

---

## 7. COMO TRABALHAR COM O CLAUDE

| Objetivo | Usar |
|---|---|
| Decidir, planejar, perguntar | Este chat (claude.ai) |
| Editar código + Git + clasp | Claude Code (ou PowerShell se Claude Code der 401) |
| Controlar Chrome visualmente | Claude for Chrome (via este chat) |
| Ler emails/drive/calendar | Conectores MCP (já ativos aqui) |
| Deploy Cloud Function | PowerShell com gcloud |
| Testes automatizados | Playwright (instalado) |

> **Fluxo ideal:** Decide aqui no chat → Claude Code executa → Chrome verifica visualmente
> **Fallback PowerShell:** Se Claude Code der erro 401, editar via `Get-Content`/regex/`Out-File` + `clasp push`

---

## 8. HISTÓRICO

### 09/06/2026
- [x] **Código.js versionado no Git** (commit 100b3f3) — .gitignore ajustado
- [x] **Tag v4.5-stable** criada (commit 7a562cc)
- [x] **Feature Aportes descartada** — cada aplicação já gera título separado nas corretoras
- [x] **Radar Diário implementado** — backend v3.3.0 (@16) com 9 tipos Meelion + Tesouro Direto
- [x] **Frontend v4.6** — 10ª aba 📡 Radar
- [x] **Cloud Function relay deployada** — bypass WAF Hostinger
- [x] **gcloud CLI instalado** (v571.0.0) e autenticado
- [x] **2FA Google ativado** (Google Authenticator)
- [x] **buscarMeelion via relay** — v3.3.2 deploy @18 (commit 9a90f0d)
- [x] **radarDiario() testado com sucesso** — 229 ativos escaneados, 32 destaques, email enviado
- [x] **Trigger diário 7h** criado via criarTriggerRadar()
- [x] **Bug identificado no parsearCardsHTML()** — duplicatas (mesmo card 16x) + categorias faltando. Refinamento pendente.
- [x] **Radar PRO v2 implementado** (v3.4.0 deploy @19) — 2 fontes Meelion (Comparador PRO paginado + Maiores Rent.), cookies via PropertiesService, fallback deslogado automático, email dual-coluna (Taxa Bruta + Líq. a.a. + vsCDI), Cloud Function atualizada com suporte a `&cookie=`
- [x] **Modo PRO confirmado**: 193 ativos Meelion (17 páginas) vs 9 deslogados. PHPSESSID salvo via `salvarCookiesMeelion()`
- [x] **Fix v3.4.1 deploy @20** — taxaBruta captura formato CDI+/IPCA+, indexador Tesouro Renda+/Educa+ → IPCA+, Reserva → CDI
- [x] **Fix v3.4.2 deploy @21** — listarRadar/listarTudo: aba Radar não tem coluna id, bypass do filtro lerAba()
- [x] **Fix v3.4.3 deploy @23** — salvarRadar formata colunas como texto (@) antes de gravar (evita Sheets converter "18,44%" em 0.1844), botão "Atualizar Radar" agora lê dados salvos (carregarDaPlanilha) em vez de re-executar o radar inteiro
- [x] **Radar PRO com cookies Meelion** (concluído — movido das pendências)

### 08/06/2026
- [x] Aba Metas, Aba Evolução, Feature TitulosResgatados, 3 novos ativos registrados
- [x] Backend v3.2.3 deploy @15, Frontend v4.5 commit 0788754

### 02/06/2026
- [x] Token migrado pro PropertiesService, ambiente dev instalado, IGP-M BCB

---

## 9. PENDÊNCIAS

### Imediato (próxima sessão)
- [ ] **Rodar radarDiario()** uma vez no Apps Script editor para regravar dados com formato texto correto (fix v3.4.3)
- [ ] **Renovar cookies Meelion** quando radar voltar a trazer poucos ativos (PHPSESSID expira em horas)
- [ ] **Fix parsearCardsHTML()** — corrigir duplicatas e categorias faltando. Manus inspeciona DOM do Meelion, entrega função corrigida, eu aplico.
- [ ] **Atualizar filtrarRadar() e enviarEmailRadar()** — campos do parser mudaram (taxaLiqAnual, corretora, vsCdi vs taxa, taxaLabel, fgc, distribuidor)
- [ ] **Remover setRelayToken()** do Código.js (função temporária já executada)
- [ ] **Remover Código.js.bak** da pasta do projeto
- [ ] **Permanent PATH fix**: `[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Users\cardi\.local\bin", "User")`
- [ ] **Atualizar GUIA no repo**: `git add GUIA_PROJETO_CARTEIRA.md && git commit -m "docs: guia atualizado 09/06" && git push`

### Médio prazo
- [ ] **Automatizar verificação com Playwright**
- [ ] **Performance tab** (TIR/XIRR recalculada)

### Longo prazo
- [ ] **GitHub Action pra backup diário da planilha**
- [ ] **Git tag v4.6-stable** após validação completa
