// ================== Firebase Setup ==================
const firebaseConfig = {
  apiKey: "AIzaSyBOEenKRenPxTOeruQNuAWUlvGMitCQEoU",
  authDomain: "school-4fca9.firebaseapp.com",
  projectId: "school-4fca9",
  storageBucket: "school-4fca9.appspot.com",
  messagingSenderId: "1048493511846",
  appId: "1:1048493511846:web:30da6e8627c1fa18c39067"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ======= DOM Elements =======
const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const phone = document.getElementById('phone');
const email = document.getElementById('email');
const batch = document.getElementById('batch');
const section = document.getElementById('class-section');
const submitBtn = document.querySelector('.submit-btn');
const tableBody = document.querySelector('#registrationTable tbody');
const downloadCSVBtn = document.getElementById('downloadCSV');
const adminSection = document.getElementById('admin-section');
const formContainer = document.querySelector('.form-container');
const menuRegistration = document.getElementById('menu-registration');
const menuAdministration = document.getElementById('menu-administration');

// ======= Login Elements =======
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const closeLogin = document.getElementById('closeLogin');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');

// ======= Logout Button =======
const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Logout';
logoutBtn.style.cssText = 'background-color:#e53935;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-bottom:20px;font-family:Outfit;display:none';
logoutBtn.addEventListener('click', () => {
  firebase.auth().signOut().then(() => {
    alert('Logged out successfully');
    showRegistration();
    logoutBtn.style.display = 'none';
  });
});
adminSection.insertBefore(logoutBtn, adminSection.firstChild);

// ======= Batch Dropdown =======
const currentYear = new Date().getFullYear();
for (let year = currentYear; year >= 1930; year--) {
  const option = document.createElement('option');
  option.value = year;
  option.text = year;
  batch.appendChild(option);
}

// ======= Section Display Functions =======
function showRegistration() {
  formContainer.style.display = 'block';
  adminSection.style.display = 'none';
}
function showAdministration() {
  formContainer.style.display = 'none';
  adminSection.style.display = 'block';
  logoutBtn.style.display = 'inline-block';
}

// ======= Auth State =======
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    loginModal.style.display = 'none';
    loginError.style.display = 'none';
    showAdministration();
    loadRegistrations();
  } else {
    showRegistration();
    logoutBtn.style.display = 'none';
  }
});

// ======= Menu Click =======
menuAdministration.addEventListener('click', () => {
  const user = firebase.auth().currentUser;
  if (user) {
    showAdministration();
  } else {
    loginModal.style.display = 'flex';
  }
});
menuRegistration.addEventListener('click', showRegistration);

// ======= Login =======
loginBtn.addEventListener('click', () => {
  const email = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      loginModal.style.display = 'none';
      loginError.style.display = 'none';
      usernameInput.value = '';
      passwordInput.value = '';
    })
    .catch(error => {
      loginError.textContent = error.message;
      loginError.style.display = 'block';
    });
});
closeLogin.addEventListener('click', () => {
  loginModal.style.display = 'none';
  loginError.style.display = 'none';
  usernameInput.value = '';
  passwordInput.value = '';
});

// ======= Submit =======
submitBtn.addEventListener('click', () => {
  const formData = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim(),
    batch: batch.value,
    section: section.value.trim(),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (Object.values(formData).some(val => !val)) {
    alert('Please fill in all fields.');
    return;
  }

  db.collection('registrations').add(formData)
    .then(() => {
      clearForm();
      alert('Submitted successfully!');
      loadRegistrations();
    })
    .catch(err => {
      console.error('Error adding document: ', err);
    });
});

// ======= Load Registrations =======
function loadRegistrations() {
  tableBody.innerHTML = '';

  db.collection('registrations').orderBy('timestamp', 'desc').get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${escapeHTML(data.firstName)}</td>
          <td>${escapeHTML(data.lastName)}</td>
          <td>${escapeHTML(data.phone)}</td>
          <td>${escapeHTML(data.email)}</td>
          <td>${escapeHTML(data.batch)}</td>
          <td>${escapeHTML(data.section)}</td>
          <td>
            <button onclick="deleteEntry('${doc.id}')">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    });
}

// ======= Delete =======
function deleteEntry(id) {
  if (confirm('Are you sure you want to delete this entry?')) {
    db.collection('registrations').doc(id).delete()
      .then(() => {
        alert('Deleted successfully');
        loadRegistrations();
      });
  }
}

// ======= Download CSV =======
downloadCSVBtn.addEventListener('click', () => {
  db.collection('registrations').get().then(snapshot => {
    const headers = ['First Name', 'Surname', 'Phone', 'Email', 'Batch', 'Section'];
    const rows = snapshot.docs.map(doc => {
      const d = doc.data();
      return [
        d.firstName || '',
        d.lastName || '',
        d.phone || '',
        d.email || '',
        d.batch || '',
        d.section || ''
      ];
    });

    const csvContent = [headers, ...rows]
      .map(e => e.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'registrations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});

// ======= Helpers =======
function clearForm() {
  firstName.value = '';
  lastName.value = '';
  phone.value = '';
  email.value = '';
  batch.value = currentYear;
  section.value = '';
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}