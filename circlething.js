'use strict'

const Circlething = function () {
  const columns = 3
  const rows = 6
  const colors = ['red', 'orange', 'pink', 'purple']
  const minimumComboSize = 3
  let score = 0

  if (document.readyState !== 'loading') {
    onReady()
  } else {
    document.addEventListener('DOMContentLoaded', onReady)
  }

  function onReady () {
    recolorTitleAndFavicon()
    document.addEventListener('click', recolorTitleAndFavicon)

    startGame()
  }

  function startGame () {
    // clear everything from previous games
    score = 0
    showScore(score, randomColor())
    showHighScore(false)

    document.querySelector('body').classList.remove('endgame')
    document.querySelector('#gameboard').classList.remove('endgame')
    document.querySelectorAll('.gamepiece')
      .forEach(e => e.parentElement.removeChild(e))
    document.querySelectorAll('.column')
      .forEach(e => e.parentElement.removeChild(e))

    // populate a new board
    for (let c = 1; c <= columns; c++) {
      const column = newColumn(c)
      document.querySelector('#gameboard').appendChild(column)
      for (let r = 1; r <= rows; r++) {
        column.append(newPiece(c, r))
      }
    }

    // if the board is unplayable, try again
    while (isEndgame()) {
      startGame()
    }
  }

  function newColumn (c) {
    const column = document.createElement('div')
    column.classList.add('column')
    column.setAttribute('id', `col${c}`)
    return column
  }

  function newPiece (c, r) {
    const color = randomColor()
    const piece = document.createElement('div')
    piece.classList.add('gamepiece')
    piece.classList.add(`${color}gamepiece`)
    piece.setAttribute('color', color)
    piece.setAttribute('id', pieceId(c, r))
    piece.addEventListener('mouseover', pieceHover)
    piece.addEventListener('mouseleave', () => clearClass('highlight'))
    piece.addEventListener('click', pieceClick)
    return piece
  }

  function pieceHover () {
    const combo = getCombo(this)
    if (combo.length >= minimumComboSize) {
      clearClass('highlight')
      combo.forEach(piece => piece.classList.add('highlight'))
    }
  }

  function pieceClick () {
    if (document.querySelector('body').classList.contains('endgame')) {
      startGame()
    } else {
      const combo = getCombo(this)
      if (combo.length >= minimumComboSize) {
        recordsScore(combo)
        deleteCombo(combo, () => {
          dropPieces()
          if (isEndgame())
            invokeEndgame()
        })
      }
    }
  }

  function recordsScore (combo) {
    score += combo.length * combo.length

    let comboColor = combo[0].getAttribute('color')
    recordHighScore(score, comboColor)
    showScore(score, comboColor)
  }
  
  function showScore (score, color) {
    const e = document.querySelector('#score')
    e.textContent = score
    e.classList.remove(...colors)
    e.classList.add(color)
  }

  function recordHighScore (score, color) {
    if (score > localStorage.getItem('highScore') || 0) {
      localStorage.setItem('highScore', score)
      localStorage.setItem('highScoreColor', color)
    }
  }

  function showHighScore(show) {
    const highScore = localStorage.getItem('highScore') || 0
    const highScoreColor = localStorage.getItem('highScoreColor') || randomColor()
    document.querySelector('#highest').style.display = show ? 'block' : 'none'
    const e = document.querySelector('#highscore')
    e.textContent = highScore
    e.classList.remove(...colors)
    e.classList.add(highScoreColor)
  }

  function deleteCombo (combo, callback) {
    combo.forEach(p => {
      p.removeAttribute('id')
      p.classList.add('fadeout')
      setTimeout(() => p.parentNode.removeChild(p), 300)
    })
    setTimeout(callback, 300)
  }

  function dropPieces () {
    for (let c = 1; c <= columns; c++) {
      // iterate row from bottom to top
      for (let r = rows; r >= 1; r--) {
        // move pieces down to fill gaps
        let rowAbove = r - 1
        while (rowAbove > 0 && !pieceExists(c, r)) {
          if (pieceExists(c, rowAbove)) {
            getPiece(c, rowAbove).setAttribute('id', pieceId(c, r))
          }
          rowAbove--
        }
        // backfill empty gap at top of column
        if (!pieceExists(c, r)) {
          document.querySelector('#col' + c).prepend(newPiece(c, r))
        }
      }
    }
  }

  function isEndgame () {
    for (let c = 1; c <= columns; c++) {
      for (let r = 1; r <= rows; r++) {
        if (getCombo(getPiece(c, r)).length >= minimumComboSize) {
          return false
        }
      }
    }
    // no possible moves
    return true
  }

  function invokeEndgame () {
    document.querySelector('body').classList.add('endgame')
    document.querySelector('#gameboard').classList.add('endgame')
    showHighScore(true)
  }

  function getCombo (piece) {
    addClassToCombo(piece, 'temp')
    var pieces = document.querySelectorAll('.temp')
    clearClass('temp')
    return Array.from(pieces)
  }

  function addClassToCombo (piece, newClass, color) {
    color = color || piece.getAttribute('color')
    if (piece && piece.getAttribute('color') === color && !piece.classList.contains(newClass)) {
      piece.classList.add(newClass)

      const position = piecePosition(piece)
      const c = position.column
      const r = position.row
      addClassToCombo(getPiece(c, r - 1), newClass, color)
      addClassToCombo(getPiece(c, r + 1), newClass, color)
      addClassToCombo(getPiece(c - 1, r), newClass, color)
      addClassToCombo(getPiece(c + 1, r), newClass, color)
    }
  }

  function clearClass (className) {
    document.querySelectorAll('.gamepiece')
      .forEach(e => e.classList.remove(className))
  }

  function getPiece (c, r) {
    return document.querySelector(`[id="${pieceId(c, r)}"]`)
  }

  function pieceExists (c, r) {
    return !!getPiece(c, r)
  }

  function pieceId (c, r) {
    return c.toString() + '_' + r.toString()
  }

  function piecePosition (piece) {
    const id = piece.getAttribute('id') || ''
    const cr = id.split('_')
    return {
      column: +cr[0] || 0,
      row: +cr[1] || 0
    }
  }

  function randomColor () {
    // the last color has 1/10th probability
    return colors[Math.floor(Math.random() * (colors.length - 0.9))]
  }

  function recolorTitleAndFavicon () {
    recolorTitle()
    recolorFavicon()
  }

  function recolorTitle () {
    document.querySelectorAll('.random').forEach(e => {
      e.classList.remove(...colors)
      e.classList.add(randomColor())
    })
  }

  function recolorFavicon () {
    document.querySelector('#randomfavicon')
      .setAttribute('href', randomColor().concat('.png'))
  }
}

Circlething()
