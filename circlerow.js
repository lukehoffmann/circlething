var circlerow = function () {

    var columns = 5,
        rows = 5,
        pieceSize = 50, //px
        colors = ['red', 'orange', 'pink'],
        minimumMatch = 3;

    $('#gameboard').css('width', columns * pieceSize + 'px')
                   .css('height', rows * pieceSize + 'px');

    $(document).ready(function () {
        var c, r, column, piece;

        for (c = 1; c <= columns; c++) {
            column = newColumn(c);
            column.appendTo('#gameboard');
            for (r = 1; r <= rows; r++) {
                piece = newPiece(c, r);
                piece.hide().appendTo(column).fadeIn('slow');
            }
        }

        $('#gameboard').mouseleave(clearHighlight);
    });

    var newColumn = function (column) {
        return $('<div/>').addClass('column')
                          .attr('id', 'col' + column)
                          .css('width', pieceSize + 'px')
                          .css('height', rows * pieceSize + 'px');
    };

    var newPiece = function (column, row) {
        var color = randomColor();
        return $('<div/>').addClass('gamepiece')
                          .addClass(color)
                          .data('color', color)
                          .attr('id', pieceId(column, row))
                          .css('width', pieceSize + 'px')
                          .css('height', pieceSize + 'px')
                          .click(pieceClick)
                          .hover(pieceHover);
    };

    var pieceHover = function () {
        clearHighlight();
        if (markAdjacentPieces($(this), 'highlight') < minimumMatch) {
            clearHighlight();
        }
    };

    var pieceClick = function () {
        //clearHighlight();
        var toDelete = markAdjacentPieces($(this), 'delete'),
            removed = 0;
        if (toDelete < minimumMatch) {
            //clearHighlight();
        } else {
            $('.delete').attr('id', '')
                        .fadeOut('fast',
            function () {
                removed++;
                if (removed == toDelete) {
                    rebuildIds();
                }
            });
        }
    };

    var rebuildIds = function () {
        for (var column = 1; column <= columns; column++) {
            for (var row = rows; row >= 1; row--) {
                var above = row - 1;
                while (above > 0 && !pieceExists(column, row)) {
                    if (pieceExists(column, above)) {
                        getPiece(column, above).attr('id', pieceId(column, row));
                    }
                    above--;
                }
                if (!pieceExists(column, row)) {
                    newPiece(column, row).hide().prependTo($('#col' + column)).fadeIn('fast');
                }
            }
        }
    };

    var markAdjacentPieces = function (div, newClass) {
        var color = div.data('color'),
            column = + piecePos(div)['column'],
            row = + piecePos(div)['row'];

        var markPiece = function (column, row, color) {
            var count = 0;
            if (1 <= column && column <= columns && 1 <= row && row <= rows) {
                var div = getPiece(column, row);
                if (div && div.data('color') === color && !div.hasClass(newClass)) {
                    count = 1;
                    div.addClass(newClass);

                    count += markPiece(column, row - 1, color);
                    count += markPiece(column, row + 1, color);
                    count += markPiece(column - 1, row, color);
                    count += markPiece(column + 1, row, color);
                    console.log(count);
                }
            }
            return count;
        };

        return markPiece(column, row, color);
    };

    var clearHighlight = function () {
        $('.gamepiece').removeClass('highlight');
    };

    var getPiece = function (column, row) {
        return $("#" + pieceId(column, row));
    };

    var pieceExists = function (column, row) {
        return $("#" + pieceId(column, row)).length > 0;
    };

    var pieceId = function (column, row) {
        return column.toString() + '_' + row.toString();
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