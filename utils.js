import parser from 'xml2js';

export function prettify(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
