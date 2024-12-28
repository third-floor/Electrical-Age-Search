async function search() {
    const searchBox = document.getElementById("searchBox");
    const query = searchBox.value.toLowerCase();
    const resultsDiv = document.getElementById("results");
    const loadingIndicator = document.getElementById("loadingIndicator");

    resultsDiv.innerHTML = "";
    loadingIndicator.style.display = "block";

    try {
        const response = await fetch('./csv/journal_data_links.csv'); // Updated to new CSV file
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.text();
        const rows = data.split('\n').slice(1); // Skip header row
        const results = rows
            .map(row => {
                const fields = row.split(',');
                if (fields.length < 4) return null; // Skip malformed rows
                const [year, page, text, link] = fields;
                return { year, page, text, link };
            })
            .filter(entry => entry && entry.text && entry.text.toLowerCase().includes(query))
            .map(entry => {
                const highlightedText = entry.text.replace(
                    new RegExp(query, 'gi'),
                    match => `<span class="highlight">${match}</span>`
                );
                entry.highlightedText = highlightedText;
                return entry;
            });

        const totalResults = results.length;
        if (totalResults === 0) {
            resultsDiv.innerHTML = "No results found.";
            return;
        }

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
                        <img src="${entry.link}" class="thumbnail" alt="Page Image">
                        <p>${entry.year}, Page ${entry.page}: ${entry.highlightedText}</p>
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


async function loadTableOfContents() {
    const tocContainer = document.getElementById("tocContainer");

    try {
        const response = await fetch('./csv/Table of Contents.csv');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim());
        let currentIssue = null;
        let html = '';

        rows.forEach((row, index) => {
            const cols = row.split(',');
            if (cols.length >= 6 && cols.slice(0, 5).every(col => col.trim())) {
                // Close the previous issue's listing and add the image
                if (currentIssue) {
                    const [year, page] = currentIssueImageDetails;
                    html += `<img src="./images/${year}_page_${page}.png" alt="Table of Contents Image" class="toc-image"></ul>`;
                }
                currentIssue = cols.slice(0, 5).join(', ');
                currentIssueImageDetails = [cols[2].trim(), cols[3].trim()];
                html += `<h2>${currentIssue}</h2><ul>`;
            } else if (cols.length >= 6) {
                const [title, author] = cols[5].split(';').map(item => item.trim());
                html += `<li><strong>${title}</strong> - ${author || 'Unknown Author'}</li>`;
            }
        });

        // Add the image for the last issue
        if (currentIssue) {
            const [year, page] = currentIssueImageDetails;
            html += `<img src="./images/${year}_page_${page}.png" alt="Table of Contents Image" class="toc-image"></ul>`;
        }

        tocContainer.innerHTML = html;
    } catch (error) {
        console.error("Error loading Table of Contents:", error);
        tocContainer.innerHTML = "Failed to load Table of Contents.";
    }
}
