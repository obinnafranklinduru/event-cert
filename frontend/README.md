# 🌟 Cosmic Claim dApp

A beautiful, modern React dApp for claiming NFT certificates with cosmic elegance and seamless UX.

## ✨ Features

- **Cosmic Elegance**: Dark mode with glowing accents and smooth animations
- **Multi-Wallet Support**: Connect with MetaMask, WalletConnect, and more
- **Responsive Design**: Perfect experience on mobile and desktop
- **Real-time Status**: Engaging status messages during transactions
- **Error Handling**: User-friendly error messages and retry functionality
- **Modular Architecture**: Clean, maintainable code structure

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- A WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com/))

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd frontend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_CONTRACT_ADDRESS=your_contract_address
VITE_API_BASE_URL=http://localhost:8000/api
```

3. **Start development server:**
```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

### Build for Production

```bash
npm run build
```

The build outputs to `dist/` which your backend serves.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── WalletConnectButton.jsx
│   ├── ClaimStatus.jsx
│   └── CosmicLoader.jsx
├── hooks/              # Custom React hooks
│   ├── useWallet.js
│   ├── useEligibility.js
│   └── useClaim.js
├── services/           # API and external services
│   ├── api.js
│   └── wallet.js
├── utils/              # Helper functions and constants
│   ├── constants.js
│   ├── formatters.js
│   └── messages.js
├── App.jsx            # Main application component
├── App.css           # Cosmic theme styles
└── main.jsx         # Application entry point
```

## 🎨 Design System

### Colors
- **Primary**: `#64ffda` (Cosmic Cyan)
- **Secondary**: `#7c4dff` (Cosmic Purple)  
- **Accent**: `#ff6b9d` (Cosmic Pink)
- **Background**: Dark gradient (`#0a0a23` → `#2d1b69`)

### Typography
- **Primary**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono (addresses, hashes)

### Components
- **Glassmorphism cards** with blur effects
- **Animated backgrounds** with moving stars
- **Smooth transitions** and hover effects
- **Pulse animations** for interactive elements

## 🔧 Configuration

### Networks
The dApp supports Base and Base Sepolia networks:

```javascript
// Configured in src/utils/constants.js
export const NETWORKS = {
  BASE_MAINNET: { id: '0x2105', name: 'Base' },
  BASE_SEPOLIA: { id: '0x14a33', name: 'Base Sepolia' }
};
```

### API Endpoints
- `GET /api/get-proof?address=<wallet_address>` - Get Merkle proof
- `POST /api/mint` - Submit mint transaction

## 🎭 User Journey

1. **Connect Wallet** → Smooth wallet connection with loading states
2. **Check Eligibility** → Fetch Merkle proof with cosmic status messages  
3. **Claim Certificate** → Submit transaction with real-time updates
4. **Success** → Celebration with block explorer link

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

### Adding New Components
1. Create component in `src/components/`
2. Add styles using CSS-in-JS or CSS modules
3. Export from component file
4. Import in parent components

### Custom Hooks Pattern
```javascript
// Example custom hook
export const useCustomHook = () => {
  const [state, setState] = useState();
  
  const action = useCallback(() => {
    // Hook logic
  }, []);
  
  return { state, action };
};
```

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+  
- Safari 14+
- Mobile browsers (iOS Safari, Android Chrome)

## 📱 Mobile Optimization

- Responsive breakpoints at 640px and 480px
- Touch-friendly button sizes (min 44px)
- Optimized animations for mobile performance
- Backdrop blur fallbacks for older devices

## 🔐 Security Features

- Address validation and normalization
- Error boundary components
- Secure environment variable handling
- No localStorage usage (as per Claude.ai requirements)

## 🎯 Performance

- Code splitting with dynamic imports
- Optimized bundle sizes
- Lazy loading of wallet connections
- Efficient re-renders with useMemo/useCallback

## 📞 Support

For issues or questions:
1. Check the browser console for errors
2. Verify environment variables are set
3. Ensure backend is running on expected port
4. Check wallet connection and network

## 🚢 Deployment

The app is designed to be served by your Express backend from the `frontend/dist/` folder. The backend handles routing and API endpoints while serving the React app for all non-API routes.

---

**Built with cosmic love** ✨ **for the decentralized future** 🚀