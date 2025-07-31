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
// IMPORTANT: Update these coordinates to match your actual office location
// You can get accurate coordinates from Google Maps by right-clicking on your office location
const OFFICE_LOCATION = {
  latitude: 23.741383599749824,   // Office latitude - UPDATE THIS
  longitude: 90.37679524500614    // Office longitude - UPDATE THIS
};

// Geofence radius in meters - increased for better coverage
// Set to 0 to disable geofence validation (for testing only)
const GEOFENCE_RADIUS = 5000; // Increased from 1800m to 5000m for better coverage

// Debug mode - set to true to get detailed location information
const DEBUG_LOCATION = true; // Set to false in production

// Attendance Status Rules
const ATTENDANCE_RULES = {
  PRESENT_START_TIME: "10:00 AM",
  PRESENT_END_TIME: "10:15 AM",
  LATE_END_TIME: "6:00 PM"
};

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
 * Centralized error handler
 */
function handleError(error, functionName) {
    Logger.log(`Error in ${functionName}: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
    
    let userMessage = "An unexpected error occurred. Please try again later.";
    
    if (error.message.includes("Unable to access the database") || error.message.includes("not found")) {
        userMessage = "Database connection error. Please contact support.";
    } else if (error.message.includes("Invalid MGT-ID or password")) {
        userMessage = "Invalid MGT-ID or password.";
    }
    
    return { success: false, message: userMessage };
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

/**
 * Helper function to get location coordinates for setup
 * Call this function manually to get coordinates for your office location
 */
function getLocationSetupInfo() {
  const info = {
    currentOfficeLocation: OFFICE_LOCATION,
    currentGeofenceRadius: GEOFENCE_RADIUS,
    debugMode: DEBUG_LOCATION,
    instructions: [
      "1. Go to Google Maps and find your office location",
      "2. Right-click on the exact office location",
      "3. Click on the coordinates that appear (e.g., '23.7414, 90.3768')",
      "4. Copy these coordinates and update OFFICE_LOCATION in Code.gs",
      "5. Test with a small radius first (e.g., 100m) then increase as needed",
      "6. Set DEBUG_LOCATION to false in production"
    ],
    troubleshooting: [
      "If users are still outside geofence:",
      "- Verify coordinates are correct (latitude, longitude order)",
      "- Increase GEOFENCE_RADIUS gradually (try 2000, 3000, 5000)",
      "- Set GEOFENCE_RADIUS to 0 to temporarily disable validation",
      "- Check Google Apps Script logs for detailed location info"
    ]
  };
  
  Logger.log("=== LOCATION SETUP INFO ===");
  Logger.log(JSON.stringify(info, null, 2));
  Logger.log("=== END SETUP INFO ===");
  
  return info;
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

        // Use TextFinder for efficient searching
        const mgtIdFinder = sheet.createTextFinder(mgtId).matchEntireCell(true).findNext();
        if (mgtIdFinder) {
            return { success: false, message: "MGT-ID already registered. Redirecting to login..." };
        }

        const emailFinder = sheet.createTextFinder(email).matchEntireCell(true).findNext();
        if (emailFinder) {
            return { success: false, message: "Email already registered. Please login." };
        }

        sheet.appendRow([mgtId, name, email, password, new Date()]);
        return { success: true, message: "Registration successful! Please login." };
    } catch (error) {
        return handleError(error, "registerUser");
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
        return handleError(error, "getEmployeeData");
    }
}

function getTodaysAttendanceStatus(mgtId) {
    try {
        const sheet = getSheet(SHEET_NAMES.ATTENDANCE);
        const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), DATE_FORMAT);

        const mgtIdFinder = sheet.createTextFinder(mgtId).matchEntireCell(true).findAll();
        for (let i = mgtIdFinder.length - 1; i >= 0; i--) {
            const cell = mgtIdFinder[i];
            const row = cell.getRow();
            let sheetDate = String(sheet.getRange(row, 2).getValue()).trim();
            if (sheetDate && !sheetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                try {
                    const parsedDate = new Date(sheetDate);
                    sheetDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), DATE_FORMAT);
                } catch (e) {
                    Logger.log(`Failed to parse date '${sheetDate}' at row ${row}`);
                    continue;
                }
            }

            if (sheetDate === today) {
                const checkIn = String(sheet.getRange(row, 3).getValue()).trim();
                const checkOut = String(sheet.getRange(row, 4).getValue()).trim();
                const status = String(sheet.getRange(row, 5).getValue()).trim();

                if (status === "Absent") {
                    return "absent";
                }
                if (status === "Late") {
                    return "late";
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

        const mgtIdFinder = sheet.createTextFinder(mgtId).matchEntireCell(true).findNext();

        if (mgtIdFinder) {
            const row = mgtIdFinder.getRow();
            const storedPassword = sheet.getRange(row, 4).getValue();
            if (String(storedPassword).trim() === String(password).trim()) {
                const name = sheet.getRange(row, 2).getValue();
                return { success: true, userId: mgtId, name: name };
            }
        }
        return { success: false, message: "Invalid MGT-ID or password." };
    } catch (error) {
        return handleError(error, "loginUser");
    }
}

function recordAttendance(mgtId, type, userLat, userLon) {
    try {
        const sheet = getSheet(SHEET_NAMES.ATTENDANCE);

        const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), DATE_FORMAT);
        const time = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), TIME_FORMAT);

        // Geofence check for check-in and check-out
        if (type !== "absent" && GEOFENCE_RADIUS > 0) {
            const distance = calculateDistance(userLat, userLon, OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude);
            
            // Enhanced logging for debugging
            Logger.log(`=== GEOFENCE DEBUG INFO ===`);
            Logger.log(`User Location: (${userLat}, ${userLon})`);
            Logger.log(`Office Location: (${OFFICE_LOCATION.latitude}, ${OFFICE_LOCATION.longitude})`);
            Logger.log(`Calculated Distance: ${distance}m`);
            Logger.log(`Geofence Radius: ${GEOFENCE_RADIUS}m`);
            Logger.log(`Within Geofence: ${distance <= GEOFENCE_RADIUS}`);
            Logger.log(`=== END DEBUG INFO ===`);
            
            if (distance > GEOFENCE_RADIUS) {
                let errorMessage = `You are ${Math.round(distance)}m away from the office. Must be within ${GEOFENCE_RADIUS}m.`;
                
                if (DEBUG_LOCATION) {
                    errorMessage += `\n\nDEBUG INFO:\nYour location: ${userLat}, ${userLon}\nOffice location: ${OFFICE_LOCATION.latitude}, ${OFFICE_LOCATION.longitude}\n\nTo fix this:\n1. Verify office coordinates in Code.gs\n2. Get accurate coordinates from Google Maps\n3. Or increase GEOFENCE_RADIUS if needed`;
                }
                
                return { success: false, message: errorMessage };
            }
        } else if (GEOFENCE_RADIUS === 0) {
            Logger.log("⚠️ GEOFENCE DISABLED - Location validation bypassed");
        }

        const data = sheet.getDataRange().getValues();
        let targetRow = null;

        // Find the row for today using TextFinder for the MGT-ID and then checking the date
        const mgtIdFinder = sheet.createTextFinder(mgtId).matchEntireCell(true).findAll();
        for (let i = mgtIdFinder.length - 1; i >= 0; i--) {
            const cell = mgtIdFinder[i];
            const row = cell.getRow();
            let sheetDate = String(sheet.getRange(row, 2).getValue()).trim();
            if (sheetDate && !sheetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                try {
                    const parsedDate = new Date(sheetDate);
                    sheetDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), DATE_FORMAT);
                } catch (e) {
                    Logger.log(`Failed to parse date '${sheetDate}' at row ${row}`);
                    continue;
                }
            }
            if (sheetDate === today) {
                targetRow = row;
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
                const now = new Date();
                const checkInTime = new Date(now.toDateString() + " " + time);
                const presentStartTime = new Date(now.toDateString() + " " + ATTENDANCE_RULES.PRESENT_START_TIME);
                const presentEndTime = new Date(now.toDateString() + " " + ATTENDANCE_RULES.PRESENT_END_TIME);
                const lateEndTime = new Date(now.toDateString() + " " + ATTENDANCE_RULES.LATE_END_TIME);

                let status = "Absent";
                if (checkInTime >= presentStartTime && checkInTime <= presentEndTime) {
                    status = "Present";
                } else if (checkInTime > presentEndTime && checkInTime <= lateEndTime) {
                    status = "Late";
                }

                sheet.getRange(targetRow, 3).setValue(time);
                sheet.getRange(targetRow, 5).setValue(status);
            } else {
                Logger.log(`Appending new row for check-in`);
                const now = new Date();
                const checkInTime = new Date(now.toDateString() + " " + time);
                const presentStartTime = new Date(now.toDateString() + " " + ATTENDANCE_RULES.PRESENT_START_TIME);
                const presentEndTime = new Date(now.toDateString() + " " + ATTENDANCE_RULES.PRESENT_END_TIME);
                const lateEndTime = new Date(now.toDateString() + " " + ATTENDANCE_RULES.LATE_END_TIME);

                let status = "Absent";
                if (checkInTime >= presentStartTime && checkInTime <= presentEndTime) {
                    status = "Present";
                } else if (checkInTime > presentEndTime && checkInTime <= lateEndTime) {
                    status = "Late";
                }
                sheet.appendRow([mgtId, today, time, "", status, new Date()]);
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
        return handleError(error, "recordAttendance");
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
        
        const mgtIdFinder = sheet.createTextFinder(mgtId).matchEntireCell(true).findNext();

        if (mgtIdFinder) {
            const row = mgtIdFinder.getRow();
            sheet.getRange(row, 4).setValue(newPassword);
            return { success: true, message: "Password reset successfully! Please login." };
        }
        
        return { success: false, message: "MGT-ID not found." };
    } catch (error) {
        return handleError(error, "resetPassword");
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
        const history = [];
        const normalizedMgtId = String(mgtId).trim().toUpperCase();

        const data = sheet.getDataRange().getValues();
        const mgtIdCol = 0; 
        const dateCol = 1;
        const checkInCol = 2;
        const checkOutCol = 3;
        const statusCol = 4;

        for (let i = data.length - 1; i >= 1; i--) {
            if (String(data[i][mgtIdCol]).trim().toUpperCase() === normalizedMgtId) {
                let recordDate = null;
                try {
                    recordDate = new Date(data[i][dateCol]);
                } catch (e) {
                    continue;
                }

                if (filterStartDate && filterEndDate) {
                    if (recordDate < filterStartDate || recordDate > filterEndDate) {
                        continue;
                    }
                }

                history.push({
                    date: Utilities.formatDate(recordDate, Session.getScriptTimeZone(), "dd-MM-yyyy"),
                    checkIn: data[i][checkInCol] ? Utilities.formatDate(new Date(data[i][checkInCol]), Session.getScriptTimeZone(), TIME_FORMAT) : "-",
                    checkOut: data[i][checkOutCol] ? Utilities.formatDate(new Date(data[i][checkOutCol]), Session.getScriptTimeZone(), TIME_FORMAT) : "-",
                    status: data[i][statusCol] || "-"
                });
            }
        }
        
        Logger.log("Found " + history.length + " records for MGT-ID: " + normalizedMgtId);
        return { success: true, history: history };
        
    } catch (error) {
        return handleError(error, "getAttendanceHistory");
    }
}
