const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions, nowPlayingEmbed } = require('../../modules/music');
const { useQueue } = require('discord-player');

module.exports = new ChatInputCommand({
  global: true,
  aliases: [ 'dm-song' ],
  data: { description: 'Save a song, I\'ll send it to your DMs' },
  // eslint-disable-next-line sonarjs/cognitive-complexity
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const {
      member, guild, user
    } = interaction;

    // Check state
    if (!requireSessionConditions(interaction, true, false, false)) return;

    try {
      const queue = useQueue(guild.id);
      if (!queue || !queue.isPlaying()) {
        interaction.reply(`${ emojis.error } ${ member }, not currently playing - this command has been cancelled`);
        return;
      }

      const { currentTrack } = queue;
      if (!currentTrack) {
        interaction.reply(`${ emojis.error } ${ member }, can't fetch information on currently displaying song - please try again later`);
        return;
      }

      // Resolve embed and create DM
      const npEmbed = nowPlayingEmbed(queue, false);
      const channel = await user.createDM().catch(() => null);
      if (!channel) {
        interaction.reply(`${ emojis.error } ${ member }, I don't have permission to DM you - this command has been cancelled`);
        return;
      }

      // Try to send dm
      try {
        await channel.send({ embeds: [ npEmbed ] });
      }
      catch {
        interaction.reply(`${ emojis.error } ${ member }, I don't have permission to DM you - this command has been cancelled`);
        return;
      }

      // Feedback
      await interaction.reply(`${ emojis.success } ${ member }, saved **\`${ currentTrack.title }\`**!`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
