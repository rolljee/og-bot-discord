const Discord = require('discord.js');
const { prettify } = require('./utils');
const { getplayerIdByname, getPlayerPlanetsFromUniverse, getPlayerData, mergePlanets } = require('./players.utils');

function addPlanetText(universe, lang, planetObject) {
  try {
    const planet = planetObject.$;
    const [galaxy, system, position] = planet.coords.split(':');

    let str = `**[[${planet.coords}]](https://s${universe}-${lang}.ogame.gameforge.com/game/index.php?page=ingame&component=galaxy&galaxy=${galaxy}&system=${system}&position=${position})**`;

    if (planetObject.moon && planetObject.moon[0]) {
      const moon = planetObject.moon[0].$;
      str += ` 🌒 ${moon.size}`;
    }

    str += '\n';

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

function getMilitaryPropsName(target) {
  const types = [
    { type: 0, value: 'Global' },
    { type: 1, value: 'Economie' },
    { type: 2, value: 'Recherche' },
    { type: 3, value: 'Militaire' },
    { type: 4, value: 'Militaire Built' },
    { type: 5, value: 'Militaire Destroyed' },
    { type: 6, value: 'Militaire Lost' },
    { type: 7, value: 'Honneur' },
  ];

  return types.find(({ type }) => type === Number(target)).value;
}

function getMilitaryInformations(playerInformations) {
  let informationMessage = '';
  for (const information of playerInformations.position) {
    if ([0, 3].includes(Number(information.$.type))) {
      informationMessage += `${information._} ${getMilitaryPropsName(information.$.type)} ${prettify(information.$.score)}\n`;
      if (information.$.ships) {
        informationMessage += `Vaisseaux ${prettify(information.$.ships)}\n`;
      }
    }
  }

  return informationMessage;
}

function getMessageContent(universe, lang, playerName, playerInformations, planets) {
  const embed = new Discord.MessageEmbed()
    .setTitle(`${playerName}: ${planets.length} planètes`)
    .setColor('#000000');

  let str = '';
  let previousGalaxy = 0;

  function addFieldText(galaxy, system, planetObject) {
    embed.addField(`G${previousGalaxy}`, str);
    str = addPlanetText(universe, lang, planetObject);
    previousGalaxy = galaxy;
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
      embed.addField(`G${previousGalaxy}`, str);
    }
  }

  let informationMessage = getMilitaryInformations(playerInformations);

  embed.addField('Points', informationMessage);
  const timestamp = Number(playerInformations.lastUpdate) * 1000;
  const date = new Date(timestamp).toLocaleDateString('fr-FR');
  const time = new Date(timestamp).toLocaleTimeString('fr-FR');
  embed.addField('Dernière maj', `${date} ${time}`);


  return embed;
}

async function getPlayer(msg) {
  const [command, universe, lang, ...player] = msg.split(' ');
  if (!universe || !lang || !player) {
    throw new Error('failed');
  }

  const playerName = player.join(' ');
  const thePlayer = await getplayerIdByname(universe, lang, playerName);
  const planetsFromUniverse = await getPlayerPlanetsFromUniverse(universe, lang, thePlayer.$.id);
  const playerInformations = await getPlayerData(universe, lang, thePlayer.$.id);
  const planets = mergePlanets(planetsFromUniverse, playerInformations.planets);
  const message = getMessageContent(universe, lang, playerName, playerInformations, planets);

  return message;
}

module.exports = { getPlayer };
