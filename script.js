var game = function () {

    var colors = ['red', 'orange', 'pink'];
    var columns = 3, rows = 7;

    $(document).ready(function () {

        var addGamepiece = function addGamepiece(column) {
            color = Math.floor(Math.random() * colors.length);
            $('<div/>', {
                class: "gamepiece " + colors[color]
            }).data('column', column)
            .hide()
            .prependTo('#col' + column)
            .fadeIn('slow');
        };

        //add pieces
        var column, row, color;
        for (column = 1; column <= columns; column++) {
            for (row = 1; row <= rows; row++) {
                addGamepiece(column);
            }
        }

        //clear pieces on click
        $('.gamepiece').click(function () {
            $(this).fadeOut('slow', function () {
                addGamepiece($(this).data('column'));
            });
        });
    });
}();