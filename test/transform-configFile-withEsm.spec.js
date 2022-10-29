import {transform} from '../transform'

describe('transform', () => {
  it('should add custom plugin with esm config', async () => {
    const code = `noop()`
    const file = './null.js'
    const result = await transform(
      {code, file},
      {
        configFile: 'test/fixtures/config.esm.js',
      }
    )
    expect(result.code).toMatch(/noop3/)
  })
})
