const fetch = require('node-fetch');
const parser = require('xml2js');
const unionBy = require('lodash/unionBy')

async function getplayerIdByname(universe, lang, playerName) {
	const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/players.xml`;
	const response = await fetch(url);
	const xml = await response.text();
	const result = await parser.parseStringPromise(xml);
	const players = result.players.player;
	return players.find(player => player.$.name === playerName);
}

async function getPlayerPlanetsFromUniverse(universe, lang, playerId) {
	const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/universe.xml`
	const response = await fetch(url);
	const xml = await response.text();
	const result = await parser.parseStringPromise(xml);
	const planets = result.universe.planet;
	return planets.filter(planet => planet.$.player === playerId);
}

async function getPlayerPlanetsFromPlayerData(universe, lang, playerId) {
	const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/playerData.xml?id=${playerId}`;
	const response = await fetch(url);
	const xml = await response.text();
	const result = await parser.parseStringPromise(xml);
	return result.playerData.planets[0].planet;
}

function getMessageContent(planets) {
	let message = '\n';
	for (const planetObject of planets) {
		const planet = planetObject.$;
		let str = `[${planet.coords}] - ${planet.name}`;
		if (planetObject.moon && planetObject.moon[0]) {
			const moon = planetObject.moon[0].$;
			str += ` 🌒 ${moon.size}`;
		}
		str += '\n';
		message += str;
	}

	return message;
}

function mergedPlanets(planetsFromUniverse, planetsFromPlayerData) {
	return unionBy(planetsFromUniverse, planetsFromPlayerData, '$.id')
		.sort((a, b) => {
			const gA = a.$.coords.split(':');
			const gB = b.$.coords.split(':');
			return gA > gB ? 1 : -1;
		});;
}

async function processInput(msg) {
	const [command, universe, lang, ...player] = msg.split(' ');
	if (!universe) throw new Error('failed');
	if (!lang) throw new Error('failed');
	if (!player) throw new Error('failed');

	const thePlayer = await getplayerIdByname(universe, lang, player.join(' '));
	const planetsFromUniverse = await getPlayerPlanetsFromUniverse(universe, lang, thePlayer.$.id);
	const planetsFromPlayerData = await getPlayerPlanetsFromPlayerData(universe, lang, thePlayer.$.id);
	const planets = mergedPlanets(planetsFromUniverse, planetsFromPlayerData);
	const message = getMessageContent(planets);

	return message
}

module.exports = {
	getplayerIdByname,
	getPlayerPlanetsFromUniverse,
	getMessageContent,
	processInput,
}
