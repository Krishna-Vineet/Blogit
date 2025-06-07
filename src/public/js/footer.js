document.getElementById('deleteAccount')?.addEventListener('click', deleteAccount);
document.getElementById('logout')?.addEventListener('click', logout);
document.getElementById('login')?.addEventListener('click', login);

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

function deleteAccount() {
    const confirmDelete = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmDelete) {
        fetch('/user/delete-account', { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    showToast('Your account has been deleted.', 'success');
                    window.location.href = '/';
                } else {
                    showToast('There was an error deleting your account. Please try again.');
                }
            })
            .catch(error => {
                console.error(error);
                showToast('There was an error deleting your account. Please try again.');
            });
    }
}

function sendFeedback() {
    const feedback = document.getElementById('feedback-textarea').value;
    const btn = document.getElementById('send-feedback');
    if (!feedback.trim()) {
        showToast('Please enter some feedback.');
        return;
    }
    btn.innerHTML = 'Sending...';
    fetch('/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback })
    })
        .then(response => {
            if (response.ok) {
                showToast('Thank you for your feedback!', 'success');
            } else {
                showToast('There was an error sending your feedback. Please try again.');
            }
            btn.innerHTML = 'Send';
            document.getElementById('feedback-textarea').value = '';
        })
        .catch(error => {
            console.error(error);
            showToast('There was an error sending your feedback. Please try again.');
            btn.innerHTML = 'Send';
        });
}

function logout() {
    fetch('/user/logout', { method: 'POST' })
        .then(response => {
            if (response.ok) {
                showToast('You have been logged out.', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 200)
            } else {
                showToast('There was an error logging you out. Please try again.');
            }
        })
        .catch(error => {
            console.error(error);
            showToast('There was an error logging you out. Please try again.');
        });
}

