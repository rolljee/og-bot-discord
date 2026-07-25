import parser from 'xml2js';

export function prettify(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const QUOTES = '"\'`«»“”‘’';

// Discord ne découpe pas les arguments: `!ogp 282 fr "Procurator Pavo"` arrive tel
// quel, guillemets compris, et la recherche par nom exact échoue. On les retire
// donc, y compris les guillemets typographiques que macOS/iOS substituent.
export function stripQuotes(str) {
  let out = str.trim();

  while (out.length > 1 && QUOTES.includes(out[0]) && QUOTES.includes(out.at(-1))) {
    out = out.slice(1, -1).trim();
  }

  return out;
}

// Commandes de la forme `!cmd <n° univers> <lang> <nom sur plusieurs mots>`.
export function parseNamedCommand(msg) {
  const [, universe, lang, ...rest] = msg.trim().split(/\s+/);
  const name = stripQuotes(rest.join(' '));

  if (!universe || !lang || !name) {
    throw new Error('failed');
  }

  return { universe, lang, name };
}

export async function parseServerData(universe, lang) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/serverData.xml`;
  const response = await fetch(url);
  const text = await response.text();
  const result = await parser.parseStringPromise(text);

  const finalObj = {};

  for (const key of Object.keys(result.serverData)) {
    if (key !== '$') {
      finalObj[key] = result.serverData[key][0];
    }
  }
  return finalObj;
}
