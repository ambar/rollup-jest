const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const {execSync} = require('child_process')
const {callbackify, promisify} = require('util')
const Module = require('module')
const {isAbsolute} = require('path')
const concatMerge = require('concat-merge')

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
  const builtins = Module.builtinModules.filter((m) => !m.startsWith('_'))
  return {
    name: 'rollup-plugin-external',
    resolveId(id) {
      // filter relative or absolute imported modules
      if (builtins.includes(id) || (!id.startsWith('.') && !isAbsolute(id))) {
        return false
      }
      return null
    },
  }
}

function requireSource(code, filename) {
  const newModule = new Module(filename, module)
  newModule.paths = Module._nodeModulePaths(path.dirname(filename))
  newModule.filename = filename
  newModule._compile(code, filename)
  return newModule.exports
}

const requireConfig = async (filename, options) => {
  const config = requireSource(
    await transform(
      {
        file: filename,
        code: (await promisify(fs.readFile)(filename)).toString(),
      },
      {
        output: {exports: 'auto'},
      }
    ),
    filename
  )
  if (typeof config === 'function')
    return config(options)
  return config
}

// transform ESM to CJS
const transform = async ({file, code}, userOptions) => {
  const {configFile, ...options} = Object.assign({}, userOptions)
  const defaults = {
    input: file,
    output: {
      format: 'cjs',
    },
    plugins: [memory({file, code}), external()],
  }
  let configFromFile
  if (configFile && (await promisify(fs.stat)(configFile).catch(() => false))) {
    configFromFile = await requireConfig(
      path.resolve(process.cwd(), configFile),
      options
    )
  }
  const rollupOptions = concatMerge(defaults, {
    ...options,
    plugins: (options.plugins || []).map((plugin) => {
      if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
        return require(plugin[0])(plugin[1])
      }
      return plugin
    }),
    ...configFromFile,
  })
  const {generate} = await rollup.rollup(rollupOptions)
  const {output} = await generate(rollupOptions.output)
  return output[0].code
}

exports.transform = transform

// const deasync = require('deasync')
// const transformSync = deasync(callbackify(transform))
const cli = require.resolve('./cli.js')

const findOptions = (transform, file) => {
  if (!Array.isArray(transform)) {
    return null
  }

  const t = transform.find(
    ([pattern, transformer]) =>
      transformer === __filename && RegExp(pattern).test(file)
  )
  return t ? t[2] : null
}

exports.process = (code, file, config) => {
  const options = config.transformerConfig || findOptions(config.transform, file)
  // https://github.com/facebook/jest/pull/9889
  return execSync(
    `node --unhandled-rejections=strict --abort-on-uncaught-exception "${cli}"`,
    {env: {...process.env, code, file, options: JSON.stringify(options)}}
  ).toString()

  // Jest 26 (with Node 12) is not working with deasync
  // return transformSync({file, code})
}
