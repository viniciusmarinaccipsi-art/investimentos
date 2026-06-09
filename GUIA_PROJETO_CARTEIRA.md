# GUIA DE REFERÊNCIA — Projeto Carteira de Investimentos
> Versão: 08/06/2026 | Salve este arquivo e cole nas instruções do projeto no Claude

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
| Claude Code | v2.1.158 | abre aqui | — | — |

> **Regra:** No Claude Code, sempre use `!` na frente de npm/node/clasp/playwright/python.
> No Git Bash e PowerShell, rode direto sem `!`.

---

## 2. COMO ABRIR CADA FERRAMENTA

| Ferramenta | Como abrir |
|---|---|
| **Claude Code** | PowerShell → `cd "G:\Meu Drive\Investimentos"` → `claude` |
| **Claude for Chrome** | Ícone da extensão Claude no Chrome |
| **Git Bash** | Botão direito na pasta → "Git Bash here" |
| **PowerShell** | Win + X → Terminal / PowerShell |

> **Modelo recomendado no Claude Code:** `/model claude-sonnet-4-6` (Sonnet pra tarefas simples, Opus pra problemas complexos)

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

## 4. FERRAMENTAS NATIVAS DO CLAUDE (este chat)

| Ferramenta | O que faz |
|---|---|
| Web Search | Busca informações atuais na internet |
| Web Fetch | Lê conteúdo completo de uma URL |
| Image Search | Busca imagens na web |
| Weather | Clima atual de qualquer cidade |
| Places Search + Map | Busca lugares e exibe mapas |
| Sports Data | Resultados esportivos ao vivo |
| Visualizer | Cria diagramas, SVGs, gráficos inline |
| Artifacts | Cria arquivos HTML, React, Markdown |
| Computer (bash) | Roda código Python, cria arquivos no servidor |
| Past Chats Search | Busca em conversas anteriores |
| Memory | Salva informações entre conversas |
| Recipe Display | Exibe receitas interativas |
| Message Compose | Redige emails e mensagens com variantes |
| Ask User Input | Apresenta opções clicáveis |
| MCP Registry | Busca novos conectores disponíveis |

---

## 5. SKILLS DISPONÍVEIS

| Skill | Quando usar |
|---|---|
| **clinica-vmc** | App TCC — sistema de psicologia |
| **frontend-design** | Criar interfaces web de alta qualidade |
| **docx** | Criar/editar documentos Word |
| **pdf** | Ler/criar/manipular PDFs |
| **pptx** | Criar apresentações PowerPoint |
| **xlsx** | Criar/editar planilhas Excel |
| **data-visualization** | Gráficos com Python |
| **algorithmic-art** | Arte generativa com código |

---

## 6. PROJETO CARTEIRA — REFERÊNCIA TÉCNICA

### Arquitetura
- **Planilha** (fonte de verdade): ID `1Cf4S59nzrWpNZIWyqHs9CAcu6o2at8nQpKOr68huj44`
- **Backend** Apps Script v3.2.3 — deploy @15 ativo (ping reporta "3.2.3")
- **Frontend** GitHub Pages: `https://viniciusmarinaccipsi-art.github.io/investimentos/`
- **Repo Git**: `https://github.com/viniciusmarinaccipsi-art/investimentos`
- **Pasta local**: `G:\Meu Drive\Investimentos\`
- **APP_VERSION atual**: `4.5` (commit 710e910)

### IDs importantes
- **Script ID Apps Script**: `1OIgyQTvp0MvJD_Ug5dXOAQHEfKtPh7_YNWxRTGM6KKGCfCvIoIb4xH3O`
- **Deployment ID ativo**: `AKfycbwVRDJTUuTMqSG0aNuU1xzVkvSbUxG-Tf_dHq87YaHXGL0ow_WrWwIuF0yeG9nPpRSCUA`
- **Token**: configurado no PropertiesService do Apps Script (não está no código)

### Abas da planilha
`Investimentos` · `TitulosResgatados` · `Proventos` · `Aportes` · `Indices`

### Abas do frontend (9 total)
| Aba | Descrição |
|---|---|
| **Visão Geral** | KPIs (XIRR, patrimônio, rendimento), donuts SVG por instituição/indexador/liquidez/isenção, card FGC |
| **Carteira** | Tabela de ativos ativos com ordenação por 6 critérios (data aplicação ↑↓, vencimento ↑↓, valor bruto ↑↓) |
| **Consolidado** | Visão agregada por grupo/tipo |
| **Proventos** | Cupons e proventos previstos e pagos |
| **Projeções** | Projeção individual de cada ativo até o vencimento com IR detalhado por evento de cupom |
| **Resgatados** | Leitura dos ativos já resgatados (2 RDBs Nubank: R$2.920,52 + R$168,26) |
| **Evolução** | Gráfico Chart.js com 3 linhas (Patrimônio Total verde, Capital Investido azul tracejado, Capital Retornado dourado) + KPIs (XIRR 15,43% a.a., 107,1% CDI) + tabela Resumo por Ano 2024–2032 |
| **Metas** | Simulador de metas financeiras: `simularMeta()`, presets CDI líq./Moderado/XIRR/Otimista com subtítulos pedagógicos, tabela 5×4 cenários, gráfico Chart.js com marcador 🎯, insight de aceleração, frase narrativa dinâmica |
| **Configurações** | URL do Apps Script, token, índices manuais |

### Funções-chave do frontend
- `projetarVenc(inv)` — retorna bruto/IR/líquido/cupons/isenção até o vencimento
- `projetarBrutoEm(inv, mesRefISO)` — projeta o valor de mercado do ativo em qualquer mês futuro (usado na aba Evolução)
- `xirrCarteira()` — XIRR Newton-Raphson sobre todos os fluxos (aportes + valorBruto atual)
- `gerarDadosEvolucao()` — mês a mês: separa `investido` (ativos ativos) e `retornado` (líquido acumulado dos vencidos)
- `resgatarAtivo(p)` — backend: move ativo de Investimentos → TitulosResgatados com 4 campos extras
- `simularMeta(patrimonioInicial, aporte, taxa, meta)` — juros compostos mês a mês, retorna tempo/composição/pontos para o gráfico
- `calcCdiLiquido()` — CDI líquido ponderado pelo % de ativos isentos da carteira (LCI/LCA/CRI/CRA/isentaIR)
- `calcAporteMedio()` — média mensal de aportes desde jan/2024, arredondada ao R$500 mais próximo
- `buildTaxaLabel(taxa, modoTaxa, indexador)` — helper único para rótulo correto dos 4 indexadores (Prefixado/CDI/CDI+/IPCA+)

---

## 7. COMANDOS DO DIA A DIA

### Frontend (index.html)
```bash
git add index.html
git commit -m "descrição da mudança"
git push
```
> GitHub Pages republica em ~60 segundos

### Backend (Apps Script)
```bash
clasp push --force
clasp deploy --deploymentId AKfycbwVRDJTUuTMqSG0aNuU1xzVkvSbUxG-Tf_dHq87YaHXGL0ow_WrWwIuF0yeG9nPpRSCUA --description "descrição"
```
> Sempre usar o mesmo deploymentId pra preservar a URL

### Verificar estado
```bash
clasp deployments       # lista versões do Apps Script
git log --oneline -5    # últimos commits do frontend
git status              # arquivos modificados
```

---

## 8. REGRAS IMPORTANTES DO PROJETO

1. **Token nunca vai pro Git** — está no PropertiesService do Apps Script
2. **index.html é o único arquivo versionado** — Código.js fica só local + Apps Script
3. **Sempre usar o mesmo deploymentId** — nunca criar nova implantação
4. **.claspignore** criado — push envia só Código.js + appsscript.json
5. **Planilha = fonte de verdade** — nunca editar dados direto no código
6. **Projeto Carteira não se mistura com outros projetos** (Clínica VMC, pesquisa SUS, etc.)

---

## 9. COMO TRABALHAR COM O CLAUDE

| Objetivo | Usar |
|---|---|
| Decidir, planejar, perguntar | Este chat (claude.ai) |
| Editar código + Git + clasp | Claude Code |
| Controlar Chrome visualmente | Claude for Chrome (via este chat) |
| Ler emails/drive/calendar | Conectores MCP (já ativos aqui) |
| Testes automatizados | Playwright (instalado) |
| Criar documentos/planilhas | Skills docx/xlsx/pptx |

> **Fluxo ideal:** Decide aqui no chat → Claude Code executa → Chrome verifica visualmente

---

## 10. PENDÊNCIAS DO PROJETO

- [ ] Permanent PATH fix for Claude Code: `[Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';C:\Users\cardi\.local\bin', 'User')`

### Concluído em 08/06/2026
- [x] **Aba Metas** — simulador com cenários, gráfico, presets pedagógicos, insight de aceleração, frase narrativa dinâmica
- [x] **Melhorias UX Metas** — banner introdutório, tooltips nativos, presets com subtítulos, narrativa dinâmica, insight de aceleração, marcador 🎯 no gráfico (commit 0788754)
- [x] **Refatoração buildTaxaLabel()** — helper único para 4 indexadores (Prefixado/CDI/CDI+/IPCA+), eliminou duplicação lógica
- [x] **Novos ativos registrados**: CDB C6 Exclusivo Pré 6a (R$10k, 16% a.a.), CDB C6 Exclusivo IPCA+ 4a (R$10k, IPCA+9,10%), CRA Minerva E272 S1 (R$2.036,62, 105% CDI)
- [x] **Feature TitulosResgatados** — backend `resgatarAtivo()` + modal de resgate no frontend; aba Resgatados só-leitura
- [x] **2 RDBs Nubank registrados como resgatados** — Nu Financeira R$2.920,52 e R$168,26
- [x] **Aba Evolução** — gráfico patrimonial Chart.js 3 datasets (não empilhados), KPIs XIRR, tabela Resumo por Ano 2024–2032, função `projetarBrutoEm()`
- [x] **Fix projeção futura** — vencimentos não causam mais queda no patrimônio: `patrimônio = investido + retornado` (líquido acumulado dos vencidos)
- [x] **Fix IR por evento de cupom** (Lei 11.033/2004) — alíquota regressiva individual por cupom em `projetarVenc()`
- [x] **Fix rendimento negativo por IR no último ano** — clamp em R$0 com nota `(IR > juros)` e tooltip explicativo
- [x] **Ordenação na aba Carteira** — select com 6 opções (data aplicação ↑↓, vencimento ↑↓, valor bruto ↑↓)
- [x] **XIRR (TIR real)** — Newton-Raphson no KPI da Visão Geral
- [x] **Backend v3.2.3** — sanitização JSONP callback + LockService nas 8 funções de escrita (deploy @15)

### Concluído em 02/06/2026
- [x] Fix leitura dos índices da planilha (deploy @14, confirmado: CDI 14,40% carregando)
- [x] Índices zerados ao abrir o app (commit 061c3b2)
- [x] IGP-M via BCB série 189
- [x] Token migrado pro PropertiesService
- [x] clasp instalado e configurado
- [x] Playwright instalado
- [x] ping sincronizado pra reportar v3.2.2 (deploy @14)
- [x] **v4.2 — Visão Geral reformulada** (commit 1570fd6):
  - `barRow` corrigida: largura da barra agora usa `val/tot` (% do total) em vez de `val/max`
  - Gráficos de Instituição, Indexador, Liquidez e Isenção de IR convertidos para **donuts SVG**
  - Cores dos bancos: C6=amarelo `#f5c518`, Inter=laranja `#f5853f`, Neon=azul `#5aa9e6`, Nubank=roxo

### Concluído em 03/06/2026
- [x] **v4.2 (ajustes donuts)** (commits 95c7a3b):
  - `fmtCompact()`: texto central dos donuts em formato compacto (`"R$ 54,7 mil"`)
  - Paleta coesa nos donuts não-banco: CDI=teal `#2dd4bf`, Prefixado=rosa `#fb7185`, IPCA+=cinza `#94a3b8`, Travado=cinza, Isentos=verde, Tributáveis=rosa
  - Anel do donut: `stroke-width` 20→16 (mais fino); fonte central 14→12.5px
- [x] **v4.3 — Card FGC + responsividade mobile** (commit c33bb97):
  - Novo card "Cobertura FGC" na Visão Geral: donut Coberto(verde)/Fora(rosa) + barras por emissor agrupadas por conglomerado (Banco C6 + C6 Consignado = "Grupo C6") + bloco "Fora do FGC por tipo" + nota explicativa
  - Regra: FGC cobre CDB/RDB/LCI/LCA; CRI/CRA/Debênture ficam fora; teto R$ 250k por CPF por conglomerado
  - Responsividade mobile completa: nav rolável em 1 linha, KPIs sem cortar, tabelas viram cards empilhados com rótulo (`data-label`) em cada célula abaixo de 768px; KPIs 1 coluna abaixo de 430px
  - Função `aplicarDataLabels()` adicionada; chamada em `renderAll()` e no fim de `renderCarteira()`
- [x] **v4.4 — Layout FGC sem vazio** (commit fb282b3):
  - Card FGC deixou de usar `grid2` (que gerava espaço vazio abaixo do donut curto) e virou um card único de largura total
  - Internamente: `.fgc-wrap` (flex row) com `.fgc-left` (donut 220px + legenda) e `.fgc-right` (emissores + nota)
  - No mobile ≤768px o layout dobra para coluna única (`flex-direction: column`)

---

## 11. PRÓXIMOS PASSOS (roadmap)

### Curto prazo (próxima sessão)
1. [x] **Registrar RDB Nubank resgatados** — concluído em 08/06/2026 (R$2.920,52 + R$168,26 na aba Resgatados)
2. [x] **Reescrever as instruções do projeto no Claude** — concluído em 08/06/2026 (este guia)

### Médio prazo (evolução)
3. **Versionar o Código.js no Git** — agora que o token está no PropertiesService, o backend pode ir pro Git com segurança. Hoje só o index.html e o guia são versionados. Isso cria backup do backend e histórico de mudanças.
4. **Git tags pra versões estáveis** — marcar releases com `git tag v4.5-stable` (versão atual) pra ter pontos de retorno claros.
5. **Automatizar verificação com Playwright** — script que abre o app, clica "Atualizar do BCB" e confirma os 4 índices automaticamente, sem verificação manual.
6. **Daily radar automation** — monitoramento automatizado de ofertas de renda fixa via Meelion ou Apps Script (BTG, Inter, XP, C6, Nubank) para capturar oportunidades acima da meta de taxa.
7. **Feature Aportes** — a aba Aportes existe na planilha mas não tem interface no app: registrar aportes adicionais a um mesmo ativo ao longo do tempo.

### Longo prazo (opcional)
8. **GitHub Action pra backup diário** — exportar a planilha automaticamente todo dia via Apps Script.

---

## 12. FLUXO DE DEPLOY (passo a passo testado)

### Frontend (index.html) — via Claude Code
```
1. Claude Code edita o index.html
2. node --check (valida sintaxe, opcional)
3. git add index.html
4. git commit -m "descrição"
5. git push
6. GitHub Pages republica em ~60s
```

### Backend (Código.js) — via Claude Code + clasp
```
1. Claude Code edita o Código.js
2. clasp push --force
3. clasp deploy --deploymentId AKfycbwVRDJTU... --description "versão"
4. (testar) ping deve reportar a versão nova
```

> NUNCA criar nova implantação — sempre usar o mesmo deploymentId, senão a URL muda e o app quebra.
> Após editar o token, cadastrar em: Apps Script → ⚙ Configurações → Propriedades do script → TOKEN.
