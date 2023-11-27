// generate text files with input parameter being an array of table IDs
function generateTextFile(tableIds, options) {
    var files = [];
    var separatorChar = ',';
    if (options.fileFormat === "tab") {
        separatorChar = '\t';
    }

    var newLineChar = '\r\n'; // Carriage Return + Line Feed
    if (options.newLine === "lf") {
        console.log('generateTextFile nl')
        newLineChar = '\n';
    }

    tableIds.forEach(function(tableId) {
        var fileRows = [];
        var tableRows = HTMLTables[tableId].querySelectorAll('tr');
        for (var i = 0; i < tableRows.length; i++) {
            var tableCells = tableRows[i].querySelectorAll('td');
            var fileRowCells = [];
            for (var j = 0; j < tableCells.length; j++) {
                // 160 = '&nbsp;'
                if (tableCells[j][elementTextProperty(tableCells[j])] === String.fromCharCode(160)) {
                    if (options.convertNbsp === "nbsp-yes") {
                        fileRowCells.push(' ');
                    } else {
                        fileRowCells.push('');
                    }
                } else {
                    fileRowCells.push(tableCells[j][elementTextProperty(tableCells[j])]);
                }
            }

            // generate a file row
            fileRows.push(fileRowCells.join(separatorChar));
        }

        // generate a file for download
        files.push(
            {
                tableId: tableId,
                fileContent: fileRows.join(newLineChar)
            }
        );
    });

    return files;
}