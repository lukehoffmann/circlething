'use strict'

const version = 0.13

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
  const scoring = new Scoring(comboScores, colorMultipliers, coloring.randomColor())
  const display = new Display(scoring, coloring)
  const audio = new Audio()
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
    display.debug
  )

  let paused = true

  if (document.readyState !== 'loading') {
    onReady()
  } else {
    document.addEventListener('DOMContentLoaded', onReady)
  }

  function onReady() {
    game.body = document.querySelector('body')
    game.board = document.getElementById('gameboard')

    display.randomise()
    document.addEventListener('click', () => display.randomise())
    startGame()
  }

  function startGame() {
    // clear everything from previous games
    scoring.reset()
    display.updateScore()
    display.highScore = false

    game.clearBoard()
    game.ended = false
    game.fillBoard()

    // if the board is unplayable, try again
    while (!game.canPlay()) {
      startGame()
    }
    paused = false
  }

  function pieceHover() {
    game.clearHighlight()
    display.scorePreview = null
    if (paused) return

    const combo = game.getCombo(this)
    if (combo.canPlay) {
      game.highlightCombo(combo)
      display.scorePreview = combo
    }
  }

  function pieceHoverEnd() {
    game.clearHighlight()
    display.scorePreview = null
  }

  function pieceClick() {
    if (paused) return
    paused = true
    if (game.ended) {
      startGame()
    } else {
      const combo = game.getCombo(this)
      if (combo.canPlay) {
        audio.playComboSound(combo)
        scoring.update(combo)
        display.updateScore()
        deletePieces(combo, () => {
          game.dropPieces()
          if (!game.canPlay())
            endGame()
        })
      }
    }
    paused = false
  }

  function deletePieces(pieces, callback) {
    pieces.forEach(p => {
      p.classList.add('fadeout')
      setTimeout(() => {
        p.remove()
      }, 300)
    })
    setTimeout(callback, 300)
  }

  function endGame() {
    game.ended = true
    display.highScore = true
  }

}

class Audio {
  _audioCtx = null

  get context() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return null
      if (!this._audioCtx) this._audioCtx = new AudioCtx()
      return this._audioCtx
    } catch (e) {
      return null
    }
  }

  _scale = {
    3: 0, 
    4: 2, 
    5: 4, 
    6: 5, 
    7: 7, 
    8: 9, 
    9: 11,
    10: 12,
    11: 14,
    12: 16,
    13: 17,
    14: 19,
    15: 21,
    16: 22,
    17: 23,
    18: 25
  } // major scale

  playComboSound(combo) {
    // frequency maps to combo size and color
    const size = combo.length || 3
    const step = this._scale[size]
    this.playTone(this.stepFreq(step))
  }

  stepFreq(step) {
    const base = 440
    return base * Math.pow(2, step / 12)
  }

  playTone(freq) {
    try {
      const ctx = this.context
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      // short envelope: quick attack, short decay
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.50)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.6)
    } catch (e) {
      // fail silently if audio can't be created
    }
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
    this._body?.classList[value ? 'add' : 'remove']('endgame')
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

  getColumns() {
    return Array.from(this.board.getElementsByClassName('column'))
  }

  getColumn(c) {
    return this.board.getElementsByClassName('column').namedItem(`col${c}`)
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

  getPieces() {
    return Array.from(this.board.getElementsByClassName('gamepiece'))
  }

  getPiece(c, r) {
    return this.board.getElementsByClassName('gamepiece').namedItem(this.pieceId(c, r))
  }

  pieceExists(c, r) {
    return !!this.getPiece(c, r)
  }

  canPlay() {
    return this.getPieces().some(pieces => this.getCombo(pieces).canPlay)
  }

  getCombo(piece) {
    const color = piece.getAttribute('color')

    const tempClass = `temp${piece.id}`
    this.propogateClassByColor(piece, tempClass, color)
    const combo = Array.from(this.board.getElementsByClassName(tempClass))
    this.getPieces().forEach(e => e.classList.remove(tempClass))

    combo.color = color
    combo.canPlay = (combo.length >= this.minimumComboSize)
    combo.score = combo.canPlay ? this.scoring.calculateScore(combo) : 0

    return combo
  }

  propogateClassByColor(piece, comboClass, color) {
    if (piece && piece.getAttribute('color') === color && !piece.classList.contains(comboClass)) {
      piece.classList.add(comboClass)

      const position = this.piecePosition(piece)
      const c = position.column
      const r = position.row
      this.propogateClassByColor(this.getPiece(c, r - 1), comboClass, color)
      this.propogateClassByColor(this.getPiece(c, r + 1), comboClass, color)
      this.propogateClassByColor(this.getPiece(c - 1, r), comboClass, color)
      this.propogateClassByColor(this.getPiece(c + 1, r), comboClass, color)
    }
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
          this.getColumn(c).prepend(this.newPiece(c, r))
        }
      }
    }
  }

  highlightCombo(combo) {
    combo.forEach(piece => piece.classList.add('highlight'))
  }

  clearHighlight() {
    this.getPieces().forEach(e => e.classList.remove('highlight'))
  }

  clearBoard() {
    this.getPieces().forEach(function (e) { e.remove() })
    this.getColumns().forEach(function (e) { e.remove() })
  }

  pieceId(c, r) {
    return `${c.toString()}_${r.toString()}`
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
  constructor(comboScores, colorMultipliers, color) {
    this._current = 0
    this._color = color

    this.comboScores = comboScores
    this.colorMultipliers = colorMultipliers
  }

  get score() {
    return this._current
  }

  get color() {
    return this._color
  }

  reset() {
    this._current = 0
  }

  calculateScore(combo) {
    return this.comboScores[combo.length] * this.colorMultipliers[combo.color]
  }

  update(combo) {
    this._current += combo.score
    this._color = combo.color
    if (this._current > localStorage.getItem('highScore') || 0) {
      localStorage.setItem('highScore', this._current)
      localStorage.setItem('highScoreColor', this._color)
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

class Display {
  constructor(scoring, coloring) {
    this.scoring = scoring
    this.coloring = coloring
  }

  updateScore() {
    this.scorePreview = null
    const e = document.getElementById('score')
    e.textContent = this.scoring.score
    this.coloring.setColor(e, this.scoring.color)
  }

  set scorePreview(combo) {
    document.getElementById('nextscore').textContent = combo?.score

    const preview = document.getElementById('scorepreview')
    this.coloring.setColor(preview, combo?.color)
    preview.style.display = combo ? 'inline' : 'none'
  }

  set highScore(value) {
    const [highScore, highScoreColor] = this.scoring.highScore
    const isHighest = (this.scoring.score >= Number(highScore))

    const oldHighest = document.getElementById('highest')
    oldHighest.style.display = value && !isHighest ? 'block' : 'none'
    this.coloring.setColor(oldHighest, highScoreColor)

    document.getElementById('newhighest')
      .style.display = value && isHighest ? 'inline' : 'none'

    document.getElementById('highscore').textContent = highScore
  }

  randomise() {
    const randomItems = Array.from(document.getElementsByClassName('random'))
    randomItems.forEach(e => this.coloring.setColor(e))

    document.getElementById('randomfavicon')
      .setAttribute('href', this.coloring.randomColor().concat('.png'))
  }

  debug(message) {
    const debugText = document.getElementById('debug')
    debugText.textContent = message
    debugText.style.display = message ? 'block' : 'inline'
  }

}

Circlething()
