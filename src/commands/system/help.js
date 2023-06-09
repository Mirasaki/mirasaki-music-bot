const { ChatInputCommand } = require('../../classes/Commands');
const {
  getCommandSelectMenu,
  generateCommandOverviewEmbed,
  generateCommandInfoEmbed
} = require('../../handlers/commands');
const { commandAutoCompleteOption } = require('../../interactions/autocomplete/command');

module.exports = new ChatInputCommand({
  global: true,
  aliases: [ 'commands' ],
  cooldown: {
    // Use user cooldown type instead of default member
    type: 'user',
    usages: 2,
    duration: 10
  },
  clientPerms: [ 'EmbedLinks' ],
  data: {
    description: 'Receive detailed command information',
    options: [ commandAutoCompleteOption ]
  },

  run: (client, interaction) => {
    // Destructuring
    const { member } = interaction;
    const {
      commands, contextMenus, emojis
    } = client.container;

    // Check for optional autocomplete focus
    const commandName = interaction.options.getString('command');
    const hasCommandArg = commandName !== null && typeof commandName !== 'undefined';

    // Show command overview if no command parameter is supplied
    if (!hasCommandArg) {
      // Getting our command select menu, re-used
      const cmdSelectMenu = getCommandSelectMenu(member);

      // Reply to the interaction with our embed
      interaction.reply({
        embeds: [ generateCommandOverviewEmbed(commands, interaction) ],
        components: [ cmdSelectMenu ]
      });
      return;
    }

    // Request HAS optional command argument
    // Assigning our data
    const clientCmd = commands.get(commandName)
      || contextMenus.get(commandName);

    // Checking if the commandName is a valid client command
    if (!clientCmd) {
      interaction.reply({
        content: `${ emojis.error } ${ member }, I couldn't find the command **\`/${ commandName }\`**`,
        ephemeral: true
      });
      return;
    }

    // Replying with our command information embed
    interaction.reply({ embeds: [
      generateCommandInfoEmbed(
        clientCmd,
        interaction
      )
    ] });
  }
});
