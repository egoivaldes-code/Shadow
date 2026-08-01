/**
 * Shadow — servidor de juego
 *
 * Servidor autoritativo (docs/technical/Arquitectura_Inicial.md): sincroniza
 * posición, criaturas con IA de aggro, combate, loot, e inventario entre
 * todos los jugadores conectados a la sala. Persiste personaje (posición,
 * oro, vida, inventario) en Supabase — ver src/db/.
 *
 * Pensado para desplegarse en Render (free tier) — ver sección 7.3.1
 * del documento de contexto para detalles de esa decisión.
 */

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('colyseus');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { ShadowRoom } = require('./rooms/ShadowRoom');

const PORT = process.env.PORT || 2567;

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint simple para comprobar que el servidor está vivo
// (útil para monitores externos tipo Uptime Robot, y para depurar el cold start de Render)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'shadow-server', timestamp: Date.now() });
});

const httpServer = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define('shadow_room', ShadowRoom);

httpServer.listen(PORT, () => {
  console.log(`[Shadow Server] escuchando en puerto ${PORT}`);
  console.log(`[Shadow Server] health check: http://localhost:${PORT}/health`);
});
