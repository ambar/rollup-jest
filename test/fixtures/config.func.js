const inject = require('@rollup/plugin-inject')

module.exports = args => {
  return { plugins: [inject({noop: args.noop})] }
}
