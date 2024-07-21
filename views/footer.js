document.addEventListener("DOMContentLoaded", function() {
    // Populate trending categories
    fetch('/trending-categories')
        .then(response => response.json())
        .then(data => {
            const trendingCategories = document.getElementById("trendingCategories");
            trendingCategories.innerHTML = "";
            data.categories.forEach(category => {
                const li = document.createElement("li");
                li.textContent = category;
                trendingCategories.appendChild(li);
            });
        })
        .catch(error => console.error('Error:', error));
});

function deleteAccount() {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        fetch('/delete-account', {
            method: 'POST'
        })
        .then(response => {
            if (response.ok) {
                alert('Your account has been deleted.');
                window.location.href = '/';
            } else {
                alert('There was an error deleting your account. Please try again.');
            }
        })
        .catch(error => console.error('Error:', error));
    }
}
