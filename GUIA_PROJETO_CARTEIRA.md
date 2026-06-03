# GUIA DE REFERÊNCIA — Projeto Carteira de Investimentos
> Versão: 02/06/2026 (atualizado) | Salve este arquivo e cole nas instruções do projeto no Claude

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
- **Backend** Apps Script v3.2.2 — deploy @14 ativo (ping reporta "3.2.2")
- **Frontend** GitHub Pages: `https://viniciusmarinaccipsi-art.github.io/investimentos/`
- **Repo Git**: `https://github.com/viniciusmarinaccipsi-art/investimentos`
- **Pasta local**: `G:\Meu Drive\Investimentos\`
- **APP_VERSION atual**: `4.2` (commit 1570fd6)

### IDs importantes
- **Script ID Apps Script**: `1OIgyQTvp0MvJD_Ug5dXOAQHEfKtPh7_YNWxRTGM6KKGCfCvIoIb4xH3O`
- **Deployment ID ativo**: `AKfycbwVRDJTUuTMqSG0aNuU1xzVkvSbUxG-Tf_dHq87YaHXGL0ow_WrWwIuF0yeG9nPpRSCUA`
- **Token**: configurado no PropertiesService do Apps Script (não está no código)

### Abas da planilha
`Investimentos` · `TitulosResgatados` · `Proventos` · `Aportes` · `Indices`

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

- [ ] Registrar RDB Nubank resgatados (R$3.090,17 em 30/05/2026) na aba TitulosResgatados — perguntar: proporcional ou valores exatos do extrato
- [ ] Reescrever instruções do projeto no Claude (remover dados obsoletos)

### Concluído em 02/06/2026
- [x] Fix leitura dos índices da planilha (deploy @14, confirmado: CDI 14,40% carregando)
- [x] Índices zerados ao abrir o app (commit 061c3b2)
- [x] IGP-M via BCB série 189
- [x] Token migrado pro PropertiesService
- [x] clasp instalado e configurado
- [x] Playwright instalado
- [x] ping sincronizado pra reportar v3.2.2 (deploy @14)
- [x] **v4.2 — Visão Geral reformulada** (commit 1570fd6):
  - `barRow` corrigida: largura da barra agora usa `val/tot` (% do total) em vez de `val/max` — o maior item não aparece mais 100% cheio com rótulo menor
  - Gráficos de Instituição, Indexador, Liquidez e Isenção de IR convertidos de barras/split para **donuts SVG** com legenda inline
  - Por Tipo de Produto mantém barras (agora proporcionais ao total)
  - Cores dos bancos atualizadas: C6 Bank = amarelo `#f5c518`, Inter Invest = laranja `#f5853f`, Neon = azul claro `#5aa9e6` (Nubank manteve roxo)
  - Novo CSS `.donut-wrap / .dn-*` adicionado; responsivo abaixo de 980px

---

## 11. PRÓXIMOS PASSOS (roadmap)

### Curto prazo (próxima sessão)
1. **Registrar RDB Nubank resgatados** — R$3.090,17 recebidos em 30/05/2026, dois ativos (inv_0080 aplic. R$2.600 e inv_0081 aplic. R$150, ambos 100% CDI Liq.Diária Nu Financeira). Decidir: distribuir o total proporcionalmente OU usar os valores exatos do extrato Nubank por ativo. Registrar na aba TitulosResgatados.
2. **Reescrever as instruções do projeto no Claude** — tirar dados obsoletos (token literal, estado financeiro congelado, números de commit antigos) e deixar só arquitetura estável + como trabalhar.

### Médio prazo (evolução)
3. **Versionar o Código.js no Git** — agora que o token está no PropertiesService, o backend pode ir pro Git com segurança. Hoje só o index.html e o guia são versionados. Isso cria backup do backend e histórico de mudanças.
4. **Git tags pra versões estáveis** — marcar releases com `git tag v4.2-stable` (versão atual) pra ter pontos de retorno claros.
5. **Automatizar verificação com Playwright** — script que abre o app, clica "Atualizar do BCB" e confirma os 4 índices automaticamente, sem verificação manual.

### Longo prazo (opcional)
6. **GitHub Action pra backup diário** — exportar a planilha automaticamente todo dia via Apps Script.
7. **Feature Aportes** — a aba Aportes existe na planilha mas ainda não tem interface no app.

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
