// script.js
document.getElementById('fileInput').addEventListener('change', function() {
    const file = this.files[0];
    const image = document.getElementById('uploadedImage');
  
    const reader = new FileReader();
    reader.onload = function(e) {
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  
  function convertAndDownload() {
    const image = document.getElementById('uploadedImage');
    const fileSizeInput = document.getElementById('fileSizeInput').value;
  
    // Parse the input to extract the value and unit
    const match = fileSizeInput.match(/^(\d+)([KM]?B)$/i);
    if (!match) {
      alert('Invalid input. Please enter a valid file size (e.g., 500KB, 2MB).');
      return;
    }
  
    const sizeValue = parseFloat(match[1]);
    const sizeUnit = match[2].toUpperCase();
  
    let fileSizeInputBytes;
    if (sizeUnit === 'KB') {
      fileSizeInputBytes = sizeValue * 1024;
    } else if (sizeUnit === 'MB') {
      fileSizeInputBytes = sizeValue * 1024 * 1024;
    } else {
      // Assume KB if no unit specified
      fileSizeInputBytes = sizeValue;
    }
  
    // Create a new canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    // Set canvas dimensions to match the image
    canvas.width = image.width;
    canvas.height = image.height;
  
    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
    let quality = 1; // Initial quality
    let imageDataURL;
    let blobSize;
  
    do {
      // Convert the canvas content to a data URL representing the image in JPEG format
      imageDataURL = canvas.toDataURL('image/jpeg', quality);
  
      // Convert data URL to Blob
      const blob = dataURItoBlob(imageDataURL);
  
      // Get the size of the Blob
      blobSize = blob.size;
  
      // If the size exceeds the desired file size, decrease quality
      if (blobSize > fileSizeInputBytes) {
        quality -= 0.01; // Adjust quality down by 1%
      }
    } while (blobSize > fileSizeInputBytes && quality > 0);
  
    // Create a download link for the converted image
    const downloadLink = document.createElement('a');
    downloadLink.href = imageDataURL;
    downloadLink.download = 'converted_image.jpg';
    document.body.appendChild(downloadLink);
  
    // Trigger the download
    downloadLink.click();
  }
  
  // Function to convert data URI to Blob
  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
  }
  