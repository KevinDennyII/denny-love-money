import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAccountSchema, 
  insertIncomeSchema, 
  insertSavingsAllocationSchema, 
  insertExpenseSchema, 
  insertDebtSchema, 
  insertMedicalBillSchema, 
  insertHsaPaybackSchema, 
  insertAssetSchema, 
  insertUserSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Error handler helper
  const handleError = (res: any, error: unknown) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  };

  // ==================== AUTH ====================
  app.post("/api/login", (req, res) => {
    const { passphrase } = req.body;
    // Default passphrase is "love-money" if not set in environment
    const correctPassphrase = process.env.AUTH_PASSPHRASE || "love-money";
    
    if (passphrase === correctPassphrase) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid passphrase" });
    }
  });

  // ==================== ACCOUNTS ====================
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const account = await storage.getAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const data = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(data);
      res.status(201).json(account);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const data = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(req.params.id, data);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAccount(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==================== INCOMES ====================
  app.get("/api/incomes", async (req, res) => {
    try {
      const incomes = await storage.getIncomes();
      res.json(incomes);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/incomes", async (req, res) => {
    try {
      const data = insertIncomeSchema.parse(req.body);
      const income = await storage.createIncome(data);
      res.status(201).json(income);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/incomes/:id", async (req, res) => {
    try {
      const data = insertIncomeSchema.partial().parse(req.body);
      const income = await storage.updateIncome(req.params.id, data);
      if (!income) {
        return res.status(404).json({ error: "Income not found" });
      }
      res.json(income);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/incomes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteIncome(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Income not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==================== SAVINGS ALLOCATIONS ====================
  app.get("/api/savings-allocations", async (req, res) => {
    try {
      const allocations = await storage.getSavingsAllocations();
      res.json(allocations);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/savings-allocations", async (req, res) => {
    try {
      const data = insertSavingsAllocationSchema.parse(req.body);
      const allocation = await storage.createSavingsAllocation(data);
      res.status(201).json(allocation);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/savings-allocations/:id", async (req, res) => {
    try {
      const data = insertSavingsAllocationSchema.partial().parse(req.body);
      const allocation = await storage.updateSavingsAllocation(req.params.id, data);
      if (!allocation) {
        return res.status(404).json({ error: "Savings allocation not found" });
      }
      res.json(allocation);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/savings-allocations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSavingsAllocation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Savings allocation not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==================== EXPENSES ====================
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(data);
      res.status(201).json(expense);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const data = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, data);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==================== DEBTS ====================
  app.get("/api/debts", async (req, res) => {
    try {
      const debts = await storage.getDebts();
      res.json(debts);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/debts", async (req, res) => {
    try {
      const data = insertDebtSchema.parse(req.body);
      const debt = await storage.createDebt(data);
      res.status(201).json(debt);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/debts/:id", async (req, res) => {
    try {
      const data = insertDebtSchema.partial().parse(req.body);
      const debt = await storage.updateDebt(req.params.id, data);
      if (!debt) {
        return res.status(404).json({ error: "Debt not found" });
      }
      res.json(debt);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/debts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDebt(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Debt not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==================== MEDICAL BILLS ====================
  app.get("/api/medical-bills", async (req, res) => {
    try {
      const bills = await storage.getMedicalBills();
      res.json(bills);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/medical-bills", async (req, res) => {
    try {
      const data = insertMedicalBillSchema.parse(req.body);
      const bill = await storage.createMedicalBill(data);
      res.status(201).json(bill);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/medical-bills/:id", async (req, res) => {
    try {
      const data = insertMedicalBillSchema.partial().parse(req.body);
      const bill = await storage.updateMedicalBill(req.params.id, data);
      if (!bill) {
        return res.status(404).json({ error: "Medical bill not found" });
      }
      res.json(bill);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/medical-bills/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMedicalBill(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Medical bill not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==================== HSA PAYBACKS ====================
  app.get("/api/hsa-paybacks", async (req, res) => {
    try {
      const paybacks = await storage.getHsaPaybacks();
      res.json(paybacks);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/hsa-paybacks", async (req, res) => {
    try {
      const data = insertHsaPaybackSchema.parse(req.body);
      const payback = await storage.createHsaPayback(data);
      res.status(201).json(payback);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/hsa-paybacks/:id", async (req, res) => {
    try {
      const data = insertHsaPaybackSchema.partial().parse(req.body);
      const payback = await storage.updateHsaPayback(req.params.id, data);
      if (!payback) {
        return res.status(404).json({ error: "HSA payback not found" });
      }
      res.json(payback);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/hsa-paybacks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteHsaPayback(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "HSA payback not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==================== ASSETS ====================
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/assets", async (req, res) => {
    try {
      const data = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(data);
      res.status(201).json(asset);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/assets/:id", async (req, res) => {
    try {
      const data = insertAssetSchema.partial().parse(req.body);
      const asset = await storage.updateAsset(req.params.id, data);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAsset(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ==================== USERS ====================
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const data = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(parseInt(req.params.id), data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUser(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  return httpServer;
}
