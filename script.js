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
            .filter(entry => entry && entry.text && entry.text.toLowerCase().includes(query))
            .map(entry => {
                // Highlight the search terms in the text
                const highlightedText = entry.text.replace(
                    new RegExp(query, 'gi'),
                    match => `<span class="highlight">${match}</span>`
                );
                entry.highlightedText = highlightedText;
                return entry;
            });

        resultsDiv.innerHTML = results.length
            ? results.map(entry => `
                <div class="result">
                    <img src="./images/${entry.year}_page_${entry.page}.png" class="thumbnail" alt="Page Image" data-fulltext="${entry.text}" data-highlightedtext="${entry.highlightedText}">
                    <p>${entry.year}, Page ${entry.page}: ${entry.text}</p>
                </div>
            `).join("")
            : "No results found.";

        // Add click event listener for thumbnails
        document.querySelectorAll(".thumbnail").forEach(img => {
            img.addEventListener("click", event => {
                const fullText = event.target.getAttribute("data-fulltext");
                const highlightedText = event.target.getAttribute("data-highlightedtext");
                const modal = document.createElement("div");
                modal.className = "modal";
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <img src="${event.target.src}" class="large-image" alt="Large Image">
                        <p class="modal-text">${highlightedText}</p>
                    </div>
                `;
                document.body.appendChild(modal);

                // Close modal functionality
                modal.querySelector(".close").addEventListener("click", () => {
                    modal.remove();
                });
            });
        });
    } catch (error) {
        console.error("Error during fetch or processing:", error);
        resultsDiv.innerHTML = "Error loading results.";
    } finally {
        loadingIndicator.style.display = "none";
    }
}
