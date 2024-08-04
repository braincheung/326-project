document.addEventListener('DOMContentLoaded', () => {
    //added the URL to the back-end server like ex17
    const URL = "http://localhost:3260"; // Back-end server URL

    function navigate(viewId) {
        document.querySelectorAll(".app-view").forEach((view) => {
            view.classList.add('hidden');
        });
    
        document.getElementById(viewId).classList.remove('hidden');
    
        const nav = document.querySelectorAll('nav');
        nav.forEach(n => {
            if (viewId === 'home-view' || viewId === 'rewards-view' || viewId === 'settings-view') {
                n.classList.remove('hidden');
                updateActiveNavLink(viewId);
            } else {
                n.classList.add('hidden');
            }
        });
        changeLogo(viewId);
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

    //rewards view navigation
    document.getElementById('rewards').addEventListener('click', () => {
        updateRewardsView();
        navigate('rewards-view');
    });


    // Home navigation
    document.getElementById('home').addEventListener('click', () => navigate('home-view'));
    document.getElementById('rewards').addEventListener('click', () => navigate('rewards-view'));
    document.getElementById('settings').addEventListener('click', () => navigate('settings-view'));

    //initialize with the signin view
    navigate('signin-view');

    setupPasswordToggles();

    //form submission event listeners
    //edited signin-form 8/3/24
    //the signin form will now send a POST request to the server
    //it will send the email and password to the server
    //if the server responds with a 200 status code, the user will be navigated to the home view
    //if the server responds with an error, the user will see an alert with the error message
    document.getElementById('signin-form').addEventListener('submit', async function(e) {
        //prevent the default form submission
        e.preventDefault();
        const formData = new FormData(this);
        const data ={
            email: formData.get('email'),
            password: formData.get('password')
        };
        console.log('Sign-in form data:', data); 
        try{
            const response = await fetch(`${URL}/signin`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const result = await response.json();
            console.log('Sign-in server response:', result); // Debugging
            if(response.ok){
                navigate('home-view');
            }else{
                alert(result.message);
            }
        }catch(error){
            console.error('Error during sign-in:', error);
            alert("An error occurred during sign-in. Please try again.");
        }
    });
    //edited the sign up form as well
    //the sign up form will now send a POST request to the server
    //it will send the user's first name, last name, email, password, phone number, promo, and birthday to the server
    //if the server responds with a 200 status code, the user will see an alert that says "Registration successful!"
    //if the server responds with an error, the user will see an alert with the error message
    //if the server responds with a 409 status code, the user will see an alert that says "User already exists"
    document.getElementById('signup-form').addEventListener('submit', async function(e){
        e.preventDefault();
        const formData = new FormData(this);
        const firstname = formData.get('firstname');
        const lastname = formData.get('lastname');
        const email = formData.get('email');
        const password = formData.get('password');
        const phone = formData.get('phone');
        const promo = formData.get('promo') === 'yes';
        const birthday = formData.get('birthday');
    
        console.log('Sign-up form data:', { firstname, lastname, email, password, phone, promo, birthday}); 
    
        //makes sure all req fields are filled out
        if(!firstname || !lastname || !email || !password || !phone || !birthday){
            alert("All fields are required");
            return;
        }
        //this try catch block will send a POST request to the server
        try{
            const response = await fetch(`${URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstname, lastname, email, password, phone, promo, birthday })
            });
            const result = await response.json();
            console.log('Sign-up server response:', result); 
            if(response.ok){
                alert("Registration successful!");
                localStorage.setItem('userQRCode', result.qrCode);
                navigate('signin-view');
            }else{
                alert(result.message || "An error occurred during registration");
            }
        }catch (error){
            console.error('Error during registration:', error);
            alert("An error occurred during registration. Please try again.");
        }
    });

    //new edited forgot-pass form
    //the forgot password form will now send a POST request to the server
    //it will send the user's email to the server
    //if the server responds with a 200 status code, the user will see an alert that says "Password reset instructions sent to your email"
    //if the server responds with an error, the user will see an alert with the error message
    //still in testing and fixing, some issues arrise
    document.getElementById('forgot-password-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = { email: formData.get('email') };
        if (!data.email) {
            alert("Email is required");
            return;
        }
        const response = await fetch(`${URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            alert("Password reset instructions sent to your email");
            navigate('signin-view');
        } else {
            alert(result.message);
        }
    });

    // Add delete user functionality
    const deleteUserForm = document.getElementById('delete-user-form');
    if (deleteUserForm) {
        deleteUserForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = { username: formData.get('username') };
        if (!data.username) {
            alert("Username is required");
            return;
        }
        const response = await fetch(`${URL}/delete-user`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            alert("User deleted successfully");
            navigate('signin-view');
        } else {
            alert(result.message);
        }
    });
    }
    //QR code button functionality this will show and remove the qr code
    function displayQRCode() {
        const qrCodeData = localStorage.getItem('userQRCode');
        if (qrCodeData) {
            const qrCodeImg = document.getElementById('qr-code-image');
            qrCodeImg.src = qrCodeData;
            document.getElementById('qr-code-popup').classList.remove('hidden');
        } else {
            alert("QR code not found. Please sign in again.");
        }
    }

    // Modify the QR code button event listener
    const qrCodeButton = document.getElementById('qr-code-button');
    if (qrCodeButton) {
        qrCodeButton.addEventListener('click', displayQRCode);
    }
});

function setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('img').src = type === 'password' ? 'eye1.png' : 'eye2.png';
        });
    });
}
function updateActiveNavLink(viewId) {
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(viewId.replace('-view', '')).classList.add('active');
}

//update rewards view function
function updateRewardsView() {
    const stampsCount = 5; //test stamp count for now
    document.getElementById('stamps-count').innerText = `Stamps: ${stampsCount}`;

    document.querySelectorAll('.reward-item').forEach(item => {
        const requiredStamps = parseInt(item.getAttribute('data-required-stamps'), 10);
        if (stampsCount >= requiredStamps) {
            item.classList.remove('grayscale');
        } else {
            item.classList.add('grayscale');
        }
    });
}
    // Event listener for reward item clicks
    document.querySelectorAll('.reward-item').forEach(item => {
        item.addEventListener('click', () => {
            if (!item.classList.contains('grayscale')) {
                const rewardId = item.getAttribute('data-reward-id');
                showQRCode(rewardId);
            } else {
                alert('Not enough stamps to redeem this reward');
            }
        });
    });
    // Show QR code popup for specifically rewards
    function showQRCode(rewardId) {
        //generate or retrieve QR code based on rewardId
        const qrCodeData = `QR code for reward ${rewardId}`; //just test
        const qrCodeImg = document.getElementById('qr-code-image');
        qrCodeImg.src = qrCodeData; //test
        document.getElementById('qr-code-popup').classList.remove('hidden');
    }

    // Close QR code popup
    document.getElementById('close-qr-popup').addEventListener('click', () => {
        document.getElementById('qr-code-popup').classList.add('hidden');
    });

//fun function that I found that can change the image of the logo based on the screen
function changeLogo(viewId) {
    const logoContainer = document.querySelector('.logo-container');
    const logoElement = document.getElementById('view-logo');
    if (viewId === 'home-view') {
        logoContainer.style.marginBottom = '30px'; //changed this cause of weird issues with home view
    } else {
        logoContainer.style.marginBottom = '0px'; //set margin-bottom for other views
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
            default:
                logoElement.src = 'logo.png';
        }
    }
}