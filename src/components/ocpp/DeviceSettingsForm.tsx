// @ts-ignore
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { normalizeDeviceSettings } from '@/constants/chargePointDefaults';
import type { DeviceSettings } from '@/types/ocpp';
import { 
  Info, 
  Gauge, 
  Plug, 
  Settings
} from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface DeviceSettingsFormProps {
  deviceSettings: DeviceSettings;
  onSave: (settings: DeviceSettings) => void;
  onCancel: () => void;
}

const acdcOptions = ['AC', 'DC'] as const;
const socketTypeOptions = ['Type2', 'CCS', 'CHAdeMO', 'Type1'] as const;
const phaseRotationOptions = [
  'RST',
  'RTS',
  'STR',
  'SRT',
  'TRS',
  'TSR',
] as const;

export function DeviceSettingsForm({
  deviceSettings,
  onSave,
  onCancel,
}: DeviceSettingsFormProps) {
  const { t } = useTranslation();
  const form = useForm<DeviceSettings>({
    defaultValues: deviceSettings,
  });

  useEffect(() => {
    form.reset(deviceSettings);
  }, [deviceSettings, form]);

  const handleSubmit = form.handleSubmit((data) => {
    const numConnectors = data.connectors || 1;
    const socketTypeArray = Array.from({ length: numConnectors }, (_, i) => data.socketType?.[i] || data.socketType?.[0] || 'Type2');
    const cableLockArray = Array.from({ length: numConnectors }, (_, i) => data.cableLock?.[i] ?? data.cableLock?.[0] ?? true);
    const normalized = normalizeDeviceSettings({
      ...data,
      socketType: socketTypeArray,
      cableLock: cableLockArray,
    });
    onSave(normalized);
  });

  const acdc = form.watch('acdc');

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>{t('deviceSettings.basicTitle')}</CardTitle>
              <CardDescription>{t('deviceSettings.basicDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.deviceName')}</label>
              <Input
                {...form.register('deviceName', { required: true })}
                placeholder='Simulator-01'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.model')}</label>
              <Input
                {...form.register('model', { required: true })}
                placeholder='EVSE-Sim v1'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.acdcType')}</label>
              <Select
                value={form.watch('acdc')}
                onValueChange={(value) =>
                  form.setValue('acdc', value as 'AC' | 'DC')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {acdcOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.connectorCount')}</label>
              <Input
                type='number'
                min='1'
                max='10'
                {...form.register('connectors', { required: true, valueAsNumber: true })}
                placeholder='1'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Gauge className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>{t('deviceSettings.electricalTitle')}</CardTitle>
              <CardDescription>
                {t('deviceSettings.electricalDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.maxPower')}</label>
              <Input
                type='number'
                step='0.1'
                min='0'
                {...form.register('maxPowerKw', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.nominalVoltage')}</label>
              <Input
                type='number'
                min='0'
                {...form.register('nominalVoltageV', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.maxCurrent')}</label>
              <Input
                type='number'
                step='0.1'
                min='0'
                {...form.register('maxCurrentA', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                })}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.energy')}</label>
              <Input
                type='number'
                step='0.001'
                min='0'
                {...form.register('energyKwh', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.phaseRotation')}</label>
              <Select
                value={form.watch('phaseRotation')}
                onValueChange={(value) => form.setValue('phaseRotation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {phaseRotationOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.batteryStart')}</label>
              <Input
                type='number'
                min='0'
                max='100'
                {...form.register('batteryStartPercent', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                  max: 100,
                })}
              />
              <p className='text-xs text-muted-foreground'>
                {acdc === 'DC'
                  ? t('deviceSettings.batteryStartDc')
                  : t('deviceSettings.batteryStartAc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Plug className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>{t('deviceSettings.connectorTitle')}</CardTitle>
              <CardDescription>
                {t('deviceSettings.connectorDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-3 gap-4 items-center'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.connectorType')}</label>
              <Select
                value={form.watch('socketType.0')}
                onValueChange={(value) => form.setValue('socketType.0', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {socketTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='cableLock'
                checked={form.watch('cableLock.0')}
                onCheckedChange={(checked) =>
                  form.setValue('cableLock.0', !!checked)
                }
              />
              <label htmlFor='cableLock' className='text-sm font-medium'>
                {t('deviceSettings.cableLock')}
              </label>
            </div>
            <div className='text-sm text-muted-foreground'>
              {t('deviceSettings.singleConnectorNote')}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>{t('deviceSettings.featuresTitle')}</CardTitle>
              <CardDescription>
                {t('deviceSettings.featuresDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='hasRfid'
                checked={form.watch('hasRfid')}
                onCheckedChange={(checked) =>
                  form.setValue('hasRfid', !!checked)
                }
              />
              <label htmlFor='hasRfid' className='text-sm font-medium'>
                {t('deviceSettings.rfidReader')}
              </label>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='hasDisplay'
                checked={form.watch('hasDisplay')}
                onCheckedChange={(checked) =>
                  form.setValue('hasDisplay', !!checked)
                }
              />
              <label htmlFor='hasDisplay' className='text-sm font-medium'>
                {t('deviceSettings.display')}
              </label>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.timezone')}</label>
              <Input
                {...form.register('timezone', { required: true })}
                placeholder='Europe/Istanbul'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('deviceSettings.pricePerKwh')}</label>
              <Input
                type='number'
                step='0.01'
                min='0'
                {...form.register('pricePerKwh', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />
      <div className='flex justify-end gap-3 pt-4'>
        <Button type='button' variant='outline' onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type='submit' className="min-w-[140px]">
          {t('deviceSettings.save')}
        </Button>
      </div>
    </form>
  );
}
