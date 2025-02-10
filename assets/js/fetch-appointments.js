document.addEventListener("DOMContentLoaded", function () {
  loadAppointments("today"); // Load today's appointments by default

  document.querySelectorAll(".nav-tabs .nav-link").forEach((tab) => {
    tab.addEventListener("click", function (e) {
      e.preventDefault();
      document
        .querySelectorAll(".nav-tabs .nav-link")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const status = tab.getAttribute("data-status");
      loadAppointments(status);
    });
  });
});

// Function to load appointments dynamically
function loadAppointments(status) {
  fetch(`/api/appointments?status=${status}`)
    .then((response) => response.json())
    .then((data) => {
      renderAppointments(data);
    })
    .catch((error) => console.error("Error fetching appointments:", error));
}

// Function to render appointments into the table
function renderAppointments(appointments) {
  const tableBody = document.getElementById("appointmentList");
  tableBody.innerHTML = "";

  if (appointments.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center">No records found</td></tr>`;
    return;
  }

  appointments.forEach((appointment) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${appointment.doctorName}</td>
        <td>${appointment.doctorContactNum}</td>
        <td>${appointment.patientName}</td>
        <td>${appointment.patientContactNum}</td>
        <td>${formatDateTime(appointment.scheduleddatetime).date}</td>
        <td>${formatDateTime(appointment.scheduleddatetime).time}</td>
        <td>
          <button type="button" class="btn btn-primary btn-sm edit-appointment-btn"
            data-id="${appointment.id}"
            data-doctor-id="${appointment.doctorId}"
            data-doctor-name="${appointment.doctorName}"
            data-patient-name="${appointment.patientName}"
            data-datetime="${appointment.scheduleddatetime}"
            data-status="${appointment.status}"
            data-remarks="${appointment.remarks || ""}">
            Edit
          </button>
        </td>
        <td>${appointment.remarks || "N/A"}</td>
      `;
    tableBody.appendChild(row);
  });

  attachEditButtonListeners();
}

// Format datetime from UTC to local (Malaysia Time)
function formatDateTime(utcDateTime) {
  const localTime = moment.utc(utcDateTime).tz("Asia/Kuala_Lumpur");
  return {
    date: localTime.format("YYYY-MM-DD"),
    time: localTime.format("HH:mm"),
  };
}

// Attach event listeners to Edit buttons
function attachEditButtonListeners() {
  document.querySelectorAll(".edit-appointment-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const appointmentId = this.getAttribute("data-id");
      const doctorId = this.getAttribute("data-doctor-id");
      const patientName = this.getAttribute("data-patient-name");
      const scheduledDateTime = this.getAttribute("data-datetime");
      const status = this.getAttribute("data-status");
      const remarks = this.getAttribute("data-remarks");

      if (!appointmentId) {
        console.error("Error: Appointment ID is missing.");
        return;
      }

      // Populate modal fields
      document.getElementById("appointmentId").value = appointmentId;
      document.getElementById("patientName").value = patientName;
      document.getElementById("scheduledDateTime").value = moment
        .utc(scheduledDateTime)
        .tz("Asia/Kuala_Lumpur")
        .format("YYYY-MM-DDTHH:mm");
      document.getElementById("status").value = status;
      document.getElementById("remarks").value = remarks;

      // Load doctors dropdown
      loadDoctors(doctorId);

      // Show modal
      $("#editAppointmentModal").modal("show");
    });
  });
}
