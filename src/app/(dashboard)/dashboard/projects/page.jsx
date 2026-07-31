'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';

// Імпорт компонентів
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

export default function ProjectsPage() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectMessage, setProjectMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const statusColors = {
    completed: 'primary',
    'in-progress': 'tertiary',
    draft: 'secondary',
  };

  const statusLabels = {
    completed: 'Completed',
    'in-progress': 'In Progress',
    draft: 'Draft',
  };

  const loadProjects = async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load projects.');
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredProjects = projects.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'images') return b.imageCount - a.imageCount;
    return 0;
  });

  const searchedProjects = sortedProjects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create project.');

      setProjects((prev) => [data.project, ...prev]);
      setSelectedProject(data.project);
      setProjectMessage('New project created.');
      setNewTitle('');
      setNewDescription('');
      setShowCreateForm(false);
    } catch (err) {
      alert(err.message || 'Failed to create project.');
    }
  };

  const updateStatus = async (project, status) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, status } : p)));
    try {
      await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: project.id, status }),
      });
    } catch {
      loadProjects();
    }
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`Delete project "${project.title}"?`)) return;
    const prev = projects;
    setProjects((p) => p.filter((item) => item.id !== project.id));
    if (selectedProject?.id === project.id) setSelectedProject(null);
    try {
      const response = await fetch(`/api/projects?id=${project.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Delete failed');
    } catch {
      setProjects(prev);
      alert('Failed to delete project.');
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.projectsPage}>
        {/* SECTION 1: PROJECT LIBRARY HEADER */}
        <section className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerLeft}>
              <h1>My Creative Projects</h1>
              <p>Manage AI image projects, organize assets, revisit prompts and continue creating without losing your workflow.</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.newProjectBtn} onClick={() => setShowCreateForm((v) => !v)}>
                <span className="material-symbols-outlined">add</span>
                New Project
              </button>
            </div>
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateProject}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, marginBottom: 12 }}
            >
              <input
                type="text"
                placeholder="Project title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                style={{ flex: '1 1 200px', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={{ flex: '2 1 260px', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}
              />
              <button type="submit" className={styles.newProjectBtn}>Create</button>
            </form>
          )}

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.filterWrapper}>
                <button className={styles.filterBtn}>
                  <span className="material-symbols-outlined">filter_list</span>
                  Filter
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
                <div className={styles.filterDropdown}>
                  <button onClick={() => setFilter('all')} className={filter === 'all' ? styles.active : ''}>
                    All Projects
                  </button>
                  <button onClick={() => setFilter('completed')} className={filter === 'completed' ? styles.active : ''}>
                    Completed
                  </button>
                  <button onClick={() => setFilter('in-progress')} className={filter === 'in-progress' ? styles.active : ''}>
                    In Progress
                  </button>
                  <button onClick={() => setFilter('draft')} className={filter === 'draft' ? styles.active : ''}>
                    Draft
                  </button>
                </div>
              </div>
              <div className={styles.divider}></div>
              <div className={styles.sortWrapper}>
                <button className={styles.sortBtn}>
                  <span className="material-symbols-outlined">sort</span>
                  Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'oldest' ? 'Oldest' : 'Most Images'}
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
                <div className={styles.sortDropdown}>
                  <button onClick={() => setSortBy('recent')} className={sortBy === 'recent' ? styles.active : ''}>
                    Most Recent
                  </button>
                  <button onClick={() => setSortBy('oldest')} className={sortBy === 'oldest' ? styles.active : ''}>
                    Oldest First
                  </button>
                  <button onClick={() => setSortBy('images')} className={sortBy === 'images' ? styles.active : ''}>
                    Most Images
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.toolbarRight}>
              <div className={styles.mobileSearch}>
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className={styles.viewSwitcher}>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <span className="material-symbols-outlined">grid_view</span>
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <span className="material-symbols-outlined">view_list</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        {projectMessage && (
          <div style={{ color: '#b2c5ff', marginBottom: '12px', fontSize: '14px' }}>{projectMessage}</div>
        )}

        {selectedProject && (
          <div style={{ background: 'rgba(22, 22, 30, 0.8)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(178, 197, 255, 0.2)' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8b97bf', marginBottom: '8px' }}>Active project</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', color: '#f3f4f6' }}>{selectedProject.title}</h3>
                <p style={{ margin: 0, color: '#c3c6d6' }}>{selectedProject.description}</p>
              </div>
              <div style={{ color: '#b2c5ff', fontSize: '14px' }}>{selectedProject.imageCount} images</div>
            </div>
          </div>
        )}

        {/* SECTION 2: PROJECTS GRID */}
        <section className={styles.projectsGrid}>
          {isLoading ? (
            <p style={{ color: '#94a3b8' }}>Loading projects...</p>
          ) : searchedProjects.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined">folder_open</span>
              <h3>No projects found</h3>
              <p>Create your first project to start organizing your generations.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? styles.gridView : styles.listView}>
              {searchedProjects.map((project) => (
                <div key={project.id} className={styles.projectCard}>
                  <div
                    className={styles.projectImage}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #312e81)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(255,255,255,0.4)' }}>folder_open</span>
                    <div className={styles.projectStatus}>
                      <span className={`${styles.statusBadge} ${styles[`status${statusColors[project.status].charAt(0).toUpperCase() + statusColors[project.status].slice(1)}`]}`}>
                        {statusLabels[project.status]}
                      </span>
                    </div>
                  </div>
                  <div className={styles.projectContent}>
                    <h3>{project.title}</h3>
                    <p>{project.description || 'No description'}</p>
                    <div className={styles.projectMeta}>
                      <span className={styles.projectDate}>
                        <span className="material-symbols-outlined">schedule</span>
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : ''}
                      </span>
                      <span className={styles.projectImages}>
                        <span className="material-symbols-outlined">image</span>
                        {project.imageCount} images
                      </span>
                    </div>
                    <div className={styles.projectActions}>
                      <Link href={`/dashboard/gallery?projectId=${project.id}`} className={styles.openBtn}>
                        View Images
                      </Link>
                      <button className={styles.openBtn} onClick={() => setSelectedProject(project)} style={{ background: 'transparent' }}>
                        Details
                      </button>
                      <select
                        value={project.status}
                        onChange={(e) => updateStatus(project, e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 8px' }}
                      >
                        <option value="draft">Draft</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button className={styles.moreBtn} onClick={() => deleteProject(project)} title="Delete">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
