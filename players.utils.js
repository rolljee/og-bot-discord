import unionBy from 'lodash/unionBy.js';
import parser from 'xml2js';

export async function getplayerIdByname(universe, lang, playerName) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/players.xml`;
  const response = await fetch(url);
  const xml = await response.text();
  const result = await parser.parseStringPromise(xml);
  const players = result.players.player;
  return players.find(player => player.$.name === playerName);
}

export async function getPlayersNameByIds(universe, lang, playerIds) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/players.xml`;
  const response = await fetch(url);
  const xml = await response.text();
  const result = await parser.parseStringPromise(xml);
  const players = result.players.player;
  return players.filter(player => playerIds.includes(player.$.id));
}

export async function getPlayerPlanetsFromUniverse(universe, lang, playerId) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/universe.xml`;
  const response = await fetch(url);
  const xml = await response.text();
  const result = await parser.parseStringPromise(xml);
  const planets = result.universe.planet;
  return planets.filter(planet => planet.$.player === playerId);
}

export async function getPlayerData(universe, lang, playerId) {
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

export function mergePlanets(planetsFromUniverse, planetsFromPlayerData) {
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

      return aPosition - bPosition;
    });
}
