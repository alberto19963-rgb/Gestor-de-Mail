import React, { useState } from 'react';
import { 
  Mail, 
  Key, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock,
  LogOut,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Calendar,
  X,
  RotateCcw
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:3000/api/portal`;

const PortalApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [selectedMail, setSelectedMail] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, accessKey })
      });
      
      if (!res.ok) throw new Error('Credenciales incorrectas');
      
      const data = await res.json();
      setLogs(data.logs);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-600/30 mb-6 rotate-3">
              <ShieldCheck className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Audit Portal</h1>
            <p className="text-slate-500 mt-2 font-medium">Historial de seguridad de tus envíos</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
            <div className="space-y-6">
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center border border-red-100">{error}</div>}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    required
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-bold placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Clave de Acceso</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="password" 
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="Tu clave pass_xxxx"
                    required
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-bold placeholder:text-slate-300"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-blue-600/20 group active:scale-[0.98] disabled:opacity-50"
              >
                <span className="text-lg">{loading ? 'Verificando...' : 'Acceder al Historial'}</span>
                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans pb-20">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Mail className="text-white" size={20} />
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900">MIS ENVÍOS</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-slate-900">{email}</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Sesión Segura</span>
            </div>
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 p-2.5 rounded-xl transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Envíos', value: logs.length, color: 'blue' },
            { label: 'Exitosos', value: logs.filter(l => l.status === 'SENT').length, color: 'emerald' },
            { label: 'Fallidos', value: logs.filter(l => l.status === 'ERROR').length, color: 'red' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Tu Historial</h2>
            <p className="text-slate-500 font-medium">Control total de tus comunicaciones.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar destinatario..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          {logs.map((mail) => (
            <div 
              key={mail.id} 
              onClick={() => setSelectedMail(mail)}
              className="bg-white border border-slate-200 p-6 rounded-[2rem] hover:border-blue-400 hover:shadow-xl hover:shadow-blue-600/5 transition-all group cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
                    mail.status === 'SENT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {mail.status === 'SENT' ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-900 tracking-tight">{mail.recipient}</h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-slate-500 font-bold text-sm">{mail.subject}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-slate-900 font-black text-sm">{new Date(mail.createdAt).toLocaleDateString()}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${mail.status === 'SENT' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {mail.status === 'SENT' ? 'Entregado' : 'Error'}
                    </p>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-colors" size={24} />
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-[3rem]">
              <p className="text-slate-400 font-bold">No hay envíos registrados aún.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalle */}
      {selectedMail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-900 tracking-tight">Detalle del Envío</h3>
              <button onClick={() => setSelectedMail(null)} className="p-3 hover:bg-white rounded-full transition-all text-slate-400"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <p className="text-sm font-bold text-slate-500 italic">Asunto: {selectedMail.subject}</p>
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 font-mono text-xs text-slate-600 overflow-auto max-h-60">
                {selectedMail.bodyHtml || "Sin contenido HTML registrado."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalApp;

