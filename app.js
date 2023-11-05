var _todayWord = "";
var _firebaseProjectID = "semental-21cec";
//https://wordnik.com/
var apiKeyWordnik = '9edtshj1hhubga51ea9iztni9owr9ky9fuk6qss5uje55g5uu';
var _baseURI = "https://firestore.googleapis.com/v1/";

function Logout() {
    localStorage.setItem("UserId", "");
    localStorage.setItem("UserDocumentId", "");
    UpdatePageStatus();
    GetGuessworkDataForUser();
}
function UpdatePageStatus() {
    //If user logged in show Logout otherwise show login
    var userId = localStorage.getItem("UserId");
    var loginMenu = $('#loginStatus');
    // Conditionally update the menu item based on userID
    if (userId === null || userId === undefined || userId === "") {
        loginMenu.html('<a href="login.html">Login</a>');
        $('#liReister').html('<a href="signup.html">Register</a>');
        $('#liUpdate').html('<a href="#"></a>');
        $('#btnGuess').attr('disabled', 'disabled');
        $('#txtUserGuessWork').attr('disabled', 'disabled');
    }
    else {
        loginMenu.html('<a href="javascript:Logout()">Logout</a>');
        $('#liReister').html('<a href="#"></a>');
        $('#liUpdate').html('<a href="update.html">Update</a>');
        $('#btnGuess').attr('disabled');
        $('#txtUserGuessWork').attr('disabled');
    }
}
function btnUpdate_onClick() {

    var newPassword = $("#txtNewPassword").val();
    if (newPassword === null ||
        newPassword === undefined ||
        newPassword === "" ||
        newPassword.trim().length === 0) {

        alert("New password cannot be empty");
        return;
    }


    var userDocumentId = localStorage.getItem("UserDocumentId");
    if (userDocumentId === null ||
        userDocumentId === undefined ||
        userDocumentId === "" ||
        userDocumentId.trim().length === 0) {
        return;
    }
    else {

        var requestBody = JSON.parse(userDocumentId);
        var url = _baseURI + requestBody.name;
        requestBody.fields.password.stringValue = newPassword;
        delete requestBody.createTime;
        delete requestBody.updateTime;

        RunPatchQuerySync(url, requestBody);
        window.location.href = "index.html";
    }
}
function btnGuess_onClick() {
    var userWord = $("#txtUserGuessWork").val();
    // Conditionally update the menu item based on userID
    if (userWord === null || userWord === undefined || userWord === "" || userWord.trim().length===0) {
        alert("Word field cannot be empty !")
    }
    else {
        
        var userId = localStorage.getItem("UserId");
        CreateNewUserGuess(userId, userWord);
        //GetGuessworkDataForUser(userId);
    }
    
}
function btnLogin_onClick() {
    var currentDay = generateTimesForToday();
    if ($("#username").val().trim().length == 0 ||
        $("#password").val().trim().length == 0) {
        alert("One of the fields is empty !")
        return;
    }

    var requestBody = {
        "structuredQuery": {
            "from": [
                {
                    "collectionId": "users"
                }
            ],
            "where": {
                "compositeFilter": {
                    "op": "AND",
                    "filters": [
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": "userId"},
                                "op": "EQUAL",
                                "value": { "stringValue": $("#username").val() }
                            }
                        },
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": "password"},
                                "op": "EQUAL",
                                "value": { "stringValue": $("#password").val() }
                            }
                        }
                    ]
                }
            }
        }
    };

    FirebaseRunQuery(requestBody, PostLogin);
}
function btnSignup_onClick() {

    if ($("#firstname").val().trim().length == 0 ||
        $("#lastname").val().trim().length == 0 ||
        $("#email").val().trim().length == 0 ||
        $("#username").val().trim().length == 0 ||
        $("#password").val().trim().length == 0) {
        alert("One of the fields is empty !")
        return;
    }
    if (validateEmail()) {

        var url = "https://firestore.googleapis.com/v1/projects/" + _firebaseProjectID + "/databases/(default)/documents/users";

        var firstName = $("#firstname").val();
        var lastName = $("#lastname").val();
        var email = $("#email").val();
        var password = $("#password").val();
        var username = $("#username").val();

        var requestBody = {
            "fields": {
                "firstName": {"stringValue": firstName},
                "lastName": {"stringValue": lastName},
                "email": {"stringValue": email},
                "userId": {"stringValue": username},
                "password": {"stringValue": password}
            }
        };

        RunPostQuery(url, requestBody, PostSignup);
    }
}
function PostLogin(data) {
    if (data != "Error") {
        if (data.length > 0) {
            if (data[0].document === undefined) {
                alert("User name or password is incorrect");
            }
            else {
                localStorage.setItem("UserId", $("#username").val());
                localStorage.setItem("UserDocumentId", JSON.stringify(data[0].document));
                window.location.href = "index.html";
            }
        }
    }
}
function PostSignup(data) {
    if (data != "Error") {
        sendEmailSync()
            .then(() => {
                localStorage.setItem("UserId", $("#username").val());
                localStorage.setItem("UserDocumentId", JSON.stringify(data));
                window.location.href = "index.html";
            })
            .catch((error) => {
            });
    }
}
function GetGuessworkDataForUser() {
    //Clean table without header
    $('#userGuessTable tr:not(:first)').remove();
    const userId = localStorage.getItem("UserId");
    if (userId === null || userId === undefined || userId === "") { return; }
    var todayWholeHours = generateTimesForToday();
    // Construct the request body
    var requestBody = {
        "structuredQuery": {
            "from": [{"collectionId": "guesswork"}],
            "where": {
                "compositeFilter": {
                    "op": "AND",
                    "filters": [
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": "UserId"},
                                "op": "EQUAL",
                                "value": { "stringValue": userId }
                            }
                        },
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": "GuessDate"},
                                "op": "GREATER_THAN_OR_EQUAL",
                                "value": { "timestampValue": todayWholeHours.startDate }
                            }
                        },
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": "GuessDate"},
                                "op": "LESS_THAN",
                                "value": { "timestampValue": todayWholeHours.endDate }
                            }
                        }
                    ]
                }
            },
            "orderBy": [
                {"field": {"fieldPath": "GuessDate"},"direction": "DESCENDING" }
            ],
            "select": {
                "fields": [
                    { "fieldPath": "GuessDate" },
                    { "fieldPath": "UserWord" },
                    { "fieldPath": "Range" }
                ]
            }
        }
    };

    FirebaseRunQuery(requestBody, CreateGuessTable)

}
function CreateNewUserGuess(userId, userWord) {
    var url = "https://firestore.googleapis.com/v1/projects/" + _firebaseProjectID + "/databases/(default)/documents/guesswork";
    var currentTime = (new Date()).toISOString();
    var range = TrigramDistance(userWord, _todayWord);
    
    var requestBody = {
        "fields": {
            "GuessDate": {"timestampValue": currentTime},
            "Range": {"doubleValue": range},
            "UserId": {"stringValue": userId},
            "UserWord": {"stringValue": userWord}
        }
    };

    RunPostQuery(url, requestBody, PostCreateUserGuess);
}
function PostCreateUserGuess(data) {
    GetGuessworkDataForUser();
}
function CreateGuessTable(payload) {
    
    //Clean table without header
    $('#userGuessTable tr:not(:first)').remove();
    var counter = payload.length;
    payload.forEach(function (guessItem) {
        // Add new rows to the table
        var document = guessItem.document;
        if (document !== undefined) {
            var guessDate = document.fields.GuessDate ? document.fields.GuessDate.timestampValue : '';
            var userWord = document.fields.UserWord ? document.fields.UserWord.stringValue : '';
            var range = document.fields.Range ? document.fields.Range.doubleValue : '';

            //Get only time
            const date = new Date(guessDate);
            const time = date.toTimeString().split(' ')[0];

            $('#userGuessTable').append(
                '<tr>' +
                '<td>' + counter + '</td>' +
                '<td>' + time + '</td>' +
                '<td>' + userWord + '</td>' +
                '<td>' + range + '</td>' +
                '</tr>');
            counter = counter - 1;
        }
    });
}
function FirebaseRunQuery(requestBody, callback) {
    RunPostQuery(
        "https://firestore.googleapis.com/v1/projects/" + _firebaseProjectID + "/databases/(default)/documents:runQuery",
        requestBody,
        callback);
}
function RunPostQuery(url, requestBody, callback) {
    // Make the POST request
    $.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(requestBody),
        success: function (data) {
            // Call the provided callback function with the data
            if (typeof callback === "function") {
                callback(data);
            } else {
                //console.error("Callback is not a function.");
            }
        },
        error: function (error) {
            callback("Error");
        }
    });
}
function ShowTop3Guess() {

    $("#hTop3").text("TOP 3  (" + (new Date()).toLocaleTimeString() + ")");

    var todayWholeHours = generateTimesForToday();
    var requestBody = {
        "structuredQuery": {
            "from": [
                {"collectionId": "guesswork"}
            ],
            "where": {
                "compositeFilter": {
                    "op": "AND",
                    "filters": [
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": "GuessDate"},
                                "op": "GREATER_THAN_OR_EQUAL",
                                "value": { "timestampValue": todayWholeHours.startDate }
                            }
                        },
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": "GuessDate"},
                                "op": "LESS_THAN",
                                "value": { "timestampValue": todayWholeHours.endDate}
                            }
                        }
                    ]
                }
            },
            "select": {
                "fields": [
                    { "fieldPath": "GuessDate" },
                    { "fieldPath": "Range" },
                    { "fieldPath": "UserId" }
                ]
            }
        }
    };
    FirebaseRunQuery(requestBody, RefreshTop3GuessTable);
}
function RefreshTop3GuessTable(data) {
    $('#top3table tr:not(:first)').remove();
    if (data != "Error") {
        if (data.length > 0 && data[0].document !== undefined) {
            var result = findTop3HighRange(data);

            //Clean table without header
            result.forEach(function (guessItem) {
                // Add new rows to the table
                $('#top3table').append('<tr><td>' + guessItem.userId + '</td><td>' + guessItem.range + '</td></tr>');
            });
        }
    }
}
function findTop3HighRange(payload) {
    // Sort the payload based on the "Range" value in descending order
    payload.sort((a, b) => {
        const rangeA = a.document.fields.Range.integerValue || a.document.fields.Range.doubleValue || 0;
        const rangeB = b.document.fields.Range.integerValue || b.document.fields.Range.doubleValue || 0;
        return rangeB - rangeA;
    });

    // Create an array to store the top 3 entries
    const top3Entries = [];

    // Loop through the sorted payload and extract the top 3 entries
    for (let i = 0; i < Math.min(3, payload.length); i++) {
        const entry = payload[i];
        const range = entry.document.fields.Range.integerValue || entry.document.fields.Range.doubleValue || 0;
        const userId = entry.document.fields.UserId.stringValue || "";
        top3Entries.push({ userId, range });
    }

    return top3Entries;
}
function generateTimesForToday() {
    const today = new Date(); //Today
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, '0');
    const day = String(today.getUTCDate()).padStart(2, '0');
    const startDate = `${year}-${month}-${day}T00:00:00Z`;
    const endDate = `${year}-${month}-${day}T23:59:59Z`;

    return { startDate, endDate }
}
function CheckAndCreateDailyWordIfNotExists() {
    var currentDay = generateTimesForToday();

    var requestBody = {
        "structuredQuery": {
            "from": [{"collectionId": "dailyword"}],
            "where": {
                "compositeFilter": {
                    "op": "AND",
                    "filters": [
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": "wordDate"},
                                "op": "GREATER_THAN_OR_EQUAL",
                                "value": { "timestampValue": currentDay.startDate}
                            }
                        },
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": "wordDate"},
                                "op": "LESS_THAN",
                                "value": { "timestampValue": currentDay.endDate}
                            }
                        }
                    ]
                }
            },
            "select": {"fields":{ "fieldPath": "word" }}
        }
    };

    FirebaseRunQuery(requestBody, CreateOrSetDailyWord);
}
function GetTodayDate() {
    //Calculate current day
    var today = new Date();
    var year = today.getUTCFullYear();
    var month = String(today.getUTCMonth() + 1).padStart(2, '0');
    var day = String(today.getUTCDate()).padStart(2, '0');
    return(`${year}-${month}-${day}T00:00:00Z`);
}
function CreateOrSetDailyWord(data) {
    if (data != "Error") {
        if (data.length > 0) {
            if (data[0].document === undefined) {
                //Create daily word
                var url = "https://firestore.googleapis.com/v1/projects/" + _firebaseProjectID + "/databases/(default)/documents/dailyword";
                var currentDay = GetTodayDate();
                _todayWord = getWordOfTheDaySync();

                var requestBody = {
                    "fields": {
                        "wordDate": {"timestampValue": currentDay},
                        "word": {"stringValue": _todayWord}
                    }
                };
                RunPostQuery(url, requestBody, null);
            }
            else {
                _todayWord = data[0].document.fields.word.stringValue;
            }
        }
    }
}
function validateEmail() {
    var emailInput = document.getElementById("email");

    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(emailInput.value)) {
        alert('Invalid email format');
        return false;
    } else {
        return true;
    }
}
function sendEmail() {

    //Public key https://dashboard.emailjs.com/admin/account
    emailjs.init("exywFsYGx-1EmL6Wb");
    var params = {
        firstName: $("#firstname").val(),
        lastName: $("#lastname").val(),
        userName: $("#username").val(),
        toEmail: $("#email").val(),
        fromName: "Semantle registation"
    };
    /*Service ID https://dashboard.emailjs.com/admin */
    const serviceID = "service_s9y7a6c";
    const templateID = "template_xudhsbd";

    emailjs.send(serviceID, templateID, params)
        .then((res) => {
            console.log("E-Mail has been sent");
        })
        .catch((err) => {
            console.log("E-Mail sending failed");
        });
}
function sendEmailSync() {
    return new Promise((resolve, reject) => {
        emailjs.init("exywFsYGx-1EmL6Wb");
        var params = {
            firstName: $("#firstname").val(),
            lastName: $("#lastname").val(),
            userName: $("#username").val(),
            toEmail: $("#email").val(),
            fromName: "Semantle registration"
        };

        const serviceID = "service_s9y7a6c";
        const templateID = "template_xudhsbd";

        emailjs.send(serviceID, templateID, params)
            .then((res) => {
                console.log("E-Mail has been sent");
                resolve(res); // Resolve the promise on success
            })
            .catch((err) => {
                console.log("E-Mail sending failed");
                reject(err); // Reject the promise on error
            });
    });
}
function splitStringIntoArray(str) {
    let result = [];

    for (let i = 0; i < str.length; i += 2) {
        let twoLetters = str.slice(i, i + 2);
        result.push(twoLetters);
    }

    // Check if the number of characters is odd
    if (str.length % 2 !== 0) {
        let lastChar = result.pop(); // Remove the last element
        let secondToLastChar = result[result.length - 1]; // Get the second-to-last element
        let new2 = secondToLastChar[1] + lastChar;
        result.push(new2);
    }

    return result;
}
function TrigramDistance(str1, str2) {
    let result1 = splitStringIntoArray(str1);
    let result2 = splitStringIntoArray(str2);
    let NumOfTrig = 0; // Initialize the count
    let CountRes2Tr = result2.length;

    for (let i = 0; i < result1.length; i++) {
        for (let j = 0; j < result2.length; j++) {
            if (result1[i] === result2[j]) {
                NumOfTrig++;
            }
        }
    }

    let Distance = (NumOfTrig / CountRes2Tr) * 100;
    Distance = Distance.toFixed(3); // Rounds to two decimal places

    return Distance;
}
function getWordOfTheDaySync() {
    try {
        // API endpoint for getting the word of the day
        var apiUrl = `https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=${apiKeyWordnik}`;

        var result;
        $.ajax({
            url: apiUrl,
            type: 'GET',
            dataType: 'json',
            async: false, // Make the request synchronous
            success: function (data) {
                result = data.word;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                throw new Error(`HTTP Error! Status: ${jqXHR.status}`);
            }
        });

        //var definition = result.definitions[0].text;
        //const wordOfTheDayElement = document.getElementById('word-of-the-day');
        //wordOfTheDayElement.innerHTML = `<strong>${word}</strong>: ${definition}`;
        console.log(result);
        return result;
    } catch (error) {
        console.error('Error:', error);
    }
}
function RunPatchQuerySync(url, requestBody) {
    try {

        var dataString = JSON.stringify(requestBody);
        var result;

        $.ajax({
            url: url,
            type: 'PATCH',
            dataType: 'json',
            contentType: 'application/json', 
            async: false, // Make the request synchronous
            data: dataString,
            success: function (data) {
                result = data; 
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(`HTTP Error! Status: ${jqXHR.status}`);
            }
        });

        return result;
    } catch (error) {
        console.error('Error:', error);
    }
}



