document.addEventListener('DOMContentLoaded', () => {
    let editorInstance;

    ClassicEditor
        .create(document.querySelector('#editor'), {
            toolbar: ['heading', '|', 'bold', 'italic', 'underline', '|', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'undo', 'redo'],
        })
        .then(editor => {
            editorInstance = editor;
        })
        .catch(error => {
            console.error(error);
        });

    document.getElementById('addBlogForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        // Ensure the editor content is updated in the textarea
        if (editorInstance) {
            document.getElementById('editor').value = editorInstance.getData();
        }

        const blogTitle = document.getElementById('blogTitle').value;
        const blogImage = document.getElementById('blogImage').files[0];
        const blogContent = document.getElementById('editor').value;
        const categories = Array.from(document.querySelectorAll('.category-chip'))
            .map(chip => chip.textContent.trim().replace('×', '').trim());

        // Form validation
        if (!blogTitle || !blogContent) {
            alert("Title and content are required");
            return;
        }

        const formData = new FormData();
        formData.append('title', blogTitle);
        formData.append('content', blogContent);
        formData.append('categories', JSON.stringify(categories));
        if (blogImage) {
            formData.append('image', blogImage);
        }

        try {
            const response = await fetch('/blog/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.errorMessage || 'An unexpected error occurred');
            } else {
                const responseData = await response.json();
                alert('Blog created successfully');
                window.location.href = '/';
            }
        } catch (error) {
            alert('An unexpected error occurred');
        }
    });

    document.getElementById('blogImage').addEventListener('change', function(event) {
        const file = event.target.files[0];
        const fileInfo = document.getElementById('fileInfo');
        const imagePreview = document.getElementById('imagePreview');

        if (file) {
            fileInfo.textContent = file.name;

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);
            }
            reader.readAsDataURL(file);
            console.log(reader);
            
        } else {
            fileInfo.textContent = 'Select the blog Image';
            imagePreview.innerHTML = '';
        }
    });

    const categorySelect = document.getElementById('categorySelect');
    const categoryContainer = document.getElementById('categoryContainer');

    categorySelect.addEventListener('change', function() {
        const selectedCategory = categorySelect.value;
        if (selectedCategory) {
            const chip = document.createElement('div');
            chip.className = 'category-chip';
            chip.innerHTML = `${selectedCategory} <button class="remove-btn">&times;</button>`;
            categoryContainer.appendChild(chip);

            chip.querySelector('.remove-btn').addEventListener('click', function() {
                categoryContainer.removeChild(chip);
                const option = document.createElement('option');
                option.value = selectedCategory;
                option.text = selectedCategory;
                categorySelect.appendChild(option);
            });

            categorySelect.removeChild(categorySelect.options[categorySelect.selectedIndex]);
        }
    });
});
