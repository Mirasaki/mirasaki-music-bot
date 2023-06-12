const { useQueue } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { nowPlayingEmbed, requireSessionConditions } = require('../../modules/music');

module.exports = new ChatInputCommand({
  global: true,
  aliases: [ 'np' ],
  data: { description: 'Display detailed information on the song that is currently playing' },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;

    // Check conditions/state
    if (!requireSessionConditions(interaction, true, false, false)) return;

    try {
      const queue = useQueue(guild.id);
      if (!queue) {
        interaction.reply({ content: `${ emojis.error } ${ member }, queue is currently empty. You should totally \`/play\` something - but that's just my opinion.` });
        return;
      }

      // Ok, display the queue!
      const { currentTrack } = queue;
      if (!currentTrack) {
        interaction.reply(`${ emojis.error } ${ member }, can't fetch information on currently displaying song - please try again later`);
        return;
      }

      const npEmbed = nowPlayingEmbed(queue);
      interaction.reply({ embeds: [ npEmbed ] });
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
