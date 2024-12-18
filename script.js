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
                // Split the text into sentences and find where the query matches
                const sentences = entry.text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)(?:\s+)/);
                const matchIndex = sentences.findIndex(sentence => sentence.toLowerCase().includes(query));
                if (matchIndex === -1) return null; // No match

                // Collect preceding, matching, and succeeding sentences
                const preceding = sentences[matchIndex - 1] || "";
                const matching = sentences[matchIndex] || "";
                const succeeding = sentences[matchIndex + 1] || "";

                entry.displayText = `${preceding} ${matching} ${succeeding}`.trim();
                entry.fullParagraph = sentences.join(" ");
                return entry;
            })
            .filter(entry => entry); // Remove null entries

        resultsDiv.innerHTML = results.length
            ? results.map(entry => `
                <div class="result">
                    <img src="./images/${entry.year}_page_${entry.page}.png" class="thumbnail" alt="Page Image" data-fulltext="${entry.fullParagraph}">
                    <p>${entry.year}, Page ${entry.page}: ${entry.displayText}</p>
                </div>
            `).join("")
            : "No results found.";

        // Add click event listener for thumbnails
        document.querySelectorAll(".thumbnail").forEach(img => {
            img.addEventListener("click", event => {
                const fullText = event.target.getAttribute("data-fulltext");
                const modal = document.createElement("div");
                modal.className = "modal";
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <img src="${event.target.src}" class="large-image">
                        <p>${fullText}</p>
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
