const { usePlayer } = require('discord-player');
const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');
const {
  getGuildSettings, db, saveDb
} = require('../../modules/db');
const { clientConfig } = require('../../util');

module.exports = new ChatInputCommand({
  global: true,
  permLevel: 'Administrator',
  data: {
    description: 'Change the playback/player\'s volume',
    options: [
      {
        name: 'volume',
        description: 'The volume level to apply',
        type: ApplicationCommandOptionType.Integer,
        min_value: 1,
        max_value: 100,
        required: false
      }
    ]
  },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { member, guild } = interaction;
    const volume = interaction.options.getInteger('volume');
    const guilds = db.getCollection('guilds');

    // Check conditions/state
    if (!requireSessionConditions(interaction, false)) return;

    // Resolve settings
    const settings = getGuildSettings(guild.id);
    if (!volume) { // Yes, that includes 0
      interaction.reply(`${ emojis.success } ${ member }, volume is currently set to **\`${ settings.volume ?? clientConfig.defaultVolume }\`**`);
      return;
    }

    try {
      // Check if current player should be updated
      const guildPlayerNode = usePlayer(interaction.guild.id);
      if (guildPlayerNode?.isPlaying()) guildPlayerNode.setVolume(volume);

      // Perform and notify collection that the document has changed
      settings.volume = volume;
      guilds.update(settings);
      saveDb();

      // Feedback
      await interaction.reply({ content: `${ emojis.success } ${ member }, volume set to \`${ volume }\`` });
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
