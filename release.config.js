/* eslint-disable no-template-curly-in-string */
const config = {
  branches: [ 'main' ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [ '@semantic-release/npm', { 'npmPublish': false } ],
    [
      '@semantic-release/git',
      {
        'assets': [
          'CHANGELOG.md',
          'package.json',
          'package-lock.json',
          'npm-shrinkwrap.json'
        ],
        'message': 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    '@semantic-release/github'
  ]
};

module.exports = config;
