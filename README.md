# rollup-jest

Rollup preprocessor for Jest.

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
```

Writes your test with ES modules:

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

Sample `rollup.config.js`:

```js
export default process.env.NODE_ENV ? ... : ...
```

## Related

- [es-jest](https://github.com/ambar/es-jest)
- [babel-jest](https://github.com/facebook/jest/tree/master/packages/babel-jest)
- [ts-jest](https://github.com/kulshekhar/ts-jest)
