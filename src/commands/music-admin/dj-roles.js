const { ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const {
  getGuildSettings, saveDb, db
} = require('../../modules/db');
const { EMBED_DESCRIPTION_MAX_LENGTH } = require('../../constants');
const { colorResolver } = require('../../util');

module.exports = new ChatInputCommand({
  global: true,
  permLevel: 'Administrator',
  data: {
    description: 'Configure the roles that can use playback control commands / use intrusive commands',
    options: [
      {
        name: 'list',
        description: 'List all DJ roles that are currently configured',
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'add',
        description: 'Add a role to the list of music power users',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'role',
            description: 'The role which marks users as power users',
            type: ApplicationCommandOptionType.Role,
            required: true
          }
        ]
      },
      {
        name: 'remove',
        description: 'Remove a role from the list of music power users',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'role',
            description: 'The role to remove',
            type: ApplicationCommandOptionType.Role,
            required: true
          }
        ]
      },
      {
        name: 'reset',
        description: 'Completely reset the list of roles that have elevated permission levels',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'verification',
            description: 'Are you sure you want to reset your DJ role list?',
            type: ApplicationCommandOptionType.Boolean,
            required: true
          }
        ]
      }
    ]
  },
  // eslint-disable-next-line sonarjs/cognitive-complexity
  run: async (client, interaction) => {
    const {
      member, guild, options
    } = interaction;
    const { emojis } = client.container;
    const action = options.getSubcommand();
    const settings = getGuildSettings(guild.id);
    const { djRoleIds = [] } = settings;
    // Note: Don't define in outer scope, will be uninitialized
    const guilds = db.getCollection('guilds');

    // Check action/subcommand
    switch (action) {
      case 'add': {
        // Check already exists
        const role = options.getRole('role');
        if (djRoleIds.includes(role.id)) {
          interaction.reply(`${ emojis.error } ${ member }, ${ role } is already configured as a DJ role - this command has been cancelled`);
          return;
        }

        // Perform and notify collection that the document has changed
        settings.djRoleIds = [ ...djRoleIds, role.id ];
        guilds.update(settings);
        saveDb();

        // Feedback
        interaction.reply(`${ emojis.success } ${ member },  ${ role } has been added to the list of DJ roles`);
        break;
      }

      case 'remove': {
        // Check doesn't exist
        const role = options.getRole('role');
        if (!djRoleIds.includes(role.id)) {
          interaction.reply(`${ emojis.error } ${ member }, ${ role } isn't currently configured as a DJ role - this command has been cancelled`);
          return;
        }

        // Perform and notify collection that the document has changed
        settings.djRoleIds = djRoleIds.filter((e) => e !== role.id);
        guilds.update(settings);
        saveDb();

        // Feedback
        interaction.reply(`${ emojis.success } ${ member },  ${ role } has been removed from the list of DJ roles`);
        break;
      }

      case 'reset': {
        // Check verification prompt
        const verification = options.getBoolean('verification');
        if (!verification) {
          interaction.reply(`${ emojis.error } ${ member }, you didn't select \`true\` on the confirmation prompt - this command has been cancelled`);
          return;
        }

        // Perform and notify collection that the document has changed
        settings.djRoleIds = [];
        guilds.update(settings);
        saveDb();

        // Feedback
        interaction.reply(`${ emojis.success } ${ member }, your list of DJ roles has been reset - DJ commands are now reserved for the Administrator permission level and up`);
        break;
      }

      // Default list action
      case 'list':
      default: {
        // Resolve output
        const outputStr = djRoleIds[0]
          ? djRoleIds.map((e) => `<@&${ e }>`).join(` ${ emojis.separator } `)
          : 'None configured yet, restrict powerful music commands to specific roles by using the `/dj-roles add` command. If empty/none, these commands are reserved for the Administrator permission level and up';

        // Attach as file instead if too long kek W
        const files = [];
        if (outputStr.length >= EMBED_DESCRIPTION_MAX_LENGTH) {
          files.push(new AttachmentBuilder(Buffer.from(
            djRoleIds.map((e) => guild.roles.cache.get(e)?.name ?? `Unknown/Deleted (${ e })`).join('\n')
          )).setName(`dj-role-list-${ guild.id }.txt`));
        }

        // Reply with overview
        interaction.reply({
          embeds: [
            {
              color: colorResolver(),
              author: {
                name: `Configured DJ roles for ${ guild.name }`,
                icon_url: guild.iconURL({ dynamic: true })
              },
              description: files[0] ? null : outputStr,
              footer: { text: djRoleIds[0] ? 'This list represents roles that can use powerful music commands to control the state of the player and queue. If empty/none, these commands are reserved for the Administrator permission level and up' : null }
            }
          ],
          files
        });
        break;
      }
    }
  }
});
