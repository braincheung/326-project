import PouchDB from 'pouchdb';
import pouchdbFind from 'pouchdb-find';
import qrcode from 'qrcode';

PouchDB.plugin(pouchdbFind);

const db = new PouchDB('users');

//async function to save user to the database for signup
//it takes username, password, email, phone, promo, birthday as parameters
//it generates a qr code for the user and saves the user to the database
//it returns the user object if the user is saved successfully
//if the user already exists, it returns an error message
//if an error occurs, it returns an error message
export async function saveUser(username, password, email, phone, promo, birthday){
  try{
    const qrCode = await generateQRCode(username);
    const user = {
      _id: username,
      username,
      password,
      email,
      phone,
      promo,
      birthday,
      qrCode,
      stamps: 0,
      rewards: []
    };
    await db.put(user);
    return user;
  }catch (err){
    console.error('Error saving user:', err); // Debugging
    if (err.status === 409) {
      throw new Error('User already exists');
    }
    throw err;
  }
}

//async function to load user from the database
export async function loadUser(username) {
  return await db.get(username);
}

//async function to update user in the database, will be used for updating user profile
export async function updateUser(user) {
  await db.put(user);
}

//async function to delete user from the database
export async function deleteUser(username) {
  const user = await db.get(username);
  await db.remove(user);
}


//async function to find user by email in the database
//it takes email as a parameter
//it returns a list of users with the specified email
//if no user is found, it returns an empty list
//if an error occurs, it returns an error message
export async function findUserByEmail(email){
  try{
    const result = await db.find({
      selector: {email}
    });
    console.log('findUserByEmail result:', result);
    return result;
  }catch (err){
    console.error('Error finding user by email:', err);
    throw err;
  }
}


//this function generates a qr code for the user
//it takes username as a parameter
//it returns the qr code as a base64 encoded string
//if an error occurs, it throws an error
//still figuring out how to implement
export async function generateQRCode(data) {
  try {
    return await qrcode.toDataURL(data);
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}
