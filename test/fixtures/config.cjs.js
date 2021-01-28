const inject = require('@rollup/plugin-inject')

module.exports = {
  plugins: [inject({noop: 'noop3'})],
}
