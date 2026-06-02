# GUIA DE REFERÊNCIA — Projeto Carteira de Investimentos
> Versão: 02/06/2026 | Cole nas instruções do projeto no Claude

---

## 1. Ferramentas Instaladas

| Ferramenta | Versão | PowerShell | Git Bash | Claude Code |
|---|---|---|---|---|
| Node.js | v24.16.0 | ✅ | ✅ | ✅ com `!` |
| npm | v11.13.0 | ✅ | ✅ | ✅ com `!` |
| clasp | v3.3.0 | ✅ | ✅ | ✅ com `!` |
| Git | v2.54.0 | ✅ | ✅ | ✅ |
| Playwright | v1.60.0 | ✅ | ✅ | ✅ com `!` |
| Python | v3.14.3 | ✅ | ✅ | ✅ com `!` |

> **Regra:** No Claude Code, use `!` na frente de npm/node/clasp/playwright/python. Git roda sem `!`.

---

## 2. Como Abrir Cada Ferramenta

| Ferramenta | Como abrir |
|---|---|
| **Claude Code** | PowerShell → `cd "G:\Meu Drive\Investimentos"` → `claude` |
| **Claude for Chrome** | Ícone da extensão Claude no Chrome |
| **Git Bash** | Botão direito na pasta → "Git Bash here" |
| **PowerShell** | Win + X → Terminal / PowerShell |

> **Modelo recomendado no Claude Code:** `/model claude-sonnet-4-6`

---

## 3. Conectores MCP Ativos

| Conector | O que faz |
|---|---|
| **Google Drive** | Lê e busca arquivos do Drive |
| **Gmail** | Lê, cria rascunhos, organiza emails |
| **Google Calendar** | Lê, cria e edita eventos |
| **Microsoft 365** | OneDrive, Outlook, Teams |
| **Claude for Chrome** | Controla o Chrome aberto |

---

## 4. Ferramentas Nativas do Claude

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
| Message Compose | Redige emails e mensagens com variantes |
| Ask User Input | Apresenta opções clicáveis |
| MCP Registry | Busca novos conectores disponíveis |

---

## 5. Skills Disponíveis

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

## 6. Projeto Carteira — Referência Técnica

### Arquitetura

| Componente | Detalhe |
|---|---|
| **Planilha** (fonte de verdade) | ID `1Cf4S59nzrWpNZIWyqHs9CAcu6o2at8nQpKOr68huj44` |
| **Backend** | Apps Script v3.2.2 — deploy @13 ativo |
| **Frontend** | `https://viniciusmarinaccipsi-art.github.io/investimentos/` |
| **Repo Git** | `https://github.com/viniciusmarinaccipsi-art/investimentos` |
| **Pasta local** | `G:\Meu Drive\Investimentos\` |

### IDs Importantes

| Item | Valor |
|---|---|
| **Script ID** | `1OIgyQTvp0MvJD_Ug5dXOAQHEfKtPh7_YNWxRTGM6KKGCfCvIoIb4xH3O` |
| **Deployment ID ativo** | `AKfycbwVRDJTUuTMqSG0aNuU1xzVkvSbUxG-Tf_dHq87YaHXGL0ow_WrWwIuF0yeG9nPpRSCUA` |
| **Token** | No PropertiesService do Apps Script (não está no código) |

### Abas da Planilha

`Investimentos` · `TitulosResgatados` · `Proventos` · `Aportes` · `Indices`

---

## 7. Comandos do Dia a Dia

### Frontend (index.html)
```bash
git add index.html
git commit -m "feat: descrição"
git push
# GitHub Pages republica em ~60s
```

### Backend (Apps Script)
```bash
clasp push --force
clasp deploy --deploymentId AKfycbwVRDJTUuTMqSG0aNuU1xzVkvSbUxG-Tf_dHq87YaHXGL0ow_WrWwIuF0yeG9nPpRSCUA --description "v3.x - descrição"
```

### Verificação
```bash
clasp deployments          # lista implantações
git log --oneline -5       # últimos commits
git status                 # estado do repositório
```

---

## 8. Regras do Projeto

- Token **nunca** no Git — usar PropertiesService
- Apenas `index.html` é versionado no Git (GitHub Pages)
- Sempre usar o **mesmo deployment ID** — nunca criar um novo
- `.claspignore` criado — arquivos antigos de versão não são enviados
- Planilha é a **fonte de verdade** — o app é leitor + editor pontual
- Não misturar arquivos de outros projetos na pasta

---

## 9. Como Trabalhar (Fluxo)

| Onde | Para quê |
|---|---|
| **Este chat** | Decidir, planejar, pesquisar |
| **Claude Code** | Editar código, rodar Git/clasp, criar arquivos |
| **Claude for Chrome** | Controlar o Chrome, verificar o app visualmente |
| **Conectores MCP** | Ler emails, Drive, Calendar |
| **Playwright** | Testes automatizados de interface |
| **Skills (docx/pdf/etc)** | Criar documentos |

> **Fluxo:** decide no chat → Code executa → Chrome verifica.

---

## 10. Pendências e Histórico

### Pendente
- Registrar RDB Nubank resgatados R$ 3.090,17 na aba `TitulosResgatados`
- Reescrever instruções do projeto

### Concluído em 02/06/2026
- Fix leitura de índices da planilha (deploy @13)
- Índices zerados ao abrir o app (sem fallback hardcoded)
- IGP-M via BCB série 189 adicionado
- Token migrado para PropertiesService
- `.claspignore` criado — arquivos antigos removidos do deploy
- clasp v3.3.0 e Playwright instalados
