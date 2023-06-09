// Destructure from Handler/Permissions
const {
  permConfig,
  permLevelMap,
  getInvalidPerms,
  getPermLevelName
} = require('../handlers/permissions');

// Top level command collection import
const { commands } = require('../client');

// Destructure from environmental
const { DEBUG_ENABLED } = process.env;

// Import from packages
const path = require('path');
const chalk = require('chalk');
const logger = require('@mirasaki/logger');
const { Collection } = require('discord.js');

/**
 * The interaction object received when a user/member invokes the command
 * @external DiscordChatInputInteraction
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ChatInputCommandInteraction}
 */

/**
 * The discord.js DiscordPermissionResolvable
 * @external DiscordPermissionResolvable
 * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/DiscordPermissionResolvable}
 */

/**
 * Valid permission levels
 * @typedef {'User' | 'Moderator' | 'Administrator' | 'Server Owner' | 'Developer' | 'Bot Owner'} PermLevel
 */

/**
 * Available cooldown types
 * @typedef {'user' | 'member' | 'guild' | 'channel' | 'global'} CooldownTypes
 */

/**
 * Command cooldown/throttling configuration
 * @typedef {Object} CommandBaseCooldown
 * @property {CooldownTypes} [type] The type of command throttling applied to this command
 * @property {number} [usages] The amount of times the command can be used within the specified duration
 * @property {number} [duration] The duration (in seconds) usages should be tracked for
 */

/**
 * The user-provided callback executed when the command is ran
 * @typedef {Function} CommandCallback
 * @param {external:DiscordChatInputInteraction} interaction The interaction received
 * @param {Client} client Our discord.js-extended client
 * @returns {void | Promise<void>}
 */

/**
 * @typedef {Object} BaseConfig
 * @property {PermLevel} [permLevel='User'] The permission level required to use the command
 * @property {Array<string>} [clientPerms=[]] Permissions required by the client to execute the command
 * @property {Array<string>} [userPerms=[]] Permissions required by the user to execute the commands
 * @property {boolean} [enabled=true] Is the command currently enabled
 * @property {boolean} [nsfw=false] Is the command Not Safe For Work
 * @property {CommandBaseCooldown} [cooldown={ type: 'member', usages: 1, duration: 2 }] Cooldown configuration for the command
 * @property {string} [category='parent_folder_name'] This command's category
 * @property {string} [filePath='absolute_origin_path'] Path to file, automatically set, can be overwritten, only invoked on command reloads
 * @property {Object} [data={}] Discord API Application Command Object {@link https://discord.com/developers/docs/interactions/application-commands#application-command-object}
 * @property {CommandCallback} run The callback to execute when the command is invoked/called
 */

/** Represents the base class used for all our commands & components */
class CommandBase {
  /**
   * @param {BaseConfig} config The full command configuration
   */
  constructor (config) {
    /**
     * @property {PermLevel} permLevel The permission level required to use the command
     */
    this.permLevel = 'permLevel' in config ? config.permLevel : permConfig[permConfig.length - 1].name;

    /**
     * @property {Array<external:DiscordPermissionResolvable>} clientPerms Permissions required by the client to execute the command
     */
    this.clientPerms = 'clientPerms' in config ? config.clientPerms : [];

    /**
     * @property {Array<external:DiscordPermissionResolvable>} userPerms Permissions required by the user to execute the commands
     */
    this.userPerms = 'userPerms' in config ? config.userPerms : [];

    /**
     * @property {boolean} enabled Is the command currently enabled
     */
    this.enabled = 'enabled' in config ? config.enabled : true;

    /**
     * @property {boolean} nsfw Is the command Not Safe For Work
     */
    this.nsfw = 'nsfw' in config ? config.nsfw : false;

    /**
     * @property {CommandBaseCooldown} cooldown Cooldown configuration for the command
     */
    this.cooldown = 'cooldown' in config ? config.cooldown : {};
    this.cooldown.type = config.cooldown && 'type' in config.cooldown ? config.cooldown.type : 'member';
    this.cooldown.usages = config.cooldown && 'usages' in config.cooldown ? config.cooldown.usages : 1;
    this.cooldown.duration = config.cooldown && 'duration' in config.cooldown ? config.cooldown.duration : 2;

    /**
     * @property {string} category This command's category
     */
    this.category = 'category' in config ? config.category : undefined;

    /**
     * @property {Object} data Discord API Application Command Object {@link https://discord.com/developers/docs/interactions/application-commands#application-command-object}
     */
    this.data = 'data' in config ? config.data : {};

    /**
     * @property {string} filePath Path to file, only present if `this.setFilePathDetails` is invoked
     */
    this.filePath = 'filePath' in config ? config.filePath : undefined;

    // Overwriting the default callback function with the
    // user provided function
    this.run = config.run;

    // Validate our config now that it is overwritten
    this.validateConfig();
    // Transforming our perm level string into an integer
    this.setPermLevel();
  }

  /**
   * Transforms the required permLevel string into an integer
   * @method
   * @returns {void}
   */
  setPermLevel = () => {
    this.permLevel = Number(
      Object.entries(permLevelMap)
        .find(([ lvl, name ]) => name === this.permLevel)[0]
    );
  };

  /**
   * Validate our command config and API data
   * @method
   * @throws {Error} If an issue is encountered while validating the configuration
   * @returns {void} Nothing, if an Error isn't encountered, the command configuration is considered valid
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  validateConfig = () => {
    // Destructure
    const { data, run } = this;

    // Check if valid permission level is supplied
    if (!permConfig.find((e) => e.name === this.permLevel)) {
      throw new Error(`The permission level "${ this.permLevel }" is not currently configured.\nCommand: ${ data.name }`);
    }

    // Check that optional client permissions are valid
    if (
      this.clientPerms
      && !Array.isArray(this.clientPerms)
    ) throw new Error(`Invalid permissions provided in ${ data.name } command client permissions\nCommand: ${ data.name }`);

    // Check that optional user permissions are valid
    if (
      this.userPerms
      && !Array.isArray(this.userPerms)
    ) throw new Error(`Invalid permissions provided in ${ data.name } command user permissions\nCommand: ${ data.name }`);

    // Check boolean nsfw
    if (typeof this.nsfw !== 'boolean') throw new Error(`Expected nsfw property to be boolean\nCommand: ${ data.name }`);

    // Check our run function
    if (typeof run !== 'function') {
      throw new Error(`Expected run to be a function, but received ${ typeof run }\nCommand: ${ data.name }`);
    }

    // Check optional required client permissions
    if (this.clientPerms.length >= 1) {
      const invalidPerms = getInvalidPerms(this.clientPerms)
        .map((e) => chalk.red(e));

      if (invalidPerms.length >= 1) {
        throw new Error(`Invalid permissions provided in clientPerms: ${ invalidPerms.join(', ') }\nCommand: ${ data.name }`);
      }
    }

    // Check optional required user permissions
    if (this.userPerms.length >= 1) {
      const invalidPerms = getInvalidPerms(this.userPerms)
        .map((e) => chalk.red(e));

      if (invalidPerms.length >= 1) {
        throw new Error(`Invalid permissions provided in userPerms: ${ invalidPerms.join(', ') }\nCommand: ${ data.name }`);
      }
    }
  };

  /**
   * The callback executed when the command is ran
   * @member {CommandCallback}
   */
  run = () => {};

  /**
   * Grabs data from the origin file path to set `data.name` and `category` fallbacks
   * @method
   * @returns {void} Nothing
   */
  setFilePathDetails = () => {
    const origin = this.filePath;

    // Check if the data name has been set
    // Set filename without extension as fallback
    if (!this.data.name) {
      const fileNameWithoutExtension = origin.slice(
        origin.lastIndexOf(path.sep) + 1,
        origin.lastIndexOf('.')
      );

      this.data.name = fileNameWithoutExtension;
    }
    // Check if the category has been set
    // Set parent folder name as fallback
    if (!this.category) {
      const parentFolder = origin.slice(
        origin.lastIndexOf(path.sep, origin.lastIndexOf(path.sep) - 1) + 1,
        origin.lastIndexOf(path.sep) || undefined
      );

      this.category = parentFolder;
    }
  };

  /**
   * Loads the command, setting the filepath, printing to console, and adding to a {@link module:Client~ClientContainer} collection
   * @method
   * @param {string} origin The absolute file path to exported module/config,
   * can be used this way as we export each Command within it's own, dedicated file
   * @param {external:DiscordCollection} [collection] The collection this command should be set to
   * @returns {void} Nothing
   *
   * @example
   * for (const filePath of getFiles('src/commands')) {
   *  const command = require(filePath);
   *  command.load(filePath, client.container.commands);
   * }
   */
  load = (filePath, collection = new Collection()) => {
    this.filePath = filePath;
    this.setFilePathDetails();
    const identifier = this.data.name;

    // Debug Logging - After we set our file path defaults/fallbacks
    if (DEBUG_ENABLED === 'true') {
      logger.debug(`Loading <${ chalk.cyanBright(identifier) }>`);
    }

    // Set the command in our command collection
    if (collection) collection.set(identifier, this);
  };

  /**
   * Unloads the command, removing it from out  {@link module:Client~ClientContainer} collection and removing it from our module cache
   * @method
   * @param {external:DiscordCollection} collection The collection this command should be removed from
   * @returns {void} Nothing
   *
   * @example
   * const commands = client.container.commands;
   * const command = commands.get('eval');
   * command.unload(commands)
   */
  unload = (collection) => {
    // Removing from our collection
    collection.delete(this.data.name);
    // Getting and deleting our current cmd module cache
    const filePath = this.filePath;
    const module = require.cache[require.resolve(filePath)];

    delete require.cache[require.resolve(filePath)];
    for (let i = 0; i < module.children?.length; i++) {
      if (!module.children) break;
      if (module.children[i] === module) {
        module.children.splice(i, 1);
        break;
      }
    }
  };

  /**
   * Reloads the command, shorthand for invoking `this.unload()` and `this.load()`
   * @method
   * @param {external:DiscordCollection} collection The collection this command should be removed from
   * @returns {void} Nothing
   */
  reload = (collection) => {
    this.unload(collection);
    // this.filePath is only present after the command has been loaded initially
    this.load(this.filePath, collection);
  };
}


/**
 * @typedef {Object} ComponentCommandConfig
 * @property {boolean} [isUserComponent = true] If true, the component is only available to the user who initiated it. If false, everyone can interact with the component
 */

/**
 * @extends {CommandBase}
 */
class ComponentCommand extends CommandBase {
  constructor (config) {
    /**
     * @param {BaseConfig | ComponentCommandConfig} config The full command configuration
     */
    super(config);
    /**
     * @property {boolean} isUserComponent If true, the component is only available to the user who initiated it. If false, everyone can interact with the component
     */
    this.isUserComponent = 'isUserComponent' in config ? config.isUserComponent : true;
  }
}


/**
 * @typedef {Object} APICommandConfig
 * @property {boolean} [global=true] Is the command enabled globally or only in our test-server
 */

/**
 * Represents an API command, one of ChatInput (Slash), User Context Menu or Message Context Menu
 * @extends {CommandBase}
 * @example
 * const myApiCommand = new APICommand({
 *  global: false // Load as a server command instead of global
 * });
 */
class APICommand extends CommandBase {
  /**
   * @param {BaseConfig | APICommandConfig} config The full command configuration
   */
  constructor (config) {
    super(config);
    /**
     * @property {boolean} global Is the command enabled globally or only in our test-server
     */
    this.global = 'global' in config ? config.global : false;
  }
}


/**
 * @extends {APICommand}
 */
class MessageContextCommand extends APICommand {
  /**
   * @param {BaseConfig | APICommandConfig} config The full command configuration
   */
  constructor (cmd) {
    super(cmd);
    /**
     * @property {number} [data.type=3] The type of APICommand
     */
    // MESSAGE Context Menu
    this.data.type = 3;
  }
}


/**
 * @extends {APICommand}
 */
class UserContextCommand extends APICommand {
  /**
   * @param {BaseConfig | APICommandConfig} config The full command configuration
   */
  constructor (cmd) {
    super(cmd);
    /**
     * @property {number} [data.type=3] The type of APICommand
     */
    // USER Context Menu
    this.data.type = 2;
  }
}

/**
 * @typedef {Object} ChatInputCommandConfig
 * @property {Array<string>} [aliases=[]] Array of command aliases
 * @property {boolean} [isAlias=false] Indicates if the command is an active alias, you should never have to use this in the constructor, used internally
 * @property {string} [aliasFor='parent_command_name'] The command name this alias is for, you should never have to use this in the constructor, used internally
 */


/**
 * @extends {APICommand}
 * @example
 * const mySlashCommand = new ChatInputCommand({
 *  cooldown: {
 *   type: 'guild', // Use guild-type cooldown
 *   usages: 2, // Limit to 2 uses per guild
 *   duration: 60 // usages are tracked and active for 60 seconds
 *  }
 *  data: {
 *   description: 'A description is required for ChatInput commands on the Discord API'
 *  },
 *  // The commands callback function
 *  run: async (client, interaction) => {
 *   // Do something with the client and interaction
 *  }
 * });
 */
class ChatInputCommand extends APICommand {
  /**
   * @param {BaseConfig | APICommandConfig | ChatInputCommandConfig} config The full command configuration
   * @throws {Error} An Error if no `data.description` field is present, as this is required by Discord's API
   */
  constructor (config) {
    super(config);
    // Set API data defaults - CHAT_INPUT
    this.data.type = 1;

    // Check if a description is provided
    if (!this.data.description) {
      throw new Error(`An InteractionCommand description is required by Discord's API\nCommand: ${ this.data.name }`);
    }
    /**
     * @property {Array<string>} aliases Array of command aliases
     */
    this.aliases = 'aliases' in config ? config.aliases : [];
    /**
       * @property {boolean} isAlias Indicates if the command is an active alias
       */
    this.isAlias = 'isAlias' in config ? config.isAlias : false;
    /**
       * @property {string | undefined} aliasFor The command name this alias is for
       */
    this.aliasFor = 'aliasFor' in config ? config.aliasFor : undefined;
  }

  /**
   * Register new commands for aliases
   * @method
   * @returns {void} Nothing
   */
  loadAliases = () => {
    // Check if we should manage command aliases
    if (!this.isAlias && this.aliases.length >= 1) {
      // Looping over all over aliases
      this.aliases.forEach((alias) => {
        // Creating the config object for the new command
        const newCmdConfig = {
          // spread all properties
          ...this,
          data: {
            ...this.data,
            name: alias
            // Overwrite API name after spreading api data
          },
          // Transforming the permission level back
          permLevel: getPermLevelName(this.permLevel),
          // Setting alias values
          isAlias: true,
          aliases: [],
          aliasFor: this.data.name
        };

        // Constructing our new command
        const newCmd = new APICommand(newCmdConfig);

        // Loading the new command
        newCmd.load(this.filePath, commands);
      });
    }
  };
}

module.exports = {
  CommandBase,
  APICommand,
  ChatInputCommand,
  ComponentCommand,
  MessageContextCommand,
  UserContextCommand
};
