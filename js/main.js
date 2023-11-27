/*
    Author:     Nikolay Kolov
    Date:       2023-11-05
    Comment:    The JavaScript code is in multiple JavaScript files that are loaded without ES6 modules
    because this project should be able to be run by just opening the index.html file and the browser handling the rest.
    Unfortunately, using ES6 modules in modern browsers and running an HTML/JavaScript project locally triggers 
    a CORS policy violation, since CORS doesn't apply to the 'file://' protocol, which is used for fetching modules locally.
    An alternative would be to use a local webserver, but this would be needless complexity for a simple utility tool like this one.
    Another alternative for Chromium browsers would be to run the browser with the flag '--allow-file-access-from-files', but this
    represents a security risk.
    So, the JavaScript files are loaded in the index.html file with separate script tags in order of dependency from least dependent first
    and most dependent last. 
*/

// Initialize variables and important constants
// File conversion options
var optionsConvertFile = {
    fileFormat: "csv",          // comma ot tab separated text file, values: ["csv", "tab"]
    newLine: "crlf",            // carriage return + line feed or just line feed for new line in text file, values: ["crlf", "lf"]
    convertNbsp: "nbsp-yes",    // convert HTML No beak space (&nbsp;) to a space (' '), otherwise leave blank, values: ["nbsp-yes", "nbsp-no"]
};

var labels = {
    processingFile: "Processing file. Please wait ...",
    processingFileMB: function(name, size) {
        return "Processing file <strong>" + 
        escapeHTML(name) + "</strong> with file size <strong>" + 
        (size / (1024 * 1024)).toFixed(2) + " MB</strong>. Please wait ...";
    },
    processingFileError: "Error reading file",
    processingFileAbort: "User cancelled file processing",
    processingFileHTMLMB: function(name, size) {
        return "Parsing HTML of file <strong>" + 
        escapeHTML(name) + "</strong> with file size <strong>" + 
        (size / (1024 * 1024)).toFixed(2) + " MB</strong>. Please wait ...";
    },
    processingFileHTMLError: "Error processing file. Check for wrong HTML code.",
    fileNameSizeMB: function(name, size) {
        return "Table/s from file - <strong>" + 
        escapeHTML(name) + "</strong> with file size <strong>" + 
        (size / (1024 * 1024)).toFixed(2) + " MB</strong>";
    },
    processingFileTablesMB: function(name, size) {
        return "Select tables from file <strong>" + 
        escapeHTML(name) + "</strong> with file size <strong>" + 
        (size / (1024 * 1024)).toFixed(2) + " MB</strong> " +
        "for processing with the appropriate options";
    },
    processingFileNoData: "No data for processing.",
    processTableNow: "Process table now",
    generateFile: "Generating file(s), please wait...",
    generateFileSuccess: "Please download the generated file(s)",
    selectTable: "Select table",
    unselectTable: "Unselect table",
    selectAll: "Select all",
    unselectAll: "Unselect all",
    tablesSelectedLabel: function(number) {
        return number + " table(s) selected";
    },
    tableHiddenRows: function(hiddenRows, totalRows) {
        return hiddenRows + " row(s) hidden, table has a total of " + totalRows + " rows.";
    },
    statusBegin: "Upload a file to begin processing",
    toggleOptionsLabelOpen: "Hide processing options",
    toggleOptionsLabelClose: "Show processing options",
};

// read the file that the user inputs
var reader = new FileReader();
// The text content of the HTML input file as a string
var fileContents = '';
// parse text to HTML elements
var fileParser = new DOMParser();
var HTMLTables = [];

// HTML elements
var fileInput = document.querySelector('#HTML-file-upload');
var fileUploadLabel = document.querySelector('#HTML-file-upload-label');
var resetButton = document.querySelector('#reset-button');
var statusEl = document.querySelector('#process-status');
var tablesEl = document.querySelector('#process-data');
var tablesOverlay = tablesEl.querySelector('.tables__overlay')
var selectAllButton = tablesEl.querySelector('#select-all');
var processSelectedButton = tablesEl.querySelector('#process-selected');
var tablesLabel = tablesEl.querySelector('span.tables__selected-label');
var tablesListEl = tablesEl.querySelector('div.tables__container');
var controlsEl = document.querySelector('#file-controls-secondary');
var toggleEl = controlsEl.querySelector('#toggle-convert-options');
var toggleOptions = controlsEl.querySelector('#toggle-convert-options-label');
var radioOptions = document.querySelectorAll('input[type="radio"]');

// set file processing options from radio controls
function setFileConversionOptions(e) {
    optionsConvertFile[e.target.name] = e.target.value;
}

(function () {
    for(var i = 0; i < radioOptions.length; i++) {
        radioOptions[i].addEventListener("click", setFileConversionOptions);
    }
})();

// Show/hide file conversion options 
toggleOptions.addEventListener("click", function() {
    if (toggleEl.classList.contains("controls__toggle-filter--open")) {
        toggleEl.classList.remove("controls__toggle-filter--open");
        toggleEl.classList.add("controls__toggle-filter--close");
        toggleOptions[elementTextProperty(toggleOptions)] = labels.toggleOptionsLabelClose;
    } else {
        toggleEl.classList.add("controls__toggle-filter--open");
        toggleEl.classList.remove("controls__toggle-filter--close");
        toggleOptions[elementTextProperty(toggleOptions)] = labels.toggleOptionsLabelOpen;
    }
});

// Function that enables the process file button when the user uploads a file
function beginFileProcessing(event) {
    if (event.target.files.length) {
        var file = event.target.files[0];
        processFile(file);
    }
    // On no file selected (user clicked cancel), reset
    else {
        reset();
    }
}

fileInput.addEventListener("change", beginFileProcessing);
resetButton.addEventListener("click", reset);

// Reset the user interface so that a new file can be read
function reset() {
    HTMLTables = [];
    tablesListEl.innerHTML = "";
    fileContents = "";
    setSelectedTablesControls(0);
    selectAllButton[elementTextProperty(tablesLabel)] = labels.selectAll;
    // reset radio options toggle
    toggleEl.querySelector('#csv').click();
    toggleEl.querySelector('#crlf').click();
    toggleEl.querySelector('#nbsp-yes').click();

    // clear file input on IE 11
    if (fileInput.files.length){
        fileInput.value = null;
    }

    // If file reader is still in status loading (readyState === 1), abort it 
    if (reader.readyState === 1) {
        console.log('reader.readyState abort');
        abortFileRead(reader);
    }

    // make file input visible
    if (fileUploadLabel.classList.contains("controls--hidden")) {
        fileUploadLabel.classList.remove("controls--hidden");
    }

    // hide elements related to file processing
    if (!tablesEl.classList.contains("tables--hidden")) {
        tablesEl.classList.add("tables--hidden");
    }

    if (!resetButton.classList.contains("controls--hidden")){
        resetButton.classList.add("controls--hidden");
    }
    resetButton.disabled = true;

    statusEl[elementTextProperty(statusEl)] = labels.statusBegin;

    // Hide entire section with controls and radio buttons for options
    if (!controlsEl.classList.contains("controls--hidden")) {
        controlsEl.classList.add("controls--hidden");
    }

    if (tablesOverlay.classList.contains('tables__overlay--show')) {
        tablesOverlay.classList.remove('tables__overlay--show');
    }
}

// file reader event handler functions
function hanldeOnLoad(e) {
    // Can only abort file read
    resetButton.disabled = true;
    console.log(e.type + ": " + e.loaded);
    fileContents = reader.result;
    var file = fileInput.files[0];
    statusEl.innerHTML = labels.processingFileHTMLMB(file.name, file.size);

    // add a small timeout to update the status for the user, otherwise the interface freezes
    setTimeout(function() {
        parseHTML();
    }, 10);
}

function hanldeOnError(e) {
    console.log(e.type + ": " + e.loaded);
    statusEl[elementTextProperty(statusEl)] = labels.processingFileError;
}

function handleOnProgress(e) {
    console.log(e.type + ": " + e.loaded);
}

// read the file and pass it to the DOM parser
function processFile(file) {
    // set label
    statusEl.innerHTML = labels.processingFileMB(file.name, file.size);

    // show and enable reset button
    if (resetButton.classList.contains("controls--hidden")){
        resetButton.classList.remove("controls--hidden");
    }
    resetButton.disabled = false;

    // hide file input label
    if (!fileUploadLabel.classList.contains("controls--hidden")) {
        fileUploadLabel.classList.add("controls--hidden");
    }

    // remove file reader events to avoid adding duplicate event handlers
    reader.removeEventListener("load", hanldeOnLoad);
    reader.removeEventListener("error", hanldeOnError);
    reader.removeEventListener("progress", handleOnProgress);

    // add file reader events
    reader.addEventListener("load", hanldeOnLoad);
    reader.addEventListener("error", hanldeOnError);
    reader.addEventListener("progress", handleOnProgress);
    
    reader.readAsText(file);
}

function abortFileRead(fileReader) {
    statusEl[elementTextProperty(statusEl)] = labels.processingFileAbort;
    fileReader.abort();
}

// Use DOM parser to read the HTML table data
function parseHTML() {
    var docFP = fileParser.parseFromString(fileContents, 'text/html');
    var errorNode = docFP.querySelector("parsererror");

    if (errorNode) {
        console.log('parsererror');
        statusEl[elementTextProperty(statusEl)] = labels.processingFileHTMLError;
    } else {
        var tablesArray = docFP.querySelectorAll('table');
        if (tablesArray && tablesArray.length !== undefined) {
            HTMLTables = tablesArray;
            
            displayTables(HTMLTables);
            // enable after 
            setTimeout(function() {
                resetButton.disabled = false;

                // Show entire section with controls and radio buttons for options
                if (controlsEl.classList.contains("controls--hidden")) {
                    controlsEl.classList.remove("controls--hidden");
                }

            }, 10);            
        } else {
            statusEl[elementTextProperty(statusEl)] = labels.processingFileNoData;
        }
    }
}

// display first up to 5 rows from table
function displayTables(tablesArray) {
    for (var t = 0; t < tablesArray.length; t++) {
        // generate 1 article HTML element to contain a table with controls
        var tableWithData = tablesArray[t];
        var container = document.createElement('article');
        container.classList.add('tables__table');
        container.dataset.tableId = t;
        container.dataset.selected = "false";
        var header = document.createElement('header');
        var tableTitle = document.createElement('span');

        // immediate download of table button
        var buttonTableProcess = document.createElement('button');
        buttonTableProcess[elementTextProperty(buttonTableProcess)] = labels.processTableNow;
        buttonTableProcess.dataset.tableId = t;
        buttonTableProcess.addEventListener('click', createTabDelimitedFile);
        // multiple classList.add not supported by IE 11
        buttonTableProcess.classList.add("action-button");
        buttonTableProcess.classList.add("action-button--small");

        // select for bulk processing button
        var buttonSelectTable = document.createElement('button');
        buttonSelectTable[elementTextProperty(buttonSelectTable)] = labels.selectTable;
        buttonSelectTable.dataset.tableId = t;
        buttonSelectTable.dataset.selected = "false";
        buttonSelectTable.addEventListener('click', handleSelectTable);
        buttonSelectTable.classList.add("action-button");
        buttonSelectTable.classList.add("action-button--small");
        buttonSelectTable.classList.add("action-button--select");

        // get first 5 data rows (assuming header) of table and display them
        var table5RowsMax = document.createElement('table');
        var tableRows = tableWithData.querySelectorAll('tr');
        if (tableRows.length) {
            var maxLength = tableRows.length > 5 ? 5 : tableRows.length;
            for (var i = 0; i < maxLength; i++) {
                if (tableRows[i]) {
                    var cloneNode = tableRows[i].cloneNode(true);
                    table5RowsMax.appendChild(cloneNode);
                }
            }

            // if table has more than 5 rows, add a row with label showing that the other rows are hidden and total table rows 
            if (maxLength < tableRows.length) {
                var showMoreRow = document.createElement('tr');
                var showMoreRowData = document.createElement('td');
                showMoreRowData[elementTextProperty(showMoreRowData)] = labels.tableHiddenRows((tableRows.length - maxLength), tableRows.length);
                var colSpanNumber = tableRows[4].querySelectorAll('td').length;
                showMoreRowData.setAttribute("colspan", colSpanNumber);
                showMoreRowData.classList.add("hidden-rows");
                showMoreRow.appendChild(showMoreRowData);
                table5RowsMax.appendChild(showMoreRow);
            }
        }

        tableTitle[elementTextProperty(tableTitle)] = "Table " + (t + 1);

        header.appendChild(tableTitle);
        header.appendChild(buttonTableProcess);
        header.appendChild(buttonSelectTable);
        container.appendChild(header);
        container.appendChild(table5RowsMax);
    
        tablesListEl.appendChild(container);
    
        if (tablesEl.classList.contains("tables--hidden")) {
            tablesEl.classList.remove("tables--hidden");
        }
    }
    
    var file = fileInput.files[0];
    statusEl.innerHTML = labels.processingFileTablesMB(file.name,file.size);
}

// Generate tab delimited text file content
function createTabDelimitedFile(event) {
    statusEl[elementTextProperty(statusEl)] = labels.generateFile;
    console.log('createTabDelimitedFile tableElement', HTMLTables[parseInt(event.target.dataset.tableId)]);
    var file = generateTextFile([parseInt(event.target.dataset.tableId)], optionsConvertFile)[0];
    var filename = fileInput.files[0].name;
    var extIndex = filename.lastIndexOf('.');
    filename = filename.substring(0, extIndex) + '.txt';
    statusEl[elementTextProperty(statusEl)] = labels.generateFileSuccess;
    forceDownload(filename, file.fileContent);
}

// update user interface on selection of table for processing
function handleSelectTable(event) {
    var tableId = event.target.dataset.tableId;
    var selected = event.target.dataset.selected;
    var tablesList = document.querySelectorAll("article.tables__table");
    var numSelected = 0;
    for (var i = 0; i < tablesList.length; i++) {
        if (tablesList[i].dataset.selected === "true") {
            numSelected++;
        }
    }
    var numTables = tablesList.length;

    // if the user pressed the Select/Unselect all button
    if (event.target.id === 'select-all') {
        if (numTables === numSelected) {
            for (var j = 0; j < tablesList.length; j++) {
                var tableButton = tablesList[i].querySelector('button.action-button--select');
                if (tablesList[i].dataset.selected === "true") {
                    tableButton.click();
                }
                tablesList[i].dataset.selected === "false";
            }

            selectAllButton[elementTextProperty(selectAllButton)] = labels.selectAll;
            setSelectedTablesControls(0);
        } else {
            for (k = 0; k < tablesList.length; k++) {
                var tableButton = tablesList[k].querySelector('button.action-button--select');
                if (tablesList[k].dataset.selected === "false") {
                    tableButton.click();
                }
                tablesList[k].dataset.selected === "true";
            }

            selectAllButton[elementTextProperty(selectAllButton)] = labels.unselectAll;
            setSelectedTablesControls(numTables);
        }

        // exit function
        return;
    }

    // if the user pressed the individual select table
    if (selected === "false") {
        event.target.dataset.selected = "true";
        event.target[elementTextProperty(event.target)] = labels.unselectTable;
        numSelected++;
        setSelectedTablesControls(numSelected);
        tablesList[tableId].dataset.selected = "true";
    } else {
        event.target.dataset.selected = "false";
        event.target[elementTextProperty(event.target)] = labels.selectTable;
        numSelected--;
        setSelectedTablesControls(numSelected);
        tablesLabel[elementTextProperty(tablesLabel)] = labels.tablesSelectedLabel(numSelected);
        tablesList[tableId].dataset.selected = "false";
    }

    if (numSelected === numTables) {
        selectAllButton[elementTextProperty(selectAllButton)] = labels.unselectAll;
    } else {
        selectAllButton[elementTextProperty(selectAllButton)] = labels.selectAll;
    }
}

function setSelectedTablesControls(numberSelected) {
    if (numberSelected === 0) {
        processSelectedButton.disabled = true;
    } else {
        processSelectedButton.disabled = false;
    }
    tablesLabel[elementTextProperty(tablesLabel)] = labels.tablesSelectedLabel(numberSelected);
}

selectAllButton.addEventListener('click', handleSelectTable);

function handleProcessSelected() {
    tablesLabel[elementTextProperty(tablesLabel)] = labels.generateFile;
    if (!tablesOverlay.classList.contains('tables__overlay--show')) {
        tablesOverlay.classList.add('tables__overlay--show')
    }

    // use this setTimeout trick to update the status label, otherwise it wont show 
    setTimeout(function() {
        var tablesElems = tablesListEl.querySelectorAll("article.tables__table");
        var tableIds = [];
    
        for(var i = 0; i < tablesElems.length; i++) {
            if (tablesElems[i].dataset.selected === "true") {
                tableIds.push(parseInt(tablesElems[i].dataset.tableId));
            }
        }

        console.log('handleProcessSelected optionsConvertFile', optionsConvertFile)
        var files = generateTextFile(tableIds, optionsConvertFile);

        for(var j = 0; j < files.length; j++) {
            var tableEl;
            for (var k = 0; k < tablesElems.length; k++) {
                if (tablesElems[k].dataset.tableId === files[j].tableId.toString()) {
                    tableEl = tablesElems[k];
                    break;
                }
            }
    
            var header = tableEl.querySelector("header");
            var checkLink = header.querySelector("a");
    
            // if table container already has a generated download link, remove it
            if (checkLink !== null) {
                header.removeChild(checkLink);
            }
    
            var filename = fileInput.files[0].name;
            var extIndex = filename.lastIndexOf('.');
            filename = filename.substring(0, extIndex) + '.txt';
        
            var blob = new Blob([files[j].fileContent], {type:  "text/plain;charset=utf-8;"});
            var a = document.createElement('a');
            a.classList.add('table__download-link')
            a.setAttribute('href', URL.createObjectURL(blob));
            a.setAttribute('download', filename);
            a.innerText = "Download table";

            if (window.navigator.msSaveBlob) {
                a.addEventListener('click', function() {
                    window.navigator.msSaveOrOpenBlob(blob, filename);
                });
            }

            tableEl.querySelector("header").appendChild(a);
        }
    
        tablesLabel[elementTextProperty(tablesLabel)] = labels.generateFileSuccess;
        if (tablesOverlay.classList.contains('tables__overlay--show')) {
            tablesOverlay.classList.remove('tables__overlay--show')
        }
    }, 10)
    
}

processSelectedButton.addEventListener('click', handleProcessSelected);

function hanldeDownloadLinkClick(e) {
    // check is using IE11, it handles anchor tag differently
    if (window.navigator.msSaveBlob) {
        window.navigator.msSaveOrOpenBlob(blob, fileName);
        return;
    }
}
