document.addEventListener("DOMContentLoaded", function () {
  const appointmentTabs = document.querySelectorAll(
    "#appointmentTabs .nav-link"
  );
  const appointmentTableBody = document.querySelector("#appointmentList tbody");
  let currentTab = "today";

  let sortColumn = "id"; // Default sorting column
  let sortOrder = "asc"; // Default sorting order
  let currentPage = 1; // Default page
  let entriesPerPage = 5; // Default rows per page
  let searchQuery = ""; // Default empty search
  let isSorting = false; // Prevent multiple simultaneous requests

  function fetchAppointments(status) {
    return fetch(
      `/api/appointments?status=${status}&sort=${sortColumn}&order=${sortOrder}&limit=${entriesPerPage}&page=${currentPage}&search=${searchQuery}`
    )
      .then((response) => response.json())
      .then((data) => {
        populateTable(data.appointments);
        updatePagination(data.total);
        updateEntriesInfo(data.total);
        attachSortingListeners(); // 🔥 Reattach sorting listeners after fetching new data
      })
      .catch((error) => console.error("Error fetching appointments:", error));
  }

  function populateTable(appointments) {
    const appointmentTableBody = document.querySelector(
      "#appointmentList tbody"
    );
    appointmentTableBody.innerHTML = "";

    if (appointments.length === 0) {
      appointmentTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No records found</td></tr>`;
      return;
    }

    appointments.forEach((appointment) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${appointment.id}</td>
            <td>${appointment.doctorName || "Unknown"}</td>
            <td>${appointment.docContactNum || "N/A"}</td>
            <td>${appointment.patientName || "Unknown"}</td>
            <td>${appointment.patContactNum || "N/A"}</td>
            <td>${convertUtcToLocal(appointment.scheduleddatetime)}</td>
            <td>${appointment.remarks || ""}</td>
            <td>
                <button class="btn btn-primary btn-sm edit-btn" data-id="${
                  appointment.id
                }">Edit</button>
            </td>
        `;
      appointmentTableBody.appendChild(row);
    });

    attachSortingListeners();
  }

  // Convert UTC timestamp to local system time format
  function convertUtcToLocal(utcTimestamp) {
    if (!utcTimestamp) return "N/A";

    const date = new Date(utcTimestamp);
    return date.toLocaleString(); // Uses user's local time settings
  }

  function attachSortingListeners() {
    document.querySelectorAll(".sortable").forEach((header) => {
      header.style.cursor = "pointer";

      // Remove previous event listener before adding a new one
      header.removeEventListener("click", handleSorting);
      header.addEventListener("click", handleSorting);
    });
  }

  function handleSorting(event) {
    if (isSorting) return;

    isSorting = true;
    const column = event.currentTarget.getAttribute("data-column");

    if (sortColumn === column) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortOrder = "asc";
    }

    // Reset sorting arrows
    document.querySelectorAll(".sort-arrow").forEach((arrow) => {
      arrow.innerHTML = "";
    });

    // Set the sorting arrow for the selected column
    const arrow = event.currentTarget.querySelector(".sort-arrow");
    if (arrow) {
      arrow.innerHTML = sortOrder === "asc" ? "&#9650;" : "&#9660;";
    }

    // Fetch sorted data
    fetchAppointments(currentTab)
      .then(() => {
        isSorting = false;
      })
      .catch(() => {
        isSorting = false;
      });
  }

  function updateEntriesInfo(total) {
    const start = (currentPage - 1) * entriesPerPage + 1;
    const end = Math.min(currentPage * entriesPerPage, total);
    document.getElementById(
      "entriesInfo"
    ).innerText = `Showing ${start} to ${end} of ${total} entries`;
  }

  function updatePagination(totalEntries) {
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const paginationControls = document.getElementById("paginationControls");
    paginationControls.innerHTML = "";

    if (totalPages > 1) {
      paginationControls.innerHTML += `<li class="page-item ${
        currentPage === 1 ? "disabled" : ""
      }"><a class="page-link" href="#" data-page="${
        currentPage - 1
      }">Prev</a></li>`;

      for (let i = 1; i <= totalPages; i++) {
        paginationControls.innerHTML += `<li class="page-item ${
          i === currentPage ? "active" : ""
        }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }

      paginationControls.innerHTML += `<li class="page-item ${
        currentPage === totalPages ? "disabled" : ""
      }"><a class="page-link" href="#" data-page="${
        currentPage + 1
      }">Next</a></li>`;
    }

    document
      .querySelectorAll("#paginationControls .page-link")
      .forEach((link) => {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          const page = parseInt(this.getAttribute("data-page"));
          if (!isNaN(page) && page > 0 && page <= totalPages) {
            currentPage = page;
            fetchAppointments(currentTab);
          }
        });
      });
  }

  document
    .getElementById("entriesSelector")
    .addEventListener("change", function () {
      entriesPerPage = parseInt(this.value);
      currentPage = 1;
      fetchAppointments(currentTab);
    });

  document.getElementById("searchBox").addEventListener("input", function () {
    searchQuery = this.value.trim();
    currentPage = 1;
    fetchAppointments(currentTab);
  });

  appointmentTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      document.querySelector(".nav-link.active").classList.remove("active");
      this.classList.add("active");
      currentTab = this.getAttribute("data-tab");
      fetchAppointments(currentTab);
    });
  });

  fetchAppointments(currentTab);

  document
    .querySelector("#appointmentList")
    .addEventListener("click", function (event) {
      if (event.target.classList.contains("edit-btn")) {
        const appointmentId = event.target.getAttribute("data-id");
        openEditModal(appointmentId);
      }
    });

  function openEditModal(appointmentId) {
    fetch(`/api/appointments/${appointmentId}`)
      .then((response) => response.json())
      .then((appointment) => {
        document.querySelector("#appointmentId").value = appointment.id;
        $("#doctorName").val(appointment.doctorId).trigger("change");
        document.querySelector("#doctorContact").value =
          appointment.docContactNum || "N/A";
        document.querySelector("#patientName").value =
          appointment.patientName || "Unknown";
        document.querySelector("#patientContact").value =
          appointment.patContactNum || "N/A";

        // Convert UTC timestamp to local datetime for input field
        document.querySelector("#appointmentDateTime").value =
          convertUtcToInput(appointment.scheduleddatetime);
        document.querySelector("#appointmentStatus").value = appointment.status;
        document.querySelector("#appointmentRemarks").value =
          appointment.remarks || "";
        $("#editAppointmentModal").modal("show");
      })
      .catch((error) =>
        console.error("Error fetching appointment details:", error)
      );
  }

  // Convert UTC timestamp to local time for datetime-local input field (YYYY-MM-DDTHH:MM format)
  function convertUtcToInput(utcTimestamp) {
    if (!utcTimestamp) return "";

    const utcDate = new Date(utcTimestamp);
    const localDate = new Date(
      utcDate.getTime() - utcDate.getTimezoneOffset() * 60000
    );
    return localDate.toISOString().slice(0, 16); // Format for datetime-local input
  }

  // Convert Local Time to UTC Before Sending to Server
  function convertLocalToUtc(localTimestamp) {
    if (!localTimestamp) return null; // Handle empty input gracefully

    const localDate = new Date(localTimestamp);
    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19) // Trim milliseconds
      .replace("T", " "); // Convert to UTC format
  }

  function formatToLocalDisplay(utcTimestamp) {
    const localDate = new Date(utcTimestamp);
    return localDate.toLocaleString();
  }

  // Function to Show Notifications
  function showNotification(message, type) {
    const notificationBox = document.createElement("div");
    notificationBox.className = `alert alert-${type} alert-dismissible fade show`;
    notificationBox.role = "alert";
    notificationBox.innerHTML = `${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>`;

    // Position the notification
    notificationBox.style.position = "fixed";
    notificationBox.style.top = "20px";
    notificationBox.style.right = "20px";
    notificationBox.style.zIndex = "1050";

    document.body.appendChild(notificationBox);

    // Auto-dismiss notification after 3 seconds
    setTimeout(() => {
      notificationBox.remove();
    }, 3000);
  }

  let doctorData = {};

  function loadDoctors() {
    fetch("/api/doctors")
      .then((response) => response.json())
      .then(({ doctors }) => {
        const doctorDropdown = $("#doctorName");
        doctorDropdown.empty();
        doctorData = {};

        doctors.forEach((doctor) => {
          doctorDropdown.append(new Option(doctor.doctorName, doctor.id));
          doctorData[doctor.id] = doctor.docContactNum;
        });

        doctorDropdown.select2();

        doctorDropdown.on("change", function () {
          document.querySelector("#doctorContact").value =
            doctorData[$(this).val()] || "N/A";
        });
      })
      .catch((error) => console.error("Error fetching doctors:", error));
  }

  document
    .getElementById("editAppointmentForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const appointmentId = document.getElementById("appointmentId").value;
      const doctorId = document.getElementById("doctorName").value;
      const localScheduledDateTime = document.getElementById(
        "appointmentDateTime"
      ).value;
      const status = document.getElementById("appointmentStatus").value;
      const remarks = document.getElementById("appointmentRemarks").value;

      if (!appointmentId || !localScheduledDateTime) {
        alert("Please provide all required fields.");
        return;
      }

      // Convert local time input back to UTC before saving
      const utcDateTime = convertLocalToUtc(localScheduledDateTime);

      fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: doctorId,
          scheduleddatetime: utcDateTime,
          status: status,
          remarks: remarks,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Appointment updated successfully") {
            alert("Appointment updated successfully!");
            $("#editAppointmentModal").modal("hide");
            location.reload(); // Refresh page to see changes
          } else {
            throw new Error(data.message || "Update failed");
          }
        })
        .catch((error) => {
          console.error("Error updating appointment:", error);
          alert("Error updating appointment. Please try again.");
        });
    });

  // Convert local datetime input back to UTC correctly before saving
  function convertLocalToUtc(localDateTime) {
    if (!localDateTime) return "";

    const localDate = new Date(localDateTime);
    return new Date(
      localDate.getTime() - localDate.getTimezoneOffset() * 60000
    ).toISOString();
  }

  loadDoctors();
});
