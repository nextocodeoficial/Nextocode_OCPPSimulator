import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DEFAULT_CSMS_URL } from '@/config/env';
import { addChargePoint, setStatus } from '@/features/ocpp/ocppSlice';
import { connectWs } from '@/features/ocpp/wsManager';
import { buildOcppWebSocketUrl } from '@/utils/ocpp';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = {
  label?: string;
  csmsUrl: string;
  cpId: string;
  protocol: 'ocpp1.6' | 'ocpp2.0.1' | string;
};

export function ChargePointSheet({ open, onOpenChange }: Props) {
  const form = useForm<FormValues>({
    defaultValues: {
      label: '',
      csmsUrl: DEFAULT_CSMS_URL,
      cpId: '',
    },
  });
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    const action: any = dispatch(
      addChargePoint({
        label: values.label?.trim() || undefined,
        config: {
          csmsUrl: values.csmsUrl.trim(),
          cpId: values.cpId.trim(),
          protocol: 'ocpp1.6',
        },
      })
    );
    const id: string = action.payload.id;
    // Auto-connect immediately after creation (minimal UX)
    try {
      const url = buildOcppWebSocketUrl(values.csmsUrl.trim(), values.cpId.trim());
      dispatch(setStatus({ id, status: 'connecting' }));
      void connectWs(
        id,
        url,
        'ocpp1.6',
        qc,
        () => dispatch(setStatus({ id, status: 'connected' })),
        () => dispatch(setStatus({ id, status: 'disconnected' }))
      );
    } catch {
      // ignore invalid URL here
    }
    form.reset();
    onOpenChange(false);
    navigate(`/cp/${id}`);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right'>
        <SheetHeader>
          <SheetTitle>{t('newCp.title')}</SheetTitle>
          <SheetDescription>{t('newCp.description')}</SheetDescription>
        </SheetHeader>
        <form className='p-4 grid gap-3' onSubmit={onSubmit}>
          <div className='grid gap-1'>
            <label htmlFor='label' className='text-sm font-medium'>
              {t('newCp.name')}
            </label>
            <Input
              id='label'
              placeholder={t('newCp.namePlaceholder')}
              {...form.register('label')}
            />
          </div>
          <div className='grid gap-1'>
            <label htmlFor='csmsUrl' className='text-sm font-medium'>
              {t('newCp.csmsUrl')}
            </label>
            <Input
              id='csmsUrl'
              placeholder='wss://csms.example.com/ocpp'
              aria-invalid={!!errors.csmsUrl}
              {...form.register('csmsUrl', {
                required: t('newCp.required'),
                validate: (v) => /^wss?:\/\//i.test(v.trim()) || t('newCp.invalidUrl'),
              })}
            />
            <p className={errors.csmsUrl ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
              {errors.csmsUrl?.message || t('newCp.csmsUrlHint')}
            </p>
          </div>
          <div className='grid gap-1'>
            <label htmlFor='cpId' className='text-sm font-medium'>
              {t('newCp.cpId')}
            </label>
            <Input
              id='cpId'
              placeholder='SIM_001'
              aria-invalid={!!errors.cpId}
              {...form.register('cpId', { required: t('newCp.required') })}
            />
            {errors.cpId && <p className='text-xs text-destructive'>{errors.cpId.message}</p>}
          </div>
          <div className='pt-2 flex justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => onOpenChange(false)}
            >
              {t('newCp.cancel')}
            </Button>
            <Button type='submit'>{t('newCp.create')}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
