// Function to show notification messages
function showNotification(message, type) {
  const notificationBox = document.getElementById("notificationBox");

  notificationBox.innerHTML = message;
  notificationBox.className = `alert alert-${type} alert-dismissible fade show`;
  notificationBox.style.display = "block";

  setTimeout(() => {
    notificationBox.style.display = "none";
  }, 3000);
}

document
  .getElementById("addPatientForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const patientName = document.getElementById("patientName").value.trim();
    const patientContactNum = document
      .getElementById("patientContactNum")
      .value.trim();

    if (!patientName || !patientContactNum) {
      showNotification("All fields are required!", "danger");
      return;
    }

    if (!confirm("Are you sure you want to add this patient?")) {
      return;
    }

    fetch("/api/patients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ patientName, patientContactNum }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Patient added successfully") {
          showNotification("Patient added successfully!", "success");

          setTimeout(() => {
            window.location.href = "patients.html"; // Redirect after success
          }, 1500);
        } else {
          throw new Error(data.message || "Failed to add patient");
        }
      })
      .catch((error) => {
        console.error("Error adding patient:", error);
        showNotification("Error adding patient. Please try again.", "danger");
      });
  });
