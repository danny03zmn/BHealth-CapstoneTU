let currentPage = 1;
let totalEntries = 0;

function updateClinicTable(page = 1) {
  const limit = document.getElementById("entriesSelector").value;
  const query = document.getElementById("searchField").value;

  fetch(
    `/api/clinics?search=${encodeURIComponent(
      query
    )}&limit=${limit}&page=${page}`
  )
    .then((response) => response.json())
    .then(({ clinics, total }) => {
      totalEntries = total;
      const clinicTableBody = document.querySelector("#clinicList tbody");
      clinicTableBody.innerHTML = "";

      if (clinics.length === 0) {
        clinicTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No records found</td></tr>`;
      } else {
        clinics.forEach((clinic) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${clinic.clinicName}</td>
            <td>${clinic.clinicContactNum}</td>
            <td>${clinic.location}</td>
            <td>${clinic.countDoctors}</td>
            <td>
  <button type="button" class="btn btn-primary btn-sm edit-clinic-btn" 
          data-id="${clinic.id}" 
          data-name="${clinic.clinicName}" 
          data-contact="${clinic.clinicContactNum}" 
          data-location="${clinic.location}" 
          data-doctors="${clinic.countDoctors}">
    Edit
  </button>
</td>
          `;
          clinicTableBody.appendChild(row);
        });
      }
      updatePagination(page, limit, totalEntries);
    })
    .catch((error) => console.error("Error fetching clinic data:", error));
}

function updatePagination(current, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const start = (current - 1) * limit + 1;
  const end = Math.min(current * limit, total);
  document.getElementById("tableInfo").textContent =
    total > 0
      ? `Showing ${start} to ${end} of ${total} entries`
      : "No records available";

  const pagination = document.querySelector("#clinicList_paginate ul");
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
    ${Array.from({ length: totalPages }, (_, i) => {
      const page = i + 1;
      return `
        <li class="paginate_button page-item ${
          page === current ? "active" : ""
        }">
          <a href="#" class="page-link">${page}</a>
        </li>
      `;
    }).join("")}
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
          updateClinicTable(newPage);
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("entriesSelector").addEventListener("change", () => {
    currentPage = 1;
    updateClinicTable(currentPage);
  });

  document.getElementById("searchField").addEventListener("input", () => {
    currentPage = 1;
    updateClinicTable(currentPage);
  });

  updateClinicTable(currentPage);

  // Open Modal with Existing Data
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("edit-clinic-btn")) {
      const clinicId = event.target.getAttribute("data-id");
      const clinicName = event.target.getAttribute("data-name");
      const clinicContactNum = event.target.getAttribute("data-contact");
      const location = event.target.getAttribute("data-location");
      const countDoctors = event.target.getAttribute("data-doctors");

      document.getElementById("clinicId").value = clinicId;
      document.getElementById("clinicName").value = clinicName;
      document.getElementById("clinicContactNum").value = clinicContactNum;
      document.getElementById("location").value = location;
      document.getElementById("countDoctors").value = countDoctors; // Set value but keep disabled

      $("#editClinicModal").modal("show");
    }
  });

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

  // Handle Form Submission for Update
  document
    .getElementById("editClinicForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const clinicId = document.getElementById("clinicId").value;
      const updatedClinic = {
        clinicName: document.getElementById("clinicName").value,
        clinicContactNum: document.getElementById("clinicContactNum").value,
        location: document.getElementById("location").value,
        countDoctors: parseInt(
          document.getElementById("countDoctors").value,
          10
        ), // Not editable but still needed for update
      };

      // Show Confirmation Dialog
      if (!confirm("Are you sure you want to edit this clinic?")) {
        return; // Cancel update if user clicks "No"
      }

      fetch(`/api/clinics/${clinicId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedClinic),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Clinic updated successfully") {
            showNotification("Clinic details updated successfully!", "success");
            $("#editClinicModal").modal("hide");
            updateClinicTable(currentPage); // Refresh table
          } else {
            throw new Error(data.message || "Update failed");
          }
        })
        .catch((error) => {
          console.error("Error updating clinic:", error);
          showNotification(
            "Error updating clinic. Please try again.",
            "danger"
          );
        });
    });
});
