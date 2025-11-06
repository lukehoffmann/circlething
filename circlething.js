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
  const minimumComboSize = 3

  const colorMultipliers = {
    'red': 1,
    'orange': 1,
    'pink': 1,
    'purple': 5
  }

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

  const coloring = new Coloring(colorMultipliers)
  const scoring = new Scoring(comboScores, colorMultipliers)

  const game = new Game(
    columns,
    rows,
    minimumComboSize,
    coloring,
    scoring,
    (piece) => {
      piece.addEventListener('mouseover', pieceHover)
      piece.addEventListener('mouseleave', pieceHoverEnd)
      piece.addEventListener('click', pieceClick)
    },
    debug
  )

  if (document.readyState !== 'loading') {
    onReady()
  } else {
    document.addEventListener('DOMContentLoaded', onReady)
  }

  function onReady() {
    game.body = document.querySelector('body')
    game.board = document.getElementById('gameboard')

    randomiseColors()
    document.addEventListener('click', randomiseColors)
    startGame()
  }

  function startGame() {
    // clear everything from previous games
    scoring.reset()
    showScore(scoring.score)
    showHighScore(false)

    game.clearBoard()
    game.ended = false

    game.fillBoard()

    // if the board is unplayable, try again
    while (!game.canPlay()) {
      startGame()
    }
  }

  function pieceHover() {
    clearScorePreview()
    game.clearClass('highlight')

    const combo = game.getCombo(this)
    if (combo.canPlay) {
      combo.forEach(piece => piece.classList.add('highlight'))
      showScorePreview(combo)
    }
  }

  function pieceHoverEnd() {
    clearScorePreview()
    game.clearClass('highlight')
  }

  function pieceClick() {

    if (game.ended) {
      startGame()
    } else {
      const combo = game.getCombo(this)
      if (combo.canPlay) {
        scoring.update(combo.score, combo.color)
        showScore(scoring.score, combo.color)
        deleteCombo(combo, () => {
          game.dropPieces()
          if (!game.canPlay())
            endGame()
        })
      }
    }
  }

  function showScore(score, color) {
    clearScorePreview()
    const e = document.getElementById('score')
    e.textContent = score
    coloring.setColor(e, color)
  }

  function showHighScore(show) {
    const [highScore, highScoreColor] = scoring.highScore
    const isHighest = (scoring.score >= Number(highScore))

    const oldHighest = document.getElementById('highest')
    oldHighest.style.display = show && !isHighest ? 'block' : 'none'
    coloring.setColor(oldHighest, highScoreColor)

    document.getElementById('newhighest')
      .style.display = show && isHighest ? 'inline' : 'none'

    document.getElementById('highscore').textContent = highScore
  }

  function showScorePreview(combo) {
    document.getElementById('nextscore').textContent = combo.score

    const preview = document.getElementById('scorepreview')
    coloring.setColor(preview, combo.color)
    preview.style.display = 'inline'
  }

  function clearScorePreview() {
    document.getElementById('nextscore').textContent = '0'
    document.getElementById('scorepreview').style.display = 'none'
  }

  function deleteCombo(combo, callback) {
    combo.forEach(p => {
      p.removeAttribute('id')
      p.removeAttribute('.gamepiece')
      p.classList.add('fadeout')
      setTimeout(() => p.remove(), 300)
    })
    setTimeout(callback, 300)
  }

  function endGame() {
    game.ended = true
    showHighScore(true)
  }

  function randomiseColors() {
    const randomItems = Array.from(document.getElementsByClassName('random'))
    randomItems.forEach(e => coloring.setColor(e))

    document.getElementById('randomfavicon')
      .setAttribute('href', coloring.randomColor().concat('.png'))
  }

  function debug(message) {
    const debugText = document.getElementById('debug')
    debugText.textContent = message
    debugText.style.display = message ? 'block' : 'inline'
  }
}

class Game {
  constructor(columns, rows, minimumComboSize, coloring, scoring, pieceCreated, debug) {
    this.columns = columns
    this.rows = rows
    this.minimumComboSize = minimumComboSize
    this.coloring = coloring
    this.scoring = scoring
    this.pieceCreated = pieceCreated
    this.debug = debug
  }

  _board = null
  get board() {
    return this._board
  }
  set board(value) {
    this._board = value
  }

  _body = null
  set body(value) {
    this._body = value
  }

  get ended() {
    return this._body?.classList.contains('endgame')
  }
  set ended(value) {
    if (value) {
      this._body?.classList.add('endgame')
    } else {
      this._body?.classList.remove('endgame')
    }
  }

  fillBoard() {
    // populate a new board
    for (let c = 1; c <= this.columns; c++) {
      this.board.appendChild(this.newColumn(c))
    }
  }

  newColumn(c) {
    const column = document.createElement('div')
    column.classList.add('column')
    column.setAttribute('id', `col${c}`)
    for (let r = 1; r <= this.rows; r++) {
      column.appendChild(this.newPiece(c, r))
    }
    return column
  }

  newPiece(c, r) {
    const piece = document.createElement('div')

    const color = this.coloring.randomColor()
    piece.classList.add('gamepiece', `${color}gamepiece`)
    piece.setAttribute('color', color)
    piece.setAttribute('id', this.pieceId(c, r))
    this.pieceCreated(piece)
    return piece
  }

  get pieces() {
    return Array.from(this.board.getElementsByClassName('gamepiece'))
  }

  getPiece(c, r) {
    return this.board.getElementsByClassName('gamepiece').namedItem(this.pieceId(c, r))
  }

  pieceExists(c, r) {
    return !!this.getPiece(c, r)
  }

  canPlay() {
    return this.pieces.some(pieces => this.getCombo(pieces).canPlay)
  }

  getCombo(piece) {
    let combo = this.detectCombo(piece)

    combo.canPlay = (combo.length >= this.minimumComboSize)
    combo.score = combo.canPlay ? this.scoring.calculateScore(combo.length, combo.color) : 0

    return combo
  }

  dropPieces() {
    for (let c = 1; c <= this.columns; c++) {
      // iterate row from bottom to top
      for (let r = this.rows; r >= 1; r--) {
        // move pieces down to fill gaps
        let rowAbove = r - 1
        while (rowAbove > 0 && !this.pieceExists(c, r)) {
          if (this.pieceExists(c, rowAbove)) {
            this.getPiece(c, rowAbove).setAttribute('id', this.pieceId(c, r))
          }
          rowAbove--
        }
        // backfill empty gap at top of column
        if (!this.pieceExists(c, r)) {
          this.board.getElementsByClassName('column').namedItem(`col${c}`).prepend(this.newPiece(c, r))
        }
      }
    }
  }

  detectCombo(piece, comboClass, color) {
    const tempClass = comboClass || `temp${piece.id}`
    color = color || piece.getAttribute('color')
    if (piece && piece.getAttribute('color') === color && !piece.classList.contains(tempClass)) {
      piece.classList.add(tempClass)

      const position = this.piecePosition(piece)
      const c = position.column
      const r = position.row
      this.detectCombo(this.getPiece(c, r - 1), tempClass, color)
      this.detectCombo(this.getPiece(c, r + 1), tempClass, color)
      this.detectCombo(this.getPiece(c - 1, r), tempClass, color)
      this.detectCombo(this.getPiece(c + 1, r), tempClass, color)
    }
    if (!comboClass) {
      const combo = Array.from(this._board.getElementsByClassName(tempClass))
      combo.color = color
      this.clearClass(tempClass)
      return combo
    }
  }

  clearClass(className) {
    Array.from(this._board.getElementsByClassName('gamepiece')).forEach(e => e.classList.remove(className))
  }

  clearBoard() {
    Array.from(this._board.getElementsByClassName('gamepiece')).forEach(function (e) { e.remove() })
    Array.from(this._board.getElementsByClassName('column')).forEach(function (e) { e.remove() })
  }

  pieceId(c, r) {
    return c.toString() + '_' + r.toString()
  }

  piecePosition(piece) {
    const id = piece.getAttribute('id') || ''
    const cr = id.split('_')
    return {
      column: +cr[0] || 0,
      row: +cr[1] || 0
    }
  }
}

class Scoring {
  constructor(comboScores, colorMultipliers) {
    this.current = 0

    this.comboScores = comboScores
    this.colorMultipliers = colorMultipliers
  }

  get score() {
    return this.current
  }

  reset() {
    this.current = 0
  }

  calculateScore(comboSize, comboColor) {
    return this.comboScores[comboSize] * this.colorMultipliers[comboColor]
  }

  update(score, color) {
    this.current += score
    if (this.current > localStorage.getItem('highScore') || 0) {
      localStorage.setItem('highScore', score)
      localStorage.setItem('highScoreColor', color)
    }
  }

  get highScore() {
    return [
      localStorage.getItem('highScore') || 0,
      localStorage.getItem('highScoreColor')
    ]
  }
}

class Coloring {
  constructor(colorMultipliers) {
    this.colors = Object.keys(colorMultipliers)

    const colorWeightings = Object.values(colorMultipliers).map(w => 1 / w)
    const colorWeightTotal = colorWeightings.reduce((sum, x) => sum + x, 0)

    this.colorWeightRanges = colorWeightings
      .map(x => x / colorWeightTotal)
      .map((x => weight => x += weight)(0))
  }

  randomColor() {
    const colorSelection = Math.random()
    return this.colors[this.colorWeightRanges.findIndex(n => n > colorSelection)]
  }

  setColor(element, color) {
    element.classList.remove(...this.colors)
    element.classList.add(color || this.randomColor())
  }
}

Circlething()
