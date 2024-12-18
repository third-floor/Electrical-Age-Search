async function search() {
    const searchBox = document.getElementById("searchBox");
    const query = searchBox.value.toLowerCase();
    const resultsDiv = document.getElementById("results");

    resultsDiv.innerHTML = "Loading...";

    const response = await fetch('./csv/journal_data.csv');
    const data = await response.text();

    const rows = data.split('\n').slice(1); // Skip header row
    const results = rows
        .map(row => {
            const [year, page, text] = row.split(',');
            return { year, page, text };
        })
        .filter(entry => entry.text.toLowerCase().includes(query));

    resultsDiv.innerHTML = "";

    if (results.length === 0) {
        resultsDiv.innerHTML = "No results found.";
    } else {
        results.forEach(entry => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result';

            const img = document.createElement('img');
            img.src = `./images/${entry.year}_page_${entry.page}.png`;

            const text = document.createElement('p');
            text.textContent = `${entry.year}, Page ${entry.page}: ${entry.text}`;

            resultDiv.appendChild(img);
            resultDiv.appendChild(text);
            resultsDiv.appendChild(resultDiv);
        });
    }
}
