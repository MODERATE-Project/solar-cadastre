import { Component, EventEmitter, Input, Output, Renderer2 } from '@angular/core';
import { CityService } from 'src/app/services/city.service';
import { CoordinatesService } from 'src/app/services/coordinates.service';
import { environment } from 'src/environments/environment';
import { WindowService } from 'src/app/services/window.service';

@Component({
  selector: 'app-existing-system',
  templateUrl: './existing-system.component.html',
  styleUrls: ['./existing-system.component.scss']
})
export class ExistingSystemComponent {
  @Output() backToMap: EventEmitter<void> = new EventEmitter<void>();
  //coordinates: {lat: number, lng: number};

  @Input() coordinates: any = {
    lat: null,
    lng: null
  };

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

  //url_server = "https://desarrollo.ubikgs.com";
  url_server = environment.apiUrl;
  //url_server = "https://re-modulees.five.es/backend";

  visible: boolean = true;

  processing: boolean = false;

  currentStep: 'form' | 'results' = 'form';

  city: string = "";
  address: string = "";

  activeTab: 'yearly' | 'monthly' | 'test' = 'yearly';
  lastResult: any = null;

  months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
    { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
    { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ];

  comparisonStep: 'initial' | 'ask_similarity' | 'show_problems' | 'final_suggestion' = 'initial';
  isSimilar: string = '';
  selectedProblem: string = '';
  maxMonthGenValue: number = 0; // Para guardar el valor dinámico

  problems = [
    { id: '1', name: 'Close shading', img: '../assets/img/problem_1.png' },
    { id: '2', name: 'Far shading', img: '../assets/img/problem_1.png' },
    { id: '3', name: 'Soiling', img: '../assets/img/problem_1.png' },
    { id: '4', name: 'Modules broken', img: '../assets/img/problem_1.png' },
    { id: '5', name: 'Overheating', img: '../assets/img/problem_1.png' },
    { id: '6', name: 'Snow', img: '../assets/img/problem_1.png' },
    { id: '7', name: 'Inverter failure', img: '../assets/img/problem_1.png' }
  ];

  constructor (private coordinatesService: CoordinatesService, private renderer: Renderer2, private windowService: WindowService, private cityService: CityService) { }

  async ngOnInit() {
    console.log(this.coordinates)
    //this.coordinates = this.coordinatesService.getCoordinates();
    this.city = this.cityService.selectedCity;
    this.address = this.cityService.selectedAddress;

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
    const form = document.querySelector("div#mainForm form") as HTMLFormElement;
    const resultsDiv = document.querySelector("div#results");

    // Selecciona el mes actual por defecto
    const currentMonth = (new Date()).getMonth() + 1;
    const options = document.getElementsByTagName("option");
    for (let option of options) {
      if (parseInt(option.value) === currentMonth) {
        option.setAttribute("selected", "true");
        break;
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      this.visible = false;
      this.processing = true; // <<--- ahora Angular mostrará "< SolarCheckup Navigator"
      this.currentStep = 'results';

      const url = form.action;
      const formData = new FormData(form);
      formData.append("lat", this.coordinates.lat.toString());
      formData.append("lon", this.coordinates.lng.toString());

      // Obtener cookie CSRF
      await fetch(`${this.url_server}/existing/v1/getCookie`, { method: "GET", credentials: "include" });

      form.style.display = "none";

      const message = document.querySelector("#mainForm h2");
      message.textContent = "Processing...";
      message.classList.add("text-center");

      const headers = new Headers();
      headers.append("X-CSRFToken", this.getCookie("csrftoken"));

      fetch(url, { method: "POST", headers: headers, body: formData, credentials: "include" })
        .then(async (response) => {
          const result = await response.json();
          this.lastResult = result;

          // En lugar de manipular el style.display, reseteamos el paso del test
          this.comparisonStep = 'initial';

          // Actualiza el directionProcess sin moverlo
          const suggestionPDirection = document.querySelector("#directionProcess") as HTMLDivElement;
          suggestionPDirection.textContent = this.city + " / " + this.address + " / Solar panel performance check / SolarCheckup Navigator";
          suggestionPDirection.setAttribute("style", "font-size: 14px; color: #0f4881; margin-bottom: 2%;");

          message.textContent = "< SolarCheckup Navigator";
          message.classList.remove("text-center");

          const expectedP = document.createElement("p");
          expectedP.textContent = "Estimated yearly generation: " + result.estimated_generation + " kWh";
          resultsDiv.appendChild(expectedP);

          const suggestionP = document.createElement("p");
          suggestionP.textContent = result.suggestion;
          suggestionP.setAttribute("style", "text-align: justify; text-justify: inter-word");
          resultsDiv.appendChild(suggestionP);

          document.getElementById("month_selector")?.style.setProperty('display', 'block');
          const comparationDiv = document.getElementById("comparation");

          let max_month_generation;
          document.getElementById("line_chart")?.style.setProperty('display', 'none');

          const monthForm = document.querySelector("#month_selector form") as HTMLFormElement;
          /*monthForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const monthFormData = new FormData(monthForm);
            const month = parseInt(monthFormData.get("month").toString());

            this.maxMonthGenValue = result.max_month_generation[month - 1];
            this.chartDataLine = [result.generation_data[month - 1]];

            this.comparisonStep = 'ask_similarity';

            const pChartDate = document.querySelector("div#charts p#chart_date");
            pChartDate.innerHTML = result.generation_data[month - 1].name;
            
            document.getElementById("line_chart").style.display = "block";
            document.getElementById("month_selector").style.display = "none";

            /*comparationDiv.innerHTML = `
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
            `;*/

            //const radioForm = document.querySelector("form#radioForm") as HTMLFormElement;
            /*radioForm.addEventListener("submit", (event) => {
              event.preventDefault();
              const radioFormData = new FormData(radioForm);
              if (radioFormData.get("compare") == "Yes") {
                comparationDiv.innerHTML = `
                  <p style="text-align: justify; text-justify: inter-word">
                    Looks like your system is performing well. Try to repeat this
                    check monthly. If the monthly generation is very different with respect to the one expected, it
                    can be that your system is underperforming. Repeat this test and consider contacting a solar
                    expert for a field inspection.
                  </p>
                `;
              } else {
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
                `;

                const problemForm = document.querySelector("form#problemForm") as HTMLFormElement;
                problemForm.addEventListener("submit", (event) => {
                  event.preventDefault();
                  const problemFormData = new FormData(problemForm);
                  const selectedProblem = problemFormData.get("problem");
                  comparationDiv.innerHTML = `
                    <div style="margin-left: 20px">
                      <p>Choice ${selectedProblem}, Suggestion ${selectedProblem}</p>
                    </div>
                  `;
                });
              }
            });
          });*/

          document.getElementById("charts").style.display = "block";
          this.chartDataBarYear = [...result.yearly_generation, { name: "Actual", value: formData.get("real_last_year") }];
          this.chartDataBarMonth = result.monthly_generation;
        })
        .catch((error) => {
          console.log(error);
          message.textContent = "Error";
        });
    });
  }

onMonthSelect(event: any) {
  event.preventDefault();
  const formData = new FormData(event.target as HTMLFormElement);
  const month = parseInt(formData.get("month") as string);

  const result = this.lastResult; // Ya tienes lastResult definido en la clase

  this.maxMonthGenValue = result.max_month_generation[month - 1];
  this.chartDataLine = [result.generation_data[month - 1]];
  
  // IMPORTANTE: Esto activa el primer bloque de preguntas en el HTML
  this.comparisonStep = 'ask_similarity';

  setTimeout(() => {
    const pChartDate = document.querySelector("#chart_date");
    if (pChartDate) pChartDate.innerHTML = result.generation_data[month - 1].name;
    
    // Si usas *ngIf en el HTML, estas líneas de .style ya no son estrictamente necesarias
    // pero las dejamos para asegurar compatibilidad con tu CSS
    document.getElementById("line_chart")?.style.setProperty('display', 'block');
    document.getElementById("month_selector")?.style.setProperty('display', 'none');
  }, 0);
}


  goBack() {
    this.windowService.changeWindow(1);
    this.windowService.changeVisibleLink(true);
  }

  showForm() {
    const form = document.querySelector("div#mainForm form") as HTMLFormElement;
    const resultsDiv = document.querySelector("div#results");

    form.style.display = "block";
    this.visible = true;
    document.getElementById("charts").style.display = "none";

    // Limpia los mensajes del resultado
    const pDelete = resultsDiv.getElementsByTagName("p");
    for (let i = pDelete.length - 1; i >= 0; i--) {
      const pNode = pDelete[i];
      resultsDiv.removeChild(pNode);
    }

    this.processing = false;
  }

  /*toggleChart() {
    this.showYearly = !this.showYearly;
  }*/


}
