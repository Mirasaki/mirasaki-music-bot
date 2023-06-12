const { usePlayer } = require('discord-player');
const { ChatInputCommand } = require('../../classes/Commands');
const { requireSessionConditions } = require('../../modules/music');

const voteSkipCache = new Map();

module.exports = new ChatInputCommand({
  global: true,
  data: { description: 'Vote to skip the currently playing song, requires strict majority to pass' },
  run: async (client, interaction) => {
    const { emojis } = client.container;
    const { guild, member } = interaction;

    if (!requireSessionConditions(interaction, true, false, false)) return;

    try {
      const guildPlayerNode = usePlayer(interaction.guild.id);

      // Get curr track - and update cache
      const currentTrack = guildPlayerNode.queue.currentTrack;
      let voteCacheEntry = voteSkipCache.get(guild.id);

      // Initialize
      if (!voteCacheEntry) {
        voteSkipCache.set(guild.id, {
          track: currentTrack.url,
          votes: []
        });
        voteCacheEntry = voteSkipCache.get(guild.id);
      }

      // Reset, different/new track
      else if (voteCacheEntry.track !== currentTrack.url) {
        voteCacheEntry.track = currentTrack.url;
        voteCacheEntry.votes = [];
      }

      // Check has voted
      if (voteCacheEntry.votes.includes(member.id)) {
        interaction.reply(`${ emojis.error } ${ member }, you have already voted - this command has been cancelled`);
        return;
      }
      // Increment votes
      else voteCacheEntry.votes.push(member.id);

      // Resolve threshold
      const channel = guildPlayerNode.queue.channel;
      const memberCount = channel.members.size - 1; // - 1 for client
      const threshold = Math.min(memberCount, Math.ceil(memberCount / 2) + 1); // + 1 require strict majority
      if (voteCacheEntry.votes.length < threshold) {
        interaction.reply(`${ emojis.success } ${ member }, registered your vote - current votes: ${ voteCacheEntry.votes.length } / ${ threshold }`);
        return;
      }

      // Skip song, reached threshold
      const success = guildPlayerNode.skip();
      if (success) {
        voteSkipCache.delete(guild.id);
        interaction.reply(`${ emojis.success } ${ member }, skipped **\`${ currentTrack.title }\`**, vote threshold was reached`);
      }
      else interaction.reply(`${ emojis.error } ${ member }, something went wrong - couldn't skip current playing song`);
    }
    catch (e) {
      interaction.reply(`${ emojis.error } ${ member }, something went wrong:\n\n${ e.message }`);
    }
  }
});
