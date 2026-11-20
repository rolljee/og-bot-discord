import { EmbedBuilder } from 'discord.js';
import parser from 'xml2js';

import { UserError } from './errors.js';
import { parseServerData, stripQuotes } from './utils.js';
import {
  describeGap,
  findNearestAllies,
  formatCoords,
  getUniverseShape,
  isAvailable,
  parseCoords,
} from './position.utils.js';

const USAGE = 'Usage : `!ogpos <n°> <lang> <galaxie:système:position> [joueur | [TAG]]`';

async function fetchXml(universe, lang, file) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/${file}.xml`;
  const response = await fetch(url);
  const text = await response.text();

  // Sous charge, Gameforge renvoie parfois une page HTML au lieu du XML : on le
  // dit plutôt que d'afficher l'aide générique.
  try {
    return await parser.parseStringPromise(text);
  } catch {
    throw new UserError(`L'API Gameforge de s${universe}-${lang} ne répond pas correctement (${file}.xml), réessaie dans une minute.`);
  }
}

// `!ogpos 282 fr 2:6:15 Rolljee` -> { universe, lang, target, query }.
// `query` est vide quand on veut les alliés du propriétaire de la position.
export function parsePositionCommand(msg) {
  const [, universe, lang, coords, ...rest] = msg.trim().split(/\s+/);
  const target = parseCoords(coords);

  if (!universe || !lang || !target) {
    throw new UserError(USAGE);
  }

  return { universe, lang, target, query: stripQuotes(rest.join(' ')) };
}

// Trouve l'alliance de référence et le joueur à exclure du classement.
// Ordre: propriétaire de la position (pas d'argument), `[TAG]` explicite,
// nom de joueur, puis nom ou tag d'alliance.
export function resolveReference({ query, target, players, alliances, planets, server }) {
  const findAlliance = (value) => alliances.find(a => a.tag === value || a.name === value);
  const fromPlayer = (player) => {
    if (!player.alliance) {
      throw new UserError(`${player.name} n'a pas d'alliance sur ${server}.`);
    }
    return { alliance: alliances.find(a => a.id === player.alliance), player };
  };

  if (!query) {
    const coords = formatCoords(target);
    const planet = planets.find(p => p.coords === coords);
    const owner = planet && players.find(p => p.id === planet.player);
    if (!owner) {
      throw new UserError(`Personne en ${coords} sur ${server}. Précise un joueur ou un \`[TAG]\` d'alliance.`);
    }
    return fromPlayer(owner);
  }

  const bracketed = /^\[(.+)\]$/.exec(query);
  if (bracketed) {
    const alliance = findAlliance(bracketed[1]);
    if (!alliance) {
      throw new UserError(`Aucune alliance \`${bracketed[1]}\` sur ${server} (sensible à la casse).`);
    }
    return { alliance, player: null };
  }

  const player = players.find(p => p.name === query);
  if (player) {
    return fromPlayer(player);
  }

  const alliance = findAlliance(query);
  if (alliance) {
    return { alliance, player: null };
  }

  throw new UserError(`Aucun joueur ni alliance nommé \`${query}\` sur ${server} (sensible à la casse).`);
}

function toPlayers(xml) {
  return (xml.players.player ?? []).map(({ $ }) => ({
    id: $.id,
    name: $.name,
    status: $.status ?? '',
    alliance: $.alliance,
  }));
}

function toAlliances(xml) {
  return (xml.alliances.alliance ?? []).map(({ $ }) => ({ id: $.id, name: $.name, tag: $.tag }));
}

function toPlanets(xml) {
  return (xml.universe.planet ?? []).map(planet => ({
    player: planet.$.player,
    coords: planet.$.coords,
    moon: planet.moon?.[0] ? Number(planet.moon[0].$.size) : undefined,
  }));
}

function galaxyLink(universe, lang, { galaxy, system, position }) {
  return `https://s${universe}-${lang}.ogame.gameforge.com/game/index.php?page=ingame&component=galaxy&galaxy=${galaxy}&system=${system}&position=${position}`;
}

export function buildPositionEmbed({ universe, lang, target, reference, nearest, shape, updatedAt }) {
  const { alliance, player } = reference;
  const coords = formatCoords(target);

  const lines = nearest.map((ally, index) => {
    const link = `[[${formatCoords(ally.coords)}]](${galaxyLink(universe, lang, ally.coords)})`;
    const moon = ally.moon ? ' 🌒' : '';
    return `${index + 1}. **${ally.name}** — ${link}${moon} · ${describeGap(target, ally.coords, shape)}`;
  });

  // Le classement va dans la description (4096 caractères) : avec les liens, dix
  // lignes dépassent la limite de 1024 d'un champ.
  const description = [`Alliance **[${alliance.tag}] ${alliance.name}**`];
  if (player) {
    description.push(`Référence : ${player.name}`);
  }
  description.push('', lines.join('\n') || 'Aucun allié disponible.');

  const embed = new EmbedBuilder()
    .setTitle(`Alliés les plus proches de [${coords}]`)
    .setURL(galaxyLink(universe, lang, target))
    .setColor('#000000')
    .setDescription(description.join('\n'));

  const date = new Date(Number(updatedAt) * 1000).toLocaleDateString('fr-FR');
  embed.setFooter({ text: `Hors vacances, inactifs et bannis · positions du ${date} (maj hebdomadaire Gameforge)` });

  return embed;
}

export async function getNearestAllies(msg) {
  const { universe, lang, target, query } = parsePositionCommand(msg);
  const server = `s${universe}-${lang}`;

  const [playersXml, alliancesXml, universeXml, serverData] = await Promise.all([
    fetchXml(universe, lang, 'players'),
    fetchXml(universe, lang, 'alliances'),
    fetchXml(universe, lang, 'universe'),
    parseServerData(universe, lang),
  ]);

  const players = toPlayers(playersXml);
  const alliances = toAlliances(alliancesXml);
  const planets = toPlanets(universeXml);
  const shape = getUniverseShape(serverData);

  const reference = resolveReference({ query, target, players, alliances, planets, server });
  if (!reference.alliance) {
    throw new UserError(`Alliance introuvable sur ${server}.`);
  }

  const allies = new Map(
    players
      .filter(p => p.alliance === reference.alliance.id && p.id !== reference.player?.id && isAvailable(p.status))
      .map(p => [p.id, p.name]),
  );

  const nearest = findNearestAllies({ target, planets, allies, shape });

  return buildPositionEmbed({
    universe,
    lang,
    target,
    reference,
    nearest,
    shape,
    updatedAt: universeXml.universe.$.timestamp,
  });
}
