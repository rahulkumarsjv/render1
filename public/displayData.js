function fetchData(collection) {
    fetch(`/api/data/${collection}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => displayData(data, collection))
        .catch(error => console.error('Error fetching data:', error));
}

function displayData(data, collection) {
    const dataDisplay = document.getElementById('dataDisplay');
    dataDisplay.innerHTML = '';

    if (!data || data.length === 0) {
        dataDisplay.innerHTML = 'No data available';
        return;
    }

    // Create table
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create table headers based on keys in data
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table rows
    data.forEach(item => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            const value = item[header];

            if (typeof value === 'string' && value.match(/\.(jpeg|jpg|gif|png)$/)) {
                // Handle image URLs
                const img = document.createElement('img');
                img.src = value;
                img.style.width = '100px'; // Adjust the size as needed
                img.style.height = 'auto';
                td.appendChild(img);
            } else if (typeof value === 'string' && value.match(/\.(pdf)$/)) {
                // Handle PDF URLs
                const link = document.createElement('a');
                link.href = value;
                link.textContent = 'View PDF';
                link.target = '_blank'; // Open PDF in a new tab
                td.appendChild(link);
            } else {
                // Handle other types of data
                td.textContent = value || ''; // Display the value or empty string if undefined
            }

            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    dataDisplay.appendChild(table);
}

function searchData() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#dataDisplay table tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let found = false;
        cells.forEach(cell => {
            if (cell.textContent.toLowerCase().includes(query)) {
                found = true;
            }
        });
        row.style.display = found ? '' : 'none';
    });
}

function submitEditForm(event) {
    event.preventDefault();
    // Add logic to submit the form data to the server
    console.log('Form submitted');
}

function logout() {
    // Add logic to handle user logout
    console.log('User logged out');
}
