async function search() {
    const searchBox = document.getElementById("searchBox");
    const query = searchBox.value.toLowerCase();
    const resultsDiv = document.getElementById("results");
    const loadingIndicator = document.getElementById("loadingIndicator");

    resultsDiv.innerHTML = "";
    loadingIndicator.style.display = "block";

    try {
        const response = await fetch('./csv/journal_data_links.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.text();
        const rows = data.split('\n').slice(1); // Skip header row
        const entries = rows
            .map(row => {
                const fields = row.split(',');
                if (fields.length < 7) return null; // Skip malformed rows
                const [year, , pageNumber, text, , , link] = fields;
                return { year, page: pageNumber, text, link };
            })
            .filter(entry => entry);

        const fuse = new Fuse(entries, {
            keys: ['text'], 
            includeScore: true, 
            threshold: 0.4
        });

        const results = fuse.search(query).map(result => result.item);

        if (results.length === 0) {
            resultsDiv.innerHTML = "No results found.";
            return;
        }

        const totalResults = results.length;
        let currentPage = 1;
        const resultsPerPage = 20;
        const totalPages = Math.ceil(totalResults / resultsPerPage);

        function renderPage(page) {
            const startIndex = (page - 1) * resultsPerPage;
            const endIndex = Math.min(startIndex + resultsPerPage, totalResults);

            const pageResults = results.slice(startIndex, endIndex);
            resultsDiv.innerHTML = `
                <p>Found ${totalResults} results. Displaying ${startIndex + 1} - ${endIndex}.</p>
                ${pageResults.map(entry => `
                    <div class="result">
                        <img src="${entry.link}" class="thumbnail" alt="Page Image" style="display: block; max-width: 200px; margin-bottom: 10px;">
                        <p>${entry.year}, Page ${entry.page}: ${highlightQuery(entry.text, query)}</p>
                    </div>
                `).join("")}
                <div class="pagination">
                    ${currentPage > 1 ? '<button id="prevPage">Previous</button>' : ''}
                    ${currentPage < totalPages ? '<button id="nextPage">Next</button>' : ''}
                </div>
            `;

            if (currentPage > 1) {
                document.getElementById("prevPage").addEventListener("click", () => {
                    currentPage--;
                    renderPage(currentPage);
                });
            }

            if (currentPage < totalPages) {
                document.getElementById("nextPage").addEventListener("click", () => {
                    currentPage++;
                    renderPage(currentPage);
                });
            }
        }

        renderPage(currentPage);

    } catch (error) {
        console.error("Error during fetch or processing:", error);
        resultsDiv.innerHTML = "Error loading results.";
    } finally {
        loadingIndicator.style.display = "none";
    }
}

function highlightQuery(text, query) {
    const regex = new RegExp(query, 'gi');
    return text.replace(regex, match => `<span class="highlight">${match}</span>`);
}
