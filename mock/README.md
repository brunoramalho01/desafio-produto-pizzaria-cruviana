# Mock de delivery — Pizzaria Cruviana

Backend falso para **quem quiser construir com código** (o front-end do sistema).
É **opcional**: se você vai entregar só um protótipo navegável (Figma), não precisa dele.

**Sem dependências** — roda só com Node (>= 18):

```bash
node mock/server.js
```

Sobe em `http://localhost:4000` (mude com a env `PORT`).

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/pizzaria` | Nome e **localização** da pizzaria (origem das rotas) |
| `GET` | `/orders` | Pedidos ativos, com **endereço e coordenadas** |
| `GET` | `/orders/:id` | Um pedido |
| `PATCH` | `/orders/:id` | Muda `stage` e/ou atribui entregador — `{ "stage": "OUT_DELIVERY", "driverId": 2 }` |
| `POST` | `/orders/:id/feedback` | Satisfação do cliente — `{ "rating": 5, "comment": "..." }` (rating de 1 a 5) |
| `GET` | `/drivers` | Entregadores, com **localização atual** |
| `GET` | `/events` | Stream **SSE** em tempo real |
| `GET` | `/health` | Healthcheck |

Erro de validação vem como `{ "error": "...", "code": "..." }`.

## Tempo real (SSE)

`GET /events` abre um stream. No connect manda um `snapshot` com `{ pizzaria, orders, drivers }`; depois empurra:

- `order.created` — pedido novo
- `order.updated` — mudou stage / entregador / cancelamento
- **`driver.moved`** — a localização de um entregador mudou (é o que permite **rastrear a moto** e calcular o ETA)
- `feedback.created` — o cliente avaliou o pedido (fecha o ciclo de satisfação)

```js
const es = new EventSource('http://localhost:4000/events');
es.addEventListener('driver.moved', (e) => console.log('moto', JSON.parse(e.data)));
es.addEventListener('order.updated', (e) => console.log('pedido', JSON.parse(e.data)));
```

O mock **simula a operação sozinho**: a cozinha avança os pedidos, um pedido pronto é despachado a um entregador livre, e a moto **anda em direção ao endereço** até entregar. Um pedido novo entra de vez em quando. Ajuste o ritmo com `TICK_MS` (ms), ex.: `TICK_MS=1500 node mock/server.js`.

## Formatos

**Pedido**
```json
{
  "id": 1,
  "reference": "#0001",
  "channel": "TELEFONE",
  "customer": { "name": "Bruno Almeida", "phone": "(11) 91531-4456" },
  "address": {
    "street": "Rua das Acácias", "number": "74",
    "neighborhood": "Jardim", "lat": -23.541007, "lng": -46.647577
  },
  "items": [ { "name": "Pizza Pepperoni", "quantity": 2 } ],
  "total": "284.00",
  "stage": "OUT_DELIVERY",
  "createdAt": "2026-09-23T13:51:57",
  "promisedMinutes": 30,
  "driverId": 1
}
```

**Entregador**
```json
{ "id": 1, "name": "Beto", "status": "ON_ROUTE", "lat": -23.5443, "lng": -46.6416, "orderIds": [1] }
```

- `channel`: `TELEFONE` | `WHATSAPP` | `APP`
- `stage`: `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `OUT_DELIVERY` → `DELIVERED`, ou `CANCELED`
- `promisedMinutes`: a promessa dos **30 minutos** (compare com `createdAt` pra saber se vai estourar)
- `driverId`: entregador atribuído, ou `null`
- `feedback`: `null` até o cliente avaliar; depois `{ rating (1–5), comment, at }` — a satisfação que fecha o ciclo
- coordenadas (`lat`/`lng`) fictícias, num bairro imaginário — servem pra **roteirizar** e pra **medir distância/ETA**

> Coordenadas e dados são fictícios. É um mock simples e cru — **pode mexer nele** (campos, endpoints, ritmo). Ler e estender código alheio faz parte.
