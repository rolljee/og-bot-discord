import { EmbedBuilder } from 'discord.js';

import { searchAlliances } from './alliances.utils.js';
import { getPlayersNameByIds } from './players.utils.js';
import { parseNamedCommand } from './utils.js';

export async function getAlliance(msg) {
  const { universe, lang, name: allianceName } = parseNamedCommand(msg);

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

  return `Aucune alliance nommée \`${allianceName}\` sur s${universe}-${lang} (nom ou tag, sensible à la casse).`;
}
