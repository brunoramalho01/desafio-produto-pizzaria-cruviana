# Desafio Pizzaria Cruviana

A Analise de Produto e o Protótipo de **roteirização e rastreio de entregas** para a Pizzaria Cruviana, desenvolvido como solução para o [Desafio de Produto · Pigz](doc/DESAFIO.md).

A dor do cenário, em uma frase: a pizza precisa chegar **quente, em até 30 minutos** — e hoje não chega, porque não existe roteirização, rastreio nem pesquisa de satisfação. Este repositório contém a análise de produto completa e um protótipo navegável (front-end) que resolve o ciclo **despacho → rota → rastreio → entrega → feedback → métricas**.

## Sumário

- [Documentação do projeto](#documentação-do-projeto)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como rodar o projeto](#como-rodar-o-projeto)
  - [Opção 1 — Um clique com `iniciar.bat` (Windows)](#opção-1--um-clique-com-iniciarbat-windows)
  - [Opção 2 — Passo a passo manual pelo terminal](#opção-2--passo-a-passo-manual-pelo-terminal)
- [Uso de IA](#uso-de-ia)

## Documentação do projeto

| Documento | Conteúdo |
| --- | --- |
| [doc/DESAFIO.md](doc/DESAFIO.md) | Enunciado original do desafio (cenário, missão e critérios da Pigz) |
| [doc/README.md](<doc/README.md>) | Análise de produto completa: requisitos, benchmark, fluxos, wireframes, métricas de sucesso e uso de IA |
| [frontend/README.md](frontend/README.md) | Detalhes do protótipo: telas, roteiro de demonstração, premissas e trade-offs |
| [mock/README.md](mock/README.md) | Contrato do backend mock (endpoints, eventos em tempo real e formatos de dados) |

## Estrutura do repositório

```
.
├── doc/          Documentação (desafio original, análise de produto e imagens de apoio)
├── frontend/     Protótipo navegável (React + TypeScript + Vite + Tailwind)
├── mock/         Backend mock em Node puro, com eventos em tempo real (SSE)
├── imagens/      Fotos do cenário (cardápio, cozinha, despacho e entrega)
└── iniciar.bat   Script de inicialização rápida (Windows)
```

## Como rodar o projeto

Existem duas formas de rodar o projeto: com o script pronto (`iniciar.bat`) ou manualmente, executando cada comando no terminal. Escolha a que preferir — o resultado final é o mesmo.

### Opção 1 — Um clique com `iniciar.bat` (Windows)

Essa é a forma mais rápida de ver o protótipo funcionando.

**Pré-requisito:** ter o [Node.js](https://nodejs.org) (versão LTS) instalado. O script avisa e interrompe a execução caso não encontre o Node.

**Passo a passo:**

1. Baixe ou clone este repositório na sua máquina.
2. Na pasta raiz do projeto, dê **dois cliques** no arquivo [`iniciar.bat`](iniciar.bat).
3. Aguarde — o script faz tudo sozinho:
   - verifica se o Node.js está instalado;
   - instala as dependências do front-end (`npm install`), mas só na primeira vez;
   - libera as portas `4000` e `5173`, caso tenham ficado ocupadas por uma execução anterior;
   - abre **duas janelas de terminal**: uma com o mock (`http://localhost:4000`) e outra com o front-end (`http://localhost:5173`);
   - abre o navegador automaticamente em `http://localhost:5173`.
4. Pronto! O protótipo já está rodando. Para fechar, basta fechar as duas janelas de terminal abertas (**"Mock - Cruviana"** e **"Front-end - Cruviana"**).

### Opção 2 — Passo a passo manual pelo terminal

Use esta opção se preferir rodar cada comando manualmente, entender o que acontece em cada etapa, ou se estiver em Linux/macOS (o `iniciar.bat` é exclusivo para Windows).

**Pré-requisitos:**
- [Node.js](https://nodejs.org) versão 20 ou superior.
- Um terminal (PowerShell, cmd, terminal do VS Code, etc).

**Passo 1 — Clone o repositório**

```bash
git clone <url-do-repositório>
cd "desafio-produto-pizzaria-cruviana"
```

**Passo 2 — Suba o backend mock**

O mock não tem dependências para instalar; ele roda direto com o Node, a partir da raiz do repositório:

```bash
node mock/server.js
```

Deixe este terminal aberto. Se tudo certo, o mock sobe em `http://localhost:4000` (a porta pode ser alterada com a variável de ambiente `PORT`).

**Passo 3 — Em um novo terminal, instale e rode o front-end**

Abra um **segundo terminal** (sem fechar o primeiro) e execute:

```bash
cd frontend
npm install
npm run dev
```

> No PowerShell, se o comando `npm` for bloqueado pela política de execução de scripts, use `npm.cmd install` e `npm.cmd run dev`.

Ao final, o terminal mostra o endereço do front-end, normalmente `http://localhost:5173`.

**Passo 4 — Abra o navegador**

Acesse `http://localhost:5173` para usar o protótipo.

**Passo 5 (opcional) — Confirme a URL do mock**

O front-end já vem configurado para falar com o mock em `http://localhost:4000` por padrão. Se quiser alterar isso (por exemplo, se mudou a porta do mock no Passo 2), copie o arquivo de exemplo e ajuste a variável:

```bash
cd frontend
copy .env.example .env   # no Linux/macOS: cp .env.example .env
```

Depois edite o `.env` e ajuste `VITE_API_URL` para a URL correta do mock.

## Uso de IA

Parte da estruturação de produto e da codificação do protótipo foi feita com apoio de IA, sempre com revisão e decisões finais minhas. Os detalhes de onde e como a IA foi usada — incluindo acertos e correções feitas durante o processo — estão descritos na seção **"Como a IA foi usada neste processo"** da [análise de produto](<doc/README.md>).
