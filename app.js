import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, Timestamp } from "firebase/firestore";

// 1 Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyByPS96EKSywMMB_BF0MDOEbshjiP8TOug",
  authDomain: "kakeibo-dd1e0.firebaseapp.com",
  projectId: "kakeibo-dd1e0",
  storageBucket: "kakeibo-dd1e0.firebasestorage.app",
  messagingSenderId: "1002490623760",
  appId: "1:1002490623760:web:9ced7a94e76fe0e930d795"
};

console.log(firebaseConfig);
// 2 Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log(app);
const db = getFirestore(app);
console.log(db);

//Retrieve elements by ID
const newIncomeBtn = document.getElementById('newIncomeBtn');
const newExpenseBtn = document.getElementById('newExpenseBtn');
const incomeForm = document.getElementById('incomeForm');
const expenseForm = document.getElementById('expenseForm');
const incomeFormEnd = document.getElementById('incomeFormEnd');
const expenseFormEnd = document.getElementById('expenseFormEnd');
const incomeFormElem = document.getElementById('incomeFormElem');
const expenseFormElem = document.getElementById('expenseFormElem');

// Quick Event listeners 
newIncomeBtn.addEventListener('click', () => {
  incomeForm.classList.toggle('hidden');
});


let bdg = {
  hBal: null,
  hInc: null,
  hExp: null,
  hList: null,
  hIncomeForm: null,
  hExpenseForm: null,
  fIncomeID: null,
  fIncomeSource: null,
  fIncomeAmt: null,
  fExpenseID: null,
  fExpenseTxt: null,
  fExpenseAmt: null,
  fExpenseCategory: null,
  selectedMonth: null,
};

window.onload = () => {
  initializeUI();
  draw();
};

// 3 Initialize UI elements
function initializeUI() {
  bdg.hBal = document.getElementById("balanceAm");
  bdg.hInc = document.getElementById("incomeAm");
  bdg.hExp = document.getElementById("expenseAm");
  bdg.hList = document.getElementById("list");
  bdg.hIncomeForm = document.getElementById("incomeForm");
  bdg.hExpenseForm = document.getElementById("expenseForm");
  bdg.fIncomeID = document.getElementById("incomeFormID");
  bdg.fIncomeSource = document.getElementById("incomeFormSource");
  bdg.fIncomeAmt = document.getElementById("incomeFormAmt");
  bdg.fExpenseID = document.getElementById("expenseFormID");
  bdg.fExpenseTxt = document.getElementById("expenseFormTxt");
  bdg.fExpenseAmt = document.getElementById("expenseFormAmt");
  bdg.fExpenseCategory = document.getElementById("expenseFormCategory");

  const monthSelect = document.getElementById("monthSelect");
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const months = [];
  for (let i = 0; i < 12; i++) {
    const month = new Date(currentDate.getFullYear(), i);
    const monthString = month.toLocaleString('default', { month: 'long', year: 'numeric' });
    months.push(monthString);
  }

  monthSelect.innerHTML = '';
  months.forEach(month => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  monthSelect.value = currentMonth;
  bdg.selectedMonth = currentMonth;

  monthSelect.addEventListener("change", (e) => {
    bdg.selectedMonth = e.target.value;
    draw();
  });
}

// 4 Toggle visibility of income form
function toggleIncome(id) {
  if (id === false) {
    bdg.fIncomeID.value = "";
    bdg.fIncomeSource.value = "";
    bdg.fIncomeAmt.value = "";
    bdg.hIncomeForm.classList.add("hidden");
  } else {
    if (Number.isInteger(id)) {
      bdg.fIncomeID.value = id;
      bdg.fIncomeSource.value = bdg.entries[id].source;
      bdg.fIncomeAmt.value = bdg.entries[id].a;
    }
    bdg.hIncomeForm.classList.remove("hidden");
  }
}

// 5 Toggle visibility of expense form
function toggleExpense(id) {
  if (id === false) {
    bdg.fExpenseID.value = "";
    bdg.fExpenseTxt.value = "";
    bdg.fExpenseAmt.value = "";
    bdg.fExpenseCategory.value = "needs";
    bdg.hExpenseForm.classList.add("hidden");
  } else {
    if (Number.isInteger(id)) {
      bdg.fExpenseID.value = id;
      bdg.fExpenseTxt.value = bdg.entries[id].t;
      bdg.fExpenseAmt.value = bdg.entries[id].a;
      bdg.fExpenseCategory.value = bdg.entries[id].c;
    }
    bdg.hExpenseForm.classList.remove("hidden");
  }
}

// 6 Draw the balance, income, expense, and list (must be async)
async function draw() {
  let bal = 0, inc = 0, exp = 0, row;
  console.log("Fetching entries from Firestore...");

  try {
    const querySnapshot = await getDocs(collection(db, "entries"));
    console.log("Entries fetched:", querySnapshot.docs.length);

    bdg.hList.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const entry = doc.data();
      entry.id = doc.id;

      // 7 Asegurarnos de que 'entry.date' existe y es un Timestamp antes de convertirlo
      let entryDate = null;
      if (entry.date) {
        // Verificar si es un Timestamp de Firestore
        if (entry.date instanceof Timestamp) {
          entryDate = entry.date.toDate();
        } else if (entry.date instanceof Date) {
          entryDate = entry.date;
        }
      }

      if (entryDate) {
        const entryMonth = entryDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        if (entryMonth === bdg.selectedMonth) {
          if (entry.s == "+") {
            inc += entry.a;
            bal += entry.a;
          } else {
            exp += entry.a;
            bal -= entry.a;
          }

          row = document.createElement("div");
          row.className = `entry ${entry.s == "+" ? "income" : "expense"}`;
          row.innerHTML = `<div class="eDel" onclick="del('${entry.id}')">X</div>
          <div class="eTxt">${entry.t || entry.source}</div>
          <div class="eCat">${entry.c || ""}</div>
          <div class="eAmt">$${parseFloat(entry.a).toFixed(2)}</div>
          <div class="eEdit" onclick="toggle('${entry.id}')">&#9998;</div>`;
          bdg.hList.appendChild(row);
        }
      } else {
        console.error("Invalid or missing 'date' field for entry:", entry.id);
      }
    });

    bdg.hBal.innerHTML = bal < 0 ? `-$${Math.abs(bal).toFixed(2)}` : `$${bal.toFixed(2)}`;
    bdg.hInc.innerHTML = `$${inc.toFixed(2)}`;
    bdg.hExp.innerHTML = `$${exp.toFixed(2)}`;

  } catch (e) {
    console.error("Error fetching data from Firestore:", e);
  }
}

// 8 Save Income to Firestore (must be async)
async function saveIncome() {
  const data = {
    s: "+",  // Income
    t: "",  
    a: parseFloat(bdg.fIncomeAmt.value),
    c: "",
    source: bdg.fIncomeSource.value,
    date: Timestamp.fromDate(new Date()), // Usamos el Timestamp de Firestore
  };

  console.log("Saving income to Firestore:", data);

  try {
    if (bdg.fIncomeID.value === "") {
      const docRef = await addDoc(collection(db, "entries"), data);
      console.log("New income added:", data);
      console.log("Document ID:", docRef.id);
    } else {
      const incomeDocRef = doc(db, "entries", bdg.fIncomeID.value);
      await updateDoc(incomeDocRef, data);
      console.log("Income updated:", data);
    }

    toggleIncome(false);
    draw();
  } catch (e) {
    console.error("Error saving income:", e);
  }
}

// 9 Save Expense to Firestore (must be async)
async function saveExpense() {
  const data = {
    s: "-",  // Expense
    t: bdg.fExpenseTxt.value,
    a: parseFloat(bdg.fExpenseAmt.value),
    c: bdg.fExpenseCategory.value,
    source: "",
    date: Timestamp.fromDate(new Date()), // Usamos el Timestamp de Firestore
  };

  console.log("Saving expense to Firestore:", data);

  try {
    if (bdg.fExpenseID.value === "") {
      const docRef = await addDoc(collection(db, "entries"), data);
      console.log("New expense added:", data);
      console.log("Document ID:", docRef.id);
    } else {
      const expenseDocRef = doc(db, "entries", bdg.fExpenseID.value);
      await updateDoc(expenseDocRef, data);
      console.log("Expense updated:", data);
    }

    toggleExpense(false);
    draw();
  } catch (e) {
    console.error("Error saving expense:", e);
  }
}

//10  Delete entry from Firestore (must be async)
async function del(id) {
  console.log(`Deleting entry with ID: ${id}`);

  if (confirm("Delete entry?")) {
    try {
      const entryDocRef = doc(db, "entries", id);
      await deleteDoc(entryDocRef);
      console.log(`Entry deleted with ID: ${id}`);
      draw();
    } catch (e) {
      console.error("Error deleting entry:", e);
    }
  }
}

// 11Event listeners
document.getElementById("newIncomeBtn").addEventListener("click", () => {
  toggleIncome(true);
});

document.getElementById("newExpenseBtn").addEventListener("click", () => {
  toggleExpense(true);
});
