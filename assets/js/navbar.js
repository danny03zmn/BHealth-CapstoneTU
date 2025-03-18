document.addEventListener("DOMContentLoaded", function () {
  fetch("navbar.html")
      .then((response) => response.text())
      .then((data) => {
          document.getElementById("navbar-placeholder").innerHTML = data;
          initializeNavbar();
      })
      .catch((error) => console.error("Error loading the navbar:", error));
});

function initializeNavbar() {
  fetch('/config')
      .then(response => response.json())
      .then(config => {
          const client = new Appwrite.Client()
              .setEndpoint(config.APPWRITE_ENDPOINT)
              .setProject(config.APPWRITE_PROJECT_ID);

          const account = new Appwrite.Account(client);

          // ✅ Check if user is authenticated
          account.get()
              .then(user => {
                  document.getElementById('userName').innerText = user.name;
              })
              .catch(() => {
                  window.location.href = "/login.html";
              });

          // ✅ Logout Handling
          const logoutButton = document.querySelector("#navbar-placeholder #logoutBtn");
          if (logoutButton) {
              logoutButton.addEventListener("click", function () {
                  account.deleteSession('current')
                      .then(() => {
                          fetch('/logout', {
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json'
                              },
                              credentials: 'include',
                          }).then(response => response.json())
                              .then(data => {
                                  if (data.redirect) {
                                      window.location.href = data.redirect;
                                  }
                              });
                      })
                      .catch(error => console.error('Logout Error:', error));
              });
          }
      })
      .catch(error => console.error('Failed to load Appwrite configuration:', error));
}
