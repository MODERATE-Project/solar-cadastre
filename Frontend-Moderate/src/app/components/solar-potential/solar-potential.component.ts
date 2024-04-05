import { Component } from '@angular/core';
import { CoordinatesService } from 'src/app/services/coordinates.service';

@Component({
  selector: 'app-solar-potential',
  templateUrl: './solar-potential.component.html',
  styleUrls: ['./solar-potential.component.scss']
})


export class SolarPotentialComponent {

  coordinates: {lat: number, lng: number};
  
  // Chart options
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  showGridLines: boolean = true;
  colorScheme = {
   domain: ['#0BD2F1', "#F17422", "#04724D"]
  } as any;
  gradient: boolean = true

  // Bar chart about potential
  xAxisPotential: string = "Month";
  yAxisPotential: string = "Energy [kWh]";
  chartDataPotential: any[];

  // url_server = "80.211.131.194";
  url_server = "localhost";

  visible: boolean = true;

  constructor (private coordinatesService: CoordinatesService) { }

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
    let form = document.querySelector("form") as HTMLFormElement;
    let resultsDiv = document.querySelector("div#results");

    const responseProfiles = await fetch(`http://${this.url_server}:8000/potential/v2/getProfiles`, { method: "GET" });
    const resultProfiles = await responseProfiles.json();
    const profiles = resultProfiles.profiles;

    const selectProfile = form.querySelector("select"); // Select element of form

    // Add profiles to dropdown (select element)
    for (let profile of profiles) {
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
      await fetch(`http://${this.url_server}:8000/potential/v2/getCookie`, { method: "GET", credentials: "include" }); // Get the CSRF cookie from backend
      this.visible = false;
      form.style.display = "none";  // Hide form
      const message = document.querySelector("#form h2");
      message.textContent = "Processing..."; // Change text to indicate that the processing of data is being made
      const headers = new Headers(); // Create an object to contain the headers of the request to server
      headers.append('X-CSRFToken', this.getCookie("csrftoken")) // Append the CSRF cookie to the headers object
      fetch(url, { method: "POST", headers: headers, body: formData, credentials: "include" }) // Obtain the KPIs from server with data inserted in the form
        .then(async(response) => {
          const data = await response.json();
          const analysis_result = data.results;
          const table = document.createElement("table");
          table.setAttribute("class", "table");

          // Create table with results
          for (const key in analysis_result) { 
            const tr = document.createElement("tr");
            const tdKey = document.createElement("td");
            const tdValue = document.createElement("td");
            tdKey.textContent = key;
            tdValue.textContent = analysis_result[key].toFixed(2);
            tdKey.setAttribute("style", "background-color: #0F4881; color: white");
            tdValue.setAttribute("style", "background-color: #08D2F1; color: white");
            tr.appendChild(tdKey);
            tr.appendChild(tdValue);
            table.appendChild(tr);
          }
          message.textContent = "Solar potential";
          resultsDiv.appendChild(table);
          this.chartDataPotential = data.month_data;
          document.getElementById("chart").style.display = "block";
        })
        .catch(() => {
          message.textContent = "Server error";
        })
        .finally(() => { // Always, on success and on error, add a button to return to form
          const button = document.createElement("button");
          button.textContent = "Back to form";
          button.setAttribute("class", "btn");
          button.setAttribute("style", "background-color: #052D65; color: white; margin-top: 20px");
          button.addEventListener("click", () => { // Button behavior
            document.getElementById("chart").style.display = "none";
            form.style.display = "block"; // Show form again
            this.visible = true;
            const tableDelete = document.querySelector("#results table");
            if (tableDelete) {
              resultsDiv.removeChild(tableDelete); // Delete results table if present
            }
            resultsDiv.parentNode.removeChild(button); // Remove button
            message.textContent = "Potential calculation";
          });
          resultsDiv.parentNode.appendChild(button);
        });
    });

  }

}
