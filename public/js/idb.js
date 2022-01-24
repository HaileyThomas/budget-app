// variable to hold db connection
let db;
// establish connection to IndexedDB database
const request = indexedDB.open("budget_app", 1);

// event will emit if the db version changes
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table)
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

// upon success
request.onsuccess = function (event) {
  // when db is successfully create with its object store
  db = event.target.result;
  // check if app is online, if yes run uploadTransaction()
  if (navigator.online) {
    // uploadTransaction();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// will be executed if we try to submit a new transaction and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the db with read and write permission
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access the object store
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // add record to your store
  transactionObjectStore.add(record);
}

// this will upload our stored data once we have reestablished an internet connection
function uploadTransaction() {
  // open a transaction on your db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access your object store
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // get all records from store and set to a variable
  const getAll = transactionObjectStore.getAll();

  // upon a successful getAll execution, run this next
  getAll.onsuccess = function () {
    // if there was data in indexedDB's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          // access the object store
          const transactionObjectStore =
            transaction.objectStore("new_transaction");
          // clear all items in your store
          transactionObjectStore.clear();

          alert("All saved transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadTransaction);
