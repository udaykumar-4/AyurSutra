// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    const bookingForm = document.getElementById('booking-form');
    const formMessage = document.getElementById('form-message');

    // Add submit event listener to the form
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the form from submitting normally

        // Get form data
        const formData = new FormData(bookingForm);
        const data = {
            patientName: formData.get('patientName'),
            patientEmail: formData.get('patientEmail'),
            patientPhone: formData.get('patientPhone'),
            service: formData.get('service'),
            appointmentDate: formData.get('appointmentDate'),
            comments: formData.get('comments')
        };

        // --- Send data to the backend ---
        try {
            // We are sending a POST request to our backend API
            const response = await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // Success
                const result = await response.json();
                console.log('Appointment booked:', result);
                formMessage.textContent = 'Appointment booked successfully!';
                formMessage.style.color = 'green';
                bookingForm.reset(); // Clear the form
            } else {
                // Server-side error
                const error = await response.json();
                formMessage.textContent = `Error: ${error.error}`;
                formMessage.style.color = 'red';
            }
        } catch (error) {
            // Network or other error
            console.error('Error submitting form:', error);
            formMessage.textContent = 'A network error occurred. Please try again.';
            formMessage.style.color = 'red';
        }
    });
});