const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');

module.exports = new ChatInputCommand({
  global: true,
  data: { description: 'Clear the entire queue' },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    try {
      const queue = useQueue(guild.id);
      if (!queue) {
        interaction.reply({ content: `${ emojis.error } ${ member }, no music is being played - this command has been cancelled` });
        return;
      }
      queue.clear();
      await interaction.reply({ content: `${ emojis.success } ${ member }, the queue has been cleared.` });
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
