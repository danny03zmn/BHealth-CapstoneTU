let currentPage = 1;
let totalEntries = 0;

// Function to format date to "2 Jan 2003, 4:15:50 AM"
function formatDateTime(isoString) {
  if (!isoString) return "N/A"; // Handle empty dates

  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short", // "Jan" instead of "January"
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function updatePatientTable(page = 1) {
  const limit = document.getElementById("entriesSelector").value;
  const query = document.getElementById("searchField").value;

  fetch(
    `/api/patients?search=${encodeURIComponent(
      query
    )}&limit=${limit}&page=${page}`
  )
    .then((response) => response.json())
    .then(({ patients, total }) => {
      totalEntries = total;
      const patientTableBody = document.querySelector("#patientList tbody");
      patientTableBody.innerHTML = "";

      if (patients.length === 0) {
        patientTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No records found</td></tr>`;
      } else {
        patients.forEach((patient) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                      <td>${patient.id}</td>
                      <td>${patient.patientName}</td>
                      <td>${patient.contactNumber}</td>
                      <td>${formatDateTime(patient.lastVisit)}</td>
                      <td>
                          <button type="button" class="btn btn-primary btn-sm edit-patient-btn" 
                                  data-id="${patient.id}" 
                                  data-name="${patient.patientName}" 
                                  data-contact="${patient.contactNumber}" 
                                  data-lastvisit="${patient.lastVisit || ""}">
                              Edit
                          </button>
                          <button type="button" class="btn btn-danger btn-sm delete-patient-btn" 
                                  data-id="${patient.id}">
                              Delete
                          </button>
                      </td>
                  `;
          patientTableBody.appendChild(row);
        });
      }
      updatePagination(page, limit, totalEntries);
    })
    .catch((error) => console.error("Error fetching patient data:", error));
}

function updatePagination(current, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const start = (current - 1) * limit + 1;
  const end = Math.min(current * limit, total);
  document.getElementById("tableInfo").textContent =
    total > 0
      ? `Showing ${start} to ${end} of ${total} entries`
      : "No records available";

  const pagination = document.querySelector("#patientList_paginate ul");
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
        const pageText = link.textContent.trim();
        let newPage = current;

        if (pageText === "First") newPage = 1;
        else if (pageText === "Previous") newPage = current - 1;
        else if (pageText === "Next") newPage = current + 1;
        else if (pageText === "Last") newPage = totalPages;
        else newPage = parseInt(pageText, 10);

        if (newPage !== current) {
          currentPage = newPage;
          updatePatientTable(newPage);
        }
      });
    });
}

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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("entriesSelector").addEventListener("change", () => {
    currentPage = 1;
    updatePatientTable(currentPage);
  });

  document.getElementById("searchField").addEventListener("input", () => {
    currentPage = 1;
    updatePatientTable(currentPage);
  });

  updatePatientTable(currentPage);

  // Open Edit Modal with Pre-filled Data
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("edit-patient-btn")) {
      const patientId = event.target.getAttribute("data-id");
      const patientName = event.target.getAttribute("data-name");
      const patientContactNum = event.target.getAttribute("data-contact");
      const lastVisitRaw = event.target.getAttribute("data-lastvisit");

      document.getElementById("patientId").value = patientId;
      document.getElementById("patientName").value = patientName;
      document.getElementById("patientContactNum").value = patientContactNum;

      // Format and display Last Visit in "2 Jan 2003, 4:15:50 AM" format
      document.getElementById("lastVisit").value = formatDateTime(lastVisitRaw);

      $("#editPatientModal").modal("show");
    }
  });

  // Handle Form Submission for Patient Update
  document
    .getElementById("editPatientForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const patientId = document.getElementById("patientId").value;
      const updatedPatient = {
        patientName: document.getElementById("patientName").value,
        patientContactNum: document.getElementById("patientContactNum").value,
      };

      if (!confirm("Are you sure you want to edit this patient?")) {
        return;
      }

      fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPatient),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Patient updated successfully") {
            showNotification(
              "Patient details updated successfully!",
              "success"
            );
            $("#editPatientModal").modal("hide");
            updatePatientTable(currentPage); // Refresh the table
          } else {
            throw new Error(data.message || "Update failed");
          }
        })
        .catch((error) => {
          console.error("Error updating patient:", error);
          showNotification(
            "Error updating patient. Please try again.",
            "danger"
          );
        });
    });

  // Handle Delete Patient
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-patient-btn")) {
      const patientId = event.target.getAttribute("data-id");

      if (
        !confirm(
          "Are you sure you want to delete this patient? This action cannot be undone."
        )
      ) {
        return;
      }

      fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Patient deleted successfully") {
            showNotification("Patient deleted successfully!", "success");
            updatePatientTable(currentPage); // Refresh table
          } else {
            throw new Error(data.message || "Deletion failed");
          }
        })
        .catch((error) => {
          console.error("Error deleting patient:", error);
          showNotification(
            "Error deleting patient. Please try again.",
            "danger"
          );
        });
    }
  });
});
