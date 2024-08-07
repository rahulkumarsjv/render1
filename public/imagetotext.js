document.getElementById('imageInput').addEventListener('change', function() {
    var file = this.files[0];
    var reader = new FileReader();

    reader.onload = function(event) {
        var img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            // Now that the image is loaded, we can proceed with OCR
            document.getElementById('convertButton').addEventListener('click', function() {
                Tesseract.recognize(
                    img,
                    'eng+hin', // Specify both English and Hindi
                    {
                        logger: function(m) {
                            console.log(m);
                        }
                    }
                ).then(function(result) {
                    document.getElementById('output').innerText = result.data.text;
                    document.getElementById('playButton').style.display = 'block';
                }).catch(function(error) {
                    console.error(error);
                });
            });
        };
    };

    reader.readAsDataURL(file);
});

document.getElementById('playButton').addEventListener('click', function() {
    var text = document.getElementById('output').innerText;
    speak(text);
});

function speak(text) {
    var synth = window.speechSynthesis;
    var utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
}
