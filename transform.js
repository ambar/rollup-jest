const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const {execSync} = require('child_process')
const {promisify} = require('util')
const Module = require('module')
const {dirname, isAbsolute} = require('path')
const concatMerge = require('concat-merge')
const {createHash} = require('crypto')

// resolve module in memory without accessing the file system
const memory = ({file, code, useCache}) => {
  return {
    name: 'rollup-plugin-memory',
    resolveId(id) {
      return id === file ? id : null
    },
    load(id) {
      return useCache && id === file ? code : null
    },
  }
}

// mark third party or builtin modules as external
const external = (resolveImports) => {
  const builtins = Module.builtinModules
  return {
    name: 'rollup-plugin-external',
    resolveId(id) {
      if (
        !resolveImports ||
        builtins.includes(id) ||
        (resolveImports === 'relative' &&
          !(id.startsWith('.') || isAbsolute(id)))
      ) {
        return false
      }
      return null
    },
  }
}

const requireSource = (code, filename) => {
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
        resolveImports: 'relative',
      }
    ),
    filename
  )
  if (typeof config === 'function') return config(options)
  return config
}

const loadOptions = async ({file, code}, userOptions) => {
  const {configFile, args, resolveImports, ...options} = Object.assign(
    {},
    userOptions
  )
  const useCache = 'useCache' in options ? options.useCache : true
  delete options.useCache

  const defaults = {
    input: file,
    output: {
      format: 'cjs',
      dir: dirname(file),
    },
    plugins: [memory({file, code, useCache}), external(resolveImports)],
  }
  let configFromFile
  if (configFile && (await promisify(fs.stat)(configFile).catch(() => false))) {
    configFromFile = await requireConfig(
      path.resolve(process.cwd(), configFile),
      {...args, ...options}
    )
  }
  const rollupOptions = concatMerge(
    concatMerge(defaults, options),
    configFromFile
  )
  rollupOptions.plugins = (rollupOptions.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
      return require(plugin[0])(plugin[1])
    }
    return plugin
  })
  return rollupOptions
}

/**
 * @see https://github.com/facebook/jest/blob/master/packages/babel-jest/src/index.ts#L199
 */
const getCacheKey = async (code, file, userOptions, config) => {
  const rollupOptions = await loadOptions({code, file}, userOptions)
  return createHash('md5')
    .update(JSON.stringify(rollupOptions))
    .update('\0', 'utf8')
    .update(JSON.stringify(config))
    .update('\0', 'utf8')
    .update(code)
    .update('\0', 'utf8')
    .update(file)
    .update('\0', 'utf8')
    .update(process.env.NODE_ENV || '')
    .digest('hex')
}

const getCacheKeySync = (code, file, userOptions, jconfig) => {
  // this won't guard against rollup config imports changing, but it's better than nothing
  const {configFile} = Object.assign({}, userOptions)
  let config = ''
  try {
    config = fs.readFileSync(configFile)
  } catch {}
  return createHash('md5')
    .update(JSON.stringify(userOptions))
    .update('\0', 'utf8')
    .update(JSON.stringify(jconfig))
    .update('\0', 'utf8')
    .update(code)
    .update('\0', 'utf8')
    .update(file)
    .update('\0', 'utf8')
    .update(config)
    .update('\0', 'utf8')
    .update(process.env.NODE_ENV || '')
    .digest('hex')
}

/**
 * transform ESM to CJS
 * @param {{file: string, code: string}} input
 * @param {{[key:string]: any}} userOptions
 * @returns {Promise<string | {code: string, map: string | null}>}
 */
const transform = async (input, userOptions) => {
  const rollupOptions = await loadOptions(input, userOptions)

  const {generate} = await rollup.rollup(rollupOptions)
  const {output} = await generate(rollupOptions.output)
  const {code, map} = output[0]
  if (rollupOptions.output.sourcemap) return {code, map}
  else return code
}

exports.transform = transform

// const deasync = require('deasync')
// const transformSync = deasync(callbackify(transform))
const cli = require.resolve('./cli.js')

/**
 * Find options from config.transform
 * @param {{[key:string]: string|any[]}} transform
 * @param {string} file
 * @returns {{[key:string]:any}}
 */
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

exports.canInstrument = false

exports.process = (code, file, config) => {
  const options =
    config.transformerConfig || findOptions(config.transform, file)
  // https://github.com/facebook/jest/pull/9889
  return JSON.parse(
    execSync(
      `node --unhandled-rejections=strict --abort-on-uncaught-exception "${cli}"`,
      {env: {...process.env, code, file, options: JSON.stringify(options)}}
    ).toString()
  )

  // Jest 26 (with Node 12) is not working with deasync
  // return transformSync({file, code})
}
exports.getCacheKey = (code, file, config) => {
  const options =
    config.transformerConfig || findOptions(config.transform, file)
  return getCacheKeySync(code, file, options, config)
}

// async code transformation work only for ESM modules (see https://jestjs.io/docs/ecmascript-modules)
exports.processAsync = async (code, file, config) => {
  const options =
    config.transformerConfig || findOptions(config.transform, file)
  return await transform({code, file}, options)
}
exports.getCacheKeyAsync = async (code, file, config) => {
  const options =
    config.transformerConfig || findOptions(config.transform, file)
  return await getCacheKey(code, file, options, config)
}
