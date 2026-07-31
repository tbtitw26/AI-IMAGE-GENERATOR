'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const userName = user?.firstName || user?.email?.split('@')[0] || 'Creator';

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    Promise.all([
      fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/wallet/transactions', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([projectsData, txData]) => {
        setProjects(projectsData.projects || []);
        setTransactions(txData.transactions || []);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const activeProjects = projects.filter((p) => p.status !== 'completed');
  const recentOrders = transactions.filter((tx) => tx.type === 'top_up').length;
  const generationsCount = user?.stats?.generations ?? transactions.filter((tx) => tx.type === 'generation').length;

  const stats = [
    {
      label: 'Active Projects',
      value: activeProjects.length,
      detail: `${projects.length} total`,
    },
    {
      label: 'Wallet Balance',
      value: `$${(user?.balance?.USD ?? 0).toFixed(2)}`,
      detail: 'USD credits available',
    },
    {
      label: 'Top Ups',
      value: recentOrders,
      detail: 'All time',
    },
    {
      label: 'Images Generated',
      value: generationsCount,
      detail: 'All time',
    },
  ];

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <h2>
                Good to see you back, <br />
                <span className={styles.gradientText}>{userName}</span>
              </h2>
              <p>
                Your workspace is ready. Here’s a quick summary of active projects, wallet credits,
                and recent activity so you can continue creating without interruption.
              </p>
              <div className={styles.heroActions}>
                <Link href="/dashboard/generate" className={styles.primaryBtn}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Quick Generate
                </Link>
                <Link href="/dashboard/projects" className={styles.secondaryBtn}>
                  <span className="material-symbols-outlined">folder_special</span>
                  My Projects
                </Link>
              </div>
            </div>

            <div className={styles.heroImage}>
              <div className={styles.heroImageWrapper}>
                <img
                  src="https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg"
                  alt="Active dashboard preview"
                />
                <div className={styles.heroImageOverlay}></div>
                <div className={styles.heroImageFooter}>
                  <span className={styles.modelBadge}>Aether-V5 Model</span>
                  <h3>Project Pulse</h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.statsGrid}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statsCard}>
                <span className={styles.statsLabel}>{stat.label}</span>
                <div className={styles.statsMetric}>{stat.value}</div>
                <div className={styles.statsDetail}>{stat.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.quickActions}>
          <h3>Quick Actions</h3>
          <div className={styles.actionsGrid}>
            <Link href="/dashboard/generate" className={styles.actionCard}>
              <div className={`${styles.actionIcon} ${styles.iconPrimary}`}>
                <span className="material-symbols-outlined">image</span>
              </div>
              <div>
                <h4>New Generation</h4>
                <p>Start a fresh prompt</p>
              </div>
            </Link>

            <Link href="/dashboard/projects" className={styles.actionCard}>
              <div className={`${styles.actionIcon} ${styles.iconSecondary}`}>
                <span className="material-symbols-outlined">folder_special</span>
              </div>
              <div>
                <h4>Continue Projects</h4>
                <p>Open your active workflows</p>
              </div>
            </Link>

            <Link href="/dashboard/orders" className={styles.actionCard}>
              <div className={`${styles.actionIcon} ${styles.iconTertiary}`}>
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <div>
                <h4>Review Billing</h4>
                <p>Check recent orders</p>
              </div>
            </Link>

            <Link href="/dashboard/wallet" className={styles.actionCard}>
              <div className={`${styles.actionIcon} ${styles.iconDefault}`}>
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div>
                <h4>Wallet Balance</h4>
                <p>Top up credits</p>
              </div>
            </Link>
          </div>
        </section>

        <section className={styles.projects}>
          <div className={styles.projectsHeader}>
            <h3>Active Projects</h3>
            <Link href="/dashboard/projects" className={styles.viewAllLink}>
              View All
            </Link>
          </div>

          <div className={styles.projectsGrid}>
            {isLoading ? (
              <p style={{ color: '#94a3b8' }}>Loading...</p>
            ) : activeProjects.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No active projects yet.</p>
            ) : (
              activeProjects.slice(0, 2).map((project) => (
                <div key={project.id} className={styles.projectCard}>
                  <div className={styles.projectContent}>
                    <div className={styles.projectHeader}>
                      <h4>{project.title}</h4>
                    </div>
                    <p className={styles.projectDate}>
                      Updated {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : ''}
                    </p>
                    <p className={styles.projectDescription}>{project.description || 'No description'}</p>
                    <div className={styles.projectProgress}>
                      <div className={styles.progressLabels}>
                        <span>{project.status === 'in-progress' ? 'In Progress' : 'Draft'}</span>
                        <span className={styles.progressValue}>{project.imageCount} images</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            <Link href="/dashboard/projects" className={styles.createProject}>
              <span className="material-symbols-outlined">add_circle</span>
              <span>Create New Project</span>
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}