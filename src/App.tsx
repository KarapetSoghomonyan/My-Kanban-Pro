// src/App.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  tags: string[];
  createdAt: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const App: React.FC = () => {
  // Начальные данные
  const initialData: Column[] = [
    {
      id: 'todo',
      title: '📋 To Do',
      color: '#3b82f6',
      tasks: [
        {
          id: '1',
          title: 'Design Homepage',
          description: 'Create wireframes and mockups for the main page',
          priority: 'high',
          deadline: '2024-12-30',
          tags: ['design', 'frontend'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Setup Database',
          description: 'Configure PostgreSQL and create initial schemas',
          priority: 'medium',
          tags: ['backend', 'database'],
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'inprogress',
      title: '🚀 In Progress',
      color: '#f59e0b',
      tasks: [
        {
          id: '3',
          title: 'User Authentication',
          description: 'Implement login and registration functionality',
          priority: 'high',
          deadline: '2025-01-05',
          tags: ['auth', 'security'],
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'review',
      title: '👀 Review',
      color: '#8b5cf6',
      tasks: [
        {
          id: '4',
          title: 'Code Review',
          description: 'Review payment integration code',
          priority: 'medium',
          tags: ['review', 'payment'],
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'done',
      title: '✅ Done',
      color: '#10b981',
      tasks: [
        {
          id: '5',
          title: 'Project Setup',
          description: 'Initialize React project with TypeScript',
          priority: 'low',
          tags: ['setup'],
          createdAt: new Date().toISOString()
        }
      ]
    }
  ];

  // Функция для безопасного получения данных из localStorage
  const getInitialData = (): Column[] => {
    try {
      const saved = localStorage.getItem('kanban-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Проверяем, что это массив
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    }
    return initialData;
  };

  // Состояния
  const [columns, setColumns] = useState<Column[]>(getInitialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [darkMode, setDarkMode] = useState(false);
  const [showStats, setShowStats] = useState(true);
  
  // Модальные окна
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  
  // Формы
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    deadline: '',
    tags: ''
  });
  
  const [newColumn, setNewColumn] = useState({
    title: '',
    color: '#6b7280'
  });

  // Безопасное сохранение в localStorage
  useEffect(() => {
    try {
      if (Array.isArray(columns)) {
        localStorage.setItem('kanban-data', JSON.stringify(columns));
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
    }
  }, [columns]);

  // Статистика с проверкой на массив
  const stats = useMemo(() => {
    if (!Array.isArray(columns)) {
      return { totalTasks: 0, completedTasks: 0, highPriorityTasks: 0, overdueTasks: 0 };
    }

    const totalTasks = columns.reduce((sum, col) => sum + (col.tasks?.length || 0), 0);
    const completedTasks = columns.find(col => col.id === 'done')?.tasks?.length || 0;
    const highPriorityTasks = columns.reduce((sum, col) => 
      sum + (col.tasks?.filter(task => task.priority === 'high')?.length || 0), 0
    );
    const overdueTasks = columns.reduce((sum, col) => 
      sum + (col.tasks?.filter(task => 
        task.deadline && new Date(task.deadline) < new Date()
      )?.length || 0), 0
    );
    
    return { totalTasks, completedTasks, highPriorityTasks, overdueTasks };
  }, [columns]);

  // Фильтрация задач с проверкой на массив
  const filteredColumns = useMemo(() => {
    if (!Array.isArray(columns)) return [];

    return columns.map(column => ({
      ...column,
      tasks: (column.tasks || []).filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        
        return matchesSearch && matchesPriority;
      })
    }));
  }, [columns, searchTerm, filterPriority]);

  // Drag & Drop
  const onDragEnd = (result: any) => {
    if (!result.destination || !Array.isArray(columns)) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const destColumn = columns.find(col => col.id === destination.droppableId);
      
      if (!sourceColumn || !destColumn) return;

      const sourceTasks = [...(sourceColumn.tasks || [])];
      const destTasks = [...(destColumn.tasks || [])];
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);

      setColumns(columns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, tasks: sourceTasks };
        } else if (col.id === destination.droppableId) {
          return { ...col, tasks: destTasks };
        }
        return col;
      }));
    } else {
      const column = columns.find(col => col.id === source.droppableId);
      if (!column) return;

      const newTasks = [...(column.tasks || [])];
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      setColumns(columns.map(col => 
        col.id === source.droppableId ? { ...col, tasks: newTasks } : col
      ));
    }
  };

  // Добавление задачи
  const addTask = (columnId: string) => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      priority: newTask.priority,
      deadline: newTask.deadline || undefined,
      tags: newTask.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: new Date().toISOString()
    };

    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, tasks: [...(col.tasks || []), task] } : col
    ));

    setNewTask({ title: '', description: '', priority: 'medium', deadline: '', tags: '' });
    setIsAddingTask(null);
  };

  // Удаление задачи
  const deleteTask = (columnId: string, taskId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId 
        ? { ...col, tasks: (col.tasks || []).filter(task => task.id !== taskId) }
        : col
    ));
  };

  // Редактирование задачи
  const updateTask = (updatedTask: Task) => {
    setColumns(columns.map(col => ({
      ...col,
      tasks: (col.tasks || []).map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    })));
    setEditingTask(null);
  };

  // Добавление колонки
  const addColumn = () => {
    if (!newColumn.title.trim()) return;

    const column: Column = {
      id: Date.now().toString(),
      title: newColumn.title.trim(),
      color: newColumn.color,
      tasks: []
    };

    setColumns([...columns, column]);
    setNewColumn({ title: '', color: '#6b7280' });
    setIsAddingColumn(false);
  };

  // Экспорт данных
  const exportData = () => {
    const dataStr = JSON.stringify(columns, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kanban-board.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Импорт данных
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          setColumns(importedData);
        } else {
          alert('Неверный формат файла');
        }
      } catch (error) {
        alert('Ошибка при импорте файла');
      }
    };
    reader.readAsText(file);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const isOverdue = (deadline?: string) => {
    return deadline && new Date(deadline) < new Date();
  };

  const themeStyles = darkMode ? {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#f8fafc'
  } : {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff'
  };

  // Проверка на валидность данных
  if (!Array.isArray(columns)) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>⚠️ Ошибка загрузки данных</h1>
          <p>Пожалуйста, перезагрузите страницу</p>
          <button 
            onClick={() => {
              localStorage.removeItem('kanban-data');
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Сбросить данные
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...themeStyles,
      minHeight: '100vh',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '2.5rem',
              fontWeight: 'bold',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              🚀 Kanban Board Pro
            </h1>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
              Профессиональное управление задачами
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Поиск */}
            <input
              type="text"
              placeholder="🔍 Поиск задач..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 15px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                backdropFilter: 'blur(5px)',
                minWidth: '200px'
              }}
            />
            
            {/* Фильтр приоритета */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                backdropFilter: 'blur(5px)'
              }}
            >
              <option value="all" style={{background: '#1f2937', color: 'white'}}>Все приоритеты</option>
              <option value="high" style={{background: '#1f2937', color: 'white'}}>🔴 Высокий</option>
              <option value="medium" style={{background: '#1f2937', color: 'white'}}>🟡 Средний</option>
              <option value="low" style={{background: '#1f2937', color: 'white'}}>🟢 Низкий</option>
            </select>
            
            {/* Кнопки управления */}
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                padding: '10px 15px',
                borderRadius: '10px',
                border: 'none',
                background: showStats ? '#10b981' : 'rgba(255,255,255,0.2)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              📊 Статистика
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '10px 15px',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            <button
              onClick={exportData}
              style={{
                padding: '10px 15px',
                borderRadius: '10px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              💾 Экспорт
            </button>
            
            <label style={{
              padding: '10px 15px',
              borderRadius: '10px',
              background: '#8b5cf6',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              📁 Импорт
              <input
                type="file"
                accept=".json"
                onChange={importData}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Статистика */}
      {showStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          {[
            { label: 'Всего задач', value: stats.totalTasks, icon: '📋', color: '#3b82f6' },
            { label: 'Выполнено', value: stats.completedTasks, icon: '✅', color: '#10b981' },
            { label: 'Высокий приоритет', value: stats.highPriorityTasks, icon: '🔥', color: '#ef4444' },
            { label: 'Просрочено', value: stats.overdueTasks, icon: '⏰', color: '#f59e0b' }
          ].map((stat, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{
          display: 'flex',
          gap: '25px',
          overflowX: 'auto',
          paddingBottom: '20px'
        }}>
          {filteredColumns.map(column => (
            <div key={column.id} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '20px',
              minWidth: '320px',
              maxWidth: '320px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              {/* Заголовок колонки */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: `3px solid ${column.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                    {column.title}
                  </h2>
                  <span style={{
                    background: column.color,
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {(column.tasks || []).length}
                  </span>
                </div>
                
                <button
                  onClick={() => setIsAddingTask(column.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                  ➕
                </button>
              </div>

              {/* Область задач */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{
                      background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.1)' : 'transparent',
                      borderRadius: '15px',
                      padding: '10px',
                      minHeight: '300px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Форма добавления задачи */}
                    {isAddingTask === column.id && (
                      <div style={{
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '15px',
                        padding: '20px',
                        marginBottom: '15px',
                        color: '#1f2937'
                      }}>
                        <input
                          type="text"
                          placeholder="Название задачи..."
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px'
                          }}
                          autoFocus
                        />
                        <textarea
                          placeholder="Описание..."
                          value={newTask.description}
                          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            minHeight: '60px',
                            resize: 'none',
                            fontSize: '14px'
                          }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <select
                            value={newTask.priority}
                            onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                            style={{
                              padding: '8px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px'
                            }}
                          >
                            <option value="low">🟢 Низкий</option>
                            <option value="medium">🟡 Средний</option>
                            <option value="high">🔴 Высокий</option>
                          </select>
                          <input
                            type="date"
                            value={newTask.deadline}
                            onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                            style={{
                              padding: '8px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px'
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Теги через запятую..."
                          value={newTask.tags}
                          onChange={(e) => setNewTask({...newTask, tags: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '15px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => addTask(column.id)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ Добавить
                          </button>
                          <button
                            onClick={() => setIsAddingTask(null)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            ❌ Отмена
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Задачи */}
                    {(column.tasks || []).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              background: snapshot.isDragging ? '#fff3e0' : 'rgba(255,255,255,0.95)',
                              borderRadius: '15px',
                              padding: '15px',
                              marginBottom: '12px',
                              border: '2px solid',
                              borderColor: snapshot.isDragging ? column.color : 'transparent',
                              boxShadow: snapshot.isDragging 
                                ? '0 20px 40px rgba(0,0,0,0.3)' 
                                : '0 4px 15px rgba(0,0,0,0.1)',
                              cursor: 'grab',
                              transform: snapshot.isDragging ? 'rotate(3deg)' : 'rotate(0deg)',
                              transition: 'all 0.2s ease',
                              color: '#1f2937'
                            }}
                          >
                            {/* Заголовок задачи */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '10px'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '5px'
                                }}>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: getPriorityColor(task.priority)
                                  }}></div>
                                  <h3 style={{
                                    margin: 0,
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                  }}>
                                    {task.title}
                                  </h3>
                                </div>
                                {task.description && (
                                  <p style={{
                                    margin: '0 0 10px 16px',
                                    fontSize: '0.9rem',
                                    color: '#6b7280',
                                    lineHeight: '1.4'
                                  }}>
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                  onClick={() => setEditingTask(task)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    opacity: 0.6
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => deleteTask(column.id, task.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    opacity: 0.6
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Метаинформация */}
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              marginBottom: '10px'
                            }}>
                              {/* Приоритет */}
                              <span style={{
                                background: `${getPriorityColor(task.priority)}20`,
                                color: getPriorityColor(task.priority),
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                border: `1px solid ${getPriorityColor(task.priority)}40`
                              }}>
                                {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} 
                                {task.priority.toUpperCase()}
                              </span>

                              {/* Дедлайн */}
                              {task.deadline && (
                                <span style={{
                                  background: isOverdue(task.deadline) ? '#fee2e2' : '#dbeafe',
                                  color: isOverdue(task.deadline) ? '#dc2626' : '#2563eb',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  border: `1px solid ${isOverdue(task.deadline) ? '#fca5a5' : '#93c5fd'}`
                                }}>
                                  📅 {new Date(task.deadline).toLocaleDateString()}
                                  {isOverdue(task.deadline) && ' ⚠️'}
                                </span>
                              )}
                            </div>

                            {/* Теги */}
                            {task.tags && task.tags.length > 0 && (
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '5px',
                                marginBottom: '8px'
                              }}>
                                {task.tags.map((tag, tagIndex) => (
                                  <span key={tagIndex} style={{
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    fontSize: '0.7rem',
                                    fontWeight: '500'
                                  }}>
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Дата создания */}
                            <div style={{
                              fontSize: '0.7rem',
                              color: '#9ca3af',
                              textAlign: 'right',
                              borderTop: '1px solid #f3f4f6',
                              paddingTop: '8px'
                            }}>
                              🕒 {new Date(task.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}

          {/* Добавить колонку */}
          {isAddingColumn ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '20px',
              minWidth: '320px',
              maxWidth: '320px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ color: 'white', marginBottom: '15px' }}>➕ Новая колонка</h3>
              <input
                type="text"
                placeholder="Название колонки..."
                value={newColumn.title}
                onChange={(e) => setNewColumn({...newColumn, title: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="color"
                  value={newColumn.color}
                  onChange={(e) => setNewColumn({...newColumn, color: e.target.value})}
                  style={{ width: '40px', height: '30px', borderRadius: '5px', border: 'none' }}
                />
                <span style={{ color: 'white', fontSize: '0.9rem' }}>Выберите цвет</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={addColumn}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  ✅ Создать
                </button>
                <button
                  onClick={() => setIsAddingColumn(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                padding: '40px',
                minWidth: '320px',
                maxWidth: '320px',
                minHeight: '400px',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '15px' }}>➕</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Добавить колонку</div>
              <div style={{ fontSize: '0.9rem', marginTop: '5px', opacity: 0.8 }}>
                Создайте новый этап работы
              </div>
            </button>
          )}
        </div>
      </DragDropContext>

      {/* Модальное окно редактирования задачи */}
      {editingTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            color: '#1f2937'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>✏️ Редактировать задачу</h3>
            
            <input
              type="text"
              value={editingTask.title}
              onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '16px'
              }}
            />
            
            <textarea
              value={editingTask.description}
              onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                minHeight: '80px',
                resize: 'vertical',
                fontSize: '14px'
              }}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <select
                value={editingTask.priority}
                onChange={(e) => setEditingTask({...editingTask, priority: e.target.value as any})}
                style={{
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
              >
                <option value="low">🟢 Низкий приоритет</option>
                <option value="medium">🟡 Средний приоритет</option>
                <option value="high">🔴 Высокий приоритет</option>
              </select>
              
              <input
                type="date"
                value={editingTask.deadline || ''}
                onChange={(e) => setEditingTask({...editingTask, deadline: e.target.value})}
                style={{
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <input
              type="text"
              value={editingTask.tags ? editingTask.tags.join(', ') : ''}
              onChange={(e) => setEditingTask({
                ...editingTask, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
              })}
              placeholder="Теги через запятую..."
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '20px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px'
              }}
            />
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => updateTask(editingTask)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ✅ Сохранить
              </button>
              <button
                onClick={() => setEditingTask(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ❌ Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem'
      }}>
        <p>Разработано для портфолио | React + TypeScript + Drag & Drop</p>
        <p style={{ marginTop: '5px', fontSize: '0.8rem' }}>
        </p>
      </div>
    </div>
  );
};

export default App;