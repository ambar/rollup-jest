const {transform} = require('./transform')

const {code, file, options} = process.env

transform({code, file}, JSON.parse(options)).then((r) =>
  process.stdout.write(JSON.stringify(r))
)
