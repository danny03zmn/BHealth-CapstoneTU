document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("addtime");
    const addTimeSlotButton = document.getElementById('addTimeSlotButton');
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.addEventListener("click", function(event) {
        event.preventDefault();

        let isValid = true;
        let messages = [];

        // Validate required text inputs
        const requiredTextInputs = form.querySelectorAll('input[type="text"][required], input[type="email"][required], select[required]');
        requiredTextInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                messages.push(`${input.previousElementSibling.innerText} is required.`);
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        });

        // Validate Slot Time
        const slotTime = document.getElementById("slot_time").value;
        if (slotTime === "0" || slotTime === "") {
            isValid = false;
            messages.push("Slots Time (In Minute) must be selected and greater than 0.");
            document.getElementById("slot_time").classList.add('is-invalid');
        } else {
            document.getElementById("slot_time").classList.remove('is-invalid');
        }

        // Validate Doctor available days
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        const isChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
        if (!isChecked) {
            isValid = false;
            messages.push("At least one Doctor available day must be selected.");
            checkboxes.forEach(checkbox => checkbox.classList.add('is-invalid'));
        } else {
            checkboxes.forEach(checkbox => checkbox.classList.remove('is-invalid'));
        }

        // Validate Time Slots
        const timeSlots = document.querySelectorAll('#timeSlotsContainer .time-slot');
        timeSlots.forEach(slot => {
            const fromTime = slot.querySelector('[name^="from"]').value;
            const toTime = slot.querySelector('[name^="to"]').value;
            if (!fromTime || !toTime || fromTime >= toTime) {
                isValid = false;
                if (!fromTime || !toTime) messages.push("Both From and To times must be set for each time slot.");
                if (fromTime >= toTime) messages.push("From time must be before To time for each time slot.");
                slot.querySelectorAll('input').forEach(input => input.classList.add('is-invalid'));
            } else {
                slot.querySelectorAll('input').forEach(input => input.classList.remove('is-invalid'));
            }
        });

        if (isValid) {
            form.submit();
        } else {
            alert(messages.join("\n"));
        }
    });
        // Function to add a new time slot
        function addTimeSlot() {
            const slotIndex = timeSlotsContainer.children.length;
            const slotHtml = `
                <div class="time-slot" data-index="${slotIndex}" style="margin-bottom: 10px">
                    <label class="label-control">From:</label>
                    <input type="time" name="from[${slotIndex}]" class="from-time" placeholder="From time">
                    <label class="label-control">To:</label>
                    <input type="time" name="to[${slotIndex}]" class="to-time" placeholder="To time">
                    <button type="button" class="btn btn-danger remove-time-slot">Remove</button>
                </div>
            `;
            timeSlotsContainer.insertAdjacentHTML('beforeend', slotHtml);
            
            // Add remove functionality to the newly added slot
            const removeButton = timeSlotsContainer.querySelector(`[data-index="${slotIndex}"] .remove-time-slot`);
            removeButton.addEventListener('click', function() {
                this.parentElement.remove();
            });
        }
    
        // Initially, add one slot
        addTimeSlot();
    
        // Listen for clicks on the "Add Time Slot" button
        document.getElementById('addTimeSlotButton').addEventListener('click', function(event) {
            event.preventDefault();
            addTimeSlot();
        });

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const availableTimes = [];
        const availableDays = [];
        ["sun", "mon", "tue", "wen", "thu", "fri", "sat"].forEach(day => {
            if(formData.get(day) === "1") {
                availableDays.push(day);
            }
        });

        document.querySelectorAll('.time-slot').forEach(slot => {
            const from = slot.querySelector('.from-time').value;
            const to = slot.querySelector('.to-time').value;
            if (from && to) {
                availableTimes.push({ from, to });
            }
        });

        // Fetch the hospitalId from the server first
        fetch("/api/getHospitalId")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Hospital ID not found');
                }
                return response.json();
            })
            .then(data => {
                const doctorData = {
                    firstName: formData.get("first_name"),
                    lastName: formData.get("last_name"),
                    contactNumber: formData.get("mobile"),
                    email: formData.get("email"),
                    department: formData.get("department"),
                    slotTime: parseInt(formData.get("slot_time"), 10),
                    availableTimes: availableTimes,
                    availableDays: availableDays,
                    hospitalId: data.hospitalId
                };

                // Then, send the data including hospitalId to your server
                return fetch("/api/doctors", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(doctorData),
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log("Doctor added successfully:", data);

            })
            .catch(error => {
                console.error("Error adding doctor or fetching hospital ID:", error);

            });
    });
});
