/**
 * @type {@type {module:Client~ClientConfiguration}}
 */

const { PermissionsBitField } = require('discord.js');

const config = {
  // Note: all the default# properties all configurable by commands
  // This is here so that you can configure everything in one go
  // without having to figure out different commands,
  // if you're not comfortable editing this, use the commands

  // Note: default# properties only take affect the first time
  // playback is initialized in your server/guild

  // Between 0 and 100
  // 100 is obnoxiously loud and will f*** your ears
  defaultVolume: 5,

  // The default repeat mode
  // 0 - Off | Don't repeat
  // 1 - Track | Repeat current track, always - until skipped
  // 2 - Queue | Repeat the entire queue, finished songs get added back at the end of the current queue
  // 3 - Autoplay | Autoplay recommended music when queue is empty
  //
  // 3 = 24/7 autoplay/continuous radio if uninterrupted - only use if you have
  // bandwidth for days
  defaultRepeatMode: 0,

  // Amount of seconds to stay in the voice channel
  // when playback is finished
  // Default: 2 minutes
  defaultLeaveOnEndCooldown: 120,

  // Should the bot leave the voice-channel if there's no other members
  defaultLeaveOnEmpty: true,

  // Time amount of seconds to stay in the voice channel
  // when channel is empty/no other members aside from bot
  // Only active when leaveOnEmpty is true
  // Default: 2 minutes
  defaultLeaveOnEmptyCooldown: 120,

  // When true, will create a thread when the voice session is first initialized
  // and continue to send music/queue events in that thread instead of flooding
  // the channel
  defaultUseThreadSessions: true,

  // When true, and defaultUseThreadSessions is true, will only allow commands involving
  // the current session to be used in the created session Thread channel
  defaultThreadSessionStrictCommandChannel: true,

  // Plugins/Music source extractors
  plugins: {
    fileAttachments: true,
    soundCloud: false,
    appleMusic: true,
    vimeo: true,
    reverbNation: true,
  },

  // Bot activity
  presence: {
    // One of online, idle, invisible, dnd
    status: 'online',
    activities: [
      {
        name: '/play',
        // One of Playing, Streaming, Listening, Watching
        type: 'Listening'
      }
    ]
  },

  // Permission config
  permissions: {
    // Bot Owner, highest permission level (5)
    ownerId: '290182686365188096',

    // Bot developers, second to highest permission level (4)
    developers: [ '' ]
  },

  // The Discord server invite to your Support server
  supportServerInviteLink: 'https://discord.gg/mirasaki',

  // Additional permissions that are considered required when generating
  // the bot invite link with /invite
  permissionsBase: [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.SendMessagesInThreads
  ]
};

module.exports = config;
