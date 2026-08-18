document.addEventListener('DOMContentLoaded', () => {
    const appointmentsList = document.getElementById('appointments-list');

    // Function to fetch and display appointments
    const fetchAppointments = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/appointments');
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const appointments = await response.json();

            // Clear the "Loading..." message
            appointmentsList.innerHTML = '';

            if (appointments.length === 0) {
                appointmentsList.innerHTML = '<p>No appointments found.</p>';
                return;
            }

            // Create a table to display the appointments
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Patient Name</th>
                        <th>Email</th>
                        <th>Service</th>
                        <th>Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;
            const tbody = table.querySelector('tbody');

            // Populate the table with data
            appointments.forEach(app => {
                const row = document.createElement('tr');
                
                // Format the date to be more readable
                const date = new Date(app.appointmentDate).toLocaleDateString();

                row.innerHTML = `
                    <td>${app.patientName}</td>
                    <td>${app.patientEmail}</td>
                    <td>${app.service}</td>
                    <td>${date}</td>
                    <td><button class="btn-delete" data-id="${app._id}">Delete</button></td>
                `;
                tbody.appendChild(row);
            });

            appointmentsList.appendChild(table);

            // Add event listeners to all delete buttons
            document.querySelectorAll('.btn-delete').forEach(button => {
                button.addEventListener('click', deleteAppointment);
            });

        } catch (error) {
            appointmentsList.innerHTML = `<p style="color: red;">Error loading appointments: ${error.message}</p>`;
            console.error('Error fetching appointments:', error);
        }
    };

    // Function to handle deleting an appointment
    const deleteAppointment = async (e) => {
        const id = e.target.dataset.id;
        
        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // If deletion is successful, refresh the list
                fetchAppointments();
            } else {
                const error = await response.json();
                alert(`Error deleting: ${error.error}`);
            }
        } catch (error) {
            alert(`A network error occurred: ${error.message}`);
        }
    };

    // Initial fetch of appointments when the page loads
    fetchAppointments();
});