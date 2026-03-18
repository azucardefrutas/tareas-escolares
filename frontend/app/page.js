'use client'; 

import React, { useState, useEffect } from 'react';
import { 
  Book, Calendar as CalendarIcon, CheckSquare, Clock, 
  LayoutDashboard, LogOut, Plus, Trash2, Edit, User, Mail, Lock,
  ChevronLeft, ChevronRight, X, Save, Image as ImageIcon, Menu
} from 'lucide-react';
import axios from 'axios';

// ==========================================
// CONEXIÓN CON TU BACKEND EN NODE.JS
// ==========================================
const api = axios.create({
  baseURL: 'http://192.168.1.152:3000/api', 
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers['authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Opciones de colores para nuevas materias (UI)
const COLOR_OPTIONS = [
  { label: 'Azul', color: 'bg-blue-100 text-blue-800 border-blue-300', glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
  { label: 'Verde', color: 'bg-green-100 text-green-800 border-green-300', glow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]' },
  { label: 'Púrpura', color: 'bg-purple-100 text-purple-800 border-purple-300', glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]' },
  { label: 'Naranja', color: 'bg-orange-100 text-orange-800 border-orange-300', glow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]' },
  { label: 'Rosa', color: 'bg-pink-100 text-pink-800 border-pink-300', glow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]' },
];

export default function Home() {
  const [currentView, setCurrentView] = useState('login');
  
  // ESTADO NUEVO: Controla el menú lateral en dispositivos móviles
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Sistema de Notificaciones Elegante
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Estados de Datos de PostgreSQL
  const [tareas, setTareas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [horarios, setHorarios] = useState([]);

  const [modal, setModal] = useState({ isOpen: false, type: null, mode: 'create', data: null });
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (currentView !== 'login' && currentView !== 'register') cargarDatosDesdeBD();
  }, [currentView]);

  const cargarDatosDesdeBD = async () => {
    try {
      const [resMat, resPer, resTar, resHor] = await Promise.all([
        api.get('/materias'), api.get('/periodos'), api.get('/tareas'), api.get('/horarios')
      ]);
      setMaterias(resMat.data); 
      setPeriodos(resPer.data); 
      setTareas(resTar.data); 
      setHorarios(resHor.data);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    setCurrentView('login');
    setTareas([]); setMaterias([]); setPeriodos([]); setHorarios([]);
    setIsMobileMenuOpen(false); // Cierra el menú móvil al salir
  };

  // --- LÓGICA CRUD Y MODALES ---
  const openModal = (type, mode = 'create', data = null) => {
    let initialData = {};
    if (mode === 'edit' && data) {
      initialData = { ...data };
      if(type === 'periodo') { initialData.inicio = data.fecha_inicio; initialData.fin = data.fecha_fin; }
      if(type === 'tarea') { initialData.fecha = data.fecha_entrega; initialData.materiaId = data.id_materia; }
      if(type === 'horario') { initialData.dia = data.dia_semana; initialData.inicio = data.hora_inicio; initialData.fin = data.hora_fin; initialData.materiaId = data.id_materia;}
      if(type === 'materia') { initialData.colorObj = COLOR_OPTIONS.find(c => c.color === data.color) || COLOR_OPTIONS[0]; }
    } else {
      if (type === 'tarea') initialData = { titulo: '', descripcion: '', fecha: '', materiaId: materias[0]?.id_materia || '' };
      if (type === 'materia') initialData = { nombre: '', profesor: '', colorObj: COLOR_OPTIONS[0], img: '' };
      if (type === 'periodo') initialData = { nombre: '', inicio: '', fin: '' };
      if (type === 'horario') initialData = { dia: 'Lun', inicio: '07:00', fin: '08:00', materiaId: materias[0]?.id_materia || '' };
    }
    setFormData(initialData); setModal({ isOpen: true, type, mode, data });
  };

  const closeModal = () => setModal({ isOpen: false, type: null, mode: 'create', data: null });

  const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, img: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = modal.mode === 'edit';
    try {
      if (modal.type === 'periodo') {
        const payload = { nombre: formData.nombre, fecha_inicio: formData.inicio, fecha_fin: formData.fin };
        isEdit ? await api.put(`/periodos/${modal.data.id_periodo}`, payload) : await api.post('/periodos', payload);
      } else if (modal.type === 'materia') {
        const idPeriodo = periodos.length > 0 ? periodos[0].id_periodo : null;
        if(!idPeriodo) return showToast("Crea un Periodo Escolar primero.", "error");
        const selectedColor = formData.colorObj || COLOR_OPTIONS[0];
        const payload = { 
            nombre: formData.nombre, 
            profesor: formData.profesor, 
            id_periodo: idPeriodo,
            color: selectedColor.color,
            glow: selectedColor.glow,
            img: formData.img 
        };
        isEdit ? await api.put(`/materias/${modal.data.id_materia}`, payload) : await api.post('/materias', payload);
      } else if (modal.type === 'tarea') {
        const payload = { titulo: formData.titulo, descripcion: formData.descripcion, fecha_entrega: formData.fecha, id_materia: Number(formData.materiaId) };
        isEdit ? await api.put(`/tareas/${modal.data.id_tarea}`, payload) : await api.post('/tareas', payload);
      } else if (modal.type === 'horario') {
        const payload = { dia_semana: formData.dia, hora_inicio: formData.inicio, hora_fin: formData.fin, id_materia: Number(formData.materiaId) };
        isEdit ? await api.put(`/horarios/${modal.data.id_horario}`, payload) : await api.post('/horarios', payload);
      }
      cargarDatosDesdeBD(); 
      closeModal();
      showToast("¡Guardado correctamente!");
    } catch (error) { 
      showToast(error.response?.data?.error || "Error al guardar en BD", "error"); 
    }
  };

  const eliminarItem = async (type, id) => {
    if(!window.confirm(`¿Seguro que deseas eliminarlo?`)) return;
    try { 
      await api.delete(`/${type}s/${id}`); 
      cargarDatosDesdeBD(); 
      showToast("Elemento eliminado");
    } catch (error) { 
      showToast("Error al eliminar", "error"); 
    }
  };

  const toggleTarea = async (id) => {
    try { 
      await api.patch(`/tareas/${id}/completar`); 
      cargarDatosDesdeBD(); 
    } catch (error) { 
      showToast("Error al completar", "error"); 
    }
  };

  // ==========================================
  // VISTAS DE AUTENTICACIÓN (IMÁGENES UPB)
  // ==========================================
  const renderAuthView = (isLogin) => (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative font-poppins px-4" style={{ backgroundImage: "url('/fondo.jpg')" }}>
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"></div>
      
      {/* RESPONSIVO: p-6 para móvil, sm:p-10 para tablets/desktop */}
      <div className="relative z-10 max-w-md w-full space-y-6 bg-white p-6 sm:p-10 rounded-4xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100">
        
        <div className="flex justify-center -mt-16 sm:-mt-20 mb-2">
          <div className="bg-white p-2 rounded-full shadow-xl border border-gray-100">
            <img src="/logo.webp" alt="Logo UPB" className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-full" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h2>
          <p className="mt-2 text-sm text-gray-500">{isLogin ? 'Inicia sesión ' : 'Regístrate para organizar tus materias'}</p>
        </div>
        
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" onSubmit={async (e) => { 
            e.preventDefault(); 
            try {
              if (isLogin) {
                const res = await api.post('/auth/login', { correo: e.target[0].value, password: e.target[1].value });
                localStorage.setItem('token', res.data.token); setCurrentView('dashboard');
              } else {
                await api.post('/auth/register', { nombre: e.target[0].value, correo: e.target[1].value, password: e.target[2].value });
                const res = await api.post('/auth/login', { correo: e.target[1].value, password: e.target[2].value });
                localStorage.setItem('token', res.data.token); 
                showToast('¡Cuenta creada con éxito!'); 
                setCurrentView('dashboard');
              }
            } catch (err) { 
              showToast(err.response?.data?.error || 'Error en autenticación', 'error'); 
            }
        }}>
          <div className="space-y-3 sm:space-y-4">
            {!isLogin && <input type="text" required className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre completo" />}
            <input type="email" required className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Correo electrónico" />
            <input type="password" required className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contraseña" />
          </div>
          <button type="submit" className="w-full py-3.5 sm:py-4 text-white font-bold rounded-xl sm:rounded-2xl bg-linear-to-r from-blue-900 to-blue-700 hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] transition-all transform hover:scale-[1.02]">
            {isLogin ? 'Iniciar Sesión' : 'Registrarme'}
          </button>
        </form>
        <div className="text-center pt-2">
          <button onClick={() => setCurrentView(isLogin ? 'register' : 'login')} className="text-sm text-blue-700 hover:underline font-bold">
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // VISTAS DEL DASHBOARD 
  // ==========================================
  const renderDashboardView = () => (
    <div className="fade-in">
      <h1 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 text-gray-900 tracking-tight">Resumen de Actividades</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        {[{ title: 'Pendientes', count: tareas.filter(t=>!t.completada).length, icon: CheckSquare, color: 'text-red-500', bg: 'bg-red-50' },
          { title: 'Entregadas', count: tareas.filter(t=>t.completada).length, icon: CheckSquare, color: 'text-green-500', bg: 'bg-green-50' },
          { title: 'Materias', count: materias.length, icon: Book, color: 'text-blue-700', bg: 'bg-blue-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl md:rounded-4xl shadow-sm border border-gray-100 p-6 md:p-8 flex items-center space-x-4 md:space-x-6 hover:-translate-y-1 transition-transform">
            <div className={`p-4 md:p-5 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon size={28} className="md:w-8 md:h-8" /></div>
            <div><p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.title}</p><p className="text-3xl md:text-4xl font-black text-gray-900">{stat.count}</p></div>
          </div>
        ))}
      </div>
      
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 tracking-tight">Próximas Entregas</h2>
      <div className="bg-white shadow-sm rounded-3xl md:rounded-4xl border border-gray-100 overflow-hidden">
        {tareas.filter(t => !t.completada).map(tarea => {
          const materia = materias.find(m => m.id_materia === tarea.id_materia) || materias[0];
          return (
            <div key={tarea.id_tarea} className="p-4 md:p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-gray-50 transition-colors gap-3 sm:gap-0">
              <div>
                <h3 className="font-semibold text-gray-900 text-base md:text-lg">{tarea.titulo}</h3>
                <span className={`inline-block mt-1 md:mt-2 px-2 md:px-3 py-1 text-xs font-semibold rounded-full border ${materia?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}>{materia?.nombre || 'General'}</span>
              </div>
              <p className="text-xs md:text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg w-fit">Vence: {tarea.fecha_entrega ? tarea.fecha_entrega.substring(0, 10) : ''}</p>
            </div>
          )
        })}
        {tareas.filter(t => !t.completada).length === 0 && <p className="p-6 md:p-8 text-center text-gray-500 font-bold text-sm md:text-base">No hay tareas pendientes.</p>}
      </div>
    </div>
  );

  const renderMateriasView = () => (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900">Mis Materias</h1>
        <button onClick={() => openModal('materia')} className="flex items-center justify-center space-x-2 bg-linear-to-r from-blue-700 to-blue-900 text-white px-6 py-3 rounded-xl md:rounded-2xl hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] transition-all font-bold w-full sm:w-auto">
          <Plus size={20} /> <span>Agregar Materia</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {materias.map((materia) => (
          <div key={materia.id_materia} className={`relative overflow-hidden rounded-4xl md:rounded-[2.5rem] shadow-xl transition-all duration-300 transform hover:-translate-y-2 group h-64 md:h-72 border border-gray-200 ${materia.glow || ''} ${!materia.img ? (materia.color || 'bg-blue-100') : ''}`}>
            {materia.img && (
              <>
                <img src={materia.img} alt="Materia" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" />
                <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
              </>
            )}
            {!materia.img && (
              <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent"></div>
            )}
            
            <div className="relative z-10 p-6 md:p-8 flex flex-col h-full justify-between">
              <div>
                <h3 className={`text-2xl md:text-3xl font-black mb-2 md:mb-3 drop-shadow-lg leading-tight ${materia.img ? 'text-white' : 'text-gray-900'}`}>{materia.nombre}</h3>
                <p className={`text-xs md:text-sm font-bold border inline-block px-3 md:px-4 py-1.5 md:py-2 rounded-full backdrop-blur-md shadow-sm ${materia.img ? 'text-white bg-white/20 border-white/30' : 'text-gray-700 border-gray-300 bg-white/50'}`}>
                  Prof. {materia.profesor}
                </p>
              </div>
              <div className="flex justify-end space-x-2 md:space-x-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={() => openModal('materia', 'edit', materia)} className="p-2 md:p-3 bg-white/90 text-blue-700 hover:bg-white rounded-xl shadow-lg transition-all"><Edit size={18} /></button>
                <button onClick={() => eliminarItem('materia', materia.id_materia)} className="p-2 md:p-3 bg-red-500/90 hover:bg-red-500 text-white rounded-xl shadow-lg transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {materias.length === 0 && <p className="text-gray-500 col-span-1 sm:col-span-2 lg:col-span-3 text-center py-10 font-bold text-sm md:text-base">No tienes materias registradas.</p>}
      </div>
    </div>
  );

  const renderTareasView = () => (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900">Lista de Tareas</h1>
        <button onClick={() => openModal('tarea')} className="flex items-center justify-center space-x-2 bg-linear-to-r from-blue-700 to-blue-900 text-white px-6 py-3 rounded-xl md:rounded-2xl hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] transition-all font-bold w-full sm:w-auto">
          <Plus size={20} /> <span>Nueva Tarea</span>
        </button>
      </div>
      
      {/* RESPONSIVO: overflow-x-auto permite hacer scroll en pantallas pequeñas sin romper la tabla */}
      <div className="bg-white shadow-sm rounded-3xl md:rounded-[2.5rem] border border-gray-100 overflow-x-auto p-2">
        <table className="min-w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-black text-gray-500 uppercase tracking-widest rounded-tl-3xl whitespace-nowrap">Estado</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Tarea</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Fecha</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-right text-xs md:text-sm font-black text-gray-500 uppercase tracking-widest rounded-tr-3xl whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tareas.length === 0 && <tr><td colSpan="4" className="p-6 md:p-8 text-center text-gray-500 font-bold text-sm md:text-base">Sin tareas registradas</td></tr>}
            {tareas.map((tarea) => {
              const materia = materias.find(m => m.id_materia === tarea.id_materia) || { nombre: 'General' };
              return (
                <tr key={tarea.id_tarea} className={`hover:bg-gray-50 transition-colors ${tarea.completada ? 'opacity-60' : ''}`}>
                  <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                    <button onClick={() => toggleTarea(tarea.id_tarea)} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl border-2 transition-all ${tarea.completada ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-gray-300 hover:border-green-500'}`}>
                      <CheckSquare size={20} className={tarea.completada ? 'text-white' : 'text-transparent'} />
                    </button>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 min-w-50">
                    <div className={`text-base md:text-lg font-bold ${tarea.completada ? 'line-through text-gray-400' : 'text-gray-900'}`}>{tarea.titulo}</div>
                    <span className={`inline-block mt-1 md:mt-2 px-2 md:px-3 py-1 text-[10px] md:text-xs font-black rounded-lg border ${materia?.color || 'bg-gray-100 text-gray-600'}`}>{materia.nombre}</span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 font-bold text-gray-500 text-xs md:text-base whitespace-nowrap">{tarea.fecha_entrega?.substring(0, 10)}</td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right space-x-2 md:space-x-3 whitespace-nowrap">
                    <button onClick={() => openModal('tarea', 'edit', tarea)} className="p-2 md:p-3 bg-blue-50 text-blue-700 rounded-lg md:rounded-xl hover:scale-110 transition-transform"><Edit size={16} className="md:w-4.5 md:h-4.5"/></button>
                    <button onClick={() => eliminarItem('tarea', tarea.id_tarea)} className="p-2 md:p-3 bg-red-50 text-red-600 rounded-lg md:rounded-xl hover:scale-110 transition-transform"><Trash2 size={16} className="md:w-4.5 md:h-4.5"/></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPeriodosView = () => (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">Periodos Escolares</h1>
        <button onClick={() => openModal('periodo')} className="flex items-center justify-center space-x-2 bg-linear-to-r from-blue-700 to-blue-900 text-white px-6 py-3 rounded-xl md:rounded-2xl hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] font-semibold transition-all w-full sm:w-auto">
          <Plus size={20} /> <span>Nuevo Periodo</span>
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded-3xl md:rounded-[2.5rem] p-2 overflow-x-auto border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-black text-gray-500 uppercase tracking-widest rounded-tl-3xl whitespace-nowrap">Nombre</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Inicio</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-left text-xs md:text-sm font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Fin</th>
              <th className="px-4 md:px-8 py-4 md:py-6 text-right text-xs md:text-sm font-black text-gray-500 uppercase tracking-widest rounded-tr-3xl whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {periodos.length === 0 && <tr><td colSpan="4" className="p-6 md:p-8 text-center text-gray-500 font-bold text-sm md:text-base">Sin periodos registrados</td></tr>}
            {periodos.map((periodo) => (
              <tr key={periodo.id_periodo} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 md:px-8 py-4 md:py-6 font-bold text-gray-900 text-base md:text-lg min-w-37.5">{periodo.nombre}</td>
                <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm font-bold text-gray-500 whitespace-nowrap">{periodo.fecha_inicio ? periodo.fecha_inicio.substring(0, 10) : ''}</td>
                <td className="px-4 md:px-8 py-4 md:py-6 text-xs md:text-sm font-bold text-gray-500 whitespace-nowrap">{periodo.fecha_fin ? periodo.fecha_fin.substring(0, 10) : ''}</td>
                <td className="px-4 md:px-8 py-4 md:py-6 text-right space-x-2 md:space-x-3 whitespace-nowrap">
                  <button onClick={() => openModal('periodo', 'edit', periodo)} className="p-2 md:p-3 bg-blue-50 text-blue-700 hover:scale-110 rounded-lg md:rounded-xl transition-transform"><Edit size={16} className="md:w-4.5 md:h-4.5"/></button>
                  <button onClick={() => eliminarItem('periodo', periodo.id_periodo)} className="p-2 md:p-3 bg-red-50 text-red-600 hover:scale-110 rounded-lg md:rounded-xl transition-transform"><Trash2 size={16} className="md:w-4.5 md:h-4.5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderHorariosView = () => {
    const dias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
    const horasStart = 7; 
    const horasEnd = 16;  
    const horas = Array.from({ length: horasEnd - horasStart }, (_, i) => `${(horasStart + i).toString().padStart(2, '0')}:00`);

    const calcularEstiloBloque = (inicio, fin) => {
      if(!inicio || !fin) return {display: 'none'};
      const [hIni, mIni] = inicio.split(':').map(Number);
      const [hFin, mFin] = fin.split(':').map(Number);
      const topOffset = ((hIni - horasStart) * 60 + mIni) * (100 / 60); 
      const height = ((hFin - hIni) * 60 + (mFin - mIni)) * (100 / 60);
      return { top: `${topOffset}px`, height: `${height}px` };
    };

    return (
      <div className="fade-in">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">Horario Semanal</h1>
          <button onClick={() => openModal('horario')} className="flex items-center justify-center space-x-2 bg-linear-to-r from-blue-700 to-blue-900 text-white px-6 py-3 rounded-xl md:rounded-2xl hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] transition-all font-semibold shadow-md w-full sm:w-auto">
            <Plus size={20} /> <span>Agregar Clase</span>
          </button>
        </div>
        
        <div className="bg-white shadow-sm rounded-3xl border border-gray-100 overflow-x-auto p-4 md:p-8">
          <div className="min-w-150 md:min-w-175">
            <div className="grid grid-cols-6 mb-4 md:mb-6">
              <div className="col-span-1"></div>
              {dias.map(dia => (
                <div key={dia} className="text-center font-black text-gray-500 uppercase tracking-widest text-xs md:text-sm">{dia}</div>
              ))}
            </div>

            <div className="relative border-t border-gray-100">
              {horas.map((hora, i) => (
                <div key={hora} className="grid grid-cols-6 h-20 md:h-25 border-b border-gray-50">
                  <div className="col-span-1 text-right pr-4 md:pr-6 text-xs md:text-sm font-bold text-gray-400 pt-2">{hora}</div>
                  {dias.map(d => <div key={`${d}-${i}`} className="border-l border-gray-50"></div>)}
                </div>
              ))}

              <div className="absolute top-0 left-[16.66%] right-0 bottom-0 grid grid-cols-5 pointer-events-none">
                {dias.map(dia => {
                  const clasesDia = horarios.filter(h => h.dia_semana === dia);
                  return (
                    <div key={`col-${dia}`} className="relative h-full mx-1 md:mx-2">
                      {clasesDia.map(clase => {
                        const materia = materias.find(m => m.id_materia === clase.id_materia);
                        if (!materia) return null;
                        
                        // Ajustamos la matemática del estilo para que coincida con la altura de celular vs desktop
                        const [hIni, mIni] = clase.hora_inicio.split(':').map(Number);
                        const [hFin, mFin] = clase.hora_fin.split(':').map(Number);
                        const rowHeight = window.innerWidth < 768 ? 80 : 100; // 80px en movil, 100px en desktop
                        const topOffset = ((hIni - horasStart) * 60 + mIni) * (rowHeight / 60); 
                        const height = ((hFin - hIni) * 60 + (mFin - mIni)) * (rowHeight / 60);
                        const style = { top: `${topOffset}px`, height: `${height}px` };

                        return (
                          <div key={clase.id_horario} style={style} className={`absolute left-0 right-0 rounded-xl md:rounded-2xl border border-white/20 p-2 md:p-4 shadow-lg flex flex-col pointer-events-auto transition-transform hover:scale-[1.02] hover:z-20 backdrop-blur-md overflow-hidden z-10 group ${materia.color || 'bg-blue-100 text-blue-800'}`}>
                            <span className="text-[10px] md:text-sm font-black leading-tight">{materia.nombre}</span>
                            <span className="text-[9px] md:text-xs font-bold opacity-80 mt-0.5 md:mt-1">{clase.hora_inicio} - {clase.hora_fin}</span>
                            
                            <div className="absolute top-1 right-1 md:top-2 md:right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                               <button onClick={() => openModal('horario', 'edit', clase)} className="bg-white/90 text-blue-700 rounded-md p-1 shadow hover:bg-white"><Edit size={12} className="md:w-3.5 md:h-3.5"/></button>
                               <button onClick={() => eliminarItem('horario', clase.id_horario)} className="bg-white/90 text-red-600 rounded-md p-1 shadow hover:bg-white"><Trash2 size={12} className="md:w-3.5 md:h-3.5"/></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCalendarioView = () => {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const currentMonth = 2; // Marzo 
    const currentYear = 2026;
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); 
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); 
    const diasMes = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
      <div className="fade-in">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">Calendario</h1>
          <select className="bg-white border border-gray-200 rounded-xl py-3 px-4 md:px-5 font-bold outline-none cursor-pointer shadow-sm w-full sm:w-auto">
            {periodos.length === 0 && <option>Sin periodos</option>}
            {periodos.map(p => <option key={p.id_periodo}>{p.nombre}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 p-4 md:p-8 overflow-x-auto">
          <div className="min-w-150">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <button className="p-2 md:p-3 rounded-full bg-gray-50 hover:bg-gray-200 transition-colors"><ChevronLeft size={20} className="md:w-6 md:h-6"/></button>
              <h2 className="text-xl md:text-3xl font-black text-gray-800 tracking-wide uppercase">Marzo 2026</h2>
              <button className="p-2 md:p-3 rounded-full bg-gray-50 hover:bg-gray-200 transition-colors"><ChevronRight size={20} className="md:w-6 md:h-6"/></button>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {diasSemana.map(dia => (
                <div key={dia} className="text-center font-black text-gray-400 uppercase tracking-widest text-[10px] md:text-sm mb-1 md:mb-2">{dia}</div>
              ))}
              
              {Array.from({length: firstDay}).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 md:h-32 rounded-2xl md:rounded-3xl bg-gray-50/50"></div>
              ))}
              
              {diasMes.map(dia => {
                const diaStr = dia < 10 ? `0${dia}` : `${dia}`;
                const fechaBuscada = `2026-03-${diaStr}`;
                const tareasDelDia = tareas.filter(t => t.fecha_entrega && t.fecha_entrega.substring(0,10) === fechaBuscada);
                const esHoy = dia === 15; 

                return (
                  <div key={dia} className={`h-24 md:h-32 rounded-2xl md:rounded-3xl p-1.5 md:p-3 flex flex-col transition-all duration-300 hover:-translate-y-1 bg-gray-50 ${esHoy ? 'ring-2 ring-blue-500 shadow-lg' : 'border border-gray-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                      <span className={`text-xs md:text-sm font-black w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full ${esHoy ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                        {dia}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-1 md:space-y-1.5 scrollbar-hide">
                      {tareasDelDia.map(tarea => {
                         const materia = materias.find(m => m.id_materia === tarea.id_materia);
                         const uiColor = materia?.color ? `${materia.color.split(' ')[0]} ${materia.color.split(' ')[1]}` : 'bg-gray-200 text-gray-800';
                         
                         return (
                          <div key={tarea.id_tarea} className={`text-[8px] md:text-[10px] p-1 md:p-1.5 px-1.5 md:px-2.5 font-bold rounded-md md:rounded-lg flex items-center justify-between truncate shadow-sm ${tarea.completada ? 'bg-gray-200 text-gray-400 line-through' : uiColor}`} title={tarea.titulo}>
                            <span className="truncate">{tarea.titulo}</span>
                            {!tarea.completada && <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse ml-1"></span>}
                          </div>
                         )
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER PRINCIPAL 
  // ==========================================
  if (currentView === 'login') return renderAuthView(true);
  if (currentView === 'register') return renderAuthView(false);

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col md:flex-row h-screen bg-[#f8fafc] text-gray-900 font-poppins overflow-hidden">
        
        {/* ENCABEZADO MOVIL (Botón Hamburguesa) */}
        <div className="md:hidden flex items-center justify-between bg-white p-4 border-b border-gray-200 z-30">
          <h1 className="text-xl font-black flex items-center space-x-2 text-blue-900">
            <img src="/logo.webp" alt="Logo UPB" className="w-8 h-8 object-contain bg-white rounded-lg shadow-sm border border-gray-100 p-0.5" />
            <span>Proyecto Tareas</span>
          </h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-50 rounded-lg text-gray-600 focus:outline-none">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* OVERLAY PARA MÓVIL (Oscurece el fondo cuando el menú está abierto) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        {/* SIDEBAR RESPONSIVO */}
        <aside className={`fixed md:static inset-y-0 left-0 w-72 md:w-80 bg-white border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-black flex items-center space-x-3 text-blue-900">
              <img src="/logo.webp" alt="Logo UPB" className="w-10 h-10 md:w-12 md:h-12 object-contain bg-white rounded-xl shadow-sm border border-gray-100 p-1" />
              <span>SchoolTasks</span>
            </h1>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex-1 p-4 md:p-6 space-y-2 md:space-y-3 overflow-y-auto">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Resumen' },
              { id: 'periodos', icon: CalendarIcon, label: 'Periodos' },
              { id: 'materias', icon: Book, label: 'Materias' },
              { id: 'tareas', icon: CheckSquare, label: 'Tareas' },
              { id: 'horarios', icon: Clock, label: 'Horario' },
              { id: 'calendario', icon: CalendarIcon, label: 'Calendario' },
            ].map(item => (
              <button key={item.id} 
                onClick={() => { setCurrentView(item.id); setIsMobileMenuOpen(false); }} 
                className={`w-full flex items-center space-x-4 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all duration-300 ${currentView === item.id ? 'bg-blue-700 text-white shadow-xl shadow-blue-700/20 translate-x-2' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                <item.icon size={20} className="md:w-5.5 md:h-5.5"/> <span className="text-base md:text-lg">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="p-4 md:p-6 border-t border-gray-100 space-y-4">
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 md:px-6 py-3 md:py-4 text-red-500 hover:bg-red-50 rounded-xl md:rounded-2xl transition-all font-bold">
              <LogOut size={20} /> <span className="text-base md:text-lg">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 relative w-full h-[calc(100vh-73px)] md:h-screen">
          <div className="max-w-7xl mx-auto pb-20 md:pb-0">
            {currentView === 'dashboard' && renderDashboardView()}
            {currentView === 'periodos' && renderPeriodosView()}
            {currentView === 'materias' && renderMateriasView()}
            {currentView === 'tareas' && renderTareasView()}
            {currentView === 'horarios' && renderHorariosView()}
            {currentView === 'calendario' && renderCalendarioView()}
          </div>
        </main>
      </div>
      
      {/* MODAL GLOBAL PARA FORMULARIOS */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm font-poppins overflow-y-auto">
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center p-6 md:p-8 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 capitalize">{modal.mode === 'create' ? 'Nuevo' : 'Editar'} {modal.type}</h3>
              <button type="button" onClick={closeModal} className="text-gray-400 bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 md:space-y-5">
              
              {/* TAREAS */}
              {modal.type === 'tarea' && (
                <>
                  <input type="text" name="titulo" value={formData.titulo || ''} onChange={handleFormChange} required placeholder="Título de la tarea" className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleFormChange} required placeholder="Descripción" rows="3" className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="date" name="fecha" value={formData.fecha?.substring(0,10) || ''} onChange={handleFormChange} required className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <select name="materiaId" value={formData.materiaId || ''} onChange={handleFormChange} required className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                    <option value="">Selecciona materia...</option>
                    {materias.map(m => <option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>)}
                  </select>
                </>
              )}
              
              {/* MATERIAS */}
              {modal.type === 'materia' && (
                <>
                  <input type="text" name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required placeholder="Nombre de Materia" className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="text" name="profesor" value={formData.profesor || ''} onChange={handleFormChange} required placeholder="Nombre del Profesor" className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  
                  <div className="mb-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Color Etiqueta</label>
                      <div className="flex space-x-2 md:space-x-3">
                        {COLOR_OPTIONS.map((opt, i) => (
                          <button type="button" key={i} onClick={() => setFormData({...formData, colorObj: opt})} className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${opt.color.split(' ')[0]} ${formData.colorObj?.label === opt.label ? 'border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'}`} title={opt.label}></button>
                        ))}
                      </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Imagen de Fondo (Opcional)</label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl md:rounded-2xl p-4 md:p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="text-gray-500 flex flex-col items-center">
                           <ImageIcon size={28} className="mb-2 text-blue-500 md:w-8 md:h-8" />
                           <p className="text-xs md:text-sm font-bold text-blue-600">Seleccionar Imagen Local</p>
                           <p className="text-[10px] md:text-xs mt-1">Sube la portada para la materia</p>
                        </div>
                    </div>
                    {formData.img && formData.img.startsWith('data:image') && (
                      <div className="mt-3 flex items-center space-x-2 text-[10px] md:text-sm font-bold text-green-600 bg-green-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-green-200">
                         <span>✓ Imagen cargada correctamente</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* PERIODOS */}
              {modal.type === 'periodo' && (
                <>
                  <input type="text" name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required placeholder="Nombre Periodo (Ej. 2026-1)" className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">Inicio</label>
                      <input type="date" name="inicio" value={formData.inicio?.substring(0,10) || ''} onChange={handleFormChange} required className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">Fin</label>
                      <input type="date" name="fin" value={formData.fin?.substring(0,10) || ''} onChange={handleFormChange} required className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </>
              )}

              {/* HORARIOS */}
              {modal.type === 'horario' && (
                <>
                  <select name="dia" value={formData.dia || ''} onChange={handleFormChange} required className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                    <option value="">Selecciona Día</option>
                    {['Lun', 'Mar', 'Mie', 'Jue', 'Vie'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4 md:gap-5">
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">Hora Inicio</label>
                      <input type="time" name="inicio" value={formData.inicio || ''} onChange={handleFormChange} required className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">Hora Fin</label>
                      <input type="time" name="fin" value={formData.fin || ''} onChange={handleFormChange} required className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <select name="materiaId" value={formData.materiaId || ''} onChange={handleFormChange} required className="w-full rounded-xl md:rounded-2xl bg-gray-100 border-none p-3 md:p-4 text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                    <option value="">Selecciona materia...</option>
                    {materias.map(m => <option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>)}
                  </select>
                </>
              )}

              <div className="pt-2 md:pt-4 flex justify-end space-x-3 md:space-x-4">
                <button type="button" onClick={closeModal} className="px-4 md:px-6 py-3 md:py-4 text-sm md:text-base text-gray-500 hover:bg-gray-100 rounded-xl md:rounded-2xl font-bold transition-all">Cancelar</button>
                <button type="submit" className="px-6 md:px-8 py-3 md:py-4 text-sm md:text-base bg-blue-700 hover:bg-blue-600 text-white rounded-xl md:rounded-2xl shadow-lg shadow-blue-700/30 font-bold transition-all transform hover:scale-105">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-4 md:bottom-8 right-4 md:right-8 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl shadow-2xl font-bold text-sm md:text-base text-white flex items-center space-x-2 md:space-x-3 z-200 animate-in slide-in-from-bottom-10 duration-300 ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
          {toast.type === 'error' ? <X size={20} /> : <CheckSquare size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif !important; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}