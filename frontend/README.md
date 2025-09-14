# Web3 Certificate Minter

A modern, responsive React application for minting attendance certificates on the blockchain. Built with cutting-edge Web3 technologies and featuring an engaging user experience.

## 🚀 Tech Stack

- **React 18** with Vite for blazing-fast development
- **Wagmi v2** for Web3 wallet integration
- **Viem** for Ethereum interactions
- **@reown/appkit** for wallet connection UI
- **@tanstack/react-query** for server state management
- **Axios** for API calls
- **Responsive CSS** with purple gradient theme

## ✨ Features

- 🔐 **Secure Wallet Connection**: Connect with multiple wallet providers
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop
- 🎨 **Modern UI**: Beautiful purple gradient theme with glassmorphism effects
- ⚡ **Real-time Updates**: Reactive state management with React Query
- 🔄 **Engaging Loading States**: Rotating status messages during server "warm-up"
- 🔗 **Block Explorer Integration**: Direct links to view transactions
- 🛡️ **Error Handling**: Comprehensive error states and retry mechanisms

## 🏗️ Project Structure

```
src/
├── components/
│   └── Minter.jsx          # Core minting logic with React Query
├── config/
│   ├── api.js              # Axios configuration and API methods
│   └── walletconnect.js    # WalletConnect and utility functions
├── App.jsx                 # Main layout and wallet connection
├── main.jsx                # Provider setup (Wagmi, React Query, AppKit)
└── App.css                 # Responsive styling with purple theme
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query axios react react-dom
```

### 2. Get Your Project ID

1. Visit [Reown Cloud](https://cloud.reown.com)
2. Create a new project
3. Copy your Project ID

### 3. Configure the Application

**Update `src/main.jsx`:**

```javascript
const projectId = "YOUR_PROJECT_ID_HERE"; // Replace with your actual project ID
```

**Update `src/config/api.js`:**

```javascript
baseURL: process.env.NODE_ENV === "production"
  ? "https://your-production-api.com" // Replace with your production API URL
  : "http://localhost:3001"; // Your local backend URL
```

### 4. Environment Variables (Optional)

Create a `.env` file:

```
VITE_REOWN_PROJECT_ID=your_project_id_here
VITE_API_BASE_URL=http://localhost:3001
```

Then update the configuration files to use these variables:

```javascript
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;
```

### 5. Run the Application

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Backend API Requirements

Your backend needs to implement these endpoints:

### GET `/api/get-proof?address={user_address}`

**Response for eligible user:**

```json
{
  "proof": ["0x123...", "0x456..."],
  "eligible": true
}
```

**Response for non-eligible user:**

```json
{
  "eligible": false,
  "message": "Address not found in whitelist"
}
```

### POST `/api/mint`

**Request Body:**

```json
{
  "attendee": "0x742d35Cc6635C0532925a3b8D20d1c0e15afe5B7",
  "merkleProof": ["0x123...", "0x456..."]
}
```

**Response:**

```json
{
  "transactionHash": "0x789abc...",
  "success": true
}
```

## 🎨 Customization

### Theme Colors

The purple gradient theme can be customized in `App.css`:

```css
/* Main gradient */
background: linear-gradient(135deg, #4c2a85, #1e1144);

/* Accent color */
color: #bb86fc;

/* Button gradients */
background: linear-gradient(135deg, #bb86fc, #6200ea);
```

### Loading Messages

Customize the engaging loading messages in `Minter.jsx`:

```javascript
const LOADING_MESSAGES = [
  "🌟 Your custom message...",
  "✨ Another engaging message...",
  // Add more messages
];
```

### Supported Networks

Configure networks in `main.jsx`:

```javascript
import { mainnet, sepolia, polygon } from "wagmi/chains";

// Add networks to the configuration
networks: [mainnet, sepolia, polygon];
```

## 📱 Responsive Design

The application uses a mobile-first approach with breakpoints:

- **Mobile**: < 480px
- **Tablet**: 768px+
- **Desktop**: 1024px+
- **Large Desktop**: 1440px+

## 🔒 Security Features

- **Input validation** for all API calls
- **Error boundaries** for graceful error handling
- **Request timeouts** to prevent hanging requests
- **Retry mechanisms** with exponential backoff
- **HTTPS enforcement** in production

## 🐛 Troubleshooting

### Common Issues

1. **"Project ID not found"**

   - Make sure you've replaced `YOUR_PROJECT_ID_HERE` with your actual Reown project ID

2. **API connection errors**

   - Check that your backend is running on the correct port
   - Verify the API base URL in `config/api.js`

3. **Wallet connection issues**

   - Ensure you're using a supported browser with a Web3 wallet
   - Check that your wallet is connected to the correct network

4. **Build errors**
   - Run `npm install` to ensure all dependencies are installed
   - Clear node_modules and reinstall if needed: `rm -rf node_modules package-lock.json && npm install`

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support, please check:

1. The troubleshooting section above
2. [Wagmi Documentation](https://wagmi.sh)
3. [Reown AppKit Documentation](https://docs.reown.com/appkit)
4. [React Query Documentation](https://tanstack.com/query)

---

Built with ❤️ using modern Web3 technologies
