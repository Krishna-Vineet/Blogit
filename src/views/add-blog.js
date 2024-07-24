document.addEventListener('DOMContentLoaded', function() {
    ClassicEditor
        .create(document.querySelector('#editor'))
        .then(editor => {
            console.log('Editor was initialized', editor);
        })
        .catch(error => {
            console.error('There was an error initializing the editor', error);
        });

    const addBlogForm = document.getElementById('addBlogForm');
    addBlogForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(this);

        fetch('/add-blog', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Blog added successfully:', data);
            // Optionally redirect or show a success message
        })
        .catch(error => {
            console.error('Error adding blog:', error);
            // Handle error, show an error message, etc.
        });
    });
});
