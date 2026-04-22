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

const PortalApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [selectedMail, setSelectedMail] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && accessKey) setIsLoggedIn(true);
  };

  const MailsMock = [
    { id: 1, to: 'cliente@ejemplo.com', subject: 'Factura de Servicios #90210', date: '21 Abr 2026', status: 'delivered', time: '14:20 PM', body: 'Hola, adjuntamos su factura de este mes...' },
    { id: 2, to: 'marketing@global.net', subject: 'Actualización de Servicio Trimestral', date: '21 Abr 2026', status: 'delivered', time: '10:15 AM', body: 'Le informamos que hemos actualizado nuestros términos...' },
    { id: 3, to: 'soporte@tech.com', subject: 'Ticket de Ayuda #4421', date: '20 Abr 2026', status: 'error', time: '17:45 PM', body: 'Error: No se pudo entregar el mensaje.' },
    { id: 4, to: 'ventas@dominio.do', subject: 'Propuesta Comercial Multiservi', date: '20 Abr 2026', status: 'delivered', time: '09:30 AM', body: 'Adjunto la propuesta solicitada ayer...' },
  ];

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
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
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
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-bold placeholder:text-slate-300"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-blue-600/20 group active:scale-[0.98]"
              >
                <span className="text-lg">Acceder al Historial</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
          
          <p className="text-center text-slate-300 text-[10px] mt-10 uppercase tracking-[0.3em] font-black">
            POWERED BY MAILENGINE SAAS
          </p>
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
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Envíos', value: '1,240', color: 'blue' },
            { label: 'Entregados', value: '1,237', color: 'emerald' },
            { label: 'Fallidos', value: '3', color: 'red' },
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
              placeholder="Buscar destinatario o asunto..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          {MailsMock.map((mail) => (
            <div 
              key={mail.id} 
              onClick={() => setSelectedMail(mail)}
              className="bg-white border border-slate-200 p-6 rounded-[2rem] hover:border-blue-400 hover:shadow-xl hover:shadow-blue-600/5 transition-all group cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
                    mail.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 
                    mail.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {mail.status === 'delivered' ? <CheckCircle2 size={28} /> : 
                     mail.status === 'error' ? <XCircle size={28} /> : <CheckCircle2 size={28} />}
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-900 tracking-tight">{mail.to}</h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-slate-500 font-bold text-sm">{mail.subject}</p>
                      <div className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{mail.time}</span>
                    </div>
                  </div>
                </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-slate-900 font-black text-sm">{mail.date}</p>
                      <div className="flex items-center justify-end space-x-2 mt-0.5">
                        {mail.status === 'error' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Reintentando envío a ${mail.to}...`);
                            }}
                            className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-90"
                            title="Reenviar ahora"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${
                          mail.status === 'delivered' ? 'text-emerald-500' : 
                          mail.status === 'error' ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {mail.status === 'delivered' ? 'Entregado' : 
                           mail.status === 'error' ? 'Error de Envío' : 'Procesando'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-colors" size={24} />
                  </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal de Detalle de Correo */}
      {selectedMail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">Detalle del Envío</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">ID Transacción: #MLEX-{selectedMail.id}442</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMail(null)}
                className="p-3 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-900"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destinatario</p>
                  <p className="font-bold text-slate-900">{selectedMail.to}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enviado el</p>
                  <p className="font-bold text-slate-900">{selectedMail.date} • {selectedMail.time}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asunto</p>
                <p className="text-lg font-black text-slate-900 italic">"{selectedMail.subject}"</p>
              </div>
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 min-h-[200px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contenido del Mensaje</p>
                <div className="text-slate-600 font-medium leading-relaxed">
                  {selectedMail.body}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedMail(null)}
                className="bg-slate-900 text-white font-black px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalApp;

