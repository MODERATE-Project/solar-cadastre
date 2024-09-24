/*
    JavaScript script
    An Ajax request is sent to get KPIs about photovoltaic potential.
    This version works with the form in which the user inserts the data.
    A message is shown indicating that processing is being made.
    An error message is shown if an error occurs.
*/

$(document).ready(function () {

    $("form").submit(function(event) {
        $("#message").show();
        var points = 0;
        setInterval(() => {
            points = (points + 1) % 4;
            $("#message").text("Processing, please wait" + ".".repeat(points));
        }, 300);
    });

});

// $("form").submit(function(event) {
//     event.preventDefault();
//     $("#message").show();
//     $("form").hide();
//     var points = 0;
//     var showPoints = setInterval(() => {
//         points = (points + 1) % 4;
//         $("#message").text("Processing, please wait" + ".".repeat(points));
//     }, 300);  //Displays an animation to confirm the user that the processing is taking place

//     $.ajax({
//         url: "http://localhost:8000/v2/potential/calc", //URL for calc() function in views.py
//         type: "POST",
//         dataType: "json",
//         success: function(data) {
//             console.log(data);
//         },
//         error: function(error) {
//             console.log(error);
//         },
//         complete: function() {
//             clearInterval(showPoints);
//         }
//     });
// });
