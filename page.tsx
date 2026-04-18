'use client'

import { useEffect, useState } from 'react'
import { supabase, type Role, type Person, type Task } from '@/lib/supabase'

// 类定义
class RoleClass {
  id: string
  name: string
  color: string
  constructor(data: Partial<Role>) {
    this.id = data.id || Date.now().toString()
    this.name = data.name || ''
    this.color = data.color || this.generateColor()
  }
  generateColor() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7']
    return colors[Math.floor(Math.random() * colors.length)]
  }
}

class PersonClass {
  id: string
  name: string
  role_id: string
  color: string
  department?: string
  constructor(data: Partial<Person>) {
    this.id = data.id || Date.now().toString()
    this.name = data.name || ''
    this.role_id = data.role_id || ''
    this.color = data.color || this.generateColor()
    this.department = data.department
  }
  generateColor() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7']
    return colors[Math.floor(Math.random() * colors.length)]
  }
  getInitials() {
    return this.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
  }
}

class TaskClass {
  id: string
  title: string
  description: string
  person_ids: string[]
  week: string
  progress: number
  status: 'pending' | 'inProgress' | 'blocked' | 'completed'
  start_date: string
  due_date: string
  blockers: string[]
  notes: string
  updated_at: string
  constructor(data: Partial<Task>) {
    this.id = data.id || Date.now().toString()
    this.title = data.title || ''
    this.description = data.description || ''
    this.person_ids = data.person_ids || []
    this.week = data.week || '1'
    this.progress = data.progress || 0
    this.status = data.status || 'pending'
    this.start_date = data.start_date || ''
    this.due_date = data.due_date || ''
    this.blockers = data.blockers || []
    this.notes = data.notes || ''
    this.updated_at = new Date().toISOString()
  }
}

// 状态文本映射
const statusTexts: Record<string, string> = {
  pending: '待处理',
  inProgress: '进行中',
  blocked: '已阻塞',
  completed: '已完成'
}

export default function TaskApp() {
  const [roles, setRoles] = useState<Role[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  
  // 模态框状态
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [personModalOpen, setPersonModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  
  // 筛选状态
  const [filterPerson, setFilterPerson] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    week: '1',
    progress: 0,
    status: 'inProgress',
    start_date: '',
    due_date: '',
    blockers: '',
    notes: '',
    person_name: '',
    person_role: '',
    person_department: ''
  })
  
  const [newRoleName, setNewRoleName] = useState('')

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [rolesRes, peopleRes, tasksRes] = await Promise.all([
        supabase.from('roles').select('*').order('created_at', { ascending: true }),
        supabase.from('people').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: true })
      ])

      if (rolesRes.data) setRoles(rolesRes.data)
      if (peopleRes.data) setPeople(peopleRes.data)
      if (tasksRes.data) setTasks(tasksRes.data)
    } catch (e) {
      console.error('加载数据失败:', e)
    } finally {
      setLoading(false)
    }
  }

  async function saveData() {
    setSaving(true)
    try {
      // 批量更新（简化处理：先清空再插入，实际生产应该用 upsert）
      await supabase.from('roles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('people').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      if (roles.length > 0) await supabase.from('roles').insert(roles)
      if (people.length > 0) await supabase.from('people').insert(people)
      if (tasks.length > 0) await supabase.from('tasks').insert(tasks)

      setLastSaveTime(new Date())
    } catch (e) {
      console.error('保存失败:', e)
    } finally {
      setSaving(false)
    }
  }

  // 角色管理
  function addRole() {
    if (!newRoleName.trim()) {
      alert('请输入角色名称')
      return
    }
    if (roles.some(r => r.name === newRoleName.trim())) {
      alert('角色已存在')
      return
    }
    setRoles([...roles, new RoleClass({ name: newRoleName.trim() })])
    setNewRoleName('')
    saveData()
  }

  function deleteRole(id: string) {
    const role = roles.find(r => r.id === id)
    const users = people.filter(p => p.role_id === id)
    if (users.length > 0) {
      if (!confirm(`角色"${role?.name}"有${users.length}个人员使用，删除将同时删除这些人员，确定吗？`)) return
      setPeople(people.filter(p => p.role_id !== id))
    }
    setRoles(roles.filter(r => r.id !== id))
    saveData()
  }

  function editRole(id: string) {
    const role = roles.find(r => r.id === id)
    const newName = prompt('新角色名称：', role?.name)
    if (newName && newName.trim() && role) {
      setRoles(roles.map(r => r.id === id ? { ...r, name: newName.trim() } : r))
      saveData()
    }
  }

  // 人员管理
  function openPersonModal() {
    setPersonModalOpen(true)
  }

  function closePersonModal() {
    setPersonModalOpen(false)
    setFormData({ ...formData, person_name: '', person_role: '', person_department: '' })
  }

  function savePerson() {
    const { person_name, person_role, person_department } = formData
    if (!person_name.trim() || !person_role) {
      alert('请填写姓名和选择角色')
      return
    }
    setPeople([...people, new PersonClass({ name: person_name.trim(), role_id: person_role, department: person_department })])
    closePersonModal()
    saveData()
  }

  // 任务管理
  function openTaskModal(taskId: string | null = null) {
    setEditingTaskId(taskId)
    setSelectedPeople([])
    
    if (taskId) {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        setSelectedPeople(task.person_ids || [])
        setFormData({
          title: task.title,
          description: task.description,
          week: task.week,
          progress: task.progress,
          status: task.status,
          start_date: task.start_date,
          due_date: task.due_date,
          blockers: task.blockers.join('\n'),
          notes: task.notes,
          person_name: '',
          person_role: '',
          person_department: ''
        })
      }
    } else {
      setFormData({
        title: '',
        description: '',
        week: '1',
        progress: 0,
        status: 'inProgress',
        start_date: '',
        due_date: '',
        blockers: '',
        notes: '',
        person_name: '',
        person_role: '',
        person_department: ''
      })
    }
    setTaskModalOpen(true)
  }

  function closeTaskModal() {
    setTaskModalOpen(false)
    setEditingTaskId(null)
    setSelectedPeople([])
  }

  function togglePersonSelection(personId: string) {
    if (selectedPeople.includes(personId)) {
      setSelectedPeople(selectedPeople.filter(id => id !== personId))
    } else {
      setSelectedPeople([...selectedPeople, personId])
    }
  }

  function saveTask() {
    const { title, week, status, description, progress, start_date, due_date, blockers, notes } = formData
    
    if (!title.trim() || !week || !status) {
      alert('请填写所有必填字段')
      return
    }
    
    if (selectedPeople.length === 0) {
      alert('请至少选择一位负责人')
      return
    }

    const taskData = {
      title: title.trim(),
      description,
      person_ids: selectedPeople,
      week,
      progress,
      status,
      start_date,
      due_date,
      blockers: blockers.split('\n').filter(b => b.trim()),
      notes,
      updated_at: new Date().toISOString()
    }

    if (editingTaskId) {
      setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, ...taskData } : t))
    } else {
      setTasks([...tasks, new TaskClass(taskData)])
    }

    saveData()
    closeTaskModal()
  }

  function deleteTask(id: string) {
    if (confirm('确定删除此任务？')) {
      setTasks(tasks.filter(t => t.id !== id))
      saveData()
    }
  }

  function updateTaskProgress(id: string, val: number) {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const newProgress = Math.max(0, Math.min(100, val))
        return { 
          ...t, 
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : t.status,
          updated_at: new Date().toISOString()
        }
      }
      return t
    }))
    saveData()
  }

  // 统计数据
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'inProgress').length
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // 筛选后的任务
  const filteredTasks = tasks.filter(task => {
    if (filterPerson !== 'all' && !task.person_ids.includes(filterPerson)) return false
    if (filterRole !== 'all') {
      const rolePeopleIds = people.filter(p => p.role_id === filterRole).map(p => p.id)
      if (!task.person_ids.some(pid => rolePeopleIds.includes(pid))) return false
    }
    if (filterStatus !== 'all' && task.status !== filterStatus) return false
    return true
  })

  // 渲染
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#667eea' }}></i>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.logo}>
            <i className="fas fa-project-diagram" style={{ fontSize: '32px' }}></i>
            <h1 style={{ fontSize: '28px', fontWeight: 600 }}>项目任务管理系统 - 多人负责版</h1>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.btnPrimary} onClick={() => openTaskModal()}>
              <i className="fas fa-plus"></i> 添加任务
            </button>
            <button style={styles.btnSuccess} onClick={saveData}>
              <i className="fas fa-save"></i> 保存
            </button>
          </div>
        </div>
        
        <div style={styles.headerStats}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{totalTasks}</div>
            <div style={styles.statLabel}>总任务</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{inProgressTasks}</div>
            <div style={styles.statLabel}>进行中</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{blockedTasks}</div>
            <div style={styles.statLabel}>有卡点</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{completionRate}%</div>
            <div style={styles.statLabel}>完成率</div>
          </div>
        </div>
        
        <div style={{ ...styles.dataStatus, ...(saving ? {} : styles.dataStatusSaved) }}>
          <i className={saving ? "fas fa-spinner fa-spin" : "fas fa-check-circle"}></i>
          <span>{saving ? '保存中...' : '数据已保存到云端'}</span>
          {lastSaveTime && <span style={{ marginLeft: '10px', opacity: 0.8 }}>最后保存：{lastSaveTime.toLocaleString('zh-CN')}</span>}
        </div>
      </div>

      <div style={styles.mainLayout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <h3 style={styles.sectionTitle}>
              <i className="fas fa-user-tag"></i> 角色管理
            </h3>
            <div style={styles.roleControls}>
              <input 
                type="text" 
                style={styles.roleInput} 
                placeholder="输入新角色名称"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRole()}
              />
              <button style={styles.btnPrimarySm} onClick={addRole}>
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div style={styles.roleListContainer}>
              {roles.map(role => {
                const count = people.filter(p => p.role_id === role.id).length
                return (
                  <div key={role.id} style={styles.roleItem}>
                    <div style={styles.roleName}>{role.name}</div>
                    <div style={styles.roleCount}>{count}</div>
                    <div style={styles.roleActions}>
                      <button style={styles.roleEditBtn} onClick={() => editRole(role.id)}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button style={styles.roleDeleteBtn} onClick={() => deleteRole(role.id)}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <h3 style={styles.sectionTitle}>
              <i className="fas fa-users"></i> 负责人员
            </h3>
            <ul style={styles.personList}>
              {people.map(person => {
                const role = roles.find(r => r.id === person.role_id)
                const taskCount = tasks.filter(t => t.person_ids.includes(person.id)).length
                return (
                  <li key={person.id} style={styles.personItem} onClick={() => setFilterPerson(person.id)}>
                    <div style={{ ...styles.personAvatar, background: person.color }}>{person.getInitials()}</div>
                    <div style={styles.personInfo}>
                      <div style={styles.personName}>{person.name}</div>
                      <div style={styles.personRole}>{role?.name || '未分配'}</div>
                    </div>
                    <div style={styles.personTaskCount}>{taskCount}</div>
                  </li>
                )
              })}
            </ul>
            <button style={{ ...styles.btnSecondary, width: '100%', marginTop: '10px' }} onClick={openPersonModal}>
              <i className="fas fa-user-plus"></i> 添加人员
            </button>
          </div>

          <div style={styles.sidebarSection}>
            <h3 style={styles.sectionTitle}>
              <i className="fas fa-filter"></i> 筛选
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select style={styles.formControl} value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}>
                <option value="all">所有人员</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select style={styles.formControl} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">所有角色</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select style={styles.formControl} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">所有状态</option>
                <option value="pending">待处理</option>
                <option value="inProgress">进行中</option>
                <option value="blocked">已阻塞</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>
        </aside>

        <main style={styles.content}>
          <div style={styles.contentHeader}>
            <h2 style={styles.contentTitle}>
              <i className="fas fa-tasks"></i> 任务列表
            </h2>
          </div>

          <div style={styles.taskTableContainer}>
            <table style={styles.taskTable}>
              <thead>
                <tr>
                  <th>任务标题</th>
                  <th>负责人</th>
                  <th>角色</th>
                  <th>周次</th>
                  <th>进度</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div style={styles.emptyState}>
                        <i className="fas fa-tasks"></i>
                        <p>没有任务</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const persons = task.person_ids.map(pid => people.find(p => p.id === pid)).filter((p): p is Person => !!p)
                    const taskRoles = persons.map(p => roles.find(r => r.id === p.role_id)).filter((r): r is Role => !!r)
                    
                    let personsDisplay = '未分配'
                    if (persons.length === 1) {
                      personsDisplay = <><span style={{ color: persons[0].color }}>●</span> {persons[0].name}</>
                    } else if (persons.length > 1) {
                      personsDisplay = (
                        <span title={persons.map(p => p.name).join(', ')}>
                          {persons.map(p => <span key={p.id} style={{ color: p.color }} title={p.name}>●</span>)} ({persons.length}人)
                        </span>
                      )
                    }

                    let rolesDisplay = '-'
                    if (taskRoles.length === 1) {
                      rolesDisplay = <span style={{ color: taskRoles[0].color }}>{taskRoles[0].name}</span>
                    } else if (taskRoles.length > 1) {
                      rolesDisplay = (
                        <span title={taskRoles.map(r => r.name).join(', ')}>
                          {taskRoles.map(r => <span key={r.id} style={{ color: r.color }} title={r.name}>{r.name.substring(0, 2)}</span>)} ({taskRoles.length}种)
                        </span>
                      )
                    }

                    return (
                      <tr key={task.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{task.title}</div>
                          <div style={{ fontSize: '13px', color: '#666' }}>{task.description || ''}</div>
                        </td>
                        <td>{personsDisplay}</td>
                        <td>{rolesDisplay}</td>
                        <td>第{task.week}周</td>
                        <td style={{ minWidth: '150px' }}>
                          <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${task.progress}%` }}></div>
                          </div>
                          <div style={{ fontSize: '12px' }}>{task.progress}%</div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="5" 
                            value={task.progress}
                            style={{ width: '100%' }}
                            onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                          />
                        </td>
                        <td>
                          <span style={{ ...styles.statusTag, ...(styles as any)[`status${task.status}`] }}>
                            {statusTexts[task.status]}
                          </span>
                        </td>
                        <td>
                          <button style={styles.btnPrimarySm} onClick={() => openTaskModal(task.id)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button style={styles.btnSecondarySm} onClick={() => updateTaskProgress(task.id, 100)}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button style={styles.btnDangerSm} onClick={() => deleteTask(task.id)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* 任务模态框 */}
      {taskModalOpen && (
        <div style={styles.modal} onClick={closeTaskModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closeTaskModal}>&times;</button>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingTaskId ? '编辑任务' : '添加新任务'}</h3>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>任务标题 *</label>
              <input 
                type="text" 
                style={styles.formControl} 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入任务标题"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>任务描述</label>
              <textarea 
                style={{ ...styles.formControl, minHeight: '80px' }} 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="任务详细描述..."
              />
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>负责人 (可多选) *</label>
                <div style={{ ...styles.selectedPersons, minHeight: '40px', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '10px', background: 'white' }}>
                  {selectedPeople.length === 0 ? (
                    <div style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '10px' }}>点击下方人员选项进行多选</div>
                  ) : (
                    selectedPeople.map(personId => {
                      const person = people.find(p => p.id === personId)
                      if (!person) return null
                      const role = roles.find(r => r.id === person.role_id)
                      return (
                        <div key={personId} style={styles.selectedPerson}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: person.color }}></div>
                            <span>{person.name}</span>
                            {role && <span style={{ opacity: 0.8 }}>({role.name})</span>}
                            <button style={styles.removeBtn} onClick={() => togglePersonSelection(personId)}>
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div style={styles.personSelector}>
                  {people.map(person => {
                    const role = roles.find(r => r.id === person.role_id)
                    const isSelected = selectedPeople.includes(person.id)
                    return (
                      <div 
                        key={person.id} 
                        style={{ ...styles.personOption, ...(isSelected ? styles.personOptionSelected : {}) }}
                        onClick={() => togglePersonSelection(person.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ ...styles.personAvatarSm, background: person.color }}>{person.getInitials()}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{person.name}</div>
                            <div style={{ fontSize: '12px', color: isSelected ? 'rgba(255,255,255,0.8)' : '#666' }}>
                              {role?.name || '未分配'}
                            </div>
                          </div>
                        </div>
                        {isSelected && <i className="fas fa-check"></i>}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>计划周次 *</label>
                <select 
                  style={styles.formControl} 
                  value={formData.week}
                  onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                >
                  <option value="1">第 1 周</option>
                  <option value="2">第 2 周</option>
                  <option value="3">第 3 周</option>
                  <option value="4">第 4 周</option>
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>开始日期</label>
                <input 
                  type="date" 
                  style={styles.formControl} 
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>截止日期</label>
                <input 
                  type="date" 
                  style={styles.formControl} 
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>状态 *</label>
              <select 
                style={styles.formControl} 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="pending">待处理</option>
                <option value="inProgress">进行中</option>
                <option value="blocked">已阻塞</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>进度 ({formData.progress}%)</label>
              <input 
                type="range" 
                style={styles.formControl} 
                min="0" 
                max="100" 
                step="5" 
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>卡点/问题</label>
              <textarea 
                style={{ ...styles.formControl, minHeight: '60px' }} 
                value={formData.blockers}
                onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                placeholder="每行一个卡点..."
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>完成情况说明</label>
              <textarea 
                style={{ ...styles.formControl, minHeight: '60px' }} 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="完成情况、成果、备注..."
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px' }}>
              <button style={styles.btnSecondary} onClick={closeTaskModal}>取消</button>
              <button style={styles.btnPrimary} onClick={saveTask}>保存任务</button>
            </div>
          </div>
        </div>
      )}

      {/* 人员模态框 */}
      {personModalOpen && (
        <div style={styles.modal} onClick={closePersonModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closePersonModal}>&times;</button>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>添加新人员</h3>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>姓名 *</label>
              <input 
                type="text" 
                style={styles.formControl} 
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>角色 *</label>
              <select 
                style={styles.formControl} 
                value={formData.person_role}
                onChange={(e) => setFormData({ ...formData, person_role: e.target.value })}
              >
                <option value="">选择角色</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>部门</label>
              <input 
                type="text" 
                style={styles.formControl} 
                value={formData.person_department}
                onChange={(e) => setFormData({ ...formData, person_department: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px' }}>
              <button style={styles.btnSecondary} onClick={closePersonModal}>取消</button>
              <button style={styles.btnPrimary} onClick={savePerson}>添加人员</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 样式对象
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Segoe UI', 'Microsoft YaHei', sans-serif",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    color: '#333',
    lineHeight: 1.6,
    minHeight: '100vh',
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: 'white',
    padding: '25px 30px',
    borderRadius: '12px 12px 0 0',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    maxWidth: '1400px',
    margin: '0 auto 20px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    gap: '15px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  headerStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
    marginTop: '15px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '13px',
    opacity: 0.9,
  },
  dataStatus: {
    background: 'rgba(255, 255, 255, 0.2)',
    padding: '10px 15px',
    borderRadius: '6px',
    fontSize: '13px',
    marginTop: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dataStatusSaved: {
    background: 'rgba(46, 204, 113, 0.3)',
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '20px',
    marginBottom: '20px',
    maxWidth: '1400px',
    margin: '0 auto 20px',
    padding: '0 20px',
  },
  sidebar: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  },
  sidebarSection: {
    marginBottom: '25px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2c3e50',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '8px',
    borderBottom: '2px solid #f0f0f0',
  },
  roleControls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },
  roleInput: {
    flex: 1,
    padding: '10px 12px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  roleListContainer: {
    maxHeight: '200px',
    overflowY: 'auto' as const,
    border: '1px solid #eee',
    borderRadius: '6px',
    padding: '10px',
    background: '#f8f9fa',
  },
  roleItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    marginBottom: '6px',
    background: 'white',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  roleName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#2c3e50',
    flex: 1,
  },
  roleCount: {
    fontSize: '12px',
    color: '#666',
    background: '#e9ecef',
    padding: '2px 8px',
    borderRadius: '10px',
    marginRight: '10px',
  },
  roleActions: {
    display: 'flex',
    gap: '5px',
  },
  roleEditBtn: {
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    background: '#e3f2fd',
    color: '#1976d2',
  },
  roleDeleteBtn: {
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    background: '#ffebee',
    color: '#e53935',
  },
  personList: {
    listStyle: 'none',
    padding: 0,
  },
  personItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '8px',
    background: '#f8f9fa',
    cursor: 'pointer',
  },
  personAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 600,
    flexShrink: 0,
  },
  personAvatarSm: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 600,
    flexShrink: 0,
    fontSize: '12px',
  },
  personInfo: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    fontWeight: 500,
    fontSize: '14px',
  },
  personRole: {
    fontSize: '12px',
    color: '#666',
  },
  personTaskCount: {
    background: '#667eea',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 500,
    flexShrink: 0,
  },
  content: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
  },
  contentTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#2c3e50',
  },
  btnPrimary: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: 'white',
  },
  btnPrimarySm: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: 'white',
    marginRight: '5px',
  },
  btnSecondary: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    background: '#3498db',
    color: 'white',
  },
  btnSecondarySm: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    background: '#3498db',
    color: 'white',
    marginRight: '5px',
  },
  btnSuccess: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    background: '#2ecc71',
    color: 'white',
  },
  btnDangerSm: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    background: '#e74c3c',
    color: 'white',
  },
  taskTableContainer: {
    overflowX: 'auto' as const,
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  taskTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    minWidth: '1100px',
  },
  formControl: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 500,
    color: '#555',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  modal: {
    display: 'flex',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
    position: 'relative' as const,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#2c3e50',
  },
  closeBtn: {
    position: 'absolute' as const,
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#666',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  selectedPersons: {
    minHeight: '40px',
  },
  selectedPerson: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: 'white',
    padding: '8px 12px',
    borderRadius: '20px',
    margin: '5px',
    fontSize: '13px',
  },
  removeBtn: {
    background: 'rgba(255, 255, 255, 0.3)',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
  },
  personSelector: {
    minHeight: '100px',
    maxHeight: '200px',
    overflowY: 'auto' as const,
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '10px',
    background: 'white',
  },
  personOption: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    marginBottom: '5px',
    borderRadius: '4px',
    background: '#f8f9fa',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
  },
  personOptionSelected: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: 'white',
    borderColor: '#667eea',
  },
  progressBar: {
    height: '8px',
    background: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '5px',
  },
  progressFill: {
    height: '100%',
    background: "linear-gradient(90deg, #2ecc71, #27ae60)",
  },
  statusTag: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: 500,
  },
  statuspending: { background: '#fff3e0', color: '#f57c00' },
  statusinProgress: { background: '#e3f2fd', color: '#1976d2' },
  statusblocked: { background: '#ffebee', color: '#d32f2f' },
  statuscompleted: { background: '#e8f5e9', color: '#388e3c' },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#95a5a6',
  },
}
