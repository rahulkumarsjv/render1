document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("modal");
    const closeBtn = document.getElementById("closeBtn");

    // Show the modal when the page loads
    modal.style.display = "block";

    // Close the modal when the close button is clicked
    closeBtn.onclick = function() {
        modal.style.display = "none";
    };

    // Close the modal when clicking outside of the modal content
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
});
