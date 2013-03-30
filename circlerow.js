var circlerow = function () {

    var columns = 5,
        rows = 10,
        pieceSize = 50, //px
        colors = ['red', 'orange', 'pink'];

    $(document).ready(function () {

        $('#gameboard').css('width', columns * pieceSize + 'px')
                       .css('height', rows * pieceSize + 'px');

        for (var column = 1; column <= columns; column++) {
            addColumn(column);
            for (var row = 1; row <= rows; row++) {
                addPiece(column, row);
            }
        }
    });

    var addColumn = function(column) {
        $('<div/>').attr('class', 'column ')
                   .attr('id', 'col' + column)
                   .css('width', pieceSize + 'px')
                   .css('height', rows * pieceSize + 'px')
                   .appendTo('#gameboard');
    };

    var addPiece = function(column, row) {
        $('<div/>').attr('class', 'gamepiece ' + randomColor())
                   .attr('id', pieceId(column, row))
                   .attr('title', pieceId(column, row))
                   .css('width', pieceSize + 'px')
                   .css('height', pieceSize + 'px')
                   .click(pieceClick)
                   .hide()
                   .prependTo('#col' + column)
                   .fadeIn('slow');
    };

    var pieceClick = function() {
        var pos = piecePos($(this)),
            column = pos['column'],
            row;
        //clear piece and replace
        $(this).fadeOut('fast', function () {
            //re-number ids for pieces above
            row = + pos['row'];
            while (row <= rows) {
                $("#" + pieceId(column, row + 1)).attr('id', pieceId(column, row))
                                                 .attr('title', pieceId(column, row));
                row++;
            }

            addPiece(+ pos['column'], rows);
        });
    };

    var pieceId = function(column, row) {
        return column.toString() + '_' + row.toString();
    };

    var piecePos = function(div) {
        var id = div.attr('id'),
        pos = [];
        pos['column'] = + id.split('_')[0] || 0;
        pos['row'] = + id.split('_')[1] || 0;
        return pos;
    };

    var randomColor = function() {
        return colors[Math.floor(Math.random() * colors.length)];
    };

}();