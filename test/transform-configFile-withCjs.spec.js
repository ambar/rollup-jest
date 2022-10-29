import {transform} from '../transform'

describe('transform', () => {
  it('should add custom plugin with cjs config', async () => {
    const code = `noop()`
    const file = './null.js'
    const result = await transform(
      {code, file},
      {
        configFile: 'test/fixtures/config.cjs.js',
      }
    )
    expect(result.code).toMatch(/noop3/)
  })
})
