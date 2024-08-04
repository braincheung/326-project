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
    document.getElementById('settings').addEventListener('click', () => {
        updateActiveNavLink('settings-view');
        navigate('settings-view');
        populateSettingsForm();
    });
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
        e.preventDefault();
        const formData = new FormData(this);
        const data = {
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
            console.log('Sign-in server response:', result);
            if(response.ok){
                localStorage.setItem('currentUserEmail', data.email);
                localStorage.setItem('currentUserData', JSON.stringify(result.user)); //store the user data
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
//revamped settings form 
//the settings form will now send a PUT request to the server
//it will send the user's first name, last name, email, phone number, birthday, promo, and password to the server
//if the server responds with a 200 status code, the user will see an alert that says "Account updated successfully"
//if the server responds with an error, the user will see an alert with the error message
//if the server responds with a 409 status code, the user will see an alert that says "User already exists"
    document.getElementById('settings-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = {
            firstname: formData.get('firstname'),
            lastname: formData.get('lastname'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            birthday: formData.get('birthday'),
            promo: formData.get('promo') === 'yes'
        };
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        //check if the password fields are filled out
        if(password){
            if (password !== confirmPassword) {
                alert("Passwords do not match");
                return;
            }
            data.password = password;
        }
    
        try{
            //this try catch block will send a PUT request to the server
            const response = await fetch(`${URL}/update-user`,{
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if(response.ok){
                alert("Account updated successfully");
                //this updates the user data in local storage
                localStorage.setItem('currentUserData', JSON.stringify({...JSON.parse(localStorage.getItem('currentUserData')), ...data}));
            }else{
                alert(result.message || "An error occurred while updating the account");
            }
        }catch (error){
            console.error('Error updating account:', error);
            alert("An error occurred while updating the account. Please try again.");
        }
    });
    
    // Add event listener for delete account button
    document.getElementById('delete-account-button').addEventListener('click', async function() {
        // Add a confirmation dialog before deleting the account
        if(confirm("Are you sure you want to delete your account? This action cannot be undone.")){
            try{
                const currentEmail = localStorage.getItem('currentUserEmail'); //this gets the current user email for querying purpose
                if(!currentEmail){
                    alert("No user is currently logged in.");
                    return;
                }
                //this try catch block will send a request to the server
                const response = await fetch(`${URL}/delete-user`, {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email: currentEmail })
                });
                const result = await response.json();
                if(response.ok){
                    alert("Account deleted successfully");
                    localStorage.removeItem('currentUserEmail'); //clears the storage
                    navigate('signin-view');
                }else{
                    alert(result.message || "An error occurred while deleting the account");
                }
            }catch (error){
                console.error('Error deleting account:', error);
                alert("An error occurred while deleting the account. Please try again.");
            }
        }
    });
    //QR code button functionality this will show and remove the qr code
    //not fully functioning. still in testing
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
//this function is a helper function which will populate the settings form with the user's data
//the function first gets the user data from local storage
//then it populates the form fields with the user's data
function populateSettingsForm(){
    const userData = JSON.parse(localStorage.getItem('currentUserData'));
    if(!userData){
        console.error('No user data found in localStorage');
        return;
    }
    document.querySelector('#settings-form [name="firstname"]').value = userData.firstname || '';
    document.querySelector('#settings-form [name="lastname"]').value = userData.lastname || '';
    document.querySelector('#settings-form [name="email"]').value = userData.email || '';
    document.querySelector('#settings-form [name="phone"]').value = userData.phone || '';
    document.querySelector('#settings-form [name="birthday"]').value = userData.birthday || '';
    document.querySelector(`#settings-form [name="promo"][value="${userData.promo ? 'yes' : 'no'}"]`).checked = true;
    //this clears the password fields for security
    document.querySelector('#settings-form [name="password"]').value = '';
    document.querySelector('#settings-form [name="confirmPassword"]').value = '';
}