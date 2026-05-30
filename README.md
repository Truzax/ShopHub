<div align="center">
  <img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <br/>
  
  <h1>ShopHub</h1>
  <p><strong>A full-stack MEAN application for advanced e-commerce insights and management.</strong></p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-installation-guide">Installation</a> •
    <a href="#-api-documentation">API Docs</a> •
    <a href="#-deployment">Deployment</a>
  </p>
</div>

---

## 🌟 Features

- **🔐 Secure Authentication:** JWT-based stateless authentication with role-based access control (Admin vs User).
- **📊 Real-time Dashboard:** Interactive charts and statistics for sales, user growth, and performance insights.
- **🛒 Order Management:** Comprehensive CRUD operations for orders, products, and customer profiles.
- **📱 Fully Responsive:** Beautiful, responsive UI built with modern Angular that works seamlessly on desktop and mobile.
- **🛡️ High Security:** Implementing Helmet, CORS, Rate Limiting, and robust input validation.
- **⚡ Performance Optimized:** Lazy loaded Angular modules, backend caching, and optimized MongoDB indexing.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Angular 18+, TypeScript, RxJS | Core UI framework, state management, and typing. |
| **Backend** | Node.js, Express.js | High-performance server environment and API framework. |
| **Database** | MongoDB, Mongoose | NoSQL database and Object Data Modeling (ODM). |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs | Secure password hashing and stateless auth tokens. |
| **Testing** | Jest, Playwright (E2E) | Comprehensive unit, integration, and end-to-end testing. |
| **Deployment** | Vercel (FE), Render (BE), Docker | Containerization and cloud hosting platforms. |

---

## 🏛️ Project Architecture

The project follows a clean Client-Server separation, allowing both applications to scale independently.

### Folder Structure Overview

```text
E-Commerce-Analytics-Dashboard/
├── e-commerce-backend/      # Node/Express API
│   ├── config/              # Environment & DB configs
│   ├── controllers/         # Request handling & business logic routing
│   ├── middlewares/         # Custom Express middlewares (Auth, Error)
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API endpoint definitions
│   └── services/            # Core business logic & external API integrations
├── e-commerce-frontend/     # Angular Application
│   └── src/app/
│       ├── core/            # Singleton services, interceptors, guards
│       ├── shared/          # Reusable UI components, pipes, directives
│       ├── components/      # Feature modules (analytics, user-profile, login)
│       └── models/          # TypeScript interfaces/types
└── e2e-tests/               # Playwright End-to-End Tests
```

---

## 🚀 Installation Guide

Follow these steps to get the project running on your local machine.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas URI)
- [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)

### 2. Clone the Repository
```bash
git clone https://github.com/yourusername/E-Commerce-Analytics-Dashboard.git
cd E-Commerce-Analytics-Dashboard
```

### 3. Install Dependencies

**For Backend:**
```bash
cd e-commerce-backend
npm install
```

**For Frontend:**
```bash
cd ../e-commerce-frontend
npm install
```

### 4. Configure Environment Variables
See the [Environment Variables](#%E2%9A%99%EF%B8%8F-environment-variables) section below for detailed `.env` setup.

### 5. Start the Development Servers

**Start Backend (Terminal 1):**
```bash
cd e-commerce-backend
npm run dev
```

**Start Frontend (Terminal 2):**
```bash
cd e-commerce-frontend
npm start
```

The application will be available at `http://localhost:4200` and the API at `http://localhost:5000`.

---

## ⚙️ Environment Variables

Create a `.env` file in the `e-commerce-backend` root directory.

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
# Replace with your local or MongoDB Atlas URI
MONGO_URI=mongodb://localhost:27017/ecommerce_analytics

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d

# Frontend URL for CORS configuration
CLIENT_URL=http://localhost:4200
```

*Create an `environment.ts` in `e-commerce-frontend/src/environments/` for frontend config:*
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1'
};
```

---

## 📜 Available Scripts

### Backend (`e-commerce-backend`)
- `npm run dev`: Starts the server with Nodemon for local development.
- `npm start`: Starts the compiled production server.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm test`: Runs backend unit tests using Jest.
- `npm run lint`: Runs ESLint for code formatting.

### Frontend (`e-commerce-frontend`)
- `npm start`: Starts the Angular development server (`ng serve`).
- `npm run build`: Builds the app for production (`ng build`).
- `npm test`: Runs frontend unit tests (Karma/Jasmine or Jest).
- `npm run lint`: Runs Angular ESLint.

---

## 📖 API Documentation

Base URL: `/api/v1`

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user | `{ name, email, password }` | ❌ No |
| `POST` | `/auth/login` | Authenticate & get token | `{ email, password }` | ❌ No |
| `GET`  | `/auth/me` | Get current user profile | None | ✅ Yes |

### Analytics & Products Endpoints

| Method | Endpoint | Description | Query Params | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET`  | `/analytics/sales` | Get sales summary | `?range=7d` | ✅ Yes (Admin) |
| `GET`  | `/analytics/performance` | Get performance insights | None | ✅ Yes (Admin) |
| `GET`  | `/products` | List all products | `?page=1&limit=10` | ✅ Yes |
| `POST` | `/products` | Create a new product | `{ name, price, stock }`| ✅ Yes (Admin) |

**Response Example (Success 200 OK):**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 45200.50,
    "activeUsers": 1205
  }
}
```

---

## 🔐 Authentication Flow

1. **Login Request:** Client sends credentials to `/api/v1/auth/login`.
2. **Token Generation:** Server validates credentials and returns a signed JWT.
3. **Storage:** Frontend stores the JWT securely (e.g., HTTP-only cookie or localStorage).
4. **Interceptors:** The Angular `AuthInterceptor` automatically attaches the JWT as a Bearer token in the `Authorization` header of all subsequent HTTP requests.
5. **Route Protection:** Angular `AuthGuard` and `AdminGuard` prevent unauthorized access to frontend routes. Backend middlewares (`protect`, `authorize`) secure API endpoints.

---

## 🗄️ Database Schema

Key Mongoose models defining our NoSQL structure:

**User Schema:**
```javascript
{
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Hashed
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
}
```

**Order Schema:**
```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderItems: [{ product: ObjectId, quantity: Number, price: Number }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Shipped', 'Delivered'], default: 'Pending' }
}
```

---

## 🖥️ Frontend Structure

The Angular application is modularized for scalability:

- **Modules & Routing:** Feature modules (e.g., `AnalyticsModule`, `AuthModule`) are lazy-loaded via the main router to decrease initial bundle size.
- **Services:** Responsible for API communication using `HttpClient`. E.g., `SalesSummaryService`.
- **State Management:** Reactive state management utilizing RxJS `BehaviorSubject` for complex UI state mapping.
- **Guards:** `canActivate` route guards ensure users cannot navigate to restricted pages.
- **Interceptors:** Globally handle token injection and centralized HTTP error handling/toast notifications.
- **Reusable Components:** Shared UI components (buttons, charts, tables) are isolated in a `shared/` module for DRy code.

---

## ⚙️ Backend Structure

The Express server utilizes a layered architecture:

- **Routes:** Define the API endpoints and map them to specific controllers.
- **Controllers:** Extract request data, pass it to services, and format the HTTP response.
- **Middlewares:** Reusable logic for request validation (`express-validator`), authentication validation, and a centralized Global Error Handler.
- **Services:** Contains the core business logic, database queries, and data aggregation (e.g., MongoDB Aggregation Pipelines for analytics).
- **Validation:** Ensures payloads are rigorously checked before ever hitting the database logic.

---

## ☁️ Deployment

### Frontend (Vercel / Netlify)
1. Connect your GitHub repository to Vercel/Netlify.
2. Set the build command to `npm run build` or `ng build --configuration production`.
3. Set the output directory to `dist/e-commerce-frontend/browser` (or equivalent Angular 18 output path).
4. Add environment variables for `API_URL` to point to your deployed backend.

### Backend (Render / Railway)
1. Connect your GitHub repository.
2. Set the root directory to `e-commerce-backend`.
3. Build command: `npm install && npm run build`.
4. Start command: `npm start`.
5. Populate all `.env` variables in the platform's dashboard.

### MongoDB Atlas
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Whitelist your deployment server's IP address (or `0.0.0.0/0` for universal access).
3. Copy the connection string and set it as your `MONGO_URI` environment variable.

---

## 🧪 Testing

We believe in robust code quality.

- **Unit Testing (Backend):** Using Jest to mock MongoDB and test controller/service logic.
- **API Testing:** Using Supertest alongside Jest to test endpoint responses and status codes.
- **Frontend Testing:** Jasmine/Karma for Angular component rendering and service logic.
- **E2E Testing:** Playwright is configured in the `e2e-tests/` directory to simulate real user journeys (e.g., Login -> View Dashboard -> Create Order).

---

## 🛡️ Security Best Practices

- **Password Hashing:** Passwords are never stored in plain text. `bcryptjs` is used with a high salt round.
- **Helmet:** Sets secure HTTP headers to prevent XSS, clickjacking, and other common attacks.
- **CORS:** Configured strictly to only accept requests from the trusted frontend origin.
- **Rate Limiting:** `express-rate-limit` is implemented on auth routes to prevent brute-force attacks.
- **Input Validation:** Data sanitized and validated using `express-validator` and Mongoose schema validations to prevent NoSQL Injection.
- **Environment Variables:** Secrets are never hardcoded and loaded strictly via `dotenv`.

---

## ⚡ Performance Optimizations

- **Lazy Loading:** Angular routes are split into chunks and loaded only when navigated to.
- **Angular Optimization:** Build processes include AOT (Ahead-of-Time) compilation and build optimizers.
- **Compression:** Node server utilizes the `compression` middleware to gzip API responses, significantly reducing payload sizes.
- **MongoDB Indexing:** Critical fields (e.g., `email`, `createdAt`, `status`) are indexed for fast read operations and efficient aggregation queries.
- **Caching (Future):** Redis implementation planned for caching heavy analytics data.

---

## 🐛 Troubleshooting

**Q: MongoDB Connection Error (`MongoTimeoutError`)**
> **Fix:** Ensure your local MongoDB daemon is running (`sudo systemctl start mongod` or equivalent). If using Atlas, ensure your current IP address is whitelisted in the Network Access tab.

**Q: CORS Error on Frontend Requests**
> **Fix:** Check your backend `.env` file. The `CLIENT_URL` must exactly match your frontend URL without a trailing slash (e.g., `http://localhost:4200`).

**Q: Angular compilation failing with module not found.**
> **Fix:** Ensure you have run `npm install` inside the `e-commerce-frontend` directory. Check for typos in your import paths.

---

## 🗺️ Roadmap

- [ ] Integrate Stripe for payment processing.
- [ ] Add Redis for caching analytics aggregation pipelines.
- [ ] Implement WebSocket (Socket.io) for live order tracking notifications.
- [ ] Add multi-language support (i18n) to the Angular frontend.
- [ ] Automated weekly email reports using Nodemailer & Cron jobs.

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact

**Project Maintainer:** Akshay Shukla

- 📧 Email: akshaysbuilds@gmail.com
- 💼 LinkedIn: [linkedin.com/in/akshaysshukla](https://www.linkedin.com/in/akshaysshukla/)
- 🐙 GitHub: [github.com/AkshayS734](https://github.com/AkshayS734)

<p align="right"><a href="#top">⬆️ Back to Top</a></p>
