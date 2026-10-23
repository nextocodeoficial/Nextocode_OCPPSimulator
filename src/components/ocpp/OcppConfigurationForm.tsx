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
import { Separator } from '@/components/ui/separator';
import type { OcppConfiguration } from '@/types/ocpp';
import { 
  Wifi, 
  Gauge, 
  CreditCard, 
  Shield, 
  Settings, 
  Monitor,
  Plug,
  Plus,
  X
} from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface OcppConfigurationFormProps {
  ocppConfig: OcppConfiguration;
  onSave: (config: OcppConfiguration) => void;
  onCancel: () => void;
}

export function OcppConfigurationForm({
  ocppConfig,
  onSave,
  onCancel,
}: OcppConfigurationFormProps) {
  const { t } = useTranslation();
  const form = useForm<OcppConfiguration>({
    defaultValues: ocppConfig,
  });

  const {
    fields: whitelistFields,
    append: appendWhitelist,
    remove: removeWhitelist,
  } = useFieldArray({
    control: form.control,
    // IdTagWhitelist is a string[]; RHF field arrays only type object arrays.
    name: 'IdTagWhitelist' as never,
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (!Array.isArray(data.Availability) || data.Availability.length === 0) {
      data.Availability = ['Operative'];
    } else {
      data.Availability = [data.Availability[0] || 'Operative'];
    }
    data.NumberOfConnectors = 1;
    onSave(data);
  });

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Wifi className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>{t('ocppConfig.connectionTitle')}</CardTitle>
              <CardDescription>
                {t('ocppConfig.connectionDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {t('ocppConfig.heartbeatInterval')}
              </label>
              <Input
                type='number'
                min='10'
                max='3600'
                {...form.register('HeartbeatInterval', {
                  required: true,
                  valueAsNumber: true,
                  min: 10,
                  max: 3600,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {t('ocppConfig.connectionTimeout')}
              </label>
              <Input
                type='number'
                min='30'
                max='600'
                {...form.register('ConnectionTimeOut', {
                  required: true,
                  valueAsNumber: true,
                  min: 30,
                  max: 600,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {t('ocppConfig.bootInterval')}
              </label>
              <Input
                type='number'
                min='30'
                max='3600'
                {...form.register('BootNotification.intervalHint', {
                  required: true,
                  valueAsNumber: true,
                  min: 30,
                  max: 3600,
                })}
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
              <CardTitle>{t('ocppConfig.metersTitle')}</CardTitle>
              <CardDescription>
                {t('ocppConfig.metersDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('ocppConfig.sampleInterval')}</label>
              <Input
                type='number'
                min='5'
                max='900'
                {...form.register('MeterValueSampleInterval', {
                  required: true,
                  valueAsNumber: true,
                  min: 5,
                  max: 900,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {t('ocppConfig.clockAlignedInterval')}
              </label>
              <Input
                type='number'
                min='60'
                max='3600'
                {...form.register('ClockAlignedDataInterval', {
                  required: true,
                  valueAsNumber: true,
                  min: 60,
                  max: 3600,
                })}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('ocppConfig.sampledData')}</label>
            <Input
              {...form.register('MeterValuesSampledData', { required: true })}
              placeholder='Energy.Active.Import.Register,Voltage,Current'
            />
            <p className='text-xs text-muted-foreground'>
              {t('ocppConfig.sampledDataHint')}
            </p>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('ocppConfig.alignedData')}</label>
            <Input
              {...form.register('MeterValuesAlignedData', { required: true })}
              placeholder='Energy.Active.Import.Register'
            />
            <p className='text-xs text-muted-foreground'>
              {t('ocppConfig.alignedDataHint')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>{t('ocppConfig.txTitle')}</CardTitle>
              <CardDescription>
                {t('ocppConfig.txDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('ocppConfig.messageAttempts')}</label>
              <Input
                type='number'
                min='1'
                max='10'
                {...form.register('TransactionMessageAttempts', {
                  required: true,
                  valueAsNumber: true,
                  min: 1,
                  max: 10,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('ocppConfig.retryInterval')}</label>
              <Input
                type='number'
                min='1'
                max='300'
                {...form.register('TransactionMessageRetryInterval', {
                  required: true,
                  valueAsNumber: true,
                  min: 1,
                  max: 300,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {t('ocppConfig.maxEnergyInvalid')}
              </label>
              <Input
                type='number'
                min='0'
                {...form.register('MaxEnergyOnInvalidId', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                })}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('ocppConfig.stopTxData')}</label>
            <Input
              {...form.register('StopTxnSampledData', { required: true })}
              placeholder='Power.Active.Import,Voltage'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              {t('ocppConfig.stopTxAligned')}
            </label>
            <Input
              {...form.register('StopTxnAlignedData', { required: true })}
              placeholder='Energy.Active.Import.Register'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='StopTransactionOnEVSideDisconnect'
                checked={form.watch('StopTransactionOnEVSideDisconnect')}
                onCheckedChange={(checked) =>
                  form.setValue('StopTransactionOnEVSideDisconnect', !!checked)
                }
              />
              <label
                htmlFor='StopTransactionOnEVSideDisconnect'
                className='text-sm font-medium'
              >
                {t('ocppConfig.stopOnEvDisconnect')}
              </label>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='StopTransactionOnInvalidId'
                checked={form.watch('StopTransactionOnInvalidId')}
                onCheckedChange={(checked) =>
                  form.setValue('StopTransactionOnInvalidId', !!checked)
                }
              />
              <label
                htmlFor='StopTransactionOnInvalidId'
                className='text-sm font-medium'
              >
                {t('ocppConfig.stopOnInvalidId')}
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>{t('ocppConfig.authTitle')}</CardTitle>
              <CardDescription>
                {t('ocppConfig.authDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='AuthorizeRemoteTxRequests'
                checked={form.watch('AuthorizeRemoteTxRequests')}
                onCheckedChange={(checked) =>
                  form.setValue('AuthorizeRemoteTxRequests', !!checked)
                }
              />
              <label
                htmlFor='AuthorizeRemoteTxRequests'
                className='text-sm font-medium'
              >
                {t('ocppConfig.authorizeRemote')}
              </label>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='LocalAuthorizeOffline'
                checked={form.watch('LocalAuthorizeOffline')}
                onCheckedChange={(checked) =>
                  form.setValue('LocalAuthorizeOffline', !!checked)
                }
              />
              <label
                htmlFor='LocalAuthorizeOffline'
                className='text-sm font-medium'
              >
                {t('ocppConfig.localAuthOffline')}
              </label>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='LocalPreAuthorize'
                checked={form.watch('LocalPreAuthorize')}
                onCheckedChange={(checked) =>
                  form.setValue('LocalPreAuthorize', !!checked)
                }
              />
              <label
                htmlFor='LocalPreAuthorize'
                className='text-sm font-medium'
              >
                {t('ocppConfig.localPreAuth')}
              </label>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='AuthorizationCacheEnabled'
                checked={form.watch('AuthorizationCacheEnabled')}
                onCheckedChange={(checked) =>
                  form.setValue('AuthorizationCacheEnabled', !!checked)
                }
              />
              <label
                htmlFor='AuthorizationCacheEnabled'
                className='text-sm font-medium'
              >
                {t('ocppConfig.authCache')}
              </label>
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='AllowOfflineTxForUnknownId'
              checked={form.watch('AllowOfflineTxForUnknownId')}
              onCheckedChange={(checked) =>
                form.setValue('AllowOfflineTxForUnknownId', !!checked)
              }
            />
            <label
              htmlFor='AllowOfflineTxForUnknownId'
              className='text-sm font-medium'
            >
              {t('ocppConfig.allowOfflineUnknown')}
            </label>
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
              <CardTitle>{t('ocppConfig.systemTitle')}</CardTitle>
              <CardDescription>
                {t('ocppConfig.systemDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {t('ocppConfig.numConnectors')}
              </label>
              <Input value='1' disabled />
              <input
                type='hidden'
                defaultValue={1}
                {...form.register('NumberOfConnectors', {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {t('ocppConfig.minStatusDuration')}
              </label>
              <Input
                type='number'
                min='0'
                max='300'
                {...form.register('MinimumStatusDuration', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                  max: 300,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('ocppConfig.getConfigMaxKeys')}</label>
              <Input
                type='number'
                min='10'
                max='100'
                {...form.register('GetConfigurationMaxKeys', {
                  required: true,
                  valueAsNumber: true,
                  min: 10,
                  max: 100,
                })}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              {t('ocppConfig.featureProfiles')}
            </label>
            <Input
              {...form.register('SupportedFeatureProfiles', { required: true })}
              placeholder='Core,RemoteTrigger,Firmware,Reservation,LocalAuthList,MeterValues'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              {t('ocppConfig.connectorPhaseRotation')}
            </label>
            <Input
              {...form.register('ConnectorPhaseRotation', { required: true })}
              placeholder='1.RST,2.RST'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('ocppConfig.firmwareVersion')}</label>
            <Input
              {...form.register('FirmwareVersion', { required: true })}
              placeholder='1.0.0-web'
            />
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='UnlockConnectorOnEVSideDisconnect'
                checked={form.watch('UnlockConnectorOnEVSideDisconnect')}
                onCheckedChange={(checked) =>
                  form.setValue('UnlockConnectorOnEVSideDisconnect', !!checked)
                }
              />
              <label
                htmlFor='UnlockConnectorOnEVSideDisconnect'
                className='text-sm font-medium'
              >
                {t('ocppConfig.unlockOnEvDisconnect')}
              </label>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='ChargeProfileEnabled'
                checked={form.watch('ChargeProfileEnabled')}
                onCheckedChange={(checked) =>
                  form.setValue('ChargeProfileEnabled', !!checked)
                }
              />
              <label
                htmlFor='ChargeProfileEnabled'
                className='text-sm font-medium'
              >
                {t('ocppConfig.chargeProfile')}
              </label>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='ReservationEnabled'
                checked={form.watch('ReservationEnabled')}
                onCheckedChange={(checked) =>
                  form.setValue('ReservationEnabled', !!checked)
                }
              />
              <label
                htmlFor='ReservationEnabled'
                className='text-sm font-medium'
              >
                {t('ocppConfig.reservation')}
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Monitor className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>{t('ocppConfig.displayTitle')}</CardTitle>
              <CardDescription>{t('ocppConfig.displayDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('ocppConfig.blinkRepeat')}</label>
              <Input
                type='number'
                min='1'
                max='10'
                {...form.register('BlinkRepeat', {
                  required: true,
                  valueAsNumber: true,
                  min: 1,
                  max: 10,
                })}
              />
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('ocppConfig.lightIntensity')}</label>
              <Input
                type='number'
                min='0'
                max='100'
                {...form.register('LightIntensity', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                  max: 100,
                })}
              />
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
              <CardTitle>{t('ocppConfig.availabilityTitle')}</CardTitle>
              <CardDescription>
                {t('ocppConfig.availabilityDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              {t('ocppConfig.connectorAvailability')}
            </label>
            <div className='flex items-center space-x-2'>
              <span className='text-sm'>{t('ocppConfig.connectorN', { id: 1 })}</span>
              <Input
                {...form.register('Availability.0')}
                placeholder='Operative'
                className='w-32'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium'>{t('ocppConfig.authorizedTags')}</label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => appendWhitelist('')}
                className="gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('ocppConfig.addTag')}
              </Button>
            </div>
            <div className="space-y-2">
              {whitelistFields.map((field, index) => (
                <div key={field.id} className='flex items-center gap-2'>
                  <Input
                    {...form.register(`IdTagWhitelist.${index}` as const)}
                    placeholder='04A1B23C'
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => removeWhitelist(index)}
                    className="gap-2"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t('common.remove')}
                  </Button>
                </div>
              ))}
              {whitelistFields.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  {t('ocppConfig.noTags', { action: t('ocppConfig.addTag') })}
                </p>
              )}
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='WsSecure'
              checked={form.watch('WsSecure')}
              onCheckedChange={(checked) =>
                form.setValue('WsSecure', !!checked)
              }
            />
            <label htmlFor='WsSecure' className='text-sm font-medium'>
              WebSocket Secure (WSS)
            </label>
          </div>
        </CardContent>
      </Card>

      <Separator />
      <div className='flex justify-end gap-3 pt-4'>
        <Button type='button' variant='outline' onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type='submit' className="min-w-[180px]">
          {t('ocppConfig.save')}
        </Button>
      </div>
    </form>
  );
}
