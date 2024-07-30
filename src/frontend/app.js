document.addEventListener('DOMContentLoaded', () => {
    function navigate(viewId) {
        //hide all views
        document.querySelectorAll(".app-view").forEach((view) => {
            view.classList.add('hidden');
        });

        //show the requested view
        document.getElementById(viewId).classList.remove('hidden');

        //change logo based on the view
        changeLogo(viewId);
    }
    //fun function that I found that can change the image of the logo based on the screen
    function changeLogo(viewId) {
        const logoElement = document.getElementById('view-logo');
        switch(viewId) {
            case 'signin-view':
                logoElement.src = 'logo.png';
                break;
            case 'signup-view':
                logoElement.src = 'logo2.png';
                break;
            case 'forgot-password-view':
                logoElement.src = 'logo3.png';
                break;
            case 'home-view':
                logoElement.src = 'logo.png';
                break;
            default:
                logoElement.src = 'logo.png';
        }
    }

    //navigation event listeners
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        navigate('signup-view');
    });

    document.getElementById('show-signin').addEventListener('click', (e) => {
        e.preventDefault();
        navigate('signin-view');
    });

    document.getElementById('show-forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        navigate('forgot-password-view');
    });

    document.getElementById('back-to-signin').addEventListener('click', (e) => {
        e.preventDefault();
        navigate('signin-view');
    });

    //home navigation
    document.getElementById('home').addEventListener('click', () => navigate('home-view'));
    document.getElementById('rewards').addEventListener('click', () => navigate('rewards-view'));
    document.getElementById('messages').addEventListener('click', () => navigate('messages-view'));
    document.getElementById('settings').addEventListener('click', () => navigate('settings-view'));

    //initialize with the signin view
    navigate('signin-view');

    setupPasswordToggles();

    //form submission event listeners
    document.getElementById('signin-form').addEventListener('submit', function(e) {
        e.preventDefault();
        navigate('home-view');
    });

    document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert("Registration successful!");
        navigate('signin-view');
    });

    document.getElementById('forgot-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert("Password reset instructions sent to your email");
        navigate('signin-view');
    });

});

function setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? 'eye1.png' : 'eye2.png';
        });
    });
}