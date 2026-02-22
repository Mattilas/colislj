
import React, { useEffect, useRef } from 'react';
import { Package, Smartphone, Shield, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';

interface LoginProps {
  onLogin: (payload: { sub: string, name: string, email: string }) => Promise<void>;
}

declare global {
  interface Window {
    google?: any;
  }
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [configError, setConfigError] = React.useState(false);

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleCredentialResponse = async (response: any) => {
    setIsProcessing(true);
    const userData = decodeJwt(response.credential);
    if (userData) {
      await onLogin({
        sub: userData.sub,
        name: userData.name,
        email: userData.email
      });
    }
    setIsProcessing(false);
  };

  const handleDemoMode = async () => {
    setIsProcessing(true);
    // Simuler un login avec un utilisateur démo
    await onLogin({
      sub: 'demo-user-123',
      name: 'Utilisateur Démo',
      email: 'demo@ecocolis.fr'
    });
    setIsProcessing(false);
  };

  useEffect(() => {
    const initGoogle = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (window.google && googleBtnRef.current && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
          shape: "pill",
        });
        setIsLoading(false);
      } else if (!clientId) {
        console.warn("VITE_GOOGLE_CLIENT_ID est manquant. Le mode démo est activé.");
        setConfigError(true);
        setIsLoading(false);
      } else {
        setTimeout(initGoogle, 100);
      }
    };
    initGoogle();
  }, []);

  return (
    <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center">
        {isProcessing ? (
          <div className="py-12 flex flex-col items-center gap-4 text-emerald-600">
            <Loader2 className="animate-spin" size={48} />
            <p className="font-bold">Chargement de votre session...</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <Package size={40} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">EcoColis</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">Persistance sécurisée et gestion solidaire.</p>
            
            {configError ? (
              <div className="w-full space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle size={18} className="text-amber-500" />
                    Configuration manquante
                  </div>
                  <p className="text-xs">
                    L'ID client Google n'est pas défini (VITE_GOOGLE_CLIENT_ID).
                  </p>
                </div>
                
                <button 
                  onClick={handleDemoMode}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  Tester en Mode Démo <ChevronRight size={18} />
                </button>
                
                <p className="text-[10px] text-slate-400 italic">
                  Note : En mode démo, vos données ne seront pas sauvegardées de manière permanente.
                </p>
              </div>
            ) : (
              <div className="w-full relative min-h-[50px] flex justify-center">
                {isLoading && <Loader2 className="animate-spin text-slate-300" size={24} />}
                <div ref={googleBtnRef} className="w-full"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
