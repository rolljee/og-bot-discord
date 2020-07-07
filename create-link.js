const Discord = require('discord.js');
const { prettify, parseServerData } = require('./utils');
const Ogame = require("ogamejs");

function getMoonPercent(data) {
	const Fleets = Ogame.default.Fleets;
	const models = Ogame.default.models.Destroyable;
	let totalCle = 0
	let cle = 1
	while (totalCle <= 2000000) {
		const { metal, crystal } = Fleets.getDebris(models[1], cle, data.debrisFactor);
		totalCle = metal + crystal;
		cle++;
	}

	totalProbe = 0
	probe = 1;
	while (totalProbe <= 2000000) {
		const { metal, crystal } = Fleets.getDebris(models[15], probe, data.debrisFactor);
		totalProbe = metal + crystal;
		probe++;
	}

	return {
		cle,
		probe
	}
}

async function createLink(msg) {
	const split = msg.split(' ');
	let _command = '';
	let _universe = '';
	let _lang = 'fr';
	let _coord = [];

	if (split.length === 4) {
		const [command, universe, lang, coord] = split;
		_command = command;
		_universe = universe;
		_lang = lang;
		_coord = coord;
	} else if (split.length === 3) {
		const [command, universe, coord] = split;
		_command = command;
		_universe = universe;
		_coord = coord;
	}

	const data = await parseServerData(_universe, _lang);
	const { cle, probe } = getMoonPercent(data);

	const [galaxy, system, position] = _coord.split(':');
	const embed = new Discord.MessageEmbed()
		.setColor('#000000');
	embed.addField(`${data.name}: ${Number(data.debrisFactor) * 100}%`,
		`**[[${_coord}]](https://s${_universe}-${_lang}.ogame.gameforge.com/game/index.php?page=ingame&component=galaxy&galaxy=${galaxy}&system=${system}&position=${position})**
		Nombre de clé: ${cle}
		Nombre de sonde: ${probe}
		`);

	return embed;
}

module.exports = {
	createLink
}
