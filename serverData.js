import { prettify, parseServerData } from './utils.js';

export async function getUniverseData(msg) {
  const [, universe, lang] = msg.split(' ');
  const data = await parseServerData(universe, lang);

  return `
Serveur: ${data.name}
Vitesse d'uni: ${data.speed}
Vitesse de flotte (guerre): ${data.speedFleetWar}
Vitesse de flotte (paix): ${data.speedFleetPeaceful}
Vitesse de flotte (retenue): ${data.speedFleetHolding}
Consommation deut: ${data.globalDeuteriumSaveFactor}
Débris dans le cdr: ${Number(data.debrisFactor) * 100}%
Points du premier: ${prettify(data.topScore)}
Cases supplémentaire: ${data.bonusFields}
Nombre de galaxie: ${data.galaxies}
Nombre de systèmes: ${data.systems}
Galaxie cyclique: ${Number(data.donutGalaxy) === 1 ? 'oui' : 'non'}
Système cyclique: ${Number(data.donutSystem) === 1 ? 'oui' : 'non'}
Fret dans les sondes: ${Number(data.probeCargo) === 1 ? 'oui' : 'non'}
`;
}
