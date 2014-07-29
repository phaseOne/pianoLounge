// pianod Response Code Mappings
// Scraped from pianod Web Client mappings which don't really make sense

module.exports = {
  101: 'playing',
  102: 'paused',
  103: 'stopped',
  104: 'loading',
  105: 'ended',
  106: 'stalled',

  108: 'noStation',
  109: 'selectedStation',

  111: 'id',
  112: 'album',
  113: 'artist',
  114: 'title',
  115: 'station',
  116: 'rating',
  117: 'url',
  118: 'coverArt',
  119: 'genre',
  120: 'userRating',
  121: 'explanation',

  131: 'yell',
  132: 'activity',
  133: 'news',

  134: 'mixChanged',
  135: 'stationsChanged',
  137: 'userRatingsChanged',

  136: 'privileges',

  141: 'volume',

  100: 'welcome',
  200: 'connection',

  203: 'dataStart',
  204: 'dataEnd',

  405: 'wrongState'
}
