import { db } from "./db";
import { 
  accounts, 
  incomes, 
  savingsAllocations, 
  expenses, 
  debts, 
  medicalBills, 
  hsaPaybacks, 
  assets 
} from "@shared/schema";
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  console.log("Checking database seed status...");

  // Seed Accounts based on Excel data
  const existingAccounts = await db.select().from(accounts);
  if (existingAccounts.length === 0) {
    console.log("Seeding Accounts...");
    const accountsData = [
      { name: "Family USAA Checking", institution: "USAA", accountNumber: "5494", accountType: "checking", currentBalance: "7550", owner: "Joint", notes: "Starting the month of August 2025 $1800 was put back here as we no longer pay for private schooling", isActive: true },
      { name: "Jamie USAA Checking", institution: "USAA", accountNumber: "1986", accountType: "checking", currentBalance: "300", owner: "Jamie", notes: "Left over so Jamie does not have to go and change current bills being paid for", isActive: true },
      { name: "Chime Prepaid Visa", institution: "Chime", accountNumber: "", accountType: "checking", currentBalance: "4179", owner: "Joint", notes: "Bills paid with this Prepaid Card can be found on the monthly expenses sheet", isActive: true },
      { name: "Kevin NFCU Checking", institution: "Navy Federal", accountNumber: "7710", accountType: "checking", currentBalance: "200", owner: "Kevin", notes: "Allowance account", isActive: true },
      { name: "Kevin Greenwood Checking", institution: "Greenwood", accountNumber: "", accountType: "savings", currentBalance: "75", owner: "Kevin", notes: "Traveling Fund, 4.15% APR Savings Account", isActive: true },
      { name: "Kevin NFCU Savings", institution: "Navy Federal", accountNumber: "", accountType: "savings", currentBalance: "0", owner: "Kevin", isActive: true },
    ];
    await db.insert(accounts).values(accountsData);
  } else {
    console.log("Accounts already seeded, skipping...");
  }

  // Seed Income sources
  const existingIncomes = await db.select().from(incomes);
  if (existingIncomes.length === 0) {
    console.log("Seeding Incomes...");
    const incomesData = [
      { name: "Family USAA Income", amount: "7550", frequency: "monthly", notes: "Primary family income deposited to USAA", isActive: true },
      { name: "Jamie USAA Income", amount: "300", frequency: "monthly", notes: "Jamie's account income", isActive: true },
      { name: "Chime Prepaid Income", amount: "4179", frequency: "monthly", notes: "Income for bills paid with Chime", isActive: true },
    ];
    await db.insert(incomes).values(incomesData);
  }

  // Seed Savings Allocations
  const existingSavings = await db.select().from(savingsAllocations);
  if (existingSavings.length === 0) {
    console.log("Seeding Savings Allocations...");
    const savingsData = [
      { name: "Jamie USAA Savings", amount: "300", notes: "Monthly savings allocation", isActive: true },
      { name: "Kevin NFCU Allowance", amount: "200", notes: "Monthly allowance", isActive: true },
      { name: "Kevin Greenwood Traveling", amount: "75", notes: "Traveling Fund, 4.15% APR Savings Account", isActive: true },
      { name: "Kevin Roth IRA", amount: "100", notes: "Retirement contribution", isActive: true },
      { name: "Jamie Roth IRA", amount: "0", notes: "Currently paused", isActive: false },
    ];
    await db.insert(savingsAllocations).values(savingsData);
  }

  // Seed Expenses based on Excel data
  const existingExpenses = await db.select().from(expenses);
  if (existingExpenses.length === 0) {
    console.log("Seeding Expenses...");
    const expensesData = [
      { name: "Rent", budgetedAmount: "1820", frequency: "monthly", notes: "Paid with Chime Prepaid Visa", isActive: true },
      { name: "Electric Bill", budgetedAmount: "270", frequency: "monthly", dueDay: 21, notes: "Average Cost, Utility, Paid on the 21st Using SmartHub App - Paid with Chime Prepaid Visa", isActive: true },
      { name: "Life Insurance (Jamie)", budgetedAmount: "86.51", frequency: "monthly", dueDay: 15, isActive: true },
      { name: "Term Life Insurance (Kevin)", budgetedAmount: "92", frequency: "monthly", isActive: true },
      { name: "Verizon Wireless Plus Streaming", budgetedAmount: "145", frequency: "monthly", notes: "Includes Hulu, Disney+, Espn+ Subscription - Paid with Chime Prepaid Visa", isActive: true },
      { name: "AT&T", budgetedAmount: "85", frequency: "monthly", notes: "Paid with Chime Prepaid Visa", isActive: true },
      { name: "Sewage/Trash/Water", budgetedAmount: "100", frequency: "monthly", notes: "Average Cost (City of Selma) - Paid with Chime Prepaid Visa", isActive: true },
      { name: "Car + Renter's Insurance", budgetedAmount: "250", frequency: "monthly", isActive: true },
      { name: "Groceries", budgetedAmount: "600", frequency: "monthly", notes: "Average Cost", isActive: true },
      { name: "Eating out/Entertainment", budgetedAmount: "1000", frequency: "monthly", notes: "Average Cost", isActive: true },
      { name: "Vehicle Gas", budgetedAmount: "350", frequency: "monthly", notes: "Average Cost", isActive: true },
      { name: "Household Items", budgetedAmount: "100", frequency: "monthly", notes: "Average Cost", isActive: true },
      { name: "Toiletries", budgetedAmount: "100", frequency: "monthly", notes: "Average Cost", isActive: true },
      { name: "Netflix", budgetedAmount: "20", frequency: "monthly", notes: "Paid with Chime Prepaid Visa", isActive: true },
      { name: "Tidal", budgetedAmount: "11", frequency: "monthly", isActive: true },
      { name: "Amazon Prime", budgetedAmount: "16", frequency: "monthly", isActive: true },
      { name: "ExpressVPN", budgetedAmount: "12", frequency: "monthly", isActive: true },
      { name: "Ring", budgetedAmount: "5", frequency: "monthly", notes: "Paid with Chime Prepaid Visa", isActive: true },
      { name: "Notion", budgetedAmount: "10", frequency: "monthly", notes: "Note Taking Application - Paid with Chime Prepaid Visa", isActive: true },
      { name: "Privacy.com Plus", budgetedAmount: "5", frequency: "monthly", notes: "For security of online purchasing", isActive: true },
      { name: "EnviroGuard Pest Control", budgetedAmount: "46", frequency: "monthly", notes: "$90 paid every 2 months - Paid with Chime Prepaid Visa", isActive: true },
      { name: "Lawn and Garden", budgetedAmount: "50", frequency: "monthly", isActive: true },
      { name: "Hair Appointments/Products", budgetedAmount: "250", frequency: "monthly", isActive: true },
      { name: "Skin care products", budgetedAmount: "100", frequency: "monthly", isActive: true },
      { name: "Nail Salon", budgetedAmount: "140", frequency: "monthly", isActive: true },
      { name: "Clothing Items", budgetedAmount: "400", frequency: "monthly", notes: "Kids and Adults", isActive: true },
      { name: "Student Loans (Kevin)", budgetedAmount: "137", frequency: "monthly", notes: "Paid with Chime Prepaid Visa", isActive: true },
      { name: "Student Loans (Jamie)", budgetedAmount: "0", frequency: "monthly", notes: "Paused", isActive: false },
      { name: "Lexus NX 2018 - NFCU Auto Loan", budgetedAmount: "300", frequency: "monthly", notes: "Payments Start January 13th - Paid with Chime Prepaid Visa", isActive: true },
      { name: "Lupita Cleaning", budgetedAmount: "150", frequency: "monthly", isActive: true },
      { name: "Emma - Cheering", budgetedAmount: "75", frequency: "monthly", notes: "Paid with Chime Prepaid Visa", isActive: true },
      { name: "iCode (KJ)", budgetedAmount: "230", frequency: "monthly", notes: "Paid with Chime Prepaid Visa", isActive: true },
      { name: "Kevin Therapy", budgetedAmount: "50", frequency: "monthly", notes: "With Ralph DeMar", isActive: true },
      { name: "Jam Family Calendar", budgetedAmount: "17", frequency: "monthly", notes: "Paid with Chime Prepaid Visa", isActive: true },
      { name: "Mission Compost", budgetedAmount: "31", frequency: "monthly", notes: "Food Waste & Compost Soil Program", isActive: true },
      { name: "Quip Toothbrush Subscription", budgetedAmount: "30", frequency: "monthly", notes: "$89 every 3 months - Paid with Chime Prepaid Visa", isActive: true },
      { name: "New York Times, The Daily", budgetedAmount: "7", frequency: "monthly", notes: "Paid with Chime Prepaid Visa", isActive: true },
      { name: "Nabu Casa Home Assistant", budgetedAmount: "7", frequency: "monthly", isActive: true },
      { name: "Math Prodigy (Kenneth)", budgetedAmount: "11", frequency: "monthly", isActive: true },
    ];
    await db.insert(expenses).values(expensesData);
  }

  // Seed Debts based on Excel data
  const existingDebts = await db.select().from(debts);
  if (existingDebts.length === 0) {
    console.log("Seeding Debts...");
    const debtsData = [
      { name: "USAA Amex - Kevin", creditor: "USAA", debtType: "credit_card", currentBalance: "21401.48", owner: "Kevin", isPaidOff: false },
      { name: "USAA Visa - Kevin", creditor: "USAA", debtType: "credit_card", currentBalance: "5042.75", owner: "Kevin", isPaidOff: false },
      { name: "Affirm Payments - Kevin", creditor: "Affirm", debtType: "pay_later", currentBalance: "3297.44", owner: "Kevin", isPaidOff: false },
      { name: "Klarna Payments - Kevin", creditor: "Klarna", debtType: "pay_later", currentBalance: "382.40", owner: "Kevin", isPaidOff: false },
      { name: "NFCU Visa - Kevin", creditor: "Navy Federal", debtType: "credit_card", currentBalance: "0", owner: "Kevin", isPaidOff: true, notes: "PAID OFF!" },
      { name: "Paypal Pay Later - Kevin", creditor: "PayPal", debtType: "pay_later", currentBalance: "0", owner: "Kevin", isPaidOff: true, notes: "PAID OFF!" },
      { name: "Barclays - Kevin", creditor: "Barclays", debtType: "credit_card", currentBalance: "0", owner: "Kevin", isPaidOff: true, notes: "PAID OFF!" },
      { name: "NFCU Visa - Jamie #1", creditor: "Navy Federal", debtType: "credit_card", currentBalance: "19316.58", minimumPayment: "254", dueDay: 1, owner: "Jamie", isPaidOff: false },
      { name: "NFCU Visa - Jamie #2", creditor: "Navy Federal", debtType: "credit_card", currentBalance: "19591.90", minimumPayment: "258", dueDay: 15, owner: "Jamie", isPaidOff: false },
      { name: "USAA Visa - Jamie", creditor: "USAA", debtType: "credit_card", currentBalance: "6073.10", minimumPayment: "150", owner: "Jamie", isPaidOff: false },
      { name: "Best Buy", creditor: "Best Buy", debtType: "credit_card", currentBalance: "7100", minimumPayment: "150", dueDay: 15, owner: "Jamie", isPaidOff: false },
      { name: "Paypal Credit - Jamie", creditor: "PayPal", debtType: "credit_card", currentBalance: "4987.88", minimumPayment: "175", dueDay: 1, owner: "Jamie", isPaidOff: false },
      { name: "Paypal Mastercard - Jamie", creditor: "PayPal", debtType: "credit_card", currentBalance: "1433.87", minimumPayment: "52", dueDay: 1, owner: "Jamie", isPaidOff: false },
      { name: "AMEX - Jamie", creditor: "American Express", debtType: "credit_card", currentBalance: "2047.89", minimumPayment: "40", dueDay: 1, owner: "Jamie", isPaidOff: false },
      { name: "Affirm Payments - Jamie", creditor: "Affirm", debtType: "pay_later", currentBalance: "1672", minimumPayment: "320", owner: "Jamie", isPaidOff: false },
      { name: "Barclays - Jamie", creditor: "Barclays", debtType: "credit_card", currentBalance: "1114.16", owner: "Jamie", isPaidOff: false },
      { name: "Old Navy", creditor: "Old Navy", debtType: "credit_card", currentBalance: "1100", minimumPayment: "40", dueDay: 1, owner: "Jamie", isPaidOff: false },
      { name: "Navy Federal Auto Loan", creditor: "Navy Federal", debtType: "auto_loan", currentBalance: "15512.01", minimumPayment: "300", owner: "Joint", isPaidOff: false, notes: "Lexus NX 2018" },
      { name: "Student Loan - Kevin", creditor: "Department of Education", debtType: "student_loan", currentBalance: "149320.00", originalBalance: "149320.00", minimumPayment: "137", owner: "Kevin", isPaidOff: false, notes: "Imported from Excel (SC - Strawberry Cupcake)" },
      { name: "Student Loan - Jamie", creditor: "Department of Education", debtType: "student_loan", currentBalance: "9498.91", originalBalance: "9498.91", minimumPayment: "0", owner: "Jamie", isPaidOff: false, notes: "Imported from Excel (HB - Honey Bunches)" },
    ];
    await db.insert(debts).values(debtsData);
  }

  // Seed Medical Bills
  const existingMedical = await db.select().from(medicalBills);
  if (existingMedical.length === 0) {
    console.log("Seeding Medical Bills...");
    const medicalBillsData = [
      { billName: "Diversified Healthcare Services", provider: "Diversified Healthcare", totalAmount: "888.37", amountRemaining: "888.37", monthlyPayment: "50", paymentDay: 5, referenceNumber: "10154184", isPaidOff: false },
      { billName: "Virtusa GYN", provider: "Virtusa OBGYN", totalAmount: "987.89", amountRemaining: "576.29", monthlyPayment: "82.32", notes: "210-878-0090", isPaidOff: false },
      { billName: "Methodist Hospital Northeast", provider: "Methodist Hospital", totalAmount: "919.30", amountRemaining: "804.38", monthlyPayment: "114.92", paymentDay: 23, referenceNumber: "194975821", notes: "Medicredi 800-823-2318", isPaidOff: false },
    ];
    await db.insert(medicalBills).values(medicalBillsData);
  }

  // Seed HSA Paybacks
  const existingHsa = await db.select().from(hsaPaybacks);
  if (existingHsa.length === 0) {
    console.log("Seeding HSA Paybacks...");
    let hsaPaybacksData: any[] = [];
    try {
      const excelPath = path.resolve(__dirname, '../attached_assets/Estimated_Denny_Monthly_Finances_1770003508732.xlsx');
      console.log(`Attempting to read HSA data from: ${excelPath}`);
      
      if (typeof XLSX.readFile === 'function') {
        const workbook = XLSX.readFile(excelPath);
        const hsaSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('hsa'));
        
        if (hsaSheetName) {
          const sheet = workbook.Sheets[hsaSheetName];
          const data = XLSX.utils.sheet_to_json(sheet);
          
          hsaPaybacksData = data.map((row: any) => ({
            description: row['For What?'] || 'Unknown Description',
            amount: String(row['Amount'] || 0),
            year: parseInt(row['Year'] || new Date().getFullYear()),
            isPaid: !!row['Paid?'],
            notes: 'Imported from Excel',
          }));
          
          console.log(`Successfully loaded ${hsaPaybacksData.length} HSA records from Excel.`);
        }
      }
    } catch (error) {
      console.warn("Failed to load HSA data from Excel, falling back to sample data:", error);
    }

    if (hsaPaybacksData.length === 0) {
      console.log("Using sample HSA data.");
      hsaPaybacksData = [
        { description: "Abcd Pediatrics", amount: "30", year: 2022, isPaid: true },
        { description: "To Jamie for Total Healthcare Payment", amount: "191.97", year: 2021, isPaid: true },
        { description: "Methodist physicians (Jamie)", amount: "89.61", year: 2021, isPaid: false },
        { description: "Peds doc bill", amount: "107.48", year: 2021, isPaid: false },
        { description: "Co pays for kids doc visits", amount: "240", year: 2021, isPaid: false },
        { description: "Texas Pediatrics - Sleep consultation copay", amount: "60", year: 2021, isPaid: true },
        { description: "Physical visit with Integrative", amount: "350", year: 2021, isPaid: false },
        { description: "Supergoop Sunscreen", amount: "34", year: 2022, isPaid: false },
        { description: "Dermatologist Copay", amount: "60", year: 2022, isPaid: false },
        { description: "Final payment Dr. Albricht", amount: "63.21", year: 2022, isPaid: false },
        { description: "Kids allergist co pay", amount: "120", year: 2022, isPaid: false },
        { description: "Emma ENT co pay", amount: "60", year: 2022, isPaid: true },
        { description: "Emma Urgent Care Co-pay", amount: "86", year: 2022, isPaid: true },
        { description: "Emma Nasal Spray Medication", amount: "62", year: 2022, isPaid: true },
        { description: "Emma Allergy Copay visit", amount: "60", year: 2022, isPaid: true },
      ];
    }

    await db.insert(hsaPaybacks).values(hsaPaybacksData);
  }

  // Seed Assets based on Net Worth sheet
  const existingAssets = await db.select().from(assets);
  if (existingAssets.length === 0) {
    console.log("Seeding Assets...");
    const assetsData = [
      { name: "Cash (Estimate of All Savings)", value: "1500", assetType: "cash", owner: "Joint" },
      { name: "Car - SC", value: "14000", assetType: "vehicle", owner: "Kevin" },
      { name: "Car - HB", value: "4000", assetType: "vehicle", owner: "Jamie" },
      { name: "Roth IRA - SC", value: "1116.32", assetType: "retirement", owner: "Kevin" },
      { name: "Roth IRA - HB", value: "51800", assetType: "retirement", owner: "Jamie" },
      { name: "Traditional IRA - SC", value: "2649.73", assetType: "retirement", owner: "Kevin" },
      { name: "Traditional IRA - HB", value: "123201", assetType: "retirement", owner: "Jamie" },
      { name: "Booz Allen Hamilton 401k - HB", value: "63374.42", assetType: "retirement", owner: "Jamie" },
      { name: "College Savings 529", value: "5784", assetType: "investment", owner: "Joint" },
      { name: "Stocks/Crypto/BlockChain", value: "400", assetType: "investment", owner: "Kevin" },
      { name: "State of MD Retirement", value: "2500", assetType: "retirement", owner: "Kevin" },
    ];
    await db.insert(assets).values(assetsData);
  }

  console.log("Database seeded successfully!");
}
