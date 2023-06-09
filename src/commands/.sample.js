// JavaScript files that start with the "." character
// are ignored by our command file handler
const { ChatInputCommand } = require('../classes/Commands');

// Windows (ctrl+space) for auto-complete IntelliSense options
module.exports = new ChatInputCommand({
  run: async (client, interaction) => {
    // ...
  }
});
