document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".edit-clinic-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const clinicId = this.getAttribute("data-id");

      document.getElementById("clinicName").value =
        this.getAttribute("data-name");
      document.getElementById("clinicContact").value =
        this.getAttribute("data-contact");
      document.getElementById("clinicLocation").value =
        this.getAttribute("data-location");
      document.getElementById("clinicDoctors").value =
        this.getAttribute("data-doctors");

      document
        .getElementById("editClinicForm")
        .setAttribute("data-id", clinicId);
      $("#editClinicModal").modal("show");
    });
  });

  document
    .getElementById("editClinicForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const clinicId = this.getAttribute("data-id");

      const updatedClinic = {
        clinicName: document.getElementById("clinicName").value,
        clinicContact: document.getElementById("clinicContact").value,
        clinicLocation: document.getElementById("clinicLocation").value,
      };

      fetch(`/api/clinics/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedClinic),
      })
        .then((response) => response.json())
        .then((data) => {
          alert(data.message);
          location.reload();
        })
        .catch((error) => console.error("Error updating clinic:", error));
    });
});
