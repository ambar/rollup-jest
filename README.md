# rollup-jest

Rollup preprocessor for Jest.

[![Coverage Status](https://coveralls.io/repos/github/ambar/rollup-jest/badge.svg?branch=master)](https://coveralls.io/github/ambar/rollup-jest?branch=master)
[![build status](https://badgen.net/travis/ambar/rollup-jest)](https://travis-ci.org/ambar/rollup-jest)
[![npm version](https://badgen.net/npm/v/rollup-jest)](https://www.npmjs.com/package/rollup-jest)

## Install

```bash
npm install rollup-jest --save-dev
```

## Usage

Add preset to Jest config:

```json
{
  "jest": {
    "preset": "rollup-jest"
  }
}

// alternatively, specifying the files to transform:
{
  "jest": {
    "transform": {
      "\\.m?js$": "rollup-jest"
    },
  }
}

// or with options:
// the preset enables sourcemaps by default
{
  "jest": {
    "transform": {
      "\\.m?js$": ["rollup-jest", {"output": {"sourcemap": true}}]
    },
  }
}
```

Write your tests with ES modules:

```js
import path from 'path'

test('parses extname', () => {
  expect(path.extname('foo.md')).toBe('.md')
})
```

Happy testing!

## Configuration

### Use `configFile` field

```json
{
  "jest": {
    "transform": {
      "\\.js$": ["rollup-jest", {"configFile": "./rollup.config.js"}]
    }
  }
}
```

`rollup.config.js`:

```js
import inject from '@rollup/plugin-inject'

let config
if (process.env.NODE_ENV === 'test') {
  config = {
    plugins: [inject({React: 'react'})],
  }
}

export default config
```

### Use inline config

```json
{
  "jest": {
    "transform": {
      "\\.js$": [
        "rollup-jest",
        {"plugins": [["@rollup/plugin-inject", {"React": "react"}]]}
      ]
    }
  }
}
```

### All options

- `useCache: boolean`: Default `true`. Enable caching of entry module. This can mess with plugins (e.g. typescript).
- `resolveImports: 'relative' | boolean`: Default `false`. Resolve (bundle) imports, either all (incl. packages) or only relative files.
- `args: any`: If your config file exports a function, you can use this field to pass arguments that aren't supported in rollup's `inputOptions`.
- `plugins: Plugin[]`: Gets merged with plugins from config file. Special syntax `[name, options]` allows you to specify the plugin in json without `require`.

## Related

- [es-jest](https://github.com/ambar/es-jest)
- [babel-jest](https://github.com/facebook/jest/tree/master/packages/babel-jest)
- [ts-jest](https://github.com/kulshekhar/ts-jest)
