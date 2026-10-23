// @ts-nocheck
import ChargingStatusDisplay from '@/components/ChargingStatusDisplay';
import ControlsPanel from '@/components/ControlsPanel';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChargePointAdvancedConfigSheet } from '@/components/ocpp/ChargePointAdvancedConfigSheet';
import { ChargePointConfigSheet } from '@/components/ocpp/ChargePointConfigSheet';
import { NetworkTraffic } from '@/components/ocpp/NetworkTraffic';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFrames, useOcppConnection } from '@/features/ocpp/hooks';
import { removeChargePoint, setPaused } from '@/features/ocpp/ocppSlice';
import { getEffectiveDeviceSettings } from '@/features/ocpp/effectiveConfig';
import { saveFrames } from '@/features/ocpp/storage';
import { disconnectWs } from '@/features/ocpp/wsManager';
import { useChargingStatus } from '@/hooks/useChargingStatus';
import type { RootState } from '@/store/store';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

export default function ChargePointConnection() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const cp = useSelector((s: RootState) => (id ? s.ocpp.items[id] : undefined));
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [configOpen, setConfigOpen] = useState(false);
  const [advancedConfigOpen, setAdvancedConfigOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { connect, disconnect } = useOcppConnection(cp);

  // Frames for NetworkTraffic
  const framesQuery = useFrames(cp?.id || id || '');
  const frames = useMemo(() => framesQuery.data || [], [framesQuery.data]);
  const charging = useChargingStatus(cp?.id || id || '');

  const deviceSettings = getEffectiveDeviceSettings(cp, cp?.id || id || '');

  // Auto-connect once per charge point when landing here disconnected.
  // A 'connecting' charger already has a socket; opening another one with the
  // same identity makes the CSMS reject it as a duplicate.
  const autoconnectedId = useRef<string | null>(null);
  useEffect(() => {
    if (!cp) return;
    if (autoconnectedId.current !== cp.id && cp.status === 'disconnected') {
      autoconnectedId.current = cp.id;
      connect.mutate({});
    }
  }, [cp, connect]);

  if (!cp) {
    return (
      <DashboardLayout>
        <div className='p-4 sm:p-6'>
          <div className='text-base sm:text-lg font-semibold'>
            {t('cp.notFoundTitle')}
          </div>
          <div className='mt-2 text-xs sm:text-sm text-muted-foreground break-words'>
            {t('cp.notFoundBody', { id })}
          </div>
          <div className='mt-4'>
            <Button
              size='sm'
              onClick={() => navigate('/')}
              className='w-full sm:w-auto'
            >
              {t('cp.backToDashboard')}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const onTogglePause = () =>
    dispatch(setPaused({ id: cp.id, paused: !cp.paused }));
  const onCopy = async () => {
    const text = JSON.stringify(frames, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {}
      document.body.removeChild(ta);
    }
  };
  const onClear = () => {
    saveFrames(cp.id, []);
    queryClient.setQueryData(['frames', cp.id], []);
  };

  const onDelete = () => {
    setDeleteOpen(false);
    try {
      disconnectWs(cp.id);
    } catch {}
    saveFrames(cp.id, []);
    queryClient.setQueryData(['frames', cp.id], []);
    dispatch(removeChargePoint(cp.id));
    navigate('/');
  };

  return (
    <>
      <SEO
        title={t('cp.seoTitle', { name: cp?.label || id })}
        description={t('cp.seoDescription', { name: cp?.label || id })}
        keywords={t('cp.seoKeywords', { name: cp?.label || id })}
      />
      <DashboardLayout breadcrumbItems={[{ label: cp.label }]}>
        <div className='grid gap-4'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex-1 min-w-0'>
              <div className='text-base sm:text-lg font-semibold truncate'>
                {cp.label}
              </div>
              <div className='mt-1 text-xs text-muted-foreground break-words'>
                <span className='hidden sm:inline'>
                  CSMS: {cp.config.csmsUrl} •{' '}
                </span>
                <span className='sm:hidden'>CSMS: </span>
                <span className='sm:hidden break-all'>{cp.config.csmsUrl}</span>
                <span className='sm:hidden block mt-1'>
                  CP: {cp.config.cpId} • {cp.config.protocol}
                </span>
                <span className='hidden sm:inline'>
                  CP: {cp.config.cpId} • {cp.config.protocol}
                </span>
              </div>
              <div className='mt-2 inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs'>
                <span
                  className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                    cp.status === 'connected'
                      ? 'bg-green-500'
                      : cp.status === 'connecting'
                      ? 'bg-yellow-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span>{t(`status.${cp.status}`)}</span>
              </div>
            </div>
            <div className='flex items-center gap-2 sm:shrink-0'>
              <div className='hidden sm:flex items-center gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setConfigOpen(true)}
                  className='text-xs sm:text-sm'
                >
                  {t('cp.basicConfig')}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setAdvancedConfigOpen(true)}
                  className='text-xs sm:text-sm'
                >
                  {t('cp.advancedConfig')}
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={() => setDeleteOpen(true)}
                  className='text-xs sm:text-sm'
                >
                  {t('common.delete')}
                </Button>
              </div>
              <div className='flex items-center gap-2 sm:border-l sm:pl-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => connect.mutate({})}
                  disabled={cp.status !== 'disconnected' || connect.isPending}
                  className='text-xs sm:text-sm'
                >
                  {connect.isPending || cp.status === 'connecting' ? (
                    t('cp.connecting')
                  ) : (
                    t('cp.connect')
                  )}
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => disconnect.mutate()}
                  disabled={cp.status === 'disconnected' || disconnect.isPending}
                  className='text-xs sm:text-sm'
                >
                  {t('cp.disconnect')}
                </Button>
              </div>
              <div className='flex sm:hidden items-center gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setConfigOpen(true)}
                  className='text-xs'
                >
                  {t('cp.basicShort')}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setAdvancedConfigOpen(true)}
                  className='text-xs'
                >
                  {t('cp.advancedShort')}
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={() => setDeleteOpen(true)}
                  className='text-xs'
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </div>

          {/* Charging status above actions */}
          <ChargingStatusDisplay
            chargingData={charging.chargingData}
            isCharging={charging.isCharging}
            chargingType={deviceSettings.acdc || 'AC'}
            connectors={cp.runtime?.connectors}
            deviceSettings={deviceSettings}
          />

          {/* Controls */}
          <ControlsPanel cp={cp} deviceSettings={deviceSettings} />

          {/* Network traffic minimal view */}
          <NetworkTraffic
            frames={frames}
            paused={cp.paused}
            onTogglePause={onTogglePause}
            onCopy={onCopy}
            onClear={onClear}
          />
        </div>
        <ChargePointConfigSheet
          chargePoint={cp}
          open={configOpen}
          onOpenChange={(next) => setConfigOpen(next)}
        />
        <ChargePointAdvancedConfigSheet
          chargePoint={cp}
          open={advancedConfigOpen}
          onOpenChange={(next) => setAdvancedConfigOpen(next)}
        />
        <Dialog open={deleteOpen} onOpenChange={(next) => setDeleteOpen(next)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('cp.deleteTitle')}</DialogTitle>
              <DialogDescription>
                {t('cp.deleteDescription', { label: cp.label })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  {t('common.cancel')}
                </Button>
              </DialogClose>
              <Button type='button' variant='destructive' onClick={onDelete}>
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
