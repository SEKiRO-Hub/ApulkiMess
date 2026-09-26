// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAQadojF5c2l_VCtUbjl6IFQ41GlN_o82I",
    authDomain: "apulkimess.firebaseapp.com",
    databaseURL: "https://apulkimess-default-rtdb.firebaseio.com",
    projectId: "apulkimess",
    storageBucket: "apulkimess.firebasestorage.app",
    messagingSenderId: "920484076992",
    appId: "1:920484076992:web:1ee5b3bcf3ce74e1357c25",
    measurementId: "G-D7Z724D1N6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);