import React, { useEffect, useMemo, useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { getAdminUsers, updateUser } from '../services/mockBackend';
import { useApp } from '../utils/i18n';
import { useToast } from '../components/UI';
import { DatePicker, Input, Select, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const AdminDashboard: React.FC = () => {
    const { t } = useApp();
    const { addToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            setUsers(await getAdminUsers());
        } catch {
            addToast(t('fetch_fail'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return users;
        return users.filter(user => [user.email, user.nickname, user.country, user.city].filter(Boolean).some(value => value!.toLowerCase().includes(query)));
    }, [search, users]);

    const saveUser = async (user: User, updates: { role?: UserRole; status?: UserStatus; expirationDate?: string | null }) => {
        try {
            await updateUser(user.id, updates);
            addToast(t('user_updated'), 'success');
            await fetchUsers();
        } catch {
            addToast(t('user_update_fail'), 'error');
        }
    };

    const columns: ColumnsType<User> = [
        {
            title: t('user_col'),
            key: 'user',
            render: (_, user) => (
                <div className="flex flex-col gap-1">
                    <span className="font-bold">{user.nickname || t('unknown_member')}</span>
                    <span className="text-xs text-zinc-500">{user.email}</span>
                    {(user.city || user.country) && <span className="text-[10px] text-zinc-400">{[user.city, user.country].filter(Boolean).join(', ')}</span>}
                </div>
            )
        },
        {
            title: t('role'),
            key: 'role',
            render: (_, user) => (
                <Select<UserRole>
                    value={user.role}
                    size="small"
                    options={[{ value: UserRole.USER, label: t('USER') }, { value: UserRole.ADMIN, label: t('ADMIN') }]}
                    onChange={role => saveUser(user, { role })}
                    style={{ minWidth: 110 }}
                />
            )
        },
        {
            title: t('status'),
            key: 'status',
            render: (_, user) => (
                <Select<UserStatus>
                    value={user.status}
                    size="small"
                    options={Object.values(UserStatus).map(status => ({ value: status, label: t(status) }))}
                    onChange={status => saveUser(user, { status })}
                    style={{ minWidth: 130 }}
                />
            )
        },
        {
            title: t('expiration_date'),
            key: 'expirationDate',
            render: (_, user) => (
                <DatePicker
                    size="small"
                    value={user.expirationDate ? dayjs(user.expirationDate) : null}
                    onChange={date => saveUser(user, { expirationDate: date ? date.toISOString() : null })}
                />
            )
        },
        {
            title: t('last_login'),
            key: 'lastLogin',
            render: (_, user) => user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'
        },
        {
            title: t('identity_tags'),
            key: 'tags',
            render: (_, user) => <div className="flex flex-wrap gap-1">{user.jobTags.map(tag => <Tag key={tag}>{tag}</Tag>)}</div>
        }
    ];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-nothing-black p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <header>
                    <p className="text-[10px] font-mono tracking-[0.3em] text-zinc-400 uppercase">{t('administration')}</p>
                    <h1 className="text-3xl font-bold text-black dark:text-white mt-2">{t('manage_journal')}</h1>
                    <p className="text-sm text-zinc-500 mt-2">{t('control_center')}</p>
                </header>

                <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 md:p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-black dark:text-white">{t('member_database')}</h2>
                            <p className="text-xs text-zinc-500 mt-1">{filteredUsers.length} {t('records')}</p>
                        </div>
                        <Input.Search value={search} onChange={event => setSearch(event.target.value)} placeholder={t('filter_email')} allowClear style={{ maxWidth: 320 }} />
                    </div>
                    <Table<User> rowKey="id" loading={loading} columns={columns} dataSource={filteredUsers} scroll={{ x: 900 }} pagination={{ pageSize: 20 }} />
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard;
