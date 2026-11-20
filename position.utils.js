import Ogame from 'ogamejs';

const { getDistance } = Ogame.Fleets;

// Un allié en vacances, inactif ou banni ne peut pas venir aider: on l'écarte.
// Statuts de players.xml: v vacances, i/I inactif (7/28 jours), b banni.
const UNAVAILABLE_STATUS = /[viIb]/;

export function isAvailable(status = '') {
  return !UNAVAILABLE_STATUS.test(status);
}

// `2:6:15` (crochets tolérés) -> { galaxy, system, position }, sinon null.
export function parseCoords(str) {
  const match = /^\[?(\d+):(\d+):(\d+)\]?$/.exec(str?.trim() ?? '');
  if (!match) {
    return null;
  }

  const [galaxy, system, position] = match.slice(1).map(Number);
  if (!galaxy || !system || !position) {
    return null;
  }

  return { galaxy, system, position };
}

export function formatCoords({ galaxy, system, position }) {
  return `${galaxy}:${system}:${position}`;
}

// Forme de l'univers lue dans serverData.xml, pour que getDistance prenne le
// chemin le plus court dans un univers circulaire.
export function getUniverseShape(serverData) {
  return {
    galaxies: Number(serverData.galaxies),
    systems: Number(serverData.systems),
    donutGalaxy: Number(serverData.donutGalaxy) === 1,
    donutSystem: Number(serverData.donutSystem) === 1,
  };
}

function gap(from, to, size, donut) {
  const direct = Math.abs(from - to);
  return donut && size ? Math.min(direct, size - direct) : direct;
}

// Écart lisible: « même système », « 3 systèmes », « 2 galaxies ».
export function describeGap(from, to, shape = {}) {
  if (from.galaxy !== to.galaxy) {
    const galaxies = gap(from.galaxy, to.galaxy, shape.galaxies, shape.donutGalaxy);
    return `${galaxies} galaxie${galaxies > 1 ? 's' : ''}`;
  }

  if (from.system !== to.system) {
    const systems = gap(from.system, to.system, shape.systems, shape.donutSystem);
    return `${systems} système${systems > 1 ? 's' : ''}`;
  }

  return 'même système';
}

/**
 * Pour chaque allié, sa planète la plus proche de la cible, triées par distance.
 * Une seule ligne par joueur: sinon un allié avec huit colonies dans le système
 * remplirait tout le classement. À distance égale, une lune passe devant.
 *
 * @param {object} params
 * @param {{ galaxy: number, system: number, position: number }} params.target
 * @param {Array<{ player: string, coords: string, moon?: number }>} params.planets
 * @param {Map<string, string>} params.allies id du joueur -> nom
 * @param {object} [params.shape] forme de l'univers (getUniverseShape)
 * @param {number} [params.limit]
 */
export function findNearestAllies({ target, planets, allies, shape = {}, limit = 10 }) {
  const best = new Map();

  for (const planet of planets) {
    if (!allies.has(planet.player)) {
      continue;
    }

    const coords = parseCoords(planet.coords);
    if (!coords) {
      continue;
    }

    const candidate = {
      playerId: planet.player,
      name: allies.get(planet.player),
      coords,
      moon: planet.moon,
      distance: getDistance(target, coords, shape),
    };

    const current = best.get(planet.player);
    if (!current || isCloser(candidate, current)) {
      best.set(planet.player, candidate);
    }
  }

  return [...best.values()]
    .sort(compare)
    .slice(0, limit);
}

// Plus proche d'abord, puis lune avant planète, puis nom.
function compare(a, b) {
  return a.distance - b.distance
    || Number(Boolean(b.moon)) - Number(Boolean(a.moon))
    || a.name.localeCompare(b.name);
}

function isCloser(a, b) {
  return compare(a, b) < 0;
}
