import inject from '@rollup/plugin-inject'
import {transform} from '..'

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

  it('should inject', async () => {
    const code = `noop()`
    const file = './null.js'
    expect(
      await transform(
        {code, file},
        {
          plugins: [inject({noop: 'noop3'})],
        }
      )
    ).toMatchSnapshot()
  })
})
