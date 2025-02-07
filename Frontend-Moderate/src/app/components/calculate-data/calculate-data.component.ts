import { Component, Renderer2 } from '@angular/core';
import { CoordinatesService } from 'src/app/services/coordinates.service';
import { NgSelectModule, NgOption } from '@ng-select/ng-select';
import { FormControl } from '@angular/forms';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-calculate-data',
  templateUrl: './calculate-data.component.html',
  styleUrls: ['./calculate-data.component.scss']
})

export class CalculateDataComponent {

  coordinates: {lat: number, lng: number};

  // Chart options for all charts
  view: [number, number] = [350, 300];
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  showGridLines: boolean = true;
  // colorScheme = {
  //   domain: [...schemeCategory10, '#FFA07A', '#6A5ACD']
  // } as any;
  colorScheme = {
   domain: ['#6A5ACD']
  } as any;
  customColors = [
    {
      name: 'Actual',
      value: '#ff8000'
    }
  ];
  gradient: boolean = true
 
  // Line chart axes and data
  xAxisLabelLine: string = 'Hour of Day';
  yAxisLabelLine: string = 'Energy Production [kWh]';
  chartDataLine: any[];
 
  // Bar chart about yearly generation axes and data
  xAxisLabelBarYear: string = 'Year';
  yAxisLabelBarYear: string = 'Energy Production [kWh]';
  chartDataBarYear: any[];
 
  // Bar chart about monthly generation axes and data
  xAxisLabelBarMonth: string = 'Month';
  yAxisLabelBarMonth: string = 'Energy Production [kWh]';
  chartDataBarMonth: any[];

  // Bar chart about potential
  xAxisPotential: string = "Month";
  yAxisPotential: string = "Energy [kWh]";
  chartDataPotential: any[];


  // url_server = "80.211.131.194";
  url_server = environment.apiUrl;

  constructor (private coordinatesService: CoordinatesService, private renderer: Renderer2) {
    
  }

  async ngOnInit() {
    this.coordinates = this.coordinatesService.getCoordinates();
    await this.performCalculations();
    console.log(this.coordinates);
  }

  getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
  }


  async performCalculations() {
    // Delete previous forms, results and charts
    const calculation_div = document.querySelector("div#calculation");
    this.renderer.setProperty(calculation_div, 'innerHTML', '');
    document.getElementById("chart").style.display = "none";

    document.getElementById("buttons").style.display = "block";
    let btnPotential = document.querySelector("button#showPotential"); // Button to show potential form
    let btnEvaluation = document.querySelector("button#showEvaluation"); // Button to show evaluation form
    let calcDiv = document.querySelector("div#calculation"); // Container where forms and results are shown
    
    // Solar potential
    btnPotential.addEventListener("click", async() => {
      document.getElementById("potential_chart").style.display = "none";
      document.getElementById("chart").style.display = "none";
      // Show potential form
      calcDiv.innerHTML = `

        <h3>Potential calculation</h3>
        
        <form method="POST" action='${this.url_server}/potential/v2/result' id="potentialMainForm">

          <label for="roof_tilt">Roof tilt: </label>
          <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0"  max="90" name="roof_tilt" value="30" required><br/>

          <label for="roof_orientation">Roof orientation: </label>
          <input style="margin: 5px 0; width: 120px" type="number" step="any" min="-180" max="180" name="roof_orientation" value="0" required><br/>
          <p style="margin: 0 10px 0 0; color: gray">(South=0, East=-90, North=180, West=90)</p><br/>


          <label for="nom_power">Nominal power [kWp]: </label>
          <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="nom_power" value="1" required><br/>
          
          <label for="yearly_consumption">Yearly consumption [kWh]: </label>
          <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="yearly_consumption" value="2700" required><br/>

          <label for="electricity_cost">Electricity cost [€/kWh]: </label>
          <input style="margin: 5px 0; width: 120px" type="number" step="0.01" min="0" name="electricity_cost" value="0.3" required><br/>

          <label for="value_sold_electricity">Value of sold electricity [€/kWh]: </label>
          <input style="margin: 5px 0; width: 120px" type="number" step="0.01" min="0" name="value_sold_electricity" value="0.1" required><br/>

          <label for="pv_cost">PV cost [€/kWp]: </label>
          <input style="margin: 5px 0; width: 120px" type="number" step="0.01" min="0" name="pv_cost" value="2000" required><br/>

          <label for="profile">Profile: </label>
          <select name="profile" style="margin: 5px 0; width: 120px">
          <select><br/>

          <input style="margin: 5px 0" type="submit" value="Calculate">
          <input style="margin: 5px 0" type="reset" value="Reset">

        </form>
      `;
      let form = document.querySelector("form#potentialMainForm") as HTMLFormElement;

        // Get profile names from database
      const responseProfiles = await fetch(`${this.url_server}/potential/v2/getProfiles`, { method: "GET" });
      const resultProfiles = await responseProfiles.json();
      const profiles = resultProfiles.profiles;

      const selectProfile = form.querySelector("select"); // Select element of form

      // Add profiles to dropdown (select element)
      for (let profile of profiles) {
        // this.profiles.push({"id" : profile, "name" : profile});
        let optionNode = document.createElement("option");
        optionNode.setAttribute("value", profile);
        optionNode.textContent = profile;
        selectProfile.appendChild(optionNode);
      }

      form.addEventListener("submit", async(event) => { // Actions to perform when submitting the form
        event.preventDefault(); // Prevent the form redirecting to another page
        const url = form.action; // Save in url variable the value of action attribute of the form
        const formData = new FormData(form); // Create an object containing the data inserted in the form
        formData.append("lat", this.coordinates.lat.toString()); // Append to the formData object the latitude of the click
        formData.append("lon", this.coordinates.lng.toString()); // Append to the formData object the longitude of the click
        await fetch(`${this.url_server}/potential/v2/getCookie`, { method: "GET", credentials: "include" }); // Get the CSRF cookie from backend
        form.style.display = "none";  // Hide form
        const message = document.querySelector("#calculation h3");
        message.textContent = "Processing..."; // Change text to indicate that the processing of data is being made
        const headers = new Headers(); // Create an object to contain the headers of the request to server
        headers.append('X-CSRFToken', this.getCookie("csrftoken")) // Append the CSRF cookie to the headers object
        fetch(url, { method: "POST", headers: headers, body: formData, credentials: "include" }) // Obtain the KPIs from server with data inserted in the form
          .then(async(response) => {
            const data = await response.json();
            const analysis_result = data.results;
            const table = document.createElement("table");
            table.setAttribute("style", "border: 1px solid; width: 100%");
            console.log(data.month_data);

            // Create table with results
            for (const key in analysis_result) { 
              const tr = document.createElement("tr");
              const tdKey = document.createElement("td");
              const tdValue = document.createElement("td");
              tdKey.textContent = key;
              tdValue.textContent = analysis_result[key].toFixed(2);
              tdKey.setAttribute("style", "background-color: #8B0000; color: white");
              tdValue.setAttribute("style", "background-color: #DC143C; color: white");
              tr.appendChild(tdKey);
              tr.appendChild(tdValue);
              table.appendChild(tr);
            }
            message.textContent = "Solar potential";
            calcDiv.appendChild(table);
            this.chartDataPotential = data.month_data;
            document.getElementById("potential_chart").style.display = "block";
          })
          .catch(() => {
            message.textContent = "Server error";
          })
          .finally(() => { // Always, on success and on error, add a button to return to form
            const button = document.createElement("button");
            button.addEventListener("click", () => { // Button behavior
              document.getElementById("potential_chart").style.display = "none";
              form.style.display = "block"; // Show form again
              const tableDelete = document.querySelector("#calculation table");
              if (tableDelete) {
                calcDiv.removeChild(tableDelete); // Delete results table if present
              }
              calcDiv.removeChild(button); // Remove button
              message.textContent = "Potential calculation";
            });
            button.textContent = "Back to form";
            button.setAttribute("style", "margin-top: 20px");
            calcDiv.appendChild(button);
          });
      });
    });

    // Existing system evaluation
    btnEvaluation.addEventListener("click", () => {
      document.getElementById("potential_chart").style.display = "none";
      document.getElementById("chart").style.display = "none"; // Hide charts
      // Show evaluation form
      calcDiv.innerHTML = `

      <h3>SolarCheckup Navigator</h3>
        
      <form method="POST" action='${this.url_server}/existing/v1/result' id="existingMainForm">
        
        <label for="roof_tilt">Roof tilt: </label>
        <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" max="90" name="roof_tilt" value="20" required><br/>

        <label for="roof_orientation">Roof orientation: </label>
        <input style="margin: 0px 0; width: 120px" type="number" step="any" min="-180" max="180" name="roof_orientation"  value="0" required><br/>
        <p style="margin: 0 10px 0 0; color: gray">(South=0, East=-90, North=180, West=90)</p><br/>

        <label for="nom_power">Nominal power: </label>
        <input style="margin: 0px 0; width: 120px" type="number" step="any" min="0" name="nom_power"  value="1" required><br/>

        <label for="real_last_year">Energy generated last year [kWh]: </label>
        <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="real_last_year" required><br/>

        <input style="margin: 5px 0" type="submit" value="Evaluate">
        <input style="margin: 5px 0" type="reset" value="Reset">

      </form>
      `
      let form = document.querySelector("form#existingMainForm") as HTMLFormElement;

      // By default, the current month is selected
      const currentMonth = (new Date()).getMonth() + 1;
      const options = document.getElementsByTagName("option");
      for (let option of options) {
        if (parseInt(option.value) == currentMonth) {
          option.setAttribute("selected", "true");
          break;
        }
      }
      
      form.addEventListener("submit", async(event) => {
        event.preventDefault(); // Prevent the form redirecting to another page
        const url = form.action; // Save in url variable the value of action attribute of the form
        const formData = new FormData(form); // Create an object containing the data inserted in the form
        formData.append("lat", this.coordinates.lat.toString()); // Append to the formData object the latitude of the click
        formData.append("lon", this.coordinates.lng.toString()); // Append to the formData object the longitude of the click
        await fetch(`${this.url_server}/existing/v1/getCookie`, { method: "GET", credentials: "include" }); // Get the CSRF cookie from backend
        form.style.display = "none";  // Hide form
        const message = document.querySelector("#calculation h3");
        message.textContent = "Processing..."; // Change text to indicate that the processing of data is being made
        const headers = new Headers(); // Create an object to contain the headers of the request to server
        headers.append('X-CSRFToken', this.getCookie("csrftoken")) // Append the CSRF cookie to the headers object
        fetch(url, { method: "POST", headers: headers, body: formData, credentials: "include" }) // Obtain the KPIs from server with data inserted in the form
          .then(async(response) => {
            // const result = await response.text();
            // message.textContent = result;
            const result = await response.json(); // Get JSON with response data
            // console.log(result.generation_data);
            
            // Show messages
            message.textContent = "SolarCheckup Navigator";
            const expectedP = document.createElement("p");
            expectedP.textContent = "Estimated yearly generation: " + result.estimated_generation + " kWh";
            calcDiv.appendChild(expectedP);
            const suggestionP = document.createElement("p");
            suggestionP.textContent = result.suggestion;
            suggestionP.setAttribute("style", "text-align: justify; text-justify: inter-word");
            calcDiv.appendChild(suggestionP);
            document.getElementById("month_selector").style.display = "block"; // Show month selector
            
            const comparationDiv = document.getElementById("comparation"); // Div where instructions are shown to evaluate the system
            let max_month_generation;
            document.getElementById("line_chart").style.display = "none"; // Hide line chart
            let monthForm = document.querySelector("#month_selector form") as HTMLFormElement;
            monthForm.addEventListener("submit", (event) => {
              event.preventDefault();
              const monthFormData = new FormData(monthForm); // Get selected month
              const month = parseInt(monthFormData.get("month").toString()); // Parse month to int
              max_month_generation = result.max_month_generation[month - 1]; // Get month data
              this.chartDataLine = [result.generation_data[month - 1]]; // Set chart data with month data
              const pChartDate = document.querySelector("div#chart p#chart_date");
              pChartDate.innerHTML = result.generation_data[month - 1].name; // Subtitle of the chart, containing year, day and month shown
              document.getElementById("line_chart").style.display = "block"; // Show line chart
              document.getElementById("month_selector").style.display = "none"; // Hide month selection
              // Show daily generation and instructions to compare
              comparationDiv.innerHTML = `
                <div style="margin-left: 20px">
                  <p>For the selected month, highest energy generation is: ${max_month_generation} kWh</p>
                  <p style="text-align: justify; text-justify: inter-word">
                    Open your photovoltaic system monitoring app. Compare the data shown in SolarCheckup
                    Navigator with the shape of the hourly generation profile in your app. Please choose a clear sky
                    day.
                  </p>
                  <p>Are them similar?</p>
                  <form id='radioForm'>
                    <input type="radio" id="yes" name="compare" value="Yes">
                    <label for="yes">Yes</label>
                    <input type="radio" id="no" name="compare" value="No">
                    <label for="no">No</label>
                    <input style="margin-left: 10px" type="submit" value="Submit">
                  </form>
                </div>
              `;

              let radioForm = document.querySelector("form#radioForm") as HTMLFormElement;
              radioForm.addEventListener("submit", (event) => {
                event.preventDefault();
                const radioFormData = new FormData(radioForm); // Get selection from yes/no
                if (radioFormData.get("compare") == "Yes") {
                  // Show message of good performance
                  comparationDiv.innerHTML = `
                    <p style="text-align: justify; text-justify: inter-word">
                      Looks like your system is performing well. Try to repeat this
                      check monthly. If the monthly generation is very different with respect to the one expected, it
                      can be that your system is underperforming. Repeat this test and consider contacting a solar
                      expert for a field inspection.
                    </p>
                  `
                } else {
                  // Show problem selection with images
                  comparationDiv.innerHTML = `
                    <div style="margin-left: 20px">
                      <p>If the curves are different you may have one of the following issues.</p>
                      <p>Select one for obtaining a suggestion:</p>
                      <form id="problemForm">

                        <input type="radio" id="1" name="problem" value="1">
                        <label for="1">Close shading</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                        <input type="radio" id="2" name="problem" value="2">
                        <label for="2">Far shading (e. g. mountains)</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                        <input type="radio" id="3" name="problem" value="3">
                        <label for="3">Soiling</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                        <input type="radio" id="4" name="problem" value="4">
                        <label for="4">Modules broken/disconnected</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                        <input type="radio" id="5" name="problem" value="5">
                        <label for="5">Overheating</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                        <input type="radio" id="6" name="problem" value="6">
                        <label for="6">Snow</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                        <input type="radio" id="7" name="problem" value="7">
                        <label for="7">Inverter failure</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                        <input type="submit" value="Submit">

                      </form>
                    </div>
                  `

                  const problemForm = document.querySelector("form#problemForm") as HTMLFormElement;
                  problemForm.addEventListener("submit", (event) => {
                      event.preventDefault();
                      const problemFormData = new FormData(problemForm);
                      const selectedProblem = problemFormData.get("problem"); // Get problem selection
                      // Show problem selection and suggestion for it
                      comparationDiv.innerHTML = `
                        <div style="margin-left: 20px">
                          <p>Choice ${selectedProblem}, Suggestion ${selectedProblem}</p>
                        </div>
                      `
                  });
                }
              });
            });

            // Set chart data
            document.getElementById("chart").style.display = "block";
            // document.getElementById("chart").style.justifyContent = "space-evenly";
            this.chartDataBarYear = [...result.yearly_generation, {"name" : "Actual", "value" : formData.get("real_last_year")}]; // Add actual generation data
            console.log(result.yearly_generation);
            this.chartDataBarMonth = result.monthly_generation;
          })
          .catch((error) => {
            console.log(error);
            message.textContent = "Error";
          })
          .finally(() => { // Show a button to return to form on success and on error
            const button = document.createElement("button");
            button.addEventListener("click", () => { // Button behavior
              form.style.display = "block"; // Show form again
              document.getElementById("chart").style.display = "none";
              document.querySelector("div#backButton").removeChild(button); // Remove button

              // Remove all messages displayed. These are the suggestion and the expected generations
              const pDelete = calcDiv.getElementsByTagName("p"); 
              for (let i = pDelete.length - 1; i >= 0; i--) {
                const pNode = pDelete[i];
                calcDiv.removeChild(pNode);
              }
              message.textContent = "SolarCheckup Navigator";
            });
            button.textContent = "Back to form";
            button.setAttribute("style", "margin-top: 20px");
            document.querySelector("div#backButton").appendChild(button);
          })
      });
    })
  }

}