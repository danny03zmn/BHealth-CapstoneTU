function attachEditButtonListeners() {
  document.querySelectorAll(".edit-appointment-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const appointmentId = this.getAttribute("data-id");
      const doctorId = this.getAttribute("data-doctor-id");
      const doctorName = this.getAttribute("data-doctor-name");
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
      document.getElementById("scheduledDateTime").value =
        formatDateTimeForInput(scheduledDateTime);
      document.getElementById("status").value = status;
      document.getElementById("remarks").value = remarks;

      // Load doctors in dropdown
      loadDoctors(doctorId);

      // Show modal
      $("#editAppointmentModal").modal("show");
    });
  });
}

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

document.addEventListener("DOMContentLoaded", function () {
  const appointmentList = document.getElementById("appointmentList");

  function fetchAppointments(status) {
    fetch(`/api/appointments?status=${status}`)
      .then((response) => response.json())
      .then((data) => {
        renderAppointments(data); // Refresh table content
        attachEditButtonListeners(); // Re-attach event listeners
      })
      .catch((error) => console.error("Error fetching appointments:", error));
  }

  function renderAppointments(appointments) {
    const rows = appointments
      .map((appointment, index) => {
        const date = new Date(appointment.scheduleddatetime);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();

        return `<tr>
                <td>${index + 1}</td>
                <td>${appointment.doctorName}</td>
                <td>${appointment.patientName}</td>
                <td>${appointment.patientContactNum}</td>
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>
                    <button type="button" class="btn btn-primary btn-sm edit-appointment-btn"
                        data-id="${appointment.id}"
                        data-doctor-id="${appointment.doctorId || ""}"
                        data-doctor-name="${appointment.doctorName || ""}"
                        data-patient-name="${appointment.patientName || ""}"
                        data-datetime="${appointment.scheduleddatetime || ""}"
                        data-status="${appointment.status || ""}"
                        data-remarks="${appointment.remarks || ""}">
                        Edit
                    </button>
                </td>
                <td>${appointment.remarks || "N/A"}</td>
            </tr>`;
      })
      .join("");

    document.getElementById("appointmentList").innerHTML = rows;
  }

  // Add event listeners for tab clicks
  document.querySelectorAll(".nav-tabs .nav-link").forEach((tab) => {
    tab.addEventListener("click", function (e) {
      e.preventDefault();

      if (!tab.classList.contains("disabled")) {
        document
          .querySelectorAll(".nav-tabs .nav-link")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        const status = tab.getAttribute("data-status");
        fetchAppointments(status); // Reload the table when switching tabs
      }
    });
  });

  // Set the Pending tab as active on page load
  const pendingTab = document.querySelector('[data-status="pending"]');
  if (pendingTab) {
    pendingTab.classList.add("active");
    fetchAppointments("pending"); // Load Pending appointments
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".edit-appointment-btn");
  if (!button) return; // Ignore clicks outside edit buttons

  // Retrieve data attributes
  const appointmentId = button.getAttribute("data-id");
  const doctorId = button.getAttribute("data-doctor-id");
  const doctorName = button.getAttribute("data-doctor-name");
  const patientName = button.getAttribute("data-patient-name");
  const scheduledDateTime = button.getAttribute("data-datetime");
  const status = button.getAttribute("data-status");
  const remarks = button.getAttribute("data-remarks");

  if (!appointmentId) {
    console.error("Error: Appointment ID is missing.");
    return;
  }

  // Populate modal fields
  document.getElementById("appointmentId").value = appointmentId;
  document.getElementById("patientName").value = patientName;
  document.getElementById("scheduledDateTime").value =
    formatDateTimeForInput(scheduledDateTime);
  document.getElementById("status").value = status;
  document.getElementById("remarks").value = remarks;

  // Load doctors in dropdown
  loadDoctors(doctorId);

  // Show modal
  $("#editAppointmentModal").modal("show");
});
