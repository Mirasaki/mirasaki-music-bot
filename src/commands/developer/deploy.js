const { stripIndents } = require('common-tags');
const { ChatInputCommand } = require('../../classes/Commands');
const { refreshSlashCommandData } = require('../../handlers/commands');

module.exports = new ChatInputCommand({
  permLevel: 'Developer',
  data: { description: 'Re-deploy ApplicationCommand API data' },
  run: async (client, interaction) => {
    const { member } = interaction;
    const { emojis } = client.container;

    // Calling our command handler function
    refreshSlashCommandData(client);

    // Sending user feedback
    interaction.reply({ content: stripIndents`
        ${ emojis.success } ${ member }, [ApplicationCommandData](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure "ApplicationCommandData on discord.com/developers") has been refreshed.
        ${ emojis.wait } - changes to global commands can take up to an hour to take effect...
      ` });
  }
});
