// Some older versions of Mozilla (< v.45 released in 2016) don't use innerText, so for them use textContent despite differences
// In practice, for the HTML tables data it makes no difference, as it typically lacks styling.
// Usage - element[elementTextProperty(element)]
function elementTextProperty(element) {
    if (!element.nodeName) return "";
    if ("innerText" in element) return "innerText";
    return "textContent";
}