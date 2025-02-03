import { Component, Renderer2 } from '@angular/core';
import { CoordinatesService } from 'src/app/services/coordinates.service';

@Component({
  selector: 'app-existing-system',
  templateUrl: './existing-system.component.html',
  styleUrls: ['./existing-system.component.scss']
})
export class ExistingSystemComponent {

  coordinates: {lat: number, lng: number};

  // Chart options for all charts
  view: [number, number] = [700, 300];
  legend: boolean = false;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  showGridLines: boolean = true;
  colorScheme = {
   domain: ['#0BD2F1']
  } as any;
  customColors = [
    {
      name: 'Actual',
      value: '#0F4881'
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

  // url_server = "80.211.131.194";
  url_server = "";

  visible: boolean = true;

  constructor (private coordinatesService: CoordinatesService, private renderer: Renderer2) { }

  async ngOnInit() {
    this.coordinates = this.coordinatesService.getCoordinates();
    await this.performCalculations();
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

    let form = document.querySelector("div#mainForm form") as HTMLFormElement;
    let resultsDiv = document.querySelector("div#results");

    // By default, current month is selected
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
      this.visible = false;
      const url = form.action; // Save in url variable the value of action attribute of the form
      const formData = new FormData(form); // Create an object containing the data inserted in the form
      formData.append("lat", this.coordinates.lat.toString()); // Append to the formData object the latitude of the click
      formData.append("lon", this.coordinates.lng.toString()); // Append to the formData object the longitude of the click
      await fetch(`${this.url_server}/existing/v1/getCookie`, { method: "GET", credentials: "include" }); // Get the CSRF cookie from backend
      form.style.display = "none";  // Hide form
      const message = document.querySelector("#mainForm h2");
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
          resultsDiv.appendChild(expectedP);
          const suggestionP = document.createElement("p");
          suggestionP.textContent = result.suggestion;
          suggestionP.setAttribute("style", "text-align: justify; text-justify: inter-word");
          resultsDiv.appendChild(suggestionP);
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
            const pChartDate = document.querySelector("div#charts p#chart_date");
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
                  <div class="form-check">
                  <input class="form-check-input" type="radio" id="yes" name="compare" value="Yes">
                  <label class="form-check-label" for="yes">Yes</label>
                  </div>

                  <div class="form-check">
                  <input class="form-check-input" type="radio" id="no" name="compare" value="No">
                  <label class="form-check-label" for="no">No</label>
                  </div>
                  <button class="btn" style="background-color: #052D65; color: white; margin-top: 10px" type="submit">Submit</button>
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

                      <div class="form-check">
                        <input class="form-check-input" type="radio" id="1" name="problem" value="1">
                        <label class="form-check-label" for="1">Close shading</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/>
                      </div>

                      <div class="form-check">
                        <input class="form-check-input" type="radio" id="2" name="problem" value="2">
                        <label class="form-check-label" for="2">Far shading (e. g. mountains)</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/>
                      </div>

                      <div class="form-check">
                        <input class="form-check-input" type="radio" id="3" name="problem" value="3">
                        <label class="form-check-label" for="3">Soiling</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/>
                      </div>

                      <div class="form-check">
                        <input class="form-check-input" type="radio" id="4" name="problem" value="4">
                        <label class="form-check-label" for="4">Modules broken/disconnected</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/>
                      </div>

                      <div class="form-check">
                        <input class="form-check-input" type="radio" id="5" name="problem" value="5">
                        <label class="form-check-label" for="5">Overheating</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/>
                      </div>

                      <div class="form-check">
                        <input class="form-check-input" type="radio" id="6" name="problem" value="6">
                        <label class="form-check-label" for="6">Snow</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/>
                      </div>

                      <div class="form-check">
                        <input class="form-check-input" type="radio" id="7" name="problem" value="7">
                        <label class="form-check-label" for="7">Inverter failure</label><br/>
                        <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/>
                      </div>

                      <button class="btn" style="background-color: #052D65; color: white; margin-top: 10px" type="submit">Submit</button>

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
          document.getElementById("charts").style.display = "block";
          // document.getElementById("chart").style.justifyContent = "space-evenly";
          this.chartDataBarYear = [...result.yearly_generation, {"name" : "Actual", "value" : formData.get("real_last_year")}]; // Add actual generation data
          // console.log(result.yearly_generation);
          this.chartDataBarMonth = result.monthly_generation;
        })
        .catch((error) => {
          console.log(error);
          message.textContent = "Error";
        })
        .finally(() => { // Show a button to return to form on success and on error
          const button = document.createElement("button");
          button.textContent = "Back to form";
          button.setAttribute("class", "btn");
          button.setAttribute("style", "background-color: #052D65; color: white; margin-top: 20px");
          button.addEventListener("click", () => { // Button behavior
            form.style.display = "block"; // Show form again
            this.visible = true;
            document.getElementById("charts").style.display = "none";
            document.querySelector("div#backButton").removeChild(button); // Remove button

            // Remove all messages displayed. These are the suggestion and the expected generations
            const pDelete = resultsDiv.getElementsByTagName("p"); 
            for (let i = pDelete.length - 1; i >= 0; i--) {
              const pNode = pDelete[i];
              resultsDiv.removeChild(pNode);
            }
            message.textContent = "SolarCheckup Navigator";
          });
          document.querySelector("div#backButton").appendChild(button);
        })
    });

  }

}
