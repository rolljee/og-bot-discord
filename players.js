const Discord = require('discord.js');
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

function getMessageContent(universe, lang, playerName, planets) {
	let index = 1;
	const embed = new Discord.MessageEmbed()
		.setTitle(`${playerName}: ${planets.length} planètes\n\u200b`)
		.setColor('#000000');

	for (const planetObject of planets) {
		const planet = planetObject.$;
		const [galaxy, system, position] = planet.coords.split(':');
		let str = `**[[${planet.coords}]](https://s${universe}-${lang}.ogame.gameforge.com/game/index.php?page=ingame&component=galaxy&galaxy=${galaxy}&system=${system}&position=${position})** ${planet.name}`;

		if (planetObject.moon && planetObject.moon[0]) {
			const moon = planetObject.moon[0].$;
			str += ` 🌒 ${moon.size}`;
		}
		
		embed.addField(`Planète #${index}`, str);
		index++;
	}

	return embed;
}

function mergedPlanets(planetsFromUniverse, planetsFromPlayerData) {
	return unionBy(planetsFromUniverse, planetsFromPlayerData, '$.id')
		.sort((a, b) => {
			const gA = a.$.coords.split(':');
			const gB = b.$.coords.split(':');
			if (Number(gA[0]) > Number(gB[0])) {
				/** Galaxy A is after Galaxy B */
				return 1;
			} else if (Number(gA[0]) < Number(gB[0])) {
				/** Galaxy A is before Galaxy B */
				return -1;
			} else if (Number(gA[1]) > Number(gB[1])) {
				/** System A is after System B */
				return 1;
			} else if (Number(gA[1]) < Number(gB[1])) {
				/** System A is before System B */
				return 1;
			} else if (Number(gA[2]) > Number(gB[2])) {
				/** Position A is after Position B */
				return 1;
			} else if (Number(gA[2]) < Number(gB[2])) {
				/** Position A is before Position B */
				return 1;
			} else {
				return - 1;
			}
		});
}

async function processInput(msg) {
	const [command, universe, lang, ...player] = msg.split(' ');
	if (!universe) throw new Error('failed');
	if (!lang) throw new Error('failed');
	if (!player) throw new Error('failed');

	const playerName = player.join(' ');
	const thePlayer = await getplayerIdByname(universe, lang, playerName);
	const planetsFromUniverse = await getPlayerPlanetsFromUniverse(universe, lang, thePlayer.$.id);
	const planetsFromPlayerData = await getPlayerPlanetsFromPlayerData(universe, lang, thePlayer.$.id);
	const planets = mergedPlanets(planetsFromUniverse, planetsFromPlayerData);
	const message = getMessageContent(universe, lang, playerName, planets);

	return message
}

module.exports = {
	getplayerIdByname,
	getPlayerPlanetsFromUniverse,
	getMessageContent,
	processInput,
}
