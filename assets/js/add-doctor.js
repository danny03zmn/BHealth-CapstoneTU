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

// Load clinics into dropdown menu
function loadClinics() {
  fetch("/api/clinics")
    .then((response) => response.json())
    .then(({ clinics }) => {
      const clinicDropdown = document.getElementById("workingClinic");
      clinicDropdown.innerHTML = ""; // Clear existing options

      clinics.forEach((clinic) => {
        const option = document.createElement("option");
        option.value = clinic.id;
        option.textContent = clinic.clinicName;
        clinicDropdown.appendChild(option);
      });

      $(".select2").select2(); // Apply Select2 for searchability
    })
    .catch((error) => console.error("Error fetching clinics:", error));
}

// Handle form submission
document
  .getElementById("addDoctorForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const doctorName = document.getElementById("doctorName").value.trim();
    const doctorEmail = document.getElementById("doctorEmail").value.trim();
    const doctorContactNum = document
      .getElementById("doctorContactNum")
      .value.trim();
    const workingClinic = document.getElementById("workingClinic").value;

    if (!doctorName || !doctorEmail || !doctorContactNum || !workingClinic) {
      showNotification("All fields are required!", "danger");
      return;
    }

    if (!confirm("Are you sure you want to add this doctor?")) {
      return;
    }

    fetch("/api/doctors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctorName,
        doctorEmail,
        doctorContactNum,
        workingClinic,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Doctor added successfully") {
          showNotification("Doctor added successfully!", "success");

          setTimeout(() => {
            window.location.href = "doctor.html"; // Redirect after success
          }, 1500);
        } else {
          throw new Error(data.message || "Failed to add doctor");
        }
      })
      .catch((error) => {
        console.error("Error adding doctor:", error);
        showNotification("Error adding doctor. Please try again.", "danger");
      });
  });

// Load clinics when page loads
document.addEventListener("DOMContentLoaded", loadClinics);
