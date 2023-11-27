// Generate text file for immediate download
// Use IIFE module pattern to prevent pollution of global namespace with variables
const forceDownload = (function fn() {
    return function (fileName, fileContent) {
        // create file content, use UTF8 encoding as is typical for CSV, tab delimited files by default
        var blob = new Blob([fileContent], {type:  "text/plain;charset=utf-8;"});

        // check is using IE11, it handles anchor tag differently
        if (window.navigator.msSaveBlob) {
            window.navigator.msSaveOrOpenBlob(blob, fileName);
            return;
        }

        // Otherwise, proceed with anchir tag with download attribute
        // Generate an invisible href
        const a = document.createElement('a');
        a.style.display = 'none';

        // the file data
        a.setAttribute('href', URL.createObjectURL(blob));
        // the file name
        a.setAttribute('download', fileName);

        document.body.appendChild(a);

        // click the link to show download dialog
        a.click();

        // remove the href
        URL.revokeObjectURL(a.href);
        document.body.removeChild(a);
    }
})();