document.addEventListener('DOMContentLoaded', function() {
    const appointmentList = document.getElementById('appointmentList'); // Assure this ID aligns with your HTML

    function fetchAppointments() {
        fetch('/appointments/cancelled')
            .then(response => response.json())
            .then(data => renderAppointments(data))
            .catch(error => console.error('Error fetching cancelled appointments:', error));
    }

    function renderAppointments(appointments) {
        const rows = appointments.map((appointment, index) => {
            return `<tr>
                        <td>${index + 1}</td>
                        <td>${appointment.assignedDoctor}</td>
                        <td>${appointment.patientName}</td>
                        <td>${appointment.phoneNumber}</td>
                        <td>${new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                        <td>${appointment.timeslot}</td>
                    </tr>`;
        }).join('');
    
        appointmentList.innerHTML = rows;
    }

    fetchAppointments();
});
