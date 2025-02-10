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

document
  .getElementById("addClinicForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const clinicName = document.getElementById("clinicName").value.trim();
    const clinicContactNum = document
      .getElementById("clinicContactNum")
      .value.trim();
    const location = document.getElementById("location").value.trim();

    if (!clinicName || !clinicContactNum || !location) {
      showNotification("All fields are required!", "danger");
      return;
    }

    if (!confirm("Are you sure you want to add this clinic?")) {
      return;
    }

    fetch("/api/clinics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clinicName, clinicContactNum, location }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Clinic added successfully") {
          showNotification("Clinic added successfully!", "success");

          setTimeout(() => {
            window.location.href = "clinics.html"; // Redirect after success
          }, 1500);
        } else {
          throw new Error(data.message || "Failed to add clinic");
        }
      })
      .catch((error) => {
        console.error("Error adding clinic:", error);
        showNotification("Error adding clinic. Please try again.", "danger");
      });
  });
