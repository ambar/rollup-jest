import inject from '@rollup/plugin-inject'
import nodeResolve from '@rollup/plugin-node-resolve'
import {transform} from '..'
import {resolve} from 'path'

describe('process', () => {
  const warn = jest.fn(console.warn)
  const oldConsole = global.console
  global.console = {...oldConsole, warn}
  afterAll(() => {
    global.console = oldConsole
  })

  it('should transform', async () => {
    const code = `
        export const foo =  42
        export {default as noop} from 'noop3'
        export {URL} from 'url'
    `
    const file = './null.js'
    expect(await transform({code, file})).toMatchSnapshot()
    expect(warn.mock.calls.join('')).not.toMatch(
      /could not be resolved – treating it as an external dependency/
    )
  })

  it('should provide a sourcemap if requested', async () => {
    const code = `
        export const foo =  42
        export {default as noop} from 'noop3'
        export {URL} from 'url'
    `
    const file = './null.js'
    expect(
      await transform({code, file}, {output: {sourcemap: true}})
    ).toMatchSnapshot()
    expect(warn.mock.calls.join('')).not.toMatch(
      /could not be resolved – treating it as an external dependency/
    )
  })

  it('should transform imports if requested', async () => {
    const code = `
      import { foo } from './fixtures/utils'
      export {URL} from 'url'

      console.log(foo)
    `
    const file = resolve(__dirname, './null.js')
    expect(
      await transform({code, file}, {resolveImports: true})
    ).toMatchSnapshot()
    expect(warn.mock.calls.join('')).not.toMatch(
      /could not be resolved – treating it as an external dependency/
    )
  })

  it('should transform imports if requested, with nodeResolve', async () => {
    // for proper code, we'd also need commonjs to properly resolve noop3 (CJS module), but it's enough for the test
    const code = `
      import * as noop from 'noop3'
      import { foo } from './fixtures/utils'
      export {URL} from 'url'

      console.log(foo, noop)
    `
    const file = resolve(__dirname, './null.js')
    expect(
      await transform(
        {code, file},
        {resolveImports: true, plugins: [nodeResolve()]}
      )
    ).toMatchSnapshot()
    expect(warn.mock.calls.join('')).not.toMatch(
      /could not be resolved – treating it as an external dependency/
    )
  })

  it('should transform imports if requested relative', async () => {
    const code = `
      import * as noop from 'noop3'
      import { foo } from './fixtures/utils'
      export {URL} from 'url'

      console.log(foo, noop)
    `
    const file = resolve(__dirname, './null.js')
    expect(
      await transform({code, file}, {resolveImports: 'relative'})
    ).toMatchSnapshot()
    expect(warn.mock.calls.join('')).not.toMatch(
      /could not be resolved – treating it as an external dependency/
    )
  })

  it('should add custom plugin', async () => {
    const code = `noop()`
    const file = './null.js'
    expect(
      await transform(
        {code, file},
        {
          plugins: [inject({noop: 'noop3'})],
        }
      )
    ).toMatch(/noop3/)
  })

  it('should add custom plugin with babel-like require', async () => {
    const code = `noop()`
    const file = './null.js'
    expect(
      await transform(
        {code, file},
        {
          plugins: [['@rollup/plugin-inject', {noop: 'noop3'}]],
        }
      )
    ).toMatch(/noop3/)
  })

  it('should add custom plugin with cjs config', async () => {
    const code = `noop()`
    const file = './null.js'
    expect(
      await transform(
        {code, file},
        {
          configFile: 'test/fixtures/config.cjs.js',
        }
      )
    ).toMatch(/noop3/)
  })

  it('should add custom plugin with esm config', async () => {
    const code = `noop()`
    const file = './null.js'
    expect(
      await transform(
        {code, file},
        {
          configFile: 'test/fixtures/config.esm.js',
        }
      )
    ).toMatch(/noop3/)
  })

  it('should add custom plugin with cjs config function', async () => {
    const code = `noop()`
    const file = './null.js'
    expect(
      await transform(
        {code, file},
        {
          configFile: 'test/fixtures/config.cjs.js',
          args: {noop: 'noop3'},
        }
      )
    ).toMatch(/noop3/)
  })

  it('should add custom plugin with esm config that imports esm config', async () => {
    const code = `noop()`
    const file = './null.js'
    expect(
      await transform(
        {code, file},
        {
          configFile: 'test/fixtures/config.import.js',
        }
      )
    ).toMatch(/noop3/)
  })
})
