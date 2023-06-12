const { useHistory } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');

module.exports = new ChatInputCommand({
  global: true,
  data: { description: 'Play the previous song right away' },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    try {
      // No prev track
      const history = useHistory(guild.id);
      if (!history?.previousTrack) {
        interaction.reply({ content: `${ emojis.error } ${ member }, no tracks in history - this command has been cancelled` });
        return;
      }

      // Ok
      await history.previous();
      await interaction.reply({ content: `:arrow_backward: ${ member }, playing previous song` });
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
