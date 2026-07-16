const people = [
  {
    id: "person-1",
    firstName: "Sarah",
    lastName: "Kim",
    phone: "4255551234",
    address1: "123 Main Street",
    city: "Bellevue",
    state: "WA",
    postalCode: "98004"
  },
  {
    id: "person-2",
    firstName: "David",
    lastName: "Kim",
    phone: "4255551234",
    address1: "123 Main Street",
    city: "Bellevue",
    state: "WA",
    postalCode: "98004"
  },
  {
    id: "person-3",
    firstName: "Sarah",
    lastName: "Kim",
    phone: "2065557777",
    address1: "500 Pine Street",
    city: "Seattle",
    state: "WA",
    postalCode: "98101"
  },
  {
    id: "person-4",
    firstName: "Alex",
    lastName: "Lee",
    phone: "4255559999",
    address1: "900 Lake Avenue",
    city: "Kirkland",
    state: "WA",
    postalCode: "98033"
  }
];

const quickSearch = document.querySelector("#quickSearch");
const listbox = document.querySelector("#quickSearch_listbox");
const clearButton = document.querySelector("#clearSearch");
const selectedSection = document.querySelector("#selectedPerson");
const selectedDetails = document.querySelector("#selectedPersonDetails");
const navbarAddItem = document.querySelector("#navbarAddItem");
const globalOperations = document.querySelector("#globalOperations");
const personMenuLink = document.querySelector('#globalOperations a[data-type="Person"]');
const createPersonModal = document.querySelector("#create-person-modal");
const firstNameInput = document.querySelector("#firstName");
const lastNameInput = document.querySelector("#lastName");
const addEmailButton = document.querySelector("#AddNewEmail");
const emailListView = document.querySelector("#EmailListView");
const addPhoneButton = document.querySelector("#AddNewPhone");
const phoneNumberListView = document.querySelector("#PhoneNumberListView");
const addAddressButton = document.querySelector("#AddNewAddress");
const addressListView = document.querySelector("#PDEAddressListView");

function normalize(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function personMatches(person, rawQuery) {
  const query = normalize(rawQuery);

  if (!query) {
    return false;
  }

  const values = [
    `${person.firstName} ${person.lastName}`,
    person.firstName,
    person.lastName,
    person.phone,
    person.address1,
    person.city,
    person.state,
    person.postalCode
  ];

  return values.some((value) => normalize(value).includes(query));
}

function renderResults(results) {
  listbox.replaceChildren();

  if (results.length === 0) {
    listbox.hidden = true;
    quickSearch.setAttribute("aria-expanded", "false");
    return;
  }

  for (const person of results) {
    const item = document.createElement("li");
    item.setAttribute("role", "option");
    item.textContent =
      `${person.firstName} ${person.lastName} — ` +
      `${person.phone} — ` +
      `${person.address1}, ${person.city}`;

    item.addEventListener("click", () => {
      selectPerson(person);
    });

    listbox.appendChild(item);
  }

  listbox.hidden = false;
  quickSearch.setAttribute("aria-expanded", "true");
}

function selectPerson(person) {
  selectedDetails.textContent =
    `${person.firstName} ${person.lastName} | ` +
    `${person.phone} | ` +
    `${person.address1}, ${person.city}, ` +
    `${person.state} ${person.postalCode}`;

  selectedSection.hidden = false;
  listbox.hidden = true;
  quickSearch.setAttribute("aria-expanded", "false");
}

quickSearch.addEventListener("input", () => {
  const results = people.filter((person) => personMatches(person, quickSearch.value));
  renderResults(results);
});

clearButton.addEventListener("click", () => {
  quickSearch.value = "";
  listbox.replaceChildren();
  listbox.hidden = true;
  selectedSection.hidden = true;
  quickSearch.focus();
});

if (navbarAddItem && globalOperations && personMenuLink && createPersonModal) {
  navbarAddItem.addEventListener("click", () => {
    globalOperations.hidden = false;
  });

  personMenuLink.addEventListener("click", (event) => {
    event.preventDefault();
    createPersonModal.hidden = false;
    firstNameInput?.focus();
  });
}

if (addEmailButton && emailListView) {
  addEmailButton.addEventListener("click", () => {
    if (emailListView.querySelector('[data-field="email"]')) {
      return;
    }

    emailListView.innerHTML = `
      <label>
        Email
        <input data-field="email" type="email" />
      </label>
    `;
  });
}

if (addPhoneButton && phoneNumberListView) {
  addPhoneButton.addEventListener("click", () => {
    if (phoneNumberListView.querySelector('[data-field="phone"]')) {
      return;
    }

    phoneNumberListView.innerHTML = `
      <label>
        Phone
        <input data-field="phone" type="tel" />
      </label>
    `;
  });
}

if (addAddressButton && addressListView) {
  addAddressButton.addEventListener("click", () => {
    if (addressListView.querySelector('[data-field="address1"]')) {
      return;
    }

    addressListView.innerHTML = `
      <label>
        Address
        <input data-field="address1" />
      </label>

      <label>
        City
        <input data-field="city" />
      </label>

      <label>
        State
        <input data-field="state" />
      </label>

      <label>
        ZIP
        <input data-field="postalCode" />
      </label>
    `;
  });
}
