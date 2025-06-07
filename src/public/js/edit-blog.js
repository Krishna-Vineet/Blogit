document.addEventListener('DOMContentLoaded', () => {
    
    function showToast(message, type = "error") {
        Toastify({
            text: message,
            style: {
                borderRadius: "10px",
                color: "#fff",
                padding: "15px 10px",
                background: type === "success" ? "#28a745" : "#ff4141",
            },
            duration: 2000,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
        }).showToast();
    }
    
    let editorInstance;
    let initialData = {};
    ClassicEditor
        .create(document.querySelector('#editor'), {
            toolbar: ['heading', '|', 'bold', 'italic', '|', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'undo', 'redo'],
        })
        .then(editor => {
            editorInstance = editor;

            // Store initial data to detect changes later
            initialData = {
                title: document.getElementById('blogTitle').value,
                content: editorInstance.getData(),
                categories: Array.from(document.querySelectorAll('.category-chip')).map(chip => chip.textContent.trim().replace(' ×', '')),
                image: document.getElementById('imagePreview').querySelector('img')?.src || null
            };
        })
        .catch(error => {
            console.error(error);
            showToast('An unexpected error occurred');
        });

    document.getElementById('addBlogForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        if (editorInstance) {
            document.getElementById('editor').value = editorInstance.getData();
        }

        const blogTitle = document.getElementById('blogTitle').value;
        const blogImage = document.getElementById('blogImage').files[0];
        const blogContent = document.getElementById('editor').value;
        const categories = Array.from(document.querySelectorAll('.category-chip')).map(chip => chip.textContent.trim().replace(' ×', ''));
        const blogId = document.getElementById('pageHeading').getAttribute('data-blogId');

        // Validate required fields
        if (!blogTitle || !blogContent || categories.length === 0) {
            showToast("Title, content, and at least one category are required.");
            return;
        }

        // Prepare form data only for the changed fields
        const formData = new FormData();
        let isDataChanged = false;

        if (blogTitle !== initialData.title) {
            formData.append('title', blogTitle);
            isDataChanged = true;
        }

        if (blogContent !== initialData.content) {
            formData.append('content', blogContent);
            isDataChanged = true;
        }

        if (JSON.stringify(categories) !== JSON.stringify(initialData.categories)) {
            categories.forEach(category => formData.append('categories[]', category));
            isDataChanged = true;
        }

        if (blogImage) {
            formData.append('image', blogImage);
            isDataChanged = true;
        }

        // If no data has changed, no need to send a request
        if (!isDataChanged) {
            showToast('No changes detected.');
            return;
        }

        try {
            const response = await fetch(`/blog/update/${blogId}`, {
                method: 'PATCH',
                body: formData // Automatically sets the correct Content-Type
            });

            if (!response.ok) {
                const errorData = await response.json();
                showToast(errorData.errorMessage || 'An unexpected error occurred');
            } else {
                showToast('Blog updated successfully', 'success');
                setTimeout(() => {
                    window.location.href = document.referrer || '/';
                }, 200);
            }
        } catch (error) {
            console.error(error);
            showToast('An unexpected error occurred');
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

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = btn.parentElement;
            const option = document.createElement('option');
            option.value = parent.childNodes[0].nodeValue.trim();
            option.text = option.value;
            categorySelect.appendChild(option);
            parent.remove();
        });
    });
});
