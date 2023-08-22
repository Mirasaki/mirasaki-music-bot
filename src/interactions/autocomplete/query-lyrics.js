const { useMainPlayer } = require('discord-player');
const { ComponentCommand } = require('../../classes/Commands');

module.exports = new ComponentCommand({ run: async (client, interaction, query) => {
  const player = useMainPlayer();
  if (!query) return [];
  const result = await player.search(query);

  const returnData = [];
  // Explicit ignore playlist

  // Format tracks for Discord API
  result.tracks
    .slice(0, 25)
    .forEach((track) => {
      let name = `${ track.title } by ${ track.author ?? 'Unknown' } (${ track.duration ?? 'n/a' })`;
      if (name.length > 100) name = `${ name.slice(0, 97) }...`;
      return returnData.push({
        name,
        value: `${ track.author ? track.author + ' ' : '' }${ track.title }`
          .toLowerCase()
          .replace(/(lyrics|extended|topic|vevo|video|official|music|audio)/g, '')
          .slice(0, 100)
      });
    });
  return returnData;
} });
