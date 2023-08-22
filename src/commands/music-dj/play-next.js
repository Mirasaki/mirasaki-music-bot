const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const { useMainPlayer, useQueue } = require('discord-player');

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Same as /play, but adds it to the front of the queue',
    options: [
      {
        name: 'query',
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        description: 'The music to search/query',
        required: true
      }
    ]
  },
  run: async (client, interaction) => {
    const player = useMainPlayer();
    const { emojis } = client.container;
    const { member, guild } = interaction;
    const query = interaction.options.getString('query', true); // we need input/query to play

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    // Let's defer the interaction as things can take time to process
    await interaction.deferReply();

    try {
      // Check is valid
      const searchResult = await player
        .search(query, { requestedBy: interaction.user })
        .catch(() => null);
      if (!searchResult.hasTracks()) {
        interaction.editReply(`${ emojis.error } ${ member }, no tracks found for query \`${ query }\` - this command has been cancelled`);
        return;
      }

      // Ok
      const firstMatchTrack = searchResult.tracks.at(0);
      const queue = useQueue(guild.id);
      queue.addTrack(firstMatchTrack);

      // Swap first and last conditionally
      queue.swapTracks(0, queue.tracks.data.length - 1);
      interaction.editReply(`${ emojis.success } ${ member }, **\`${ firstMatchTrack.title }\`** has been added to the front of the queue`);
    }
    catch (e) {
      interaction.editReply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
