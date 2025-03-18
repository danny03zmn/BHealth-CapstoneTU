let currentPage = 1;
let defaultEntries = 5;
let totalEntries = 0;

async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    window.location.href = "/login.html";
  }
}

fetchData("/api/doctors");

function updateDoctorTable(page = 1) {
  const limit =
    parseInt(document.getElementById("entriesSelector").value, 10) || 5;
  const query = document.getElementById("searchField").value;

  fetch(
    `/api/doctors?search=${encodeURIComponent(
      query
    )}&limit=${limit}&page=${page}`
  )
    .then((response) => response.json())
    .then(({ doctors, total }) => {
      totalEntries = total; // Ensure total entries is updated correctly
      const doctorTableBody = document.querySelector("#doctorList tbody");
      doctorTableBody.innerHTML = "";

      if (doctors.length === 0) {
        doctorTableBody.innerHTML = `<tr><td colspan="8" class="text-center">No records found</td></tr>`;
      } else {
        doctors.forEach((doctor) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                      <td>${doctor.doctorName}</td>
                      <td>${doctor.docContactNum}</td>
                      <td>${doctor.docEmail}</td>
                      <td>${doctor.clinicName || "N/A"}</td>
                      <td>${doctor.countPending || 0}</td>
                      <td>${doctor.countConfirmed || 0}</td>
                      <td>${doctor.countCompleted || 0}</td>
                      <td>
                          <button type="button" class="btn btn-primary btn-sm edit-doctor-btn" 
                                  data-id="${doctor.id}" 
                                  data-name="${doctor.doctorName}" 
                                  data-contact="${doctor.docContactNum}" 
                                  data-email="${doctor.docEmail}" 
                                  data-clinic-id="${doctor.clinicId}" 
                                  data-pending="${doctor.countPending}" 
                                  data-confirmed="${doctor.countConfirmed}" 
                                  data-completed="${doctor.countCompleted}">
                              Edit
                          </button>
                          <button type="button" class="btn btn-danger btn-sm delete-doctor-btn" 
                                  data-id="${doctor.id}">
                              Delete
                          </button>
                      </td>
                  `;
          doctorTableBody.appendChild(row);
        });
      }

      updatePagination(page, limit, totalEntries);
    })
    .catch((error) => console.error("Error fetching doctor data:", error));
}

function updatePagination(current, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const start = (current - 1) * limit + 1;
  const end = Math.min(current * limit, total);

  document.getElementById("tableInfo").textContent =
    total > 0
      ? `Showing ${start} to ${end} of ${total} entries`
      : "No records available";

  const pagination = document.querySelector("#doctorList_paginate ul");
  pagination.innerHTML = `
      <li class="paginate_button page-item first ${
        current === 1 ? "disabled" : ""
      }">
          <a href="#" class="page-link">First</a>
      </li>
      <li class="paginate_button page-item previous ${
        current === 1 ? "disabled" : ""
      }">
          <a href="#" class="page-link">Previous</a>
      </li>
  `;

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
          <li class="paginate_button page-item ${
            i === current ? "active" : ""
          }">
              <a href="#" class="page-link">${i}</a>
          </li>
      `;
  }

  pagination.innerHTML += `
      <li class="paginate_button page-item next ${
        current === totalPages ? "disabled" : ""
      }">
          <a href="#" class="page-link">Next</a>
      </li>
      <li class="paginate_button page-item last ${
        current === totalPages ? "disabled" : ""
      }">
          <a href="#" class="page-link">Last</a>
      </li>
  `;

  pagination
    .querySelectorAll(".page-item:not(.disabled) .page-link")
    .forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        let newPage = current;

        if (link.textContent.trim() === "First") newPage = 1;
        else if (link.textContent.trim() === "Previous") newPage = current - 1;
        else if (link.textContent.trim() === "Next") newPage = current + 1;
        else if (link.textContent.trim() === "Last") newPage = totalPages;
        else newPage = parseInt(link.textContent.trim(), 10);

        if (newPage !== current) {
          currentPage = newPage;
          updateDoctorTable(newPage);
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const entriesSelector = document.getElementById("entriesSelector");
  const searchField = document.getElementById("searchField");

  entriesSelector.addEventListener("change", () => {
    currentPage = 1; // Reset page number to 1
    updateDoctorTable(currentPage); // Reload table with new limit
  });

  searchField.addEventListener("input", () => {
    currentPage = 1;
    updateDoctorTable(currentPage);
  });

  updateDoctorTable(currentPage);

  // Function to Show Notification
  function showNotification(message, type) {
    const notificationBox = document.getElementById("notificationBox");
    notificationBox.innerHTML = message;
    notificationBox.className = `alert alert-${type} alert-dismissible fade show`;
    notificationBox.style.display = "block";

    setTimeout(() => {
      notificationBox.style.display = "none";
    }, 3000);
  }

  // Function to load clinics and pre-select the correct clinic
  function loadClinics(selectedClinicId) {
    fetch("/api/clinics")
      .then((response) => response.json())
      .then(({ clinics }) => {
        const clinicDropdown = document.getElementById("clinicId");
        clinicDropdown.innerHTML = ""; // Clear existing options

        clinics.forEach((clinic) => {
          const option = document.createElement("option");
          option.value = clinic.id;
          option.textContent = clinic.clinicName;
          clinicDropdown.appendChild(option);
        });

        if (selectedClinicId) {
          clinicDropdown.value = selectedClinicId; // Pre-select the correct clinic
        }

        $(".select2").select2(); // Apply Select2 for searchability
      })
      .catch((error) => console.error("Error fetching clinics:", error));
  }

  document.addEventListener("click", (event) => {
    // Open Edit Modal with Existing Data
    if (event.target.closest(".edit-doctor-btn")) {
      const button = event.target.closest(".edit-doctor-btn");

      document.getElementById("doctorId").value =
        button.getAttribute("data-id");
      document.getElementById("doctorName").value =
        button.getAttribute("data-name");
      document.getElementById("docContactNum").value =
        button.getAttribute("data-contact");
      document.getElementById("docEmail").value =
        button.getAttribute("data-email");
      document.getElementById("countPending").value =
        button.getAttribute("data-pending");
      document.getElementById("countConfirmed").value =
        button.getAttribute("data-confirmed");
      document.getElementById("countCompleted").value =
        button.getAttribute("data-completed");

      const selectedClinicId = button.getAttribute("data-clinic-id");
      loadClinics(selectedClinicId); // Load clinics and set the current selection

      $("#editDoctorModal").modal("show");
    }

    // Handle Delete Doctor
    if (event.target.classList.contains("delete-doctor-btn")) {
      const doctorId = event.target.getAttribute("data-id");

      if (
        !confirm(
          "Are you sure you want to delete this doctor? This action cannot be undone."
        )
      ) {
        return;
      }

      fetch(`/api/doctors/${doctorId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Doctor deleted successfully") {
            showNotification("Doctor deleted successfully!", "success");
            updateDoctorTable(currentPage); // Refresh table
          } else {
            throw new Error(data.message || "Deletion failed");
          }
        })
        .catch((error) => {
          console.error("Error deleting doctor:", error);
          showNotification(
            "Error deleting doctor. Please try again.",
            "danger"
          );
        });
    }
  });

  // Handle Form Submission for Update
  document
    .getElementById("editDoctorForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const doctorId = document.getElementById("doctorId").value;
      const updatedDoctor = {
        doctorName: document.getElementById("doctorName").value,
        docContactNum: document.getElementById("docContactNum").value,
        docEmail: document.getElementById("docEmail").value,
        clinicId: document.getElementById("clinicId").value,
      };

      if (!confirm("Are you sure you want to edit this doctor?")) return;

      fetch(`/api/doctors/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDoctor),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Doctor updated successfully") {
            showNotification("Doctor details updated!", "success");
            $("#editDoctorModal").modal("hide");
            updateDoctorTable(currentPage);
          } else {
            throw new Error(data.message || "Update failed");
          }
        })
        .catch((error) => {
          showNotification("Error updating doctor.", "danger");
        });
    });
});
