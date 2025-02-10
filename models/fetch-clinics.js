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
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      return response.json();
    })
    .then(({ clinics, total }) => {
      totalEntries = total;

      const clinicTableBody = document.querySelector("#clinicList");
      clinicTableBody.innerHTML = "";

      if (clinics.length === 0) {
        clinicTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No records found</td></tr>`;
      } else {
        clinics.forEach((clinic, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                        <td>${(page - 1) * limit + index + 1}</td>
                        <td>${clinic.clinicname}</td>
                        <td>${clinic.cliniccontactnum}</td>
                        <td>${clinic.location}</td>
                        <td>${clinic.countdoctors}</td>
                        <td>
                            <a href="/clinic-change.html?id=${
                              clinic.id
                            }" class="btn btn-primary btn-sm">Edit</a>
                            <button class="btn btn-danger btn-sm" onclick="deleteClinic(${
                              clinic.id
                            })">Delete</button>
                        </td>
                    `;
          clinicTableBody.appendChild(row);
        });
      }

      updatePagination(page, limit, totalEntries);
    })
    .catch((error) => {
      console.error("Error fetching clinic data:", error);
      alert("Failed to load clinic data");
    });
}

function updatePagination(current, limit, total) {
  const totalPages = Math.ceil(total / limit);

  const start = (current - 1) * limit + 1;
  const end = Math.min(current * limit, total);
  document.getElementById(
    "tableInfo"
  ).textContent = `Showing ${start} to ${end} of ${total} entries`;

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
});
