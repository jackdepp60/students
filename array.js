// ================== Firebase Setup ==================
const firebaseConfig = {
  apiKey: "AIzaSyBOEenKRenPxTOeruQNuAWUlvGMitCQEoU",
  authDomain: "school-4fca9.firebaseapp.com",
  projectId: "school-4fca9",
  storageBucket: "school-4fca9.appspot.com",
  messagingSenderId: "1048493511846",
  appId: "1:1048493511846:web:30da6e8627c1fa18c39067",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ======= DOM Elements =======
const form = document.getElementById("registrationForm");
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const phone = document.getElementById("phone");
const email = document.getElementById("email");
const batch = document.getElementById("batch");
const section = document.getElementById("class-section");
const submitMessage = document.getElementById("submit-message");
const tableBody = document.querySelector("#registrationTable tbody");
const downloadCSVBtn = document.getElementById("downloadCSV");
const adminSection = document.getElementById("admin-section");
const formContainer = document.querySelector(".form-container");
const menuRegistration = document.getElementById("menu-registration");
const menuAdministration = document.getElementById("menu-administration");
const header = document.querySelector("header");

// ======= Login Elements =======
const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const closeLogin = document.getElementById("closeLogin");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

// ======= Details Modal Elements (for showing full info on small screens) =======
let detailsModal, detailsModalContent, closeDetailsBtn;

// Create details modal dynamically (if needed)
function createDetailsModal() {
  detailsModal = document.getElementById("detailsModal");
  detailsModalContent = document.getElementById("detailsContent");
}
createDetailsModal();

// ======= Logout Button =======
const logoutBtn = document.createElement("button");
logoutBtn.textContent = "Logout";
logoutBtn.className = "logoutbtn";
logoutBtn.style.cssText =
  "background-color:#e53935;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-family:Roboto;display:none";
logoutBtn.addEventListener("click", () => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      alert("Logged out successfully");
      showRegistration();
      logoutBtn.style.display = "none";
    });
});
header.insertBefore(logoutBtn, header.lastChild);

// ======= Batch Dropdown =======
const currentYear = new Date().getFullYear();
for (let year = currentYear; year >= 1930; year--) {
  const option = document.createElement("option");
  option.value = year;
  option.text = year;
  batch.appendChild(option);
}

// ======= Section Display Functions =======
function showRegistration() {
  formContainer.style.display = "block";
  adminSection.style.display = "none";
}
function showAdministration() {
  formContainer.style.display = "none";
  adminSection.style.display = "block";
  logoutBtn.style.display = "inline-block";
}

// ======= Auth State =======
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    loginModal.style.display = "none";
    loginError.style.display = "none";
    showAdministration();
    loadRegistrations();
  } else {
    showRegistration();
    logoutBtn.style.display = "none";
  }
});

// ======= Menu Click =======
menuAdministration.addEventListener("click", () => {
  const user = firebase.auth().currentUser;
  if (user) {
    showAdministration();
  } else {
    loginModal.style.display = "flex";
  }
});
menuRegistration.addEventListener("click", showRegistration);

// ======= Login =======
loginBtn.addEventListener("click", () => {
  const email = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(() => {
      loginModal.style.display = "none";
      loginError.style.display = "none";
      usernameInput.value = "";
      passwordInput.value = "";
    })
    .catch((error) => {
      loginError.textContent = error.message;
      loginError.style.display = "block";
    });
});
closeLogin.addEventListener("click", () => {
  loginModal.style.display = "none";
  loginError.style.display = "none";
  usernameInput.value = "";
  passwordInput.value = "";
});

// ======= Phone input filter: allow only digits =======
phone.addEventListener("input", () => {
  phone.value = phone.value.replace(/\D/g, "");
});

// ======= Submit Registration with validation =======
form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Native form validity check
  if (!form.checkValidity()) {
    alert("Please fill out all fields with valid values, including a proper email.");
    return;
  }

  const formData = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim(),
    batch: batch.value,
    section: section.value.trim(),
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  };

  // Extra check for empty strings after trimming
  if (Object.values(formData).some((val) => !val)) {
    alert("Please fill in all fields.");
    return;
  }

  db.collection("registrations")
    .add(formData)
    .then(() => {
      clearForm();
      submitMessage.textContent = "Submitted successfully!";
      submitMessage.style.display = "block";
      loadRegistrations();

      setTimeout(() => {
        submitMessage.style.display = "none";
      }, 3000);
    })
    .catch((err) => {
      console.error("Error adding document: ", err);
    });
});

// ======= Load Registrations =======
function loadRegistrations() {
  tableBody.innerHTML = "";

  db.collection("registrations")
    .orderBy("timestamp", "desc")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();

        // Create row
        const row = document.createElement("tr");

        // Responsive: hide some columns on small screens by adding 'hide-on-mobile' class
        row.innerHTML = `
          <td>${escapeHTML(data.firstName)}</td>
          <td>${escapeHTML(data.lastName)}</td>
          <td class="hide-on-mobile">${escapeHTML(data.phone)}</td>
          <td class="hide-on-mobile">${escapeHTML(data.email)}</td>
          <td class="hide-on-mobile">${escapeHTML(data.batch)}</td>
          <td class="hide-on-mobile">${escapeHTML(data.section)}</td>
          <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
          </td>
        `;

        // Clicking row on small screen shows details modal (except if click on buttons)
        row.addEventListener("click", (e) => {
          if (e.target.tagName.toLowerCase() === "button") return; // ignore if clicked a button
          showDetailsModal(data, doc.id);
        });

        // Edit button
        row.querySelector(".edit-btn").addEventListener("click", () => {
          startEditingRow(row, doc.id, data);
        });

        // Delete button
        row.querySelector(".delete-btn").addEventListener("click", () => {
          deleteEntry(doc.id);
        });

        tableBody.appendChild(row);
      });
    });
}

// ======= Show Details Modal (small screens) =======
function showDetailsModal(data, docId) {
  detailsModalContent.innerHTML = `
    <p><strong>First Name:</strong> ${escapeHTML(data.firstName)}</p>
    <p><strong>Last Name:</strong> ${escapeHTML(data.lastName)}</p>
    <p><strong>Phone:</strong> ${escapeHTML(data.phone)}</p>
    <p><strong>Email:</strong> ${escapeHTML(data.email)}</p>
    <p><strong>Batch:</strong> ${escapeHTML(data.batch)}</p>
    <p><strong>Section:</strong> ${escapeHTML(data.section)}</p>
  `;
  detailsModal.style.display = "block";
}

// Close details modal function (for your close button)
function closeDetails() {
  detailsModal.style.display = "none";
}

// ======= Delete Entry =======
function deleteEntry(docId) {
  if (confirm("Are you sure you want to delete this entry?")) {
    db.collection("registrations")
      .doc(docId)
      .delete()
      .then(() => {
        alert("Deleted successfully");
        loadRegistrations();
      })
      .catch((err) => {
        console.error("Error deleting document:", err);
      });
  }
}

// ======= Start Editing Row Inline =======
function startEditingRow(row, docId, data) {
  row.innerHTML = `
    <td><input type="text" class="edit-firstName" value="${escapeHTML(data.firstName)}" /></td>
    <td><input type="text" class="edit-lastName" value="${escapeHTML(data.lastName)}" /></td>
    <td class="hide-on-mobile"><input type="tel" class="edit-phone" value="${escapeHTML(data.phone)}" /></td>
    <td class="hide-on-mobile"><input type="email" class="edit-email" value="${escapeHTML(data.email)}" /></td>
    <td class="hide-on-mobile">
      <select class="edit-batch"></select>
    </td>
    <td class="hide-on-mobile"><input type="text" class="edit-section" value="${escapeHTML(data.section)}" /></td>
    <td>
      <button class="save-btn">Save</button>
      <button class="cancel-btn">Cancel</button>
    </td>
  `;

  // Populate batch select dropdown with years
  const batchSelect = row.querySelector(".edit-batch");
  for (let year = currentYear; year >= 1930; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.text = year;
    if (year == data.batch) option.selected = true;
    batchSelect.appendChild(option);
  }

  // Restrict edit-phone input to digits only
  const editPhoneInput = row.querySelector(".edit-phone");
  editPhoneInput.addEventListener("input", () => {
    editPhoneInput.value = editPhoneInput.value.replace(/\D/g, "");
  });

  // Save button
  row.querySelector(".save-btn").addEventListener("click", () => {
    const updatedData = {
      firstName: row.querySelector(".edit-firstName").value.trim(),
      lastName: row.querySelector(".edit-lastName").value.trim(),
      phone: row.querySelector(".edit-phone").value.trim(),
      email: row.querySelector(".edit-email").value.trim(),
      batch: row.querySelector(".edit-batch").value,
      section: row.querySelector(".edit-section").value.trim(),
    };

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(updatedData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (Object.values(updatedData).some((val) => !val)) {
      alert("Please fill in all fields before saving.");
      return;
    }

    db.collection("registrations")
      .doc(docId)
      .update(updatedData)
      .then(() => {
        alert("Updated successfully!");
        loadRegistrations();
      })
      .catch((err) => {
        console.error("Error updating document:", err);
      });
  });

  // Cancel button
  row.querySelector(".cancel-btn").addEventListener("click", () => {
    loadRegistrations();
  });
}

// ======= Download CSV =======
downloadCSVBtn.addEventListener("click", () => {
  db.collection("registrations").get().then((snapshot) => {
    const headers = [
      "First Name",
      "Surname",
      "Phone",
      "Email",
      "Batch",
      "Section",
    ];
    const rows = snapshot.docs.map((doc) => {
      const d = doc.data();
      return [
        d.firstName || "",
        d.lastName || "",
        d.phone || "",
        d.email || "",
        d.batch || "",
        d.section || "",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((e) => e.map((field) => `"${field.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
        link.setAttribute("href", url);
    link.setAttribute("download", "registrations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});

// ======= Helpers =======
function clearForm() {
  firstName.value = "";
  lastName.value = "";
  phone.value = "";
  email.value = "";
  batch.value = currentYear;
  section.value = "";
}

function escapeHTML(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function contact() {
  alert("Just call me maybe baby!");
}