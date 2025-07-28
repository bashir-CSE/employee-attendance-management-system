# Employee Attendance Management System

This is a web-based employee attendance management system built with Google Apps Script. It allows employees to register, log in, and record their attendance (check-in, check-out, or absent) using a simple web interface. The system uses a Google Sheet as a database and includes features like geofencing to ensure employees are within a specified radius of the office when they check in or out.

## Features

- **User Authentication:** Employees can register with their MGT-ID, name, email, and a 4-digit password. The system validates user credentials for login.
- **Password Management:** Users can reset their password if they forget it.
- **Attendance Tracking:** Employees can check in, check out, or mark themselves as absent for the day.
- **Geofencing:** The system verifies the employee's location using their browser's geolocation API and ensures they are within a predefined radius of the office before allowing them to check in or out.
- **Session Management:** The system automatically logs out users after a period of inactivity.
- **Dynamic UI:** The user interface is built with HTML, CSS, and JavaScript, and it dynamically updates based on the user's attendance status.
- **Google Sheets Integration:** The application uses a Google Sheet to store user data and attendance records.

## How It Works

### Backend (`Code.gs`)

The backend is a Google Apps Script that handles all the core logic of the application.

- **`doGet()`:** Serves the `index.html` file as the web application's user interface.
- **`registerUser(mgtId, name, email, password)`:** Registers a new user by adding their details to the "Users" sheet in the Google Sheet. It performs validation to ensure the MGT-ID and email are unique and that the password meets the required format.
- **`getEmployeeData()`:** Fetches a list of employees from the "Employee data" sheet to populate a datalist in the registration and login forms.
- **`getTodaysAttendanceStatus(mgtId)`:** Checks the "Attendance" sheet to determine the user's attendance status for the current day.
- **`loginUser(mgtId, password)`:** Authenticates a user by verifying their MGT-ID and password against the records in the "Users" sheet.
- **`recordAttendance(mgtId, type, userLat, userLon)`:** Records the user's attendance. It first checks if the user is within the geofence radius and then updates the "Attendance" sheet with the check-in, check-out, or absent status.
- **`calculateDistance(lat1, lon1, lat2, lon2)`:** A helper function to calculate the distance between two geographical coordinates.
- **`resetPassword(mgtId, newPassword)`:** Resets a user's password in the "Users" sheet.

### Frontend (`index.html`)

The frontend is a single HTML file that includes the UI and client-side logic.

- **Pages:** The application is structured into several "pages" (login, registration, forgot password, and dashboard), which are shown or hidden dynamically.
- **Forms:** It includes forms for user registration, login, and password reset. The forms have client-side validation to ensure the data is in the correct format.
- **Dashboard:** After logging in, the user is taken to a dashboard where they can see their name and MGT-ID and record their attendance.
- **Client-Side Logic:** The JavaScript code in the `index.html` file handles user interactions, communicates with the Google Apps Script backend using `google.script.run`, and updates the UI based on the responses from the backend.

## Setup and Deployment

To set up and deploy this application, follow these steps:

1.  **Create a Google Sheet:**
    *   Create a new Google Sheet.
    *   Rename the default sheet to "Users" and add the following headers in the first row: `MGT-ID`, `Name`, `Email`, `Password`, `RegistrationDate`.
    *   Create a new sheet named "Attendance" and add the following headers: `MGT-ID`, `Date`, `Check-in`, `Check-out`, `Status`, `Timestamp`.
    *   Create another sheet named "Employee data" and add the headers: `MGT-ID`, `Name`. Populate this sheet with the MGT-IDs and names of all employees.
    *   Get the ID of the Google Sheet from its URL.

2.  **Configure the Script:**
    *   Open the `Code.gs` file in the Google Apps Script editor.
    *   Replace the placeholder value of `SHEET_ID` with the ID of your Google Sheet.
    *   Optionally, you can also customize the `OFFICE_LOCATION` and `GEOFENCE_RADIUS` constants to match your office's location and desired geofence radius.

3.  **Deploy the Web App:**
    *   In the Google Apps Script editor, go to `Deploy` > `New deployment`.
    *   Select `Web app` as the deployment type.
    *   In the "Execute as" dropdown, select "Me".
    *   In the "Who has access" dropdown, select "Anyone with Google account" or "Anyone" depending on your needs.
    *   Click `Deploy`.
    *   Copy the web app URL provided after deployment. This is the URL you will use to access the application.

## Usage

1.  Open the web app URL in a browser.
2.  If you are a new user, click the "Register" link to create a new account.
3.  Log in with your MGT-ID and password.
4.  On the dashboard, click the "Check-In", "Check-Out", or "Absent" button to record your attendance.
5.  The system will ask for your location to verify that you are at the office.
6.  Your attendance will be recorded in the Google Sheet.
