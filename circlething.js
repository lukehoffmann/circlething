'use strict'

const version = 0.12

// Invalidate storage from older versions
if ((localStorage.getItem('version') || -1) < version) {
  localStorage.clear()
  localStorage.setItem('version', version)
}

const Circlething = function () {
  const columns = 3
  const rows = 6
  const colors = ['red', 'orange', 'pink', 'purple']
  const purpleMultiplier = 5
  const minimumComboSize = 3
  const comboScores = {
    // Roughly based on
    //    score = (combosize - 1) ^ 2.7
    3: 10,
    4: 20,
    5: 40,
    6: 75,
    7: 120,
    8: 180,
    9: 250,
    10: 350,
    11: 460,
    12: 600,
    13: 750,
    14: 900,
    15: 1200,
    16: 1350,
    17: 1600,
    18: 2000,
  }
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
    document.querySelectorAll('.gamepiece').forEach(e => e.remove())
    document.querySelectorAll('.column').forEach(e => e.remove())

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
    piece.addEventListener('mouseleave', pieceHoverEnd)
    piece.addEventListener('click', pieceClick)
    return piece
  }

  function pieceHover () {
    clearScorePreview()
    const combo = getCombo(this)
    if (combo.canScore) {
      clearClass('highlight')
      combo.forEach(piece => piece.classList.add('highlight'))
      showScorePreview(combo)
    }
  }

  function pieceHoverEnd () {
    clearScorePreview()
    clearClass('highlight')
  }

  function pieceClick () {
    if (document.querySelector('body').classList.contains('endgame')) {
      startGame()
    } else {
      const combo = getCombo(this)
      if (combo.canScore) {
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
    score += combo.score
    recordHighScore(score, combo.color)
    showScore(score, combo.color)
  }
  
  function showScore (score, color) {
    clearScorePreview()
    const e = document.querySelector('#score')
    e.textContent = score
    setColor(e, color)
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
    const isHighest = (score >= Number(highScore))

    const oldHighest = document.querySelector('#highest')
    oldHighest.style.display = show && !isHighest ? 'block' : 'none'
    setColor(oldHighest, highScoreColor)

    document.querySelector('#newhighest')
      .style.display = show && isHighest ? 'inline' : 'none'

    document.querySelector('#highscore').textContent = highScore
  }

  function showScorePreview (combo) {
    document.querySelector('#nextscore').textContent = combo.score
    
    const preview = document.querySelector('#scorepreview')
    setColor(preview, combo.color)
    preview.style.display = 'inline'
  }

  function clearScorePreview () {
    document.querySelector('#nextscore').textContent = '0'
    document.querySelector('#scorepreview').style.display = 'none'
  }

  function deleteCombo (combo, callback) {
    combo.forEach(p => {
      p.removeAttribute('id')
      p.removeAttribute('.gamepiece')
      p.classList.add('fadeout')
      setTimeout(() => p.remove(), 300)
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
    const pieces = document.querySelector('#gameboard').querySelectorAll('.gamepiece')
    return !Array.from(pieces)
      .some(element => getCombo(element).canScore)
  }

  function invokeEndgame () {
    document.querySelector('body').classList.add('endgame')
    document.querySelector('#gameboard').classList.add('endgame')
    showHighScore(true)
  }

  function getCombo (piece) {
    addClassToCombo(piece, 'temp')
    let combo = Array.from(document.querySelectorAll('.temp'))
    clearClass('temp')

    combo.color = combo[0].getAttribute('color')
    combo.canScore = (combo.length >= minimumComboSize)

    const scoreMultiplier = combo.color == 'purple' ? purpleMultiplier : 1
    combo.score = combo.canScore ? comboScores[combo.length] * scoreMultiplier : 0
  
    return combo
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

  const colorWeightings = [
    1,
    1,
    1,
    1 / purpleMultiplier
  ]
  const colorWeightTotal = colorWeightings.reduce((sum, x) => sum + x, 0)
  const colorWeightRanges = colorWeightings
    .map(x => x / colorWeightTotal)
    .map((x => weight => x += weight)(0))
  
  function randomColor () {
    const colorSelection = Math.random()
    return colors[colorWeightRanges.findIndex(n => n > colorSelection)]
  }

  function recolorTitleAndFavicon () {
    recolorTitle()
    recolorFavicon()
  }

  function recolorTitle () {
    document.querySelectorAll('.random')
      .forEach(e => setColor(e, randomColor()))
  }

  function setColor (element, color) {
    element.classList.remove(...colors)
    element.classList.add(color)
  }

  function recolorFavicon () {
    document.querySelector('#randomfavicon')
      .setAttribute('href', randomColor().concat('.png'))
  }

  function debug (message) {
    const debugText = document.querySelector('#debug')
    debugText.textContent = message
    debugText.style.display = message ? 'block' : 'inline'
  }
}

Circlething()
