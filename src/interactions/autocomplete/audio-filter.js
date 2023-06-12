const { ComponentCommand } = require('../../classes/Commands');
const { audioFilters } = require('../../modules/music');
const allAudioFilters = audioFilters();

module.exports = new ComponentCommand({ run: async (client, interaction, query) => {
  if (!query) return allAudioFilters.slice(0, 25).map((e) => ({
    name: e,
    value: e.toLowerCase()
  }));

  // Format tracks for Discord API
  return allAudioFilters
    .filter((e) => e.toLowerCase().indexOf(query.toLowerCase()) >= 0)
    .slice(0, 25)
    .map((e) => ({
      name: e,
      value: e.toLowerCase()
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
} });
