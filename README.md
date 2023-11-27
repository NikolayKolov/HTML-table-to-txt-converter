# Convert an HTML table to a CSV or tab separated text file
## The need for conversion
My work requires working with large data files (more than 20 MB in size), which are HTML files containing data in HTML tables.
These files must be be converted to CSV or tab separted text files in order to be imported into various databases.
The method for conversion is to open the file in a browser, open Excel and format the spreadsheet into text, and then paste the data from the browser.
The Excel file would then be saved in either CSV or tabs separated text file format.
This would preserve the data and its formatting (mostly date and leading zeroes).

## The problem with this approach
However, this would be very slow, and it would take the browser sometimes 20 or more minutes to open and load the HTML file in the browser.
It would also sometimes crash the browser, thus forcing the user to restart the process.

## The solution
The solution is to create a tool to allow the user to input an HTML file containing the data, choose which table(s) from it to convert to the required format, choose file options for conversion, and download the generated text file(s).
The solution would also need to work under old browsers (like IE11), because the company has an internal network with legacy software that shouldn't be changes without pressing need.