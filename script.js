let debounceTimeout;

async function search() {
    const searchBox = document.getElementById("searchBox");
    const query = searchBox.value.toLowerCase();
    const resultsDiv = document.getElementById("results");
    const loadingIndicator = document.getElementById("loadingIndicator");

    resultsDiv.innerHTML = "";
    loadingIndicator.style.display = "block";

    try {
        const response = await fetch('./csv/journal_data.csv');
        if (!response.ok) throw new Error("Failed to fetch data.");
        const data = await response.text();

        const rows = data.split('\n').slice(1); // Skip header row
        const results = rows
            .map(row => {
                const [year, page, text] = row.split(',');
                return { year, page, text };
            })
            .filter(entry => entry.text.toLowerCase().includes(query));

        resultsDiv.innerHTML = results.length
            ? results.map(entry => `
                <div class="result">
                    <img src="./images/${entry.year}_page_${entry.page}.png" alt="Page Image">
                    <p>${entry.year}, Page ${entry.page}: ${entry.text}</p>
                </div>
            `).join("")
            : "No results found.";
    } catch (error) {
        resultsDiv.innerHTML = "Error loading results.";
        console.error(error);
    } finally {
        loadingIndicator.style.display = "none";
    }
}

document.getElementById("searchBox").addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(search, 300); // Adjust debounce delay as needed
});
