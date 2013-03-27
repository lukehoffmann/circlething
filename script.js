var game = function () {

    var colors = ['red', 'orange', 'pink'];
    var columns = 3, rows = 7;

    $(document).ready(function () {

        //add pieces
        var i, j, color;
        for (i = 1; i <= columns; i++) {
            for (j = 1; j <= rows; j++) {
                color = Math.floor(Math.random() * colors.length);
                $('#col' + i).prepend('<div class="gamepiece ' + colors[color] + '"></div>');
            }
        }

        //clear pieces on click
        $('.gamepiece').click(function () {
            $(this).fadeOut('fast');
        });
    });
}();