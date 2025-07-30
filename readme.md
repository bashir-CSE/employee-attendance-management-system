# Employee Attendance Management System

A comprehensive web-based employee attendance management system built with Google Apps Script and modern web technologies. This system provides secure user authentication, location-based attendance tracking, and comprehensive attendance history management.

## 🚀 Features

### Core Functionality
- **User Registration & Authentication**: Secure login system with 4-digit PIN
- **Real-time Attendance Tracking**: Check-in, check-out, and absent marking
- **Geofence Validation**: Location-based attendance verification
- **Attendance History**: Complete historical records with status tracking
- **Password Reset**: Self-service password reset functionality
- **Auto-complete**: Smart MGT-ID suggestions during login/registration

### Technical Features
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant UI updates after attendance actions
- **Session Management**: Automatic session timeout for security
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading Indicators**: Visual feedback during operations
- **Configurable Variables**: Easy configuration for sheet names and settings

## 📋 Prerequisites

- Google account with access to Google Sheets and Google Apps Script
- Modern web browser with JavaScript enabled
- Location services enabled for geofence validation

## 🛠️ Setup Instructions

### Step 1: Create Google Spreadsheet

1. Create a new Google Spreadsheet
2. Create the following sheets with exact names:

#### Sheet: "Users"
| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| MGT-ID   | Name     | Email    | Password | Registration Date |

#### Sheet: "Attendance"
| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| MGT-ID   | Date     | Check-In | Check-Out| Status   | Timestamp |

#### Sheet: "Employee data"
| Column A | Column B |
|----------|----------|
| MGT-ID   | Name     |

### Step 2: Configure Google Apps Script

1. Open Google Apps Script (script.google.com)
2. Create a new project
3. Replace the default code with the contents of `Code.gs`
4. Update the configuration section:

```javascript
// Update this with your Google Spreadsheet ID
const SHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

// Update with your office coordinates
const OFFICE_LOCATION = { 
  latitude: YOUR_OFFICE_LATITUDE,   
  longitude: YOUR_OFFICE_LONGITUDE    
}; 

// Adjust geofence radius as needed (in meters)
const GEOFENCE_RADIUS = 1800;
```

### Step 3: Add HTML File

1. In Apps Script, click the "+" button next to "Files"
2. Select "HTML"
3. Name it "index"
4. Replace the content with the contents of `index.html`

### Step 4: Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Set execute as: "Me"
4. Set access: "Anyone" (or "Anyone with Google account" for more security)
5. Click "Deploy"
6. Copy the web app URL

### Step 5: Test the System

1. Run the `initializeSystem()` function in Apps Script to validate configuration
2. Access the web app URL
3. Register a test user
4. Test login and attendance functionality

## 🔧 Configuration Options

### Sheet Names
If you need to use different sheet names, update the `SHEET_NAMES` object in `Code.gs`:

```javascript
const SHEET_NAMES = {
  USERS: "Your_Users_Sheet_Name",
  ATTENDANCE: "Your_Attendance_Sheet_Name", 
  EMPLOYEE_DATA: "Your_Employee_Data_Sheet_Name"
};
```

### Geofence Settings
**IMPORTANT**: Update these coordinates to match your actual office location:

```javascript
const OFFICE_LOCATION = {
  latitude: 23.741383599749824,   // Your office latitude - UPDATE THIS
  longitude: 90.37679524500614    // Your office longitude - UPDATE THIS
};
const GEOFENCE_RADIUS = 5000; // Radius in meters (increased for better coverage)
const DEBUG_LOCATION = true;   // Set to false in production
```

**How to get accurate coordinates:**
1. Go to Google Maps and find your office location
2. Right-click on the exact office location
3. Click on the coordinates that appear (e.g., '23.7414, 90.3768')
4. Copy these coordinates and update `OFFICE_LOCATION` in Code.gs
5. Run `getLocationSetupInfo()` function in Apps Script for detailed setup help

### Date/Time Formats
Customize date and time display formats:

```javascript
const DATE_FORMAT = "yyyy-MM-dd";  // Storage format
const TIME_FORMAT = "hh:mm a";     // Display format (12-hour with AM/PM)
```

## 📱 Usage Guide

### For Employees

1. **Registration**:
   - Enter your MGT-ID (must match Employee data sheet)
   - Provide name, email, and create a 4-digit PIN
   - Click Register

2. **Login**:
   - Select your MGT-ID from the dropdown
   - Enter your 4-digit PIN
   - Click Login

3. **Recording Attendance**:
   - **Check-in**: Click when arriving at office
   - **Check-out**: Click when leaving office (requires prior check-in)
   - **Absent**: Mark yourself absent for the day

4. **View History**:
   - Scroll down to see your complete attendance history
   - History updates automatically after each attendance action

### For Administrators

1. **Employee Management**:
   - Add employee data to "Employee data" sheet for auto-complete
   - Monitor attendance through "Attendance" sheet
   - View user registrations in "Users" sheet

2. **System Monitoring**:
   - Check Apps Script logs for system events
   - Run `initializeSystem()` to validate configuration
   - Monitor geofence violations and system errors

## 🔍 Troubleshooting

### Common Issues

1. **"Sheet not found" errors**:
   - Verify sheet names match exactly (case-sensitive)
   - Check SHEET_ID is correct
   - Ensure all required sheets exist

2. **Location/Geofence issues**:
   - Verify OFFICE_LOCATION coordinates are correct
   - Check GEOFENCE_RADIUS is appropriate
   - Ensure location services are enabled in browser

3. **Attendance history not loading**:
   - Check browser console for JavaScript errors
   - Verify MGT-ID exists in attendance sheet
   - Ensure proper date formatting in sheet

4. **Login issues**:
   - Verify user exists in Users sheet
   - Check password is exactly 4 digits
   - Clear browser cache and try again

5. **Geofence/Location issues** ("You are XXXXm away" error):
   - **Most Common Fix**: Update office coordinates in `OFFICE_LOCATION`
   - Get accurate coordinates from Google Maps (right-click → copy coordinates)
   - Increase `GEOFENCE_RADIUS` (try 3000, 5000, or higher)
   - Set `GEOFENCE_RADIUS = 0` to temporarily disable location validation
   - Enable `DEBUG_LOCATION = true` for detailed location information
   - Check Apps Script logs for exact coordinates being used
   - Ensure location services are enabled in browser
   - Try from different devices to verify the issue

### System Validation

Run the `initializeSystem()` function in Apps Script to check:
- Spreadsheet accessibility
- Required sheets existence
- Basic sheet structure validation

## 🔒 Security Features

- **Session Management**: Automatic logout after 5 minutes of inactivity
- **Input Validation**: Server-side validation of all inputs
- **Geofence Protection**: Location-based attendance verification
- **Error Handling**: Secure error messages without exposing system details

## 📊 Data Structure

### Users Sheet
- Stores user registration information
- Passwords are stored as plain text (4-digit PINs)
- Registration timestamps for audit trail

### Attendance Sheet
- One record per attendance action
- Supports multiple check-ins/check-outs per day
- Status tracking (Present/Absent)
- Geolocation validation logs

### Employee Data Sheet
- Master list for auto-complete functionality
- Can be pre-populated with employee information
- Used for MGT-ID validation during registration

## 🚀 Recent Improvements

### Fixed Issues
- **Attendance History Loading**: Improved error handling and data validation
- **Sheet Name Variables**: Centralized configuration for easy customization
- **Data Consistency**: Better handling of date formats and empty values
- **Error Messages**: More descriptive error messages for troubleshooting

### Enhanced Features
- **Real-time History Updates**: History refreshes automatically after attendance actions
- **Loading Indicators**: Visual feedback during data loading
- **Status Badges**: Color-coded status indicators in history table
- **System Validation**: Built-in configuration validation function

## 📞 Support

For technical support or feature requests:
- Check the browser console for detailed error messages
- Review Apps Script execution logs
- Verify all configuration settings match your setup
- Run `initializeSystem()` function to validate system configuration

## 📄 License

This project is developed for internal use at ALOHA Bangladesh. Please ensure compliance with your organization's policies before deployment.

---

**Developed by Md Bashir Ahmed, Officer-IT, ALOHA Bangladesh**
