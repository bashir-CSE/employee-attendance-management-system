/**
 * ========================================
 * EMPLOYEE ATTENDANCE MANAGEMENT SYSTEM
 * ========================================
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Spreadsheet with the following sheets:
 *    - "Users": Columns: MGT-ID, Name, Email, Password, Registration Date
 *    - "Attendance": Columns: MGT-ID, Date, Check-In, Check-Out, Status, Timestamp
 *    - "Employee data": Columns: MGT-ID, Name (for autocomplete functionality)
 *
 * 2. Update the SHEET_ID below with your Google Spreadsheet ID
 * 3. Update OFFICE_LOCATION with your office coordinates
 * 4. Adjust GEOFENCE_RADIUS as needed (in meters)
 * 5. Deploy as web app with execute permissions for "Anyone"
 *
 * SHEET STRUCTURE REQUIREMENTS:
 * - Users sheet: MGT-ID (A), Name (B), Email (C), Password (D), Registration Date (E)
 * - Attendance sheet: MGT-ID (A), Date (B), Check-In (C), Check-Out (D), Status (E), Timestamp (F)
 * - Employee data sheet: MGT-ID (A), Name (B)
 */

// ========================================
// CONFIGURATION SECTION
// ========================================
// Update these values according to your setup

// Google Sheets Configuration
const SHEET_ID = "12w9PFhq714IP0j0KuZkPsn6tNejCfusSCm1c6L7aXOo"; // Replace with your actual Sheet ID

// Sheet Names - Update these if your sheet names are different
const SHEET_NAMES = {
  USERS: "Users",                // Sheet containing user registration data
  ATTENDANCE: "Attendance",       // Sheet containing attendance records
  EMPLOYEE_DATA: "Employee data"  // Sheet containing employee master data
};

// Office Location and Geofence Settings
const OFFICE_LOCATION = {
  latitude: 23.741383599749824,   // Office latitude
  longitude: 90.37679524500614    // Office longitude
};
const GEOFENCE_RADIUS = 1800; // Radius in meters for attendance location validation

// Date and Time Formats
const DATE_FORMAT = "yyyy-MM-dd";  // Date format for storage
const TIME_FORMAT = "hh:mm a";     // Time format for display (AM/PM format)

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get spreadsheet instance with error handling
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SHEET_ID);
  } catch (error) {
    Logger.log("Error opening spreadsheet: " + error.message);
    throw new Error("Unable to access the database. Please check the Sheet ID configuration.");
  }
}

/**
 * Get sheet by name with error handling
 */
function getSheet(sheetName) {
  try {
    const spreadsheet = getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' not found in the spreadsheet.`);
    }
    return sheet;
  } catch (error) {
    Logger.log(`Error accessing sheet '${sheetName}': ${error.message}`);
    throw error;
  }
}

/**
 * Validate sheet structure and configuration
 */
function validateSystemConfiguration() {
  try {
    Logger.log("Validating system configuration...");
    
    // Check if spreadsheet exists
    const spreadsheet = getSpreadsheet();
    Logger.log("✓ Spreadsheet accessible");
    
    // Check if all required sheets exist
    const requiredSheets = Object.values(SHEET_NAMES);
    const existingSheets = spreadsheet.getSheets().map(sheet => sheet.getName());
    
    for (const sheetName of requiredSheets) {
      if (!existingSheets.includes(sheetName)) {
        throw new Error(`Required sheet '${sheetName}' not found. Please create it.`);
      }
    }
    Logger.log("✓ All required sheets exist");
    
    // Check basic sheet structure
    const usersSheet = getSheet(SHEET_NAMES.USERS);
    const attendanceSheet = getSheet(SHEET_NAMES.ATTENDANCE);
    const employeeDataSheet = getSheet(SHEET_NAMES.EMPLOYEE_DATA);
    
    // Validate minimum columns exist
    if (usersSheet.getLastColumn() < 4) {
      Logger.log("⚠ Users sheet may not have all required columns");
    }
    if (attendanceSheet.getLastColumn() < 5) {
      Logger.log("⚠ Attendance sheet may not have all required columns");
    }
    if (employeeDataSheet.getLastColumn() < 2) {
      Logger.log("⚠ Employee data sheet may not have all required columns");
    }
    
    Logger.log("✓ System configuration validation completed");
    return { success: true, message: "System configuration is valid" };
    
  } catch (error) {
    Logger.log("✗ System configuration validation failed: " + error.message);
    return { success: false, message: "Configuration error: " + error.message };
  }
}

/**
 * Initialize system and validate configuration (can be called manually for testing)
 */
function initializeSystem() {
  return validateSystemConfiguration();
}


function doGet() {
    return HtmlService.createHtmlOutputFromFile("index")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setTitle("Employee Attendance System");
}

function registerUser(mgtId, name, email, password) {
    try {
        const sheet = getSheet(SHEET_NAMES.USERS);
        
        if (!/^\d{4}$/.test(password)) {
            return { success: false, message: "Password must be exactly 4 digits (numeric only)." };
        }
        if (!name || name.trim() === "") {
            return { success: false, message: "Name cannot be empty." };
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { success: false, message: "Invalid email format." };
        }

        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            if (String(data[i][0]).trim() === String(mgtId).trim()) {
                return { success: false, message: "MGT-ID already registered. Redirecting to login..." };
            }
            if (String(data[i][2]).trim() === String(email).trim()) {
                return { success: false, message: "Email already registered. Please login." };
            }
        }

        sheet.appendRow([mgtId, name, email, password, new Date()]);
        return { success: true, message: "Registration successful! Please login." };
    } catch (error) {
        Logger.log("Registration error: " + error.message);
        if (error.message.includes("not found")) {
            return { success: false, message: "Database connection error. Please contact support." };
        }
        return { success: false, message: "Registration failed: " + error.message };
    }
}

function getEmployeeData() {
    try {
        const sheet = getSheet(SHEET_NAMES.EMPLOYEE_DATA);
        
        const data = sheet.getDataRange().getValues();
        const employees = [];
        // Start from row 1 to skip header
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] && data[i][1]) { // Ensure both MGT-ID and Name exist
                employees.push({ mgtId: data[i][0].toString().trim(), name: data[i][1].toString().trim() });
            }
        }
        return employees;
    } catch (error) {
        Logger.log("getEmployeeData error: " + error.message);
        // Return an empty array or an error object to the client
        return []; 
    }
}

function getTodaysAttendanceStatus(mgtId) {
    try {
        const sheet = getSheet(SHEET_NAMES.ATTENDANCE);

        const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), DATE_FORMAT);
        const data = sheet.getDataRange().getValues();

        // Search from the end to find the last record for the user for today
        for (let i = data.length - 1; i >= 1; i--) {
            const rowMgtId = String(data[i][0]).trim().toUpperCase();
            let sheetDate = String(data[i][1]).trim();

            // Normalize date format if necessary
            if (sheetDate && !sheetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                try {
                    const parsedDate = new Date(sheetDate);
                    sheetDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), DATE_FORMAT);
                } catch (e) {
                    continue; // Skip rows with unparseable dates
                }
            }

            if (rowMgtId === String(mgtId).trim().toUpperCase() && sheetDate === today) {
                const checkIn = String(data[i][2]).trim();
                const checkOut = String(data[i][3]).trim();
                const status = String(data[i][4]).trim();

                if (status === "Absent") {
                    return "absent";
                }
                if (checkOut && checkOut !== "-") {
                    return "checked-out";
                }
                if (checkIn && checkIn !== "-") {
                    return "checked-in";
                }
            }
        }
        return "none"; // No record found for today
    } catch (error) {
        Logger.log("getTodaysAttendanceStatus error: " + error.message);
        return "error";
    }
}

function loginUser(mgtId, password) {
    try {
        const sheet = getSheet(SHEET_NAMES.USERS);

        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            const storedMgtId = String(data[i][0]).trim();
            const storedPassword = String(data[i][3]).trim();
            if (storedMgtId === String(mgtId).trim() && storedPassword === String(password).trim()) {
                return { success: true, userId: storedMgtId, name: data[i][1] };
            }
        }
        return { success: false, message: "Invalid MGT-ID or password." };
    } catch (error) {
        Logger.log("Login error: " + error.message);
        if (error.message.includes("not found")) {
            return { success: false, message: "Database connection error. Please contact support." };
        }
        return { success: false, message: "Login failed: " + error.message };
    }
}

function recordAttendance(mgtId, type, userLat, userLon) {
    try {
        const sheet = getSheet(SHEET_NAMES.ATTENDANCE);

        const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), DATE_FORMAT);
        const time = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), TIME_FORMAT);

        // Geofence check for check-in and check-out
        if (type !== "absent") {
            const distance = calculateDistance(userLat, userLon, OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude);
            Logger.log(`User at (${userLat}, ${userLon}), Office at (${OFFICE_LOCATION.latitude}, ${OFFICE_LOCATION.longitude}), Distance: ${distance}m`);
            if (distance > GEOFENCE_RADIUS) {
                return { success: false, message: `You are ${Math.round(distance)}m away from the office. Must be within ${GEOFENCE_RADIUS}m.` };
            }
        }

        const data = sheet.getDataRange().getValues();
        let targetRow = null;

        // Normalize and find the row for today
        for (let i = data.length - 1; i >= 1; i--) {
            let sheetDate = String(data[i][1]).trim();
            if (sheetDate && !sheetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                try {
                    const parsedDate = new Date(sheetDate);
                    sheetDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), DATE_FORMAT);
                } catch (e) {
                    Logger.log(`Failed to parse date '${sheetDate}' at row ${i + 1}`);
                    continue;
                }
            }
            if (String(data[i][0]).trim() === String(mgtId).trim() && sheetDate === today) {
                targetRow = i + 1;
                break;
            }
        }

        Logger.log(`Processing ${type} for ${mgtId} on ${today}. Target row: ${targetRow}`);

        if (type === "check-in") {
            if (targetRow) {
                const checkIn = sheet.getRange(targetRow, 3).getValue();
                if (checkIn && String(checkIn).trim() !== "" && String(checkIn).trim() !== "-") {
                    Logger.log(`Check-in already exists at ${checkIn} for row ${targetRow}`);
                    return { success: false, message: "Already checked in today at " + checkIn };
                }
                Logger.log(`Updating check-in at row ${targetRow}`);
                sheet.getRange(targetRow, 3).setValue(time);
                sheet.getRange(targetRow, 5).setValue("Present");
            } else {
                Logger.log(`Appending new row for check-in`);
                sheet.appendRow([mgtId, today, time, "", "Present", new Date()]);
            }
            return { success: true, message: "Check-in recorded at " + time };
        } else if (type === "check-out") {
            if (!targetRow) {
                Logger.log(`No row found for ${mgtId} on ${today}`);
                return { success: false, message: "Cannot check out without checking in first today." };
            }
            const checkIn = sheet.getRange(targetRow, 3).getValue();
            const checkOut = sheet.getRange(targetRow, 4).getValue();
            if (!checkIn || String(checkIn).trim() === "" || String(checkIn).trim() === "-") {
                Logger.log(`No valid check-in found at row ${targetRow}`);
                return { success: false, message: "Cannot check out without a prior check-in." };
            }
            if (checkOut && String(checkOut).trim() !== "" && String(checkOut).trim() !== "-") {
                Logger.log(`Check-out already exists at ${checkOut} for row ${targetRow}`);
                return { success: false, message: "Already checked out today at " + checkOut };
            }
            Logger.log(`Updating check-out at row ${targetRow}`);
            sheet.getRange(targetRow, 4).setValue(time);
            return { success: true, message: "Check-out recorded at " + time };
        } else if (type === "absent") {
            if (targetRow) {
                Logger.log(`Overwriting row ${targetRow} with absent`);
                sheet.getRange(targetRow, 3).setValue("-");
                sheet.getRange(targetRow, 4).setValue("-");
                sheet.getRange(targetRow, 5).setValue("Absent");
            } else {
                Logger.log(`Appending new row for absent`);
                sheet.appendRow([mgtId, today, "-", "-", "Absent", new Date()]);
            }
            return { success: true, message: "Marked absent for " + today };
        } else {
            return { success: false, message: "Invalid attendance type." };
        }
    } catch (error) {
        Logger.log("Attendance error: " + error.message);
        if (error.message.includes("not found")) {
            return { success: false, message: "Database connection error. Please contact support." };
        }
        return { success: false, message: "Attendance recording failed: " + error.message };
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function resetPassword(mgtId, newPassword) {
    try {
        if (!/^\d{4}$/.test(newPassword)) {
            return { success: false, message: "New password must be exactly 4 digits (numeric only)." };
        }

        const sheet = getSheet(SHEET_NAMES.USERS);
        
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            if (String(data[i][0]).trim() === String(mgtId).trim()) {
                sheet.getRange(i + 1, 4).setValue(newPassword);
                return { success: true, message: "Password reset successfully! Please login." };
            }
        }
        
        return { success: false, message: "MGT-ID not found." };
    } catch (error) {
        Logger.log("Reset password error: " + error.message);
        if (error.message.includes("not found")) {
            return { success: false, message: "Database connection error. Please contact support." };
        }
        return { success: false, message: "Password reset failed: " + error.message };
    }
}

function getAttendanceHistory(mgtId, startDate = null, endDate = null) {
    try {
        Logger.log("getAttendanceHistory started for MGT-ID: " + mgtId);
        if (startDate && endDate) {
            Logger.log("Date range filter: " + startDate + " to " + endDate);
        }
        
        // Validate input
        if (!mgtId || String(mgtId).trim() === "") {
            Logger.log("MGT-ID is null, undefined, or empty. Aborting.");
            return { success: false, message: "MGT-ID was not provided to the server." };
        }

        // Parse date range if provided
        let filterStartDate = null;
        let filterEndDate = null;
        if (startDate && endDate) {
            try {
                filterStartDate = new Date(startDate);
                filterEndDate = new Date(endDate);
                // Set end date to end of day for inclusive filtering
                filterEndDate.setHours(23, 59, 59, 999);
                Logger.log("Parsed date range: " + filterStartDate + " to " + filterEndDate);
            } catch (e) {
                Logger.log("Error parsing date range: " + e.message);
                return { success: false, message: "Invalid date range provided." };
            }
        }

        const sheet = getSheet(SHEET_NAMES.ATTENDANCE);

        const lastRow = sheet.getLastRow();
        if (lastRow <= 1) {
            Logger.log("No data rows found in attendance sheet.");
            return { success: true, history: [] };
        }

        const history = [];
        const normalizedMgtId = String(mgtId).trim().toUpperCase();
        Logger.log("Scanning " + lastRow + " rows for MGT-ID: " + normalizedMgtId);

        // Get all data at once for better performance
        const allData = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
        
        // Process data from newest to oldest (reverse order)
        for (let i = allData.length - 1; i >= 0; i--) {
            const rowData = allData[i];
            const rowMgtId = String(rowData[0] || "").trim().toUpperCase();

            if (rowMgtId === normalizedMgtId) {
                let dateCell = rowData[1];
                let formattedDate = "-";
                let recordDate = null;
                
                // Handle date formatting more robustly
                if (dateCell) {
                    try {
                        if (dateCell instanceof Date) {
                            recordDate = dateCell;
                            formattedDate = Utilities.formatDate(dateCell, Session.getScriptTimeZone(), "dd-MM-yyyy");
                        } else if (typeof dateCell === 'string' && dateCell.trim() !== "") {
                            // Try to parse string date
                            const parsedDate = new Date(dateCell);
                            if (!isNaN(parsedDate.getTime())) {
                                recordDate = parsedDate;
                                formattedDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), "dd-MM-yyyy");
                            } else {
                                formattedDate = String(dateCell).trim();
                            }
                        } else {
                            formattedDate = String(dateCell).trim();
                        }
                    } catch (e) {
                        Logger.log(`Error formatting date for row ${i + 2}: ${e.message}`);
                        formattedDate = String(dateCell).trim();
                    }
                }

                // Apply date range filter if specified
                if (filterStartDate && filterEndDate && recordDate) {
                    if (recordDate < filterStartDate || recordDate > filterEndDate) {
                        continue; // Skip this record if it's outside the date range
                    }
                }

                // Format check-in and check-out times
                let checkInTime = "-";
                let checkOutTime = "-";
                let status = rowData[4] ? String(rowData[4]).trim() : "-";

                // Handle check-in time formatting
                if (rowData[2]) {
                    try {
                        if (rowData[2] instanceof Date) {
                            checkInTime = Utilities.formatDate(rowData[2], Session.getScriptTimeZone(), TIME_FORMAT);
                        } else if (typeof rowData[2] === 'string' && rowData[2].trim() !== "" && rowData[2].trim() !== "-") {
                            // Try to parse as date if it's a string
                            const parsedTime = new Date(rowData[2]);
                            if (!isNaN(parsedTime.getTime())) {
                                checkInTime = Utilities.formatDate(parsedTime, Session.getScriptTimeZone(), TIME_FORMAT);
                            } else {
                                checkInTime = String(rowData[2]).trim();
                            }
                        } else {
                            checkInTime = String(rowData[2]).trim();
                        }
                    } catch (e) {
                        Logger.log(`Error formatting check-in time for row ${i + 2}: ${e.message}`);
                        checkInTime = String(rowData[2]).trim();
                    }
                }

                // Handle check-out time formatting
                if (rowData[3]) {
                    try {
                        if (rowData[3] instanceof Date) {
                            checkOutTime = Utilities.formatDate(rowData[3], Session.getScriptTimeZone(), TIME_FORMAT);
                        } else if (typeof rowData[3] === 'string' && rowData[3].trim() !== "" && rowData[3].trim() !== "-") {
                            // Try to parse as date if it's a string
                            const parsedTime = new Date(rowData[3]);
                            if (!isNaN(parsedTime.getTime())) {
                                checkOutTime = Utilities.formatDate(parsedTime, Session.getScriptTimeZone(), TIME_FORMAT);
                            } else {
                                checkOutTime = String(rowData[3]).trim();
                            }
                        } else {
                            checkOutTime = String(rowData[3]).trim();
                        }
                    } catch (e) {
                        Logger.log(`Error formatting check-out time for row ${i + 2}: ${e.message}`);
                        checkOutTime = String(rowData[3]).trim();
                    }
                }

                // Handle empty values
                if (checkInTime === "" || checkInTime === "undefined" || checkInTime === "null") {
                    checkInTime = "-";
                }
                if (checkOutTime === "" || checkOutTime === "undefined" || checkOutTime === "null") {
                    checkOutTime = "-";
                }
                if (status === "" || status === "undefined" || status === "null") {
                    status = "-";
                }

                history.push({
                    date: formattedDate,
                    checkIn: checkInTime,
                    checkOut: checkOutTime,
                    status: status
                });
                
                Logger.log(`Added record: Date=${formattedDate}, CheckIn=${checkInTime}, CheckOut=${checkOutTime}, Status=${status}`);
            }
        }
        
        Logger.log("Found " + history.length + " records for MGT-ID: " + normalizedMgtId);
        return { success: true, history: history };
        
    } catch (error) {
        Logger.log("CRITICAL ERROR in getAttendanceHistory: " + error.toString());
        Logger.log("Error stack: " + error.stack);
        return { success: false, message: "Failed to retrieve attendance history. Error: " + error.message };
    }
}
