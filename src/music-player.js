const logger = require("@mirasaki/logger");
const {
  colorResolver,
  msToHumanReadableTime,
  clientConfig,
} = require("./util");
const { EmbedBuilder, escapeMarkdown } = require("discord.js");
const { getGuildSettings } = require("./modules/db");
const { MS_IN_ONE_SECOND } = require("./constants");

module.exports = (player) => {
  // this event is emitted whenever discord-player starts to play a track
  player.events.on("playerStart", (queue, track) => {
    queue.metadata.channel.send({
      embeds: [
        new EmbedBuilder({
          color: colorResolver(),
          title: "Started Playing",
          description: `[${escapeMarkdown(track.title)}](${track.url})`,
          thumbnail: { url: track.thumbnail },
          footer: {
            text: `${track.duration} - by ${track.author}\nRequested by: ${queue.metadata.member?.user?.username}`,
          },
        }).setTimestamp(queue.metadata.timestamp),
      ],
    });
  });

  player.events.on("playerError", (err) => {
    logger.syserr("Music Player encountered unexpected error:");
    logger.printErr(err);
  });

  player.events.on("audioTrackAdd", (queue, track) => {
    // Emitted when the player adds a single song to its queue
    queue.metadata.channel.send({
      embeds: [
        {
          color: colorResolver(),
          title: "Track Enqueued",
          description: `[${escapeMarkdown(track.title)}](${track.url})`,
        },
      ],
    });
  });

  player.events.on("audioTracksAdd", (queue, tracks) => {
    // Emitted when the player adds multiple songs to its queue
    queue.metadata.channel.send({
      embeds: [
        {
          color: colorResolver(),
          title: "Multiple Tracks Enqueued",
          description: `**${
            tracks.length
          }** Tracks\nFirst entry: [${escapeMarkdown(tracks[1].title)}](${
            tracks[1].url
          })`,
        },
      ],
    });
  });

  player.events.on("audioTrackRemove", (queue, track) => {
    // Emitted when the player adds multiple songs to its queue
    queue.metadata.channel.send({
      embeds: [
        {
          color: colorResolver(),
          title: "Track Removed",
          description: `[${escapeMarkdown(track.title)}](${track.url})`,
        },
      ],
    });
  });

  player.events.on("audioTracksRemove", (queue, tracks) => {
    // Emitted when the player adds multiple songs to its queue
    queue.metadata.channel.send({
      embeds: [
        {
          color: colorResolver(),
          title: "Multiple Tracks Removed",
          description: `**${
            tracks.length
          }** Tracks\nFirst entry: [${escapeMarkdown(tracks[0].title)}](${
            tracks[0].url
          })`,
        },
      ],
    });
  });

  player.events.on("playerSkip", (queue, track) => {
    // Emitted when the audio player fails to load the stream for a song
    queue.metadata.channel.send({
      embeds: [
        {
          color: colorResolver(),
          title: "Player Skip",
          description: `Track skipped because the audio stream couldn't be extracted: [${escapeMarkdown(
            track.title
          )}](${track.url})`,
        },
      ],
    });
  });

  if (process.env.NODE_ENV !== "production") {
    player.events.on("debug", async (queue, message) => {
      console.log(`Player debug event: ${message}`);
    });
  }
};
