const Discord = require('discord.js');
const { searchAlliances } = require('./alliances.utils');
const { getPlayersNameByIds } = require('./players.utils');

async function getAlliance(msg) {
  const [command, universe, lang, ...alliances] = msg.split(' ');
  if (!universe || !lang || !alliances) {
    throw new Error('failed');
  }

  const allianceName = alliances.join(' ');
  const _alliances = await searchAlliances(lang, universe);

  const result = _alliances.find(alliance => alliance.name === allianceName || alliance.tag === allianceName);
  if (result) {
    const embed = new Discord.MessageEmbed()
      .setTitle(`${result.name}: ${result.homepage ? result.homepage : ''}`)
      .setColor('#000000');

    const members = await getPlayersNameByIds(universe, lang, result.members);
    console.log(members);

    embed.addField('membres', members.map(member => member.$.name).join('\n\u200b'));

    return embed;
  }

  return 'Pas d\'alliance avec ce nom';
}

module.exports = { getAlliance };
