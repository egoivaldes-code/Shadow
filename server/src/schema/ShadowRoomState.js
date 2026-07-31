/**
 * Esquema de estado compartido — Shadow Room
 *
 * Esto define QUÉ datos se sincronizan automáticamente entre todos los clientes
 * conectados a la misma sala. Colyseus se encarga de mandar solo los cambios
 * (delta), no el estado completo en cada frame — así ahorramos ancho de banda.
 *
 * Fase 2 (MVP de red): solo posición y rotación. Nada de combate, inventario,
 * ni chunks todavía — eso vendrá cuando unamos esto con el cliente Three.js.
 */

const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');

class PlayerState extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.rotationY = 0;
    this.name = 'Jugador';
  }
}
defineTypes(PlayerState, {
  x: 'number',
  y: 'number',
  z: 'number',
  rotationY: 'number',
  name: 'string',
});

class ShadowRoomState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
  }
}
defineTypes(ShadowRoomState, {
  players: { map: PlayerState },
});

module.exports = { PlayerState, ShadowRoomState };
