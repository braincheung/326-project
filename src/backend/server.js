import * as fsp from "fs/promises";
import * as http from "http";
import * as url from "url";
import {
  saveUser,
  loadUser,
  updateUser as updateUserData,
  deleteUser,
  findUserByEmail,
  generateQRCode
} from "./db.js";
// Constants for the server configuration.
//
// - HOSTNAME: The hostname where the server will listen for incoming requests.
//             The hostname is the human-readable name that represents a computer
//             on a network. In this case, we are using "localhost", which refers
//             to the local machine where the server is running.
// - PORT: The port where the server will listen for incoming requests. A port
//         is like a door through which network communication flows in and out
//         of a computer. The server listens on this port for incoming requests.
const HOSTNAME = "localhost";
const PORT = 3260;
const headerFields = {"Content-Type": "application/json"};

//async create user, it takes response, firstname, lastname, email, password as parameters
//it checks if any of the fields are missing and returns an error message
//if all fields are present, it creates a username by combining firstname and lastname
//it then generates a qr code and saves the user to the database
//it returns a success message with the qr code
//if an error occurs, it returns an error message
async function signup(response, firstname, lastname, email, password, phone, promo, birthday){
  console.log('Signup request received:', { firstname, lastname, email, password, phone, promo, birthday }); 

  if(!firstname || !lastname || !email || !password || !phone || !birthday){
    console.error('Missing field(s):', { firstname, lastname, email, password, phone, birthday });
    response.writeHead(400, headerFields);
    response.write(JSON.stringify({ message: "All fields are required" }));
    response.end();
  }else{
    try{
      const username = `${firstname} ${lastname}`; //Combine firstname and lastname
      const qrCode = await generateQRCode(username); //generate QR code
      const user = await saveUser(username, password, email, phone, promo, birthday, qrCode);
      console.log('User saved:', user);
      response.writeHead(201, headerFields);
      response.write(JSON.stringify({ 
        message: `User ${username} created successfully`, 
        qrCode: user.qrCode 
      }));
      response.end();
    }catch(err){
      console.error('Error during signup:', err);
      let message = "Internal Server Error";
      if(err.message === 'User already exists'){
        message = "User already exists";
      }
      response.writeHead(500, headerFields);
      response.write(JSON.stringify({ message: message, error: err.message }));
      response.end();
    }
  }
}
//async signin function, it takes response, email, password as parameters
//it checks if the user exists in the database and if the password is correct
//it returns a success message with the user data if the signin is successful
//if the credentials are invalid, it returns an error message
//if an error occurs, it returns an error message
//edited the function for the settings page so we can get the user data and edit it when needed
async function signin(response, email, password){
  console.log('Signin request:', {email, password });
  try{
    const result = await findUserByEmail(email);
    console.log('Find user:', result);
    if(result.docs.length > 0 && result.docs[0].password === password){
      const userData = result.docs[0];
      delete userData.password; 
      
      //new addition to sign in so we can get the user data and edit it when needed
      const userResponse = {
        firstname: userData.firstname || userData.username?.split(' ')[0], //this is going to be using the username to get the first name
        lastname: userData.lastname || userData.username?.split(' ')[1], //this is going to be using the username to get the last name
        email: userData.email,
        phone: userData.phone,
        birthday: userData.birthday,
        promo: userData.promo,
        qrCode: userData.qrCode,
        stamps: userData.stamps,
        rewards: userData.rewards
      };
      response.writeHead(200, headerFields);
      response.write(JSON.stringify({ message: 'Sign-in successful', user: userResponse }));
    } else {
      response.writeHead(401, headerFields);
      response.write(JSON.stringify({ message: 'Invalid credentials' }));
    }
    response.end();
  } catch (err){
    console.error('Error during sign-in:', err);
    response.writeHead(500, headerFields);
    response.write(JSON.stringify({ message: 'Error during sign-in', error: err.message }));
    response.end();
  }
}

//async reset password function, it takes response, email as parameters
//it checks if the email exists in the database
//if the email exists, it sends a password reset instructions message
//if the email does not exist, it returns an error message
//if an error occurs, it returns an error message
async function resetPassword(response, email) {
  try {
    const result = await findUserByEmail(email);
    //if the email exists, send password reset instructions
    //not completely implemented yet
    if (result.docs.length > 0) {
      response.writeHead(200, headerFields);
      response.write(JSON.stringify({ message: 'Password reset instructions sent' }));
    } else {
      response.writeHead(404, headerFields);
      response.write(JSON.stringify({ message: 'Email not found' }));
    }
    response.end();
  } catch (err) {
    response.writeHead(500, headerFields);
    response.write(JSON.stringify({ message: 'Error resetting password', error: err.message }));
    response.end();
  }
}

//async update user function, it takes response, username, data as parameters
//it loads the user from the database
//it updates the user data with the new data
//it saves the updated user data to the database
//it returns a success message if the user data is updated successfully
//if an error occurs, it returns an error message
async function updateUser(response, data) {
  try {
      const result = await findUserByEmail(data.email);
      if (result.docs.length === 0) {
          response.writeHead(404, { "Content-Type": "application/json" });
          response.write(JSON.stringify({ message: 'User not found' }));
          response.end();
          return;
      }
      const user = result.docs[0];
      Object.assign(user, data);
      //this is added to update the password if the user wants to change it
      if (data.password) {
          user.password = data.password;
      }
      await updateUserData(user);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.write(JSON.stringify({ message: 'User updated successfully' }));
      response.end();
  } catch (err) {
      console.error('Error updating user:', err);
      response.writeHead(500, { "Content-Type": "application/json" });
      response.write(JSON.stringify({ message: 'Error updating user data', error: err.message }));
      response.end();
  }
}
//async delete user function, it takes response, username as parameters
//it deletes the user from the database
//it returns a success message if the user is deleted successfully
//if an error occurs, it returns an error message
async function deleteUserAccount(response, email) {
  try {
      const result = await findUserByEmail(email);
      if (result.docs.length === 0) {
          response.writeHead(404, { "Content-Type": "application/json" });
          response.write(JSON.stringify({ message: 'User not found' }));
          response.end();
          return;
      }
      await deleteUser(result.docs[0]._id);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.write(JSON.stringify({ message: 'User deleted successfully' }));
      response.end();
  } catch (err) {
      console.error('Error deleting user:', err);
      response.writeHead(500, { "Content-Type": "application/json" });
      response.write(JSON.stringify({ message: 'Error deleting user', error: err.message }));
      response.end();
  }
}
//new function
//async get user data function, it takes response, email as parameters
//it fetches the user data from the database
//it sends the user data to the client
//if the user is not found, it returns an error message
//if an error occurs, it returns an error message
async function getUserData(response, email) {
  try {
      const result = await findUserByEmail(email);
      if (result.docs.length > 0) {
          const userData = result.docs[0];
          delete userData.password; // Don't send the password to the client
          response.writeHead(200, headerFields);
          response.end(JSON.stringify(userData));
      } else {
          response.writeHead(404, headerFields);
          response.end(JSON.stringify({ message: 'User not found' }));
      }
  } catch (err) {
      console.error('Error fetching user data:', err);
      response.writeHead(500, headerFields);
      response.end(JSON.stringify({ message: 'Error fetching user data', error: err.message }));
  }
}
//still working on this function should create a qr code for the user and save it to the database
async function getQRCode(response, username){
  try{
    const user = await loadUser(username);
    if(user.qrCode){
      response.writeHead(200, headerFields);
      response.write(JSON.stringify({ qrCode: user.qrCode }));
    }else{
      response.writeHead(404, headerFields);
      response.write(JSON.stringify({ message: 'QR code not found for user' }));
    }
    response.end();
  }catch (err){
    response.writeHead(500, headerFields);
    response.write(JSON.stringify({ message: 'Error retrieving QR code', error: err.message }));
    response.end();
  }
}


//function to get content type based on the file extension to make sure the browser knows what the file is
function getContentType(urlpath) {
  const suffix = urlpath.split(".").pop();
  return {
    html: "text/html",
    css: "text/css",
    js: "text/javascript",
    png: "image/png",
    jpg: "image/jpeg",
  }[suffix] || "text/plain";
}

const sendStaticFile = async (response, urlpath) => {
  try {
    // Read the file from the src/client folder and send it back to the client
    const data = await fsp.readFile("src/frontend" + urlpath);
    response.writeHead(200, { "Content-Type": getContentType(urlpath) });
    response.write(data);
    response.end();
  } catch (err) {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.write("Not found: " + urlpath);
    response.end();
  }
};

async function basicServer(request, response) {
  const parsedUrl = url.parse(request.url, true);
  const pathname = parsedUrl.pathname;
  const options = parsedUrl.query;

  console.log(`Received ${request.method} request for ${pathname}`);
  console.log('Query parameters:', options);

  if (pathname === "/signup" && request.method === "POST") {
    const body = await getRequestBody(request);
    console.log('Request body:', body);
    await signup(response, body.firstname, body.lastname, body.email, body.password, body.phone, body.promo, body.birthday);
    return;
  }

  if (pathname === "/signin" && request.method === "POST") {
    const body = await getRequestBody(request);
    await signin(response, body.email, body.password);
    return;
  }

  if (pathname === "/reset-password" && request.method === "POST") {
    const body = await getRequestBody(request);
    await resetPassword(response, body.email);
    return;
  }

  if (pathname === "/update-user" && request.method === "PUT") {
    const body = await getRequestBody(request);
    await updateUser(response, body);
    return;
}

if (pathname === "/delete-user" && request.method === "DELETE") {
    const body = await getRequestBody(request);
    await deleteUserAccount(response, body.email);
    return;
}

  if (pathname === "/qr-code" && request.method === "GET") {
    const body = await getRequestBody(request);
    await getQRCode(response, body.username);
    return;
  }

  if (["/", "/index.html", "/signin-view", "/signup-view", "/home-view"].includes(pathname)) {
    sendStaticFile(response, "/index.html");
    return;
  }

  if ([".html", ".css", ".js", ".png", ".jpg"].some((suffix) => pathname.endsWith(suffix))) {
    sendStaticFile(response, pathname);
    return;
  }
//added this so we can change the user data when needed
if (pathname === "/get-user" && request.method === "GET") {
  const email = parsedUrl.query.email;
  await getUserData(response, email);
  return;
}

  response.writeHead(405, { "Content-Type": "text/plain" });
  response.write("Method Not Allowed");
  response.end();
}

//create the server
http.createServer(basicServer).listen(PORT, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});


async function getRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      resolve(JSON.parse(body));
    });
    request.on("error", (err) => {
      reject(err);
    });
  });
}

