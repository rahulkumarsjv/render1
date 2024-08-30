<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RA DIGITAL INDIA Display Data</title>
    <link rel="stylesheet" href="displaydata.css">
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        th {
            background-color: #f2f2f2;
        }
        img {
            max-width: 100px;
            height: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="search-section">
            <input type="text" id="searchInput" placeholder="Search by name, address, or ID">
            <button onclick="searchData()">Search</button>
        </div>

        <h1>View Data</h1>
        <div class="button-section">
            <!-- Add buttons for each collection -->
            <button onclick="fetchData('aadharporinadds')">View Aadhar Porin Adds</button>
            <button onclick="fetchData('aadharuclappies')">View Aadhar UCL Applies</button>
            <button onclick="fetchData('adminusers')">View Admin Users</button>
            <button onclick="fetchData('altruists')">View Altruists</button>
            <button onclick="fetchData('ayushmancards')">View Ayushman Cards</button>
            <button onclick="fetchData('ayushmandatas')">View Ayushman Datas</button>
            <button onclick="fetchData('correctionpans')">View Correction Pans</button>
            <button onclick="fetchData('datas')">View Datas</button>
            <button onclick="fetchData('fingerprints')">View Fingerprints</button>
            <button onclick="fetchData('generics')">View Generics</button>
            <button onclick="fetchData('jiopaymankbanks')">View Jio Payment Bank</button>
            <button onclickfunction fetchData(collectionName) {
    fetch(`/api/data/${collectionName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayData(data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('dataDisplay').innerHTML = '<p>Error fetching data.</p>';
        });
}

function displayData(data) {
    const dataDisplay = document.getElementById('dataDisplay');
    if (data.length === 0) {
        dataDisplay.innerHTML = '<p>No data found.</p>';
        return;
    }

    let html = '<table><thead><tr>';
    const keys = Object.keys(data[0]);
    keys.forEach(key => {
        html += `<th>${key}</th>`;
    });
    html += '<th>Actions</th>'; // Add a column for actions
    html += '</tr></thead><tbody>';

    data.forEach(item => {
        html += '<tr>';
        keys.forEach(key => {
            if (key === 'image' || key === 'document') {
                html += `<td><img src="${item[key]}" alt="Image"></td>`;
            } else {
                html += `<td>${item[key]}</td>`;
            }
        });
        html += `<td>
                    <button onclick="updateData('${item._id}')">Update</button>
                    <button onclick="deleteData('${item._id}')">Delete</button>
                 </td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    dataDisplay.innerHTML = html;
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

function updateData(id) {
    const updatedData = prompt('Enter updated data in JSON format:');
    if (updatedData) {
        fetch(`/api/data/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(JSON.parse(updatedData))
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Data updated successfully');
                fetchData('yourCollectionName'); // Refresh data
            } else {
                alert('Update failed');
            }
        })
        .catch(error => {
            console.error('Error updating data:', error);
        });
    }
}

function deleteData(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        fetch(`/api/data/delete/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Data deleted successfully');
                fetchData('yourCollectionName'); // Refresh data
            } else {
                alert('Delete failed');
            }
        })
        .catch(error => {
            console.error('Error deleting data:', error);
        });
    }
}
="fetchData('lostaadhars')">View Lost Aadhaar</button>
            <button onclick="fetchData('lostpans')">View Lost Pans</button>
            <button onclick="fetchData('mobiletolostshowaadhars')">View Mobile to Lost Show Aadhaar</button>
            <button onclick="fetchData('newaadharcards')">View New Aadhaar Cards</button>
            <button onclick="fetchData('pana49forms')">View Pana49 Forms</button>
            <button onclick="fetchData('paymentaadhars')">View Payment Aadhaar</button>
            <button onclick="fetchData('records')">View Records</button>
            <button onclick="fetchData('shops')">View Shops</button>
            <button onclick="fetchData('tecexams')">View TEC Exams</button>
            <button onclick="fetchData('transactions')">View Transactions</button>
            <button onclick="fetchData('users')">View Users</button>

            <button onclick="logout()">Logout</button>
        </div>

        <div id="dataDisplay" class="data-display"></div>
    </div>

    <script src="displayData.js"></script>
</body>
</html>
