import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Building2, 
  Mail, 
  Settings, 
  LogOut, 
  Plus, 
  Search,
  ChevronRight,
  ShieldCheck,
  Globe,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Code,
  Zap,
  ExternalLink,
  Key,
  Copy,
  RotateCcw
} from 'lucide-react';

const NAS_IP = '192.168.68.208';
const API_BASE = window.location.hostname.includes('rosariogroupllc.com')
  ? 'https://mail-api.rosariogroupllc.com/api/admin'
  : (window.location.hostname === '192.168.68.208' 
      ? 'http://192.168.68.208:3001/api/admin' 
      : 'http://localhost:3001/api/admin');

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [setupStep, setSetupStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState('gmail');
  const [isTestMode, setIsTestMode] = useState(false); 

  // Estados reales
  const [stats, setStats] = useState({ total: 0, success: 0, errors: 0, successRate: '0%' });
  const [platforms, setPlatforms] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverHealth, setServerHealth] = useState({ status: 'LOADING', database: 'LOADING' });
  const [masterSettings, setMasterSettings] = useState({ GMAIL: {}, OUTLOOK: {}, YAHOO: {} });

  const [authStep, setAuthStep] = useState(1); // 1: Nombre, 2: OTP
  const [userName, setUserName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authMessage, setAuthMessage] = useState({ text: '', type: '' });

  // Verificar sesión de 24h al cargar
  useEffect(() => {
    const session = localStorage.getItem('mailengine_session');
    if (session) {
      const { expiry } = JSON.parse(session);
      if (new Date().getTime() < expiry) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('mailengine_session');
      }
    }
  }, []);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthMessage({ text: 'Conectando con el búnker...', type: 'success' });
    try {
      console.log('🚀 Solicitando código para:', userName);
      const res = await fetch(`${API_BASE}/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('✅ Código solicitado con éxito');
        setAuthStep(2);
        const msg = data.reused 
          ? '🔑 Tu llave sigue activa. Usa el último código enviado.' 
          : '¡Código enviado! Revisa tu Pushover 📱';
        setAuthMessage({ text: msg, type: 'success' });
        alert(msg);
      } else {
        console.error('❌ Error del servidor:', data.error);
        setAuthMessage({ text: data.error, type: 'error' });
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err);
      setAuthMessage({ text: 'No puedo conectar con el motor. ¿Está encendido?', type: 'error' });
      alert('Error de conexión con el motor 3001');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode })
      });
      const data = await res.json();
      if (res.ok) {
        // Crear sesión de 24 horas
        const expiry = new Date().getTime() + 24 * 60 * 60 * 1000;
        localStorage.setItem('mailengine_session', JSON.stringify({ expiry }));
        setIsAuthenticated(true);
        alert(data.message); // Mostrar usos realizados
      } else {
        setAuthMessage({ text: data.error, type: 'error' });
      }
    } catch (err) {
      setAuthMessage({ text: 'Error al verificar código', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mailengine_session');
    setIsAuthenticated(false);
    setAuthStep(1);
    setUserName('');
    setOtpCode('');
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthUrl = API_BASE.replace('/admin', '/health');
        const res = await fetch(healthUrl);
        const data = await res.json();
        setServerHealth(data);
      } catch (e) {
        setServerHealth({ status: 'DOWN', database: 'ERROR' });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [activeTab, isAuthenticated]);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [sRes, pRes, cRes, lRes, setRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/platforms`),
        fetch(`${API_BASE}/companies`),
        fetch(`${API_BASE}/logs`),
        fetch(`${API_BASE}/settings`)
      ]);
      
      const statsData = await sRes.json();
      const platformsData = await pRes.json();
      const companiesData = await cRes.json();
      const logsData = await lRes.json();
      const settingsData = await setRes.json();

      setStats(statsData.total ? statsData : { total: 0, success: 0, errors: 0, successRate: '0%' });
      setPlatforms(Array.isArray(platformsData) ? platformsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
      
      // Organizar settings por proveedor
      const settingsMap = { GMAIL: {}, OUTLOOK: {}, YAHOO: {} };
      if (Array.isArray(settingsData)) {
        settingsData.forEach(s => {
          settingsMap[s.provider] = s;
        });
      }
      setMasterSettings(settingsMap);

    } catch (error) {
      setStats({ total: 0, success: 0, errors: 0, successRate: '0%' });
      setPlatforms([]);
      setCompanies([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de Login Moderna y Diferente
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Luces de fondo dinámicas */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px]" />
        
        <div className="w-full max-w-md relative">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-12 rounded-[50px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative z-10 text-center">
            
            <div className="mb-10 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl shadow-2xl shadow-blue-600/30 transform hover:rotate-12 transition-transform duration-500">
              <ShieldCheck className="text-white" size={40} />
            </div>

            <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Hola, Luis.</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mb-10">Seguridad Dinámica Activa</p>

            {authMessage.text && (
              <div className={`mb-8 p-4 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2 ${authMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {authMessage.text}
              </div>
            )}

            {authStep === 1 ? (
              <form onSubmit={handleRequestOTP} className="space-y-6">
                <div className="text-left space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identidad Maestra</label>
                  <input 
                    type="text" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Escribe tu nombre completo..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-lg"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl shadow-xl hover:bg-blue-50 transition-all transform active:scale-95 disabled:opacity-50 text-sm tracking-widest uppercase"
                >
                  {loading ? 'SOLICITANDO LLAVE...' : 'SOLICITAR CÓDIGO'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="text-left space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código de 6 Dígitos</label>
                  <input 
                    type="text" 
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-center text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-3xl tracking-[0.5em] font-black"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button"
                    onClick={() => setAuthStep(1)}
                    className="flex-1 bg-white/5 border border-white/10 text-slate-400 font-bold py-5 rounded-2xl hover:bg-white/10 transition-all text-xs uppercase"
                  >
                    Volver
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[2] bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-900/20 hover:bg-emerald-500 transition-all transform active:scale-95 disabled:opacity-50 text-sm tracking-widest uppercase"
                  >
                    {loading ? 'VERIFICANDO...' : 'ENTRAR'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-6">Válido para 5 entradas / 24 horas</p>
              </form>
            )}
          </div>
          
          <div className="mt-8 flex justify-center space-x-6 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-100" />
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-200" />
          </div>
        </div>
      </div>
    );
  }


  const handleReset = (tab) => {
    setActiveTab(tab);
    setSelectedProgram(null);
    setSelectedCompany(null);
    setSetupStep(1);
    setSelectedProvider('gmail');
  };

  const handleCreatePlatform = async (e) => {
    e.preventDefault();
    const name = document.getElementById('p-name').value;
    const url = document.getElementById('p-url').value;
    
    try {
      await fetch(`${API_BASE}/platforms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, callbackUrl: url })
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) { alert('Error creando programa'); }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6 flex flex-col shadow-sm">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Mail className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">MailEngine</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleReset('dashboard')} />
          <SidebarItem icon={Layers} label="Programas" active={activeTab === 'platforms' || selectedProgram} onClick={() => handleReset('platforms')} />
          <SidebarItem icon={Settings} label="Configuración" active={activeTab === 'settings'} onClick={() => handleReset('settings')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 text-slate-500 hover:text-red-500 transition-colors w-full font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center space-x-4 mb-1">
              {(selectedProgram || selectedCompany) && (
                <button 
                  onClick={() => selectedCompany ? setSelectedCompany(null) : setSelectedProgram(null)}
                  className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h2 className="text-3xl font-bold text-slate-900">
                {selectedCompany ? selectedCompany.name : 
                 selectedProgram ? selectedProgram.name :
                 activeTab === 'dashboard' ? 'Panel de Control' : 
                 activeTab === 'platforms' ? 'Gestión de Programas' : 
                 activeTab === 'companies' ? 'Empresas Vinculadas' : 'Configuración General'}
              </h2>
            </div>
            <p className="text-slate-500 font-medium">
              {selectedCompany ? 'Gestión de cuentas de correo vinculadas.' : 
               selectedProgram ? 'Empresas que utilizan este software.' :
               'Bienvenido al motor centralizado de correos.'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {activeTab !== 'settings' && activeTab !== 'dashboard' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 text-slate-900 shadow-sm"
                />
              </div>
            )}
            {(activeTab !== 'settings' && activeTab !== 'dashboard' && !selectedCompany) && (
              <button 
                onClick={() => { setModalType('new'); setIsModalOpen(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-600/20 font-bold whitespace-nowrap text-sm"
              >
                <Plus size={18} />
                <span>
                  {selectedProgram ? 'Nueva Empresa' : 'Nuevo Programa'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* DETALLE: CUENTAS DE CORREO */}
        {selectedCompany ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Cuentas de Correo</h3>
                <p className="text-slate-500 text-sm">Gestiona los accesos y estados de este cliente.</p>
                <div className="mt-4 flex items-center space-x-3 bg-slate-50 border border-slate-100 p-2 rounded-2xl pr-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                    <Key size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Client API Key</p>
                    <code className="text-xs font-mono font-bold text-slate-700">{selectedCompany.apiKey || 'cli_key_pending'}</code>
                  </div>
                  <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors" onClick={() => alert('¡API Key copiada!')}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => { setModalType('link'); setIsModalOpen(true); }}
                className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center space-x-2 shadow-xl shadow-slate-900/10 active:scale-95 w-full md:w-auto justify-center"
              >
                <Plus size={20} />
                <span>Añadir Cuenta</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {selectedCompany.accounts?.map((acc, i) => (
                <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${acc.accessToken ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {acc.accessToken ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">{acc.email}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{acc.provider} • {acc.accessToken ? 'Conectado' : 'Pendiente'}</p>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <div className="flex items-center space-x-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                          <Key size={10} className="text-slate-400" />
                          <code className="text-[10px] font-mono font-bold text-blue-600">{acc.auditAccessKey}</code>
                          <button onClick={() => alert('Clave de acceso copiada')} className="text-slate-300 hover:text-slate-500 transition-colors"><Copy size={10} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="text-red-500 font-bold text-xs px-4 py-2 hover:bg-red-50 rounded-xl transition-all">Desvincular</button>
                </div>
              ))}
            </div>
          </div>
        ) 
        /* VISTA: EMPRESAS */
        : (activeTab === 'companies' || selectedProgram) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {companies.filter(c => !selectedProgram || c.platformId === selectedProgram.id).map((company, i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 size={24} /></div>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase tracking-wide">{company.platform?.name}</span>
                </div>
                <h4 className="font-bold text-xl text-slate-900">{company.name}</h4>
                <p className="text-slate-500 text-sm mt-1 font-medium">{company._count?.accounts || 0} Usuarios vinculados</p>
                <button onClick={() => setSelectedCompany(company)} className="w-full mt-6 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">Gestionar</button>
              </div>
            ))}
          </div>
        )
        /* VISTA: DASHBOARD */
        : activeTab === 'dashboard' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Envíos', value: stats.total, trend: '', color: 'blue' },
                { label: 'Exitosos', value: stats.success, trend: '', color: 'emerald' },
                { label: 'Tasa de Éxito', value: stats.successRate, trend: 'Estable', color: 'indigo' },
                { label: 'Errores/Bounces', value: stats.errors, trend: '', color: 'red' },
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-6">Actividad de Envíos</h4>
                <div className="flex items-end justify-between h-48 px-2">
                  {[45, 60, 35, 90, 70, 55, 80].map((height, i) => (
                    <div key={i} className="flex flex-col items-center group w-full">
                      <div className="relative w-8 bg-blue-100 rounded-t-xl group-hover:bg-blue-600 transition-all duration-300 flex items-end justify-center" style={{ height: `${height}%` }}></div>
                      <span className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-tighter">{['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-bold text-blue-400 text-sm uppercase tracking-widest mb-4">Estado del Servidor</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Motor de Colas</span>
                      {serverHealth.database === 'CONNECTED' ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse" /> Operativo</span>
                      ) : (
                        <span className="text-xs font-bold text-rose-400 flex items-center"><div className="w-1.5 h-1.5 bg-rose-400 rounded-full mr-2" /> Error DB</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Servicio API</span>
                      {serverHealth.status === 'UP' ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center">
                          <div className="w-1 h-1 bg-emerald-400 rounded-full mr-2" /> Operativo
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-400">Detenido</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Conexión NAS</span>
                      {window.location.hostname === NAS_IP ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center">
                           Excelente (NAS)
                        </span>
                      ) : window.location.hostname.includes('rosariogroupllc.com') ? (
                        <span className="text-xs font-bold text-blue-400 flex items-center">
                          Remota (Cloudflare)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-400 flex items-center">
                          Desarrollo (Mac)
                        </span>
                      )}
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Última Verificación</p>
                      <p className="text-[10px] text-slate-400">{new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-bold text-slate-900">Logs de Envíos Recientes</h4>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Programa / Cliente</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(logs) && logs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">{log.recipient}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <span className="font-bold text-slate-800">{log.account?.company?.platform?.name}</span>
                        <br />
                        <span className="text-[10px] text-slate-400">{log.account?.company?.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${log.status === 'SENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(log.sentAt || log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
        /* VISTA: PROGRAMAS */
        : activeTab === 'platforms' ? (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest"><th className="px-6 py-5">Software</th><th className="px-6 py-5">API Key</th><th className="px-6 py-5 text-center">Empresas</th><th className="px-6 py-5 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.isArray(platforms) && platforms.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-5"><code className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-mono border border-blue-100">{item.apiKey}</code></td>
                    <td className="px-6 py-5 text-center font-bold text-slate-700">{item._count?.companies || 0}</td>
                    <td className="px-6 py-5 text-right flex justify-end space-x-2">
                      <button onClick={() => { setModalType('api'); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><Code size={18} /></button>
                      <button onClick={() => setSelectedProgram(item)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">Gestionar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        /* VISTA: CONFIGURACIÓN */
        : (
          <div className="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Configuración Maestras</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Motor optimizado para Google Cloud</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Google Cloud Card */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const data = { provider: 'GMAIL', clientId: e.target.cid.value, clientSecret: e.target.cs.value };
                  await fetch(`${API_BASE}/settings`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
                  alert('Configuración de Google guardada');
                  fetchData();
                }} className="bg-slate-50 border border-slate-200 rounded-3xl p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Mail size={80} />
                  </div>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Google Cloud Platform</span>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Client ID</label>
                      <input 
                        name="cid"
                        type="text" 
                        placeholder="ID de cliente de Google"
                        defaultValue={masterSettings.GMAIL?.clientId || ''}
                        className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Client Secret</label>
                      <input 
                        name="cs"
                        type="password" 
                        placeholder="Secreto de cliente"
                        defaultValue={masterSettings.GMAIL?.clientSecret ? '********' : ''}
                        className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                    >
                      Guardar Configuración
                    </button>
                  </div>
                </form>

                {/* Pushover Card */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck size={80} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Notificaciones</span>
                      </div>
                      <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md">BLINDADO</span>
                    </div>
                    <div className="mb-8">
                      <h4 className="text-lg font-black text-emerald-900 mb-2">Pushover Alertas</h4>
                      <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                        Tus credenciales de notificaciones están configuradas de forma segura en el servidor. El sistema te avisará por móvil de cada envío.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      const res = await fetch(`${API_BASE}/test-pushover`);
                      if(res.ok) alert('¡Revisa tu móvil! Alerta enviada.');
                    }}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/10"
                  >
                    Probar Notificación
                  </button>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start space-x-4">
                <AlertCircle className="text-blue-600 mt-1" size={20} />
                <div className="text-xs text-blue-700 leading-relaxed font-medium">
                  <p className="font-bold mb-1">Información de Seguridad:</p>
                  Estas credenciales se utilizan para permitir que tus clientes vinculen sus cuentas vía OAuth2. Asegúrate de configurar la <span className="underline">Redirect URI</span> en tu panel de Google Cloud.
                </div>
              </div>
            </div>
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={
          modalType === 'api' ? 'Documentación API' : 
          modalType === 'link' ? 'Vincular Cuenta' : 'Nuevo Registro'
        }>
          {modalType === 'api' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endpoint</p>
                <code className="text-xs text-blue-600 font-mono">POST http://{window.location.hostname}:3000/api/send</code>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl">Entendido</button>
            </div>
          ) : modalType === 'new' ? (
            <form onSubmit={handleCreatePlatform} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Software</label>
                <input id="p-name" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" placeholder="Ej: Admin de Empresas" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">URL de Callback</label>
                <input id="p-url" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" placeholder="https://tu-programa.com/api/callback" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl">Crear Registro</button>
            </form>
          ) : modalType === 'link' ? (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start space-x-3">
                <div className="bg-white p-2 rounded-xl text-red-500 shadow-sm">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-900">Vinculación de Gmail</h4>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Vas a vincular la cuenta de <strong>{selectedCompany?.name}</strong> usando Google OAuth2.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => window.location.href = `${API_BASE.replace('/admin', '')}/auth/google?companyId=${selectedCompany.id}`}
                className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-red-500 hover:bg-red-50 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xl font-black">G</div>
                  <div className="text-left">
                    <span className="block font-bold text-slate-700">Continuar con Google</span>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest">Seguro y Oficial</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
              </button>

              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Solo se permite vinculación vía Google Cloud</p>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-4">Funcionalidad en desarrollo...</div>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default App;
