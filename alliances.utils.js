const fetch = require('node-fetch');
const parser = require('xml2js');

async function searchAlliances(lang, universe) {
  const url = `https://s${universe}-${lang}.ogame.gameforge.com/api/alliances.xml`;
  const response = await fetch(url);
  const xml = await response.text();
  const result = await parser.parseStringPromise(xml);
  const alliances = result.alliances.alliance;
  const _alliances = [];

  for (let i = 0; i < alliances.length; i++) {
    const alliance = alliances[i];
    if (alliance.player) {
      const members = alliance.player;
      const _members = [];

      for (let j = 0; j < members.length; j++) {
        const member = members[j];
        if (member.$ && member.$.id) {
          _members.push(member.$.id);
        }

      }

      _alliances.push({
        id: alliance.$.id,
        name: alliance.$.name,
        tag: alliance.$.tag,
        founder: alliance.$.founder,
        foundDate: alliance.$.foundDate,
        homepage: alliance.$.homepage,
        members: _members,
      });
    }

  }
  return _alliances;
}

module.exports = { searchAlliances };
