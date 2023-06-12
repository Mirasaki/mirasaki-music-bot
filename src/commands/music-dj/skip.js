const { usePlayer } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');

module.exports = new ChatInputCommand({
  global: true,
  aliases: [ 'next' ],
  data: { description: 'Skip the currently playing song' },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member } = interaction;

    // Check state
    if (!requireSessionConditions(interaction, true)) return;

    try {
      const guildPlayerNode = usePlayer(interaction.guild.id);
      // #requireVoiceSession doesn't check current track,
      // only session/player state
      const currentTrack = guildPlayerNode?.queue?.currentTrack;
      if (!currentTrack) {
        interaction.reply({ content: `${ emojis.error } ${ member }, no music is currently being played - this command has been cancelled` });
        return;
      }
      const success = guildPlayerNode.skip();
      await interaction.reply(success
        ? `${ emojis.success } ${ member }, skipped **\`${ currentTrack }\`**`
        : `${ emojis.error } ${ member }, something went wrong - couldn't skip current playing song`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
