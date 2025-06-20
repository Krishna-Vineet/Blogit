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

    ClassicEditor
        .create(document.querySelector('#editor'), {
            toolbar: ['heading', '|', 'bold', 'italic', 'underline', '|', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'undo', 'redo'],
        })
        .then(editor => {
            editorInstance = editor;
        })
        .catch(error => {
            console.error(error);
            showToast('An unexpected error occurred');
        });

    document.getElementById('addBlogForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const btn = document.getElementById('publish');
        btn.innerText = 'Publishing...';
        btn.disabled = true;
        // Ensure the editor content is updated in the textarea
        if (editorInstance) {
            document.getElementById('editor').value = editorInstance.getData();
        }

        const blogTitle = document.getElementById('blogTitle').value;
        const blogImage = document.getElementById('blogImage').files[0];
        const blogContent = document.getElementById('editor').value;
        const categories = Array.from(document.querySelectorAll('.category-chip')).map(chip => chip.textContent.trim().replace(' ×', ''));

        // Form validation
        if (!blogTitle.trim()) {
            btn.disabled = false;
            btn.innerText = 'Publish Blog';
            showToast('Please give a title to your blog.');
            return;
        }
        
        if (!blogImage) {
            btn.disabled = false;
            btn.innerText = 'Publish Blog';
            showToast('Please add an image to your blog.');
            return;
        }
        
        
        if (!blogContent.trim()) {
            btn.disabled = false;
            btn.innerText = 'Publish Blog';
            showToast('Please add some content to your blog.');
            return;
        }
        if (categories.length === 0) {
            btn.disabled = false;
            btn.innerText = 'Publish Blog';
            showToast('Please add at least one category to your blog.');
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
                btn.disabled = false;
                btn.innerText = 'Publish Blog';
                showToast(errorData.errorMessage || 'An unexpected error occurred');
            } else {
                const responseData = await response.json();
                btn.disabled = false;
                btn.innerText = 'Publish Blog';
                showToast('Blog created successfully', 'success');
                setTimeout(() => {
                    if (document.referrer) {
                        window.location.href = document.referrer;
                    } else {
                        window.location.href = '/'; // Redirect to home page
                    }
                }, 200);
            }
        } catch (error) {
            btn.disabled = false;
            btn.innerText = 'Publish Blog';
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
            option.value = selectedCategory;
            option.text = selectedCategory;
            document.getElementById('categorySelect').appendChild(option);
            parent.remove();
        });
    });
});
