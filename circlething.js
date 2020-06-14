'use strict'

var Circlething = function () {
  var columns = 3
  var rows = 6
  var pieceSize = 70 // px
  var colors = ['red', 'orange', 'pink', 'purple']
  var minimumMatch = 3

  function ready (fn) {
    if (document.readyState !== 'loading') {
      fn()
    } else {
      document.addEventListener('DOMContentLoaded', fn)
    }
  }

  ready(function () {
    const board = document.querySelector('#gameboard')
    board.style.width = columns * pieceSize + 'px'
    board.style.height = rows * pieceSize + 'px'

    board.addEventListener('mouseleave', () => clearClass('highlight'))

    startGame()
  })

  var startGame = function () {
    document.querySelector('body').classList.remove('endgame')
    document.querySelector('#gameboard').classList.remove('endgame')
    recolorTitle()
    recolorFavicon()

    document.querySelectorAll('.gamepiece')
      .forEach(e => e.parentElement.removeChild(e))
    document.querySelectorAll('.column')
      .forEach(e => e.parentElement.removeChild(e))

    var c, r, column, piece
    for (c = 1; c <= columns; c++) {
      column = newColumn(c)
      document.querySelector('#gameboard').appendChild(column)
      for (r = 1; r <= rows; r++) {
        piece = newPiece(c, r)
        piece.classList.add('hide')
        column.append(piece)
        piece.classList.add('show')
        piece.classList.remove('hide')
      }
    }
    while (detectEndgame()) {
      startGame()
    }
  }

  var newColumn = function (c) {
    var d = document.createElement('div')
    d.classList.add('column')
    d.setAttribute('id', 'col' + c)
    d.style.width = pieceSize + 'px'
    d.style.height = rows * pieceSize + 'px'
    return d
  }

  var newPiece = function (c, r) {
    var color = randomColor() + 'gamepiece'
    var d = document.createElement('div')
    d.classList.add('gamepiece')
    d.classList.add(color)
    d.setAttribute('color', color)
    d.setAttribute('id', pieceId(c, r))
    d.style.width = pieceSize + 'px'
    d.style.height = pieceSize + 'px'
    d.addEventListener('mouseover', pieceHover)
    d.addEventListener('click', pieceClick)
    return d
  }

  var pieceHover = function () {
    clearClass('highlight')
    if (addClassToAdjacentPieces(this, 'highlight') < minimumMatch) {
      clearClass('highlight')
    }
  }

  var pieceClick = function () {
    if (document.querySelector('body').classList.contains('endgame')) {
      startGame()
    } else {
      clearClass('delete')
      var toDelete = addClassToAdjacentPieces(this, 'delete')
      var removed = 0
      console.log(`todelete ${toDelete}`)
      if (toDelete >= minimumMatch) {
        document.querySelectorAll('.delete').forEach(e => {
          e.removeAttribute('id')
          e.parentNode.removeChild(e)
          removed++
          if (removed === toDelete) {
            rebuildIds()
            detectEndgame()
          }
        })
      }
    }
  }

  var rebuildIds = function () {
    for (var c = 1; c <= columns; c++) {
      for (var r = rows; r >= 1; r--) {
        var above = r - 1
        while (above > 0 && !pieceExists(c, r)) {
          if (pieceExists(c, above)) {
            getPiece(c, above).setAttribute('id', pieceId(c, r))
          }
          above--
        }
        if (!pieceExists(c, r)) {
          var col = document.querySelector('#col' + c)
          var piece = newPiece(c, r)
          piece.classList.add('hide')
          col.prepend(piece)
          piece.classList.add('show')
          piece.classList.remove('hide')
        }
      }
    }
  }

  var detectEndgame = function () {
    var c, r, count
    for (c = 1; c <= columns; c++) {
      for (r = 1; r <= rows; r++) {
        count = addClassToAdjacentPieces(getPiece(c, r), 'temp')
        clearClass('temp')
        if (count >= minimumMatch) {
          return false
        }
      }
    }
    document.querySelector('body').classList.add('endgame')
    document.querySelector('#gameboard').classList.add('endgame')
    return true
  }

  var addClassToAdjacentPieces = function (div, newClass, color) {
    color = color || div.getAttribute('color')
    if (div && div.getAttribute('color') === color && !div.classList.contains(newClass)) {
      var c = +piecePos(div).column
      var r = +piecePos(div).row

      div.classList.add(newClass)
      return 1 +
            addClassToAdjacentPieces(getPiece(c, r - 1), newClass, color) +
            addClassToAdjacentPieces(getPiece(c, r + 1), newClass, color) +
            addClassToAdjacentPieces(getPiece(c - 1, r), newClass, color) +
            addClassToAdjacentPieces(getPiece(c + 1, r), newClass, color)
    } else {
      return 0
    }
  }

  var clearClass = function (className) {
    document.querySelectorAll('.gamepiece')
      .forEach(e => e.classList.remove(className))
  }

  var getPiece = function (c, r) {
    return document.querySelector(`[id="${pieceId(c, r)}"]`)
  }

  var pieceExists = function (c, r) {
    return document.querySelectorAll(`[id="${pieceId(c, r)}"]`).length > 0
  }

  var pieceId = function (c, r) {
    return c.toString() + '_' + r.toString()
  }

  var piecePos = function (div) {
    var id = div.getAttribute('id') || ''
    var pos = []
    pos.column = +id.split('_')[0] || 0
    pos.row = +id.split('_')[1] || 0
    return pos
  }

  var randomColor = function () {
    return colors[Math.floor(Math.random() * (colors.length - 0.9))]
  }

  // re-generate random colors outside of gameboard
  var recolorTitle = function () {
    document.querySelectorAll('.random').forEach(e => {
      for (const color of colors) {
        e.classList.remove(color)
      }
      e.classList.add(randomColor())
    })
  }

  // debugging recolor
  document.querySelector('body').click(function () {
    recolorTitle()
    recolorFavicon()
  })

  // randomise the favicon
  var recolorFavicon = function () {
    var ico = randomColor().concat('.png')
    document.querySelector('#randomfavicon').setAttribute('href', ico)
  }
}

Circlething()
