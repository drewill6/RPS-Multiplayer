$(document).ready(function() {
    // populate the train schedule
    //AddTrain ('TrentonExpress', 'Trenton', 360, 30);
    //AddTrain ('Oregon Trail', 'Salem Oregon', 360, 30);
    //AddTrain ('Midnight Carriage', 'Philadelphia', 360, 30);
    //AddTrain ('Sing Sing Caravan', 'Atlanta', 360, 30);
    //AddTrain ('Boston Bus', 'Boston', 360, 30);
    //AddTrain ('California Caravan', 'San Francisco', 360, 30);
    //AddTrain ('Analbens Train', 'Florida', 360, 30);

    RefreshTrainSchedule();

    // bind to the add train button
    $("#add-train-btn").on('click', function() {

        // pull values from input fields
        var trainName = $("#add_trainName").val();
        var dest = $("#add_destination").val();
        var start = ConvertMilitaryTimeToMinutes($("#add_firstTrainTime").val());
        var freq = parseInt($("#add_frequency").val());

        // for debugging purposes
        console.log(trainName);
        console.log(dest);
        console.log(start);
        console.log(freq);

        // add train to database
        AddTrain(trainName, dest, start, freq);

        // refresh the train schedule
        RefreshTrainSchedule();
    });
});

// FUNCTION REQUIRED!!!::: put a function here for adding the train
function AddTrain(trainName, destination, firstTrain, frequency) {

    // add into firebase
    firebase.database().ref('TrainSchedule/' + trainName).set({
        destination: destination,
        firstTrain: firstTrain,
        frequency: frequency
    });
}

function RefreshTrainSchedule() {
    // clear the HTML table
    $("#rows").html(""); 

    // read train schedule from the database
    // iterate over each schedule item in the firebase database
    firebase.database().ref("TrainSchedule").once("value").then(function(snap) {
        var html = "";
        console.log(snap);
        console.log(snap.val());

        // looping over each property of the Train Scheduel. The property name is the train name.
        var TrainSchedule = snap.val();
        for(var prop in TrainSchedule)  // prop is the name of the train
        {
            console.log(prop);
            var data = TrainSchedule[prop];     // we access the rest of the data using the name of the train
            var now = Now();                    // get the now for current time in minutes since the day started

            // calculate new arrivals and minutes until
            var nextArrival = CalculateNextArrival(now, data.firstTrain, data.frequency);
            var minutesUntil = CalculateMinuteUntil(now, nextArrival);

            console.log(now);
            console.log(nextArrival);
            console.log(minutesUntil);

            // add each item to the HTML table
            html += "<tr>";
            
            // add the <td> for each column onto the html
            html += "<td class='trainName'>" + prop + "</td>";
            html += "<td>" + data.destination + "</td>";
            html += "<td>" + data.frequency + "</td>";
            html += "<td>" + ConvertMinutesToTimeString(nextArrival) + "</td>";
            html += "<td>" + minutesUntil + "</td>";
            html += "<td><button class='delete'>delete</button></td>";

            // close the row 
            html += "</tr>";
        }

        // add the html into the body
        $("#rows").append(html);

        // bind to delete button
        $("#rows").find(".delete").on('click', function() {
            var trainName = $(this).closest('tr').find('.trainName').text();
            console.log(trainName);
            firebase.database().ref('TrainSchedule').child(trainName).remove();
            RefreshTrainSchedule();
        });
    });  
}

function CalculateNextArrival(currentTime, startTime, frequency) {
    var nextArrival;
    for (nextArrival = startTime; nextArrival < currentTime; nextArrival += frequency);

    // if the next arrival went past the number of minutes in a day
    if(nextArrival >= 1440)
    {
        nextArrival = startTime;
    }

    return (nextArrival);
}

function CalculateMinuteUntil (now, nextArrival) {
   var minuteUntil = nextArrival - now;
   if(nextArrival < now)
   {
       minuteUntil = (1440 - now) + nextArrival;
   }
   return (minuteUntil);
}

function ConvertMinutesToTimeString(minutes)
{
    var newMinutes = minutes % 60;
    var hours = (minutes - newMinutes) / 60;
    
    var timeThing = "AM";
    if(hours >= 12)
    {
        timeThing = "PM";
        hours -= 12;
    }
    var timeStr = hours.toString() + ":" + Pad(newMinutes, 2) + " " + timeThing;
    return timeStr;
}

function ConvertMilitaryTimeToMinutes(time)
{
    var parts = time.split(':');
    var hours = parseInt(parts[0]);
    var minutes = parseInt(parts[1]);
    var totalMin = (hours * 60) + minutes;
    return totalMin;
}

function Now()
{
    var d = new Date();
    var n = d.getMinutes() + (d.getHours() * 60);
    return n;
}

function Pad(num, size)
{
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}