const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const { useQueue } = require('discord-player');

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Jump to a specific track without removing other tracks',
    options: [
      {
        name: 'position',
        description: 'The song/track position to jump to',
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
      member, guild, options
    } = interaction;
    // Js 0 indexing offset
    const jumpToIndex = Number(options.getInteger('position')) - 1;

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
    if (jumpToIndex > queueSizeZeroOffset) {
      interaction.reply(`${ emojis.error } ${ member }, there is nothing at track position ${ jumpToIndex + 1 }, the highest position is ${ queue.size } - this command has been cancelled`);
      return;
    }

    // Try to jump to new position/queue
    try {
      queue.node.jump(jumpToIndex);
      await interaction.reply(`${ emojis.success } ${ member }, jumping to **\`${ jumpToIndex + 1 }\`**!`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
