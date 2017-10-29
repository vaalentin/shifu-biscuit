const path = require('path')
const fs = require('fs')
const recursive = require('recursive-readdir')
const jsonminify = require('jsonminify')

recursive(path.resolve(__dirname, '../dist'), (err, files) => {
  if (err) {
    throw err
  }

  console.log('Minify jsons.')

  files.filter(file => file.split('.').pop() === 'json').forEach(file => {
    fs.readFile(file, 'utf-8', (err, data) => {
      if (err) {
        throw err
      }

      console.log(`Minify: ${file}.`)

      const minified = jsonminify(data)

      fs.writeFile(file, minified, err => {
        if (err) {
          throw err
        }

        console.log(`Minified ${file}.`)
      })
    })
  })
})
