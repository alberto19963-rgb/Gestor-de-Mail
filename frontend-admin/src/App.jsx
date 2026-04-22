import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [setupStep, setSetupStep] = useState(1); // 1: Form, 2: OTP Verification

  const [selectedProvider, setSelectedProvider] = useState('gmail');

  const handleReset = (tab) => {
    setActiveTab(tab);
    setSelectedProgram(null);
    setSelectedCompany(null);
    setSetupStep(1);
    setSelectedProvider('gmail');
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
          <button className="flex items-center space-x-3 px-4 py-3 text-slate-500 hover:text-red-500 transition-colors w-full font-bold text-sm">
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
                    <code className="text-xs font-mono font-bold text-slate-700">cli_92k8_{selectedCompany.name.split(' ')[0].toLowerCase()}_x82</code>
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
              {[{ email: 'gerencia@empresa.com', type: 'Gmail', status: 'ok' }, { email: 'soporte@empresa.com', type: 'Outlook', status: 'error' }].map((acc, i) => (
                <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${acc.status === 'ok' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {acc.status === 'ok' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">{acc.email}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{acc.type} • {acc.status === 'ok' ? 'Conectado' : 'Token Expirado'}</p>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <div className="flex items-center space-x-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                          <Key size={10} className="text-slate-400" />
                          <code className="text-[10px] font-mono font-bold text-blue-600">pass_{acc.email.split('@')[0]}</code>
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
            {[
              { name: 'Multiservi Chavon SRL', app: 'Admin de Empresas', users: 15 },
              { name: 'Taller El Rayo', app: 'Gestor de Talleres', users: 4 },
              { name: 'Inversiones Rosario', app: 'Admin de Empresas', users: 8 },
              { name: 'Contabilidad Global RD', app: 'Software Contable', users: 2 },
            ].filter(c => !selectedProgram || c.app === selectedProgram.name).map((company, i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 size={24} /></div>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase tracking-wide">{company.app}</span>
                </div>
                <h4 className="font-bold text-xl text-slate-900">{company.name}</h4>
                <p className="text-slate-500 text-sm mt-1 font-medium">{company.users} Usuarios vinculados</p>
                <button onClick={() => setSelectedCompany(company)} className="w-full mt-6 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">Gestionar</button>
              </div>
            ))}
          </div>
        )
        /* VISTA: DASHBOARD */
        : activeTab === 'dashboard' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Envíos Hoy', value: '342', trend: '+12%', color: 'blue' },
                { label: 'Total Mes', value: '12,840', trend: '+5%', color: 'indigo' },
                { label: 'Tasa de Éxito', value: '98.2%', trend: 'Estable', color: 'emerald' },
                { label: 'Errores/Bounces', value: '14', trend: '-2%', color: 'red' },
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${stat.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{stat.trend}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Chart (Simulated) */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-900">Actividad de Envíos (7 días)</h4>
                  <select className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-1 outline-none">
                    <option>Esta Semana</option>
                    <option>Mes Pasado</option>
                  </select>
                </div>
                <div className="flex items-end justify-between h-48 px-2">
                  {[45, 60, 35, 90, 70, 55, 80].map((height, i) => (
                    <div key={i} className="flex flex-col items-center group w-full">
                      <div className="relative w-8 bg-blue-100 rounded-t-xl group-hover:bg-blue-600 transition-all duration-300 flex items-end justify-center" style={{ height: `${height}%` }}>
                        <div className="absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">{(height * 15).toLocaleString()}</div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-tighter">{['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Server Health / Quick Info */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-bold text-blue-400 text-sm uppercase tracking-widest mb-4">Estado del Servidor</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Motor de Colas</span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse" /> Operativo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Conexión NAS</span>
                      <span className="text-xs font-bold text-emerald-400">Excelente</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Memoria Libre</span>
                      <span className="text-xs font-bold">1.2 GB / 2 GB</span>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Webhooks Activos</p>
                      <h3 className="text-3xl font-black">24</h3>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl" />
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-bold text-slate-900">Logs de Envíos Recientes</h4>
                <button className="text-blue-600 text-xs font-bold hover:underline">Ver todos los logs</button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Programa / Cliente</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Fecha/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { email: 'factura_3421@gmail.com', prog: 'Admin de Empresas', client: 'Multiservi Chavon', status: 'Entregado', time: 'Hace 2 min' },
                    { email: 'jose.rosario@hotmail.com', prog: 'Gestor de Talleres', client: 'Inversiones Rosario', status: 'Abierto', time: 'Hace 15 min' },
                    { email: 'admin@constructora.do', prog: 'Admin de Empresas', client: 'Constructora S.A.', status: 'Rebotado', time: 'Hace 42 min' },
                    { email: 'cliente_vip@yahoo.com', prog: 'Admin de Empresas', client: 'Multiservi Chavon', status: 'Entregado', time: 'Hace 1 hora' },
                  ].map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">{log.email}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <span className="font-bold text-slate-800">{log.prog}</span>
                        <br />
                        <span className="text-[10px] text-slate-400">{log.client}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${log.status === 'Entregado' ? 'bg-emerald-50 text-emerald-600' : log.status === 'Abierto' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end space-x-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{log.time}</span>
                        {(log.status === 'Rebotado' || log.status === 'Error') && (
                          <button 
                            onClick={() => alert(`Reenviando correo a ${log.email}...`)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm"
                            title="Reenviar ahora"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
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
                {[
                  { name: 'Admin de Empresas', key: '7f92-xxxx-xxxx', count: 45, status: 'Activo' },
                  { name: 'Gestor de Talleres', key: '2a1b-xxxx-xxxx', count: 12, status: 'Activo' },
                ].map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-5"><code className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-mono border border-blue-100">{item.key}</code></td>
                    <td className="px-6 py-5 text-center font-bold text-slate-700">{item.count}</td>
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
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Credenciales Maestras</h4>
                  <p className="text-slate-500 text-sm">Configura las llaves principales para cada proveedor.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Google Section */}
                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Google Cloud (Gmail)</span>
                  </div>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm" placeholder="Client ID" />
                  <input type="password" title="password" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm" placeholder="Client Secret" />
                </div>

                {/* Microsoft Section */}
                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Microsoft Azure (Outlook)</span>
                  </div>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm" placeholder="Application ID" />
                  <input type="password" title="password" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm" placeholder="Client Secret" />
                </div>

                {/* Yahoo Section */}
                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 md:col-span-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Yahoo Mail (SMTP)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm" placeholder="Yahoo App Email" />
                    <input type="password" title="password" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm" placeholder="App Password" />
                  </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl mt-8 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
                Guardar Configuración de Motores
              </button>
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
                <code className="text-xs text-blue-600 font-mono">POST http://NAS_IP:3000/api/send</code>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl">Entendido</button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedCompany ? (
                /* NIVEL 3: VINCULAR CUENTA DE CORREO */
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dirección de Correo</label>
                    <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" placeholder="ejemplo@empresa.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Selecciona el Proveedor</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setSelectedProvider('gmail')}
                        className={`p-4 border-2 rounded-2xl flex flex-col items-center transition-all ${selectedProvider === 'gmail' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
                      >
                        <Mail className={selectedProvider === 'gmail' ? 'text-blue-600 mb-2' : 'text-slate-400 mb-2'} size={24} />
                        <span className={`text-[10px] font-bold ${selectedProvider === 'gmail' ? 'text-blue-700' : 'text-slate-500'}`}>Gmail</span>
                      </button>
                      
                      <button 
                        onClick={() => setSelectedProvider('outlook')}
                        className={`p-4 border-2 rounded-2xl flex flex-col items-center transition-all ${selectedProvider === 'outlook' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
                      >
                        <Mail className={selectedProvider === 'outlook' ? 'text-blue-600 mb-2' : 'text-slate-400 mb-2'} size={24} />
                        <span className={`text-[10px] font-bold ${selectedProvider === 'outlook' ? 'text-blue-700' : 'text-slate-500'}`}>Outlook</span>
                      </button>
                      
                      <button 
                        onClick={() => setSelectedProvider('yahoo')}
                        className={`p-4 border-2 rounded-2xl flex flex-col items-center transition-all ${selectedProvider === 'yahoo' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
                      >
                        <Mail className={selectedProvider === 'yahoo' ? 'text-blue-600 mb-2' : 'text-slate-400 mb-2'} size={24} />
                        <span className={`text-[10px] font-bold ${selectedProvider === 'yahoo' ? 'text-blue-700' : 'text-slate-500'}`}>Yahoo</span>
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { setIsModalOpen(false); alert(`Vinculando cuenta de ${selectedProvider}...`); }} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl mt-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">Vincular Cuenta</button>
                </div>
              ) : selectedProgram ? (
                /* NIVEL 2: NUEVA EMPRESA */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre de la Empresa</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" placeholder="Ej: Supermercado Central" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">RNC / Tax ID</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" placeholder="131-XXXXX-X" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">País</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none">
                        <option>República Dominicana</option>
                        <option>México</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => { setIsModalOpen(false); alert('Empresa creada.'); }} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mt-2">Crear Empresa</button>
                </div>
              ) : (
                /* NIVEL 1: NUEVO PROGRAMA (Flujo 2 Pasos) */
                <div className="space-y-4">
                  {setupStep === 1 ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Software</label>
                        <input id="p-name" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" placeholder="Ej: Admin de Empresas" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">URL de Callback</label>
                        <input id="p-url" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" placeholder="https://tu-programa.com/api/callback" />
                      </div>
                      <button onClick={() => setSetupStep(2)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl">Enviar Código de Verificación</button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center py-4">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
                      <div><h4 className="font-bold text-lg text-slate-900">Verifica tu Endpoint</h4><p className="text-slate-500 text-sm mt-1">Introduce los 6 dígitos enviados.</p></div>
                      <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5, 6].map((_, i) => (<input key={i} type="text" maxLength="1" className="w-10 h-12 bg-slate-50 border-2 border-slate-200 rounded-xl text-center font-bold" />))}
                      </div>
                      <button onClick={() => { setIsModalOpen(false); setSetupStep(1); alert('¡Enlazado!'); }} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl">Verificar y Activar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default App;
