const { usePlayer } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');

module.exports = new ChatInputCommand({
  global: true,
  aliases: [ 'resume' ],
  data: { description: 'Pause/resume the playback, this is a toggle' },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    try {
      const guildPlayerNode = usePlayer(guild.id);
      const newPauseState = !guildPlayerNode.isPaused();
      guildPlayerNode.setPaused(newPauseState);
      await interaction.reply(`${ emojis.success } ${ member }, ${ newPauseState ? 'paused' : 'resumed' } playback`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
