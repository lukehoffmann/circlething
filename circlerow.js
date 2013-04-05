var circlerow = function () {

    var columns = 3,
        rows = 4,
        pieceSize = 70, //px
        colors = ['red', 'orange', 'pink'],
        minimumMatch = 3;

    $(document).ready(function () {
        $('#gameboard').css('width', columns * pieceSize + 'px')
                       .css('height', rows * pieceSize + 'px');

        startGame();

        $('#gameboard').mouseleave(function () {
                            clearClass('highlight');
                        });
    });

    var startGame = function () {
        $('.gamepiece').remove();
        $('.column').remove();

        var c, r, column, piece;
        for (c = 1; c <= columns; c++) {
            column = newColumn(c);
            column.appendTo('#gameboard');
            for (r = 1; r <= rows; r++) {
                piece = newPiece(c, r);
                piece.hide()
                     .appendTo(column)
                     .fadeIn('slow');
            }
        }
         while (detectEndgame()) {
                startGame();
        }
    };

    var newColumn = function (c) {
        return $('<div/>').addClass('column')
                          .attr('id', 'col' + c)
                          .css('width', pieceSize + 'px')
                          .css('height', rows * pieceSize + 'px');
    };

    var newPiece = function (c, r) {
        var color = randomColor();
        return $('<div/>').addClass('gamepiece')
                          .addClass(color)
                          .data('color', color)
                          .attr('id', pieceId(c, r))
                          .css('width', pieceSize + 'px')
                          .css('height', pieceSize + 'px')
                          .hover(pieceHover)
                          .click(pieceClick);
    };

    var pieceHover = function () {
        clearClass('highlight');
        if (addClassToAdjacentPieces($(this), 'highlight') < minimumMatch) {
            clearClass('highlight');
        }
    };

    var pieceClick = function () {
        if ($('body').hasClass('endgame')) {
            startGame();
            $('body').removeClass('endgame');
            $('#gameboard').removeClass('endgame');
        } else {
            clearClass('delete');
            var toDelete = addClassToAdjacentPieces($(this), 'delete'),
                removed = 0;

            if (toDelete >= minimumMatch) {
                $('.delete').attr('id', '')
                            .fadeOut('fast', function () {
                                removed++;
                                if (removed == toDelete) {
                                    rebuildIds();
                                    detectEndgame();
                                }
                            });
            }
        }
    };

    var rebuildIds = function () {
        for (var c = 1; c <= columns; c++) {
            for (var r = rows; r >= 1; r--) {
                var above = r - 1;
                while (above > 0 && !pieceExists(c, r)) {
                    if (pieceExists(c, above)) {
                        getPiece(c, above).attr('id', pieceId(c, r));
                    }
                    above--;
                }
                if (!pieceExists(c, r)) {
                    newPiece(c, r).hide()
                                  .prependTo($('#col' + c))
                                  .fadeIn('slow');
                }
            }
        }
    };

    var detectEndgame = function () {
        var c, r, count;
        for (c = 1; c <= columns; c++) {
            for (r = 1; r <= rows; r++) {
                count = addClassToAdjacentPieces(getPiece(c, r),  'temp');
                clearClass('temp');
                if (count >= minimumMatch) {
                    return false;
                }
            }
        }
        $('body').addClass('endgame');
        $('#gameboard').addClass('endgame');
        return true;
    };

    var addClassToAdjacentPieces = function (div, newClass, color) {
        color = color || div.data('color');
        
        if (div && div.data('color') === color && !div.hasClass(newClass)) {
            var c = + piecePos(div)['column'],
                r = + piecePos(div)['row'];
        
            div.addClass(newClass);
            return 1
            + addClassToAdjacentPieces(getPiece(c, r - 1), newClass, color)
            + addClassToAdjacentPieces(getPiece(c, r + 1), newClass, color)
            + addClassToAdjacentPieces(getPiece(c - 1, r), newClass, color)
            + addClassToAdjacentPieces(getPiece(c + 1, r), newClass, color);
        } else {
            return 0;
        }
    };

    var clearClass = function (className) {
        $('.gamepiece').removeClass(className);
    };

    var getPiece = function (c, r) {
        return $("#" + pieceId(c, r));
    };

    var pieceExists = function (c, r) {
        return $("#" + pieceId(c, r)).length > 0;
    };

    var pieceId = function (c, r) {
        return c.toString() + '_' + r.toString();
    };

    var piecePos = function (div) {
        var id = div.attr('id') || '',
        pos = [];
        pos['column'] = + id.split('_')[0] || 0;
        pos['row'] = + id.split('_')[1] || 0;
        return pos;
    };

    var randomColor = function () {
        return colors[Math.floor(Math.random() * colors.length)];
    };

}();
