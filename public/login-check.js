$(document).ready(function() {
    $.ajax({
      url: '/api/profile',
      method: 'GET',
      success: function(data) {
        // Successfully fetched profile data, user is logged in
        $('#welcomeName').text(data.name);
        $('#name').text(data.name);
        $('#email').text(data.email);
        $('#PhoneNumber').text(data.PhoneNumber);
      },
      error: function(err) {
        // Error fetching profile data, user is not logged in
        console.error('Error fetching profile data:', err);
        alert('You must be logged in to view this page.');
        window.location.href = '/login.html'; // Redirect to login page if not logged in
      }
    });
  });
  