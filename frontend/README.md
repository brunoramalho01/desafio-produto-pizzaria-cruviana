# Pizzaria Cruviana — "30 min quente" (front-end)

Protótipo de rastreio e roteirização de entregas (React + TypeScript + Vite + Tailwind) que consome o mock `mock/server.js`. Plano completo em [../doc/Analise de Solução Pizzaria Cruviana_V1.md](<../doc/Analise de Solução Pizzaria Cruviana_V1.md>).

## Como rodar

**Com um clique (Windows):** dê dois cliques em [`iniciar.bat`](../iniciar.bat) na raiz do repositório. Ele instala as dependências na primeira vez, sobe o mock (porta 4000) e o front (porta 5173) em duas janelas e abre o navegador. Para encerrar, feche as duas janelas.

**Manualmente:**
Pré-requisito: Node 20+.

```bash
# 1) Mock (na raiz do repositório) — não usa npm, porta 4000
node mock/server.js

# 2) Front-end (em outro terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

> No PowerShell, se `npm` for bloqueado pela política de execução, use `npm.cmd`.

A URL do mock é configurável em `.env` (veja `.env.example`): `VITE_API_URL=http://localhost:4000`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos + build de produção |
| `npm test` | Testes (Vitest + Testing Library) |
| `npm run lint` | Lint (oxlint) |

## Telas

| Rota | Perfil | Função |
|---|---|---|
| `/despacho` | Téo (despacho) | Pedidos por estágio, SLA em cores, agrupamento por proximidade, atribuição de entregador |
| `/metricas` | Téo | Tempo médio, % no prazo, nota média, entregas por entregador, filtro por bairro |
| `/entregador` → `/entregador/:id` | Entregador | Próxima parada em destaque (vizinho mais próximo), botão "Entreguei" |
| `/pedido` → `/pedido/:id` | Cliente | Mapa com a moto, ETA, avaliação 1–5 após a entrega |

## Roteiro de demonstração (ciclo completo)

1. Suba o mock e o front; em `/` confira "Ao vivo" e o diagnóstico.
2. **Despacho** (`/despacho`): acompanhe pedidos chegando em tempo real; veja o SLA mudar de verde para amarelo e vermelho. Em um pedido pronto, clique em atribuir e escolha um entregador.
3. **Entregador** (`/entregador`): escolha o entregador; a lista mostra a próxima parada em destaque, na ordem da rota.
4. **Cliente** (`/pedido`): informe o número do pedido em `OUT_DELIVERY` e veja o mapa e o ETA mudando conforme `driver.moved`.
5. Volte ao entregador e toque em **Entreguei**; a tela do cliente passa a pedir a avaliação. Envie nota e comentário.
6. **Métricas** (`/metricas`): veja o tempo, o prazo, a nota e o ranking atualizados.

## Premissas e trade-offs

- **Mock imutável.** O `mock/server.js` não foi alterado; o front se adapta ao contrato dele.
- **Tempo real via SSE** (`EventSource` nativo), com reconexão automática e ressincronização pelo `snapshot`.
- **Hora da entrega.** O mock não informa quando o pedido foi entregue. O front registra o instante em que vê `order.updated` com `DELIVERED`; por isso tempo médio e % no prazo só valem para entregas vistas com a tela aberta e zeram ao recarregar. Nota e contagens usam todos os pedidos entregues.
- **Carga do entregador derivada dos pedidos**, pois o `PATCH` com `driverId` no mock não atualiza `driver.orderIds`. O mock também auto-despacha pedidos prontos para entregadores livres.
- **Rota:** heurística do vizinho mais próximo com distância haversine, sem trânsito nem TSP exato (fora do escopo do MVP).
- **ETA:** distância restante ÷ 25 km/h (velocidade média assumida).
- **SLA:** amarelo a partir de 70% e vermelho a partir de 100% do prazo prometido (`promisedMinutes`).
- **Mapa:** Leaflet + tiles OpenStreetMap, sem `react-leaflet`, para manter poucas dependências.
- **Ícones e navegação:** ícones `lucide-react` (sem emojis) e menu lateral recolhível (hambúrguer) com as telas principais.
- **Privacidade:** a tela do cliente mostra só o primeiro nome, sem telefone nem endereço completo.
- **Sem login:** o perfil é escolhido na tela inicial (protótipo).
- **Acessibilidade básica:** HTML semântico, link "Ir para o conteúdo", foco visível global, contraste ≥ 4,5:1 nos textos e botões principais, estados anunciados por `role="status"`/`alert`.