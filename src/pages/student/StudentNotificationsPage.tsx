import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../context/NotificationContext';

export const StudentNotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications & Alerts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status changes, department inquiries, and resolution updates
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            icon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-8 h-8 text-slate-400" />}
              title="No Notifications"
              description="You are fully caught up! New updates on your submitted tickets will appear here."
            />
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !notif.isRead ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      !notif.isRead ? 'bg-indigo-600' : 'bg-transparent'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{notif.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                    <time className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(notif.createdAt).toLocaleString()}
                    </time>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {notif.complaintId && (
                    <Link to={`/student/complaints/${notif.complaintId}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notif.id)}
                        className="text-[11px]"
                      >
                        View Ticket →
                      </Button>
                    </Link>
                  )}
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="text-xs text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
