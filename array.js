// ======= Data Storage =======
const registrations = [];

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

// ======= Populate batch dropdown =======
const currentYear = new Date().getFullYear();
for (let year = currentYear; year >= 1930; year--) {
  const option = document.createElement('option');
  option.value = year;
  option.text = year;
  batch.appendChild(option);
}

// ======= Show/hide sections =======
function showRegistration() {
  formContainer.style.display = 'block';
  adminSection.style.display = 'none';
}
function showAdministration() {
  formContainer.style.display = 'none';
  adminSection.style.display = 'block';
}

// Attach menu event listeners
menuRegistration.addEventListener('click', showRegistration);
menuAdministration.addEventListener('click', showAdministration);

// Show registration form by default
showRegistration();

// ======= Render table =======
function renderTable() {
  tableBody.innerHTML = '';
  registrations.forEach((data, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHTML(data.firstName)}</td>
      <td>${escapeHTML(data.lastName)}</td>
      <td>${escapeHTML(data.phone)}</td>
      <td>${escapeHTML(data.email)}</td>
      <td>${escapeHTML(data.batch)}</td>
      <td>${escapeHTML(data.section)}</td>
      <td>
        <button onclick="editRow(${index})">Edit</button>
        <button onclick="deleteEntry(${index})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ======= Utility: Escape HTML (to prevent injection) =======
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ======= Delete entry =======
function deleteEntry(index) {
  if (confirm('Are you sure you want to delete this entry?')) {
    registrations.splice(index, 1);
    renderTable();
  }
}

// ======= Generate batch options for inline edit =======
function generateBatchOptions(selectedYear) {
  let options = '';
  for (let year = currentYear; year >= 1930; year--) {
    options += `<option value="${year}"${year == selectedYear ? ' selected' : ''}>${year}</option>`;
  }
  return options;
}

// ======= Inline Edit =======
function editRow(index) {
  const row = tableBody.rows[index];
  const data = registrations[index];

  row.innerHTML = `
    <td><input type="text" id="edit-firstName-${index}" value="${escapeHTML(data.firstName)}"></td>
    <td><input type="text" id="edit-lastName-${index}" value="${escapeHTML(data.lastName)}"></td>
    <td><input type="text" id="edit-phone-${index}" value="${escapeHTML(data.phone)}"></td>
    <td><input type="email" id="edit-email-${index}" value="${escapeHTML(data.email)}"></td>
    <td>
      <select id="edit-batch-${index}">
        ${generateBatchOptions(data.batch)}
      </select>
    </td>
    <td><input type="text" id="edit-section-${index}" value="${escapeHTML(data.section)}"></td>
    <td>
      <button onclick="saveRow(${index})">Save</button>
      <button onclick="cancelEdit()">Cancel</button>
    </td>
  `;
}

// ======= Save inline edit =======
function saveRow(index) {
  const editedFirstName = document.getElementById(`edit-firstName-${index}`).value.trim();
  const editedLastName = document.getElementById(`edit-lastName-${index}`).value.trim();
  const editedPhone = document.getElementById(`edit-phone-${index}`).value.trim();
  const editedEmail = document.getElementById(`edit-email-${index}`).value.trim();
  const editedBatch = document.getElementById(`edit-batch-${index}`).value;
  const editedSection = document.getElementById(`edit-section-${index}`).value.trim();

  if (
    !editedFirstName ||
    !editedLastName ||
    !editedPhone ||
    !editedEmail ||
    !editedBatch ||
    !editedSection
  ) {
    alert('Please fill in all fields.');
    return;
  }

  registrations[index] = {
    firstName: editedFirstName,
    lastName: editedLastName,
    phone: editedPhone,
    email: editedEmail,
    batch: editedBatch,
    section: editedSection
  };

  renderTable();
}

// ======= Cancel inline edit =======
function cancelEdit() {
  renderTable();
}

// ======= Submit new registration =======
submitBtn.addEventListener('click', () => {
  const formData = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim(),
    batch: batch.value,
    section: section.value.trim()
  };

  if (
    !formData.firstName ||
    !formData.lastName ||
    !formData.phone ||
    !formData.email ||
    !formData.batch ||
    !formData.section
  ) {
    alert('Please fill in all fields.');
    return;
  }

  registrations.push(formData);
  clearForm();
  renderTable();

  // Add this part for submission feedback
  const submitMessage = document.getElementById('submit-message');
  submitMessage.textContent = 'Submitted successfully!';
  submitMessage.style.display = 'block';

  setTimeout(() => {
    submitMessage.style.display = 'none';
  }, 3000);
});

// ======= Clear form fields =======
function clearForm() {
  firstName.value = '';
  lastName.value = '';
  phone.value = '';
  email.value = '';
  batch.value = currentYear;
  section.value = '';
}

// ======= Download CSV =======
downloadCSVBtn.addEventListener('click', () => {
  if (registrations.length === 0) {
    alert('No data to download.');
    return;
  }

  const headers = ['First Name', 'Surname', 'Phone', 'Email', 'Batch', 'Section'];
  const rows = registrations.map(reg => [
    reg.firstName,
    reg.lastName,
    reg.phone,
    reg.email,
    reg.batch,
    reg.section
  ]);

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

// ======= Initialize table =======
renderTable();