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
                const [year, filename, pageNumber, text, , , link] = fields;
                return { year, page: pageNumber, text, link };
            })
            .filter(entry => entry);

        // Perform fuzzy search
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

        function formatGoogleDriveLink(link) {
            const match = link.match(/\/file\/d\/([-_\w]+)/);
            if (match) {
                return `https://drive.google.com/uc?export=view&id=${match[1]}`;
            }
            return link;
        }

        function renderPage(page) {
            const startIndex = (page - 1) * resultsPerPage;
            const endIndex = Math.min(startIndex + resultsPerPage, totalResults);

            const pageResults = results.slice(startIndex, endIndex);
            resultsDiv.innerHTML = `
                <p>Found ${totalResults} results. Displaying ${startIndex + 1} - ${endIndex}.</p>
                ${pageResults.map(entry => {
                    const imgSrc = formatGoogleDriveLink(entry.link);
                    console.log(`Constructed Image URL: ${imgSrc}`); // Debugging URL construction
                    return `
                        <div class="result">
                            <img src="${imgSrc}" class="thumbnail" alt="Page Image" style="display: block; max-width: 200px; margin-bottom: 10px;">
                            <p>${entry.year}, Page ${entry.page}: ${highlightQuery(entry.text, query)}</p>
                        </div>
                    `;
                }).join("")}
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

async function loadTableOfContents() {
    const tocContainer = document.getElementById("tocContainer");

    try {
        const response = await fetch('./csv/Table of Contents.csv');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.text();
        const rows = data.split('\n').filter(row => row.trim());
        let currentIssue = null;
        let html = '';

        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length >= 6 && cols.slice(0, 5).every(col => col.trim())) {
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
