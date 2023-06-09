const logger = require('@mirasaki/logger');
const chalk = require('chalk');

module.exports = (client, guild) => {
  // Always check to make sure the guild is available
  if (!guild?.available) return;
  // Logging the event to our console
  logger.success(`${ chalk.redBright('[GUILD REMOVE]') } ${ guild.name } has removed the bot!`);
};
