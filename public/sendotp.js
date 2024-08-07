document.getElementById('otp-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const otpDigits = document.querySelectorAll('.otp__digit');
    let otp = '';
    otpDigits.forEach(digit => otp += digit.value);

    fetch('/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('OTP Verified Successfully!');
        } else {
            alert('Invalid OTP. Please try again.');
        }
    })
    .catch(error => console.error('Error:', error));
});
