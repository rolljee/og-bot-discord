const Discord = require('discord.js');
const fetch = require('node-fetch');
const parser = require('xml2js');
const unionBy = require('lodash/unionBy');
const { prettify } = require('./utils');

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

async function getPlayerData(universe, lang, playerId) {
	const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/playerData.xml?id=${playerId}`;
	const response = await fetch(url);
	const xml = await response.text();
	const result = await parser.parseStringPromise(xml);
	return {
		position: result.playerData.positions[0].position,
		planets: result.playerData.planets[0].planet
	};
}

function addPlanetText(universe, lang, planetObject) {
	try {
		const planet = planetObject.$;
		const [galaxy, system, position] = planet.coords.split(':');

		let str = `**[[${planet.coords}]](https://s${universe}-${lang}.ogame.gameforge.com/game/index.php?page=ingame&component=galaxy&galaxy=${galaxy}&system=${system}&position=${position})**`;

		if (planetObject.moon && planetObject.moon[0]) {
			const moon = planetObject.moon[0].$;
			str += ` 🌒 ${moon.size}`;
		}

		str += '\n'

		return str;
	} catch (error) {
		console.error(error);
		return '';
	}
}

function isSuperiorOfDiscordCharLimit(str, universe, lang, planetObject) {
	const message = str.length;
	const planet = addPlanetText(universe, lang, planetObject).length;

	return message + planet >= 1024;
}

function getTypeLongName(target) {
	const types = [
		{ type: 0, value: 'Global' },
		{ type: 1, value: 'Economie' },
		{ type: 2, value: 'Recherche' },
		{ type: 3, value: 'Militaire' },
		{ type: 4, value: 'Militaire Built' },
		{ type: 5, value: 'Militaire Destroyed' },
		{ type: 6, value: 'Militaire Lost' },
		{ type: 7, value: 'Honneur' },
	]

	return types.find(({ type }) => type === Number(target)).value;
}

function getMessageContent(universe, lang, playerName, playerInformations, planets) {
	let informationMessage = '';
	for (const information of playerInformations.position) {
		if ([0, 3].includes(Number(information.$.type))) {
			informationMessage += `${information._} ${getTypeLongName(information.$.type)} ${prettify(information.$.score)}`;
			if (information.$.ships) {
				informationMessage += `\nVaisseaux (☠️ ${information.$.ships})`
			}
			informationMessage += '\n';
		}
	}
	const embed = new Discord.MessageEmbed()
		.setTitle(`${playerName}: ${planets.length} planètes`)
		.setColor('#000000');

	embed.addField(`Points`, informationMessage);

	let str = '';
	let previousGalaxy = 0;

	function addFieldText(galaxy, system, planetObject, isSameSystem) {
		embed.addField(`G${previousGalaxy}`, str);
		str = addPlanetText(universe, lang, planetObject, isSameSystem);
		previousGalaxy = galaxy;
		previousSystem = system
	}

	for (let index = 0; index < planets.length; index++) {
		const planetObject = planets[index];
		const [galaxy, system] = planetObject.$.coords.split(':');

		if (index === 0) {
			previousGalaxy = galaxy;
		}

		if (isSuperiorOfDiscordCharLimit(str, universe, lang, planetObject)) {
			addFieldText(galaxy, system, planetObject);
		} else if (galaxy === previousGalaxy) {
			str += addPlanetText(universe, lang, planetObject);
		} else if (str) {
			addFieldText(galaxy, system, planetObject);
		}

		if (index === planets.length - 1) {
			embed.addField(`G${previousGalaxy}`, str)
		}
	}


	return embed;
}

function mergedPlanets(planetsFromUniverse, planetsFromPlayerData) {
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

async function processInput(msg) {
	const [command, universe, lang, ...player] = msg.split(' ');
	if (!universe) throw new Error('failed');
	if (!lang) throw new Error('failed');
	if (!player) throw new Error('failed');

	const playerName = player.join(' ');
	const thePlayer = await getplayerIdByname(universe, lang, playerName);
	const planetsFromUniverse = await getPlayerPlanetsFromUniverse(universe, lang, thePlayer.$.id);
	const playerInformations = await getPlayerData(universe, lang, thePlayer.$.id);
	const planets = mergedPlanets(planetsFromUniverse, playerInformations.planets);
	const message = getMessageContent(universe, lang, playerName, playerInformations, planets);

	return message
}

module.exports = {
	getplayerIdByname,
	getPlayerPlanetsFromUniverse,
	getMessageContent,
	processInput,
}
