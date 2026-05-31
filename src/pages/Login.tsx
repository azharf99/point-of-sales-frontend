import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface CustomWindow extends Window {
  grecaptcha?: {
    render: (container: HTMLElement | string, parameters: { sitekey: string | undefined; callback: () => void }) => number;
    reset: (opt_widget_id?: number) => void;
    getResponse: (opt_widget_id?: number) => string;
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const recaptchaRef = React.useRef<HTMLDivElement>(null);
  const [widgetId, setWidgetId] = React.useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  React.useEffect(() => {
    const isRecaptchaEnabled = !!import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!isRecaptchaEnabled) return;

    const renderRecaptcha = () => {
      const win = window as unknown as CustomWindow;
      if (win.grecaptcha && win.grecaptcha.render && recaptchaRef.current) {
        try {
          const id = win.grecaptcha.render(recaptchaRef.current, {
            sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
            callback: () => setError(null),
          });
          setWidgetId(id);
        } catch (e) {
          console.warn("reCAPTCHA render error:", e);
        }
      } else {
        // Retry if script not loaded yet
        setTimeout(renderRecaptcha, 500);
      }
    };

    renderRecaptcha();

    return () => {
      // Cleanup if needed, but grecaptcha doesn't have an easy destroy for single widgets
      // sometimes win.grecaptcha.reset(widgetId) is enough if re-rendering
    };
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    const win = window as unknown as CustomWindow;
    const isRecaptchaEnabled = !!import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    let recaptchaToken = '';
    
    if (isRecaptchaEnabled) {
      try {
        if (win.grecaptcha && typeof win.grecaptcha.getResponse === 'function') {
          // Use widgetId if available for more precision
          recaptchaToken = widgetId !== null 
            ? win.grecaptcha.getResponse(widgetId) 
            : win.grecaptcha.getResponse();
        }
      } catch (e) {
        console.warn("Failed to get reCAPTCHA response:", e);
      }

      if (!recaptchaToken) {
        setError('Please verify that you are not a robot.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await authApi.login({
        username: data.username,
        password: data.password,
        recaptcha_token: recaptchaToken,
      });
      if (response.success) {
        setAuth(response.data.user);
        useSettingsStore.getState().fetchSettings();
        navigate('/dashboard');
      } else {
        if (isRecaptchaEnabled && win.grecaptcha) {
          if (widgetId !== null) {
            win.grecaptcha.reset(widgetId);
          } else {
            win.grecaptcha.reset();
          }
        }
        setError(response.message);
      }
    } catch (err: unknown) {
      if (isRecaptchaEnabled && win.grecaptcha) {
        if (widgetId !== null) {
          win.grecaptcha.reset(widgetId);
        } else {
          win.grecaptcha.reset();
        }
      }
      const message = err instanceof Error && 'response' in err 
        ? (err as { response: { data: { message: string } } }).response?.data?.message 
        : 'Failed to login. Please check your credentials.';
      setError(message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans overflow-hidden">
      {/* Left side: Illustration & Message */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 flex-col justify-center items-center p-12 text-white relative">
        <div className="absolute inset-0 bg-blue-700 opacity-20 pattern-dots"></div>
        <div className="relative z-10 max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <ShoppingCart className="w-16 h-16" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-6">ProPoint POS</h1>
          <p className="text-xl text-blue-100 mb-8">
            Empowering your business, one sale at a time. Professional, fast, and reliable point of sale system.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-sm font-semibold opacity-70">Real-time</p>
              <p className="text-lg font-bold">Inventory</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-sm font-semibold opacity-70">Detailed</p>
              <p className="text-lg font-bold">Reporting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-2">
              <ShoppingCart className="w-10 h-10" />
              ProPoint POS
            </h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Login to your account</h2>
            <p className="text-slate-500">Enter your credentials to access your dashboard.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Forgot Password?
                </a>
              </div>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-slate-600">
                Remember me
              </label>
            </div>

            {/* reCAPTCHA v2 Challenge */}
            {import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
              <div className="flex justify-center my-2">
                <div ref={recaptchaRef}></div>
              </div>
            )}

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
