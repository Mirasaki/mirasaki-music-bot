const { useQueue, useHistory } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const { ApplicationCommandOptionType } = require('discord.js');

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Add the previously played song to the queue, by default - adds the song to the front of the queue',
    options: [
      {
        name: 'add-to-back-of-queue',
        description: 'Should the previous song be added to the back of queue instead of the front?',
        type: ApplicationCommandOptionType.Boolean,
        required: false
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const {
      member, guild, options
    } = interaction;
    const addToBackOfQueue = options.getBoolean('add-to-back-of-queue') ?? false;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    try {
      // No prev track
      const history = useHistory(guild.id);
      const prevTrack = history?.previousTrack;
      if (!prevTrack) {
        interaction.reply({ content: `${ emojis.error } ${ member }, no tracks in history - this command has been cancelled` });
        return;
      }

      // Ok
      const queue = useQueue(guild.id);
      queue.addTrack(prevTrack);

      // Swap first and last conditionally
      if (!addToBackOfQueue) queue.swapTracks(0, queue.tracks.data.length - 1);
      interaction.reply(`${ emojis.success } ${ member }, **\`${ prevTrack }\`** has been added to the ${
        addToBackOfQueue ? 'back' : 'front'
      } of the queue`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
