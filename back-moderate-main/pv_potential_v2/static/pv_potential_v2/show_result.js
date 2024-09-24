/*
    JavaScript script
    An Ajax request is sent to get KPIs about photovoltaic potential.
    A message is shown indicating that processing is being made.
    An error message is shown if an error occurs.
    THIS VERSION ONLY WORKS WHEN USING PREDEFINED VARIABLES, NOT WITH USER INPUTS
*/

var message = document.getElementById("message");
var points = 0;

var showPoints = setInterval(() => {
                                        points = (points + 1) % 4;
                                        message.innerText = "Processing, please wait" + ".".repeat(points);
                                    }, 300);  //Displays an animation to confirm the user that the processing is taking place

$.ajax({
    url: "http://localhost:8000/v2/potential/calc", //URL for calc() function in views.py
    type: "GET",
    dataType: "json",
    success: function(data) {
        var table = document.querySelector("table");    //Add rows with KPIs to the table
        for (var key in data) {
            var row = table.insertRow();
            var cell1 = row.insertCell();
            cell1.innerText = key;
            var cell2 = row.insertCell();
            cell2.innerText = data[key].toFixed(2);
        }
        table.style.display = "block"   //Makes the table visible
        clearInterval(showPoints);  //Stops the points animation
        message.style.display = "none";  //Hides the loading message
    },
    error: function(error) {
        message.innerText = error;   //Substitutes the loading message with the error code
    }
});
