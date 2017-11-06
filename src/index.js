
(function() {
  var palettes = [
    {
      background: {
        hex: '#f1948a',
        rgb: [241, 148, 138]
      },
      highlight: {
        hex: '#ed8277',
        rgb: [237, 130, 119]
      }
    },
    {
      background: {
        hex: '#8080ff',
        rgb: [128, 128, 255]
      },
      highlight: {
        hex: '#7070f7',
        rgb: [112, 112, 247]
      }
    }
  ]

  window.palette = palettes[Math.floor(Math.random() * palettes.length)]

  var background = window.palette.background.hex
  var highlight = window.palette.highlight.hex

  document.body.style.backgroundColor = background
  document.querySelector('.introduction__button').style.background = highlight

  var rects = document.querySelectorAll('.title__rect--background')
  
  for (var i = 0; i < rects.length; i++) {
    rects[i].setAttribute('fill', highlight)
  }  
})()
