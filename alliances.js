import { EmbedBuilder } from 'discord.js';

import { searchAlliances } from './alliances.utils.js';
import { getPlayersNameByIds } from './players.utils.js';

export async function getAlliance(msg) {
  const [, universe, lang, ...alliances] = msg.split(' ');
  if (!universe || !lang || !alliances.length) {
    throw new Error('failed');
  }

  const allianceName = alliances.join(' ');
  const _alliances = await searchAlliances(lang, universe);

  const result = _alliances.find(alliance => alliance.name === allianceName || alliance.tag === allianceName);
  if (result) {
    const members = await getPlayersNameByIds(universe, lang, result.members);

    return new EmbedBuilder()
      .setTitle(`${result.name}: ${result.homepage ? result.homepage : ''}`)
      .setColor('#000000')
      .addFields({
        name: 'membres',
        value: members.map(member => member.$.name).join('\n​'),
      });
  }

  return 'Pas d\'alliance avec ce nom';
}
