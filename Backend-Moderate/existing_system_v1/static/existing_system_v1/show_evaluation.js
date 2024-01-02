const form = document.querySelector("form");
const resNode = document.querySelector("h3#result")

form.addEventListener("submit", (event) => {
    event.preventDefault();
    resNode.textContent = "Evaluating...";
    const url = form.action;
    const formData = new FormData(form);
    fetch(url, { method: "POST", body: formData })
        .then(async(response) => {
            const result = await response.text();
            resNode.textContent = result;
        })
        .catch(() => {
            resNode.textContent = "Error";
        })
});