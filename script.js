async function search() {
    const searchBox = document.getElementById("searchBox");
    const query = searchBox.value.toLowerCase();
    const resultsDiv = document.getElementById("results");
    const loadingIndicator = document.getElementById("loadingIndicator");

    resultsDiv.innerHTML = "";
    loadingIndicator.style.display = "block";

    try {
        const response = await fetch('./csv/journal_data.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.text();
        const rows = data.split('\n').slice(1); // Skip header row
        const results = rows
            .map(row => {
                const fields = row.split(',');
                if (fields.length < 3) return null; // Skip malformed rows
                const [year, page, text] = fields;
                return { year, page, text };
            })
            .filter(entry => entry && entry.text && entry.text.toLowerCase().includes(query)); // Filter valid entries

        resultsDiv.innerHTML = results.length
            ? results.map(entry => `
                <div class="result">
                    <img src="./images/${entry.year}_page_${entry.page}.png" alt="Page Image">
                    <p>${entry.year}, Page ${entry.page}: ${entry.text}</p>
                </div>
            `).join("")
            : "No results found.";
    } catch (error) {
        console.error("Error during fetch or processing:", error);
        resultsDiv.innerHTML = "Error loading results.";
    } finally {
        loadingIndicator.style.display = "none";
    }
}
