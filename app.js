import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd-5J7Nz5h7qYwvuitlPubTNzCmlL1xZI",
  authDomain: "checklist-3d13a.firebaseapp.com",
  projectId: "checklist-3d13a",
  storageBucket: "checklist-3d13a.firebasestorage.app",
  messagingSenderId: "537572989728",
  appId: "1:537572989728:web:a4e786dfbdd06772745545"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

// Initialize UI elements
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

// Toggle visibility of income form
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

// Toggle visibility of expense form
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

// Draw the balance, income, expense, and list
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

      const entryDate = new Date(entry.date);
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
    });

    bdg.hBal.innerHTML = bal < 0 ? `-$${Math.abs(bal).toFixed(2)}` : `$${bal.toFixed(2)}`;
    bdg.hInc.innerHTML = `$${inc.toFixed(2)}`;
    bdg.hExp.innerHTML = `$${exp.toFixed(2)}`;

  } catch (e) {
    console.error("Error fetching data from Firestore:", e);
  }
}

// Save Income to Firestore
async function saveIncome() {
  const data = {
    s: "+",  // Income
    t: "",  
    a: parseFloat(bdg.fIncomeAmt.value),
    c: "",
    source: bdg.fIncomeSource.value,
    date: new Date().toISOString(),
  };

  console.log("Saving income to Firestore:", data);

  try {
    if (bdg.fIncomeID.value === "") {
      await addDoc(collection(db, "entries"), data);
      console.log("New income added:", data);
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

// Save Expense to Firestore
async function saveExpense() {
  const data = {
    s: "-",  // Expense
    t: bdg.fExpenseTxt.value,
    a: parseFloat(bdg.fExpenseAmt.value),
    c: bdg.fExpenseCategory.value,
    source: "",
    date: new Date().toISOString(),
  };

  console.log("Saving expense to Firestore:", data);

  try {
    if (bdg.fExpenseID.value === "") {
      await addDoc(collection(db, "entries"), data);
      console.log("New expense added:", data);
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

// Delete entry from Firestore
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

// Event listeners
document.getElementById("newIncomeBtn").addEventListener("click", () => {
  toggleIncome(true);
});

document.getElementById("newExpenseBtn").addEventListener("click", () => {
  toggleExpense(true);
});
