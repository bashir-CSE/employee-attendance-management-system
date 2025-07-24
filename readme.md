# Employee Attendance Management System

This web-based application, built with Google Apps Script, provides a comprehensive solution for managing employee attendance. It features a user-friendly interface for employees to register, log in, and record their daily attendance, including check-in, check-out, and absences. The system also includes an admin dashboard for monitoring attendance records and managing employee data.

## Features

- **User Authentication:** Secure registration and login for employees.
- **Attendance Tracking:** Employees can mark their attendance, which is recorded in a Google Sheet.
- **Admin Dashboard:** A centralized view for administrators to oversee attendance records.
- **Data Management:** Utilizes Google Sheets as a database for storing user and attendance information.
- **Responsive Design:** The user interface is designed to be accessible on various devices.

## Technologies Used

- **Google Apps Script:** Backend logic and server-side operations.
- **HTML/CSS/JavaScript:** Frontend user interface and client-side interactions.
- **Bootstrap:** For responsive design and UI components.
- **Google Sheets:** As the database for storing all application data.

## Setup and Configuration

To set up the system, follow these steps:

1. **Google Sheet Setup:**
   - Create a new Google Sheet.
   - Rename the sheet to be used as the database.
   - Add separate sheets for `Users` and `Attendance`.

2. **Script Configuration:**
   - Open the Google Apps Script editor.
   - In `Code.gs`, update the `SHEET_ID` variable with your Google Sheet's ID.

3. **Deployment:**
   - Deploy the script as a web app.
   - Set the access permissions to "Anyone, even anonymous."

## How to Use

- **Registration:** New users can register with their employee details.
- **Login:** Registered users can log in using their credentials.
- **Attendance:** Once logged in, users can mark their attendance for the day.
- **Admin View:** Administrators can access the Google Sheet to view and manage attendance records.
