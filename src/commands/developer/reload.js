const { ChatInputCommand } = require('../../classes/Commands');
const { requiredCommandAutoCompleteOption } = require('../../interactions/autocomplete/command');
const { colorResolver } = require('../../util');

/*
  I don't really see the value in having a reload command
  when there's options like nodemon available
  for active development, but still, it's here
*/

module.exports = new ChatInputCommand({
  permLevel: 'Developer',
  data: {
    description: 'Reload an active, existing command',
    options: [ requiredCommandAutoCompleteOption ]
  },

  run: async (client, interaction) => {
    // Destructure
    const { member, options } = interaction;
    const {
      emojis, colors, commands
    } = client.container;

    // Variables definitions
    const commandName = options.getString('command');
    const command = commands.get(commandName);

    // Check is valid command
    if (!command) {
      interaction.reply({ content: `${ emojis.error } ${ member }, couldn't find any commands named \`${ commandName }\`.` });
      return;
    }

    // Deferring our reply
    await interaction.deferReply();

    // Try to reload the command
    try {
      // Calling class#unload() doesn't refresh the collection
      // To avoid code repetition in Commands class file
      // We'll re-create the function in our /reload command

      // Removing from our collection
      commands.delete(commandName);

      // Getting and deleting our current cmd module cache
      const filePath = command.filePath;
      const module = require.cache[require.resolve(filePath)];

      delete require.cache[require.resolve(filePath)];
      for (let i = 0; i < module.children?.length; i++) {
        if (!module.children) break;
        if (module.children[i] === module) {
          module.children.splice(i, 1);
          break;
        }
      }

      const newCommand = require(filePath);

      newCommand.load(filePath, commands);
    }
    catch (err) {
      // Properly handling errors
      interaction.editReply({ content: `${ emojis.error } ${ member }, error encountered while reloading the command \`${ commandName }\`, click spoiler-block below to reveal.\n\n||${ err.stack || err }||` });
      return;
    }

    // Command successfully reloaded
    interaction.editReply({
      content: `${ emojis.success } ${ member }, reloaded the \`/${ commandName }\` command`,
      embeds: [
        {
          color: colorResolver(colors.invisible),
          footer: { text: 'Don\'t forget to use the /deploy command if you made any changes to the command data object' }
        }
      ]
    });
  }
});
