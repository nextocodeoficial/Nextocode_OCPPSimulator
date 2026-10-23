import { LogoMark } from '@/components/brand/Logo';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChargePointSheet } from '@/components/ocpp/ChargePointSheet';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getEffectiveDeviceSettings } from '@/features/ocpp/effectiveConfig';
import type { ConnectionStatus } from '@/features/ocpp/ocppSlice';
import { cn } from '@/lib/utils';
import type { RootState } from '@/store/store';
import { ArrowRight, Cable, PlugZap, Plus, Server, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const statusBadge: Record<ConnectionStatus, string> = {
  connected: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  connecting: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  disconnected: 'text-muted-foreground',
};

const statusDot: Record<ConnectionStatus, string> = {
  connected: 'bg-emerald-500',
  connecting: 'bg-amber-400 animate-pulse',
  disconnected: 'bg-muted-foreground/40',
};

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, order } = useSelector((s: RootState) => s.ocpp);
  const [sheetOpen, setSheetOpen] = useState(false);

  const stats = useMemo(() => {
    const counts: Record<ConnectionStatus, number> = { connected: 0, connecting: 0, disconnected: 0 };
    for (const id of order) {
      const cp = items[id];
      if (cp) counts[cp.status] += 1;
    }
    return counts;
  }, [items, order]);

  return (
    <>
      <SEO
        title="Dashboard"
        description="Create simulated OCPP charge points, connect them to your CSMS and drive charging sessions from the browser."
        keywords="OCPP dashboard, charge point simulator, EV charging, CSMS testing"
      />
      <DashboardLayout>
        <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-[#00f0ba]/10 via-background to-[#16009b]/10 p-5 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t('dashboard.title')}</h1>
              <p className="text-sm text-muted-foreground md:text-base">{t('dashboard.subtitle')}</p>
            </div>
            <Button size="lg" onClick={() => setSheetOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4" />
              {t('nav.newChargePoint')}
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Server} label={t('dashboard.stats.total')} value={order.length} />
          <StatCard icon={Zap} label={t('dashboard.stats.connected')} value={stats.connected} tone="text-emerald-500" />
          <StatCard icon={Cable} label={t('dashboard.stats.connecting')} value={stats.connecting} tone="text-amber-500" />
          <StatCard icon={PlugZap} label={t('dashboard.stats.disconnected')} value={stats.disconnected} />
        </div>

        {order.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="items-center text-center">
              <LogoMark className="mb-2 size-12" />
              <CardTitle>{t('dashboard.emptyTitle')}</CardTitle>
              <CardDescription className="max-w-lg">{t('dashboard.emptyDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <ol className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                {(['one', 'two', 'three'] as const).map((step, i) => (
                  <li key={step} className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00f0ba] to-[#16009b] text-xs font-semibold text-white">
                      {i + 1}
                    </span>
                    {t(`dashboard.steps.${step}`)}
                  </li>
                ))}
              </ol>
              <Button onClick={() => setSheetOpen(true)}>
                <Plus className="h-4 w-4" />
                {t('dashboard.createFirst')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {order.map((id) => {
              const cp = items[id];
              if (!cp) return null;
              const device = getEffectiveDeviceSettings(cp, id);
              return (
                <Card
                  key={id}
                  className="group cursor-pointer gap-3 transition-shadow hover:shadow-md"
                  onClick={() => navigate(`/cp/${id}`)}
                >
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{cp.label}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          <span className="font-medium text-foreground">{device.deviceName}</span>
                          {' · '}
                          {device.model} · {device.acdc} · {device.maxPowerKw} kW
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={cn('shrink-0 gap-1.5', statusBadge[cp.status])}>
                        <span className={cn('size-1.5 rounded-full', statusDot[cp.status])} />
                        {t(`status.${cp.status}`)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {t('dashboard.cpId')}: {cp.config.cpId}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      {t('dashboard.open')}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DashboardLayout>
      <ChargePointSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex items-center justify-between px-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <Icon className={cn('h-5 w-5 text-muted-foreground', tone)} />
      </CardContent>
    </Card>
  );
}

export default Dashboard;
