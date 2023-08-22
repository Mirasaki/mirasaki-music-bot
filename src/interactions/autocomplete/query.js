const { useMainPlayer } = require('discord-player');
const { ComponentCommand } = require('../../classes/Commands');

module.exports = new ComponentCommand({ run: async (client, interaction, query) => {
  const player = useMainPlayer();
  if (!query) return [];
  const result = await player.search(query);

  // Identify playlists
  const returnData = [];
  if (result.playlist) {
    returnData.push({
      name: 'Playlist | ' + result.playlist.title, value: query
    });
  }

  // Format tracks for Discord API
  result.tracks
    .slice(0, 25)
    .forEach((track) => {
      let name = `${ track.title } | ${ track.author ?? 'Unknown' } (${ track.duration ?? 'n/a' })`;
      if (name.length > 100) name = `${ name.slice(0, 97) }...`;
      // Throws API error if we don't try and remove any query params
      let url = track.url;
      if (url.length > 100) url = url.slice(0, 100);
      return returnData.push({
        name,
        value: url
      });
    });
  return returnData;
} });
