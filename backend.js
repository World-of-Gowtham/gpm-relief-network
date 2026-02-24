// 1. WEATHER LOGGING
function logWeatherToSheet() {
  const apiKey = "97af91084f19d3d8f19ec4a9988cccd9"; 
  const city = "Tenkasi";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  try {
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("WeatherLog");
    sheet.appendRow([new Date(), city, data.main.temp + "°C", data.weather[0].main, data.main.humidity + "%"]);
  } catch (err) {
    console.log("Error fetching weather: " + err.message);
  }
}

// 2. ALL GET ACTIONS

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("User");

  if (action == 'login') {
    var email = e.parameter.email;
    var password = e.parameter.password;
    var data = sheet.getDataRange().getValues(); 
    for (var i = 1; i < data.length; i++) {
      var storedEmail = data[i][2] ? data[i][2].toString().trim() : "";    
      var storedPassword = data[i][3] ? data[i][3].toString().trim() : ""; 
      if (storedEmail === email.trim() && storedPassword === password.trim()) {
        return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
      }
    }
    return ContentService.createTextOutput("Invalid Credentials").setMimeType(ContentService.MimeType.TEXT);
  }

  if (action == 'userRegister') {
    try {
      sheet.appendRow(["USR" + Math.floor(Math.random() * 10000), e.parameter.name, e.parameter.email, e.parameter.password, e.parameter.phone, e.parameter.city, e.parameter.district, e.parameter.state]);
      return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    } catch (err) {
      return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
    }
  }

  if (action == 'forgotPassword') {
    var email = e.parameter.email;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] && data[i][2].toString().trim() === email.trim()) {
        return ContentService.createTextOutput("Your password is: " + data[i][3]).setMimeType(ContentService.MimeType.TEXT);
      }
    }
    return ContentService.createTextOutput("Email not found").setMimeType(ContentService.MimeType.TEXT);
  }

  if (action == 'autoAlert') {
    try {
      var targetEmail = e.parameter.email;
      var subject = "🚨 GPM EMERGENCY ALERT: " + e.parameter.condition.toUpperCase();
      var body = `<div style="font-family: Arial; border: 2px solid #ff4d4d; padding: 20px; border-radius: 10px;"><h2>Emergency Alert</h2><p>Detected <b>${e.parameter.condition}</b> (${e.parameter.temp}) in Tenkasi.</p></div>`;
      GmailApp.sendEmail(targetEmail, subject, "", {htmlBody: body});
      return ContentService.createTextOutput("Mail Sent Successfully").setMimeType(ContentService.MimeType.TEXT);
    } catch (err) { return ContentService.createTextOutput("Mail Error").setMimeType(ContentService.MimeType.TEXT); }
  }

  if (action == 'verifyOTR') {
    var userOTR = e.parameter.otr_number.toString().trim();
    var otrSheet = ss.getSheetByName("Verify_payments"); 
    var otrData = otrSheet.getDataRange().getValues();
    
    for (var i = 1; i < otrData.length; i++) {
      var cellContent = otrData[i][0].toString(); 
      if (cellContent.includes(userOTR)) { 
        return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
      }
    }
    return ContentService.createTextOutput("Fail").setMimeType(ContentService.MimeType.TEXT);
  }

  if (action === "getUsers") {
    var data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput("Invalid Action").setMimeType(ContentService.MimeType.TEXT);
} // Closing brace for doGet

// 3. ALL POST ACTIONS
// 3. MERGED POST ACTIONS (USE THIS ONE ONLY)
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var adminEmail = "zeromgowtham@gmail.com"; // Admin Email for SOS alerts
  var data;
  
  // 1. Parse incoming data (JSON or Form)
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    data = e.parameter;
  }

  // ACTION: RECORD DONATION (TO DONATIONSS SHEET)
  if (data.action === 'recordDonation') {
    var sheet = ss.getSheetByName("Donationss") || ss.insertSheet("Donationss");
    sheet.appendRow([
      new Date(), 
      data.email, 
      data.ngo, 
      data.type, 
      data.amount, 
      data.utr, 
      "GPay Payment"
    ]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }

  // ACTION: BROADCAST EMAIL
  if (data.action === "broadcast") {
    var userSheet = ss.getSheetByName("User");
    var userData = userSheet.getDataRange().getValues();
    var sentCount = 0;

    for (var i = 1; i < userData.length; i++) {
        var name = userData[i][1] || "Valued User"; // Column B
        var email = userData[i][2] ? userData[i][2].toString().trim() : ""; // Column C
        var city = userData[i][5] || "N/A"; // Column F

        if (email.includes("@")) {
            var htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #eee;">
                    <div style="background: #ff4d4d; color: white; padding: 20px;">
                        <h2 style="margin:0;">GPM Relief Notification</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hello <b>${name}</b>,</p>
                        <p>${data.message.replace(/\n/g, '<br>')}</p>
                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ff4d4d;">
                            <b>Registration Details:</b><br>
                            • Name: ${name}<br>
                            • City: ${city}
                        </div>
                        <p style="margin-top:20px; font-size: 14px; color: #666;">
                            வணக்கம் ${name}, உதவி தேவைப்படும் மக்களுக்கு ஆதரவு அளிக்க உங்கள் தளத்திற்குச் செல்லவும்!
                        </p>
                    </div>
                </div>`;

            try {
                GmailApp.sendEmail(email, "🚨 GPM ALERT: " + data.subject, "", { htmlBody: htmlBody });
                sentCount++;
            } catch (err) {}
        }
    }
    return ContentService.createTextOutput("SUCCESS: Sent to " + sentCount);
  }

  // ACTION: UPDATE USER DATA
  if (data.action === "updateUser") {
    var userSheet = ss.getSheetByName("User");
    userSheet.getRange(data.row, 2).setValue(data.name);
    userSheet.getRange(data.row, 5).setValue(data.phone);
    userSheet.getRange(data.row, 6).setValue(data.city);
    return ContentService.createTextOutput("User Updated Successfully");
  }

  // ACTION: ADD OTR (Manual Verification)
  if (data.action === 'addOTR' || data.otr_number) {
    var otrSheet = ss.getSheetByName("Verify_payments");
    var messageText = data.otr_number || "No Data";
    otrSheet.appendRow([messageText, "Pending Verification", new Date()]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }

  // DEFAULT ACTION: DISASTER STATUS + INSTANT EMAIL ALERT
  var sSheet = ss.getSheetByName("Disaster_status") || ss.insertSheet("Disaster_status");
  var timestamp = new Date();
  
  // Save to sheet
  sSheet.appendRow([timestamp, data.location, data.severity, data.description, "Pending"]);

  // Send SOS Email to Admin
  var sosSubject = "🚨 URGENT SOS: " + (data.severity || "Emergency") + " in " + (data.location || "Unknown");
  var sosHtmlBody = `
    <div style="font-family: Arial, sans-serif; border: 2px solid #ff4d4d; padding: 20px; border-radius: 10px;">
      <h2 style="color: #ff4d4d; margin-top: 0;">🆘 Emergency SOS Received</h2>
      <p><b>📍 Location:</b> ${data.location || "Not provided"}</p>
      <p><b>⚠️ Severity:</b> ${data.severity || "Critical"}</p>
      <p><b>📝 Details:</b> ${data.description || "No description provided."}</p>
      <p><b>⏰ Reported:</b> ${timestamp.toLocaleString()}</p>
      <hr>
      <p style="font-size: 12px; color: #888;">Check the Disaster_status sheet for more details.</p>
    </div>
  `;

  try {
    GmailApp.sendEmail(adminEmail, sosSubject, "", { htmlBody: sosHtmlBody });
  } catch (e) {
    console.log("Email Alert Failed: " + e);
  }

  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}