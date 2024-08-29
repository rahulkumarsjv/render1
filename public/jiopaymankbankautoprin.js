async function fetchAccountDetails() {
    try {
        const response = await fetch('/api/account-details');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        console.log('Fetched data:', data); // Log the data to see its structure

        if (Array.isArray(data) && data.length > 0) {
            const account = data[0]; // Use the first item from the array

            document.getElementById('accountno').innerText = account.accountNo || 'N/A';
            document.getElementById('ifsccode').innerText = account.ifscCode || 'N/A';
            document.getElementById('name').innerText = account.name || 'N/A';
            document.getElementById('fathername').innerText = account.fatherName || 'N/A';
            document.getElementById('date_of_birth').innerText = account.date_of_birth || 'N/A';
            document.getElementById('address').innerText = account.address || 'N/A';
            document.getElementById('mobilenumber').innerText = account.mobileNumber || 'N/A';
            document.getElementById('email').innerText = account.emailId || 'N/A';  // Corrected here
            document.getElementById('branch').innerText = account.branch || 'N/A';
            document.getElementById('branchAddress').innerText = account.branchAddress || 'N/A';
            document.getElementById('accountOpenDate').innerText = account.accountOpenDate || 'N/A';
        } else {
            console.error('No account details found or data is not an array.');
        }
    } catch (error) {
        console.error('Error fetching account details:', error);
    }
}
window.onload = fetchAccountDetails;