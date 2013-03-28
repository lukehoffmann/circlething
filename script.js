var game = function () {

    var colors = ['red', 'orange', 'pink'];
    var columns = 3, rows = 7;

    $(document).ready(function () {
        //add pieces
        var column, row, color;
        for (column = 1; column <= columns; column++) {
            for (row = 1; row <= rows; row++) {
                addGamepiece(column, row);
            }
        }
    });

    var addGamepiece = function(column, row) {
        $('<div/>')
        .attr('class', "gamepiece " + randomColor())
        .data('column', column).data('row', row)
        .click(gamepieceClick)
        .hide()
        .prependTo('#col' + column)
        .fadeIn('slow');
    };

    var gamepieceClick = function() {
        //clear pieces and replace
        $(this).fadeOut('slow', function () {
            addGamepiece($(this).data('column'));
        });
    };

    var randomColor = function() {
        return colors[Math.floor(Math.random() * colors.length)];
    };

}();