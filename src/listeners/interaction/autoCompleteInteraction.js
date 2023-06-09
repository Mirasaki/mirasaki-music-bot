const logger = require('@mirasaki/logger');
const { AUTOCOMPLETE_MAX_DATA_OPTIONS } = require('../../constants');
const { getRuntime } = require('../../util');
const chalk = require('chalk');

// Destructure from env
const { DEBUG_AUTOCOMPLETE_RESPONSE_TIME } = process.env;

module.exports = async (client, interaction) => {
  // guild property is present and available,
  // we check in the main interactionCreate.js file

  // Destructure from interaction and client container
  const { commandName } = interaction;
  const { autoCompletes } = client.container;

  // Start our timer for performance logging
  const autoResponseQueryStart = process.hrtime.bigint();

  // Get our command name query
  const query = interaction.options.getFocused()?.toLowerCase() || '';
  const activeOption = interaction.options._hoistedOptions.find(({ focused }) => focused === true)?.name;
  const autoCompleteQueryHandler = autoCompletes.get(activeOption);

  // Check if a query handler is found
  if (!autoCompleteQueryHandler) {
    logger.syserr(`Missing AutoComplete query handler for the "${ activeOption }" option in the ${ commandName } command`);
    return;
  }

  // Getting the result
  const result = await autoCompleteQueryHandler.run(client, interaction, query);

  // Returning our query result
  interaction.respond(
    // Slicing of the first 25 results, which is max allowed by Discord
    result?.slice(0, AUTOCOMPLETE_MAX_DATA_OPTIONS) || []
  ).catch((err) => {
    // Unknown Interaction Error
    if (err.code === 10062) {
      logger.debug(`Error code 10062 (UNKNOWN_INTERACTION) encountered while responding to autocomplete query in ${ commandName } - this interaction probably expired.`);
    }

    // Handle unexpected errors
    else {
      logger.syserr(`Unknown error encountered while responding to autocomplete query in ${ commandName }`);
      console.error(err.stack || err);
    }
  });

  // Performance logging if requested depending on environment
  if (DEBUG_AUTOCOMPLETE_RESPONSE_TIME === 'true') {
    logger.debug(`<${ chalk.cyanBright(commandName) }> | Auto Complete | Queried "${ chalk.green(query) }" in ${ getRuntime(autoResponseQueryStart).ms } ms`);
  }
};
