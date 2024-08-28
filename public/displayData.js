// Function to fetch and display data based on collection name
function fetchData(collection) {
    fetch(`/api/data/${collection}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server responded with an error:', text);
                    throw new Error(`HTTP error! status: ${response.status}`);
                });
            }
        })
        .then(data => {
            const dataDisplay = document.getElementById('dataDisplay');
            dataDisplay.innerHTML = '';

            if (data.length > 0) {
                let table = '<table><tr>';
                
                // Create table headers
                Object.keys(data[0]).forEach(key => {
                    table += `<th>${key}</th>`;
                });
                table += '<th>Actions</th></tr>';

                // Create table rows
                data.forEach(item => {
                    table += '<tr>';
                    Object.keys(item).forEach(key => {
                        table += `<td>${item[key]}</td>`;
                    });
                    table += `<td><button onclick="editData('${item._id}')">Edit</button></td></tr>`;
                });
                table += '</table>';
                dataDisplay.innerHTML = table;
            } else {
                dataDisplay.innerHTML = 'No data found.';
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

function editData(id) {
    fetch(`/api/data/id/${id}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server responded with an error:', text);
                    throw new Error(`HTTP error! status: ${response.status}`);
                });
            }
        })
        .then(data => {
            const editForm = document.getElementById('editForm');
            const form = document.getElementById('editDataForm');

            editForm.style.display = 'block';
            form.innerHTML = '';

            Object.keys(data).forEach(key => {
                if (key !== '_id') {
                    form.innerHTML += `
                        <label>${key}</label>
                        <input type="text" name="${key}" value="${data[key]}">
                        <br>
                    `;
                }
            });

            form.innerHTML += `<input type="hidden" name="_id" value="${id}">`;
        })
        .catch(error => console.error('Error fetching data for editing:', error));
}

// Function to handle form submission
function submitEditForm(event) {
    event.preventDefault();
    const form = document.getElementById('editDataForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/data/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.text().then(text => {
                console.error('Server responded with an error:', text);
                throw new Error(`HTTP error! status: ${response.status}`);
            });
        }
    })
    .then(updatedData => {
        console.log('Data updated successfully:', updatedData);
        // Optionally, refresh the data display or navigate away
        document.getElementById('editForm').style.display = 'none';
        fetchData('users'); // Example to refresh the display
    })
    .catch(error => console.error('Error updating data:', error));
}

// Ensure logout function is defined
function logout() {
    // Logic for logout
}
