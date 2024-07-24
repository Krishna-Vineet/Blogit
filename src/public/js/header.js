function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.transform === 'translateX(0px)') {
        sidebar.style.transform = 'translateX(-450px)';
    } else {
        sidebar.style.transform = 'translateX(0px)';
    }
}

function searchBlogs() {
    const query = document.getElementById('searchInput').value;
    if (query) {
        window.location.href = `/search?query=${query}`;
    }
}

function checkEnter(event) {
    if (event.key === 'Enter') {
        searchBlogs();
    }
}
