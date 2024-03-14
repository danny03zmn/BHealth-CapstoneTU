document.addEventListener('DOMContentLoaded', function() {
    const appointmentList = document.getElementById('appointmentList');

    function fetchAppointments() {
        fetch('/appointments')
            .then(response => response.json())
            .then(data => renderAppointments(data))
            .catch(error => console.error('Error fetching appointments:', error));
    }

    // Function to render appointments
    function renderAppointments(appointments) {
        const rows = appointments.map((appointment, index) => {
            return `<tr>
                        <td>${index + 1}</td>
                        <td>${appointment.assignedDoctor}</td>
                        <td>${appointment.patientName}</td>
                        <td>${appointment.phoneNumber}</td>
                        <td>${new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                        <td>${appointment.timeslot}</td>
                        <td>
                            <button type="button" class="btn btn-danger cancel" data-id="${appointment._id}">Cancel</button>
                            <button type="button" class="btn btn-success confirm" data-id="${appointment._id}">Confirm</button>
                        </td>
                    </tr>`;
        }).join('');
    
        appointmentList.innerHTML = rows;
        attachEventListeners();
    }
    
    function attachEventListeners() {
        document.querySelectorAll('.cancel').forEach(button => {
            button.addEventListener('click', function() {
                updateAppointmentStatus(this.getAttribute('data-id'), 'cancel');
            });
        });
    
        document.querySelectorAll('.confirm').forEach(button => {
            button.addEventListener('click', function() {
                updateAppointmentStatus(this.getAttribute('data-id'), 'confirm');
            });
        });
    }
    
    function updateAppointmentStatus(appointmentId, action) {
        const endpoint = `/appointments/${action}`; // This will be either '/appointments/cancel' or '/appointments/confirm'
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            fetchAppointments(); // Refresh the list of appointments
        })
        .catch(error => console.error('Error updating appointment status:', error));
    }


    fetchAppointments();
});
