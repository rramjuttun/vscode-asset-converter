// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const form = document.getElementById('constructorForm');
    const submitButton = document.getElementById('submitButton');

    submitButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default form submission behavior

        if(validateFormFields()) {
            const constructorArgs = []; // Object to store form data
    
            // Extract form data and store it in the formData object
            form.querySelectorAll('input').forEach(input => {
                constructorArgs.push(input.value);
            });
        
            // Send the formData object to the extension
            vscode.postMessage({type: "constructorArgs", data: constructorArgs});
        } else {
            vscode.postMessage({type: "invalidInput", data: ""});
        }

    });  
}());

function validateFormFields() {
    const form = document.getElementById('constructorForm');
    const inputs = form.querySelectorAll('input');
  
    for (const input of inputs) {
      if(!input.value.trim()) {
        return false;
      }
    }
    return true;
  }