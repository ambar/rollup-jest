const isObject = (obj) => obj !== null && typeof obj === 'object'

const concatMerge = (a, b) => {
  a = isObject(a) ? a : {}
  b = isObject(b) ? b : {}
  const r = {}
  const keys = Object.keys(a).concat(Object.keys(b))
  for (const key of keys) {
    const va = a[key]
    if (key in b) {
      const vb = b[key]
      if (Array.isArray(va)) {
        r[key] = Array.isArray(vb) ? va.concat(vb) : vb
      } else if (isObject(va)) {
        r[key] = isObject(vb) ? concatMerge(va, vb) : vb
      } else {
        r[key] = vb
      }
    } else {
      r[key] = va
    }
  }
  return r
}

module.exports = concatMerge
