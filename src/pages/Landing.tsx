import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  ChevronRight, 
  CheckCircle2, 
  BarChart3, 
  Package, 
  Users, 
  ShieldCheck, 
  Zap,
  Star,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Landing = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const navigate = useNavigate();

  const features = [
    {
      title: "Inventory Management",
      description: "Keep your shelves stocked and your data accurate with automated tracking and low-stock alerts.",
      icon: <Package className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Real-time Analytics",
      description: "Gain deep insights into your sales performance with powerful, instant reporting and visual dashboards.",
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Customer Loyalty",
      description: "Reward your best customers and keep them coming back with integrated rewards and customer profiles.",
      icon: <Users className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Secure Payments",
      description: "Accept all major payment methods securely with end-to-end encryption and fast processing.",
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Cloud Sync",
      description: "Access your business data from anywhere, on any device. Your data is always backed up and synced.",
      icon: <Zap className="w-6 h-6 text-blue-600" />
    },
    {
      title: "Fast Checkout",
      description: "Our intuitive POS interface is designed for speed, helping you serve more customers in less time.",
      icon: <ShoppingCart className="w-6 h-6 text-blue-600" />
    }
  ];

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
              ProPoint POS
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-4 py-2">
                  Log in
                </Link>
                <Link 
                  to="/login" 
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Trusted by 2,000+ Businesses</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
            Empower Your Business, <br />
            <span className="text-blue-600">One Sale at a Time</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Manage your inventory, sales, and analytics with the world's most intuitive retail operating system. Built for growth and designed for simplicity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-200"
            >
              Start Free Trial
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-xl text-lg font-bold hover:bg-slate-50 transition-all">
              Request a Demo
            </button>
          </div>
          
          <div className="mt-16 lg:mt-24 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-[2rem] opacity-20 blur-3xl" />
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
              <div className="text-slate-400 flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                   <ShoppingCart className="w-8 h-8" />
                </div>
                <p className="font-medium">Dashboard Preview Placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Our comprehensive suite of tools helps you manage every aspect of your retail operation with ease.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 group">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section id="testimonials" className="py-24 px-4 overflow-hidden relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-8">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
          </div>
          <blockquote className="text-3xl lg:text-4xl font-medium text-slate-900 mb-10 leading-snug">
            "ProPoint POS has completely transformed how we manage our boutique. It's fast, incredibly reliable, and our staff loves how intuitive it is. The real-time reporting has given us insights we never had before."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">SJ</div>
            <div className="text-left">
              <p className="font-bold text-slate-900 text-lg">Sarah Jenkins</p>
              <p className="text-slate-500 font-medium tracking-wide text-sm uppercase">Owner, Urban Threads Boutique</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Choose the plan that's right for your business. No hidden fees, no long-term contracts.</p>
          </div>
          
          <div className="max-w-md mx-auto bg-white rounded-3xl p-8 lg:p-12 text-slate-900 relative shadow-2xl">
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Most Popular
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">$49</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-10">
              {["All Core Features", "Unlimited Transactions", "24/7 Priority Support", "Advanced Analytics", "Inventory Management", "Multi-terminal Sync"].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-slate-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            
            <button className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              Start Your Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">ProPoint POS</span>
              </div>
              <p className="text-slate-500 max-w-xs leading-relaxed">
                The modern operating system for retail businesses of all sizes. Empowering merchants worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Hardware</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">About Us</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2026 ProPoint POS. All rights reserved.</p>
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
