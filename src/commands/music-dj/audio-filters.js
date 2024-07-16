const { ApplicationCommandOptionType } = require('discord.js');
const { ChatInputCommand } = require('../../classes/Commands');
const { colorResolver } = require('../../util');
const { useQueue } = require('discord-player');
const { stripIndents } = require('common-tags');
const { audioFilters, requireSessionConditions } = require('../../modules/music');
const allAudioFilters = audioFilters();

module.exports = new ChatInputCommand({
  global: true,
  data: {
    description: 'Configure audio filters for playback in your server',
    options: [
      {
        name: 'list',
        description: 'List all audio filters that are currently configured',
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'toggle',
        description: 'Toggle a specific audio filter for your server',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'audio-filter',
            description: 'The audio filter to toggle',
            required: true,
            autocomplete: true
          }
        ]
      },
      {
        name: 'reset',
        description: 'Completely reset all configured audio filters',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'verification',
            description: 'Are you sure you want to reset your configured audio filters?',
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
    const queue = useQueue(guild.id);

    // Check conditions
    if (!requireSessionConditions(interaction, true)) return;

    // Check is active
    if (!queue || !queue.isPlaying()) {
      interaction.reply(`${ emojis.error } ${ member }, initialize playback/a music session first - this command has been cancelled`);
      return;
    }

    // Check action/subcommand
    const guildAudioFilters = queue?.filters.ffmpeg.getFiltersEnabled();
    switch (action) {
      case 'toggle': {
        const audioFilter = allAudioFilters.find((e) => e.toLowerCase() === options.getString('audio-filter'));
        if (!audioFilter) {
          interaction.reply(`${ emojis.error } ${ member }, that is not a valid audio filter - this command has been cancelled`);
          return;
        }
        await interaction.deferReply();
        let isEnabled;
        try {
          isEnabled = await queue.filters.ffmpeg.toggle(audioFilter);
        } catch (err) {
          console.error('Error toggling audio filter:', err);
          interaction.editReply(`${ emojis.error } ${ member }, an error occurred while toggling the audio filter - this command has been cancelled.`);
          return;
        }

        // Feedback
        interaction.editReply(`${ emojis.success } ${ member },  ${ audioFilter } has been toggled, it is now **${ isEnabled ? emojis.success + ' Enabled' : emojis.error + ' Disabled' }**`);
        break;
      }

      case 'reset': {
        // Check verification prompt
        const verification = options.getBoolean('verification');
        if (!verification) {
          interaction.reply(`${ emojis.error } ${ member }, you didn't select \`true\` on the confirmation prompt - this command has been cancelled`);
          return;
        }

        // Check any is active
        if (guildAudioFilters.length === 0) {
          interaction.reply(`${ emojis.error } ${ member }, you are already using default audio filters (all disabled) - this command has been cancelled`);
          return;
        }

        // Disable all filters
        queue.filters.ffmpeg.setFilters(false);

        // Feedback
        interaction.reply(`${ emojis.success } ${ member }, all audio filters have been disabled`);
        break;
      }

      // Default list action
      case 'list':
      default: {
        // Reply with overview
        const guildDisabledAudioFilters = queue.filters.ffmpeg.getFiltersDisabled();
        await interaction.reply({ embeds: [
          {
            color: colorResolver(),
            author: {
              name: `Configured audio filters for ${ guild.name }`,
              icon_url: guild.iconURL({ dynamic: true })
            },
            description: stripIndents`
              ${ guildAudioFilters.map((e) => `${ emojis.success } ${ e }`).join('\n') }
              ${ guildDisabledAudioFilters.map((e) => `${ emojis.error } ${ e }`).join('\n') }
            `,
            footer: { text: 'These audio effects only apply on a per-session basis - this is intended behavior. We may add persistent audio filters in the future if enough people show interest' }
          }
        ] });
        break;
      }
    }
  }
});
