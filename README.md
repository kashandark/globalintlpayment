# Global International Banking Dashboard

A sophisticated, high-security professional banking dashboard designed for institutional liquidity management. This application features automated IBAN detection, secure fund transfer simulations, and the generation of consolidated institutional document bundles.

## 🚀 Local Deployment Instructions

To run this application on your local machine, follow these steps:

### 1. Frontend Setup
The application is built using React with ES6 modules. To avoid CORS issues, you must use a local web server.

- **Prerequisites**: Node.js installed on your machine.
- **Steps**:
  1. Clone or download the project files into a folder.
  2. Open your terminal in that folder.
  3. Run the following command:
     ```bash
     npx serve .
     ```
  4. Open your browser to: `http://localhost:3000`

### 2. Database Setup (`database.sql`)
The project includes a `database.sql` file for those looking to migrate from `localStorage` to a persistent backend (PostgreSQL or MySQL).

#### Using PostgreSQL (Recommended)
1. **Create Database**:
   ```sql
   CREATE DATABASE global_int_banking;
   ```
2. **Execute Schema**:
   In your terminal or SQL client:
   ```bash
   psql -U your_username -d global_int_banking -f database.sql
   ```

#### Using MySQL
1. **Create Database**:
   ```sql
   CREATE DATABASE global_int_banking;
   ```
2. **Execute Schema**:
   ```bash
   mysql -u your_username -p global_int_banking < database.sql
   ```

*Note: The current frontend version uses `localStorage` for simulation. To connect the SQL database, a backend API (Node.js/Express or Python/FastAPI) is required to bridge the React frontend with the SQL tables.*

---

## 🔑 Login Credentials
Use the following institutional credentials to access the simulation:
- **Username:** `asdi_global`
- **Password:** `admin123`

---

## ✨ Key Features

- **Institutional Ledger**: Real-time balance tracking with multi-currency support (USD, EUR, GBP, AED, PKR).
- **Automated IBAN Validation**: Real-time detection of country origin, central bank data, and SEPA/SWIFT membership.
- **Document Bundle Generation**: Export high-fidelity PDF bundles including:
  - Official Payment Vouchers
  - SWIFT MT103 Advice
  - Remittance Advice
  - Debit/Credit Advice Notes
- **Advanced Filtering**: Search and filter transaction history by date, amount, direction, and status.
- **Responsive Security UI**: High-contrast, "Dark Blue" professional aesthetic with interactive security logs.

## 🛠 Technical Specifications

- **Frontend**: React (v19) via ESM imports.
- **Styling**: Tailwind CSS (v3).
- **Icons**: Lucide React.
- **PDF Engine**: `html2pdf.js` with custom A4 page-break logic.
- **Database Schema**: SQL (PostgreSQL/MySQL compatible).

## ⚠️ Security Notice
This is a sophisticated **simulation** environment. No real financial transactions are executed. All banking data, IBAN metadata, and SWIFT transmissions are simulated for demonstration purposes.

---
© 2024 Global International Banking Group. Secure Tier-1 International Entity.