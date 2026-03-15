'use client'; 

import React, { useState, useEffect } from 'react';
import { 
  Book, Calendar as CalendarIcon, CheckSquare, Clock, 
  LayoutDashboard, LogOut, Plus, Trash2, Edit, User, Mail, Lock,
  ChevronLeft, ChevronRight, X, Save, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';

// ==========================================
// CONEXIÓN CON TU BACKEND EN NODE.JS
// ==========================================
const api = axios.create({
  baseURL: 'http://localhost:3000/api', 
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
    // Aquí usamos la imagen de fondo de la universidad que subiste a la carpeta public
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative font-poppins" style={{ backgroundImage: "url('/fondo.jpg')" }}>
      {/* Overlay oscuro para que el texto resalte sobre la foto */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-md w-full space-y-6 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
        
        <div className="flex justify-center -mt-20 mb-2">
          <div className="bg-white p-2 rounded-full shadow-xl border border-gray-100">
            {/* Aquí usamos tu logo de la UPB */}
            <img src="/logo.webp" alt="Logo UPB" className="w-24 h-24 object-contain rounded-full" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900">{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h2>
          <p className="mt-2 text-sm text-gray-500">{isLogin ? 'Inicia sesión ' : 'Regístrate para organizar tus materias'}</p>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={async (e) => { 
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
          <div className="space-y-4">
            {!isLogin && <input type="text" required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre completo" />}
            <input type="email" required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Correo electrónico" />
            <input type="password" required className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contraseña" />
          </div>
          <button type="submit" className="w-full py-4 text-white font-bold rounded-2xl bg-linear-to-r from-blue-900 to-blue-700 hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] transition-all transform hover:scale-[1.02]">
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
      <h1 className="text-4xl font-black mb-8 text-gray-900 tracking-tight">Resumen de Actividades</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[{ title: 'Pendientes', count: tareas.filter(t=>!t.completada).length, icon: CheckSquare, color: 'text-red-500', bg: 'bg-red-50' },
          { title: 'Entregadas', count: tareas.filter(t=>t.completada).length, icon: CheckSquare, color: 'text-green-500', bg: 'bg-green-50' },
          { title: 'Materias', count: materias.length, icon: Book, color: 'text-blue-700', bg: 'bg-blue-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-4xl shadow-sm border border-gray-100 p-8 flex items-center space-x-6 hover:-translate-y-1 transition-transform">
            <div className={`p-5 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon size={32} /></div>
            <div><p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.title}</p><p className="text-4xl font-black text-gray-900">{stat.count}</p></div>
          </div>
        ))}
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight">Próximas Entregas</h2>
      <div className="bg-white shadow-sm rounded-4xl border border-gray-100 overflow-hidden">
        {tareas.filter(t => !t.completada).map(tarea => {
          const materia = materias.find(m => m.id_materia === tarea.id_materia) || materias[0];
          return (
            <div key={tarea.id_tarea} className="p-5 border-b border-gray-50 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{tarea.titulo}</h3>
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full border ${materia?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}>{materia?.nombre || 'General'}</span>
              </div>
              <p className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">Vence: {tarea.fecha_entrega ? tarea.fecha_entrega.substring(0, 10) : ''}</p>
            </div>
          )
        })}
        {tareas.filter(t => !t.completada).length === 0 && <p className="p-8 text-center text-gray-500 font-bold">No hay tareas pendientes.</p>}
      </div>
    </div>
  );

  const renderMateriasView = () => (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-gray-900">Mis Materias</h1>
        <button onClick={() => openModal('materia')} className="flex items-center space-x-2 bg-linear-to-r from-blue-700 to-blue-900 text-white px-6 py-3 rounded-2xl hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] transition-all font-bold">
          <Plus size={20} /> <span>Agregar Materia</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {materias.map((materia) => (
          <div key={materia.id_materia} className={`relative overflow-hidden rounded-[2.5rem] shadow-xl transition-all duration-300 transform hover:-translate-y-2 group h-72 border border-gray-200 ${materia.glow || ''} ${!materia.img ? (materia.color || 'bg-blue-100') : ''}`}>
            {materia.img && (
              <>
                <img src={materia.img} alt="Materia" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" />
                <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
              </>
            )}
            {!materia.img && (
              <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent"></div>
            )}
            
            <div className="relative z-10 p-8 flex flex-col h-full justify-between">
              <div>
                <h3 className={`text-3xl font-black mb-3 drop-shadow-lg leading-tight ${materia.img ? 'text-white' : 'text-gray-900'}`}>{materia.nombre}</h3>
                <p className={`text-sm font-bold border inline-block px-4 py-2 rounded-full backdrop-blur-md shadow-sm ${materia.img ? 'text-white bg-white/20 border-white/30' : 'text-gray-700 border-gray-300 bg-white/50'}`}>
                  Prof. {materia.profesor}
                </p>
              </div>
              <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={() => openModal('materia', 'edit', materia)} className="p-3 bg-white/90 text-blue-700 hover:bg-white rounded-xl shadow-lg transition-all"><Edit size={18} /></button>
                <button onClick={() => eliminarItem('materia', materia.id_materia)} className="p-3 bg-red-500/90 hover:bg-red-500 text-white rounded-xl shadow-lg transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {materias.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10 font-bold">No tienes materias registradas.</p>}
      </div>
    </div>
  );

  const renderTareasView = () => (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-gray-900">Lista de Tareas</h1>
        <button onClick={() => openModal('tarea')} className="flex items-center space-x-2 bg-linear-to-r from-blue-700 to-blue-900 text-white px-6 py-3 rounded-2xl hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] transition-all font-bold">
          <Plus size={20} /> <span>Nueva Tarea</span>
        </button>
      </div>
      <div className="bg-white shadow-sm rounded-[2.5rem] border border-gray-100 overflow-hidden p-2">
        <table className="min-w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-8 py-6 text-left text-sm font-black text-gray-500 uppercase tracking-widest rounded-tl-3xl">Estado</th>
              <th className="px-8 py-6 text-left text-sm font-black text-gray-500 uppercase tracking-widest">Tarea</th>
              <th className="px-8 py-6 text-left text-sm font-black text-gray-500 uppercase tracking-widest">Fecha</th>
              <th className="px-8 py-6 text-right text-sm font-black text-gray-500 uppercase tracking-widest rounded-tr-3xl">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tareas.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-bold">Sin tareas registradas</td></tr>}
            {tareas.map((tarea) => {
              const materia = materias.find(m => m.id_materia === tarea.id_materia) || { nombre: 'General' };
              return (
                <tr key={tarea.id_tarea} className={`hover:bg-gray-50 transition-colors ${tarea.completada ? 'opacity-60' : ''}`}>
                  <td className="px-8 py-6">
                    <button onClick={() => toggleTarea(tarea.id_tarea)} className={`p-2 rounded-xl border-2 transition-all ${tarea.completada ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-gray-300 hover:border-green-500'}`}>
                      <CheckSquare size={20} className={tarea.completada ? 'text-white' : 'text-transparent'} />
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`text-lg font-bold ${tarea.completada ? 'line-through text-gray-400' : 'text-gray-900'}`}>{tarea.titulo}</div>
                    <span className={`inline-block mt-2 px-3 py-1 text-xs font-black rounded-lg border ${materia?.color || 'bg-gray-100 text-gray-600'}`}>{materia.nombre}</span>
                  </td>
                  <td className="px-8 py-6 font-bold text-gray-500">{tarea.fecha_entrega?.substring(0, 10)}</td>
                  <td className="px-8 py-6 text-right space-x-3">
                    <button onClick={() => openModal('tarea', 'edit', tarea)} className="p-3 bg-blue-50 text-blue-700 rounded-xl hover:scale-110 transition-transform"><Edit size={18} /></button>
                    <button onClick={() => eliminarItem('tarea', tarea.id_tarea)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:scale-110 transition-transform"><Trash2 size={18} /></button>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Periodos Escolares</h1>
        <button onClick={() => openModal('periodo')} className="flex items-center space-x-2 bg-linear-to-r from-blue-700 to-blue-900 text-white px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] font-semibold transition-all">
          <Plus size={20} /> <span>Nuevo Periodo</span>
        </button>
      </div>
      <div className="bg-white shadow-sm rounded-[2.5rem] p-2 overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-8 py-6 text-left text-sm font-black text-gray-500 uppercase tracking-widest rounded-tl-3xl">Nombre</th>
              <th className="px-8 py-6 text-left text-sm font-black text-gray-500 uppercase tracking-widest">Inicio</th>
              <th className="px-8 py-6 text-left text-sm font-black text-gray-500 uppercase tracking-widest">Fin</th>
              <th className="px-8 py-6 text-right text-sm font-black text-gray-500 uppercase tracking-widest rounded-tr-3xl">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {periodos.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-bold">Sin periodos registrados</td></tr>}
            {periodos.map((periodo) => (
              <tr key={periodo.id_periodo} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-6 font-bold text-gray-900 text-lg">{periodo.nombre}</td>
                <td className="px-8 py-6 text-sm font-bold text-gray-500">{periodo.fecha_inicio ? periodo.fecha_inicio.substring(0, 10) : ''}</td>
                <td className="px-8 py-6 text-sm font-bold text-gray-500">{periodo.fecha_fin ? periodo.fecha_fin.substring(0, 10) : ''}</td>
                <td className="px-8 py-6 text-right space-x-3">
                  <button onClick={() => openModal('periodo', 'edit', periodo)} className="p-3 bg-blue-50 text-blue-700 hover:scale-110 rounded-xl transition-transform"><Edit size={18} /></button>
                  <button onClick={() => eliminarItem('periodo', periodo.id_periodo)} className="p-3 bg-red-50 text-red-600 hover:scale-110 rounded-xl transition-transform"><Trash2 size={18} /></button>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Horario Semanal</h1>
          <button onClick={() => openModal('horario')} className="flex items-center space-x-2 bg-linear-to-r from-blue-700 to-blue-900 text-white px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(29,78,216,0.4)] transition-all font-semibold shadow-md">
            <Plus size={20} /> <span>Agregar Clase</span>
          </button>
        </div>
        
        <div className="bg-white shadow-sm rounded-3xl border border-gray-100 overflow-x-auto p-8">
          <div className="min-w-175">
            <div className="grid grid-cols-6 mb-6">
              <div className="col-span-1"></div>
              {dias.map(dia => (
                <div key={dia} className="text-center font-black text-gray-500 uppercase tracking-widest">{dia}</div>
              ))}
            </div>

            <div className="relative border-t border-gray-100">
              {horas.map((hora, i) => (
                <div key={hora} className="grid grid-cols-6 h-25 border-b border-gray-50">
                  <div className="col-span-1 text-right pr-6 text-sm font-bold text-gray-400 pt-2">{hora}</div>
                  {dias.map(d => <div key={`${d}-${i}`} className="border-l border-gray-50"></div>)}
                </div>
              ))}

              <div className="absolute top-0 left-[16.66%] right-0 bottom-0 grid grid-cols-5 pointer-events-none">
                {dias.map(dia => {
                  const clasesDia = horarios.filter(h => h.dia_semana === dia);
                  return (
                    <div key={`col-${dia}`} className="relative h-full mx-2">
                      {clasesDia.map(clase => {
                        const materia = materias.find(m => m.id_materia === clase.id_materia);
                        if (!materia) return null;
                        const style = calcularEstiloBloque(clase.hora_inicio, clase.hora_fin);
                        return (
                          <div key={clase.id_horario} style={style} className={`absolute left-0 right-0 rounded-2xl border border-white/20 p-4 shadow-lg flex flex-col pointer-events-auto transition-transform hover:scale-[1.02] hover:z-20 backdrop-blur-md overflow-hidden z-10 group ${materia.color || 'bg-blue-100 text-blue-800'}`}>
                            <span className="text-sm font-black leading-tight">{materia.nombre}</span>
                            <span className="text-xs font-bold opacity-80 mt-1">{clase.hora_inicio} - {clase.hora_fin}</span>
                            
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                               <button onClick={() => openModal('horario', 'edit', clase)} className="bg-white/90 text-blue-700 rounded-lg p-1.5 shadow hover:bg-white"><Edit size={14}/></button>
                               <button onClick={() => eliminarItem('horario', clase.id_horario)} className="bg-white/90 text-red-600 rounded-lg p-1.5 shadow hover:bg-white"><Trash2 size={14}/></button>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Calendario de Tareas</h1>
          <select className="bg-white border border-gray-200 rounded-xl py-3 px-5 font-bold outline-none cursor-pointer shadow-sm">
            {periodos.length === 0 && <option>Sin periodos</option>}
            {periodos.map(p => <option key={p.id_periodo}>{p.nombre}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-8">
            <button className="p-3 rounded-full bg-gray-50 hover:bg-gray-200 transition-colors"><ChevronLeft size={24}/></button>
            <h2 className="text-3xl font-black text-gray-800 tracking-wide uppercase">Marzo 2026</h2>
            <button className="p-3 rounded-full bg-gray-50 hover:bg-gray-200 transition-colors"><ChevronRight size={24}/></button>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {diasSemana.map(dia => (
              <div key={dia} className="text-center font-black text-gray-400 uppercase tracking-widest text-sm mb-2">{dia}</div>
            ))}
            
            {Array.from({length: firstDay}).map((_, i) => (
              <div key={`empty-${i}`} className="h-32 rounded-3xl bg-gray-50/50"></div>
            ))}
            
            {diasMes.map(dia => {
              const diaStr = dia < 10 ? `0${dia}` : `${dia}`;
              const fechaBuscada = `2026-03-${diaStr}`;
              const tareasDelDia = tareas.filter(t => t.fecha_entrega && t.fecha_entrega.substring(0,10) === fechaBuscada);
              const esHoy = dia === 15; 

              return (
                <div key={dia} className={`h-32 rounded-3xl p-3 flex flex-col transition-all duration-300 hover:-translate-y-1 bg-gray-50 ${esHoy ? 'ring-2 ring-blue-500 shadow-lg' : 'border border-gray-100 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-full ${esHoy ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                      {dia}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
                    {tareasDelDia.map(tarea => {
                       const materia = materias.find(m => m.id_materia === tarea.id_materia);
                       const uiColor = materia?.color ? `${materia.color.split(' ')[0]} ${materia.color.split(' ')[1]}` : 'bg-gray-200 text-gray-800';
                       
                       return (
                        <div key={tarea.id_tarea} className={`text-[10px] p-1.5 px-2.5 font-bold rounded-lg flex items-center justify-between truncate shadow-sm ${tarea.completada ? 'bg-gray-200 text-gray-400 line-through' : uiColor}`} title={tarea.titulo}>
                          <span className="truncate">{tarea.titulo}</span>
                          {!tarea.completada && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse ml-1"></span>}
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
    );
  };

  // ==========================================
  // RENDER PRINCIPAL 
  // ==========================================
  if (currentView === 'login') return renderAuthView(true);
  if (currentView === 'register') return renderAuthView(false);

  return (
    <div className="w-full min-h-screen">
      <div className="flex h-screen bg-[#f8fafc] text-gray-900 font-poppins">
        
        {/* SIDEBAR */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-20">
          <div className="p-8 border-b border-gray-100">
            <h1 className="text-3xl font-black flex items-center space-x-3 text-blue-900">
              {/* Aquí reemplazamos el ícono del librito por tu logo de la universidad */}
              <img src="/logo.webp" alt="Logo UPB" className="w-15 h-15 object-contain bg-white rounded-xl shadow-sm border border-gray-100 p-1" />
              <span>Proyecto Tareas</span>
            </h1>
          </div>
          
          <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Resumen' },
              { id: 'periodos', icon: CalendarIcon, label: 'Periodos' },
              { id: 'materias', icon: Book, label: 'Materias' },
              { id: 'tareas', icon: CheckSquare, label: 'Tareas' },
              { id: 'horarios', icon: Clock, label: 'Horario' },
              { id: 'calendario', icon: CalendarIcon, label: 'Calendario' },
            ].map(item => (
              <button key={item.id} onClick={() => setCurrentView(item.id)} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${currentView === item.id ? 'bg-blue-700 text-white shadow-xl shadow-blue-700/20 translate-x-2' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                <item.icon size={22} /> <span className="text-lg">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="p-6 border-t border-gray-100 space-y-4">
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-6 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold">
              <LogOut size={20} /> <span className="text-lg">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-12 relative">
          <div className="max-w-7xl mx-auto">
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm font-poppins">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gray-50">
              <h3 className="text-2xl font-black text-gray-900 capitalize">{modal.mode === 'create' ? 'Nuevo' : 'Editar'} {modal.type}</h3>
              <button onClick={closeModal} className="text-gray-400 bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              
              {/* TAREAS */}
              {modal.type === 'tarea' && (
                <>
                  <input type="text" name="titulo" value={formData.titulo || ''} onChange={handleFormChange} required placeholder="Título de la tarea" className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleFormChange} required placeholder="Descripción" rows="3" className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="date" name="fecha" value={formData.fecha?.substring(0,10) || ''} onChange={handleFormChange} required className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <select name="materiaId" value={formData.materiaId || ''} onChange={handleFormChange} required className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                    <option value="">Selecciona materia...</option>
                    {materias.map(m => <option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>)}
                  </select>
                </>
              )}
              
              {/* MATERIAS */}
              {modal.type === 'materia' && (
                <>
                  <input type="text" name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required placeholder="Nombre de Materia" className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="text" name="profesor" value={formData.profesor || ''} onChange={handleFormChange} required placeholder="Nombre del Profesor" className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  
                  <div className="mb-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Color Etiqueta</label>
                      <div className="flex space-x-3">
                        {COLOR_OPTIONS.map((opt, i) => (
                          <button type="button" key={i} onClick={() => setFormData({...formData, colorObj: opt})} className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${opt.color.split(' ')[0]} ${formData.colorObj?.label === opt.label ? 'border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'}`} title={opt.label}></button>
                        ))}
                      </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Imagen de Fondo (Opcional)</label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="text-gray-500 flex flex-col items-center">
                           <ImageIcon size={32} className="mb-2 text-blue-500" />
                           <p className="text-sm font-bold text-blue-600">Seleccionar Imagen Local</p>
                           <p className="text-xs mt-1">Sube la portada para la materia</p>
                        </div>
                    </div>
                    {formData.img && formData.img.startsWith('data:image') && (
                      <div className="mt-3 flex items-center space-x-2 text-sm font-bold text-green-600 bg-green-50 p-3 rounded-xl border border-green-200">
                         <span>✓ Imagen cargada correctamente</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* PERIODOS */}
              {modal.type === 'periodo' && (
                <>
                  <input type="text" name="nombre" value={formData.nombre || ''} onChange={handleFormChange} required placeholder="Nombre Periodo (Ej. 2026-1)" className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Inicio</label>
                      <input type="date" name="inicio" value={formData.inicio?.substring(0,10) || ''} onChange={handleFormChange} required className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Fin</label>
                      <input type="date" name="fin" value={formData.fin?.substring(0,10) || ''} onChange={handleFormChange} required className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </>
              )}

              {/* HORARIOS */}
              {modal.type === 'horario' && (
                <>
                  <select name="dia" value={formData.dia || ''} onChange={handleFormChange} required className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                    <option value="">Selecciona Día</option>
                    {['Lun', 'Mar', 'Mie', 'Jue', 'Vie'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Hora Inicio</label>
                      <input type="time" name="inicio" value={formData.inicio || ''} onChange={handleFormChange} required className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Hora Fin</label>
                      <input type="time" name="fin" value={formData.fin || ''} onChange={handleFormChange} required className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <select name="materiaId" value={formData.materiaId || ''} onChange={handleFormChange} required className="w-full rounded-2xl bg-gray-100 border-none p-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                    <option value="">Selecciona materia...</option>
                    {materias.map(m => <option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>)}
                  </select>
                </>
              )}

              <div className="pt-4 flex justify-end space-x-4">
                <button type="button" onClick={closeModal} className="px-6 py-4 text-gray-500 hover:bg-gray-100 rounded-2xl font-bold transition-all">Cancelar</button>
                <button type="submit" className="px-8 py-4 bg-blue-700 hover:bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-700/30 font-bold transition-all transform hover:scale-105">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white flex items-center space-x-3 z-200 animate-in slide-in-from-bottom-10 duration-300 ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
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