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
        piece.hover(highlightPieces);
        return piece;
    };

    var pieceClick = function () {
        clearHighlight();

        //clear piece and replace
        $(this).fadeOut('fast', function () {
            var pos = piecePos($(this)),
                column = + pos['column'],
                row = + pos['row'];
            //re-number the pieces above
            while (row > 1) {
                getPiece(column, row - 1).attr('id', pieceId(column, row))
                                         .attr('title', pieceId(column, row));
                row--;
            }
            //add a piece at the top
            $('#col' + column).prepend(newPiece(+ column, 1));

        });
    };

    var highlightPieces = function () {
        var total = 0,
            color = $(this).data('color');

        var highlightAdjoining = function highlightAdjoining (div) {

            if (!div.hasClass('highlight') && div.data('color') === color) {

                var column = + piecePos(div)['column'],
                    row = + piecePos(div)['row'];

                total++;
                div.addClass('highlight');

                highlightAdjoining(getPiece(column, row - 1));
                highlightAdjoining(getPiece(column, row + 1));
                highlightAdjoining(getPiece(column - 1, row));
                highlightAdjoining(getPiece(column + 1, row));
            }
        };

        clearHighlight();
        highlightAdjoining($(this));
        if (total < minimumMatch) {
            clearHighlight();
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
        var id = div.attr('id'),
        pos = [];
        pos['column'] = + id.split('_')[0] || 0;
        pos['row'] = + id.split('_')[1] || 0;
        return pos;
    };

    var randomColor = function () {
        return colors[Math.floor(Math.random() * colors.length)];
    };

}();