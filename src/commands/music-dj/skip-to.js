const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const { ApplicationCommandOptionType } = require('discord.js');

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Skip to provided /queue song position, removing everything up to the song',
    options: [
      {
        name: 'position',
        description: 'The song/track position to skip to',
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 2,
        max_value: 999_999
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const {
      guild, member, options
    } = interaction;
    const skipToIndex = Number(options.getInteger('position')) - 1;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    // Check has queue
    const queue = useQueue(guild.id);
    if (queue.isEmpty()) {
      interaction.reply(`${ emojis.error } ${ member }, queue is currently empty - this command has been cancelled`);
      return;
    }

    // Check bounds
    const queueSizeZeroOffset = queue.size - 1;
    if (skipToIndex > queueSizeZeroOffset) {
      interaction.reply(`${ emojis.error } ${ member }, there is nothing at track position ${ skipToIndex + 1 }, the highest position is ${ queue.size } - this command has been cancelled`);
      return;
    }

    try {
      // Jump to position
      const track = queue.tracks.at(skipToIndex);
      queue.node.skipTo(skipToIndex);
      await interaction.reply(`⏩ ${ member }, skipping to **\`${ track.title }\`**`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
