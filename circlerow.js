var circlerow = function () {

    var columns = 5,
        rows = 10,
        pieceSize = 50, //px
        colors = ['red', 'orange', 'pink'],
        minimumMatch = 3;

    $(document).ready(function () {

        $('#gameboard').css('width', columns * pieceSize + 'px')
                       .css('height', rows * pieceSize + 'px')
                       .mouseleave(clearHighlight);

        for (var column = 1; column <= columns; column++) {
            newColumn(column).appendTo('#gameboard');
            for (var row = 1; row <= rows; row++) {
                newPiece(column, row).hide().appendTo('#col' + column).fadeIn('slow');
            }
        }
    });

    var newColumn = function (column) {
        return $('<div/>').addClass('column')
                          .attr('id', 'col' + column)
                          .css('width', pieceSize + 'px')
                          .css('height', rows * pieceSize + 'px');
    };

    var newPiece = function (column, row) {
        var color = randomColor(),
            piece = $('<div/>').addClass('gamepiece')
                               .addClass(color)
                               .data('color', color)
                               .attr('id', pieceId(column, row))
                               .attr('title', pieceId(column, row))
                               .css('width', pieceSize + 'px')
                               .css('height', pieceSize + 'px');
        piece.click(pieceClick);
        piece.hover(pieceHover);
        return piece;
    };

    var pieceHover = function () {
        clearHighlight();
        if (highlightPieces($(this)) < minimumMatch) {
            clearHighlight();
        }
    };

    var pieceClick = function () {
        var highlighted,
            removed = 0;
        clearHighlight();
        highlighted = highlightPieces($(this));
        if (highlighted < minimumMatch) {
            clearHighlight();
        } else {
            $('.highlight').attr('id', '')
                           .fadeOut('slow',
            function () {
                removed++;
                if (removed == highlighted) {
                    rebuildIds();
                }
            });
        }
    };

    var rebuildIds = function () {
        var above;
        for (var column = 1; column <= columns; column++) {
            for (var row = rows; row >= 1; row--) { // start at the bottom

                above = row + 1;
                while (above <= rows && !getPiece(column, row).length) {
                    console.log(column + ', ' + row, ', ' + above + ', ' + getPiece(column, row).length);
                    if (getPiece(column, above).length) {
                        getPiece(column, above).attr('id', pieceId(column, row))
                                               .attr('title', pieceId(column, row));
                    }
                    above--;
                }
                //add a piece at the top
                if (!getPiece(column, row).length) {
                    $('#col' + column).prepend(newPiece(column, 1));
                }
            }
        }
    };

    var highlightPieces = function (div) {
        var total = 0,
            color = div.data('color'),
            column = + piecePos(div)['column'],
            row = + piecePos(div)['row'];

        var highlightPiece = function (div1) {
            if (div1 && !div1.hasClass('highlight')) {
                total++;
                div1.addClass('highlight');
                return true;
            }
            return false;
        };

        onAdjoining(column, row, color, highlightPiece);

        return total;
    };

    var onAdjoining = function onAdjoining (column, row, color, fn) {
        if (1 <= column && column <= columns && 1 <= row && row <= rows) {
            var div = getPiece(column, row);
            if (div.data('color') === color && fn(div)) {
                onAdjoining(column, row - 1, color, fn);
                onAdjoining(column, row + 1, color, fn);
                onAdjoining(column - 1, row, color, fn);
                onAdjoining(column + 1, row, color, fn);
            }
        }
    };

    var clearHighlight = function () {
        $('.gamepiece').removeClass('highlight');
    };

    var getPiece = function (column, row) {
        return $("#" + pieceId(column, row));
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