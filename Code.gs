// Constants
const SHEET_ID = "12w9PFhq714IP0j0KuZkPsn6tNejCfusSCm1c6L7aXOo"; // Replace with your actual Sheet ID
const OFFICE_LOCATION = { latitude: 23.741383599749824, longitude: 90.37679524500614 }; 
const GEOFENCE_RADIUS = 1800; // Meters
const DATE_FORMAT = "yyyy-MM-dd";
const TIME_FORMAT = "hh:mm a"; // AM/PM format for both check-in and check-out


function doGet() {
    return HtmlService.createHtmlOutputFromFile("index")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .setTitle("Employee Attendance System");
}

function registerUser(mgtId, name, email, password) {
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Users");
        if (!sheet) throw new Error("Users sheet not found.");
        
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
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Employee data");
        if (!sheet) throw new Error("Employee data sheet not found.");
        
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
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Attendance");
        if (!sheet) throw new Error("Attendance sheet not found.");

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
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Users");
        if (!sheet) throw new Error("Users sheet not found.");

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
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Attendance");
        if (!sheet) throw new Error("Attendance sheet not found.");

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

        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Users");
        if (!sheet) throw new Error("Users sheet not found.");
        
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
