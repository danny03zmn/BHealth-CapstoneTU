document
  .getElementById("editAppointmentForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    if (!confirm("Are you sure you want to save changes?")) return;

    const appointmentId = document.getElementById("appointmentId").value;
    const updatedAppointment = {
      doctorId: document.getElementById("doctorId").value,
      scheduleddatetime: moment
        .tz(
          document.getElementById("scheduledDateTime").value,
          "Asia/Kuala_Lumpur"
        )
        .utc()
        .format(),
      status: document.getElementById("status").value,
      remarks: document.getElementById("remarks").value,
    };

    fetch(`/api/appointments/${appointmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedAppointment),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Appointment updated successfully") {
          showNotification("Appointment updated!", "success");
          $("#editAppointmentModal").modal("hide");
          loadAppointments(
            document
              .querySelector(".nav-tabs .active")
              .getAttribute("data-status")
          );
        } else {
          throw new Error(data.message || "Update failed");
        }
      })
      .catch((error) =>
        showNotification("Error updating appointment.", "danger")
      );
  });

// Load doctors into dropdown
function loadDoctors(selectedDoctorId) {
  fetch("/api/doctors")
    .then((response) => response.json())
    .then(({ doctors }) => {
      const doctorDropdown = document.getElementById("doctorId");
      doctorDropdown.innerHTML = ""; // Clear existing options

      doctors.forEach((doctor) => {
        const option = document.createElement("option");
        option.value = doctor.id;
        option.textContent = doctor.doctorName;
        if (doctor.id == selectedDoctorId) {
          option.selected = true;
        }
        doctorDropdown.appendChild(option);
      });

      $(".select2").select2(); // Initialize searchable dropdown
    })
    .catch((error) => console.error("Error fetching doctors:", error));
}

// Show notification
function showNotification(message, type) {
  const notificationBox = document.getElementById("notificationBox");
  notificationBox.innerHTML = message;
  notificationBox.className = `alert alert-${type} alert-dismissible fade show`;
  notificationBox.style.display = "block";

  setTimeout(() => {
    notificationBox.style.display = "none";
  }, 3000);
}
