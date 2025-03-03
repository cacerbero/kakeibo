import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyByPS96EKSywMMB_BF0MDOEbshjiP8TOug",
  authDomain: "kakeibo-dd1e0.firebaseapp.com",
  projectId: "kakeibo-dd1e0",
  storageBucket: "kakeibo-dd1e0.firebasestorage.app",
  messagingSenderId: "1002490623760",
  appId: "1:1002490623760:web:c9b163d5a02143ec30d795"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let bdg = {
  data: null,
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

  init: () => {
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

    // Current month logic
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
      bdg.draw(); 
    });

    bdg.draw();  // Draw entries for the selected month
  },

  toggleIncome: (id) => {
    console.log("Toggle income function called with id:", id);
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
  },

  toggleExpense: (id) => {
    console.log("Toggle expense function called with id:", id);
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
  },

  draw: async () => {
    let bal = 0, inc = 0, exp = 0, row;
    const querySnapshot = await getDocs(collection(db, "entries"));
    
    bdg.hList.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const entry = doc.data();
      entry.id = doc.id;  // Add document ID to entry

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
        row.innerHTML = `<div class="eDel" onclick="bdg.del('${entry.id}')">X</div>
        <div class="eTxt">${entry.t || entry.source}</div>
        <div class="eCat">${entry.c || ""}</div>
        <div class="eAmt">$${parseFloat(entry.a).toFixed(2)}</div>
        <div class="eEdit" onclick="bdg.toggle('${entry.id}')">&#9998;</div>`;
        bdg.hList.appendChild(row);
      }
    });

    bdg.hBal.innerHTML = bal < 0 ? `-$${Math.abs(bal).toFixed(2)}` : `$${bal.toFixed(2)}`;
    bdg.hInc.innerHTML = `$${inc.toFixed(2)}`;
    bdg.hExp.innerHTML = `$${exp.toFixed(2)}`;
  },

  saveIncome: async () => {
    let data = {
      s: "+",  // Income
      t: "",  // No description
      a: parseFloat(bdg.fIncomeAmt.value),
      c: "",
      source: bdg.fIncomeSource.value,
      date: new Date().toISOString(),
    };
    console.log("Data to send to Firestore:", data);
    try {
      if (bdg.fIncomeID.value === "") {
        // Add new income entry
        await addDoc(collection(db, "entries"), data);
      } else {
        // Update existing income entry
        const incomeDocRef = doc(db, "entries", bdg.fIncomeID.value);
        await updateDoc(incomeDocRef, data);
      }

      bdg.toggleIncome(false);
      bdg.draw();
    } catch (e) {
      console.error("Error saving income: ", e);
    }

    return false;
  },

  saveExpense: async () => {
    let data = {
      s: "-",  // Expense
      t: bdg.fExpenseTxt.value,
      a: parseFloat(bdg.fExpenseAmt.value),
      c: bdg.fExpenseCategory.value,
      source: "",
      date: new Date().toISOString(),
    };

    try {
      if (bdg.fExpenseID.value === "") {
        // Add new expense entry
        await addDoc(collection(db, "entries"), data);
      } else {
        // Update existing expense entry
        const expenseDocRef = doc(db, "entries", bdg.fExpenseID.value);
        await updateDoc(expenseDocRef, data);
      }

      bdg.toggleExpense(false);
      bdg.draw();
    } catch (e) {
      console.error("Error saving expense: ", e);
    }

    return false;
  },

  del: async (id) => {
    if (confirm("Delete entry?")) {
      try {
        const entryDocRef = doc(db, "entries", id);
        await deleteDoc(entryDocRef);
        bdg.draw();
      } catch (e) {
        console.error("Error deleting entry: ", e);
      }
    }
  }
};

console.log("JavaScript is working!");  // This checks if the script is loaded

// You can place this code wherever you are attaching event listeners
document.getElementById("newIncomeBtn").addEventListener("click", function() {
  console.log("New Income Button Clicked!");  // This checks if the button click is working
  // You can call your bdg.toggleIncome(true) here if needed
});


window.onload = bdg.init;
