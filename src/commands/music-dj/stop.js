const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');

module.exports = new ChatInputCommand({
  global: true,
  aliases: [
    'leave',
    'disconnect',
    'f-off'
  ],
  data: { description: 'Stop the music player and leave the voice channel' },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { guild, member } = interaction;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    try {
      const queue = useQueue(guild.id);
      queue.delete();
      await interaction.reply(`${ emojis.success } ${ member }, the queue has been cleared and the player was disconnected.`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
