const fetch = require('node-fetch');
const parser = require('xml2js');
const unionBy = require('lodash/unionBy');

async function getplayerIdByname(universe, lang, playerName) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/players.xml`;
  const response = await fetch(url);
  const xml = await response.text();
  const result = await parser.parseStringPromise(xml);
  const players = result.players.player;
  return players.find(player => player.$.name === playerName);
}

async function getPlayersNameByIds(universe, lang, playerIds) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/players.xml`;
  const response = await fetch(url);
  const xml = await response.text();
  const result = await parser.parseStringPromise(xml);
  const players = result.players.player;
  return players.filter(player => playerIds.includes(player.$.id));
}

async function getPlayerPlanetsFromUniverse(universe, lang, playerId) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/universe.xml`;
  const response = await fetch(url);
  const xml = await response.text();
  const result = await parser.parseStringPromise(xml);
  const planets = result.universe.planet;
  return planets.filter(planet => planet.$.player === playerId);
}

async function getPlayerData(universe, lang, playerId) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/playerData.xml?id=${playerId}`;
  const response = await fetch(url);
  const xml = await response.text();
  const result = await parser.parseStringPromise(xml);
  return {
    position: result.playerData.positions[0].position,
    planets: result.playerData.planets[0].planet,
    lastUpdate: result.playerData.$.timestamp,
  };
}

function mergePlanets(planetsFromUniverse, planetsFromPlayerData) {
  return unionBy(planetsFromUniverse, planetsFromPlayerData, '$.id')
    .sort((a, b) => {
      const [aGalaxy, aSystem, aPosition] = a.$.coords.split(':');
      const [bGalaxy, bSystem, bPosition] = b.$.coords.split(':');
      if (Number(aGalaxy) !== Number(bGalaxy)) {
        return aGalaxy - bGalaxy;
      }

      if (Number(aSystem) !== Number(bSystem)) {
        return aSystem - bSystem;
      }

      if (Number(aPosition) !== Number(bPosition)) {
        return aPosition - bPosition;
      }
    });
}

module.exports = {
  getplayerIdByname,
  getPlayersNameByIds,
  getPlayerPlanetsFromUniverse,
  getPlayerData,
  mergePlanets
};
