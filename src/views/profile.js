document.addEventListener('DOMContentLoaded', function() {
    const changeAvatarLink = document.getElementById('changeAvatarLink');
    const avatarFileInput = document.getElementById('avatarFileInput');

    changeAvatarLink.addEventListener('click', function(event) {
        event.preventDefault();
        avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);

            fetch('/update-avatar', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error updating avatar');
                }
                return response.json();
            })
            .then(data => {
                console.log('Avatar updated successfully:', data);
                // Update UI with new avatar if needed
            })
            .catch(error => {
                console.error('Error updating avatar:', error);
                // Handle error, show an error message, etc.
            });
        }
    });
});
