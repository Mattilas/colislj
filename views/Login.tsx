
import React from 'react';
import { Package, Smartphone, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <Package size={40} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">EcoColis</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Gérez vos stocks alimentaires de manière solidaire et anonyme.
        </p>

        <div className="space-y-4 w-full mb-8">
          <Feature icon={<Shield size={18} />} text="Pseudonymisation complète" />
          <Feature icon={<Smartphone size={18} />} text="Accès mobile optimisé" />
        </div>

        <button 
          onClick={onLogin}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Se connecter avec Google
        </button>

        <p className="mt-6 text-xs text-slate-400 italic">
          Le premier utilisateur connecté devient automatiquement gestionnaire.
        </p>
      </div>
    </div>
  );
};

const Feature = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-3 text-slate-600 justify-center">
    <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-full">{icon}</div>
    <span className="text-sm font-medium">{text}</span>
  </div>
);

export default Login;
