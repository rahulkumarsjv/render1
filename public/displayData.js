function fetchData(collectionName) {
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
