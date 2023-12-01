const { ComponentCommand } = require('../../classes/Commands');
const { MS_IN_ONE_SECOND } = require('../../constants');
const { getGuildSettings } = require('../../modules/db');
const { requireSessionConditions, musicEventChannel } = require('../../modules/music');
const { clientConfig } = require('../../util');
const {
  useMainPlayer, useQueue, EqualizerConfigurationPreset
} = require('discord-player');
const player = useMainPlayer();

module.exports = new ComponentCommand({ run: async (client, interaction) => {
  const {
    guild, customId, member
  } = interaction;
  const { emojis } = client.container;
  const [
    , // @ char, marks dynamic command/action
    , // command name
    componentMemberId,
    url
  ] = customId.split('@');
  if (member.id !== componentMemberId) {
    interaction.reply(`${ emojis.error } ${ member }, this component isn't meant for you, use the \`/search\` command yourself - this action has been cancelled`);
    return;
  }

  // Check state
  if (!requireSessionConditions(interaction, false, true, false)) return;

  // Ok, safe to access voice channel and initialize
  const channel = member.voice?.channel;

  // Let's defer the interaction as things can take time to process
  await interaction.deferReply();

  try {
    // Resolve settings
    const settings = getGuildSettings(guild.id);

    // Use thread channels
    let eventChannel = interaction.channel;
    if (settings.useThreadSessions) {
      eventChannel = await musicEventChannel(client, interaction);
      if (eventChannel === false) return;
    }

    // Resolve volume for this session - clamp max 100
    let volume = settings.volume ?? clientConfig.defaultVolume;
    // Note: Don't increase volume for attachments as having to check
    // and adjust on every song end isn't perfect
    volume = Math.min(100, volume);

    // Resolve leave on end cooldown
    const leaveOnEndCooldown = ((settings.leaveOnEndCooldown ?? 2) * MS_IN_ONE_SECOND);
    const leaveOnEmptyCooldown = ((settings.leaveOnEmptyCooldown ?? 2) * MS_IN_ONE_SECOND);

    // nodeOptions are the options for guild node (aka your queue in simple word)
    // we can access this metadata object using queue.metadata later on
    const { track } = await player.play(
      channel,
      url,
      {
        requestedBy: interaction.user,
        nodeOptions: {
          skipOnNoStream: true,
          leaveOnEnd: true,
          leaveOnEndCooldown,
          leaveOnEmpty: settings.leaveOnEmpty,
          leaveOnEmptyCooldown,
          volume,
          metadata: {
            channel: eventChannel,
            member,
            timestamp: interaction.createdTimestamp
          }
        }
      }
    );

    // Use queue
    const queue = useQueue(guild.id);

    // Now that we have a queue initialized,
    // let's check if we should set our default repeat-mode
    if (Number.isInteger(settings.repeatMode)) queue.setRepeatMode(settings.repeatMode);

    // Set persistent equalizer preset
    if (
      queue.filters.equalizer
      && settings.equalizer
      && settings.equalizer !== 'null'
    ) {
      queue.filters.equalizer.setEQ(EqualizerConfigurationPreset[settings.equalizer]);
      queue.filters.equalizer.enable();
    }
    else queue.filters.equalizer.disable();

    // Feedback
    await interaction.editReply(`${ emojis.success } ${ member }, enqueued **\`${ track.title }\`**!`);
  }
  catch (e) {
    interaction.editReply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
  }
} });
