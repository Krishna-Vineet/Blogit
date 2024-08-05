document.getElementById('deleteAccount').addEventListener('click', deleteAccount);
document.getElementById('logout').addEventListener('click', logout);
document.getElementById('login').addEventListener('click', login);

function deleteAccount() {
    const confirmDelete = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmDelete) {
        fetch('/user/delete-account', { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    alert('Your account has been deleted.');
                    window.location.href = '/';
                } else {
                    throw new Error('Failed to delete account');
                }
            })
            .catch(error => {
                console.error(error);
                alert('There was an error deleting your account. Please try again.');
            });
    }
}

function logout() {
    fetch('/user/logout', { method: 'POST' })
        .then(response => {
            if (response.ok) {
                alert('You have been logged out.');
                window.location.href = '/';
            } else {
                throw new Error('Failed to logout');
            }
        })
        .catch(error => {
            console.error(error);
            alert('There was an error logging you out. Please try again.');
        });
}

// function login() {
//     // Assuming you have a login form with id 'loginForm'
//     const loginForm = document.getElementById('loginForm');
//     const formData = new FormData(loginForm);

//     fetch('/login', {
//         method: 'POST',
//         body: formData
//     })
//         .then(response => {
//             if (response.ok) {
//                 alert('You have been logged in.');
//                 window.location.href = '/';
//             } else {
//                 throw new Error('Failed to login');
//             }
//         })
//         .catch(error => {
//             console.error(error);
//             alert('There was an error logging you in. Please try again.');
//         });
// }
