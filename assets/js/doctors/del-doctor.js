function confirmDelete(button) {
  const doctorId = button.getAttribute("data-id");
  if (confirm("Are you sure you want to delete this doctor?")) {
    fetch(`/api/doctors/${doctorId}`, {
      method: "PATCH",
    })
      .then((response) => {
        if (response.ok) {
          alert("Doctor marked as deleted successfully!");
          window.location.reload();
        } else {
          alert("Failed to mark doctor as deleted.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      });
  }
}
