import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useOcppConnection } from '@/features/ocpp/hooks';
import type { ChargePoint } from '@/features/ocpp/ocppSlice';
import { setConnectorId, setTransactionId, updateConnectorStatus } from '@/features/ocpp/ocppSlice';
import { parseStartTransactionResult } from '@/features/ocpp/transaction';
import { useBatteryState } from '@/hooks/useBatteryState';
import { showToast } from '@/lib/toast';
import type { Connector } from '@/types/ocpp';
import { getMeterForCp } from '@/services/meterModel';
import { Plug, Power, Activity, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

type PanelForm = {
  vendor: string;
  model: string;
};

interface ControlsPanelProps {
  cp: ChargePoint;
  deviceSettings?: {
    connectors?: number;
    socketType?: string[];
    deviceName?: string;
  };
}

export const ControlsPanel = ({ cp, deviceSettings }: ControlsPanelProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { call } = useOcppConnection(cp);
  const connected = cp.status === 'connected';
  const { beginCharge, endCharge, setMeterStart } = useBatteryState();
  const numConnectors = deviceSettings?.connectors || 1;
  const [selectedConnectorId, setSelectedConnectorId] = useState(cp.runtime?.activeConnectorId || 1);

  const form = useForm<PanelForm>({
    defaultValues: {
      vendor: 'EVS-Sim',
      model: deviceSettings?.deviceName || 'Browser-CP',
    },
  });

  useEffect(() => {
    if (selectedConnectorId > numConnectors) {
      setSelectedConnectorId(1);
    }
  }, [numConnectors, selectedConnectorId]);

  useEffect(() => {
    form.reset({
      vendor: 'EVS-Sim',
      model: deviceSettings?.deviceName || 'Browser-CP',
    });
  }, [deviceSettings?.deviceName, form]);

  const connectorId = selectedConnectorId;

  // Keep the store in sync so remote commands and MeterValues target the connector shown here.
  useEffect(() => {
    if (cp.runtime?.activeConnectorId !== selectedConnectorId) {
      dispatch(setConnectorId({ id: cp.id, connectorId: selectedConnectorId }));
    }
  }, [cp.id, cp.runtime?.activeConnectorId, selectedConnectorId, dispatch]);

  /**
   * Envía StatusNotification al conector seleccionado y al conector 0 (todo el punto de carga).
   * Muchos CS/back-office solo persisten `chargePoint.status` cuando connectorId === 0.
   */
  const emitDualStatusNotification = async (status: Connector['status']) => {
    await call.mutateAsync({
      action: 'StatusNotification',
      payload: {
        connectorId,
        status,
        errorCode: 'NoError',
      },
    });
    await call.mutateAsync({
      action: 'StatusNotification',
      payload: {
        connectorId: 0,
        status,
        errorCode: 'NoError',
      },
    });
    dispatch(updateConnectorStatus({ id: cp.id, connectorId, status }));
  };

  const onBoot = () => {
    const v = form.getValues();
    call.mutate({
      action: 'BootNotification',
      payload: {
        chargePointVendor: v.vendor || 'EVS-Sim',
        chargePointModel: v.model || 'Browser-CP',
      },
    });
  };

  const onHeartbeat = () => {
    call.mutate({ action: 'Heartbeat', payload: {} });
  };

  const onAvailable = async () => {
    try {
      await emitDualStatusNotification('Available');
    } catch {
      showToast.error(t('controls.sendFailed', { status: 'Available' }), 'StatusNotification');
    }
  };

  const onPreparing = async () => {
    if (cp.runtime?.connectors?.find(c => c.id === connectorId)?.transactionId != null) {
      showToast.warning(t('controls.activeTransaction'), 'Preparing');
      return;
    }
    try {
      await emitDualStatusNotification('Preparing');
      showToast.success(t('controls.cablePlugged'), 'Preparing');
    } catch {
      showToast.error(t('controls.sendFailed', { status: 'Preparing' }), 'StatusNotification');
    }
  };

  const onAuthorize = () => {
    call.mutate({
      action: 'Authorize',
      payload: { idTag: cp.runtime?.connectors?.find(c => c.id === connectorId)?.idTag || 'DEMO1234' },
    });
  };

  const onStartTx = async () => {
    const conn = cp.runtime?.connectors?.find(c => c.id === connectorId);
    if (conn?.status !== 'Preparing') {
      showToast.error(
        t('controls.stateRequiredBody'),
        t('controls.stateRequiredTitle')
      );
      return;
    }
    const meterStart = Math.floor(1000 + Math.random() * 1000);
    try {
      await call.mutateAsync({
        action: 'Authorize',
        payload: { idTag: cp.runtime?.connectors?.find(c => c.id === connectorId)?.idTag || 'DEMO1234' },
      });
    } catch {}
    const res = await call.mutateAsync({
      action: 'StartTransaction',
      payload: {
        connectorId,
        idTag: cp.runtime?.connectors?.find(c => c.id === connectorId)?.idTag || 'DEMO1234',
        meterStart,
        timestamp: new Date().toISOString(),
      },
    });
    const result = parseStartTransactionResult(res);
    if (!result.accepted) {
      showToast.error(
        t('controls.txRejectedBody', { status: result.status }),
        t('controls.txRejectedTitle')
      );
      return;
    }
    dispatch(setTransactionId({ id: cp.id, connectorId, transactionId: result.transactionId }));
    await emitDualStatusNotification('Charging');
    // begin local battery simulation and periodic MeterValues pushes
    setMeterStart(meterStart);
    beginCharge(() => {
      onMeterValues();
    });
  };

  const onMeterValues = () => {
    const meter = getMeterForCp(cp.id);
    meter?.tick().catch(() => {});
  };

  const onStopTx = async () => {
    const tx = cp.runtime?.connectors?.find(c => c.id === connectorId)?.transactionId ?? 0;
    let meterStop = 0;
    try {
      const m = getMeterForCp(cp.id);
      await m?.tick();
      const st = m?.getState(connectorId);
      meterStop = Math.floor(Math.max(0, Number(st?.energyWh || 0)));
    } catch {}
    await call.mutateAsync({
      action: 'StopTransaction',
      payload: {
        transactionId: tx,
        idTag: cp.runtime?.connectors?.find(c => c.id === connectorId)?.idTag || 'DEMO1234',
        meterStop,
        timestamp: new Date().toISOString(),
        reason: 'Local',
      },
    });
    dispatch(setTransactionId({ id: cp.id, connectorId, transactionId: undefined }));
    try {
      await emitDualStatusNotification('Finishing');
      await new Promise(r => setTimeout(r, 250));
      await emitDualStatusNotification('Available');
    } catch {
      await emitDualStatusNotification('Available');
    }
    endCharge();
  };

  const onUnlockCable = async () => {
    try {
      await emitDualStatusNotification('Available');
    } catch {
      /* ignore */
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Plug className='h-5 w-5' />
          {t('controls.title')}
          {deviceSettings?.deviceName && (
            <Badge variant='outline' className='ml-auto'>
              {deviceSettings.deviceName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3'>
          <span className='font-medium text-sm'>{t('controls.connector')}</span>
          <Select value={selectedConnectorId.toString()} onValueChange={(value) => setSelectedConnectorId(Number(value))}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: numConnectors }, (_, i) => i + 1).map(id => (
                <SelectItem key={id} value={id.toString()}>
                  {id} - {deviceSettings?.socketType?.[id - 1] || 'Type2'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-4'>
          <div className='space-y-2.5'>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              <Activity className='h-3.5 w-3.5' />
              {t('controls.connectionStatus')}
            </div>
            <p className='text-[11px] text-muted-foreground leading-snug'>
              <Trans i18nKey='controls.connectionHint' components={{ strong: <strong /> }} />
            </p>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2'>
              <Button 
                size='sm' 
                onClick={onBoot} 
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                BootNotification
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={onHeartbeat}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                Heartbeat
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => void onAvailable()}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                Available
              </Button>
              <Button
                size='sm'
                variant='secondary'
                onClick={() => void onPreparing()}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                {t('controls.preparingBtn')}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={onAuthorize}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                Authorize
              </Button>
            </div>
          </div>

          <Separator />

          <div className='space-y-2.5'>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              <Power className='h-3.5 w-3.5' />
              {t('controls.transaction')}
            </div>
            <p className='text-[11px] text-muted-foreground leading-snug'>
              <Trans i18nKey='controls.transactionHint' components={{ strong: <strong /> }} />
            </p>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
              <Button
                size='sm'
                variant='secondary'
                onClick={onStartTx}
                disabled={
                  !connected ||
                  cp.runtime?.connectors?.find(c => c.id === connectorId)?.transactionId != null ||
                  cp.runtime?.connectors?.find(c => c.id === connectorId)?.status !== 'Preparing'
                }
                className='h-9 text-xs sm:text-sm'
              >
                StartTx
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={onMeterValues}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                MeterValues
              </Button>
              <Button
                size='sm'
                variant='destructive'
                onClick={onStopTx}
                disabled={
                  !connected || cp.runtime?.connectors?.find(c => c.id === connectorId)?.transactionId == null
                }
                className='h-9 text-xs sm:text-sm'
              >
                StopTx
              </Button>
            </div>
          </div>

          <Separator />

          <div className='space-y-2.5'>
            <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              <Lock className='h-3.5 w-3.5' />
              {t('controls.connectorControl')}
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md'>
              <Button
                size='sm'
                variant='secondary'
                onClick={onUnlockCable}
                disabled={!connected}
                className='h-9 text-xs sm:text-sm'
              >
                {t('controls.unlockCable')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlsPanel;
