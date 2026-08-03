
import React, { useState, createContext, useContext, useCallback, useEffect, useRef, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaXTwitter, FaTiktok, FaWhatsapp } from 'react-icons/fa6';
const Home = lazy(() => import('./pages/marketplace/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Dispute = lazy(() => import('./pages/transactions/Dispute'));
const Profile = lazy(() => import('./pages/Profile'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Verification = lazy(() => import('./pages/Verification'));
const Login = lazy(() => import('./pages/Login'));
const RegisterWizard = lazy(() => import('./pages/RegisterWizard'));
const Publish = lazy(() => import('./pages/publish/Publish'));
const Messages = lazy(() => import('./pages/Messages'));
const ProductDetail = lazy(() => import('./pages/marketplace/ProductDetail'));
const Search = lazy(() => import('./pages/marketplace/Search'));
const Checkout = lazy(() => import('./pages/transactions/Checkout'));
const TransactionDetail = lazy(() => import('./pages/transactions/TransactionDetail'));
const Success = lazy(() => import('./pages/transactions/Success'));
const PaymentSuccess = lazy(() => import('./pages/transactions/PaymentSuccess'));
const PaymentFailure = lazy(() => import('./pages/transactions/PaymentFailure'));
const ESgrow = lazy(() => import('./pages/transactions/ESgrow'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const EscrowInfo = lazy(() => import('./pages/EscrowInfo'));
const VerifyDelivery = lazy(() => import('./pages/VerifyDelivery'));
const TermsAndCosts = lazy(() => import('./pages/legal/TermsAndCosts'));
const PaymentMethods = lazy(() => import('./pages/legal/PaymentMethods'));
const ProhibitedItems = lazy(() => import('./pages/legal/ProhibitedItems'));
const ResolutionCenter = lazy(() => import('./pages/ResolutionCenter'));
import RequireProfile from './components/RequireProfile';
import ProtectedRoute from './components/ProtectedRoute';
const ReportedItems = lazy(() => import('./pages/admin/ReportedItems'));
import { AuthProvider, useAuth } from './lib/auth';
import { NotificationProvider } from './context/NotificationContext';
import { DialogProvider } from './context/DialogContext';
import { CartProvider } from './context/CartContext';
const TermsAndConditions = lazy(() => import('./pages/legal/TermsAndConditions'));
const LegalNotice = lazy(() => import('./pages/legal/LegalNotice'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const CookiesPolicy = lazy(() => import('./pages/legal/CookiesPolicy'));
const ScamPrevention = lazy(() => import('./pages/legal/ScamPrevention'));

import Header from './components/Header';
import Logo from './components/Logo';
const Deals = lazy(() => import('./pages/Deals'));
const Cart = lazy(() => import('./pages/Cart'));
const Shop = lazy(() => import('./pages/marketplace/Shop'));
const About = lazy(() => import('./pages/About'));
const SecurityInfo = lazy(() => import('./pages/SecurityInfo'));
const GamificationRules = lazy(() => import('./pages/GamificationRules'));
const Favorites = lazy(() => import('./pages/Favorites'));
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

// --- App Infrastructure ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname]);
  return null;
};

const PageProgressBar = () => {
  const { pathname } = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 550);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ originX: 0 }}
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-500 z-[9999] shadow-[0_0_15px_rgba(249,115,22,0.8)] pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
};

const Footer = () => (
  <footer className="mt-20 pt-20 pb-10 bg-surface border-t border-outline-variant/30 relative">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
        {/* Brand Section */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <Logo size="lg" />
          </div>
          <p className="text-sm font-medium text-on-surface-variant max-w-sm mb-8 leading-relaxed">
            La plataforma de compra y venta más segura. Unimos compradores y vendedores a través de tecnología de vanguardia y protección total.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-pink-600 hover:text-white transition-all shadow-sm">
              <FaInstagram className={"text-lg" as any} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-blue-600 hover:text-white transition-all shadow-sm">
              <FaFacebookF className={"text-lg" as any} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-black hover:text-white transition-all shadow-sm">
              <FaXTwitter className={"text-lg" as any} />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <FaTiktok className={"text-lg" as any} />
            </a>
            <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
              <FaWhatsapp className={"text-lg" as any} />
            </a>
          </div>
        </div>

        {/* Links: Navegación */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-6">Navegación</h4>
          <ul className="space-y-4">
            <li><Link to="/" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Inicio</Link></li>
            <li><Link to="/search" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Explorar Productos</Link></li>
            <li><Link to="/deals" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Ofertas del Día</Link></li>
            <li><Link to="/publish" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Vender un Producto</Link></li>
          </ul>
        </div>

        {/* Links: Ayuda */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-6">Ayuda</h4>
          <ul className="space-y-4">
            <li><Link to="/resolution-center" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Centro de Ayuda</Link></li>
            <li><Link to="/escrow-info" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">¿Cómo funciona?</Link></li>
            <li><Link to="/security" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Consejos de Seguridad</Link></li>
            <li><Link to="/reputacion" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Sistema de Puntos</Link></li>
            <li><Link to="/about" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Acerca de VendeloHoy</Link></li>
          </ul>
        </div>

        {/* Links: Legal */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-6">Legal</h4>
          <ul className="space-y-4">
            <li><Link to="/legal/terms" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Términos y Condiciones</Link></li>
            <li><Link to="/legal/privacy" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Políticas de Privacidad</Link></li>
            <li><Link to="/legal/prohibited" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Artículos Prohibidos</Link></li>
            <li><Link to="/legal/scam-prevention" className="text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors">Prevención de Fraudes</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-outline-variant/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center md:text-left">
          © {new Date().getFullYear()} Vendelo Hoy. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Plataforma Segura</span>
        </div>
      </div>
    </div>
  </footer>
);

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="w-full flex-grow flex flex-col origin-top"
      >
        {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement, { location } as any) : children}
      </motion.div>
    </AnimatePresence>
  );
};

import { BroadcastBar } from './components/BroadcastBar';
import { BottomNav } from './components/BottomNav';

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <NotificationProvider>
      <DialogProvider>
        <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <PageProgressBar />
            <div className="flex flex-col min-h-screen relative font-body text-dark-charcoal overflow-x-hidden w-full pb-20 md:pb-0">
              <BroadcastBar />
              <Header />
              <main className="flex-grow">
                <PageTransition>
                  <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
                    <Routes>
                    <Route path="/admin/reports" element={
                      <ProtectedRoute requireAdmin={true}>
                        <ReportedItems />
                      </ProtectedRoute>
                    } />
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/shop/:slug" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/publish" element={<RequireProfile><Publish /></RequireProfile>} />
                    <Route path="/transaction/:id" element={<RequireProfile><ESgrow /></RequireProfile>} />
                    <Route path="/escrow/:id" element={<Navigate to="/dashboard" replace />} />

                    <Route path="/dashboard" element={<RequireProfile><Dashboard /></RequireProfile>} />
                    <Route path="/messages" element={<RequireProfile><Messages /></RequireProfile>} />
                    <Route path="/messages/:chatId" element={<RequireProfile><Messages /></RequireProfile>} />
                    <Route path="/wallet" element={<RequireProfile><Wallet /></RequireProfile>} />
                    <Route path="/favorites" element={<RequireProfile><Favorites /></RequireProfile>} />
                    <Route path="/profile/:uid?" element={<Profile />} />
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/settings" element={<RequireProfile><Settings /></RequireProfile>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<RegisterWizard />} />

                    <Route path="/checkout" element={<RequireProfile><Checkout /></RequireProfile>} />
                    <Route path="/success" element={<Success />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/failure" element={<PaymentFailure />} />
                    <Route path="/payment/pending" element={<PaymentSuccess />} />
                    <Route path="/dispute/:transactionId" element={<Dispute />} />
                    <Route path="/verification" element={<Verification />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/escrow-info" element={<EscrowInfo />} />
                    <Route path="/legal/costs" element={<TermsAndCosts />} />
                    <Route path="/legal/prohibited" element={<ProhibitedItems />} />
                    <Route path="/legal/terms" element={<TermsAndConditions />} />
                    <Route path="/legal/notice" element={<LegalNotice />} />
                    <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                    <Route path="/legal/cookies" element={<CookiesPolicy />} />
                    <Route path="/legal/scam-prevention" element={<ScamPrevention />} />
                    <Route path="/verify-delivery" element={<VerifyDelivery />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/security" element={<SecurityInfo />} />
                    <Route path="/reputacion" element={<GamificationRules />} />
                    <Route path="/resolution-center" element={<RequireProfile><ResolutionCenter /></RequireProfile>} />
                  </Routes>
                  </Suspense>
                </PageTransition>
              </main>
              <Footer />
              <BottomNav />
            </div>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
      </DialogProvider>
    </NotificationProvider>
  );
}

export default App;
