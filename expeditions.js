import Ogame from 'ogamejs';

import { parseServerData, prettify } from './utils.js';

const { getExpeditionMaxFind, getCargoCapacity } = Ogame.Fleets;
const { Destroyable } = Ogame.models;

// La trouvaille vient d'ogamejs (`Fleets.getExpeditionMaxFind`), comme sur
// ogame-ui. La commande suppose un explorateur avec un éclaireur, sans bonus de
// formes de vie: c'est ce qu'elle a toujours affiché.
export async function getExpeditions(message) {
  const [, universe, lang, hyperespace] = message.split(' ');
  const data = await parseServerData(universe, lang);
  const topScore = Number(data.topScore);
  const hyperspaceLevel = Number(hyperespace);
  const hyperspaceMultiplier = Number(data.cargoHyperspaceTechMultiplier);
  // Absent des vieux univers: le bonus de classe historique, 50 %.
  const explorerBonus = Number(data.explorerBonusIncreasedExpeditionOutcome ?? 0.5);

  const maxCapacity = getExpeditionMaxFind({
    topScore,
    economySpeed: Number(data.speed),
    explorer: true,
    pathfinder: true,
    explorerBonus,
  });
  const cargo = { hyperspaceLevel, hyperspaceMultiplier };
  const GT_number = Math.ceil(maxCapacity / getCargoCapacity(Destroyable[12], cargo));
  const PT_number = Math.ceil(maxCapacity / getCargoCapacity(Destroyable[11], cargo));

  return `
Sur ${data.name} le 1er a ${prettify(topScore)}
Un explorateur avec hyperespace: ${hyperespace} + un pathfinder
Trouvaille maximale: ${prettify(maxCapacity)}
Nombre de GT: ${GT_number}
Nombre de PT: ${PT_number}
	`;
}
