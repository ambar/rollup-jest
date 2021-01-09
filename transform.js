const rollup = require('rollup')
const {execSync} = require('child_process')
const {callbackify} = require('util')
const {builtinModules} = require('module')
const {isAbsolute} = require('path')

// resolve module in memory without accessing the file system
const memory = ({file, code}) => {
  return {
    name: 'rollup-plugin-memory',
    resolveId(id) {
      return id === file ? id : null
    },
    load(id) {
      return id === file ? code : null
    },
  }
}

// mark third party or builtin modules as external
const external = () => {
  const builtins = builtinModules.filter((m) => !m.startsWith('_'))
  return {
    name: 'rollup-plugin-external',
    resolveId(id) {
      // filter relative or absolute imported modules
      if (builtins.includes(id) || !id.startsWith('.') || !isAbsolute(id)) {
        return false
      }
      return null
    },
  }
}

// transform ESM to CJS
const transform = async ({file, code}) => {
  const {generate} = await rollup.rollup({
    input: file,
    plugins: [memory({file, code}), external()],
  })
  const {output} = await generate({
    format: 'cjs',
  })
  return output[0].code
}

exports.transform = transform

// const deasync = require('deasync')
// const transformSync = deasync(callbackify(transform))
const cli = require.resolve('./cli.js')

exports.process = (code, file) => {
  // https://github.com/facebook/jest/pull/9889
  return execSync(
    `node --unhandled-rejections=strict --abort-on-uncaught-exception "${cli}"`,
    {env: {...process.env, code, file}}
  ).toString()

  // Jest 26 (with Node 12) is not working with deasync
  // return transformSync({file, code})
}
