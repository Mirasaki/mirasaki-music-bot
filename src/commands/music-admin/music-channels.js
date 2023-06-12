const {
  ApplicationCommandOptionType, ChannelType, AttachmentBuilder
} = require('discord.js');
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
    description: 'Configure the channels where music commands are allowed to be used',
    options: [
      {
        name: 'list',
        description: 'List all music channels that are currently configured',
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'add',
        description: 'Add a channel to the list of channels where music commands are allowed',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'The channel where commands can be used',
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ ChannelType.GuildText ],
            required: true
          }
        ]
      },
      {
        name: 'remove',
        description: 'Remove a channel from the list of channels where music commands are allowed',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'channel',
            description: 'The channel to remove from the list of allowed channels',
            type: ApplicationCommandOptionType.Channel,
            channel_types: [ ChannelType.GuildText ],
            required: true
          }
        ]
      },
      {
        name: 'reset',
        description: 'Completely reset the list of channels where music commands are allowed',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'verification',
            description: 'Are you sure you want to reset your music channel list?',
            type: ApplicationCommandOptionType.Boolean,
            required: true
          }
        ]
      }
    ]
  },
  run: async (client, interaction) => {
    const {
      member, guild, options
    } = interaction;
    const { emojis } = client.container;
    const action = options.getSubcommand();
    const settings = getGuildSettings(guild.id);
    const { musicChannelIds = [] } = settings;
    // Note: Don't define in outer scope, will be uninitialized
    const guilds = db.getCollection('guilds');

    // Check action/subcommand
    switch (action) {
      case 'add': {
        // Check already exists
        const channel = options.getChannel('channel');
        if (musicChannelIds.includes(channel.id)) {
          interaction.reply(`${ emojis.error } ${ member }, ${ channel } is already configured as a music channel - this command has been cancelled`);
          return;
        }

        // Perform and notify collection that the document has changed
        settings.musicChannelIds = [ ...musicChannelIds, channel.id ];
        guilds.update(settings);
        saveDb();

        // Feedback
        interaction.reply(`${ emojis.success } ${ member },  ${ channel } has been added to the list of music channels`);
        break;
      }

      case 'remove': {
        // Check doesn't exist
        const channel = options.getChannel('channel');
        if (!musicChannelIds.includes(channel.id)) {
          interaction.reply(`${ emojis.error } ${ member }, ${ channel } isn't currently configured as a music channel - this command has been cancelled`);
          return;
        }

        // Perform and notify collection that the document has changed
        settings.musicChannelIds = musicChannelIds.filter((e) => e !== channel.id);
        guilds.update(settings);
        saveDb();

        // Feedback
        interaction.reply(`${ emojis.success } ${ member },  ${ channel } has been removed from the list of music channels`);
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
        settings.musicChannelIds = [];
        guilds.update(settings);
        saveDb();

        // Feedback
        interaction.reply(`${ emojis.success } ${ member }, your list of music channels has been reset`);
        break;
      }

      // Default list action
      case 'list':
      default: {
        // Resolve output
        const outputStr = musicChannelIds[0]
          ? musicChannelIds.map((e) => `<#${ e }>`).join(` ${ emojis.separator } `)
          : 'None configured yet, restrict music commands to specific channels by using the `/music-channels add` command';

        // Attach as file instead if too long kek W
        const files = [];
        if (outputStr.length >= EMBED_DESCRIPTION_MAX_LENGTH) {
          files.push(new AttachmentBuilder(Buffer.from(
            musicChannelIds.map((e) => guild.channels.cache.get(e)?.name ?? `Unknown/Deleted (${ e })`).join('\n')
          )).setName(`music-channel-list-${ guild.id }.txt`));
        }

        // Reply with overview
        interaction.reply({
          embeds: [
            {
              color: colorResolver(),
              author: {
                name: `Configured music channels for ${ guild.name }`,
                icon_url: guild.iconURL({ dynamic: true })
              },
              description: files[0] ? null : outputStr,
              footer: { text: 'This list represents channels where music commands are allowed to be used. Music commands can be used anywhere if this list is empty' }
            }
          ],
          files
        });
        break;
      }
    }
  }
});
