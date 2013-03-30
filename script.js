var game = function () {

    var colors = ['red', 'orange', 'pink'];
    var columns = 3, rows = 7;

    //add pieces
    $(document).ready(function () {
        var column, row, color;
        for (column = 1; column <= columns; column++) {
            for (row = 1; row <= rows; row++) {
                addPiece(column, row);
            }
        }
    });

    var addPiece = function(column, row) {
        $('<div/>')
        .attr('class', 'gamepiece ' + randomColor())
        .attr('id', pieceId(column, row))
        .data('column', column).data('row', row)
        .click(pieceClick)
        .hide()
        .prependTo('#col' + column)
        .fadeIn('slow');
    };

    var pieceId = function(column, row) {
        return column + ',' + row;
    };

    var piecePos = function(div) {
        var pos = [], id = div.attr('id').split(',');
        pos['column'] = id[0] || 0;
        pos['row'] = id[1] || 0;
        return pos;
    };

    var pieceClick = function() {
        //clear pieces and replace
        console.log(piecePos($(this)));
        $(this).fadeOut('fast', function () {
            addPiece(piecePos($(this))['column'], rows);
        });
    };

    var randomColor = function() {
        return colors[Math.floor(Math.random() * colors.length)];
    };

}();