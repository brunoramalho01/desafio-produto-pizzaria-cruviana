#!/usr/bin/env node
/**
 * Mock server do desafio de Produto — Pizzaria Cruviana (delivery).
 *
 * Sem dependências: roda só com Node (>= 18).
 *   node mock/server.js
 *
 * É OPCIONAL: só serve pra quem quiser construir com código (o front-end do
 * sistema). Quem for entregar só protótipo navegável (Figma) não precisa dele.
 *
 * Expõe:
 *   GET   /health            → { ok: true }
 *   GET   /pizzaria          → dados e localização da pizzaria (origem das rotas)
 *   GET   /orders            → pedidos ativos (com endereço + coordenadas)
 *   GET   /orders/:id        → um pedido
 *   PATCH /orders/:id        → muda stage e/ou atribui entregador
 *                              { "stage": "OUT_DELIVERY", "driverId": 2 }
 *   GET   /drivers           → entregadores (com localização atual)
 *   GET   /events            → stream SSE em tempo real
 *
 * Eventos SSE (event: <tipo>, data: <json>):
 *   snapshot       → { pizzaria, orders, drivers } no momento da conexão
 *   order.created  → pedido novo entrou
 *   order.updated  → pedido mudou (stage / entregador / cancelamento)
 *   driver.moved   → a localização de um entregador mudou (rastreio ao vivo)
 *
 * As coordenadas são fictícias, num bairro imaginário. É um mock simples e cru:
 * leia, ajuste e estenda à vontade — faz parte do desafio.
 */

const http = require('http');

const PORT = process.env.PORT || 4000;
const TICK_MS = Number(process.env.TICK_MS || 3000);

// ---------------------------------------------------------------------------
// Mundo fictício
// ---------------------------------------------------------------------------

const PIZZARIA = { name: 'Pizzaria Cruviana', lat: -23.5480, lng: -46.6350 };

// bairros do raio de entrega (coordenadas base fictícias)
const NEIGHBORHOODS = {
  Centro: { lat: -23.5470, lng: -46.6360 },
  'Vila Nova': { lat: -23.5560, lng: -46.6280 },
  Jardim: { lat: -23.5390, lng: -46.6480 }, // "o do Jardim sempre demora"
  Alto: { lat: -23.5620, lng: -46.6420 },
  'Bela Vista': { lat: -23.5405, lng: -46.6300 },
};

const DRIVER_NAMES = ['Beto', 'Rodrigo', 'Wesley', 'Marcão', 'Paulinho'];
const CHANNELS = ['TELEFONE', 'WHATSAPP', 'APP'];
const STAGES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_DELIVERY', 'DELIVERED', 'CANCELED'];

const MENU = [
  { name: 'Pizza Mussarela', price: 55 },
  { name: 'Pizza Calabresa', price: 58 },
  { name: 'Pizza Margherita', price: 60 },
  { name: 'Pizza Portuguesa', price: 62 },
  { name: 'Pizza Frango com Catupiry', price: 65 },
  { name: 'Pizza Quatro Queijos', price: 68 },
  { name: 'Pizza Pepperoni', price: 72 },
  { name: 'Refrigerante 2L', price: 15 },
  { name: 'Suco natural 500ml', price: 10 },
];

const FIRST = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elaine', 'Fábio', 'Gisele', 'Heitor', 'Ivone', 'João'];
const LAST = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Lima', 'Costa', 'Almeida'];
const STREETS = ['Rua das Acácias', 'Av. Brasil', 'Rua XV', 'Rua do Comércio', 'Alameda Santos', 'Rua Ipê'];

// gerador determinístico (reproduzível entre execuções)
let seed = 7;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const money = (v) => v.toFixed(2);
const isoNoTz = (d) => d.toISOString().slice(0, 19);
function jitter(base) {
  return { lat: base.lat + (rand() - 0.5) * 0.01, lng: base.lng + (rand() - 0.5) * 0.01 };
}

let nextId = 1;

function makeOrder({ ageSeconds = 0, stage = 'PENDING' } = {}) {
  const id = nextId++;
  const bairro = pick(Object.keys(NEIGHBORHOODS));
  const coord = jitter(NEIGHBORHOODS[bairro]);
  const itemCount = 1 + Math.floor(rand() * 3);
  const items = [];
  let total = 0;
  for (let i = 0; i < itemCount; i++) {
    const m = pick(MENU);
    const quantity = 1 + Math.floor(rand() * 2);
    items.push({ name: m.name, quantity });
    total += m.price * quantity;
  }
  const created = new Date(Date.now() - ageSeconds * 1000);
  return {
    id,
    reference: `#${String(id).padStart(4, '0')}`,
    channel: pick(CHANNELS),
    customer: {
      name: `${pick(FIRST)} ${pick(LAST)}`,
      phone: `(11) 9${Math.floor(rand() * 9000 + 1000)}-${Math.floor(rand() * 9000 + 1000)}`,
    },
    address: {
      street: pick(STREETS),
      number: String(Math.floor(rand() * 900) + 10),
      neighborhood: bairro,
      lat: Number(coord.lat.toFixed(6)),
      lng: Number(coord.lng.toFixed(6)),
    },
    items,
    total: money(total),
    stage,
    createdAt: isoNoTz(created),
    promisedMinutes: 30,
    driverId: null,
    feedback: null, // preenchido via POST /orders/:id/feedback
  };
}

// ---------------------------------------------------------------------------
// Estado em memória
// ---------------------------------------------------------------------------

const orders = new Map();
for (const spec of [
  { ageSeconds: 1400, stage: 'OUT_DELIVERY' },
  { ageSeconds: 1100, stage: 'OUT_DELIVERY' },
  { ageSeconds: 700, stage: 'READY' },
  { ageSeconds: 500, stage: 'PREPARING' },
  { ageSeconds: 240, stage: 'CONFIRMED' },
  { ageSeconds: 60, stage: 'PENDING' },
]) {
  const o = makeOrder(spec);
  orders.set(o.id, o);
}

const drivers = DRIVER_NAMES.map((name, i) => ({
  id: i + 1,
  name,
  status: 'IDLE',
  lat: PIZZARIA.lat,
  lng: PIZZARIA.lng,
  orderIds: [],
}));

// atribui os pedidos OUT_DELIVERY iniciais a entregadores, já a caminho
let di = 0;
for (const o of orders.values()) {
  if (o.stage === 'OUT_DELIVERY') {
    const d = drivers[di++ % 2];
    o.driverId = d.id;
    d.orderIds.push(o.id);
    d.status = 'ON_ROUTE';
    // começa a meio caminho entre a pizzaria e o destino
    d.lat = (PIZZARIA.lat + o.address.lat) / 2;
    d.lng = (PIZZARIA.lng + o.address.lng) / 2;
  }
}

// ---------------------------------------------------------------------------
// SSE
// ---------------------------------------------------------------------------

const clients = new Set();
function broadcast(event, payload) {
  const chunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) res.write(chunk);
}

// passo de ~40 m por tick em direção a um alvo
function stepToward(from, to, stepDeg = 0.0004) {
  const dLat = to.lat - from.lat;
  const dLng = to.lng - from.lng;
  const dist = Math.hypot(dLat, dLng);
  if (dist < stepDeg) return { lat: to.lat, lng: to.lng, arrived: true };
  return {
    lat: Number((from.lat + (dLat / dist) * stepDeg).toFixed(6)),
    lng: Number((from.lng + (dLng / dist) * stepDeg).toFixed(6)),
    arrived: false,
  };
}

setInterval(() => {
  // 1) move entregadores a caminho e entrega quando chega
  for (const d of drivers) {
    if (d.status !== 'ON_ROUTE' || d.orderIds.length === 0) continue;
    const order = orders.get(d.orderIds[0]);
    if (!order) {
      d.orderIds.shift();
      continue;
    }
    const next = stepToward(d, order.address);
    d.lat = next.lat;
    d.lng = next.lng;
    broadcast('driver.moved', { id: d.id, lat: d.lat, lng: d.lng, orderId: order.id });
    if (next.arrived) {
      order.stage = 'DELIVERED';
      broadcast('order.updated', order);
      d.orderIds.shift();
      if (d.orderIds.length === 0) d.status = 'IDLE';
    }
  }

  // 2) cozinha avança um pedido por vez
  const advance = { PENDING: 'CONFIRMED', CONFIRMED: 'PREPARING', PREPARING: 'READY' };
  for (const o of orders.values()) {
    if (advance[o.stage] && rand() < 0.5) {
      o.stage = advance[o.stage];
      broadcast('order.updated', o);
      break;
    }
  }

  // 3) pedido READY sem entregador → despacha pra um entregador livre
  const ready = [...orders.values()].find((o) => o.stage === 'READY' && !o.driverId);
  const free = drivers.find((d) => d.status === 'IDLE');
  if (ready && free) {
    ready.stage = 'OUT_DELIVERY';
    ready.driverId = free.id;
    free.status = 'ON_ROUTE';
    free.orderIds.push(ready.id);
    broadcast('order.updated', ready);
  }

  // 4) de vez em quando entra pedido novo
  if (rand() < 0.35) {
    const o = makeOrder({ ageSeconds: 0, stage: 'PENDING' });
    orders.set(o.id, o);
    broadcast('order.created', o);
  }
}, TICK_MS);

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PATCH, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (path === '/health') return send(res, 200, { ok: true });
  if (path === '/pizzaria') return send(res, 200, PIZZARIA);
  if (path === '/orders' && req.method === 'GET') return send(res, 200, { orders: [...orders.values()] });
  if (path === '/drivers' && req.method === 'GET') return send(res, 200, { drivers });

  if (path === '/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write('retry: 3000\n\n');
    res.write(
      `event: snapshot\ndata: ${JSON.stringify({ pizzaria: PIZZARIA, orders: [...orders.values()], drivers })}\n\n`,
    );
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  // POST /orders/:id/feedback  → satisfação do cliente (fecha o ciclo)
  const fb = path.match(/^\/orders\/([^/]+)\/feedback$/);
  if (fb && req.method === 'POST') {
    const id = Number(decodeURIComponent(fb[1]));
    const order = orders.get(id);
    if (!order) return send(res, 404, { error: 'Pedido não encontrado' });
    const body = await readBody(req);
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return send(res, 400, {
        error: 'rating inválido — use um inteiro de 1 a 5 (estrelas)',
        code: 'VALIDATION-400-001',
      });
    }
    order.feedback = { rating, comment: body.comment || null, at: isoNoTz(new Date()) };
    broadcast('feedback.created', { orderId: order.id, ...order.feedback });
    return send(res, 200, order);
  }

  const match = path.match(/^\/orders\/([^/]+)$/);
  if (match) {
    const id = Number(decodeURIComponent(match[1]));
    const order = orders.get(id);
    if (!order) return send(res, 404, { error: 'Pedido não encontrado' });
    if (req.method === 'GET') return send(res, 200, order);
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      if (body.stage !== undefined && !STAGES.includes(body.stage)) {
        return send(res, 400, {
          error: `stage inválido. Válidos: ${STAGES.join(', ')}`,
          code: 'VALIDATION-400-001',
        });
      }
      if (body.stage !== undefined) order.stage = body.stage;
      if (body.driverId !== undefined) order.driverId = body.driverId;
      broadcast('order.updated', order);
      return send(res, 200, order);
    }
  }

  return send(res, 404, { error: 'not found', path });
});

server.listen(PORT, () => {
  console.log(`\n🍕 Mock de delivery da Pizzaria Cruviana em http://localhost:${PORT}`);
  console.log(`   GET   /orders          pedidos (com endereço + coordenadas)`);
  console.log(`   GET   /drivers         entregadores (com localização)`);
  console.log(`   PATCH /orders/:id      { "stage": "OUT_DELIVERY", "driverId": 2 }`);
  console.log(`   POST  /orders/:id/feedback  { "rating": 5, "comment": "..." }`);
  console.log(`   GET   /events          SSE (order.created / order.updated / driver.moved / feedback.created)`);
  console.log(`   Tick a cada ${TICK_MS / 1000}s (env TICK_MS)\n`);
});
