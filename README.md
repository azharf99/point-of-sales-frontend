# ProPoint POS - Frontend

A professional and modern Point of Sale (POS) frontend built with React, Vite, and Tailwind CSS v4.

## 🚀 Tech Stack

- **Framework:** React 18+
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **API Client:** Axios
- **Routing:** React Router Dom

## 🛠️ Features

- **Professional UI:** Designed with Stitch MCP for a modern, clean look.
- **Real-time Checkout:** Fast product lookup and cart management.
- **Secure:** Integrated JWT and Double-Submit CSRF protection.
- **Inventory Management:** Track products, stock levels, and categories.
- **Reporting:** Daily sales overview and top product performance.
- **Payment Integration:** Ready for Midtrans Snap.

## 🚦 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security

This frontend follows rigorous security protocols:
- **CORS:** Configured for credential sharing.
- **CSRF:** Implements Double-Submit Cookie protection for all mutating requests.
- **JWT:** Bearer token authentication.

## 📄 License

APACHE 2.0
