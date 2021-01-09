const {transform} = require('./transform')

const {code, file} = process.env

transform({code, file}).then((r) => process.stdout.write(r))
