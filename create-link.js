import { EmbedBuilder } from 'discord.js';
import Ogame from 'ogamejs';

import { parseServerData } from './utils.js';

// Le nombre de vaisseaux vient d'ogamejs (`Fleets.getMoonLockShips`), comme
// sur ogame-ui: 1 est le chasseur léger, 15 la sonde d'espionnage.
function getMoonPercent(data) {
  const models = Ogame.models.Destroyable;
  const debrisFactor = Number(data.debrisFactor);

  return {
    cle: Ogame.Fleets.getMoonLockShips(models[1], debrisFactor),
    probe: Ogame.Fleets.getMoonLockShips(models[15], debrisFactor),
  };
}

export async function createLink(msg) {
  const split = msg.split(' ');
  let _universe = '';
  let _lang = 'fr';
  let _coord = [];

  if (split.length === 4) {
    const [, universe, lang, coord] = split;
    _universe = universe;
    _lang = lang;
    _coord = coord;
  } else if (split.length === 3) {
    const [, universe, coord] = split;
    _universe = universe;
    _coord = coord;
  }

  const data = await parseServerData(_universe, _lang);
  const { cle, probe } = getMoonPercent(data);

  const [galaxy, system, position] = _coord.split(':');
  const embed = new EmbedBuilder()
    .setColor('#000000')
    .addFields({
      name: `${data.name}: ${Number(data.debrisFactor) * 100}%`,
      value: `**[[${_coord}]](https://s${_universe}-${_lang}.ogame.gameforge.com/game/index.php?page=ingame&component=galaxy&galaxy=${galaxy}&system=${system}&position=${position})**
		Nombre de clé: ${cle}
		Nombre de sonde: ${probe}
		`,
    });

  return embed;
}
