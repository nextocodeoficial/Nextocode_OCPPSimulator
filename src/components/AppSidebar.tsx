import { LogoMark } from '@/components/brand/Logo';
import { ChargePointSheet } from '@/components/ocpp/ChargePointSheet';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { getEffectiveDeviceSettings } from '@/features/ocpp/effectiveConfig';
import type { ConnectionStatus } from '@/features/ocpp/ocppSlice';
import { cn } from '@/lib/utils';
import type { RootState } from '@/store/store';
import { LayoutDashboard, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

const statusDot: Record<ConnectionStatus, string> = {
  connected: 'bg-emerald-500 shadow-[0_0_0_3px] shadow-emerald-500/20',
  connecting: 'bg-amber-400 animate-pulse',
  disconnected: 'bg-muted-foreground/40',
};

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [cpSheetOpen, setCpSheetOpen] = useState(false);
  const { items, order } = useSelector((s: RootState) => s.ocpp);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' tooltip={t('app.name')} onClick={() => navigate('/')} className='cursor-pointer'>
              <LogoMark className='size-8' />
              <div className='grid flex-1 text-left leading-tight'>
                <span className='truncate font-semibold tracking-tight'>{t('app.name')}</span>
                <span className='truncate text-xs text-muted-foreground'>{t('app.by')}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.pathname === '/'}
                tooltip={t('nav.dashboard')}
                onClick={() => navigate('/')}
                className='cursor-pointer'
              >
                <LayoutDashboard />
                <span>{t('nav.dashboard')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.chargePoints')}</SidebarGroupLabel>
          <SidebarGroupAction title={t('nav.add')} aria-label={t('nav.add')} onClick={() => setCpSheetOpen(true)}>
            <Plus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {order.length === 0 && (
                <p className='px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden'>
                  {t('nav.empty')}
                </p>
              )}
              {order.map((id) => {
                const cp = items[id];
                if (!cp) return null;
                return (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      isActive={location.pathname === `/cp/${id}`}
                      className='cursor-pointer'
                      onClick={() => navigate(`/cp/${id}`)}
                      tooltip={`${cp.label} · ${getEffectiveDeviceSettings(cp, id).deviceName} · ${t(`status.${cp.status}`)}`}
                    >
                      <span className='flex size-4 items-center justify-center'>
                        <span className={cn('size-2 rounded-full', statusDot[cp.status])} />
                      </span>
                      <span className='truncate'>{cp.label || id}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t('nav.newChargePoint')}
              className='cursor-pointer bg-gradient-to-r from-[#00f0ba] to-[#16009b] font-medium text-white hover:text-white hover:opacity-90 active:text-white'
              onClick={() => setCpSheetOpen(true)}
            >
              <Plus />
              <span>{t('nav.newChargePoint')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <ChargePointSheet open={cpSheetOpen} onOpenChange={setCpSheetOpen} />
    </Sidebar>
  );
}
