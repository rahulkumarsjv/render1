document.addEventListener('DOMContentLoaded', function() {
  // Function to parse query parameters from URL
  function getQueryParams() {
      var queryString = window.location.search;
      var queryParams = new URLSearchParams(queryString);
      var params = {};
      queryParams.forEach(function(value, key) {
          params[key] = value;
      });
      return params;
  }

  // Function to format date in dd/mm/yyyy format
  function formatDate(dateString) {
      var parts = dateString.split('-');
      if (parts.length !== 3) {
          console.error('Invalid date format:', dateString);
          return 'Invalid Date';
      }
      var year = parts[0];
      var month = parts[1];
      var day = parts[2];
      // Rearrange the parts to dd/mm/yyyy format
      return day + '/' + month + '/' + year;
  }

  // Retrieve the data from the query parameters
  var queryParams = getQueryParams();
  var nameHindi = queryParams['namehind'];
  var name = queryParams['name'];
  var dob = queryParams['dob'];
  var gender = queryParams['gender'];
  var genderHindi = queryParams['genderhindi'] === 'male' ? 'पुरुष / ' : queryParams['genderhindi'] === 'female' ? 'महिला' : 'अनजान';

  // Capitalizing English name and gender
  name = name ? name.toUpperCase() : 'Name not provided';
  gender = gender ? gender.toUpperCase() : 'Gender not provided';

  // Format date of birth
  dob = dob ? formatDate(dob) : 'DOB not provided';

  // Display the data on the second page
  document.getElementById('name').textContent = name;
  document.getElementById('namehindi').textContent = nameHindi ? nameHindi : 'Name not provided';
  document.getElementById('dob').textContent = dob; // Display the formatted date
  document.getElementById('gender').textContent = gender;
  document.getElementById('genderhindi').textContent = genderHindi;
  document.getElementById('address').textContent = queryParams['address'] ? queryParams['address'] : 'Address not provided';
  document.getElementById('addresshindi').textContent = queryParams['addresshind'] ? queryParams['addresshind'] : 'Address not provided';
  document.getElementById('number').textContent = queryParams['number'] ? queryParams['number'] : 'Number not provided';
  document.getElementById('number2').textContent = queryParams['number2'] ? queryParams['number2'] : 'Number not provided';

  // Retrieve and display the QR code stored in local storage
  var qrCodeData = localStorage.getItem('qrCode');
  if (qrCodeData) {
      const qrCodeImg = document.createElement('img');
      qrCodeImg.src = qrCodeData;
      document.getElementById('qrcode').appendChild(qrCodeImg);
  } else {
      // If QR code data is not available, display a placeholder or message
      document.getElementById('qrcode').textContent = 'No QR code available';
  }
});
 // Retrieve and display the uploaded photo
 var photoData = localStorage.getItem('uploadedImage');
 if (photoData) {
     document.getElementById('photo').src = photoData;
 } else {
     document.getElementById('photo').alt = 'No photo uploaded';
 }
