import { DashboardLayout } from '@/components/DashboardLayout';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getEffectiveDeviceSettings } from '@/features/ocpp/effectiveConfig';
import {
  groupChargePointsByOrganization,
  LOCAL_GROUP,
} from '@/features/ocpp/selectors';
import type { RootState } from '@/store/store';
import { Battery, Clock, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { items, order } = useSelector((s: RootState) => s.ocpp);
  const [orgFilter, setOrgFilter] = useState<string>('all');

  const allGroups = useMemo(
    () => groupChargePointsByOrganization(items, order),
    [items, order]
  );
  // A filter pointing at a group that no longer exists falls back to "all".
  const activeFilter = allGroups.some((g) => g.key === orgFilter)
    ? orgFilter
    : 'all';
  const groups = useMemo(
    () =>
      activeFilter === 'all'
        ? allGroups
        : allGroups.filter((g) => g.key === activeFilter),
    [allGroups, activeFilter]
  );

  return (
    <>
      <SEO
        title="Dashboard"
        description="Manage and monitor your OCPP charge point connections. Create new charge points, view connection status, and access all your EV charging station simulations."
        keywords="OCPP dashboard, charge point management, EV charging dashboard, OCPP connections"
      />
      <DashboardLayout>
        <div className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Connections use the name you set when creating them; device profile
              (model, power, etc.) comes from Advanced Config and is shown below.
            </p>
          </div>

          {order.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No connections yet</CardTitle>
                <CardDescription>
                  Use <strong>New Connection</strong> in the sidebar to add a
                  charge point, then open <strong>Advanced Config</strong> on its
                  page to edit the simulated hardware profile.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              {allGroups.length > 1 && (
                <Select value={activeFilter} onValueChange={setOrgFilter}>
                  <SelectTrigger className="w-full sm:w-64" aria-label="Filter by organization">
                    <SelectValue placeholder="All organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All organizations</SelectItem>
                    {allGroups.map((g) => (
                      <SelectItem key={g.key} value={g.key}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {groups.map((group) => (
                <section key={group.key} className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {group.name}
                    {group.key !== LOCAL_GROUP && ' (backend)'}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
              {group.ids.map((id) => {
                const cp = items[id];
                if (!cp) return null;
                const device = getEffectiveDeviceSettings(cp, id);
                const status = cp.status;
                return (
                  <Card key={id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">
                            {cp.label}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            <span className="font-medium text-foreground">
                              {device.deviceName}
                            </span>
                            {' · '}
                            {device.model} · {device.acdc} · {device.maxPowerKw}{' '}
                            kW
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 gap-1 capitalize"
                        >
                          {status === 'connected' ? (
                            <Zap className="h-3.5 w-3.5 text-green-500" />
                          ) : status === 'connecting' ? (
                            <Clock className="h-3.5 w-3.5 text-yellow-500" />
                          ) : (
                            <Battery className="h-3.5 w-3.5 text-slate-400" />
                          )}
                          {status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2 pt-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/cp/${id}`)}
                      >
                        Open
                      </Button>
                      {cp.backend && (
                        <Badge variant="secondary">{cp.backend.zoneName}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground self-center truncate max-w-full">
                        CP ID: {cp.config.cpId}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
