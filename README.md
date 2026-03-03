
# Global International Banking Dashboard

A sophisticated, high-security professional banking dashboard designed for institutional liquidity management. This application features automated IBAN detection, secure fund transfer simulations, and the generation of consolidated institutional document bundles.

## 🚀 Database & Backend Integration Guide

The application is designed to work in two modes: **Mock (Simulation)** and **Live (SQL Database)**.

---

### 1. Installing PostgreSQL

To use the **Live** mode, you must have a PostgreSQL instance running. Follow the guide for your operating system:

#### **A. Windows**
1. **Official Installer**: Download the interactive installer from [postgresql.org](https://www.postgresql.org/download/windows/).
2. **Setup**: Run the `.exe`. During installation:
   - Set a password for the `postgres` superuser (e.g., `admin123`).
   - Leave the port as `5432`.
3. **Environment Variables**: Add the PostgreSQL `bin` folder (usually `C:\Program Files\PostgreSQL\<version>\bin`) to your System PATH to use `psql` in the command prompt.

#### **B. macOS (Recommended: Homebrew)**
1. Open Terminal and install Homebrew if you haven't: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
2. Install PostgreSQL:
   ```bash
   brew install postgresql@14
   ```
3. Start the service:
   ```bash
   brew services start postgresql@14
   ```

#### **C. Linux (Ubuntu/Debian)**
1. Update packages and install:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```
2. Ensure the service is running:
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

---

### 2. Database Initialization
Once PostgreSQL is installed, initialize the institutional schema:

1. **Open your Terminal/Command Prompt**.
2. **Access PostgreSQL**:
   - On Windows: Open `pgAdmin 4` (installed with the app) or use the `SQL Shell`.
   - On macOS/Linux: Type `psql postgres`.
3. **Create the Database & Tables**:
   Run the provided `database.sql` file:
   ```bash
   # Replace 'postgres' with your OS username if needed
   psql -U postgres -f database.sql
   ```
   *Note: If you are prompted for a password, enter the one you set during installation.*

---

### 3. Backend Server Setup (`server.js`)
The backend is built with Node.js and Express.
1. **Install Dependencies**:
   ```bash
   npm install express cors pg jsonwebtoken bcrypt
   ```
2. **Configure Credentials**:
   In `server.js`, update the `Pool` configuration with your local database credentials or set the environment variables:
   - `DB_USER` (Default: `asdi_global`)
   - `DB_PASSWORD` (Default: `admin123`)
   - `DB_HOST` (Default: `localhost`)
   - `DB_NAME` (Default: `global_int_banking`)
3. **Run Server**:
   ```bash
   node server.js
   ```
   The API will start on `http://localhost:5000`.

### 4. Frontend Connection (`api.ts`)
To bridge the frontend to your real SQL database:
1. Open `api.ts`.
2. Locate the constant `USE_MOCK_API`.
3. Change it to `false`:
   ```typescript
   const USE_MOCK_API = false;
   ```

---

## 🔑 Login Credentials (Initial Seed)
- **Username:** `asdi_global`
- **Password:** `admin123`
*(Stored in the `users` table via `database.sql`)*

---

## ✨ Key Features
- **Institutional Ledger**: Real-time balance tracking with SQL persistence.
- **Atomic Transfers**: Transactions are handled via SQL transactions (BEGIN/COMMIT) in `server.js` to ensure data integrity.
- **JWT Authentication**: Secure sessions with signed tokens.
- **Automated IBAN Validation**: Real-time detection of country origin and central bank data.
- **Document Bundle Generation**: Export high-fidelity PDF bundles (Vouchers, SWIFT MT103).

## 🛠 Technical Specifications
- **Frontend**: React (v19), Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL / SQL.
- **PDF Engine**: `html2pdf.js`.

---
© 2024 Global International Banking Group. Secure Tier-1 International Entity.
