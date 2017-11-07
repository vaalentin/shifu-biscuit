;(function() {
  // palettes
  var palettes = [
    {
      background: { hex: '#f1948a', rgb: [241, 148, 138] },
      highlight: { hex: '#ed8277', rgb: [237, 130, 119] },
      extras: [
        { hex: '#8af194', rgb: [138, 241, 148] },
        { hex: '#948af1', rgb: [148, 138, 241] },
        { hex: '#f18ab4', rgb: [241, 138, 180] }
      ]
    },
    {
      background: { hex: '#8080ff', rgb: [128, 128, 255] },
      highlight: { hex: '#7070f7', rgb: [112, 112, 247] },
      extras: [
        { hex: '#ff7f00', rgb: [255, 127, 0] },
        { hex: '#00ff7f', rgb: [0, 255, 127] },
        { hex: '#ff007f', rgb: [255, 0, 127] }
      ]
    }
  ]

  // get count cookie
  var cookies = document.cookie.split(';')

  var count

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim()

    var parts = cookie.split('=')
    var name = parts[0]
    var value = parts[1]

    if (name.trim() === 'count') {
      count = parseInt(value)
    }
  }

  if (count == null) {
    count = 0
  }

  window.palette = palettes[count % 2]

  // update count cookie
  var date = new Date()
  date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000)
  expires = date.toUTCString()

  document.cookie = 'count=' + ++count + '; expires=' + expires + '; path=/'

  // set dom colors
  var background = window.palette.background.hex
  var highlight = window.palette.highlight.hex

  document.body.style.backgroundColor = background
  document.querySelector('.introduction__button').style.background = highlight

  var rects = document.querySelectorAll('.title__rect--background')

  for (var i = 0; i < rects.length; i++) {
    rects[i].setAttribute('fill', highlight)
  }
})()
