document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ JavaScript Loaded: appointments-main.js");

  const appointmentTabs = document.querySelectorAll(
    "#appointmentTabs .nav-link"
  );
  const appointmentTableBody = document.querySelector("#appointmentList tbody");
  let currentTab = "today";
  let sortColumn = "id";
  let sortOrder = "asc";
  let currentPage = 1;
  let entriesPerPage = 5;
  let searchQuery = "";
  let isSorting = false;

  function fetchAppointments(status) {
    console.log(`🔄 Fetching appointments for status: ${status}`);

    return fetch(
      `/api/appointments?status=${status}&sort=${sortColumn}&order=${sortOrder}&limit=${entriesPerPage}&page=${currentPage}&search=${searchQuery}`
    )
      .then((response) => response.json())
      .then((data) => {
        console.log("✅ API Response Data:", data);

        if (!data.appointments || data.appointments.length === 0) {
          console.warn("⚠ No appointments received.");
        }

        populateTable(data.appointments);
        updatePagination(data.total);
        updateEntriesInfo(data.total);
      })
      .catch((error) =>
        console.error("❌ Error fetching appointments:", error)
      );
  }

  function populateTable(appointments) {
    console.log("🔄 Populating Table with Appointments:", appointments);

    const tableBody = document.querySelector("#appointmentList tbody");
    tableBody.innerHTML = "";

    if (!appointments || appointments.length === 0) {
      console.warn("⚠ populateTable received empty data.");
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No records found</td></tr>`;
      return;
    }

    appointments.forEach((appointment) => {
      console.log("🔹 Processing Appointment:", appointment);

      // ✅ Convert timestamp to a readable format (MM/DD/YYYY, h:mm:ss A)
      const storedTimestamp = appointment.scheduleddatetime; // Already correct from DB
      const dateObj = new Date(storedTimestamp.replace(" ", "T")); // Ensure correct parsing
      const formattedDate = dateObj.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${appointment.id}</td>
        <td>${appointment.doctorName || "Unknown"}</td>
        <td>${appointment.docContactNum || "N/A"}</td>
        <td>${appointment.patientName || "Unknown"}</td>
        <td>${appointment.patContactNum || "N/A"}</td>
        <td>${formattedDate}</td>
        <td>${appointment.remarks || ""}</td>
        <td>
          <button class="btn btn-primary btn-sm edit-btn" data-id="${
            appointment.id
          }">Edit</button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    console.log("✅ Table populated successfully.");
    attachSortingListeners();
  }

  function attachSortingListeners() {
    document.querySelectorAll(".sortable").forEach((header) => {
      header.style.cursor = "pointer";

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

    document.querySelectorAll(".sort-arrow").forEach((arrow) => {
      arrow.innerHTML = "";
    });

    const arrow = event.currentTarget.querySelector(".sort-arrow");
    if (arrow) {
      arrow.innerHTML = sortOrder === "asc" ? "&#9650;" : "&#9660;";
    }

    fetchAppointments(currentTab).then(() => {
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
      }">
        <a class="page-link" href="#" data-page="${
          currentPage - 1
        }">Prev</a></li>`;

      for (let i = 1; i <= totalPages; i++) {
        paginationControls.innerHTML += `<li class="page-item ${
          i === currentPage ? "active" : ""
        }">
          <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }

      paginationControls.innerHTML += `<li class="page-item ${
        currentPage === totalPages ? "disabled" : ""
      }">
        <a class="page-link" href="#" data-page="${
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

        if (appointment.scheduleddatetime) {
          console.log(
            "✅ Received appointment datetime:",
            appointment.scheduleddatetime
          );
          document.querySelector("#appointmentDateTime").value =
            appointment.scheduleddatetime; // Use directly
        }

        document.querySelector("#appointmentStatus").value = appointment.status;
        document.querySelector("#appointmentRemarks").value =
          appointment.remarks || "";
        $("#editAppointmentModal").modal("show");
      })
      .catch((error) =>
        console.error("❌ Error fetching appointment details:", error)
      );
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
      ).value; // Use directly

      const status = document.getElementById("appointmentStatus").value;
      const remarks = document.getElementById("appointmentRemarks").value;

      if (!appointmentId || !localScheduledDateTime) {
        alert("Please provide all required fields.");
        return;
      }

      fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId,
          scheduleddatetime: localScheduledDateTime, // ✅ Save exactly as entered
          status,
          remarks,
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

  loadDoctors();
});
